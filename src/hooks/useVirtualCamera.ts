/**
 * V-Streaming useVirtualCamera Hook
 * React hook for virtual camera state management
 */

import { useState, useEffect, useCallback } from 'react';
import { virtualCameraManager } from '../services/VirtualCameraManager';
import type {
  VirtualCameraConfig,
  VirtualCameraStats,
  VirtualCameraStatus,
  VirtualCameraDevice,
  SourceType,
} from '../types/virtualCamera';

interface UseVirtualCameraReturn {
  // State
  config: VirtualCameraConfig;
  stats: VirtualCameraStats;
  status: VirtualCameraStatus;
  devices: VirtualCameraDevice[];
  sources: Array<{ id: string; name: string; type: SourceType }>;
  
  // Actions
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  updateConfig: (config: Partial<VirtualCameraConfig>) => void;
  resetConfig: () => void;
  setSource: (sourceType: SourceType, sourceId?: string) => void;
  refreshDevices: () => Promise<void>;
  
  // Computed
  isRunning: boolean;
  isStarting: boolean;
  isStopping: boolean;
  hasError: boolean;
}

export const useVirtualCamera = (): UseVirtualCameraReturn => {
  const [config, setConfig] = useState<VirtualCameraConfig>(
    virtualCameraManager.getConfig()
  );
  const [stats, setStats] = useState<VirtualCameraStats>(
    virtualCameraManager.getStats()
  );
  const [status, setStatus] = useState<VirtualCameraStatus>(
    virtualCameraManager.getStatus()
  );
  const [devices, setDevices] = useState<VirtualCameraDevice[]>([]);
  const [sources, setSources] = useState<
    Array<{ id: string; name: string; type: SourceType }>
  >([]);

  // Load devices and sources on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const availableDevices = await virtualCameraManager.getAvailableDevices();
      setDevices(availableDevices);
      setSources(virtualCameraManager.getAvailableSources());
    };
    
    loadInitialData();
  }, []);

  // Subscribe to events
  useEffect(() => {
    const handleConfigChange = (newConfig: VirtualCameraConfig) => {
      setConfig(newConfig);
    };

    const handleStatsUpdate = (newStats: VirtualCameraStats) => {
      setStats(newStats);
    };

    const handleStatusChange = (newStatus: VirtualCameraStatus) => {
      setStatus(newStatus);
    };

    virtualCameraManager.on('config-changed', handleConfigChange);
    virtualCameraManager.on('stats-updated', handleStatsUpdate);
    virtualCameraManager.on('status-changed', handleStatusChange);

    return () => {
      virtualCameraManager.off('config-changed', handleConfigChange);
      virtualCameraManager.off('stats-updated', handleStatsUpdate);
      virtualCameraManager.off('status-changed', handleStatusChange);
    };
  }, []);

  // Actions
  const start = useCallback(async () => {
    await virtualCameraManager.start();
  }, []);

  const stop = useCallback(async () => {
    await virtualCameraManager.stop();
  }, []);

  const restart = useCallback(async () => {
    await virtualCameraManager.restart();
  }, []);

  const updateConfig = useCallback((newConfig: Partial<VirtualCameraConfig>) => {
    virtualCameraManager.updateConfig(newConfig);
  }, []);

  const resetConfig = useCallback(() => {
    virtualCameraManager.resetConfig();
  }, []);

  const setSource = useCallback((sourceType: SourceType, sourceId?: string) => {
    virtualCameraManager.setSource(sourceType, sourceId);
  }, []);

  const refreshDevices = useCallback(async () => {
    const availableDevices = await virtualCameraManager.getAvailableDevices();
    setDevices(availableDevices);
  }, []);

  return {
    config,
    stats,
    status,
    devices,
    sources,
    
    start,
    stop,
    restart,
    updateConfig,
    resetConfig,
    setSource,
    refreshDevices,
    
    // Computed
    isRunning: status === 'running',
    isStarting: status === 'starting',
    isStopping: status === 'stopping',
    hasError: status === 'error',
  };
};