/**
 * V-Streaming Virtual Camera Manager Service
 * Manages virtual camera output for video conferencing applications
 */

import { EventEmitter } from 'eventemitter3';
import type {
  VirtualCameraConfig,
  VirtualCameraStats,
  VirtualCameraDevice,
  SourceType,
  IVirtualCameraManager,
  VirtualCameraEvents,
} from '../types/virtualCamera';
import {
  defaultVirtualCameraConfig,
  qualityPresetConfigs,
} from '../types/virtualCamera';

export class VirtualCameraManager
  extends EventEmitter
  implements IVirtualCameraManager
{
  private static instance: VirtualCameraManager;
  private config: VirtualCameraConfig;
  private status: import('../types/virtualCamera').VirtualCameraStatus;
  private stats: VirtualCameraStats;
  private devices: VirtualCameraDevice[];
  private availableSources: Array<{ id: string; name: string; type: SourceType }>;
  private startStopTimeout?: ReturnType<typeof setTimeout>;
  private statsInterval?: ReturnType<typeof setInterval>;
  private startTime?: number;
  private frameCounter: number;
  private droppedFrameCounter: number;

  private constructor() {
    super();
    this.config = this.loadConfig();
    this.status = 'stopped' as import('../types/virtualCamera').VirtualCameraStatus;
    this.stats = this.createInitialStats();
    this.devices = [];
    this.availableSources = [];
    this.frameCounter = 0;
    this.droppedFrameCounter = 0;
    
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VirtualCameraManager {
    if (!VirtualCameraManager.instance) {
      VirtualCameraManager.instance = new VirtualCameraManager();
    }
    return VirtualCameraManager.instance;
  }

  /**
   * Initialize the virtual camera manager
   */
  private async initialize(): Promise<void> {
    try {
      await this.scanDevices();
      await this.scanSources();
      console.log('[VirtualCameraManager] Initialized successfully');
    } catch (error) {
      console.error('[VirtualCameraManager] Initialization error:', error);
    }
  }

  /**
   * Create initial statistics
   */
  private createInitialStats(): VirtualCameraStats {
    return {
      status: 'stopped' as import('../types/virtualCamera').VirtualCameraStatus,
      framesRendered: 0,
      framesDropped: 0,
      frameRate: 0,
      averageFrameTime: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      memoryUsage: 0,
      currentBitrate: 0,
      averageBitrate: 0,
      uptime: 0,
      errorCount: 0,
    };
  }

  /**
   * Scan for available virtual camera devices
   */
  private async scanDevices(): Promise<void> {
    try {
      // In a real implementation, this would scan the system for virtual camera devices
      // For now, we'll return a mock device
      this.devices = [
        {
          id: 'vcam-default',
          name: 'V-Streaming Virtual Camera',
          description: 'V-Streaming virtual camera output',
          isDefault: true,
          isAvailable: true,
          supportedFormats: ['nv12', 'i420', 'rgb24', 'rgba'] as any,
          supportedResolutions: [
            '1280x720',
            '1920x1080',
            '2560x1440',
            '3840x2160',
          ] as any,
          supportedFrameRates: [
            15, 24, 30, 50, 60, 120, 144,
          ] as any,
          maxBufferSize: 10,
        },
      ];
      
      // Auto-select default device
      if (!this.config.deviceId && this.devices.length > 0) {
        const defaultDevice = this.devices.find((d) => d.isDefault);
        if (defaultDevice) {
          this.config.deviceId = defaultDevice.id;
          this.config.deviceName = defaultDevice.name;
          this.saveConfig();
        }
      }
      
      console.log('[VirtualCameraManager] Devices scanned:', this.devices.length);
    } catch (error) {
      console.error('[VirtualCameraManager] Error scanning devices:', error);
      this.devices = [];
    }
  }

  /**
   * Scan for available sources
   */
  private async scanSources(): Promise<void> {
    try {
      // In a real implementation, this would scan for available scenes and sources
      this.availableSources = [
        { id: 'main', name: 'Main Output', type: 'main_output' as SourceType },
        { id: 'preview', name: 'Preview', type: 'preview' as SourceType },
        { id: 'scene-1', name: 'Scene 1', type: 'scene' as SourceType },
        { id: 'scene-2', name: 'Scene 2', type: 'scene' as SourceType },
        { id: 'source-1', name: 'Webcam', type: 'source' as SourceType },
        { id: 'source-2', name: 'Game Capture', type: 'source' as SourceType },
      ];
      console.log('[VirtualCameraManager] Sources scanned:', this.availableSources.length);
    } catch (error) {
      console.error('[VirtualCameraManager] Error scanning sources:', error);
      this.availableSources = [];
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): VirtualCameraConfig {
    try {
      const saved = localStorage.getItem('virtualCameraConfig');
      if (saved) {
        return { ...defaultVirtualCameraConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('[VirtualCameraManager] Error loading config:', error);
    }
    return { ...defaultVirtualCameraConfig };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('virtualCameraConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('[VirtualCameraManager] Error saving config:', error);
    }
  }

  /**
   * Update statistics periodically
   */
  private updateStats(): void {
    // In a real implementation, this would query the actual stats from the virtual camera
    this.stats.frameRate = this.config.frameRate;
    this.stats.currentBitrate = this.config.bitrate;
    this.stats.averageBitrate = this.config.bitrate;
    
    if (this.startTime) {
      this.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    this.emit('stats-updated', this.stats);
  }

  /**
   * Get available devices
   */
  public async getAvailableDevices(): Promise<VirtualCameraDevice[]> {
    return this.devices;
  }

  /**
   * Get default device
   */
  public async getDefaultDevice(): Promise<VirtualCameraDevice | null> {
    return this.devices.find((d) => d.isDefault) || null;
  }

  /**
   * Get current configuration
   */
  public getConfig(): VirtualCameraConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<VirtualCameraConfig>): void {
    this.config = { ...this.config, ...config };
    this.config.lastModified = Date.now();
    this.saveConfig();
    this.emit('config-changed', this.config);
    
    // If quality preset changed, apply its configuration
    if (config.qualityPreset) {
      const presetConfig = qualityPresetConfigs[config.qualityPreset];
      if (presetConfig) {
        this.config = { ...this.config, ...presetConfig };
        this.saveConfig();
      }
    }
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.config = { ...defaultVirtualCameraConfig };
    this.saveConfig();
    this.emit('config-changed', this.config);
  }

  /**
   * Start the virtual camera
   */
  public async start(): Promise<void> {
    if (this.status === 'running' || this.status === 'starting') {
      console.log('[VirtualCameraManager] Already running or starting');
      return;
    }

    try {
      this.status = 'starting' as import("../types/virtualCamera").VirtualCameraStatus;
      this.emit('status-changed', this.status);

      // Check if device is available
      if (!this.config.deviceId) {
        throw new Error('No device selected');
      }

      const device = this.devices.find((d) => d.id === this.config.deviceId);
      if (!device || !device.isAvailable) {
        throw new Error('Selected device is not available');
      }

      // Apply delayed start if configured
      if (this.config.delayedStart && this.config.startDelay > 0) {
        await new Promise((resolve) => 
          setTimeout(resolve, this.config.startDelay)
        );
      }

      // In a real implementation, this would start the actual virtual camera
      // For now, we'll simulate the startup
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.startTime = Date.now();
      this.status = 'running' as import("../types/virtualCamera").VirtualCameraStatus;
      this.stats.status = this.status;
      this.stats.startTime = this.startTime;
      
      // Start statistics updates
      this.startStatsUpdates();
      
      this.emit('status-changed', this.status);
      this.emit('started', { 
        deviceId: this.config.deviceId, 
        timestamp: Date.now() 
      });
      
      console.log('[VirtualCameraManager] Started successfully');
    } catch (error) {
      this.status = 'error' as import("../types/virtualCamera").VirtualCameraStatus;
      this.stats.status = this.status;
      this.stats.errorCount++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.stats.lastErrorTime = Date.now();
      
      this.emit('status-changed', this.status);
      this.emit('error', {
        code: 'START_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      
      console.error('[VirtualCameraManager] Start failed:', error);
      throw error;
    }
  }

  /**
   * Stop the virtual camera
   */
  public async stop(): Promise<void> {
    if (this.status === 'stopped' || this.status === 'stopping') {
      console.log('[VirtualCameraManager] Already stopped or stopping');
      return;
    }

    try {
      this.status = 'stopping' as import("../types/virtualCamera").VirtualCameraStatus;
      this.emit('status-changed', this.status);

      // In a real implementation, this would stop the actual virtual camera
      // For now, we'll simulate the stop
      await new Promise((resolve) => setTimeout(resolve, 200));

      this.stopStatsUpdates();
      
      this.status = 'stopped' as import("../types/virtualCamera").VirtualCameraStatus;
      this.stats.status = this.status;
      this.startTime = undefined;
      
      this.emit('status-changed', this.status);
      this.emit('stopped', { 
        deviceId: this.config.deviceId, 
        timestamp: Date.now() 
      });
      
      console.log('[VirtualCameraManager] Stopped successfully');
    } catch (error) {
      this.status = 'error' as import("../types/virtualCamera").VirtualCameraStatus;
      this.stats.status = this.status;
      this.stats.errorCount++;
      
      this.emit('status-changed', this.status);
      this.emit('error', {
        code: 'STOP_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      
      console.error('[VirtualCameraManager] Stop failed:', error);
      throw error;
    }
  }

  /**
   * Restart the virtual camera
   */
  public async restart(): Promise<void> {
    try {
      await this.stop();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.start();
    } catch (error) {
      console.error('[VirtualCameraManager] Restart failed:', error);
      throw error;
    }
  }

  /**
   * Check if virtual camera is running
   */
  public isRunning(): boolean {
    return this.status === 'running';
  }

  /**
   * Get current status
   */
  public getStatus(): import('../types/virtualCamera').VirtualCameraStatus {
    return this.status;
  }

  /**
   * Get current statistics
   */
  public getStats(): VirtualCameraStats {
    return { ...this.stats };
  }

  /**
   * Set source for virtual camera
   */
  public setSource(sourceType: SourceType, sourceId?: string): void {
    this.config.sourceType = sourceType;
    this.config.sourceId = sourceId;
    this.config.sourceName = this.availableSources.find(
      (s) => s.id === sourceId
    )?.name;
    this.saveConfig();
  }

  /**
   * Get available sources
   */
  public getAvailableSources(): Array<{ id: string; name: string; type: SourceType }> {
    return [...this.availableSources];
  }

  /**
   * Get supported resolutions
   */
  public getSupportedResolutions() {
    return this.devices.length > 0 
      ? this.devices[0].supportedResolutions 
      : [];
  }

  /**
   * Get supported frame rates
   */
  public getSupportedFrameRates() {
    return this.devices.length > 0 
      ? this.devices[0].supportedFrameRates 
      : [];
  }

  /**
   * Start statistics updates
   */
  private startStatsUpdates(): void {
    this.stopStatsUpdates();
    this.statsInterval = setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  /**
   * Stop statistics updates
   */
  private stopStatsUpdates(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = undefined;
    }
  }

  /**
   * Clean up on destroy
   */
  public destroy(): void {
    this.stopStatsUpdates();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const virtualCameraManager = VirtualCameraManager.getInstance();