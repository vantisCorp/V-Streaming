/**
 * Advanced Analytics Dashboard Type Definitions
 * Comprehensive analytics with real-time metrics and visualizations
 */

export type MetricType = 
  | 'viewers'
  | 'followers'
  | 'subscribers'
  | 'donations'
  | 'messages'
  | 'duration'
  | 'bitrate'
  | 'fps'
  | 'dropped_frames'
  | 'uptime'
  | 'engagement';

export type TimeRange = 
  | '1h'
  | '6h'
  | '12h'
  | '24h'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

export type ChartType = 
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'gauge'
  | 'table';

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  platform?: string;
  metadata?: Record<string, any>;
}

export interface MetricSeries {
  metric: MetricType;
  name: string;
  data: MetricDataPoint[];
  unit: string;
  color: string;
  platform?: string;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  type: MetricType;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  icon: string;
  color: string;
  historical: MetricDataPoint[];
  goal?: number;
  goalType?: 'minimum' | 'target' | 'maximum';
}

export interface StreamSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  title: string;
  platforms: string[];
  peakViewers: number;
  averageViewers: number;
  totalMessages: number;
  newFollowers: number;
  newSubscribers: number;
  donations: number;
  donationsAmount: number;
  recordingSize: number; // bytes
  recordingDuration: number;
  highlights: number;
  screenshots: number;
}

export interface EngagementMetrics {
  totalMessages: number;
  uniqueChatters: number;
  averageMessagesPerMinute: number;
  peakMessagesPerMinute: number;
  activeChatters: number;
  lurkers: number;
  engagementRate: number; // percentage
  emoteUsage: Record<string, number>;
  commandUsage: Record<string, number>;
  topChatters: Array<{ username: string; messages: number; }>;
}

export interface ViewerMetrics {
  currentViewers: number;
  peakViewers: number;
  averageViewers: number;
  uniqueViewers: number;
  returningViewers: number;
  newViewers: number;
  watchTime: number; // total hours
  averageWatchTime: number; // minutes per viewer
  viewerRetentionRate: number; // percentage
  chatParticipationRate: number; // percentage
}

export interface GrowthMetrics {
  followers: {
    current: number;
    gained: number;
    lost: number;
    netChange: number;
    growthRate: number; // percentage
    dailyGrowth: MetricDataPoint[];
  };
  subscribers: {
    current: number;
    gained: number;
    lost: number;
    netChange: number;
    growthRate: number;
    dailyGrowth: MetricDataPoint[];
  };
  revenue: {
    total: number;
    donations: number;
    subscriptions: number;
    bits: number;
    other: number;
    dailyRevenue: MetricDataPoint[];
  };
}

export interface PerformanceMetrics {
  averageBitrate: number;
  peakBitrate: number;
  minBitrate: number;
  averageFPS: number;
  droppedFrames: number;
  droppedFramesPercent: number;
  uptime: number; // percentage
  streamStability: number; // percentage
  technicalIssues: number;
  reconnections: number;
}

export interface ComparisonData {
  period1: {
    start: Date;
    end: Date;
    metrics: Record<MetricType, number>;
  };
  period2: {
    start: Date;
    end: Date;
    metrics: Record<MetricType, number>;
  };
  changes: Record<MetricType, {
    absolute: number;
    percent: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface DashboardWidget {
  id: string;
  type: ChartType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    metrics: MetricType[];
    timeRange: TimeRange;
    showGoal?: boolean;
    showTrend?: boolean;
    showComparison?: boolean;
    customThreshold?: number;
  };
  data: any;
}

export interface DashboardConfig {
  id: string;
  name: string;
  layout: 'grid' | 'custom';
  widgets: DashboardWidget[];
  timeRange: TimeRange;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  showGoals: boolean;
  showTrends: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: MetricType;
  condition: 'greater_than' | 'less_than' | 'equal_to' | 'not_equal_to' | 'percentage_change';
  threshold: number;
  timeRange: TimeRange;
  enabled: boolean;
  notificationChannels: ('toast' | 'sound' | 'email' | 'discord' | 'slack')[];
  lastTriggered?: Date;
  triggerCount: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  format: 'pdf' | 'html' | 'csv' | 'json';
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}

export interface ReportSection {
  type: 'summary' | 'chart' | 'table' | 'text';
  title: string;
  config: any;
  metrics: MetricType[];
}

export interface AnalyticsSettings {
  enabled: boolean;
  trackingEnabled: boolean;
  retentionDays: number;
  autoExportEnabled: boolean;
  exportFormat: 'csv' | 'json';
  alertRules: AlertRule[];
  dashboardConfig: DashboardConfig;
  reportTemplates: ReportTemplate[];
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  id: 'default-dashboard',
  name: 'Main Dashboard',
  layout: 'grid',
  timeRange: '24h',
  autoRefresh: true,
  refreshInterval: 30,
  showGoals: true,
  showTrends: true,
  widgets: [
    {
      id: 'widget-viewers',
      type: 'line',
      title: 'Viewer Count',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {
        metrics: ['viewers'],
        timeRange: '24h',
        showTrend: true,
      },
      data: [],
    },
    {
      id: 'widget-messages',
      type: 'area',
      title: 'Chat Activity',
      position: { x: 3, y: 0, w: 3, h: 2 },
      config: {
        metrics: ['messages'],
        timeRange: '24h',
        showTrend: true,
      },
      data: [],
    },
    {
      id: 'widget-followers',
      type: 'bar',
      title: 'Follower Growth',
      position: { x: 6, y: 0, w: 3, h: 2 },
      config: {
        metrics: ['followers'],
        timeRange: '7d',
        showTrend: true,
      },
      data: [],
    },
    {
      id: 'widget-performance',
      type: 'gauge',
      title: 'Stream Performance',
      position: { x: 9, y: 0, w: 3, h: 2 },
      config: {
        metrics: ['bitrate', 'fps'],
        timeRange: '1h',
        showGoal: true,
      },
      data: [],
    },
    {
      id: 'widget-engagement',
      type: 'pie',
      title: 'Engagement Breakdown',
      position: { x: 0, y: 2, w: 4, h: 2 },
      config: {
        metrics: ['messages'],
        timeRange: '24h',
      },
      data: [],
    },
    {
      id: 'widget-revenue',
      type: 'table',
      title: 'Revenue Summary',
      position: { x: 4, y: 2, w: 4, h: 2 },
      config: {
        metrics: ['donations'],
        timeRange: '30d',
      },
      data: [],
    },
    {
      id: 'widget-sessions',
      type: 'table',
      title: 'Recent Sessions',
      position: { x: 8, y: 2, w: 4, h: 2 },
      config: {
        metrics: ['duration', 'viewers'],
        timeRange: '7d',
      },
      data: [],
    },
  ],
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  enabled: true,
  trackingEnabled: true,
  retentionDays: 90,
  autoExportEnabled: false,
  exportFormat: 'csv',
  alertRules: [],
  dashboardConfig: DEFAULT_DASHBOARD_CONFIG,
  reportTemplates: [],
};

export const METRIC_DEFINITIONS: Record<MetricType, { name: string; unit: string; icon: string; color: string }> = {
  viewers: { name: 'Viewers', unit: '', icon: '👥', color: '#8B5CF6' },
  followers: { name: 'Followers', unit: '', icon: '➕', color: '#10B981' },
  subscribers: { name: 'Subscribers', unit: '', icon: '⭐', color: '#F59E0B' },
  donations: { name: 'Donations', unit: '$', icon: '💰', color: '#EF4444' },
  messages: { name: 'Messages', unit: '', icon: '💬', color: '#3B82F6' },
  duration: { name: 'Duration', unit: 'm', icon: '⏱️', color: '#6366F1' },
  bitrate: { name: 'Bitrate', unit: 'kbps', icon: '📊', color: '#EC4899' },
  fps: { name: 'FPS', unit: '', icon: '🎬', color: '#14B8A6' },
  dropped_frames: { name: 'Dropped Frames', unit: '%', icon: '⚠️', color: '#F97316' },
  uptime: { name: 'Uptime', unit: '%', icon: '✅', color: '#22C55E' },
  engagement: { name: 'Engagement', unit: '%', icon: '❤️', color: '#F472B6' },
};