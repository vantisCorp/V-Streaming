import { EventEmitter } from 'events';
import {
  AnalyticsMetric,
  MetricType,
  TimeRange,
  MetricDataPoint,
  MetricSeries,
  StreamSession,
  EngagementMetrics,
  ViewerMetrics,
  GrowthMetrics,
  PerformanceMetrics,
  ComparisonData,
  DashboardWidget,
  DashboardConfig,
  AlertRule,
  AnalyticsSettings,
  DEFAULT_DASHBOARD_CONFIG,
  DEFAULT_ANALYTICS_SETTINGS,
  METRIC_DEFINITIONS,
} from '../types/analytics';

interface AnalyticsEvents {
  metricsUpdated: (metrics: Record<MetricType, AnalyticsMetric>) => void;
  sessionStarted: (session: StreamSession) => void;
  sessionEnded: (session: StreamSession) => void;
  alertTriggered: (alert: AlertRule, value: number) => void;
  dataRefreshed: () => void;
  settingsChanged: (settings: AnalyticsSettings) => void;
}

export class AnalyticsManager extends EventEmitter {
  private metrics: Map<MetricType, AnalyticsMetric> = new Map();
  private sessions: StreamSession[] = [];
  private currentSession: StreamSession | null = null;
  private settings: AnalyticsSettings;
  private refreshInterval?: ReturnType<typeof setInterval>;
  private storageKey = 'vstreaming_analytics_settings';
  private sessionsKey = 'vstreaming_stream_sessions';

  constructor() {
    super();
    this.settings = { ...DEFAULT_ANALYTICS_SETTINGS };
    this.initializeMetrics();
    this.loadFromStorage();
  }

  // ============ Initialization ============

  private initializeMetrics(): void {
    Object.entries(METRIC_DEFINITIONS).forEach(([type, definition]) => {
      this.metrics.set(type as MetricType, {
        id: `metric-${type}`,
        name: definition.name,
        type: type as MetricType,
        currentValue: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        unit: definition.unit,
        icon: definition.icon,
        color: definition.color,
        historical: [],
      });
    });
  }

  // ============ Metrics Management ============

  /**
   * Get all metrics
   */
  getMetrics(): Record<MetricType, AnalyticsMetric> {
    return Object.fromEntries(this.metrics) as Record<MetricType, AnalyticsMetric>;
  }

  /**
   * Get specific metric
   */
  getMetric(type: MetricType): AnalyticsMetric | undefined {
    return this.metrics.get(type);
  }

  /**
   * Update metric value
   */
  updateMetric(type: MetricType, value: number): void {
    const metric = this.metrics.get(type);
    if (!metric) return;

    const previousValue = metric.currentValue;
    const change = value - previousValue;
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

    metric.previousValue = previousValue;
    metric.currentValue = value;
    metric.change = change;
    metric.changePercent = changePercent;
    metric.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    // Add to historical data
    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      value,
    };
    metric.historical.push(dataPoint);

    // Keep only last 1000 data points
    if (metric.historical.length > 1000) {
      metric.historical = metric.historical.slice(-1000);
    }

    // Check alert rules
    this.checkAlertRules(type, value);

