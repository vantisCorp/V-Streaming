import { useState, useEffect, useCallback } from 'react';
import { multiPlatformManager } from '../services/MultiPlatformManager';
import {
  StreamPlatformConfig,
  MultiPlatformConfig,
  StreamAnalytics,
  MultiPlatformAnalytics,
  PlatformHealth,
  StreamingPlatform,
  SyncSettings,
  ChatIntegrationSettings,
  HealthMonitoringSettings,
} from '../types/multiPlatform';

export function useMultiPlatform() {
  const [config, setConfig] = useState<MultiPlatformConfig>(multiPlatformManager.getConfig());
  const [analytics, setAnalytics] = useState<MultiPlatformAnalytics>(multiPlatformManager.getAnalytics());
  const [streamingStatus, setStreamingStatus] = useState(multiPlatformManager.getStreamingStatus());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to events
  useEffect(() => {
    const handleConfigChanged = (newConfig: MultiPlatformConfig) => {
      setConfig(newConfig);
    };

    const handlePlatformConnected = (platform: StreamPlatformConfig) => {
      setStreamingStatus(multiPlatformManager.getStreamingStatus());
    };

    const handlePlatformDisconnected = (platformId: string) => {
      setStreamingStatus(multiPlatformManager.getStreamingStatus());
    };

    const handlePlatformError = (platformId: string, errorMsg: string) => {
      setError(`${platformId}: ${errorMsg}`);
    };

    const handleHealthUpdated = (platformId: string, health: PlatformHealth) => {
      setStreamingStatus(multiPlatformManager.getStreamingStatus());
    };

    const handleAnalyticsUpdated = (newAnalytics: MultiPlatformAnalytics) => {
      setAnalytics(newAnalytics);
    };

    multiPlatformManager.on('configChanged', handleConfigChanged);
    multiPlatformManager.on('platformConnected', handlePlatformConnected);
    multiPlatformManager.on('platformDisconnected', handlePlatformDisconnected);
    multiPlatformManager.on('platformError', handlePlatformError);
    multiPlatformManager.on('healthUpdated', handleHealthUpdated);
    multiPlatformManager.on('analyticsUpdated', handleAnalyticsUpdated);

    return () => {
      multiPlatformManager.off('configChanged', handleConfigChanged);
      multiPlatformManager.off('platformConnected', handlePlatformConnected);
      multiPlatformManager.off('platformDisconnected', handlePlatformDisconnected);
      multiPlatformManager.off('platformError', handlePlatformError);
      multiPlatformManager.off('healthUpdated', handleHealthUpdated);
      multiPlatformManager.off('analyticsUpdated', handleAnalyticsUpdated);
    };
  }, []);

  // Configuration
  const updateConfig = useCallback((updates: Partial<MultiPlatformConfig>) => {
    multiPlatformManager.updateConfig(updates);
  }, []);

  const resetConfig = useCallback(() => {
    multiPlatformManager.resetConfig();
  }, []);

  // Platform management
  const addPlatform = useCallback((platformConfig: Omit<StreamPlatformConfig, 'health' | 'isActive'>) => {
    return multiPlatformManager.addPlatform(platformConfig);
  }, []);

  const updatePlatform = useCallback((platformId: string, updates: Partial<StreamPlatformConfig>) => {
    return multiPlatformManager.updatePlatform(platformId, updates);
  }, []);

  const removePlatform = useCallback((platformId: string) => {
    return multiPlatformManager.removePlatform(platformId);
  }, []);

  const getPlatform = useCallback((platformId: string) => {
    return multiPlatformManager.getPlatform(platformId);
  }, []);

  const getPlatforms = useCallback(() => {
    return multiPlatformManager.getPlatforms();
  }, []);

  const getPlatformPresets = useCallback(() => {
    return multiPlatformManager.getPlatformPresets();
  }, []);

  // Stream control
  const startStream = useCallback(async (platformId: string) => {
    setLoading(true);
    setError(null);
    try {
      await multiPlatformManager.startStream(platformId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start stream';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopStream = useCallback(async (platformId: string) => {
    setLoading(true);
    setError(null);
    try {
      await multiPlatformManager.stopStream(platformId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop stream';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startAllStreams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await multiPlatformManager.startAllStreams();
      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start streams';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopAllStreams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await multiPlatformManager.stopAllStreams();
      return results;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop streams';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analytics
  const getAnalytics = useCallback(() => {
    return multiPlatformManager.getAnalytics();
  }, []);

  const getPlatformAnalytics = useCallback((platformId: string) => {
    return multiPlatformManager.getPlatformAnalytics(platformId);
  }, []);

  const updatePlatformAnalytics = useCallback((platformId: string, updates: Partial<StreamAnalytics>) => {
    multiPlatformManager.updatePlatformAnalytics(platformId, updates);
  }, []);

  // Settings
  const updateSyncSettings = useCallback((settings: Partial<SyncSettings>) => {
    multiPlatformManager.updateSyncSettings(settings);
  }, []);

  const updateChatIntegrationSettings = useCallback((settings: Partial<ChatIntegrationSettings>) => {
    multiPlatformManager.updateChatIntegrationSettings(settings);
  }, []);

  const updateHealthMonitoringSettings = useCallback((settings: Partial<HealthMonitoringSettings>) => {
    multiPlatformManager.updateHealthMonitoringSettings(settings);
  }, []);

  // Status
  const getActiveStreamCount = useCallback(() => {
    return multiPlatformManager.getActiveStreamCount();
  }, []);

  const isStreaming = useCallback(() => {
    return multiPlatformManager.isStreaming();
  }, []);

  const getStreamingStatus = useCallback(() => {
    return multiPlatformManager.getStreamingStatus();
  }, []);

  return {
    // State
    config,
    analytics,
    streamingStatus,
    loading,
    error,

    // Configuration
    updateConfig,
    resetConfig,

    // Platform management
    addPlatform,
    updatePlatform,
    removePlatform,
    getPlatform,
    getPlatforms,
    getPlatformPresets,

    // Stream control
    startStream,
    stopStream,
    startAllStreams,
    stopAllStreams,

    // Analytics
    getAnalytics,
    getPlatformAnalytics,
    updatePlatformAnalytics,

    // Settings
    updateSyncSettings,
    updateChatIntegrationSettings,
    updateHealthMonitoringSettings,

    // Status
    getActiveStreamCount,
    isStreaming,
    getStreamingStatus,

    // Utilities
    clearError: () => setError(null),
  };
}