import { EventEmitter } from 'eventemitter3';
import {
  IAnalyticsProManager,
  AnalyticsProEvents,
  StreamAnalyticsData,
  ViewerEngagement,
  ChatAnalytics,
  TimeSeriesData,
  ComparisonData,
  TrendAnalysis,
  AnalyticsChart,
  ReportType,
  AnalyticsReport,
  ReportSummary,
  AnalyticsGoal,
  AnalyticsProSettings,
  AnalyticsProStorage,
  AnalyticsPeriod,
  AnalyticsMetric,
  ChartType,
  TimeGranularity,
  ViewerSegment,
  ExportFormat,
  DEFAULT_ANALYTICS_SETTINGS
} from '../types/analyticsPro';

// ============================================================================
// MANAGER CLASS
// ============================================================================

export class AnalyticsProManager extends EventEmitter<AnalyticsProEvents> {
  
  // ==========================================================================
  // PRIVATE FIELDS
  // ==========================================================================
  
  private settings: AnalyticsProSettings;
  private data: StreamAnalyticsData[];
  private viewerEngagement: ViewerEngagement[];
  private charts: AnalyticsChart[];
  private reports: AnalyticsReport[];
  private goals: AnalyticsGoal[];
  
  private refreshInterval: ReturnType<typeof setInterval> | null;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  private constructor() {
    super();
    
    this.settings = { ...DEFAULT_ANALYTICS_SETTINGS };
    this.data = [];
    this.viewerEngagement = [];
    this.charts = [];
    this.reports = [];
    this.goals = [];
    
    this.refreshInterval = null;
    
    this.loadFromStorage();
    this.startAutoRefresh();
  }
  
  // ==========================================================================
  // SINGLETON INSTANCE
  // ==========================================================================
  
  private static instance: AnalyticsProManager | null = null;
  
  public static getInstance(): AnalyticsProManager {
    if (!AnalyticsProManager.instance) {
      AnalyticsProManager.instance = new AnalyticsProManager();
    }
    return AnalyticsProManager.instance;
  }
  
  // ==========================================================================
  // DATA MANAGEMENT
  // ==========================================================================
  
