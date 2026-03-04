/**
 * useStreamScheduler Hook
 * React hook for integrating with the Stream Scheduler service
 */

import { useState, useEffect, useCallback } from 'react';
import { streamScheduler } from '../services/StreamScheduler';
import {
  SchedulerConfig,
  SchedulerState,
  ScheduledStream,
  CreateScheduleOptions,
  UpdateScheduleOptions,
  StartScheduleOptions,
  ScheduleValidation,
  ScheduleHistory,
  SchedulerStats,
  ScheduleStatus,
} from '../types/streamScheduler';

interface UseStreamSchedulerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useStreamScheduler = (options: UseStreamSchedulerOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 10000 } = options;

  const [state, setState] = useState<SchedulerState>(() => ({
    config: streamScheduler.getConfig(),
    schedules: streamScheduler.getAllSchedules(),
    activeSchedule: null,
    history: streamScheduler.getHistory(),
    isRunning: false,
    isProcessing: false,
  }));

  const [stats, setStats] = useState<SchedulerStats>(() => streamScheduler.getStats());

  // Setup event listeners
  useEffect(() => {
    const handleStateChange = (newState: SchedulerState) => {
      setState(newState);
      setStats(streamScheduler.getStats());
    };

    const handleScheduleCreated = (schedule: ScheduledStream) => {
      setState(prev => ({
        ...prev,
        schedules: streamScheduler.getAllSchedules(),
      }));
      setStats(streamScheduler.getStats());
    };

    const handleScheduleUpdated = (schedule: ScheduledStream) => {
      setState(prev => ({
        ...prev,
        schedules: streamScheduler.getAllSchedules(),
      }));
      setStats(streamScheduler.getStats());
    };

    const handleScheduleDeleted = (id: string) => {
      setState(prev => ({
        ...prev,
        schedules: streamScheduler.getAllSchedules(),
      }));
      setStats(streamScheduler.getStats());
    };

    // Listen to all scheduler events
    streamScheduler.on('state:changed', handleStateChange);
    streamScheduler.on('schedule:created', handleScheduleCreated);
    streamScheduler.on('schedule:updated', handleScheduleUpdated);
    streamScheduler.on('schedule:deleted', handleScheduleDeleted);

    return () => {
      streamScheduler.off('state:changed', handleStateChange);
      streamScheduler.off('schedule:created', handleScheduleCreated);
      streamScheduler.off('schedule:updated', handleScheduleUpdated);
      streamScheduler.off('schedule:deleted', handleScheduleDeleted);
    };
  }, []);

  // Auto-refresh state
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setState({
        config: streamScheduler.getConfig(),
        schedules: streamScheduler.getAllSchedules(),
        activeSchedule: null,
        history: streamScheduler.getHistory(),
        isRunning: false,
        isProcessing: false,
      });
      setStats(streamScheduler.getStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Configuration
  const config = state.config;
  const updateConfig = useCallback((updates: Partial<SchedulerConfig>) => {
    streamScheduler.updateConfig(updates);
  }, []);

  // Schedule operations
  const schedules = state.schedules;
  const activeSchedule = state.activeSchedule;

  const getSchedule = useCallback((id: string) => {
    return streamScheduler.getSchedule(id);
  }, []);

  const getActiveSchedules = useCallback(() => {
    return streamScheduler.getActiveSchedules();
  }, []);

  const getUpcomingSchedules = useCallback((limit?: number) => {
    return streamScheduler.getUpcomingSchedules(limit);
  }, []);

  const createSchedule = useCallback(async (options: CreateScheduleOptions) => {
    return await streamScheduler.createSchedule(options);
  }, []);

  const updateSchedule = useCallback(async (id: string, options: UpdateScheduleOptions) => {
    return await streamScheduler.updateSchedule(id, options);
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    return await streamScheduler.deleteSchedule(id);
  }, []);

  const activateSchedule = useCallback(async (id: string) => {
    return await streamScheduler.activateSchedule(id);
  }, []);

  const deactivateSchedule = useCallback(async (id: string) => {
    return await streamScheduler.deactivateSchedule(id);
  }, []);

  const startSchedule = useCallback(async (id: string, options?: StartScheduleOptions) => {
    return await streamScheduler.startSchedule(id, options);
  }, []);

  // Validation
  const validateSchedule = useCallback((schedule: ScheduledStream): ScheduleValidation => {
    return streamScheduler.validateSchedule(schedule);
  }, []);

  // History
  const history = state.history;
  const getHistory = useCallback((limit?: number) => {
    return streamScheduler.getHistory(limit);
  }, []);

  const getHistoryForSchedule = useCallback((scheduleId: string) => {
    return streamScheduler.getHistoryForSchedule(scheduleId);
  }, []);

  // Status checks
  const isConfigured = useCallback(() => {
    return schedules.length > 0;
  }, [schedules.length]);

  const hasActiveSchedules = useCallback(() => {
    return schedules.some(s => s.status === 'active');
  }, [schedules]);

  const isRunning = state.isRunning;
  const isProcessing = state.isProcessing;

  return {
    // State
    state,
    config,
    schedules,
    activeSchedule,
    history,
    stats,
    isRunning,
    isProcessing,

    // Configuration
    updateConfig,

    // Schedule operations
    getSchedule,
    getActiveSchedules,
    getUpcomingSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    activateSchedule,
    deactivateSchedule,
    startSchedule,

    // Validation
    validateSchedule,

    // History
    getHistory,
    getHistoryForSchedule,

    // Status checks
    isConfigured,
    hasActiveSchedules,
  };
};