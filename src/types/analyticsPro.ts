// ============================================================================
// ANALYTICS PRO - TYPE DEFINITIONS
// ============================================================================

import { EventEmitter } from 'events';

// ============================================================================
// ENUMS
// ============================================================================

export enum AnalyticsPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom'
}

export enum AnalyticsMetric {
  VIEWER_COUNT = 'viewer_count',
  WATCH_TIME = 'watch_time',
  CHAT_MESSAGES = 'chat_messages',
  NEW_FOLLOWERS = 'new_followers',
  NEW_SUBSCRIBERS = 'new_subscribers',
  DONATIONS = 'donations',
  BITS_CHEERS = 'bits_cheers',
  STREAM_DURATION = 'stream_duration',
  UNIQUE_CHATTERS = 'unique_chatters',
  CLIPS_CREATED = 'clips_created'
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  AREA = 'area',
  PIE = 'pie',
  DONUT = 'donut',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPARISON = 'comparison',
  TREND = 'trend',
  AUDIENCE = 'audience',
  CHAT_ANALYSIS = 'chat_analysis'
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel'
}

export enum ViewerSegment {
  NEW = 'new',
  RETURNING = 'returning',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUBSCRIBER = 'subscriber',
  FOLLOWER = 'follower',
  VIP = 'vip',
  MODERATOR = 'moderator'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

// ============================================================================
// INTERFACES
// ============================================================================

// Analytics Data
export interface StreamAnalyticsData {
  sessionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  platform: string;
  
  // Viewer Metrics
  viewerCount: number;
  viewerPeak: number;
  viewerAverage: number;
  uniqueViewers: number;
  watchTime: number;
  
  // Chat Metrics
  chatMessages: number;
  uniqueChatters: number;
  chatRate: number;
  
  // Engagement Metrics
  newFollowers: number;
  newSubscribers: number;
  giftSubs: number;
  totalDonations: number;
  donationCount: number;
  totalCheerBits: number;
  cheerCount: number;
  
  // Content Metrics
  clipsCreated: number;
  raidsReceived: number;
  raidViewers: number;
  hostsReceived: number;
  hostViewers: number;
}

export interface ViewerEngagement {
  userId: string;
  username: string;
  watchTime: number;
  messageCount: number;
  lastSeen: number;
  segment: ViewerSegment;
  isSubscriber: boolean;
  isFollower: boolean;
  isModerator: boolean;
  isVIP: boolean;
}

export interface ChatAnalytics {
  totalMessages: number;
  uniqueChatters: number;
  averageMessageLength: number;
  topChatters: Array<{
    userId: string;
    username: string;
    messageCount: number;
  }>;
  topEmotes: Array<{
    emoteId: string;
    emoteName: string;
    usageCount: number;
  }>;
  topWords: Array<{
    word: string;
    count: number;
  }>;
  sentimentScore: number;
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  label?: string;
}

export interface ComparisonData {
  period1: string;
  period2: string;
  metric: AnalyticsMetric;
  value1: number;
  value2: number;
  difference: number;
  percentageChange: number;
}

export interface TrendAnalysis {
  metric: AnalyticsMetric;
  direction: 'up' | 'down' | 'stable';
  value: number;
  previousValue: number;
  percentageChange: number;
  period: AnalyticsPeriod;
}

// Charts and Visualizations
export interface AnalyticsChart {
  id: string;
  type: ChartType;
  title: string;
  metric: AnalyticsMetric;
  period: AnalyticsPeriod;
  granularity: TimeGranularity;
  data: TimeSeriesData[];
  config: ChartConfig;
}

export interface ChartConfig {
  showLegend: boolean;
  showGrid: boolean;
  showTooltips: boolean;
  colors: string[];
  height: number;
  width?: number;
}

// Reports
export interface AnalyticsReport {
  id: string;
  type: ReportType;
  title: string;
  period: AnalyticsPeriod;
  startDate: number;
  endDate: number;
  createdAt: number;
  metrics: AnalyticsMetric[];
  data: any;
  charts: AnalyticsChart[];
  summary: ReportSummary;
}

export interface ReportSummary {
  totalStreams: number;
  totalDuration: number;
  averageViewers: number;
  peakViewers: number;
  totalFollowers: number;
  totalSubscribers: number;
  totalDonations: number;
  keyInsights: string[];
}

// Goals and KPIs
export interface AnalyticsGoal {
  id: string;
  title: string;
  metric: AnalyticsMetric;
  target: number;
  current: number;
  progress: number;
  period: AnalyticsPeriod;
  deadline?: number;
  enabled: boolean;
}

// Settings
export interface AnalyticsProSettings {
  defaultPeriod: AnalyticsPeriod;
  autoRefresh: boolean;
  refreshInterval: number;
  showTrends: boolean;
  enableHeatmaps: boolean;
  enableComparison: boolean;
  exportFormat: ExportFormat;
  timezone: string;
  dateFormat: string;
}

// ============================================================================
// MANAGER INTERFACE
// ============================================================================

export interface AnalyticsProEvents {
  'data-updated': [StreamAnalyticsData[]];
  'chart-updated': [AnalyticsChart];
  'report-generated': [AnalyticsReport];
  'goal-progress': [AnalyticsGoal];
  'goal-reached': [AnalyticsGoal];
}

export interface IAnalyticsProManager extends EventEmitter {
  // Data Management
  getAnalyticsData(period: AnalyticsPeriod, startDate?: number, endDate?: number): StreamAnalyticsData[];
  addAnalyticsData(data: StreamAnalyticsData): void;
  updateAnalyticsData(sessionId: string, updates: Partial<StreamAnalyticsData>): void;
  deleteAnalyticsData(sessionId: string): void;
  getAnalyticsDataBySessionId(sessionId: string): StreamAnalyticsData | null;
  
