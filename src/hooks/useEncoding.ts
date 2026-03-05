/**
 * V-Streaming Encoder Management React Hook
 * Provides state and operations for hardware encoding
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encoderManager } from '../services/EncoderManager';
import type {
  EncoderCapability,
  EncoderConfig,
  EncoderStatistics,
  EncoderPerformanceMetrics,
  EncoderError,
  PresetConfig,
  ResolutionPreset,
  FrameratePreset,
} from '../types/encoding';
import {
  EncoderBackend,
  CodecType,
  EncoderPreset,
  RateControlMode,
  H264Profile,
  HEVCProfile,
  EncoderStatus,
} from '../types/encoding';

export const useEncoding = () => {
  const { t } = useTranslation();
  const [availableBackends, setAvailableBackends] = useState<EncoderCapability[]>([]);
  const [currentBackend, setCurrentBackend] = useState<EncoderBackend>(encoderManager.getCurrentBackend());
  const [currentCodec, setCurrentCodec] = useState<CodecType>(encoderManager.getCurrentCodec());
  const [config, setConfig] = useState<EncoderConfig>(encoderManager.getConfig());
  const [status, setStatus] = useState<EncoderStatus>(encoderManager.getStatus());
  const [statistics, setStatistics] = useState<EncoderStatistics>(encoderManager.getStatistics());
  const [performanceMetrics, setPerformanceMetrics] = useState<EncoderPerformanceMetrics>({
    avgEncodeTime: 0,
    maxEncodeTime: 0,
    minEncodeTime: Infinity,
    frameVariance: 0,
    droppedFrameRate: 0,
    bitrateVariance: 0,
    timestamp: Date.now(),
  });
  const [errors, setErrors] = useState<EncoderError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    setAvailableBackends(encoderManager.getAvailableBackends());
    setErrors(encoderManager.getErrorHistory());
  }, []);

  // Event handlers
  useEffect(() => {
    const handleStatusChanged = (newStatus: EncoderStatus) => {
      setStatus(newStatus);
    };

    const handleStatisticsUpdated = (stats: EncoderStatistics) => {
      setStatistics(stats);
    };

    const handleError = (error: EncoderError) => {
      setErrors(prev => [...prev, error]);
    };

    const handleConfigChanged = (newConfig: EncoderConfig) => {
      setConfig(newConfig);
    };

    const handleBackendChanged = (backend: EncoderBackend) => {
      setCurrentBackend(backend);
    };

    const handleCodecChanged = (codec: CodecType) => {
      setCurrentCodec(codec);
    };

    encoderManager.on('statusChanged', handleStatusChanged);
    encoderManager.on('statisticsUpdated', handleStatisticsUpdated);
    encoderManager.on('error', handleError);
    encoderManager.on('configChanged', handleConfigChanged);
    encoderManager.on('backendChanged', handleBackendChanged);
    encoderManager.on('codecChanged', handleCodecChanged);

    return () => {
      encoderManager.off('statusChanged', handleStatusChanged);
      encoderManager.off('statisticsUpdated', handleStatisticsUpdated);
      encoderManager.off('error', handleError);
      encoderManager.off('configChanged', handleConfigChanged);
      encoderManager.off('backendChanged', handleBackendChanged);
      encoderManager.off('codecChanged', handleCodecChanged);
    };
  }, []);

  // Backend operations
  const setBackend = useCallback(async (backend: EncoderBackend) => {
    setIsLoading(true);
    try {
      await encoderManager.setBackend(backend);
    } catch (error) {
      console.error('Failed to set backend:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Codec operations
  const setCodec = useCallback(async (codec: CodecType) => {
    setIsLoading(true);
    try {
      await encoderManager.setCodec(codec);
    } catch (error) {
      console.error('Failed to set codec:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Config operations
  const updateConfig = useCallback(async (newConfig: Partial<EncoderConfig>) => {
    setIsLoading(true);
    try {
      await encoderManager.setConfig(newConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preset operations
  const applyPreset = useCallback(async (preset: PresetConfig) => {
    setIsLoading(true);
    try {
      await encoderManager.setConfig(preset.config);
    } catch (error) {
      console.error('Failed to apply preset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Encoding control
  const startEncoding = useCallback(async () => {
    setIsLoading(true);
    try {
      await encoderManager.start();
    } catch (error) {
      console.error('Failed to start encoding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopEncoding = useCallback(async () => {
    setIsLoading(true);
    try {
      await encoderManager.stop();
    } catch (error) {
      console.error('Failed to stop encoding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility operations
  const resetToDefaults = useCallback(() => {
    try {
      encoderManager.resetToDefaults();
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      throw error;
    }
  }, []);

  const clearErrors = useCallback(() => {
    encoderManager.clearErrorHistory();
    setErrors([]);
  }, []);

  const getRecommendedBitrate = useCallback((
    resolution: { width: number; height: number },
    fps: number
  ) => {
    return encoderManager.getRecommendedBitrate(resolution, fps);
  }, []);

  const getCapabilities = useCallback((backend: EncoderBackend) => {
    return encoderManager.getCapabilities(backend);
  }, []);

  // Computed values
  const isRunning = status === EncoderStatus.ENCODING;
  const isInitializing = status === EncoderStatus.INITIALIZING;
  const isStopping = status === EncoderStatus.STOPPING;
  const hasError = status === EncoderStatus.ERROR;
  const canChangeSettings = status === EncoderStatus.IDLE;

  const presetConfigs = encoderManager.getPresetConfigs();
  const resolutionPresets = encoderManager.getResolutionPresets();
  const frameratePresets = encoderManager.getFrameratePresets();

  return {
    // State
    availableBackends,
    currentBackend,
    currentCodec,
    config,
    status,
    statistics,
    performanceMetrics,
    errors,
    isLoading,
    isRunning,
    isInitializing,
    isStopping,
    hasError,
    canChangeSettings,
    
    // Presets
    presetConfigs,
    resolutionPresets,
    frameratePresets,
    
    // Operations
    setBackend,
    setCodec,
    updateConfig,
    applyPreset,
    startEncoding,
    stopEncoding,
    resetToDefaults,
    clearErrors,
    getRecommendedBitrate,
    getCapabilities,
    
    // Computed
    isEncodingPossible: availableBackends.length > 0,
  };
};