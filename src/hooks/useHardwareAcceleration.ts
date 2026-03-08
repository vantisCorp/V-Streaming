/**
 * React Hook for Hardware Acceleration
 * Provides hardware acceleration capabilities to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GPUVendor,
  HardwareEncoder,
  HardwareDecoder,
  EncoderPreset,
  RateControlMode,
  MultiPassMode,
  GPUDevice,
  EncoderCapabilities,
  HardwareEncoderSettings,
  HardwareDecoderSettings,
  HardwareAccelerationConfig,
  HardwareAccelerationStatus,
  GPUStatistics,
  EncodingSession,
  BenchmarkResult,
  HardwareAccelerationEvent,
  DEFAULT_HARDWARE_ACCELERATION_CONFIG
} from '../types/hardwareAcceleration';
import { 
  HardwareAccelerationService, 
  getHardwareAccelerationService 
} from '../services/HardwareAccelerationService';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseHardwareAccelerationReturn {
  // State
  isInitialized: boolean;
  isAvailable: boolean;
  status: HardwareAccelerationStatus;
  config: HardwareAccelerationConfig;
  gpuStats: GPUStatistics[];
  activeSessions: EncodingSession[];

  // GPU Management
  selectGPU: (gpuId: string) => void;
  selectBestGPU: () => GPUDevice | null;
  getAvailableGPUs: () => GPUDevice[];
  getEncoderCapabilities: (encoder: HardwareEncoder) => EncoderCapabilities | undefined;

  // Encoder Settings
  setActiveEncoder: (encoder: HardwareEncoder) => void;
  updateEncoderSettings: (settings: Partial<HardwareEncoderSettings>) => void;
  getEncoderSettings: () => HardwareEncoderSettings;

  // Decoder Settings
  setActiveDecoder: (decoder: HardwareDecoder) => void;
  updateDecoderSettings: (settings: Partial<HardwareDecoderSettings>) => void;

  // Sessions
  startEncodingSession: () => Promise<EncodingSession | null>;
  stopEncodingSession: (sessionId: string) => Promise<void>;

  // Benchmarking
  runBenchmark: (
    gpuId: string,
    encoder: HardwareEncoder,
    preset: EncoderPreset,
    resolution?: string,
    frameRate?: number,
    duration?: number
  ) => Promise<BenchmarkResult>;

  // Configuration
  updateConfig: (config: Partial<HardwareAccelerationConfig>) => void;
  refreshStats: () => void;

  // Events
  on: (event: HardwareAccelerationEvent, callback: (data: unknown) => void) => void;
  off: (event: HardwareAccelerationEvent, callback: (data: unknown) => void) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useHardwareAcceleration(): UseHardwareAccelerationReturn {
  const serviceRef = useRef<HardwareAccelerationService | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<HardwareAccelerationStatus>({
    isAvailable: false,
    isInitialized: false,
    activeGPU: null,
    activeEncoder: null,
    activeDecoder: null,
    availableGPUs: [],
    availableEncoders: [],
    errors: [],
    warnings: []
  });
  const [config, setConfig] = useState<HardwareAccelerationConfig>(
    DEFAULT_HARDWARE_ACCELERATION_CONFIG
  );
  const [gpuStats, setGpuStats] = useState<GPUStatistics[]>([]);
  const [activeSessions, setActiveSessions] = useState<EncodingSession[]>([]);

  // Initialize service
  useEffect(() => {
    serviceRef.current = getHardwareAccelerationService();

    const initializeService = async () => {
      await serviceRef.current?.initialize();
      setIsInitialized(true);
      setStatus(serviceRef.current?.getStatus() || status);
      setConfig(serviceRef.current?.getConfig() || config);
    };

    initializeService();

    // Set up event listeners
    const handleStatsUpdate = (data: unknown) => {
      const statsData = data as { stats: GPUStatistics[] };
      setGpuStats(statsData.stats);
    };

    const handleSettingsChange = () => {
      if (serviceRef.current) {
        setConfig(serviceRef.current.getConfig());
      }
    };

    const handleEncoderChange = () => {
      if (serviceRef.current) {
        setStatus(serviceRef.current.getStatus());
      }
    };

    serviceRef.current.on('statsUpdated', handleStatsUpdate);
    serviceRef.current.on('settingsChanged', handleSettingsChange);
    serviceRef.current.on('encoderChanged', handleEncoderChange);

    return () => {
      serviceRef.current?.off('statsUpdated', handleStatsUpdate);
      serviceRef.current?.off('settingsChanged', handleSettingsChange);
      serviceRef.current?.off('encoderChanged', handleEncoderChange);
      serviceRef.current?.shutdown();
    };
  }, []);

  // GPU Management
  const selectGPU = useCallback((gpuId: string): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setActiveGPU(gpuId);
    setStatus(serviceRef.current.getStatus());
  }, []);

  const selectBestGPU = useCallback((): GPUDevice | null => {
    if (!serviceRef.current) return null;
    const gpu = serviceRef.current.selectBestGPU();
    setStatus(serviceRef.current.getStatus());
    return gpu;
  }, []);

  const getAvailableGPUs = useCallback((): GPUDevice[] => {
    return status.availableGPUs;
  }, [status.availableGPUs]);

  const getEncoderCapabilities = useCallback(
    (encoder: HardwareEncoder): EncoderCapabilities | undefined => {
      return status.availableEncoders.find((e) => e.encoder === encoder);
    },
    [status.availableEncoders]
  );

  // Encoder Settings
  const setActiveEncoder = useCallback((encoder: HardwareEncoder): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setActiveEncoder(encoder);
    setStatus(serviceRef.current.getStatus());
    setConfig(serviceRef.current.getConfig());
  }, []);

  const updateEncoderSettings = useCallback(
    (settings: Partial<HardwareEncoderSettings>): void => {
      if (!serviceRef.current) return;
      serviceRef.current.updateEncoderSettings(settings);
      setConfig(serviceRef.current.getConfig());
    },
    []
  );

  const getEncoderSettings = useCallback((): HardwareEncoderSettings => {
    if (!serviceRef.current) return config.encoderSettings;
    return serviceRef.current.getEncoderSettings();
  }, [config.encoderSettings]);

  // Decoder Settings
  const setActiveDecoder = useCallback((decoder: HardwareDecoder): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setActiveDecoder(decoder);
    setStatus(serviceRef.current.getStatus());
  }, []);

  const updateDecoderSettings = useCallback(
    (settings: Partial<HardwareDecoderSettings>): void => {
      if (!serviceRef.current) return;
      serviceRef.current.updateDecoderSettings(settings);
      setConfig(serviceRef.current.getConfig());
    },
    []
  );

  // Sessions
  const startEncodingSession = useCallback(async (): Promise<EncodingSession | null> => {
    if (!serviceRef.current) return null;
    const session = await serviceRef.current.startEncodingSession();
    if (session) {
      setActiveSessions(serviceRef.current.getActiveSessions());
    }
    return session;
  }, []);

  const stopEncodingSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.stopEncodingSession(sessionId);
    setActiveSessions(serviceRef.current.getActiveSessions());
  }, []);

  // Benchmarking
  const runBenchmark = useCallback(
    async (
      gpuId: string,
      encoder: HardwareEncoder,
      preset: EncoderPreset,
      resolution: string = '1920x1080',
      frameRate: number = 60,
      duration: number = 30
    ): Promise<BenchmarkResult> => {
      if (!serviceRef.current) {
        throw new Error('Service not initialized');
      }
      return serviceRef.current.runBenchmark(
        gpuId,
        encoder,
        preset,
        resolution,
        frameRate,
        duration
      );
    },
    []
  );

  // Configuration
  const updateConfig = useCallback(
    (newConfig: Partial<HardwareAccelerationConfig>): void => {
      if (!serviceRef.current) return;
      serviceRef.current.updateConfig(newConfig);
      setConfig(serviceRef.current.getConfig());
    },
    []
  );

  const refreshStats = useCallback((): void => {
    if (!serviceRef.current) return;
    const stats = serviceRef.current.getGPUStats() as GPUStatistics[];
    setGpuStats(stats);
  }, []);

  // Events
  const on = useCallback(
    (event: HardwareAccelerationEvent, callback: (data: unknown) => void): void => {
      serviceRef.current?.on(event, callback);
    },
    []
  );

  const off = useCallback(
    (event: HardwareAccelerationEvent, callback: (data: unknown) => void): void => {
      serviceRef.current?.off(event, callback);
    },
    []
  );

  return {
    // State
    isInitialized,
    isAvailable: status.isAvailable,
    status,
    config,
    gpuStats,
    activeSessions,

    // GPU Management
    selectGPU,
    selectBestGPU,
    getAvailableGPUs,
    getEncoderCapabilities,

    // Encoder Settings
    setActiveEncoder,
    updateEncoderSettings,
    getEncoderSettings,

    // Decoder Settings
    setActiveDecoder,
    updateDecoderSettings,

    // Sessions
    startEncodingSession,
    stopEncodingSession,

    // Benchmarking
    runBenchmark,

    // Configuration
    updateConfig,
    refreshStats,

    // Events
    on,
    off
  };
}

export default useHardwareAcceleration;
