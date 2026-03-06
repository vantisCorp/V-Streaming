import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsProManager } from '../services/AnalyticsProManager';
import {
  StreamAnalyticsData,
  AnalyticsChart,
  AnalyticsReport,
  AnalyticsGoal,
  AnalyticsProSettings,
  AnalyticsPeriod,
  AnalyticsMetric,
  ChartType,
  ReportType,
  ExportFormat,
  TimeGranularity
} from '../types/analyticsPro';

export interface UseAnalyticsProReturn {
  // State
  data: StreamAnalyticsData[];
  charts: AnalyticsChart[];
  reports: AnalyticsReport[];
  goals: AnalyticsGoal[];
  settings: AnalyticsProSettings;
  selectedPeriod: AnalyticsPeriod;
  selectedMetric: AnalyticsMetric;
  selectedChartType: ChartType;
  isLoading: boolean;

  // Data Actions
  getAnalyticsData: (period: AnalyticsPeriod) => StreamAnalyticsData[];
  addAnalyticsData: (data: StreamAnalyticsData) => void;
  getTrends: (period: AnalyticsPeriod) => any;
  calculateMetrics: (period: AnalyticsPeriod) => any;
  getViewerEngagement: (period: AnalyticsPeriod) => any;
  getChatAnalytics: (period: AnalyticsPeriod) => any;

  // Chart Actions
  generateChart: (metric: AnalyticsMetric, period: AnalyticsPeriod, granularity: TimeGranularity) => AnalyticsChart;
  removeChart: (chartId: string) => void;
  
  // Comparison Actions
  comparePeriods: (metric: AnalyticsMetric, period1: AnalyticsPeriod, period2: AnalyticsPeriod) => any;
  compareSessions: (session1Id: string, session2Id: string) => any;

  // Report Actions
  generateReport: (type: ReportType, period: AnalyticsPeriod, startDate?: number, endDate?: number) => AnalyticsReport;
  exportReport: (reportId: string, format: ExportFormat) => string;
  deleteReport: (reportId: string) => void;

  // Goal Actions
  addGoal: (goal: Omit<AnalyticsGoal, 'id' | 'progress'>) => string;
  updateGoal: (goalId: string, updates: Partial<AnalyticsGoal>) => void;
  removeGoal: (goalId: string) => void;
  checkGoals: () => void;

  // Settings Actions
  updateSettings: (updates: Partial<AnalyticsProSettings>) => void;

  // Selection Actions
  setSelectedPeriod: (period: AnalyticsPeriod) => void;
  setSelectedMetric: (metric: AnalyticsMetric) => void;
  setSelectedChartType: (chartType: ChartType) => void;
}

