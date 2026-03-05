/**
 * ArchiveManager - Service for managing stream archives
 */

import { EventEmitter } from 'events';
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
  ArchiveEventType,
  ArchiveEvent,
  ArchiveRecordingConfig,
  ArchiveStorageConfig,
  ArchiveAutoDeleteConfig,
  DEFAULT_ARCHIVE_RECORDING_CONFIG,
  DEFAULT_ARCHIVE_STORAGE_CONFIG,
  DEFAULT_ARCHIVE_AUTO_DELETE_CONFIG,
} from '../types/archive';

// ============================================================================
// ARCHIVE MANAGER CLASS
// ============================================================================

class ArchiveManager extends EventEmitter {
  private static instance: ArchiveManager;
  private archives: Map<string, Archive> = new Map();
  private currentRecording: Archive | null = null;
  private recordingConfig: ArchiveRecordingConfig;
  private storageConfig: ArchiveStorageConfig;
  private autoDeleteConfig: ArchiveAutoDeleteConfig;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private recordingInterval: ReturnType<typeof setInterval> | null = null;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  private constructor() {
    super();
    this.recordingConfig = { ...DEFAULT_ARCHIVE_RECORDING_CONFIG };
    this.storageConfig = { ...DEFAULT_ARCHIVE_STORAGE_CONFIG };
    this.autoDeleteConfig = { ...DEFAULT_ARCHIVE_AUTO_DELETE_CONFIG };
    this.loadFromStorage();
    this.startAutoSave();
  }

  // ============================================================================
  // SINGLETON PATTERN
  // ============================================================================

  static getInstance(): ArchiveManager {
    if (!ArchiveManager.instance) {
      ArchiveManager.instance = new ArchiveManager();
    }
    return ArchiveManager.instance;
  }

  // ============================================================================
  // STORAGE OPERATIONS
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const savedArchives = localStorage.getItem('archives');
      if (savedArchives) {
        const archivesData = JSON.parse(savedArchives);
        archivesData.forEach((archive: any) => {
          archive.createdAt = new Date(archive.createdAt);
          archive.completedAt = archive.completedAt ? new Date(archive.completedAt) : undefined;
          archive.streamInfo.startTime = new Date(archive.streamInfo.startTime);
          archive.streamInfo.endTime = new Date(archive.streamInfo.endTime);
          this.archives.set(archive.id, archive);
        });
      }

      const savedRecordingConfig = localStorage.getItem('archiveRecordingConfig');
      if (savedRecordingConfig) {
        this.recordingConfig = JSON.parse(savedRecordingConfig);
      }

      const savedStorageConfig = localStorage.getItem('archiveStorageConfig');
      if (savedStorageConfig) {
        this.storageConfig = JSON.parse(savedStorageConfig);
      }

