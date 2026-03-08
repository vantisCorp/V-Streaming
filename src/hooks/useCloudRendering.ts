/**
 * React Hook for Cloud Rendering
 * Provides cloud rendering capabilities to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CloudProvider,
  RenderJobStatus,
  RenderQuality,
  RenderCodec,
  CloudInstanceType,
  CloudRenderingConfig,
  RenderJobConfig,
  RenderJob,
  CloudInstance,
  CloudRenderingStats,
  CloudPricing,
  RenderQueueItem,
  CloudRenderingEvent,
  DEFAULT_CLOUD_RENDERING_CONFIG
} from '../types/cloudRendering';
import { CloudRenderingService, getCloudRenderingService } from '../services/CloudRenderingService';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseCloudRenderingReturn {
  // State
  isConfigured: boolean;
  isConnected: boolean;
  isRendering: boolean;
  config: CloudRenderingConfig;
  jobs: RenderJob[];
  instances: CloudInstance[];
  queue: RenderQueueItem[];
  stats: CloudRenderingStats;
  pricing: CloudPricing[];

  // Connection
  configure: (config: CloudRenderingConfig) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Instances
  startInstance: (type?: CloudInstanceType) => Promise<CloudInstance>;
  stopInstance: (instanceId: string) => Promise<void>;
  getInstances: () => CloudInstance[];

  // Jobs
  createJob: (jobConfig: RenderJobConfig) => Promise<RenderJob>;
  cancelJob: (jobId: string) => Promise<void>;
  getJobs: () => RenderJob[];

  // Queue
  addToQueue: (jobConfig: RenderJobConfig) => void;
  removeFromQueue: (queueItemId: string) => void;
  clearQueue: () => void;

  // Stats & Pricing
  refreshStats: () => Promise<void>;
  refreshPricing: () => Promise<void>;

  // Events
  on: (event: CloudRenderingEvent, callback: (data: unknown) => void) => void;
  off: (event: CloudRenderingEvent, callback: (data: unknown) => void) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCloudRendering(): UseCloudRenderingReturn {
  const serviceRef = useRef<CloudRenderingService | null>(null);
  
  // State
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [config, setConfig] = useState<CloudRenderingConfig>(DEFAULT_CLOUD_RENDERING_CONFIG);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [instances, setInstances] = useState<CloudInstance[]>([]);
  const [queue, setQueue] = useState<RenderQueueItem[]>([]);
  const [stats, setStats] = useState<CloudRenderingStats>({
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalRenderTime: 0,
    totalCost: 0,
    averageRenderTime: 0
  });
  const [pricing, setPricing] = useState<CloudPricing[]>([]);

  // Initialize service
  useEffect(() => {
    serviceRef.current = getCloudRenderingService();
    
    return () => {
      // Cleanup on unmount
      if (serviceRef.current && isConnected) {
        serviceRef.current.disconnect();
      }
    };
  }, [isConnected]);

  // Connection methods
  const configure = useCallback(async (newConfig: CloudRenderingConfig): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.configure(newConfig);
    setConfig(newConfig);
    setIsConfigured(true);
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (!serviceRef.current || !isConfigured) {
      throw new Error('Service not configured');
    }
    await serviceRef.current.connect();
    setIsConnected(true);
  }, [isConfigured]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.disconnect();
    setIsConnected(false);
    setInstances([]);
    setJobs([]);
  }, []);

  // Instance methods
  const startInstance = useCallback(async (type?: CloudInstanceType): Promise<CloudInstance> => {
    if (!serviceRef.current || !isConnected) {
      throw new Error('Not connected to cloud service');
    }
    const instance = await serviceRef.current.startInstance(type);
    setInstances(prev => [...prev, instance]);
    return instance;
  }, [isConnected]);

  const stopInstance = useCallback(async (instanceId: string): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.stopInstance(instanceId);
    setInstances(prev => prev.filter(i => i.id !== instanceId));
  }, []);

  const getInstances = useCallback((): CloudInstance[] => {
    return instances;
  }, [instances]);

  // Job methods
  const createJob = useCallback(async (jobConfig: RenderJobConfig): Promise<RenderJob> => {
    if (!serviceRef.current || !isConnected) {
      throw new Error('Not connected to cloud service');
    }
    const job = await serviceRef.current.createJob(jobConfig);
    setJobs(prev => [...prev, job]);
    setIsRendering(true);
    return job;
  }, [isConnected]);

  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    if (!serviceRef.current) return;
    await serviceRef.current.cancelJob(jobId);
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: RenderJobStatus.CANCELLED } : j
    ));
  }, []);

  const getJobs = useCallback((): RenderJob[] => {
    return jobs;
  }, [jobs]);

  // Queue methods
  const addToQueue = useCallback((jobConfig: RenderJobConfig): void => {
    const queueItem: RenderQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobConfig,
      priority: 0,
      addedAt: new Date(),
      status: 'pending'
    };
    setQueue(prev => [...prev, queueItem]);
  }, []);

  const removeFromQueue = useCallback((queueItemId: string): void => {
    setQueue(prev => prev.filter(item => item.id !== queueItemId));
  }, []);

  const clearQueue = useCallback((): void => {
    setQueue([]);
  }, []);

  // Stats & Pricing
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    const newStats = await serviceRef.current.getStats();
    setStats(newStats);
  }, []);

  const refreshPricing = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    const newPricing = await serviceRef.current.getPricing(config.provider);
    setPricing(newPricing);
  }, [config.provider]);

  // Event handling
  const on = useCallback((event: CloudRenderingEvent, callback: (data: unknown) => void): void => {
    if (!serviceRef.current) return;
    serviceRef.current.on(event, callback);
  }, []);

  const off = useCallback((event: CloudRenderingEvent, callback: (data: unknown) => void): void => {
    if (!serviceRef.current) return;
    serviceRef.current.off(event, callback);
  }, []);

  return {
    // State
    isConfigured,
    isConnected,
    isRendering,
    config,
    jobs,
    instances,
    queue,
    stats,
    pricing,

    // Connection
    configure,
    connect,
    disconnect,

    // Instances
    startInstance,
    stopInstance,
    getInstances,

    // Jobs
    createJob,
    cancelJob,
    getJobs,

    // Queue
    addToQueue,
    removeFromQueue,
    clearQueue,

    // Stats & Pricing
    refreshStats,
    refreshPricing,

    // Events
    on,
    off
  };
}

export default useCloudRendering;