    this.emit('metricsUpdated', this.getMetrics());
  }

  /**
   * Get metric history for time range
   */
  getMetricHistory(type: MetricType, timeRange: TimeRange): MetricDataPoint[] {
    const metric = this.metrics.get(type);
    if (!metric) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return metric.historical.filter(dp => dp.timestamp >= startDate);
  }

  /**
   * Get metric series for charts
   */
  getMetricSeries(types: MetricType[], timeRange: TimeRange): MetricSeries[] {
    return types.map(type => {
      const metric = this.metrics.get(type);
      if (!metric) {
        return {
          metric: type,
          name: type,
          data: [],
          unit: '',
          color: '#666666',
        };
      }

      return {
        metric: type,
        name: metric.name,
        data: this.getMetricHistory(type, timeRange),
        unit: metric.unit,
        color: metric.color,
      };
    });
  }

  // ============ Session Management ============

  /**
   * Start a new stream session
   */
  startSession(title: string, platforms: string[]): StreamSession {
    const session: StreamSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      title,
      platforms,
      peakViewers: 0,
      averageViewers: 0,
      totalMessages: 0,
      newFollowers: 0,
      newSubscribers: 0,
      donations: 0,
      donationsAmount: 0,
      recordingSize: 0,
      recordingDuration: 0,
      highlights: 0,
      screenshots: 0,
    };

    this.currentSession = session;
    this.emit('sessionStarted', session);

    return session;
  }

  /**
   * End current session
   */
  endSession(): StreamSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = Math.floor(
      (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000
    );

    // Calculate average viewers
    const viewersMetric = this.metrics.get('viewers');
    if (viewersMetric && viewersMetric.historical.length > 0) {
      const avgViewers = viewersMetric.historical.reduce((sum, dp) => sum + dp.value, 0) / viewersMetric.historical.length;
      this.currentSession.averageViewers = Math.round(avgViewers);
    }

    this.sessions.push(this.currentSession);
    this.saveSessions();

    const endedSession = this.currentSession;
    this.currentSession = null;
    this.emit('sessionEnded', endedSession);

    return endedSession;
  }

  /**
   * Get all sessions
   */
  getSessions(limit?: number): StreamSession[] {
    const sorted = [...this.sessions].sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get current session
   */
  getCurrentSession(): StreamSession | null {
    return this.currentSession;
  }

  /**
   * Update current session stats
   */
  updateCurrentSession(updates: Partial<StreamSession>): void {
    if (!this.currentSession) return;

    Object.assign(this.currentSession, updates);

    // Update peak viewers
    if (updates.peakViewers && updates.peakViewers > this.currentSession.peakViewers) {
      this.currentSession.peakViewers = updates.peakViewers;
    }
  }

  // ============ Analytics Aggregation ============

  /**
   * Get engagement metrics
   */
  getEngagementMetrics(): EngagementMetrics {
    const messagesMetric = this.metrics.get('messages');
    const totalMessages = messagesMetric?.currentValue || 0;

    return {
      totalMessages,
      uniqueChatters: Math.round(totalMessages * 0.3), // Simulated
      averageMessagesPerMinute: Math.round(totalMessages / 60),
      peakMessagesPerMinute: Math.round(totalMessages / 30),
      activeChatters: Math.round(totalMessages * 0.25),
      lurkers: Math.round(totalMessages * 0.1),
      engagementRate: Math.min(100, (totalMessages / 1000) * 100),
      emoteUsage: {},
      commandUsage: {},
      topChatters: [],
    };
  }

  /**
   * Get viewer metrics
   */
  getViewerMetrics(): ViewerMetrics {
    const viewersMetric = this.metrics.get('viewers');
    const currentViewers = viewersMetric?.currentValue || 0;

    return {
      currentViewers,
      peakViewers: this.currentSession?.peakViewers || 0,
      averageViewers: this.currentSession?.averageViewers || 0,
      uniqueViewers: Math.round(currentViewers * 1.5),
      returningViewers: Math.round(currentViewers * 0.6),
      newViewers: Math.round(currentViewers * 0.4),
      watchTime: currentViewers * 0.5,
      averageWatchTime: 15,
      viewerRetentionRate: 75,
      chatParticipationRate: 25,
    };
  }

  /**
   * Get growth metrics
   */
  getGrowthMetrics(): GrowthMetrics {
    const followersMetric = this.metrics.get('followers');
    const subscribersMetric = this.metrics.get('subscribers');
    const donationsMetric = this.metrics.get('donations');

    const followersHistory = followersMetric?.historical || [];
    const subscribersHistory = subscribersMetric?.historical || [];

    return {
      followers: {
        current: followersMetric?.currentValue || 0,
        gained: this.currentSession?.newFollowers || 0,
        lost: Math.round((this.currentSession?.newFollowers || 0) * 0.1),
        netChange: this.currentSession?.newFollowers || 0,
        growthRate: followersMetric?.changePercent || 0,
        dailyGrowth: followersHistory.slice(-24),
      },
      subscribers: {
        current: subscribersMetric?.currentValue || 0,
        gained: this.currentSession?.newSubscribers || 0,
        lost: Math.round((this.currentSession?.newSubscribers || 0) * 0.05),
        netChange: this.currentSession?.newSubscribers || 0,
        growthRate: subscribersMetric?.changePercent || 0,
        dailyGrowth: subscribersHistory.slice(-24),
      },
      revenue: {
        total: (donationsMetric?.currentValue || 0) * 2.5,
        donations: donationsMetric?.currentValue || 0,
        subscriptions: (subscribersMetric?.currentValue || 0) * 4.99,
        bits: 0,
        other: 0,
        dailyRevenue: [],
      },
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const bitrateMetric = this.metrics.get('bitrate');
    const fpsMetric = this.metrics.get('fps');
    const droppedFramesMetric = this.metrics.get('dropped_frames');

    return {
      averageBitrate: bitrateMetric?.currentValue || 6000,
      peakBitrate: 6500,
      minBitrate: 5500,
      averageFPS: fpsMetric?.currentValue || 60,
      droppedFrames: droppedFramesMetric?.currentValue || 0,
      droppedFramesPercent: (droppedFramesMetric?.currentValue || 0) / 100,
      uptime: 99.9,
      streamStability: 98.5,
      technicalIssues: 0,
      reconnections: 0,
    };
  }

  /**
   * Get comparison data between two periods
   */
  getComparisonData(period1Start: Date, period1End: Date, period2Start: Date, period2End: Date): ComparisonData {
    const metrics = ['viewers', 'followers', 'messages', 'donations'] as MetricType[];
    const period1Metrics: Record<MetricType, number> = {} as any;
    const period2Metrics: Record<MetricType, number> = {} as any;
    const changes: Record<MetricType, { absolute: number; percent: number; trend: 'up' | 'down' | 'stable' }> = {} as any;

    metrics.forEach(type => {
      const metric = this.metrics.get(type);
      if (metric) {
        const p1Data = metric.historical.filter(dp => dp.timestamp >= period1Start && dp.timestamp <= period1End);
        const p2Data = metric.historical.filter(dp => dp.timestamp >= period2Start && dp.timestamp <= period2End);

        const p1Avg = p1Data.length > 0 ? p1Data.reduce((sum, dp) => sum + dp.value, 0) / p1Data.length : 0;
        const p2Avg = p2Data.length > 0 ? p2Data.reduce((sum, dp) => sum + dp.value, 0) / p2Data.length : 0;

        period1Metrics[type] = Math.round(p1Avg);
        period2Metrics[type] = Math.round(p2Avg);

        const absolute = p2Avg - p1Avg;
        const percent = p1Avg > 0 ? (absolute / p1Avg) * 100 : 0;

        changes[type] = {
          absolute: Math.round(absolute),
          percent: Math.round(percent * 10) / 10,
          trend: absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'stable',
        };
      }
    });

    return {
      period1: { start: period1Start, end: period1End, metrics: period1Metrics },
      period2: { start: period2Start, end: period2End, metrics: period2Metrics },
      changes,
    };
  }

  // ============ Alert Management ============

  /**
   * Add alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id' | 'triggerCount'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `alert-${Date.now()}`,
      triggerCount: 0,
    };

    this.settings.alertRules.push(newRule);
    this.saveSettings();
    this.emit('settingsChanged', this.settings);

    return newRule;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const index = this.settings.alertRules.findIndex(r => r.id === ruleId);
    if (index === -1) return;

    this.settings.alertRules[index] = {
      ...this.settings.alertRules[index],
      ...updates,
    };

    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): void {
    this.settings.alertRules = this.settings.alertRules.filter(r => r.id !== ruleId);
    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  /**
   * Check alert rules
   */
  private checkAlertRules(metricType: MetricType, value: number): void {
    this.settings.alertRules.forEach(rule => {
      if (!rule.enabled || rule.metric !== metricType) return;

      let triggered = false;

      switch (rule.condition) {
        case 'greater_than':
          triggered = value > rule.threshold;
          break;
        case 'less_than':
          triggered = value < rule.threshold;
          break;
        case 'equal_to':
          triggered = value === rule.threshold;
          break;
        case 'not_equal_to':
          triggered = value !== rule.threshold;
          break;
        case 'percentage_change':
          const metric = this.metrics.get(metricType);
          if (metric && metric.previousValue > 0) {
            const changePercent = Math.abs((value - metric.previousValue) / metric.previousValue * 100);
            triggered = changePercent > rule.threshold;
          }
          break;
      }

      if (triggered) {
        rule.lastTriggered = new Date();
        rule.triggerCount++;
        this.emit('alertTriggered', rule, value);
      }
    });
  }

  // ============ Dashboard Management ============

  /**
   * Get dashboard configuration
   */
  getDashboardConfig(): DashboardConfig {
    return this.settings.dashboardConfig;
  }

  /**
   * Update dashboard configuration
   */
  updateDashboardConfig(config: Partial<DashboardConfig>): void {
    this.settings.dashboardConfig = {
      ...this.settings.dashboardConfig,
      ...config,
    };

    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  /**
   * Add widget to dashboard
   */
  addWidget(widget: Omit<DashboardWidget, 'id'>): DashboardWidget {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
    };

    this.settings.dashboardConfig.widgets.push(newWidget);
    this.saveSettings();
    this.emit('settingsChanged', this.settings);

    return newWidget;
  }

  /**
   * Remove widget from dashboard
   */
  removeWidget(widgetId: string): void {
    this.settings.dashboardConfig.widgets = this.settings.dashboardConfig.widgets.filter(w => w.id !== widgetId);
    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  // ============ Settings Management ============

  /**
   * Get settings
   */
  getSettings(): AnalyticsSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<AnalyticsSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };

    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh(): void {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, this.settings.dashboardConfig.refreshInterval * 1000);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  /**
   * Refresh all data
   */
  refreshData(): void {
    // Simulate data refresh
    Object.keys(METRIC_DEFINITIONS).forEach(type => {
      const metric = this.metrics.get(type as MetricType);
      if (metric) {
        const variation = (Math.random() - 0.5) * 0.1; // ±5%
        const newValue = Math.max(0, metric.currentValue * (1 + variation));
        this.updateMetric(type as MetricType, Math.round(newValue));
      }
    });

    this.emit('dataRefreshed');
  }

  // ============ Export ============

  /**
   * Export data to CSV
   */
  exportToCSV(timeRange: TimeRange): string {
    const metrics = Array.from(this.metrics.values());
    const rows = ['Metric,Current,Previous,Change,Change %,Trend'];

    metrics.forEach(metric => {
      rows.push(`${metric.name},${metric.currentValue},${metric.previousValue},${metric.change},${metric.changePercent},${metric.trend}`);
    });

    return rows.join('\n');
  }

  /**
   * Export data to JSON
   */
  exportToJSON(timeRange: TimeRange): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      sessions: this.sessions,
      exportedAt: new Date(),
    }, null, 2);
  }

  // ============ Storage ============

  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save analytics settings:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const savedSettings = localStorage.getItem(this.storageKey);
      if (savedSettings) {
        this.settings = { ...DEFAULT_ANALYTICS_SETTINGS, ...JSON.parse(savedSettings) };
      }

      const savedSessions = localStorage.getItem(this.sessionsKey);
      if (savedSessions) {
        this.sessions = JSON.parse(savedSessions);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  private saveSessions(): void {
    try {
      localStorage.setItem(this.sessionsKey, JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  /**
   * Get statistics summary
   */
  getStatisticsSummary(): {
    totalSessions: number;
    totalStreamTime: number;
    totalViewers: number;
    totalFollowers: number;
    averageViewers: number;
    bestViewers: number;
  } {
    const totalSessions = this.sessions.length;
    const totalStreamTime = this.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalViewers = this.sessions.reduce((sum, s) => sum + s.peakViewers, 0);
    const totalFollowers = this.sessions.reduce((sum, s) => sum + s.newFollowers, 0);
    const averageViewers = totalSessions > 0 ? totalViewers / totalSessions : 0;
    const bestViewers = Math.max(...this.sessions.map(s => s.peakViewers), 0);

    return {
      totalSessions,
      totalStreamTime,
      totalViewers,
      totalFollowers,
      averageViewers,
      bestViewers,
    };
  }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager();