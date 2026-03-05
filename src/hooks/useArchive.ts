/**
 * useArchive - React hook for accessing ArchiveManager
 */

import { useState, useEffect, useCallback } from 'react';
import archiveManager from '../services/ArchiveManager';
import {
  Archive,
  ArchiveStatus,
  ArchiveFormat,
  ArchiveQuality,
  ArchiveStorageType,
  ArchiveCategory,
  ArchiveSearchFilters,
  ArchiveSortOption,
  ArchiveStatistics,
  ArchiveExportOptions,
  ArchiveImportOptions,
  ArchiveBatchOperation,
  ArchiveEvent,
  ArchiveEventType,
  ArchiveRecordingConfig,
  ArchiveStorageConfig,
  ArchiveAutoDeleteConfig,
} from '../types/archive';

// ============================================================================
// HOOK INTERFACE
// ============================================================================

interface UseArchiveReturn {
  // State
  archives: Archive[];
  currentRecording: Archive | null;
  statistics: ArchiveStatistics;
  isRecording: boolean;
  recordingConfig: ArchiveRecordingConfig;
  storageConfig: ArchiveStorageConfig;
  autoDeleteConfig: ArchiveAutoDeleteConfig;
  
  // Archive CRUD
  getArchiveById: (id: string) => Archive | undefined;
  createArchive: (archive: Omit<Archive, 'id' | 'createdAt'>) => Archive;
  updateArchive: (id: string, updates: Partial<Archive>) => Archive | null;
  deleteArchive: (id: string) => boolean;
  
  // Recording
  startRecording: (streamInfo: Archive['streamInfo']) => Archive;
  stopRecording: () => Archive | null;
  
  // Search and Filter
  searchArchives: (filters: ArchiveSearchFilters) => Archive[];
  sortArchives: (archives: Archive[], sortBy: ArchiveSortOption) => Archive[];
  
  // Batch Operations
  executeBatchOperation: (operation: ArchiveBatchOperation) => Promise<void>;
  
  // Export/Import
  exportArchives: (archiveIds: string[], options: ArchiveExportOptions) => Promise<string>;
  importArchives: (options: ArchiveImportOptions) => Promise<Archive[]>;
  
  // Upload/Download
  uploadArchive: (id: string) => Promise<void>;
  downloadArchive: (id: string) => Promise<void>;
  compressArchive: (id: string) => Promise<void>;
  
  // Favorites and Protection
  toggleFavorite: (id: string) => boolean;
  toggleProtection: (id: string) => boolean;
  
  // Tags
  addTag: (id: string, tag: string) => boolean;
  removeTag: (id: string, tag: string) => boolean;
  getAllTags: () => string[];
  
  // Settings
  updateRecordingConfig: (config: Partial<ArchiveRecordingConfig>) => void;
  updateStorageConfig: (config: Partial<ArchiveStorageConfig>) => void;
  updateAutoDeleteConfig: (config: Partial<ArchiveAutoDeleteConfig>) => void;
  executeAutoDelete: () => number;
  
  // Events
  onArchiveEvent: (callback: (event: ArchiveEvent) => void) => void;
  offArchiveEvent: (callback: (event: ArchiveEvent) => void) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useArchive(): UseArchiveReturn {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [currentRecording, setCurrentRecording] = useState<Archive | null>(null);
  const [statistics, setStatistics] = useState<ArchiveStatistics>(() => 
    archiveManager.getStatistics()
  );
  const [recordingConfig, setRecordingConfig] = useState<ArchiveRecordingConfig>(() =>
    archiveManager.getRecordingConfig()
  );
  const [storageConfig, setStorageConfig] = useState<ArchiveStorageConfig>(() =>
    archiveManager.getStorageConfig()
  );
  const [autoDeleteConfig, setAutoDeleteConfig] = useState<ArchiveAutoDeleteConfig>(() =>
    archiveManager.getAutoDeleteConfig()
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Initial load
    setArchives(archiveManager.getAllArchives());
    setCurrentRecording(archiveManager.getCurrentRecording());

    // Subscribe to events
    const handleArchiveEvent = (event: ArchiveEvent) => {
      switch (event.type) {
        case ArchiveEventType.ARCHIVE_CREATED:
        case ArchiveEventType.ARCHIVE_UPDATED:
        case ArchiveEventType.ARCHIVE_DELETED:
          setArchives(archiveManager.getAllArchives());
          setStatistics(archiveManager.getStatistics());
          break;
        case ArchiveEventType.RECORDING_STARTED:
          setCurrentRecording(archiveManager.getCurrentRecording());
          break;
        case ArchiveEventType.RECORDING_STOPPED:
          setCurrentRecording(null);
          setArchives(archiveManager.getAllArchives());
          break;
        case ArchiveEventType.PROCESSING_COMPLETED:
          setArchives(archiveManager.getAllArchives());
          break;
        case ArchiveEventType.STORAGE_WARNING:
        case ArchiveEventType.STORAGE_FULL:
          setStatistics(archiveManager.getStatistics());
          break;
      }
    };

    archiveManager.onArchiveEvent(handleArchiveEvent);

    // Update interval for recording progress
    const updateInterval = setInterval(() => {
      if (archiveManager.isRecording()) {
        setCurrentRecording(archiveManager.getCurrentRecording());
      }
    }, 1000);

    return () => {
      archiveManager.offArchiveEvent(handleArchiveEvent);
      clearInterval(updateInterval);
    };
  }, []);

  // ============================================================================
  // ARCHIVE CRUD
  // ============================================================================

  const getArchiveById = useCallback((id: string): Archive | undefined => {
    return archiveManager.getArchiveById(id);
  }, []);

