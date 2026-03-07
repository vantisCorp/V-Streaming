import { EventEmitter } from 'events';
import {
  StreamPlatformConfig,
  MultiPlatformConfig,
  StreamAnalytics,
  MultiPlatformAnalytics,
  PlatformHealth,
  StreamingPlatform,
  PLATFORM_PRESETS,
  DEFAULT_MULTIPLATFORM_CONFIG,
  AggregatedMetrics,
  SyncSettings,
  ChatIntegrationSettings,
  HealthMonitoringSettings,
} from '../types/multiPlatform';

interface MultiPlatformEvents {
  platformConnected: (platform: StreamPlatformConfig) => void;
  platformDisconnected: (platform: string) => void;
  platformError: (platform: string, error: string) => void;
  healthUpdated: (platform: string, health: PlatformHealth) => void;
  configChanged: (config: MultiPlatformConfig) => void;
  analyticsUpdated: (analytics: MultiPlatformAnalytics) => void;
  streamStarted: (platforms: string[]) => void;
  streamStopped: (platforms: string[]) => void;
}

export class MultiPlatformManager extends EventEmitter {
  private config: MultiPlatformConfig;
  private activeStreams: Map<string, StreamPlatformConfig> = new Map();
  private analytics: Map<string, StreamAnalytics> = new Map();
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private storageKey = 'vstreaming_multiplatform_config';
  private analyticsKey = 'vstreaming_multiplatform_analytics';

  constructor() {
    super();
    this.config = {
      ...DEFAULT_MULTIPLATFORM_CONFIG,
      platforms: [], // Create a new empty array instead of referencing the original
    };
    this.loadFromStorage();
  }

  // ============ Configuration Management ============

  /**
   * Get current multi-platform configuration
   */
  getConfig(): MultiPlatformConfig {
    return { ...this.config };
  }

