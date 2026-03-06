/**
 * Recording Engine Pro - Professional Recording Management Service
 * Manages recording sessions, configurations, and real-time monitoring
 */

import EventEmitter from 'eventemitter3';
import {
  RecordingConfiguration,
  RecordingSession,
  RecordingStatus,
  RecordingMode,
  RecordingSettings,
  RecordingStats,
  RecordingMetadata,
  RecordingPreset,
  RecordingDiskInfo,
  ReplayBufferStatus,
  ReplayBufferConfig,
  RecordingCategory,
  DEFAULT_RECORDING_CONFIG,
  DEFAULT_RECORDING_SETTINGS,
  DEFAULT_RECORDING_STATS,
  BUILTIN_RECORDING_PRESETS,
  isRecordingActive,
  canStartRecording,
  canPauseRecording,
  canResumeRecording,
  canStopRecording,
} from '../types/recordingEnginePro';

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface RecordingEngineEvents {
  'recording-started': (session: RecordingSession) => void;
  'recording-paused': (session: RecordingSession) => void;
  'recording-resumed': (session: RecordingSession) => void;
  'recording-stopped': (session: RecordingSession) => void;
  'recording-completed': (session: RecordingSession, metadata: RecordingMetadata) => void;
  'recording-failed': (session: RecordingSession, error: string) => void;
  'recording-updated': (session: RecordingSession) => void;
  'settings-changed': (settings: RecordingSettings) => void;
  'replay-buffer-ready': () => void;
  'disk-space-warning': (diskInfo: RecordingDiskInfo) => void;
}

export interface IRecordingEngineProManager {
  // Recording control
  startRecording(config?: RecordingConfiguration): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  
  // Replay buffer
  startReplayBuffer(): Promise<void>;
  stopReplayBuffer(): Promise<void>;
  saveReplayBuffer(): Promise<void>;
  
  // Configuration
  getConfiguration(): RecordingConfiguration;
  setConfiguration(config: RecordingConfiguration): void;
  
  // Presets
  getPresets(): RecordingPreset[];
  getPreset(id: string): RecordingPreset | undefined;
  createPreset(preset: RecordingPreset): void;
  updatePreset(preset: RecordingPreset): void;
  deletePreset(id: string): void;
  applyPreset(id: string): void;
  
  // Settings
  getSettings(): RecordingSettings;
  updateSettings(settings: Partial<RecordingSettings>): void;
  resetSettings(): void;
  
  // Session management
  getCurrentSession(): RecordingSession | null;
  getSession(id: string): RecordingSession | undefined;
  getSessions(): RecordingSession[];
  
  // Metadata
  getRecordings(): RecordingMetadata[];
  getRecording(id: string): RecordingMetadata | undefined;
  deleteRecording(id: string): void;
  
  // Statistics
  getStats(): RecordingStats;
  getDiskInfo(): RecordingDiskInfo;
  
  // Replay buffer
  getReplayBufferStatus(): ReplayBufferStatus;
  getReplayBufferConfig(): ReplayBufferConfig;
  setReplayBufferConfig(config: ReplayBufferConfig): void;
  
  // Utility
  calculateEstimatedSize(duration: number, bitrate: number): number;
  formatFileSize(bytes: number): string;
  formatDuration(seconds: number): string;
}

// ============================================================================
// RECORDING ENGINE MANAGER IMPLEMENTATION
// ============================================================================