  const createArchive = useCallback((archive: Omit<Archive, 'id' | 'createdAt'>): Archive => {
    const newArchive = archiveManager.createArchive(archive);
    setArchives(archiveManager.getAllArchives());
    return newArchive;
  }, []);

  const updateArchive = useCallback((id: string, updates: Partial<Archive>): Archive | null => {
    const result = archiveManager.updateArchive(id, updates);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  const deleteArchive = useCallback((id: string): boolean => {
    const result = archiveManager.deleteArchive(id);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  // ============================================================================
  // RECORDING
  // ============================================================================

  const startRecording = useCallback((streamInfo: Archive['streamInfo']): Archive => {
    const archive = archiveManager.startRecording(streamInfo);
    setCurrentRecording(archive);
    return archive;
  }, []);

  const stopRecording = useCallback((): Archive | null => {
    const result = archiveManager.stopRecording();
    setCurrentRecording(null);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  // ============================================================================
  // SEARCH AND FILTER
  // ============================================================================

  const searchArchives = useCallback((filters: ArchiveSearchFilters): Archive[] => {
    return archiveManager.searchArchives(filters);
  }, []);

  const sortArchives = useCallback((archives: Archive[], sortBy: ArchiveSortOption): Archive[] => {
    return archiveManager.sortArchives(archives, sortBy);
  }, []);

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  const executeBatchOperation = useCallback(async (operation: ArchiveBatchOperation): Promise<void> => {
    await archiveManager.executeBatchOperation(operation);
    setArchives(archiveManager.getAllArchives());
  }, []);

  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================

  const exportArchives = useCallback(async (archiveIds: string[], options: ArchiveExportOptions): Promise<string> => {
    return await archiveManager.exportArchives(archiveIds, options);
  }, []);

  const importArchives = useCallback(async (options: ArchiveImportOptions): Promise<Archive[]> => {
    const result = await archiveManager.importArchives(options);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  // ============================================================================
  // UPLOAD/DOWNLOAD
  // ============================================================================

  const uploadArchive = useCallback(async (id: string): Promise<void> => {
    await archiveManager.uploadArchive(id);
    setArchives(archiveManager.getAllArchives());
  }, []);

  const downloadArchive = useCallback(async (id: string): Promise<void> => {
    await archiveManager.downloadArchive(id);
  }, []);

  const compressArchive = useCallback(async (id: string): Promise<void> => {
    await archiveManager.compressArchive(id);
    setArchives(archiveManager.getAllArchives());
  }, []);

  // ============================================================================
  // FAVORITES AND PROTECTION
  // ============================================================================

  const toggleFavorite = useCallback((id: string): boolean => {
    const result = archiveManager.toggleFavorite(id);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  const toggleProtection = useCallback((id: string): boolean => {
    const result = archiveManager.toggleProtection(id);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  // ============================================================================
  // TAGS
  // ============================================================================

  const addTag = useCallback((id: string, tag: string): boolean => {
    const result = archiveManager.addTag(id, tag);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  const removeTag = useCallback((id: string, tag: string): boolean => {
    const result = archiveManager.removeTag(id, tag);
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  const getAllTags = useCallback((): string[] => {
    return archiveManager.getAllTags();
  }, []);

  // ============================================================================
  // SETTINGS
  // ============================================================================

  const updateRecordingConfig = useCallback((config: Partial<ArchiveRecordingConfig>): void => {
    archiveManager.updateRecordingConfig(config);
    setRecordingConfig(archiveManager.getRecordingConfig());
  }, []);

  const updateStorageConfig = useCallback((config: Partial<ArchiveStorageConfig>): void => {
    archiveManager.updateStorageConfig(config);
    setStorageConfig(archiveManager.getStorageConfig());
  }, []);

  const updateAutoDeleteConfig = useCallback((config: Partial<ArchiveAutoDeleteConfig>): void => {
    archiveManager.updateAutoDeleteConfig(config);
    setAutoDeleteConfig(archiveManager.getAutoDeleteConfig());
  }, []);

  const executeAutoDelete = useCallback((): number => {
    const result = archiveManager.executeAutoDelete();
    setArchives(archiveManager.getAllArchives());
    return result;
  }, []);

  // ============================================================================
  // EVENTS
  // ============================================================================

  const onArchiveEvent = useCallback((callback: (event: ArchiveEvent) => void): void => {
    archiveManager.onArchiveEvent(callback);
  }, []);

  const offArchiveEvent = useCallback((callback: (event: ArchiveEvent) => void): void => {
    archiveManager.offArchiveEvent(callback);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    archives,
    currentRecording,
    statistics,
    isRecording: currentRecording !== null,
    recordingConfig,
    storageConfig,
    autoDeleteConfig,
    
    // Archive CRUD
    getArchiveById,
    createArchive,
    updateArchive,
    deleteArchive,
    
    // Recording
    startRecording,
    stopRecording,
    
    // Search and Filter
    searchArchives,
    sortArchives,
    
    // Batch Operations
    executeBatchOperation,
    
    // Export/Import
    exportArchives,
    importArchives,
    
    // Upload/Download
    uploadArchive,
    downloadArchive,
    compressArchive,
    
    // Favorites and Protection
    toggleFavorite,
    toggleProtection,
    
    // Tags
    addTag,
    removeTag,
    getAllTags,
    
    // Settings
    updateRecordingConfig,
    updateStorageConfig,
    updateAutoDeleteConfig,
    executeAutoDelete,
    
    // Events
    onArchiveEvent,
    offArchiveEvent,
  };
}

export default useArchive;