      const savedAutoDeleteConfig = localStorage.getItem('archiveAutoDeleteConfig');
      if (savedAutoDeleteConfig) {
        this.autoDeleteConfig = JSON.parse(savedAutoDeleteConfig);
      }
    } catch (error) {
      console.error('Failed to load archives from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const archivesArray = Array.from(this.archives.values());
      localStorage.setItem('archives', JSON.stringify(archivesArray));
      localStorage.setItem('archiveRecordingConfig', JSON.stringify(this.recordingConfig));
      localStorage.setItem('archiveStorageConfig', JSON.stringify(this.storageConfig));
      localStorage.setItem('archiveAutoDeleteConfig', JSON.stringify(this.autoDeleteConfig));
    } catch (error) {
      console.error('Failed to save archives to storage:', error);
    }
  }

  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => {
      this.saveToStorage();
    }, 30000); // Auto-save every 30 seconds
  }

  // ============================================================================
  // ARCHIVE CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all archives
   */
  getAllArchives(): Archive[] {
    return Array.from(this.archives.values());
  }

  /**
   * Get archive by ID
   */
  getArchiveById(id: string): Archive | undefined {
    return this.archives.get(id);
  }

  /**
   * Create new archive
   */
  createArchive(archive: Omit<Archive, 'id' | 'createdAt'>): Archive {
    const id = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newArchive: Archive = {
      ...archive,
      id,
      createdAt: new Date(),
    };
    this.archives.set(id, newArchive);
    this.saveToStorage();
    this.emit('archiveCreated', newArchive);
    this.emitEvent(ArchiveEventType.ARCHIVE_CREATED, id);
    return newArchive;
  }

  /**
   * Update archive
   */
  updateArchive(id: string, updates: Partial<Archive>): Archive | null {
    const archive = this.archives.get(id);
    if (!archive) return null;

    const updatedArchive = { ...archive, ...updates };
    this.archives.set(id, updatedArchive);
    this.saveToStorage();
    this.emit('archiveUpdated', updatedArchive);
    this.emitEvent(ArchiveEventType.ARCHIVE_UPDATED, id);
    return updatedArchive;
  }

  /**
   * Delete archive
   */
  deleteArchive(id: string): boolean {
    const archive = this.archives.get(id);
    if (!archive) return false;

    if (archive.isProtected) {
      throw new Error('Cannot delete protected archive');
    }

    this.archives.delete(id);
    this.saveToStorage();
    this.emit('archiveDeleted', id);
    this.emitEvent(ArchiveEventType.ARCHIVE_DELETED, id);
    return true;
  }

  // ============================================================================
  // RECORDING OPERATIONS
  // ============================================================================

  /**
   * Start recording
   */
  startRecording(streamInfo: Archive['streamInfo']): Archive {
    if (this.currentRecording) {
      throw new Error('Recording already in progress');
    }

    if (!this.recordingConfig.enabled) {
      throw new Error('Recording is disabled');
    }

    const archive: Omit<Archive, 'id' | 'createdAt'> = {
      name: `Stream_${new Date().toISOString().split('T')[0]}`,
      filePath: `${this.storageConfig.localPath}/${Date.now()}.${this.recordingConfig.format}`,
      format: this.recordingConfig.format,
      quality: this.recordingConfig.quality,
      status: ArchiveStatus.RECORDING,
      size: 0,
      duration: 0,
      platform: streamInfo.title || 'Unknown',
      category: ArchiveCategory.OTHER,
      tags: [],
      isFavorite: false,
      isProtected: false,
      viewCount: 0,
      downloadCount: 0,
      streamInfo,
      recordingConfig: this.recordingConfig,
      storageConfig: this.storageConfig,
      metadata: {
        video: {
          codec: 'H264',
          width: this.recordingConfig.resolution?.width || 1920,
          height: this.recordingConfig.resolution?.height || 1080,
          fps: this.recordingConfig.fps || 60,
          bitrate: this.recordingConfig.targetBitrate || 6000,
        },
        audio: {
          codec: 'AAC',
          sampleRate: this.recordingConfig.audioSampleRate,
          channels: this.recordingConfig.audioChannels,
          bitrate: this.recordingConfig.audioBitrate,
        },
        encoder: this.recordingConfig.encoder,
        hardwareAccelerated: this.recordingConfig.enableHardwareEncoding,
      },
    };

    this.currentRecording = this.createArchive(archive);
    this.startRecordingUpdate();
    this.emitEvent(ArchiveEventType.RECORDING_STARTED, this.currentRecording.id);
    return this.currentRecording;
  }

  /**
   * Stop recording
   */
  stopRecording(): Archive | null {
    if (!this.currentRecording) {
      return null;
    }

    const archive = this.currentRecording;
    this.stopRecordingUpdate();

    // Simulate processing
    this.updateArchive(archive.id, { status: ArchiveStatus.PROCESSING });
    this.emitEvent(ArchiveEventType.PROCESSING_STARTED, archive.id);

    setTimeout(() => {
      this.updateArchive(archive.id, {
        status: ArchiveStatus.COMPLETED,
        completedAt: new Date(),
      });
      this.emitEvent(ArchiveEventType.PROCESSING_COMPLETED, archive.id);

      // Auto-upload if configured
      if (this.storageConfig.autoUpload && this.storageConfig.uploadAfterRecording) {
        this.uploadArchive(archive.id);
      }
    }, 2000);

    this.emitEvent(ArchiveEventType.RECORDING_STOPPED, archive.id);
    const result = this.currentRecording;
    this.currentRecording = null;
    return result;
  }

  /**
   * Update recording progress
   */
  private startRecordingUpdate(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }

    this.recordingInterval = setInterval(() => {
      if (this.currentRecording) {
        const archive = this.currentRecording;
        this.updateArchive(archive.id, {
          duration: archive.duration + 1,
          size: Math.floor(archive.size + (archive.recordingConfig.targetBitrate || 6000) / 8),
        });
      }
    }, 1000);
  }

  /**
   * Stop recording update interval
   */
  private stopRecordingUpdate(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  /**
   * Check if recording is in progress
   */
  isRecording(): boolean {
    return this.currentRecording !== null;
  }

  /**
   * Get current recording
   */
  getCurrentRecording(): Archive | null {
    return this.currentRecording;
  }

  // ============================================================================
  // SEARCH AND FILTER
  // ============================================================================

  /**
   * Search archives
   */
  searchArchives(filters: ArchiveSearchFilters): Archive[] {
    let results = Array.from(this.archives.values());

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(
        (archive) =>
          archive.name.toLowerCase().includes(query) ||
          archive.description?.toLowerCase().includes(query) ||
          archive.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (filters.status) {
      results = results.filter((archive) => archive.status === filters.status);
    }

    if (filters.category) {
      results = results.filter((archive) => archive.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((archive) =>
        filters.tags!.some((tag) => archive.tags.includes(tag))
      );
    }

    if (filters.startDate) {
      results = results.filter((archive) => archive.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter((archive) => archive.createdAt <= filters.endDate!);
    }

    if (filters.minDuration) {
      results = results.filter((archive) => archive.duration >= filters.minDuration!);
    }

    if (filters.maxDuration) {
      results = results.filter((archive) => archive.duration <= filters.maxDuration!);
    }

    if (filters.minFileSize) {
      results = results.filter((archive) => archive.size >= filters.minFileSize!);
    }

    if (filters.maxFileSize) {
      results = results.filter((archive) => archive.size <= filters.maxFileSize!);
    }

    if (filters.platform) {
      results = results.filter((archive) => archive.platform === filters.platform);
    }

    if (filters.isFavorite !== undefined) {
      results = results.filter((archive) => archive.isFavorite === filters.isFavorite);
    }

    if (filters.format) {
      results = results.filter((archive) => archive.format === filters.format);
    }

    if (filters.quality) {
      results = results.filter((archive) => archive.quality === filters.quality);
    }

    return results;
  }

  /**
   * Sort archives
   */
  sortArchives(archives: Archive[], sortBy: ArchiveSortOption): Archive[] {
    return [...archives].sort((a, b) => {
      switch (sortBy) {
        case ArchiveSortOption.DATE_DESC:
          return b.createdAt.getTime() - a.createdAt.getTime();
        case ArchiveSortOption.DATE_ASC:
          return a.createdAt.getTime() - b.createdAt.getTime();
        case ArchiveSortOption.NAME_ASC:
          return a.name.localeCompare(b.name);
        case ArchiveSortOption.NAME_DESC:
          return b.name.localeCompare(a.name);
        case ArchiveSortOption.SIZE_DESC:
          return b.size - a.size;
        case ArchiveSortOption.SIZE_ASC:
          return a.size - b.size;
        case ArchiveSortOption.DURATION_DESC:
          return b.duration - a.duration;
        case ArchiveSortOption.DURATION_ASC:
          return a.duration - b.duration;
        case ArchiveSortOption.VIEWS_DESC:
          return b.viewCount - a.viewCount;
        case ArchiveSortOption.VIEWS_ASC:
          return a.viewCount - b.viewCount;
        default:
          return 0;
      }
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Execute batch operation
   */
  async executeBatchOperation(operation: ArchiveBatchOperation): Promise<void> {
    const { operation: op, archiveIds, options } = operation;

    switch (op) {
      case 'delete':
        for (const id of archiveIds) {
          this.deleteArchive(id);
        }
        break;

      case 'export':
        await this.exportArchives(archiveIds, options);
        break;

      case 'upload':
        for (const id of archiveIds) {
          await this.uploadArchive(id);
        }
        break;

      case 'download':
        for (const id of archiveIds) {
          await this.downloadArchive(id);
        }
        break;

      case 'tag':
        if (options?.tags) {
          for (const id of archiveIds) {
            const archive = this.getArchiveById(id);
            if (archive) {
              const updatedTags = [...new Set([...archive.tags, ...options.tags])];
              this.updateArchive(id, { tags: updatedTags });
            }
          }
        }
        break;

      case 'compress':
        for (const id of archiveIds) {
          await this.compressArchive(id);
        }
        break;
    }
  }

  // ============================================================================
  // EXPORT / IMPORT
  // ============================================================================

  /**
   * Export archives
   */
  async exportArchives(archiveIds: string[], options: ArchiveExportOptions): Promise<string> {
    const archives = archiveIds.map((id) => this.getArchiveById(id)).filter(Boolean) as Archive[];
    
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const exportData = {
      archives,
      exportedAt: new Date(),
      options,
    };

    this.emitEvent(ArchiveEventType.ARCHIVE_EXPORTED, undefined, { count: archiveIds.length });
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import archives
   */
  async importArchives(options: ArchiveImportOptions): Promise<Archive[]> {
    // Simulate import
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create sample imported archive
    const importedArchive = this.createArchive({
      name: `Imported_${Date.now()}`,
      filePath: options.sourcePath,
      format: ArchiveFormat.MP4,
      quality: ArchiveQuality.HIGH,
      status: ArchiveStatus.COMPLETED,
      size: 1073741824, // 1GB
      duration: 3600, // 1 hour
      completedAt: new Date(),
      platform: 'Imported',
      category: ArchiveCategory.OTHER,
      tags: ['imported'],
      isFavorite: false,
      isProtected: false,
      viewCount: 0,
      downloadCount: 0,
      streamInfo: {
        title: 'Imported Stream',
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(),
        peakViewers: 0,
        avgViewers: 0,
        followers: 0,
        messages: 0,
      },
      recordingConfig: this.recordingConfig,
      storageConfig: this.storageConfig,
      metadata: {
        video: {
          codec: 'H264',
          width: 1920,
          height: 1080,
          fps: 60,
          bitrate: 6000,
        },
        audio: {
          codec: 'AAC',
          sampleRate: 48000,
          channels: 2,
          bitrate: 128,
        },
        hardwareAccelerated: true,
      },
    });

    this.emitEvent(ArchiveEventType.ARCHIVE_IMPORTED, importedArchive.id);
    return [importedArchive];
  }

  // ============================================================================
  // UPLOAD / DOWNLOAD
  // ============================================================================

  /**
   * Upload archive to cloud
   */
  async uploadArchive(id: string): Promise<void> {
    const archive = this.getArchiveById(id);
    if (!archive) {
      throw new Error('Archive not found');
    }

    this.updateArchive(id, { status: ArchiveStatus.UPLOADING });
    this.emitEvent(ArchiveEventType.UPLOAD_STARTED, id);

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.updateArchive(id, { status: ArchiveStatus.COMPLETED });
    this.emitEvent(ArchiveEventType.UPLOAD_COMPLETED, id);
  }

  /**
   * Download archive from cloud
   */
  async downloadArchive(id: string): Promise<void> {
    const archive = this.getArchiveById(id);
    if (!archive) {
      throw new Error('Archive not found');
    }

    // Simulate download
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Compress archive
   */
  async compressArchive(id: string): Promise<void> {
    const archive = this.getArchiveById(id);
    if (!archive) {
      throw new Error('Archive not found');
    }

    this.updateArchive(id, { status: ArchiveStatus.PROCESSING });

    // Simulate compression
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newSize = Math.floor(archive.size * 0.7); // Compress to 70%
    this.updateArchive(id, {
      status: ArchiveStatus.COMPLETED,
      size: newSize,
    });
  }

  // ============================================================================
  // FAVORITES AND PROTECTION
  // ============================================================================

  /**
   * Toggle favorite
   */
  toggleFavorite(id: string): boolean {
    const archive = this.getArchiveById(id);
    if (!archive) return false;

    const newFavorite = !archive.isFavorite;
    this.updateArchive(id, { isFavorite: newFavorite });
    return newFavorite;
  }

  /**
   * Toggle protection
   */
  toggleProtection(id: string): boolean {
    const archive = this.getArchiveById(id);
    if (!archive) return false;

    const newProtected = !archive.isProtected;
    this.updateArchive(id, { isProtected: newProtected });
    return newProtected;
  }

  // ============================================================================
  // TAGS MANAGEMENT
  // ============================================================================

  /**
   * Add tag to archive
   */
  addTag(id: string, tag: string): boolean {
    const archive = this.getArchiveById(id);
    if (!archive || archive.tags.includes(tag)) return false;

    const updatedTags = [...archive.tags, tag];
    this.updateArchive(id, { tags: updatedTags });
    return true;
  }

  /**
   * Remove tag from archive
   */
  removeTag(id: string, tag: string): boolean {
    const archive = this.getArchiveById(id);
    if (!archive) return false;

    const updatedTags = archive.tags.filter((t) => t !== tag);
    this.updateArchive(id, { tags: updatedTags });
    return true;
  }

  /**
   * Get all tags
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.archives.forEach((archive) => {
      archive.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get archive statistics
   */
  getStatistics(): ArchiveStatistics {
    const archives = Array.from(this.archives.values());
    
    const byStatus: Record<ArchiveStatus, number> = {
      [ArchiveStatus.RECORDING]: 0,
      [ArchiveStatus.PROCESSING]: 0,
      [ArchiveStatus.COMPLETED]: 0,
      [ArchiveStatus.FAILED]: 0,
      [ArchiveStatus.UPLOADING]: 0,
      [ArchiveStatus.DELETING]: 0,
    };

    const byCategory: Record<ArchiveCategory, number> = {
      [ArchiveCategory.GAMING]: 0,
      [ArchiveCategory.JUST_CHATTING]: 0,
      [ArchiveCategory.MUSIC]: 0,
      [ArchiveCategory.ART]: 0,
      [ArchiveCategory.IRL]: 0,
      [ArchiveCategory.TECH]: 0,
      [ArchiveCategory.SPORTS]: 0,
      [ArchiveCategory.EDUCATION]: 0,
      [ArchiveCategory.OTHER]: 0,
    };

    const byFormat: Record<ArchiveFormat, number> = {
      [ArchiveFormat.MP4]: 0,
      [ArchiveFormat.MKV]: 0,
      [ArchiveFormat.MOV]: 0,
      [ArchiveFormat.FLV]: 0,
      [ArchiveFormat.WEBM]: 0,
      [ArchiveFormat.TS]: 0,
    };

    const byQuality: Record<ArchiveQuality, number> = {
      [ArchiveQuality.ORIGINAL]: 0,
      [ArchiveQuality.HIGH]: 0,
      [ArchiveQuality.MEDIUM]: 0,
      [ArchiveQuality.LOW]: 0,
      [ArchiveQuality.CUSTOM]: 0,
    };

    archives.forEach((archive) => {
      byStatus[archive.status]++;
      byCategory[archive.category]++;
      byFormat[archive.format]++;
      byQuality[archive.quality]++;
    });

    const totalSize = archives.reduce((sum, a) => sum + a.size, 0);
    const totalDuration = archives.reduce((sum, a) => sum + a.duration, 0);
    const storageUsed = totalSize;
    const storageAvailable = (this.storageConfig.maxStorageGB || 500) * 1073741824 - storageUsed;
    
    const sortedByDate = [...archives].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestArchive = sortedByDate[0]?.createdAt || new Date();
    const newestArchive = sortedByDate[sortedByDate.length - 1]?.createdAt || new Date();

    return {
      totalArchives: archives.length,
      totalSize,
      totalDuration,
      byStatus,
      byCategory,
      byFormat,
      byQuality,
      storageUsed,
      storageAvailable,
      oldestArchive,
      newestArchive,
    };
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  /**
   * Get recording config
   */
  getRecordingConfig(): ArchiveRecordingConfig {
    return { ...this.recordingConfig };
  }

  /**
   * Update recording config
   */
  updateRecordingConfig(config: Partial<ArchiveRecordingConfig>): void {
    this.recordingConfig = { ...this.recordingConfig, ...config };
    this.saveToStorage();
  }

  /**
   * Get storage config
   */
  getStorageConfig(): ArchiveStorageConfig {
    return { ...this.storageConfig };
  }

  /**
   * Update storage config
   */
  updateStorageConfig(config: Partial<ArchiveStorageConfig>): void {
    this.storageConfig = { ...this.storageConfig, ...config };
    this.saveToStorage();
  }

  /**
   * Get auto-delete config
   */
  getAutoDeleteConfig(): ArchiveAutoDeleteConfig {
    return { ...this.autoDeleteConfig };
  }

  /**
   * Update auto-delete config
   */
  updateAutoDeleteConfig(config: Partial<ArchiveAutoDeleteConfig>): void {
    this.autoDeleteConfig = { ...this.autoDeleteConfig, ...config };
    this.saveToStorage();
  }

  /**
   * Execute auto-delete based on config
   */
  executeAutoDelete(): number {
    if (!this.autoDeleteConfig.enabled) {
      return 0;
    }

    let deletedCount = 0;
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - this.autoDeleteConfig.olderThanDays * 24 * 60 * 60 * 1000);

    for (const [id, archive] of this.archives.entries()) {
      if (
        !archive.isProtected &&
        (!this.autoDeleteConfig.keepFavorites || !archive.isFavorite) &&
        archive.createdAt < cutoffDate &&
        archive.status === ArchiveStatus.COMPLETED
      ) {
        try {
          if (this.deleteArchive(id)) {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete archive ${id}:`, error);
        }
      }
    }

    return deletedCount;
  }

  // ============================================================================
  // EVENT HELPERS
  // ============================================================================

  /**
   * Emit archive event
   */
  private emitEvent(type: ArchiveEventType, archiveId?: string, data?: any): void {
    const event: ArchiveEvent = {
      type,
      archiveId,
      timestamp: new Date(),
      data,
    };
    this.emit('archiveEvent', event);
  }

  /**
   * Subscribe to archive events
   */
  onArchiveEvent(callback: (event: ArchiveEvent) => void): void {
    this.on('archiveEvent', callback);
  }

  /**
   * Unsubscribe from archive events
   */
  offArchiveEvent(callback: (event: ArchiveEvent) => void): void {
    this.off('archiveEvent', callback);
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.stopRecordingUpdate();
    this.removeAllListeners();
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const archiveManager = ArchiveManager.getInstance();
export default archiveManager;