  /**
   * Update multi-platform configuration
   */
  updateConfig(updates: Partial<MultiPlatformConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      ...DEFAULT_MULTIPLATFORM_CONFIG,
      platforms: [], // Create a new empty array instead of referencing the original
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);
  }

  // ============ Platform Management ============

  /**
   * Add a new platform configuration
   */
  addPlatform(platformConfig: Omit<StreamPlatformConfig, 'health' | 'isActive'>): StreamPlatformConfig {
    const newPlatform: StreamPlatformConfig = {
      ...platformConfig,
      health: {
        status: 'disconnected',
        bitrate: 0,
        fps: 0,
        droppedFrames: 0,
        latency: 0,
        lastUpdate: new Date(),
      },
      isActive: false,
    };

    this.config.platforms.push(newPlatform);
    this.saveToStorage();
    this.emit('configChanged', this.config);
    return newPlatform;
  }

  /**
   * Update an existing platform configuration
   */
  updatePlatform(platformId: string, updates: Partial<StreamPlatformConfig>): StreamPlatformConfig | null {
    const index = this.config.platforms.findIndex(p => p.name === platformId);
    if (index === -1) return null;

    this.config.platforms[index] = {
      ...this.config.platforms[index],
      ...updates,
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);
    return this.config.platforms[index];
  }

  /**
   * Remove a platform configuration
   */
  removePlatform(platformId: string): boolean {
    const index = this.config.platforms.findIndex(p => p.name === platformId);
    if (index === -1) return false;

    this.config.platforms.splice(index, 1);
    this.saveToStorage();
    this.emit('configChanged', this.config);
    return true;
  }

  /**
   * Get platform by ID
   */
  getPlatform(platformId: string): StreamPlatformConfig | undefined {
    return this.config.platforms.find(p => p.name === platformId);
  }

  /**
   * Get all configured platforms
   */
  getPlatforms(): StreamPlatformConfig[] {
    return [...this.config.platforms];
  }

  /**
   * Get platform presets
   */
  getPlatformPresets() {
    return PLATFORM_PRESETS;
  }

  // ============ Stream Control ============

  /**
   * Start streaming to a specific platform
   */
  async startStream(platformId: string): Promise<void> {
    const platform = this.getPlatform(platformId);
    if (!platform) {
      throw new Error(`Platform ${platformId} not found`);
    }

    try {
      // Simulate connection process
      platform.health.status = 'connecting';
      this.emit('healthUpdated', platformId, platform.health);

      await this.simulateConnection(platform);

      platform.isActive = true;
      platform.health.status = 'connected';
      platform.health.lastUpdate = new Date();
      this.activeStreams.set(platformId, platform);

      this.emit('platformConnected', platform);

      // Initialize analytics
      const analytics: StreamAnalytics = {
        platform: platform.platform,
        viewerCount: 0,
        peakViewers: 0,
        duration: 0,
        averageBitrate: platform.bitrate,
        droppedFrames: 0,
        totalMessages: 0,
        totalFollowers: 0,
        newFollowers: 0,
        totalSubscribers: 0,
        newSubscribers: 0,
        totalDonations: 0,
        totalDonationsAmount: 0,
        startTime: new Date(),
      };
      this.analytics.set(platformId, analytics);

      // Start health monitoring if enabled
      if (this.config.healthMonitoring.enabled) {
        this.startHealthMonitoring();
      }
    } catch (error) {
      platform.health.status = 'error';
      platform.health.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('platformError', platformId, platform.health.error);
      throw error;
    }
  }

  /**
   * Stop streaming to a specific platform
   */
  async stopStream(platformId: string): Promise<void> {
    const platform = this.getPlatform(platformId);
    if (!platform) return;

    platform.isActive = false;
    platform.health.status = 'disconnected';
    this.activeStreams.delete(platformId);

    // Finalize analytics
    const analytics = this.analytics.get(platformId);
    if (analytics) {
      analytics.endTime = new Date();
      analytics.duration = Math.floor(
        (analytics.endTime.getTime() - analytics.startTime.getTime()) / 1000
      );
      this.saveAnalytics();
    }

    this.emit('platformDisconnected', platformId);

    // Stop health monitoring if no active streams
    if (this.activeStreams.size === 0) {
      this.stopHealthMonitoring();
    }
  }

  /**
   * Start streaming to all enabled platforms
   */
  async startAllStreams(): Promise<string[]> {
    const enabledPlatforms = this.config.platforms
      .filter(p => p.enabled)
      .map(p => p.name);

    const results: string[] = [];
    const errors: string[] = [];

    for (const platformId of enabledPlatforms) {
      try {
        await this.startStream(platformId);
        results.push(platformId);
      } catch (error) {
        errors.push(`${platformId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (results.length > 0) {
      this.emit('streamStarted', results);
    }

    return results;
  }

  /**
   * Stop streaming to all platforms
   */
  async stopAllStreams(): Promise<string[]> {
    const activePlatforms = Array.from(this.activeStreams.keys());
    
    for (const platformId of activePlatforms) {
      await this.stopStream(platformId);
    }

    if (activePlatforms.length > 0) {
      this.emit('streamStopped', activePlatforms);
    }

    return activePlatforms;
  }

  // ============ Health Monitoring ============

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.checkPlatformHealth();
    }, this.config.healthMonitoring.checkInterval * 1000);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Check health of all active platforms
   */
  private checkPlatformHealth(): void {
    for (const [platformId, platform] of this.activeStreams) {
      this.updatePlatformHealth(platformId);
    }
  }

  /**
   * Update health status for a platform
   */
  private updatePlatformHealth(platformId: string): void {
    const platform = this.activeStreams.get(platformId);
    if (!platform) return;

    // Simulate health metrics
    const jitter = Math.random() * 0.1 - 0.05; // ±5% jitter
    platform.health.bitrate = Math.round(platform.bitrate * (1 + jitter));
    platform.health.fps = platform.fps;
    platform.health.droppedFrames = Math.max(0, platform.health.droppedFrames + Math.floor(Math.random() * 2));
    platform.health.latency = Math.floor(Math.random() * 500) + 100;
    platform.health.lastUpdate = new Date();

    // Check for alerts
    if (this.config.healthMonitoring.alertOnLowBitrate && 
        platform.health.bitrate < this.config.healthMonitoring.minBitrateThreshold) {
      this.emit('platformError', platformId, 'Low bitrate detected');
    }

    if (this.config.healthMonitoring.alertOnDroppedFrames && 
        platform.health.droppedFrames > this.config.healthMonitoring.maxDroppedFramesThreshold) {
      this.emit('platformError', platformId, 'High dropped frames detected');
    }

    this.emit('healthUpdated', platformId, platform.health);
  }

  // ============ Analytics ============

  /**
   * Get analytics for all platforms
   */
  getAnalytics(): MultiPlatformAnalytics {
    const platformAnalytics = Array.from(this.analytics.values());
    
    const aggregatedMetrics = this.aggregateMetrics(platformAnalytics);
    
    return {
      totalViewers: platformAnalytics.reduce((sum, a) => sum + a.viewerCount, 0),
      peakTotalViewers: platformAnalytics.reduce((sum, a) => sum + a.peakViewers, 0),
      averageViewers: platformAnalytics.reduce((sum, a) => sum + a.viewerCount, 0) / Math.max(1, platformAnalytics.length),
      totalDuration: platformAnalytics.reduce((sum, a) => sum + a.duration, 0),
      platformAnalytics,
      aggregatedMetrics,
    };
  }

  /**
   * Get analytics for a specific platform
   */
  getPlatformAnalytics(platformId: string): StreamAnalytics | undefined {
    return this.analytics.get(platformId);
  }

  /**
   * Update analytics for a platform
   */
  updatePlatformAnalytics(platformId: string, updates: Partial<StreamAnalytics>): void {
    const analytics = this.analytics.get(platformId);
    if (!analytics) return;

    Object.assign(analytics, updates);
    
    // Update peak viewers
    if (updates.viewerCount && updates.viewerCount > analytics.peakViewers) {
      analytics.peakViewers = updates.viewerCount;
    }

    this.emit('analyticsUpdated', this.getAnalytics());
  }

  /**
   * Aggregate metrics across platforms
   */
  private aggregateMetrics(platformAnalytics: StreamAnalytics[]): AggregatedMetrics {
    const totalMessages = platformAnalytics.reduce((sum, a) => sum + a.totalMessages, 0);
    const totalFollowers = platformAnalytics.reduce((sum, a) => sum + a.totalFollowers, 0);
    const newFollowers = platformAnalytics.reduce((sum, a) => sum + a.newFollowers, 0);
    const totalSubscribers = platformAnalytics.reduce((sum, a) => sum + a.totalSubscribers, 0);
    const newSubscribers = platformAnalytics.reduce((sum, a) => sum + a.newSubscribers, 0);
    const totalDonations = platformAnalytics.reduce((sum, a) => sum + a.totalDonations, 0);
    const totalDonationsAmount = platformAnalytics.reduce((sum, a) => sum + a.totalDonationsAmount, 0);

    // Find most active platform (by messages)
    const mostActivePlatform = platformAnalytics.reduce((max, a) => 
      a.totalMessages > (max?.totalMessages || 0) ? a : max, 
      platformAnalytics[0]
    );

    // Find fastest growing platform (by new followers)
    const fastestGrowingPlatform = platformAnalytics.reduce((max, a) => 
      a.newFollowers > (max?.newFollowers || 0) ? a : max,
      platformAnalytics[0]
    );

    return {
      totalMessages,
      totalFollowers,
      newFollowers,
      totalSubscribers,
      newSubscribers,
      totalDonations,
      totalDonationsAmount,
      mostActivePlatform: mostActivePlatform?.platform || 'twitch',
      fastestGrowingPlatform: fastestGrowingPlatform?.platform || 'twitch',
    };
  }

  // ============ Settings Management ============

  /**
   * Update sync settings
   */
  updateSyncSettings(settings: Partial<SyncSettings>): void {
    this.config.syncSettings = {
      ...this.config.syncSettings,
      ...settings,
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);
  }

  /**
   * Update chat integration settings
   */
  updateChatIntegrationSettings(settings: Partial<ChatIntegrationSettings>): void {
    this.config.chatIntegration = {
      ...this.config.chatIntegration,
      ...settings,
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);
  }

  /**
   * Update health monitoring settings
   */
  updateHealthMonitoringSettings(settings: Partial<HealthMonitoringSettings>): void {
    this.config.healthMonitoring = {
      ...this.config.healthMonitoring,
      ...settings,
    };
    this.saveToStorage();
    this.emit('configChanged', this.config);

    // Restart health monitoring if needed
    if (this.activeStreams.size > 0 && this.config.healthMonitoring.enabled) {
      this.stopHealthMonitoring();
      this.startHealthMonitoring();
    }
  }

  // ============ Connection Simulation ============

  /**
   * Simulate platform connection
   */
  private async simulateConnection(platform: StreamPlatformConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate connection time
      const connectionTime = Math.random() * 2000 + 500;
      
      setTimeout(() => {
        // 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      }, connectionTime);
    });
  }

  // ============ Storage ============

  /**
   * Save configuration to storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save multi-platform config:', error);
    }
  }

  /**
   * Load configuration from storage
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.config = { ...DEFAULT_MULTIPLATFORM_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load multi-platform config:', error);
    }
  }

  /**
   * Save analytics to storage
   */
  private saveAnalytics(): void {
    try {
      const analyticsData = Object.fromEntries(this.analytics);
      localStorage.setItem(this.analyticsKey, JSON.stringify(analyticsData));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  /**
   * Get active stream count
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }

  /**
   * Check if any stream is active
   */
  isStreaming(): boolean {
    return this.activeStreams.size > 0;
  }

  /**
   * Get streaming status for all platforms
   */
  getStreamingStatus(): Record<string, { active: boolean; health: PlatformHealth }> {
    const status: Record<string, { active: boolean; health: PlatformHealth }> = {};
    
    for (const platform of this.config.platforms) {
      const activePlatform = this.activeStreams.get(platform.name);
      status[platform.name] = {
        active: !!activePlatform,
        health: activePlatform?.health || platform.health,
      };
    }
    
    return status;
  }
}

// Create singleton instance
export const multiPlatformManager = new MultiPlatformManager();