  public getAnalyticsData(period: AnalyticsPeriod, startDate?: number, endDate?: number): StreamAnalyticsData[] {
    const now = Date.now();
    let start: number;
    let end: number = now;
    
    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      switch (period) {
        case AnalyticsPeriod.TODAY:
          start = new Date().setHours(0, 0, 0, 0);
          break;
        case AnalyticsPeriod.YESTERDAY:
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          start = yesterday.setHours(0, 0, 0, 0);
          end = yesterday.setHours(23, 59, 59, 999);
          break;
        case AnalyticsPeriod.LAST_7_DAYS:
          start = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case AnalyticsPeriod.LAST_30_DAYS:
          start = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case AnalyticsPeriod.LAST_90_DAYS:
          start = now - 90 * 24 * 60 * 60 * 1000;
          break;
        case AnalyticsPeriod.THIS_MONTH:
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);
          start = thisMonth.getTime();
          break;
        case AnalyticsPeriod.LAST_MONTH:
          const lastMonth = new Date();
          lastMonth.setDate(1);
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          start = lastMonth.getTime();
          end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getTime();
          break;
        default:
          start = now - 7 * 24 * 60 * 60 * 1000;
      }
    }
    
    return this.data.filter(d => d.startTime >= start && d.startTime <= end);
  }
  
  public addAnalyticsData(data: StreamAnalyticsData): void {
    this.data.push(data);
    this.emit('data-updated', this.data);
    this.saveToStorage();
  }
  
  public updateAnalyticsData(sessionId: string, updates: Partial<StreamAnalyticsData>): void {
    const index = this.data.findIndex(d => d.sessionId === sessionId);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.emit('data-updated', this.data);
      this.saveToStorage();
    }
  }
  
  public deleteAnalyticsData(sessionId: string): void {
    this.data = this.data.filter(d => d.sessionId !== sessionId);
    this.emit('data-updated', this.data);
    this.saveToStorage();
  }
  
  public getAnalyticsDataBySessionId(sessionId: string): StreamAnalyticsData | null {
    return this.data.find(d => d.sessionId === sessionId) || null;
  }
  
  // ==========================================================================
  // METRICS AND CALCULATIONS
  // ==========================================================================
  
  public calculateMetrics(metric: AnalyticsMetric, period: AnalyticsPeriod): number {
    const data = this.getAnalyticsData(period);
    
    if (data.length === 0) return 0;
    
    switch (metric) {
      case AnalyticsMetric.VIEWER_COUNT:
        return data.reduce((sum, d) => sum + d.viewerCount, 0) / data.length;
      case AnalyticsMetric.WATCH_TIME:
        return data.reduce((sum, d) => sum + d.watchTime, 0);
      case AnalyticsMetric.CHAT_MESSAGES:
        return data.reduce((sum, d) => sum + d.chatMessages, 0);
      case AnalyticsMetric.NEW_FOLLOWERS:
        return data.reduce((sum, d) => sum + d.newFollowers, 0);
      case AnalyticsMetric.NEW_SUBSCRIBERS:
        return data.reduce((sum, d) => sum + d.newSubscribers, 0);
      case AnalyticsMetric.DONATIONS:
        return data.reduce((sum, d) => sum + d.totalDonations, 0);
      case AnalyticsMetric.BITS_CHEERS:
        return data.reduce((sum, d) => sum + d.totalCheerBits, 0);
      case AnalyticsMetric.STREAM_DURATION:
        return data.reduce((sum, d) => sum + d.duration, 0);
      case AnalyticsMetric.UNIQUE_CHATTERS:
        return data.reduce((sum, d) => sum + d.uniqueChatters, 0);
      case AnalyticsMetric.CLIPS_CREATED:
        return data.reduce((sum, d) => sum + d.clipsCreated, 0);
      default:
        return 0;
    }
  }
  
  public getMetricsSummary(period: AnalyticsPeriod): Record<AnalyticsMetric, number> {
    return {
      [AnalyticsMetric.VIEWER_COUNT]: this.calculateMetrics(AnalyticsMetric.VIEWER_COUNT, period),
      [AnalyticsMetric.WATCH_TIME]: this.calculateMetrics(AnalyticsMetric.WATCH_TIME, period),
      [AnalyticsMetric.CHAT_MESSAGES]: this.calculateMetrics(AnalyticsMetric.CHAT_MESSAGES, period),
      [AnalyticsMetric.NEW_FOLLOWERS]: this.calculateMetrics(AnalyticsMetric.NEW_FOLLOWERS, period),
      [AnalyticsMetric.NEW_SUBSCRIBERS]: this.calculateMetrics(AnalyticsMetric.NEW_SUBSCRIBERS, period),
      [AnalyticsMetric.DONATIONS]: this.calculateMetrics(AnalyticsMetric.DONATIONS, period),
      [AnalyticsMetric.BITS_CHEERS]: this.calculateMetrics(AnalyticsMetric.BITS_CHEERS, period),
      [AnalyticsMetric.STREAM_DURATION]: this.calculateMetrics(AnalyticsMetric.STREAM_DURATION, period),
      [AnalyticsMetric.UNIQUE_CHATTERS]: this.calculateMetrics(AnalyticsMetric.UNIQUE_CHATTERS, period),
      [AnalyticsMetric.CLIPS_CREATED]: this.calculateMetrics(AnalyticsMetric.CLIPS_CREATED, period)
    };
  }
  
  public getTrends(period: AnalyticsPeriod): TrendAnalysis[] {
    const metrics: AnalyticsMetric[] = Object.values(AnalyticsMetric);
    const trends: TrendAnalysis[] = [];
    
    metrics.forEach(metric => {
      const currentData = this.getAnalyticsData(period);
      const previousData = this.getAnalyticsData(period, 
        currentData.length > 0 ? currentData[0].startTime - this.getPeriodLength(period) : Date.now() - this.getPeriodLength(period) * 2,
        currentData.length > 0 ? currentData[0].startTime : Date.now() - this.getPeriodLength(period)
      );
      
      const currentValue = currentData.reduce((sum, d) => {
        switch (metric) {
          case AnalyticsMetric.VIEWER_COUNT: return sum + d.viewerAverage;
          case AnalyticsMetric.WATCH_TIME: return sum + d.watchTime;
          case AnalyticsMetric.CHAT_MESSAGES: return sum + d.chatMessages;
          case AnalyticsMetric.NEW_FOLLOWERS: return sum + d.newFollowers;
          case AnalyticsMetric.NEW_SUBSCRIBERS: return sum + d.newSubscribers;
          case AnalyticsMetric.DONATIONS: return sum + d.totalDonations;
          case AnalyticsMetric.BITS_CHEERS: return sum + d.totalCheerBits;
          case AnalyticsMetric.STREAM_DURATION: return sum + d.duration;
          case AnalyticsMetric.UNIQUE_CHATTERS: return sum + d.uniqueChatters;
          case AnalyticsMetric.CLIPS_CREATED: return sum + d.clipsCreated;
          default: return sum;
        }
      }, 0);
      
      const previousValue = previousData.reduce((sum, d) => {
        switch (metric) {
          case AnalyticsMetric.VIEWER_COUNT: return sum + d.viewerAverage;
          case AnalyticsMetric.WATCH_TIME: return sum + d.watchTime;
          case AnalyticsMetric.CHAT_MESSAGES: return sum + d.chatMessages;
          case AnalyticsMetric.NEW_FOLLOWERS: return sum + d.newFollowers;
          case AnalyticsMetric.NEW_SUBSCRIBERS: return sum + d.newSubscribers;
          case AnalyticsMetric.DONATIONS: return sum + d.totalDonations;
          case AnalyticsMetric.BITS_CHEERS: return sum + d.totalCheerBits;
          case AnalyticsMetric.STREAM_DURATION: return sum + d.duration;
          case AnalyticsMetric.UNIQUE_CHATTERS: return sum + d.uniqueChatters;
          case AnalyticsMetric.CLIPS_CREATED: return sum + d.clipsCreated;
          default: return sum;
        }
      }, 0);
      
      const percentageChange = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      
      trends.push({
        metric,
        direction: percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable',
        value: currentValue,
        previousValue,
        percentageChange,
        period
      });
    });
    
    return trends;
  }
  
  private getPeriodLength(period: AnalyticsPeriod): number {
    switch (period) {
      case AnalyticsPeriod.TODAY:
      case AnalyticsPeriod.YESTERDAY:
        return 24 * 60 * 60 * 1000;
      case AnalyticsPeriod.LAST_7_DAYS:
        return 7 * 24 * 60 * 60 * 1000;
      case AnalyticsPeriod.LAST_30_DAYS:
        return 30 * 24 * 60 * 60 * 1000;
      case AnalyticsPeriod.LAST_90_DAYS:
        return 90 * 24 * 60 * 60 * 1000;
      case AnalyticsPeriod.THIS_MONTH:
      case AnalyticsPeriod.LAST_MONTH:
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
  
  // ==========================================================================
  // VIEWER ANALYTICS
  // ==========================================================================
  
  public getViewerEngagement(period: AnalyticsPeriod): ViewerEngagement[] {
    const startTime = Date.now() - this.getPeriodLength(period);
    return this.viewerEngagement.filter(v => v.lastSeen >= startTime);
  }
  
  public getViewerSegments(period: AnalyticsPeriod): Record<ViewerSegment, number> {
    const engagement = this.getViewerEngagement(period);
    const segments: Record<ViewerSegment, number> = {
      [ViewerSegment.NEW]: 0,
      [ViewerSegment.RETURNING]: 0,
      [ViewerSegment.ACTIVE]: 0,
      [ViewerSegment.INACTIVE]: 0,
      [ViewerSegment.SUBSCRIBER]: 0,
      [ViewerSegment.FOLLOWER]: 0,
      [ViewerSegment.VIP]: 0,
      [ViewerSegment.MODERATOR]: 0
    };
    
    engagement.forEach(v => {
      segments[v.segment]++;
      if (v.isSubscriber) segments[ViewerSegment.SUBSCRIBER]++;
      if (v.isFollower) segments[ViewerSegment.FOLLOWER]++;
      if (v.isVIP) segments[ViewerSegment.VIP]++;
      if (v.isModerator) segments[ViewerSegment.MODERATOR]++;
    });
    
    return segments;
  }
  
  public getTopViewers(limit: number, period: AnalyticsPeriod): ViewerEngagement[] {
    const engagement = this.getViewerEngagement(period);
    return engagement
      .sort((a, b) => b.watchTime - a.watchTime)
      .slice(0, limit);
  }
  
  // ==========================================================================
  // CHAT ANALYTICS
  // ==========================================================================
  
  public getChatAnalytics(period: AnalyticsPeriod): ChatAnalytics {
    const data = this.getAnalyticsData(period);
    
    const totalMessages = data.reduce((sum, d) => sum + d.chatMessages, 0);
    const uniqueChatters = data.reduce((sum, d) => sum + d.uniqueChatters, 0);
    const averageMessageLength = 50; // Placeholder - would need actual chat data
    
    return {
      totalMessages,
      uniqueChatters,
      averageMessageLength,
      topChatters: [], // Would need actual chat data
      topEmotes: [], // Would need actual emote data
      topWords: [], // Would need actual word data
      sentimentScore: 0.5 // Would need sentiment analysis
    };
  }
  
  public analyzeChatSentiment(messages: string[]): number {
    // Simple sentiment analysis - placeholder
    const positiveWords = ['great', 'awesome', 'love', 'amazing', 'good', 'happy', 'lol', 'lmao'];
    const negativeWords = ['bad', 'hate', 'sad', 'angry', 'worst', 'terrible'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(message => {
      const lowerMessage = message.toLowerCase();
      positiveWords.forEach(word => {
        if (lowerMessage.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (lowerMessage.includes(word)) negativeCount++;
      });
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0.5;
    
    return positiveCount / total;
  }
  
  public getChatHeatmap(period: AnalyticsPeriod): TimeSeriesData[] {
    const data = this.getAnalyticsData(period);
    const heatmap: TimeSeriesData[] = [];
    
    data.forEach(d => {
      heatmap.push({
        timestamp: d.startTime,
        value: d.chatRate,
        label: new Date(d.startTime).toLocaleTimeString()
      });
    });
    
    return heatmap;
  }
  
  // ==========================================================================
  // CHARTS
  // ==========================================================================
  
  public generateChart(metric: AnalyticsMetric, period: AnalyticsPeriod, granularity: TimeGranularity): AnalyticsChart {
    const data = this.getAnalyticsData(period);
    const timeSeriesData: TimeSeriesData[] = [];
    
    // Group data by granularity
    const groupedData = new Map<number, number>();
    
    data.forEach(d => {
      const timestamp = this.getGranularityTimestamp(d.startTime, granularity);
      const value = this.getMetricValue(d, metric);
      groupedData.set(timestamp, (groupedData.get(timestamp) || 0) + value);
    });
    
    groupedData.forEach((value, timestamp) => {
      timeSeriesData.push({
        timestamp,
        value,
        label: new Date(timestamp).toLocaleDateString()
      });
    });
    
    timeSeriesData.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ChartType.LINE,
      title: `${metric} - ${period}`,
      metric,
      period,
      granularity,
      data: timeSeriesData,
      config: {
        showLegend: true,
        showGrid: true,
        showTooltips: true,
        colors: ['#667eea', '#764ba2'],
        height: 300
      }
    };
  }
  
  private getGranularityTimestamp(timestamp: number, granularity: TimeGranularity): number {
    const date = new Date(timestamp);
    
    switch (granularity) {
      case TimeGranularity.MINUTE:
        date.setSeconds(0, 0);
        break;
      case TimeGranularity.HOUR:
        date.setMinutes(0, 0, 0);
        break;
      case TimeGranularity.DAY:
        date.setHours(0, 0, 0, 0);
        break;
      case TimeGranularity.WEEK:
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        break;
      case TimeGranularity.MONTH:
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        break;
    }
    
    return date.getTime();
  }
  
  private getMetricValue(data: StreamAnalyticsData, metric: AnalyticsMetric): number {
    switch (metric) {
      case AnalyticsMetric.VIEWER_COUNT: return data.viewerAverage;
      case AnalyticsMetric.WATCH_TIME: return data.watchTime;
      case AnalyticsMetric.CHAT_MESSAGES: return data.chatMessages;
      case AnalyticsMetric.NEW_FOLLOWERS: return data.newFollowers;
      case AnalyticsMetric.NEW_SUBSCRIBERS: return data.newSubscribers;
      case AnalyticsMetric.DONATIONS: return data.totalDonations;
      case AnalyticsMetric.BITS_CHEERS: return data.totalCheerBits;
      case AnalyticsMetric.STREAM_DURATION: return data.duration;
      case AnalyticsMetric.UNIQUE_CHATTERS: return data.uniqueChatters;
      case AnalyticsMetric.CLIPS_CREATED: return data.clipsCreated;
      default: return 0;
    }
  }
  
  public getCharts(): AnalyticsChart[] {
    return this.charts;
  }
  
  public addChart(chart: Omit<AnalyticsChart, 'id'>): string {
    const newChart: AnalyticsChart = {
      ...chart,
      id: `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.charts.push(newChart);
    this.emit('chart-updated', newChart);
    this.saveToStorage();
    return newChart.id;
  }
  
  public removeChart(chartId: string): void {
    this.charts = this.charts.filter(c => c.id !== chartId);
    this.saveToStorage();
  }
  
  // ==========================================================================
  // COMPARISON
  // ==========================================================================
  
  public comparePeriods(metric: AnalyticsMetric, period1: AnalyticsPeriod, period2: AnalyticsPeriod): ComparisonData {
    const value1 = this.calculateMetrics(metric, period1);
    const value2 = this.calculateMetrics(metric, period2);
    const difference = value2 - value1;
    const percentageChange = value1 !== 0 ? ((value2 - value1) / value1) * 100 : 0;
    
    return {
      period1,
      period2,
      metric,
      value1,
      value2,
      difference,
      percentageChange
    };
  }
  
  public compareSessions(sessionId1: string, sessionId2: string): ComparisonData[] {
    const session1 = this.getAnalyticsDataBySessionId(sessionId1);
    const session2 = this.getAnalyticsDataBySessionId(sessionId2);
    
    if (!session1 || !session2) {
      throw new Error('One or both sessions not found');
    }
    
    const metrics: AnalyticsMetric[] = Object.values(AnalyticsMetric);
    const comparisons: ComparisonData[] = [];
    
    metrics.forEach(metric => {
      const value1 = this.getMetricValue(session1, metric);
      const value2 = this.getMetricValue(session2, metric);
      const difference = value2 - value1;
      const percentageChange = value1 !== 0 ? ((value2 - value1) / value1) * 100 : 0;
      
      comparisons.push({
        period1: session1.sessionId,
        period2: session2.sessionId,
        metric,
        value1,
        value2,
        difference,
        percentageChange
      });
    });
    
    return comparisons;
  }
  
  // ==========================================================================
  // REPORTS
  // ==========================================================================
  
  public generateReport(type: ReportType, period: AnalyticsPeriod, startDate?: number, endDate?: number): AnalyticsReport {
    const data = this.getAnalyticsData(period, startDate, endDate);
    const metrics: AnalyticsMetric[] = Object.values(AnalyticsMetric);
    
    const summary: ReportSummary = {
      totalStreams: data.length,
      totalDuration: data.reduce((sum, d) => sum + d.duration, 0),
      averageViewers: data.reduce((sum, d) => sum + d.viewerAverage, 0) / data.length || 0,
      peakViewers: Math.max(...data.map(d => d.viewerPeak), 0),
      totalFollowers: data.reduce((sum, d) => sum + d.newFollowers, 0),
      totalSubscribers: data.reduce((sum, d) => sum + d.newSubscribers, 0),
      totalDonations: data.reduce((sum, d) => sum + d.totalDonations, 0),
      keyInsights: []
    };
    
    // Generate key insights
    if (summary.averageViewers > 1000) {
      summary.keyInsights.push('Strong average viewer count above 1000');
    }
    if (summary.totalFollowers > 100) {
      summary.keyInsights.push('Excellent follower growth');
    }
    if (summary.totalDonations > 500) {
      summary.keyInsights.push('Strong donation revenue');
    }
    
    // Generate charts for report
    const charts: AnalyticsChart[] = [];
    if (this.settings.showTrends) {
      charts.push(this.generateChart(AnalyticsMetric.VIEWER_COUNT, period, TimeGranularity.DAY));
      charts.push(this.generateChart(AnalyticsMetric.NEW_FOLLOWERS, period, TimeGranularity.DAY));
    }
    
    const report: AnalyticsReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: `${type} Report - ${period}`,
      period,
      startDate: startDate || Date.now() - this.getPeriodLength(period),
      endDate: endDate || Date.now(),
      createdAt: Date.now(),
      metrics,
      data: { summary },
      charts,
      summary
    };
    
    this.reports.push(report);
    this.emit('report-generated', report);
    this.saveToStorage();
    
    return report;
  }
  
  public getReports(): AnalyticsReport[] {
    return this.reports;
  }
  
  public exportReport(reportId: string, format: ExportFormat): string {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(report, null, 2);
      case ExportFormat.CSV:
        // Simplified CSV export
        const headers = ['Metric', 'Value'];
        const rows = [
          ['Total Streams', report.summary.totalStreams.toString()],
          ['Total Duration (min)', (report.summary.totalDuration / 60000).toFixed(2)],
          ['Average Viewers', report.summary.averageViewers.toFixed(2)],
          ['Peak Viewers', report.summary.peakViewers.toString()],
          ['Total Followers', report.summary.totalFollowers.toString()],
          ['Total Subscribers', report.summary.totalSubscribers.toString()],
          ['Total Donations', `$${report.summary.totalDonations.toFixed(2)}`]
        ];
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      case ExportFormat.PDF:
        // Would need a PDF library - return JSON for now
        return JSON.stringify(report, null, 2);
      case ExportFormat.EXCEL:
        // Would need an Excel library - return JSON for now
        return JSON.stringify(report, null, 2);
      default:
        return JSON.stringify(report, null, 2);
    }
  }
  
  public deleteReport(reportId: string): void {
    this.reports = this.reports.filter(r => r.id !== reportId);
    this.saveToStorage();
  }
  
  // ==========================================================================
  // GOALS
  // ==========================================================================
  
  public getGoals(): AnalyticsGoal[] {
    return this.goals;
  }
  
  public addGoal(goal: Omit<AnalyticsGoal, 'id' | 'progress'>): string {
    const newGoal: AnalyticsGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      progress: 0
    };
    this.goals.push(newGoal);
    this.checkGoals();
    this.saveToStorage();
    return newGoal.id;
  }
  
  public updateGoal(goalId: string, updates: Partial<AnalyticsGoal>): void {
    const index = this.goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      this.goals[index] = { ...this.goals[index], ...updates };
      this.checkGoals();
      this.saveToStorage();
    }
  }
  
  public removeGoal(goalId: string): void {
    this.goals = this.goals.filter(g => g.id !== goalId);
    this.saveToStorage();
  }
  
  public checkGoals(): void {
    this.goals.forEach(goal => {
      if (!goal.enabled) return;
      
      const current = this.calculateMetrics(goal.metric, goal.period);
      const newProgress = Math.min((current / goal.target) * 100, 100);
      const oldProgress = goal.progress;
      
      this.updateGoal(goal.id, { 
        current,
        progress: newProgress 
      });
      
      this.emit('goal-progress', this.goals.find(g => g.id === goal.id)!);
      
      if (newProgress >= 100 && oldProgress < 100) {
        this.emit('goal-reached', this.goals.find(g => g.id === goal.id)!);
      }
    });
  }
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  public getSettings(): AnalyticsProSettings {
    return { ...this.settings };
  }
  
  public updateSettings(settings: Partial<AnalyticsProSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveToStorage();
    
    if (settings.autoRefresh !== undefined) {
      if (settings.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }
  }
  
  public resetSettings(): void {
    this.settings = { ...DEFAULT_ANALYTICS_SETTINGS };
    this.saveToStorage();
  }
  
  // ==========================================================================
  // AUTO REFRESH
  // ==========================================================================
  
  private startAutoRefresh(): void {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }
    
    if (this.settings.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.checkGoals();
      }, this.settings.refreshInterval);
    }
  }
  
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================
  
  public saveToStorage(): void {
    const storage: AnalyticsProStorage = {
      settings: this.settings,
      data: this.data,
      viewerEngagement: this.viewerEngagement,
      charts: this.charts,
      reports: this.reports,
      goals: this.goals
    };
    
    try {
      localStorage.setItem('analyticsPro', JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save Analytics Pro data:', error);
    }
  }
  
  public loadFromStorage(): void {
    try {
      const data = localStorage.getItem('analyticsPro');
      if (data) {
        const storage: AnalyticsProStorage = JSON.parse(data);
        
        this.settings = storage.settings || { ...DEFAULT_ANALYTICS_SETTINGS };
        this.data = storage.data || [];
        this.viewerEngagement = storage.viewerEngagement || [];
        this.charts = storage.charts || [];
        this.reports = storage.reports || [];
        this.goals = storage.goals || [];
      }
    } catch (error) {
      console.error('Failed to load Analytics Pro data:', error);
    }
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  public destroy(): void {
    this.stopAutoRefresh();
    this.removeAllListeners();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

let managerInstance: AnalyticsProManager | null = null;

export function getAnalyticsProManager(): AnalyticsProManager {
  if (!managerInstance) {
    managerInstance = AnalyticsProManager.getInstance();
  }
  return managerInstance;
}