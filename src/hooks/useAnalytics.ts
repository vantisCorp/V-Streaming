import { useState, useEffect, useCallback } from 'react';
import { analyticsManager } from '../services/AnalyticsManager';
import {
  AnalyticsMetric,
  AnalyticsSettings,
  StreamSession,
  DashboardConfig,
  EngagementMetrics,
  ViewerMetrics,
  GrowthMetrics,
  PerformanceMetrics,
  AlertRule,
  TimeRange,
  MetricType
} from '../types/analytics';

export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<Record<MetricType, AnalyticsMetric>>(analyticsManager.getMetrics());
  const [settings, setSettings] = useState<AnalyticsSettings>(analyticsManager.getSettings());
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(analyticsManager.getDashboardConfig());
  const [isRecording, setIsRecording] = useState<boolean>(analyticsManager.getCurrentSession() !== null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [viewerMetrics, setViewerMetrics] = useState<ViewerMetrics | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Set up event listeners
    const handleMetricsUpdated = (updatedMetrics: Record<MetricType, AnalyticsMetric>) => {
      setMetrics({ ...updatedMetrics });
    };

    const handleSettingsChanged = (newSettings: AnalyticsSettings) => {
      setSettings({ ...newSettings });
    };

    const handleSessionStarted = (session: StreamSession) => {
      setSessions(prev => [session, ...prev]);
      setIsRecording(true);
    };

    const handleSessionEnded = (session: StreamSession) => {
      setSessions(prev => prev.map(s => s.id === session.id ? session : s));
      setIsRecording(false);
    };

    const handleDataRefreshed = () => {
      loadInitialData();
    };

    analyticsManager.on('metricsUpdated', handleMetricsUpdated);
    analyticsManager.on('settingsChanged', handleSettingsChanged);
    analyticsManager.on('sessionStarted', handleSessionStarted);
    analyticsManager.on('sessionEnded', handleSessionEnded);
    analyticsManager.on('dataRefreshed', handleDataRefreshed);

    // Cleanup
    return () => {
      analyticsManager.off('metricsUpdated', handleMetricsUpdated);
      analyticsManager.off('settingsChanged', handleSettingsChanged);
      analyticsManager.off('sessionStarted', handleSessionStarted);
      analyticsManager.off('sessionEnded', handleSessionEnded);
      analyticsManager.off('dataRefreshed', handleDataRefreshed);
    };
  }, []);

  const loadInitialData = useCallback(() => {
    setMetrics(analyticsManager.getMetrics());
    setSessions(analyticsManager.getSessions());
    setSettings(analyticsManager.getSettings());
    setDashboardConfig(analyticsManager.getDashboardConfig());
    setEngagementMetrics(analyticsManager.getEngagementMetrics());
    setViewerMetrics(analyticsManager.getViewerMetrics());
    setGrowthMetrics(analyticsManager.getGrowthMetrics());
    setPerformanceMetrics(analyticsManager.getPerformanceMetrics());
  }, []);

  const startSession = useCallback((title: string, platform: string) => {
    analyticsManager.startSession(title, [platform]);
  }, []);

  const endSession = useCallback(() => {
    analyticsManager.endSession();
  }, []);

  const updateCurrentSession = useCallback((updates: Partial<StreamSession>) => {
    analyticsManager.updateCurrentSession(updates);
  }, []);

  const updateMetric = useCallback((type: MetricType, value: number) => {
    analyticsManager.updateMetric(type, value);
  }, []);

  const updateSettings = useCallback((updates: Partial<AnalyticsSettings>) => {
    analyticsManager.updateSettings(updates);
  }, []);

  const addWidget = useCallback((widget: Omit<import('../types/analytics').DashboardWidget, 'id'>) => {
    analyticsManager.addWidget(widget);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    analyticsManager.removeWidget(widgetId);
  }, []);

  const updateDashboardConfig = useCallback((config: Partial<DashboardConfig>) => {
    analyticsManager.updateDashboardConfig(config);
  }, []);

  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id' | 'triggerCount'>) => {
    analyticsManager.addAlertRule(rule);
  }, []);

  const updateAlertRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    analyticsManager.updateAlertRule(ruleId, updates);
  }, []);

  const deleteAlertRule = useCallback((ruleId: string) => {
    analyticsManager.deleteAlertRule(ruleId);
  }, []);

  const exportToCSV = useCallback((timeRange: TimeRange) => {
    return analyticsManager.exportToCSV(timeRange);
  }, []);

  const exportToJSON = useCallback((timeRange: TimeRange) => {
    return analyticsManager.exportToJSON(timeRange);
  }, []);

  const getMetricHistory = useCallback((type: MetricType, timeRange: TimeRange) => {
    return analyticsManager.getMetricHistory(type, timeRange);
  }, []);

  const getComparisonData = useCallback((
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ) => {
    return analyticsManager.getComparisonData(period1Start, period1End, period2Start, period2End);
  }, []);

  const getCurrentSession = useCallback(() => {
    return analyticsManager.getCurrentSession();
  }, []);

  const refreshData = useCallback(() => {
    analyticsManager.refreshData();
  }, []);

  const getStatisticsSummary = useCallback(() => {
    return analyticsManager.getStatisticsSummary();
  }, []);

  return {
    // State
    metrics,
    settings,
    sessions,
    dashboardConfig,
    isRecording,
    engagementMetrics,
    viewerMetrics,
    growthMetrics,
    performanceMetrics,

    // Actions
    startSession,
    endSession,
    updateCurrentSession,
    updateMetric,
    updateSettings,
    addWidget,
    removeWidget,
    updateDashboardConfig,
    addAlertRule,
    updateAlertRule,
    deleteAlertRule,
    exportToCSV,
    exportToJSON,
    getMetricHistory,
    getComparisonData,
    getCurrentSession,
    refreshData,
    getStatisticsSummary,
    loadInitialData
  };
};