  // Metrics and Calculations
  calculateMetrics(metric: AnalyticsMetric, period: AnalyticsPeriod): number;
  getMetricsSummary(period: AnalyticsPeriod): Record<AnalyticsMetric, number>;
  getTrends(period: AnalyticsPeriod): TrendAnalysis[];
  
  // Viewer Analytics
  getViewerEngagement(period: AnalyticsPeriod): ViewerEngagement[];
  getViewerSegments(period: AnalyticsPeriod): Record<ViewerSegment, number>;
  getTopViewers(limit: number, period: AnalyticsPeriod): ViewerEngagement[];
  
  // Chat Analytics
  getChatAnalytics(period: AnalyticsPeriod): ChatAnalytics;
  analyzeChatSentiment(messages: string[]): number;
  getChatHeatmap(period: AnalyticsPeriod): TimeSeriesData[];
  
  // Charts
  generateChart(metric: AnalyticsMetric, period: AnalyticsPeriod, granularity: TimeGranularity): AnalyticsChart;
  getCharts(): AnalyticsChart[];
  addChart(chart: Omit<AnalyticsChart, 'id'>): string;
  removeChart(chartId: string): void;
  
  // Comparison
  comparePeriods(metric: AnalyticsMetric, period1: AnalyticsPeriod, period2: AnalyticsPeriod): ComparisonData;
  compareSessions(sessionId1: string, sessionId2: string): ComparisonData[];
  
  // Reports
  generateReport(type: ReportType, period: AnalyticsPeriod, startDate?: number, endDate?: number): AnalyticsReport;
  getReports(): AnalyticsReport[];
  exportReport(reportId: string, format: ExportFormat): string;
  deleteReport(reportId: string): void;
  
  // Goals
  getGoals(): AnalyticsGoal[];
  addGoal(goal: Omit<AnalyticsGoal, 'id' | 'progress'>): string;
  updateGoal(goalId: string, updates: Partial<AnalyticsGoal>): void;
  removeGoal(goalId: string): void;
  checkGoals(): void;
  
  // Settings
  getSettings(): AnalyticsProSettings;
  updateSettings(settings: Partial<AnalyticsProSettings>): void;
  resetSettings(): void;
  
  // Persistence
  saveToStorage(): void;
  loadFromStorage(): void;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

export interface AnalyticsProStorage {
  settings: AnalyticsProSettings;
  data: StreamAnalyticsData[];
  viewerEngagement: ViewerEngagement[];
  charts: AnalyticsChart[];
  reports: AnalyticsReport[];
  goals: AnalyticsGoal[];
}

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsProSettings = {
  defaultPeriod: AnalyticsPeriod.LAST_7_DAYS,
  autoRefresh: false,
  refreshInterval: 30000,
  showTrends: true,
  enableHeatmaps: true,
  enableComparison: true,
  exportFormat: ExportFormat.CSV,
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD'
};