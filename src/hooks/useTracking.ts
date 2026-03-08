import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrackingProvider,
  TrackingStatus,
  TrackingQuality,
  TrackingConfig,
  FaceTrackingData,
  BodyTrackingData,
  HandTrackingData,
} from '../types/vtuber';

import { TrackingService } from '../services/TrackingService';

/**
 * React hook for face and body tracking
 */
export function useTracking() {
  const [status, setStatus] = useState<TrackingStatus>(() => TrackingService.getInstance().getStatus());
  const [config, setConfig] = useState<TrackingConfig>(() => TrackingService.getInstance().getConfig());
  const [faceData, setFaceData] = useState<FaceTrackingData | null>(null);
  const [bodyData, setBodyData] = useState<BodyTrackingData | null>(null);
  const [handData, setHandData] = useState<{ left: HandTrackingData | null; right: HandTrackingData | null }>({
    left: null,
    right: null,
  });
  const [stats, setStats] = useState<{ fps: number; uptime: number; provider: TrackingProvider }>({
    fps: 0,
    uptime: 0,
    provider: TrackingProvider.MEDIAPIPE,
  });

  const serviceRef = useRef<TrackingService>(TrackingService.getInstance());
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state with service
  useEffect(() => {
    const service = serviceRef.current;

    const handleStatusChange = (newStatus: TrackingStatus) => {
      setStatus(newStatus);
    };

    const handleFaceTracking = (data: FaceTrackingData) => {
      setFaceData(data);
    };

    const handleBodyTracking = (data: BodyTrackingData) => {
      setBodyData(data);
    };

    const handleHandTracking = (data: HandTrackingData) => {
      setHandData(prev => ({
        ...prev,
        [data.side]: data,
      }));
    };

    const handleError = (error: Error) => {
      console.error('Tracking Error:', error);
    };

    service.on('status-changed', handleStatusChange);
    service.on('face-tracking', handleFaceTracking);
    service.on('body-tracking', handleBodyTracking);
    service.on('hand-tracking', handleHandTracking);
    service.on('error', handleError);

    // Update stats periodically
    statsIntervalRef.current = setInterval(() => {
      setStats(service.getStats());
    }, 1000);

    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('face-tracking', handleFaceTracking);
      service.off('body-tracking', handleBodyTracking);
      service.off('hand-tracking', handleHandTracking);
      service.off('error', handleError);

      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Lifecycle operations
  const initialize = useCallback(async (newConfig?: Partial<TrackingConfig>) => {
    await serviceRef.current.initialize(newConfig);
    setConfig(serviceRef.current.getConfig());
  }, []);

  const stopTracking = useCallback(() => {
    serviceRef.current.stopTracking();
  }, []);

  const pauseTracking = useCallback(() => {
    serviceRef.current.pauseTracking();
  }, []);

  const resumeTracking = useCallback(() => {
    serviceRef.current.resumeTracking();
  }, []);

  // Configuration
  const updateConfig = useCallback((newConfig: Partial<TrackingConfig>) => {
    serviceRef.current.updateConfig(newConfig);
    setConfig(serviceRef.current.getConfig());
  }, []);

  // Calibration
  const calibrate = useCallback(async () => {
    await serviceRef.current.calibrate();
    setConfig(serviceRef.current.getConfig());
  }, []);

  // Data access
  const getFaceData = useCallback(() => {
    return serviceRef.current.getFaceData();
  }, []);

  const getBodyData = useCallback(() => {
    return serviceRef.current.getBodyData();
  }, []);

  const getHandData = useCallback((side: 'left' | 'right') => {
    return serviceRef.current.getHandData(side);
  }, []);

  return {
    // State
    status,
    config,
    faceData,
    bodyData,
    handData,
    stats,
    isTracking: status === TrackingStatus.TRACKING,
    isPaused: status === TrackingStatus.PAUSED,

    // Lifecycle
    initialize,
    stopTracking,
    pauseTracking,
    resumeTracking,

    // Configuration
    updateConfig,

    // Calibration
    calibrate,

    // Data access
    getFaceData,
    getBodyData,
    getHandData,
    getStats: useCallback(() => serviceRef.current.getStats(), []),
  };
}

export default useTracking;