export class RecordingEngineProManager extends EventEmitter<RecordingEngineEvents> 
  implements IRecordingEngineProManager {
  
  private currentSession: RecordingSession | null = null;
  private sessions: RecordingSession[] = [];
  private recordings: RecordingMetadata[] = [];
  private settings: RecordingSettings;
  private currentConfig: RecordingConfiguration;
  private replayBufferStatus: ReplayBufferStatus = ReplayBufferStatus.INACTIVE;
  private replayBufferConfig: ReplayBufferConfig;
  private statsUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private stats: RecordingStats;
  
  constructor() {
    super();
    
    // Load settings from localStorage or use defaults
    this.settings = this.loadSettings();
    this.currentConfig = this.settings.defaultConfig;
    this.replayBufferConfig = this.currentConfig.replayBuffer;
    this.stats = { ...DEFAULT_RECORDING_STATS };
    
    // Load recordings from localStorage
    this.loadRecordings();
    
    // Initialize built-in presets
    this.initializeBuiltInPresets();
    
    // Start stats update loop
    this.startStatsUpdateLoop();
    
    // Start disk space monitoring
    this.startDiskSpaceMonitoring();
    
    // Start replay buffer if enabled
    if (this.replayBufferConfig.enabled) {
      this.startReplayBuffer().catch(console.error);
    }
  }
  
  // ==========================================================================
  // RECORDING CONTROL
  // ==========================================================================
  
  async startRecording(config?: RecordingConfiguration): Promise<void> {
    if (!canStartRecording(this.stats.status)) {
      throw new Error('Cannot start recording in current state');
    }
    
    // Update configuration if provided
    if (config) {
      this.currentConfig = config;
    }
    
    // Update status
    this.stats.status = RecordingStatus.PREPARING;
    this.emit('recording-updated', this.currentSession!);
    
    try {
      // Create new session
      const sessionId = this.generateSessionId();
      const session: RecordingSession = {
        id: sessionId,
        name: this.generateSessionName(),
        status: RecordingStatus.PREPARING,
        startedAt: new Date(),
        endedAt: null,
        duration: 0,
        config: { ...this.currentConfig },
        stats: { ...this.stats },
      };
      
      this.currentSession = session;
      this.sessions.unshift(session);
      
      // Simulate preparation delay
      await this.delay(1000);
      
      // Start recording
      this.stats.status = RecordingStatus.RECORDING;
      session.status = RecordingStatus.RECORDING;
      
      this.emit('recording-started', session);
      this.emit('recording-updated', session);
      
    } catch (error) {
      this.stats.status = RecordingStatus.FAILED;
      if (this.currentSession) {
        this.currentSession.status = RecordingStatus.FAILED;
        this.currentSession.error = error instanceof Error ? error.message : String(error);
        this.emit('recording-failed', this.currentSession, this.currentSession.error);
      }
      throw error;
    }
  }
  
  async pauseRecording(): Promise<void> {
    if (!canPauseRecording(this.stats.status)) {
      throw new Error('Cannot pause recording in current state');
    }
    
    if (!this.currentSession) {
      throw new Error('No active recording session');
    }
    
    this.stats.status = RecordingStatus.PAUSED;
    this.currentSession.status = RecordingStatus.PAUSED;
    
    this.emit('recording-paused', this.currentSession);
    this.emit('recording-updated', this.currentSession);
  }
  
  async resumeRecording(): Promise<void> {
    if (!canResumeRecording(this.stats.status)) {
      throw new Error('Cannot resume recording in current state');
    }
    
    if (!this.currentSession) {
      throw new Error('No active recording session');
    }
    
    this.stats.status = RecordingStatus.RECORDING;
    this.currentSession.status = RecordingStatus.RECORDING;
    
    this.emit('recording-resumed', this.currentSession);
    this.emit('recording-updated', this.currentSession);
  }
  
  async stopRecording(): Promise<void> {
    if (!canStopRecording(this.stats.status)) {
      throw new Error('Cannot stop recording in current state');
    }
    
    if (!this.currentSession) {
      throw new Error('No active recording session');
    }
    
    // Update status
    this.stats.status = RecordingStatus.STOPPING;
    this.currentSession.status = RecordingStatus.STOPPING;
    this.emit('recording-updated', this.currentSession);
    
    try {
      // Simulate processing delay
      await this.delay(2000);
      
      // Complete recording
      this.stats.status = RecordingStatus.PROCESSING;
      this.currentSession.status = RecordingStatus.PROCESSING;
      
      // Generate metadata
      const metadata = this.generateMetadata(this.currentSession);
      
      // Update session
      this.currentSession.endedAt = new Date();
      this.currentSession.duration = this.stats.duration;
      this.currentSession.metadata = metadata;
      this.currentSession.status = RecordingStatus.COMPLETED;
      
      // Add to recordings
      this.recordings.unshift(metadata);
      this.saveRecordings();
      
      // Reset stats
      this.stats.status = RecordingStatus.IDLE;
      this.stats.duration = 0;
      this.stats.fileSize = 0;
      
      this.emit('recording-completed', this.currentSession, metadata);
      this.emit('recording-stopped', this.currentSession);
      this.emit('recording-updated', this.currentSession);
      
      // Clear current session
      this.currentSession = null;
      
    } catch (error) {
      this.stats.status = RecordingStatus.FAILED;
      if (this.currentSession) {
        this.currentSession.status = RecordingStatus.FAILED;
        this.currentSession.error = error instanceof Error ? error.message : String(error);
        this.emit('recording-failed', this.currentSession, this.currentSession.error);
      }
      throw error;
    }
  }
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  async startReplayBuffer(): Promise<void> {
    if (this.replayBufferStatus === ReplayBufferStatus.BUFFERING) {
      return;
    }
    
    this.replayBufferStatus = ReplayBufferStatus.BUFFERING;
    
    // Simulate buffer warming
    await this.delay(500);
    
    this.emit('replay-buffer-ready');
  }
  
  async stopReplayBuffer(): Promise<void> {
    this.replayBufferStatus = ReplayBufferStatus.INACTIVE;
  }
  
  async saveReplayBuffer(): Promise<void> {
    if (this.replayBufferStatus !== ReplayBufferStatus.BUFFERING) {
      throw new Error('Replay buffer is not active');
    }
    
    this.replayBufferStatus = ReplayBufferStatus.SAVING;
    
    // Simulate save delay
    await this.delay(2000);
    
    this.replayBufferStatus = ReplayBufferStatus.SAVED;
    
    // Add to recordings
    const metadata = this.generateReplayMetadata();
    this.recordings.unshift(metadata);
    this.saveRecordings();
    
    // Reset buffer status after delay
    setTimeout(() => {
      this.replayBufferStatus = ReplayBufferStatus.BUFFERING;
    }, 5000);
  }
  
  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================
  
  getConfiguration(): RecordingConfiguration {
    return { ...this.currentConfig };
  }
  
  setConfiguration(config: RecordingConfiguration): void {
    this.currentConfig = config;
    this.saveSettings();
  }
  
  // ==========================================================================
  // PRESETS
  // ==========================================================================
  
  getPresets(): RecordingPreset[] {
    return [...this.settings.presets];
  }
  
  getPreset(id: string): RecordingPreset | undefined {
    return this.settings.presets.find(p => p.id === id);
  }
  
  createPreset(preset: RecordingPreset): void {
    this.settings.presets.push(preset);
    this.saveSettings();
  }
  
  updatePreset(preset: RecordingPreset): void {
    const index = this.settings.presets.findIndex(p => p.id === preset.id);
    if (index !== -1) {
      this.settings.presets[index] = preset;
      this.saveSettings();
    }
  }
  
  deletePreset(id: string): void {
    const preset = this.getPreset(id);
    if (preset && !preset.isBuiltIn) {
      this.settings.presets = this.settings.presets.filter(p => p.id !== id);
      this.saveSettings();
    }
  }
  
  applyPreset(id: string): void {
    const preset = this.getPreset(id);
    if (preset) {
      this.currentConfig = { ...preset.config };
    }
  }
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  getSettings(): RecordingSettings {
    return { ...this.settings };
  }
  
  updateSettings(updates: Partial<RecordingSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }
  
  resetSettings(): void {
    this.settings = { ...DEFAULT_RECORDING_SETTINGS };
    this.currentConfig = { ...DEFAULT_RECORDING_CONFIG };
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }
  
  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================
  
  getCurrentSession(): RecordingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
  
  getSession(id: string): RecordingSession | undefined {
    return this.sessions.find(s => s.id === id);
  }
  
  getSessions(): RecordingSession[] {
    return [...this.sessions];
  }
  
  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  getRecordings(): RecordingMetadata[] {
    return [...this.recordings];
  }
  
  getRecording(id: string): RecordingMetadata | undefined {
    return this.recordings.find(r => r.id === id);
  }
  
  deleteRecording(id: string): void {
    this.recordings = this.recordings.filter(r => r.id !== id);
    this.saveRecordings();
  }
  
  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  
  getStats(): RecordingStats {
    return { ...this.stats };
  }
  
  getDiskInfo(): RecordingDiskInfo {
    return this.calculateDiskInfo();
  }
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  getReplayBufferStatus(): ReplayBufferStatus {
    return this.replayBufferStatus;
  }
  
  getReplayBufferConfig(): ReplayBufferConfig {
    return { ...this.replayBufferConfig };
  }
  
  setReplayBufferConfig(config: ReplayBufferConfig): void {
    this.replayBufferConfig = config;
    this.currentConfig.replayBuffer = config;
    this.saveSettings();
  }
  
  // ==========================================================================
  // UTILITY
  // ==========================================================================
  
  calculateEstimatedSize(duration: number, bitrate: number): number {
    // Size = (bitrate * duration) / 8 = bytes
    const videoSize = (bitrate * 1000 * duration) / 8;
    const audioSize = (this.currentConfig.audio.bitrate * 1000 * duration) / 8;
    return Math.floor(videoSize + audioSize);
  }
  
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  private generateSessionId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateSessionName(): string {
    const date = new Date();
    return `Recording ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }
  
  private generateMetadata(session: RecordingSession): RecordingMetadata {
    const filename = this.generateFilename(session);
    const filePath = `${session.config.file.directory}/${filename}.${session.config.file.format}`;
    
    return {
      id: `rec_${Date.now()}`,
      filename: filename,
      filePath: filePath,
      format: session.config.file.format,
      category: session.config.file.category,
      tags: [...session.config.file.tags],
      duration: this.stats.duration,
      fileSize: this.stats.fileSize,
      resolution: session.config.video.resolution,
      videoCodec: session.config.video.codec,
      audioCodec: session.config.audio.codec,
      bitrate: session.config.video.bitrate,
      frameRate: session.config.video.resolution.frameRate,
      createdAt: session.startedAt!,
      modifiedAt: new Date(),
      favorite: false,
      protected: false,
    };
  }
  
  private generateReplayMetadata(): RecordingMetadata {
    return {
      id: `replay_${Date.now()}`,
      filename: `Replay_${new Date().toISOString().replace(/[:.]/g, '-')}`,
      filePath: `${this.replayBufferConfig.savePath}/Replay_${Date.now()}.${this.replayBufferConfig.format}`,
      format: this.replayBufferConfig.format,
      category: RecordingCategory.HIGHLIGHT,
      tags: ['replay', 'highlight'],
      duration: this.replayBufferConfig.duration,
      fileSize: this.calculateEstimatedSize(this.replayBufferConfig.duration, this.currentConfig.video.bitrate),
      resolution: this.currentConfig.video.resolution,
      videoCodec: this.currentConfig.video.codec,
      audioCodec: this.currentConfig.audio.codec,
      bitrate: this.currentConfig.video.bitrate,
      frameRate: this.currentConfig.video.resolution.frameRate,
      createdAt: new Date(),
      modifiedAt: new Date(),
      favorite: false,
      protected: false,
    };
  }
  
  private generateFilename(session: RecordingSession): string {
    const pattern = session.config.file.filenamePattern;
    const date = new Date();
    
    return pattern
      .replace('{date}', date.toISOString().split('T')[0])
      .replace('{time}', date.toTimeString().split(' ')[0].replace(/:/g, '-'))
      .replace('{name}', session.name);
  }
  
  private loadSettings(): RecordingSettings {
    try {
      const stored = localStorage.getItem('recording-engine-pro-settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_RECORDING_SETTINGS };
  }
  
  private saveSettings(): void {
    try {
      localStorage.setItem('recording-engine-pro-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  private loadRecordings(): void {
    try {
      const stored = localStorage.getItem('recording-engine-pro-recordings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.recordings = parsed.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          modifiedAt: new Date(r.modifiedAt),
        }));
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  }
  
  private saveRecordings(): void {
    try {
      localStorage.setItem('recording-engine-pro-recordings', JSON.stringify(this.recordings));
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  }
  
  private initializeBuiltInPresets(): void {
    // Add built-in presets if not already present
    BUILTIN_RECORDING_PRESETS.forEach(preset => {
      if (!this.settings.presets.find(p => p.id === preset.id)) {
        this.settings.presets.push(preset);
      }
    });
    this.saveSettings();
  }
  
  private startStatsUpdateLoop(): void {
    this.statsUpdateInterval = setInterval(() => {
      this.updateStats();
    }, 1000);
  }
  
  private updateStats(): void {
    if (isRecordingActive(this.stats.status) && this.currentSession) {
      this.stats.duration++;
      this.stats.fileSize = this.calculateEstimatedSize(
        this.stats.duration,
        this.currentConfig.video.bitrate
      );
      this.stats.estimatedSize = this.calculateEstimatedSize(
        this.stats.duration + 300, // Estimate 5 more minutes
        this.currentConfig.video.bitrate
      );
      
      // Update session stats
      this.currentSession.stats = { ...this.stats };
      this.currentSession.duration = this.stats.duration;
      
      this.emit('recording-updated', this.currentSession);
    }
    
    // Simulate other stats
    this.stats.bitrate = this.currentConfig.video.bitrate;
    this.stats.frameRate = this.currentConfig.video.resolution.frameRate;
    this.stats.cpuUsage = 30 + Math.random() * 20;
    this.stats.gpuUsage = 40 + Math.random() * 20;
    this.stats.memoryUsage = 500 + Math.random() * 200;
    
    const diskInfo = this.getDiskInfo();
    this.stats.diskUsage = diskInfo.usedSpace / diskInfo.totalSpace * 100;
  }
  
  private startDiskSpaceMonitoring(): void {
    setInterval(() => {
      const diskInfo = this.getDiskInfo();
      const freeSpacePercent = (diskInfo.freeSpace / diskInfo.totalSpace) * 100;
      
      if (freeSpacePercent < 10) {
        this.emit('disk-space-warning', diskInfo);
      }
    }, 30000); // Check every 30 seconds
  }
  
  private calculateDiskInfo(): RecordingDiskInfo {
    // Simulate disk info
    const totalSpace = 1024 * 1024 * 1024 * 1024; // 1 TB
    const usedSpace = totalSpace * (0.4 + Math.random() * 0.1);
    const freeSpace = totalSpace - usedSpace;
    const avgBitrate = (this.currentConfig.video.bitrate + this.currentConfig.audio.bitrate) * 1000;
    const estimatedRecordTime = (freeSpace * 0.8) / avgBitrate; // 80% of free space
    
    return {
      totalSpace,
      usedSpace,
      freeSpace,
      recordingPath: this.currentConfig.file.directory,
      estimatedRecordTime,
    };
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let recordingEngineProManagerInstance: RecordingEngineProManager | null = null;

export function getRecordingEngineProManager(): RecordingEngineProManager {
  if (!recordingEngineProManagerInstance) {
    recordingEngineProManagerInstance = new RecordingEngineProManager();
  }
  return recordingEngineProManagerInstance;
}