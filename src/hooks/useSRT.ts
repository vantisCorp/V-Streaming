/**
 * V-Streaming SRT Protocol React Hook
 * Provides state and operations for SRT connections
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { srtManager } from '../services/SRTManager';
import type {
  SRTConfig,
  SRTStatistics,
  SRTConnectionStatus,
  SRTConnectionInfo,
  SRTError,
  SRTConnectionMode,
  SRTEncryptionType,
} from '../types/srt';

export const useSRT = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SRTConfig>(srtManager.getConfig());
  const [status, setStatus] = useState<SRTConnectionStatus>(srtManager.getStatus());
  const [statistics, setStatistics] = useState<SRTStatistics>(srtManager.getStatistics());
  const [connectionInfo, setConnectionInfo] = useState<SRTConnectionInfo | null>(srtManager.getConnectionInfo());
  const [errors, setErrors] = useState<SRTError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    setErrors(srtManager.getErrorHistory());
  }, []);

  // Event handlers
  useEffect(() => {
    const handleStatusChanged = (newStatus: SRTConnectionStatus) => {
      setStatus(newStatus);
    };

    const handleStatisticsUpdated = (stats: SRTStatistics) => {
      setStatistics(stats);
    };

    const handleError = (error: SRTError) => {
      setErrors(prev => [...prev, error]);
    };

    const handleConfigChanged = (newConfig: SRTConfig) => {
      setConfig(newConfig);
    };

    const handleReconnecting = (attempt: number, maxAttempts: number) => {
      console.log(`Reconnecting... Attempt ${attempt} of ${maxAttempts}`);
    };

    const handleReconnected = () => {
      console.log('Reconnected successfully');
    };

    const handleAdaptiveBitrateChanged = (bitrate: number) => {
      console.log(`Adaptive bitrate changed to ${bitrate} Mbps`);
    };

    srtManager.on('statusChanged', handleStatusChanged);
    srtManager.on('statisticsUpdated', handleStatisticsUpdated);
    srtManager.on('error', handleError);
    srtManager.on('configChanged', handleConfigChanged);
    srtManager.on('reconnecting', handleReconnecting);
    srtManager.on('reconnected', handleReconnected);
    srtManager.on('adaptiveBitrateChanged', handleAdaptiveBitrateChanged);

    return () => {
      srtManager.off('statusChanged', handleStatusChanged);
      srtManager.off('statisticsUpdated', handleStatisticsUpdated);
      srtManager.off('error', handleError);
      srtManager.off('configChanged', handleConfigChanged);
      srtManager.off('reconnecting', handleReconnecting);
      srtManager.off('reconnected', handleReconnected);
      srtManager.off('adaptiveBitrateChanged', handleAdaptiveBitrateChanged);
    };
  }, []);

  // Config operations
  const updateConfig = useCallback(async (newConfig: Partial<SRTConfig>) => {
    setIsLoading(true);
    try {
      await srtManager.setConfig(newConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connection operations
  const connect = useCallback(async (host: string, port: number) => {
    setIsLoading(true);
    try {
      await srtManager.connect(host, port);
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      await srtManager.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility operations
  const resetToDefaults = useCallback(() => {
    try {
      srtManager.resetToDefaults();
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      throw error;
    }
  }, []);

  const clearErrors = useCallback(() => {
    srtManager.clearErrorHistory();
    setErrors([]);
  }, []);

  // Computed values
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isReconnecting = status === 'reconnecting';
  const hasError = status === 'error';
  const canChangeSettings = status === 'disconnected';

  const supportedModes = srtManager.getSupportedModes();
  const supportedEncryptions = srtManager.getSupportedEncryptions();

  return {
    // State
    config,
    status,
    statistics,
    connectionInfo,
    errors,
    isLoading,
    isConnected,
    isConnecting,
    isReconnecting,
    hasError,
    canChangeSettings,
    
    // Supported options
    supportedModes,
    supportedEncryptions,
    
    // Operations
    updateConfig,
    connect,
    disconnect,
    resetToDefaults,
    clearErrors,
  };
};