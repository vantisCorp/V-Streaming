/**
 * React Hook for Recording Engine Pro
 * Provides easy access to recording functionality and state
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RecordingConfiguration,
  RecordingSession,
  RecordingStats,
  RecordingSettings,
  RecordingMetadata,
  RecordingPreset,
  RecordingDiskInfo,
  ReplayBufferStatus,
  ReplayBufferConfig,
} from '../types/recordingEnginePro';
import {
  getRecordingEngineProManager,
  RecordingEngineProManager,
  RecordingEngineEvents,
} from '../services/RecordingEngineProManager';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseRecordingEngineProReturn {
  // State
  config: RecordingConfiguration;
  currentSession: RecordingSession | null;
  sessions: RecordingSession[];
  stats: RecordingStats;
  settings: RecordingSettings;
  presets: RecordingPreset[];
  recordings: RecordingMetadata[];
  diskInfo: RecordingDiskInfo;
  replayBufferStatus: ReplayBufferStatus;
  replayBufferConfig: ReplayBufferConfig;
  
  // Recording control
  startRecording: (config?: RecordingConfiguration) => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Replay buffer
  startReplayBuffer: () => Promise<void>;
  stopReplayBuffer: () => Promise<void>;
  saveReplayBuffer: () => Promise<void>;
  
  // Configuration
  setConfiguration: (config: RecordingConfiguration) => void;
  
  // Presets
  createPreset: (preset: RecordingPreset) => void;
  updatePreset: (preset: RecordingPreset) => void;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;
  
  // Settings
  updateSettings: (updates: Partial<RecordingSettings>) => void;
  resetSettings: () => void;
  
  // Metadata
  deleteRecording: (id: string) => void;
  
  // Replay buffer
  setReplayBufferConfig: (config: ReplayBufferConfig) => void;
  
  // Utility
  calculateEstimatedSize: (duration: number, bitrate: number) => number;
  formatFileSize: (bytes: number) => string;
  formatDuration: (seconds: number) => string;
  
  // State helpers
  isRecording: boolean;
  isPaused: boolean;
  canRecord: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRecordingEnginePro(): UseRecordingEngineProReturn {
  const { t } = useTranslation();
  const manager = getRecordingEngineProManager();
  
  // State
  const [config, setConfig] = useState<RecordingConfiguration>(manager.getConfiguration());
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(manager.getCurrentSession());
  const [sessions, setSessions] = useState<RecordingSession[]>(manager.getSessions());
  const [stats, setStats] = useState<RecordingStats>(manager.getStats());
  const [settings, setSettings] = useState<RecordingSettings>(manager.getSettings());
  const [presets, setPresets] = useState<RecordingPreset[]>(manager.getPresets());
  const [recordings, setRecordings] = useState<RecordingMetadata[]>(manager.getRecordings());
  const [diskInfo, setDiskInfo] = useState<RecordingDiskInfo>(manager.getDiskInfo());
  const [replayBufferStatus, setReplayBufferStatus] = useState<ReplayBufferStatus>(manager.getReplayBufferStatus());
  const [replayBufferConfig, setReplayBufferConfigState] = useState<ReplayBufferConfig>(manager.getReplayBufferConfig());
  
  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  
  useEffect(() => {
    const handleRecordingStarted = (session: RecordingSession) => {
      setCurrentSession(session);
    };
    
    const handleRecordingPaused = (session: RecordingSession) => {
      setCurrentSession(session);
      setStats(session.stats);
    };
    
    const handleRecordingResumed = (session: RecordingSession) => {
      setCurrentSession(session);
      setStats(session.stats);
    };
    
    const handleRecordingStopped = (session: RecordingSession) => {
      setCurrentSession(session);
      setStats(session.stats);
    };
    
    const handleRecordingCompleted = (session: RecordingSession, metadata: RecordingMetadata) => {
      setCurrentSession(null);
      setSessions(manager.getSessions());
      setRecordings(manager.getRecordings());
      setStats(manager.getStats());
    };
    
    const handleRecordingFailed = (session: RecordingSession) => {
      setCurrentSession(session);
      setStats(session.stats);
    };
    
    const handleRecordingUpdated = (session: RecordingSession) => {
      setCurrentSession(session);
      setStats(session.stats);
    };
    
    const handleSettingsChanged = (newSettings: RecordingSettings) => {
      setSettings(newSettings);
      setConfig(manager.getConfiguration());
      setPresets(newSettings.presets);
    };
    
    const handleReplayBufferReady = () => {
      setReplayBufferStatus(manager.getReplayBufferStatus());
    };
    
    const handleDiskSpaceWarning = (diskInfo: RecordingDiskInfo) => {
      setDiskInfo(diskInfo);
      // Could show notification here
    };
    
    // Register all event listeners
    manager.on('recording-started', handleRecordingStarted);
    manager.on('recording-paused', handleRecordingPaused);
    manager.on('recording-resumed', handleRecordingResumed);
    manager.on('recording-stopped', handleRecordingStopped);
    manager.on('recording-completed', handleRecordingCompleted);
    manager.on('recording-failed', handleRecordingFailed);
    manager.on('recording-updated', handleRecordingUpdated);
    manager.on('settings-changed', handleSettingsChanged);
    manager.on('replay-buffer-ready', handleReplayBufferReady);
    manager.on('disk-space-warning', handleDiskSpaceWarning);
    
    // Cleanup
    return () => {
      manager.off('recording-started', handleRecordingStarted);
      manager.off('recording-paused', handleRecordingPaused);
      manager.off('recording-resumed', handleRecordingResumed);
      manager.off('recording-stopped', handleRecordingStopped);
      manager.off('recording-completed', handleRecordingCompleted);
      manager.off('recording-failed', handleRecordingFailed);
      manager.off('recording-updated', handleRecordingUpdated);
      manager.off('settings-changed', handleSettingsChanged);
      manager.off('replay-buffer-ready', handleReplayBufferReady);
      manager.off('disk-space-warning', handleDiskSpaceWarning);
    };
  }, [manager]);
  
  // ==========================================================================
  // RECORDING CONTROL
  // ==========================================================================
  
  const startRecording = useCallback(async (newConfig?: RecordingConfiguration) => {
    await manager.startRecording(newConfig);
  }, [manager]);
  
  const pauseRecording = useCallback(async () => {
    await manager.pauseRecording();
  }, [manager]);
  
  const resumeRecording = useCallback(async () => {
    await manager.resumeRecording();
  }, [manager]);
  
  const stopRecording = useCallback(async () => {
    await manager.stopRecording();
  }, [manager]);
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  const startReplayBuffer = useCallback(async () => {
    await manager.startReplayBuffer();
  }, [manager]);
  
  const stopReplayBuffer = useCallback(async () => {
    await manager.stopReplayBuffer();
  }, [manager]);
  
  const saveReplayBuffer = useCallback(async () => {
    await manager.saveReplayBuffer();
  }, [manager]);
  
  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================
  
  const setConfiguration = useCallback((newConfig: RecordingConfiguration) => {
    manager.setConfiguration(newConfig);
    setConfig(manager.getConfiguration());
  }, [manager]);
  
  // ==========================================================================
  // PRESETS
  // ==========================================================================
  
  const createPreset = useCallback((preset: RecordingPreset) => {
    manager.createPreset(preset);
    setPresets(manager.getPresets());
  }, [manager]);
  
  const updatePreset = useCallback((preset: RecordingPreset) => {
    manager.updatePreset(preset);
    setPresets(manager.getPresets());
  }, [manager]);
  
  const deletePreset = useCallback((id: string) => {
    manager.deletePreset(id);
    setPresets(manager.getPresets());
  }, [manager]);
  
  const applyPreset = useCallback((id: string) => {
    manager.applyPreset(id);
    setConfig(manager.getConfiguration());
  }, [manager]);
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  const updateSettings = useCallback((updates: Partial<RecordingSettings>) => {
    manager.updateSettings(updates);
  }, [manager]);
  
  const resetSettings = useCallback(() => {
    manager.resetSettings();
    setSettings(manager.getSettings());
    setConfig(manager.getConfiguration());
    setPresets(manager.getPresets());
  }, [manager]);
  
  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  const deleteRecording = useCallback((id: string) => {
    manager.deleteRecording(id);
    setRecordings(manager.getRecordings());
  }, [manager]);
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  const setReplayBufferConfig = useCallback((newConfig: ReplayBufferConfig) => {
    manager.setReplayBufferConfig(newConfig);
    setReplayBufferConfigState(manager.getReplayBufferConfig());
  }, [manager]);
  
  // ==========================================================================
  // UTILITY
  // ==========================================================================
  
  const calculateEstimatedSize = useCallback((duration: number, bitrate: number) => {
    return manager.calculateEstimatedSize(duration, bitrate);
  }, [manager]);
  
  const formatFileSize = useCallback((bytes: number) => {
    return manager.formatFileSize(bytes);
  }, [manager]);
  
  const formatDuration = useCallback((seconds: number) => {
    return manager.formatDuration(seconds);
  }, [manager]);
  
  // ==========================================================================
  // STATE HELPERS
  // ==========================================================================
  
  const isRecording = currentSession?.status === 'recording' || currentSession?.status === 'paused';
  const isPaused = currentSession?.status === 'paused';
  const canRecord = stats.status === 'idle' || stats.status === 'completed' || stats.status === 'failed';
  const canPause = stats.status === 'recording';
  const canResume = stats.status === 'paused';
  const canStop = ['recording', 'paused', 'preparing'].includes(stats.status);
  
  return {
    // State
    config,
    currentSession,
    sessions,
    stats,
    settings,
    presets,
    recordings,
    diskInfo,
    replayBufferStatus,
    replayBufferConfig,
    
    // Recording control
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    
    // Replay buffer
    startReplayBuffer,
    stopReplayBuffer,
    saveReplayBuffer,
    
    // Configuration
    setConfiguration,
    
    // Presets
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    
    // Settings
    updateSettings,
    resetSettings,
    
    // Metadata
    deleteRecording,
    
    // Replay buffer
    setReplayBufferConfig,
    
    // Utility
    calculateEstimatedSize,
    formatFileSize,
    formatDuration,
    
    // State helpers
    isRecording,
    isPaused,
    canRecord,
    canPause,
    canResume,
    canStop,
  };
}