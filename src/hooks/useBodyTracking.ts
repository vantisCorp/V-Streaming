import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BodyTrackingMode,
  BodyTrackingConfig,
  BodyTrackingCalibration,
  BodyTrackingStatistics,
  BodyTrackingState,
  FullBodyPose,
  IKTarget,
  IKSolveResult,
  IKSolveMethod,
  TrackingStatus,
} from '../types/vtuber';

import { BodyTrackingService } from '../services/BodyTrackingService';

/**
 * React hook for full body tracking
 */
export function useBodyTracking() {
  const [status, setStatus] = useState<TrackingStatus>(() => BodyTrackingService.getInstance().getStatus());
  const [config, setConfig] = useState<BodyTrackingConfig>(() => BodyTrackingService.getInstance().getConfig());
  const [state, setState] = useState<BodyTrackingState>(() => BodyTrackingService.getInstance().getState());
  const [currentPose, setCurrentPose] = useState<FullBodyPose | null>(null);
  const [ikResults, setIkResults] = useState<Map<string, IKSolveResult>>(new Map());
  const [statistics, setStatistics] = useState<BodyTrackingStatistics>(() => BodyTrackingService.getInstance().getStatistics());

  const serviceRef = useRef<BodyTrackingService>(BodyTrackingService.getInstance());
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state with service
  useEffect(() => {
    const service = serviceRef.current;

    const handleStatusChange = (newStatus: TrackingStatus) => {
      setStatus(newStatus);
    };

    const handlePoseUpdate = (pose: FullBodyPose) => {
      setCurrentPose(pose);
    };

    const handleIKSolved = (results: Map<string, IKSolveResult>) => {
      setIkResults(new Map(results));
    };

    const handleCalibrationComplete = (calibration: BodyTrackingCalibration) => {
      setState(service.getState());
    };

    const handleError = (error: Error) => {
      console.error('Body Tracking Error:', error);
    };

    service.on('status-changed', handleStatusChange);
    service.on('pose-updated', handlePoseUpdate);
    service.on('ik-solved', handleIKSolved);
    service.on('calibration-complete', handleCalibrationComplete);
    service.on('error', handleError);

    // Update statistics periodically
    statsIntervalRef.current = setInterval(() => {
      setStatistics(service.getStatistics());
    }, 1000);

    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('pose-updated', handlePoseUpdate);
      service.off('ik-solved', handleIKSolved);
      service.off('calibration-complete', handleCalibrationComplete);
      service.off('error', handleError);

      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);

  // Lifecycle operations
  const startTracking = useCallback(async (newConfig?: Partial<BodyTrackingConfig>) => {
    await serviceRef.current.startTracking(newConfig);
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
  const updateConfig = useCallback((newConfig: Partial<BodyTrackingConfig>) => {
    serviceRef.current.updateConfig(newConfig);
    setConfig(serviceRef.current.getConfig());
  }, []);

  // Calibration
  const calibrate = useCallback(async (pose: 't-pose' | 'a-pose' = 't-pose') => {
    const calibration = await serviceRef.current.calibrate(pose);
    setState(serviceRef.current.getState());
    return calibration;
  }, []);

  // IK operations
  const setIKTarget = useCallback((target: IKTarget) => {
    serviceRef.current.setIKTarget(target);
  }, []);

  const clearIKTarget = useCallback((joint: string) => {
    serviceRef.current.clearIKTarget(joint);
  }, []);

  const solveIK = useCallback(() => {
    return serviceRef.current.solveIK();
  }, []);

  // Data access
  const getCurrentPose = useCallback(() => {
    return serviceRef.current.getCurrentPose();
  }, []);

  const getIKResults = useCallback(() => {
    return serviceRef.current.getIKResults();
  }, []);

  const getStatistics = useCallback(() => {
    return serviceRef.current.getStatistics();
  }, []);

  const resetStatistics = useCallback(() => {
    serviceRef.current.resetStatistics();
    setStatistics(serviceRef.current.getStatistics());
  }, []);

  return {
    // State
    status,
    config,
    state,
    currentPose,
    ikResults,
    statistics,
    isTracking: status === TrackingStatus.TRACKING,
    isPaused: status === TrackingStatus.PAUSED,
    isCalibrated: state.isCalibrated,
    calibration: state.calibration,

    // Lifecycle
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,

    // Configuration
    updateConfig,

    // Calibration
    calibrate,

    // IK operations
    setIKTarget,
    clearIKTarget,
    solveIK,

    // Data access
    getCurrentPose,
    getIKResults,
    getStatistics,
    resetStatistics,
  };
}

export default useBodyTracking;