export function useAnalyticsPro(): UseAnalyticsProReturn {
  const managerRef = useRef<AnalyticsProManager | null>(null);
  const [data, setData] = useState<StreamAnalyticsData[]>([]);
  const [charts, setCharts] = useState<AnalyticsChart[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [goals, setGoals] = useState<AnalyticsGoal[]>([]);
  const [settings, setSettings] = useState<AnalyticsProSettings>({
    defaultPeriod: AnalyticsPeriod.LAST_7_DAYS,
    autoRefresh: false,
    refreshInterval: 30000,
    showTrends: true,
    enableHeatmaps: true,
    enableComparison: true,
    exportFormat: ExportFormat.CSV,
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD'
  });
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.LAST_7_DAYS);
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>(AnalyticsMetric.VIEWER_COUNT);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(ChartType.LINE);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize manager
  useEffect(() => {
    const manager = AnalyticsProManager.getInstance();
    managerRef.current = manager;

    // Load initial data
    loadData();

    // Set up event listeners
    const handleDataUpdated = (args: StreamAnalyticsData[]) => {
      setData(args);
    };

    const handleChartUpdated = (chart: AnalyticsChart) => {
      setCharts((prev) => [...prev, chart]);
    };

    const handleReportGenerated = (report: AnalyticsReport) => {
      setReports((prev) => [...prev, report]);
    };

    const handleGoalProgress = (goal: AnalyticsGoal) => {
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    };

    const handleGoalReached = (goal: AnalyticsGoal) => {
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    };

    manager.on('data-updated', handleDataUpdated);
    manager.on('chart-updated', handleChartUpdated);
    manager.on('report-generated', handleReportGenerated);
    manager.on('goal-progress', handleGoalProgress);
    manager.on('goal-reached', handleGoalReached);

    return () => {
      manager.off('data-updated', handleDataUpdated);
      manager.off('chart-updated', handleChartUpdated);
      manager.off('report-generated', handleReportGenerated);
      manager.off('goal-progress', handleGoalProgress);
      manager.off('goal-reached', handleGoalReached);
    };
  }, []);

  const loadData = useCallback(() => {
    if (!managerRef.current) return;

    const manager = managerRef.current;
    setData(manager.getAnalyticsData(AnalyticsPeriod.CUSTOM));
    setCharts(manager.getCharts());
    setReports(manager.getReports());
    setGoals(manager.getGoals());
    setSettings(manager.getSettings());
  }, []);

  // Data Actions
  const getAnalyticsData = useCallback((period: AnalyticsPeriod): StreamAnalyticsData[] => {
    if (!managerRef.current) return [];
    return managerRef.current.getAnalyticsData(period);
  }, []);

  const addAnalyticsData = useCallback((data: StreamAnalyticsData): void => {
    if (!managerRef.current) return;
    managerRef.current.addAnalyticsData(data);
    loadData();
  }, [loadData]);

  const getTrends = useCallback((period: AnalyticsPeriod): any => {
    if (!managerRef.current) return null;
    return managerRef.current.getTrends(period);
  }, []);

  const calculateMetrics = useCallback((period: AnalyticsPeriod): any => {
    if (!managerRef.current) return null;
    return managerRef.current.getMetricsSummary(period);
  }, []);

  const getViewerEngagement = useCallback((period: AnalyticsPeriod): any => {
    if (!managerRef.current) return null;
    return managerRef.current.getViewerEngagement(period);
  }, []);

  const getChatAnalytics = useCallback((period: AnalyticsPeriod): any => {
    if (!managerRef.current) return null;
    return managerRef.current.getChatAnalytics(period);
  }, []);

  // Chart Actions
  const generateChart = useCallback(
    (metric: AnalyticsMetric, period: AnalyticsPeriod, granularity: TimeGranularity): AnalyticsChart => {
      if (!managerRef.current) {
        throw new Error('Manager not initialized');
      }
      const chart = managerRef.current.generateChart(metric, period, granularity);
      loadData();
      return chart;
    },
    [loadData]
  );

  const removeChart = useCallback((chartId: string): void => {
    if (!managerRef.current) return;
    managerRef.current.removeChart(chartId);
    loadData();
  }, [loadData]);

  // Comparison Actions
  const comparePeriods = useCallback(
    (metric: AnalyticsMetric, period1: AnalyticsPeriod, period2: AnalyticsPeriod): any => {
      if (!managerRef.current) {
        throw new Error('Manager not initialized');
      }
      return managerRef.current.comparePeriods(metric, period1, period2);
    },
    []
  );

  const compareSessions = useCallback((session1Id: string, session2Id: string): any => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }
    return managerRef.current.compareSessions(session1Id, session2Id);
  }, []);

  // Report Actions
  const generateReport = useCallback(
    (type: ReportType, period: AnalyticsPeriod, startDate?: number, endDate?: number): AnalyticsReport => {
      if (!managerRef.current) {
        throw new Error('Manager not initialized');
      }
      const report = managerRef.current.generateReport(type, period, startDate, endDate);
      loadData();
      return report;
    },
    [loadData]
  );

  const exportReport = useCallback((reportId: string, format: ExportFormat): string => {
    if (!managerRef.current) return '';
    return managerRef.current.exportReport(reportId, format);
  }, []);

  const deleteReport = useCallback((reportId: string): void => {
    if (!managerRef.current) return;
    managerRef.current.deleteReport(reportId);
    loadData();
  }, [loadData]);

  // Goal Actions
  const addGoal = useCallback((goal: Omit<AnalyticsGoal, 'id' | 'progress'>): string => {
    if (!managerRef.current) {
      throw new Error('Manager not initialized');
    }
    const goalId = managerRef.current.addGoal(goal);
    loadData();
    return goalId;
  }, [loadData]);

  const updateGoal = useCallback((goalId: string, updates: Partial<AnalyticsGoal>): void => {
    if (!managerRef.current) return;
    managerRef.current.updateGoal(goalId, updates);
    loadData();
  }, [loadData]);

  const removeGoal = useCallback((goalId: string): void => {
    if (!managerRef.current) return;
    managerRef.current.removeGoal(goalId);
    loadData();
  }, [loadData]);

  const checkGoals = useCallback((): void => {
    if (!managerRef.current) return;
    managerRef.current.checkGoals();
  }, []);

  // Settings Actions
  const updateSettings = useCallback((updates: Partial<AnalyticsProSettings>): void => {
    if (!managerRef.current) return;
    managerRef.current.updateSettings(updates);
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // State
    data,
    charts,
    reports,
    goals,
    settings,
    selectedPeriod,
    selectedMetric,
    selectedChartType,
    isLoading,

    // Data Actions
    getAnalyticsData,
    addAnalyticsData,
    getTrends,
    calculateMetrics,
    getViewerEngagement,
    getChatAnalytics,

    // Chart Actions
    generateChart,
    removeChart,

    // Comparison Actions
    comparePeriods,
    compareSessions,

    // Report Actions
    generateReport,
    exportReport,
    deleteReport,

    // Goal Actions
    addGoal,
    updateGoal,
    removeGoal,
    checkGoals,

    // Settings Actions
    updateSettings,

    // Selection Actions
    setSelectedPeriod,
    setSelectedMetric,
    setSelectedChartType,
  };
}