/**
 * AnalyticsProManager Minimal Tests
 * Focused tests for critical paths only
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsProManager } from './AnalyticsProManager';
import {
  StreamAnalyticsData,
  AnalyticsPeriod,
  AnalyticsMetric,
  ReportType,
  TimeGranularity,
} from '../types/analyticsPro';

const createMockAnalyticsData = (overrides?: Partial<StreamAnalyticsData>): StreamAnalyticsData => {
  const now = Date.now();
  return {
    sessionId: `session-${now}`,
    startTime: now,
    endTime: now + 3600000,
    duration: 3600000,
    platform: 'twitch',
    viewerCount: 100,
    chatMessages: 50,
    watchTime: 300000,
    newFollowers: 5,
    subscribers: 2,
    donations: 0,
    bits: 0,
    ...overrides,
  };
};

describe('AnalyticsProManager (Minimal)', () => {
  let manager: AnalyticsProManager;

  beforeEach(() => {
    localStorage.clear();
    if ((AnalyticsProManager as any).instance) {
      (AnalyticsProManager as any).instance.destroy();
    }
    (AnalyticsProManager as any).instance = null;
    manager = AnalyticsProManager.getInstance();
  });

  describe('Initialization', () => {
    it('should get settings', () => {
      const settings = manager.getSettings();
      expect(settings).toBeDefined();
    });

    it('should update settings', () => {
      manager.updateSettings({ enableAnalytics: true });
      const settings = manager.getSettings();
      expect(settings).toBeDefined();
    });
  });

  describe('Data Management', () => {
    it('should get analytics data', () => {
      const data = manager.getAnalyticsData('last_7_days');
      expect(Array.isArray(data)).toBe(true);
    });

    it('should add analytics data', () => {
      const analyticsData = createMockAnalyticsData();
      manager.addAnalyticsData(analyticsData);
      // Use current date range to ensure data is included
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const data = manager.getAnalyticsData('last_7_days', sevenDaysAgo, now);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should update analytics data', () => {
      const analyticsData = createMockAnalyticsData({ viewerCount: 100 });
      manager.addAnalyticsData(analyticsData);
      
      manager.updateAnalyticsData(analyticsData.sessionId, { viewerCount: 200 });
      
      // Use current date range to ensure data is included
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const data = manager.getAnalyticsData('last_7_days', sevenDaysAgo, now);
      const found = data.find(d => d.sessionId === analyticsData.sessionId);
      expect(found).toBeDefined();
      expect(found!.viewerCount).toBe(200);
    });

    it('should delete analytics data', () => {
      const analyticsData = createMockAnalyticsData();
      manager.addAnalyticsData(analyticsData);
      manager.deleteAnalyticsData(analyticsData.sessionId);
      
      const data = manager.getAnalyticsData('last_7_days');
      const found = data.find(d => d.sessionId === analyticsData.sessionId);
      expect(found).toBeUndefined();
    });

    it('should get analytics data by session ID', () => {
      const analyticsData = createMockAnalyticsData();
      manager.addAnalyticsData(analyticsData);
      
      const retrieved = manager.getAnalyticsDataBySessionId(analyticsData.sessionId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.sessionId).toBe(analyticsData.sessionId);
    });
  });

  describe('Metrics Calculation', () => {
    beforeEach(() => {
      const data1 = createMockAnalyticsData({ viewerCount: 100 });
      const data2 = createMockAnalyticsData({ viewerCount: 200 });
      manager.addAnalyticsData(data1);
      manager.addAnalyticsData(data2);
    });

    it('should calculate metrics', () => {
      const metrics = manager.calculateMetrics('viewerCount', 'last_7_days');
      expect(typeof metrics).toBe('number');
    });

    it('should get metrics summary', () => {
      const summary = manager.getMetricsSummary('last_7_days');
      expect(summary).toBeDefined();
    });

    it('should get trends', () => {
      const trends = manager.getTrends('last_7_days');
      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('Viewer Analytics', () => {
    beforeEach(() => {
      const data = createMockAnalyticsData({ watchTime: 300000 });
      manager.addAnalyticsData(data);
    });

    it('should get viewer engagement', () => {
      const engagement = manager.getViewerEngagement('last_7_days');
      expect(Array.isArray(engagement)).toBe(true);
    });

    it('should get viewer segments', () => {
      const segments = manager.getViewerSegments('last_7_days');
      expect(segments).toBeDefined();
    });

    it('should get top viewers', () => {
      const topViewers = manager.getTopViewers(10, 'last_7_days');
      expect(Array.isArray(topViewers)).toBe(true);
    });
  });

  describe('Chat Analytics', () => {
    beforeEach(() => {
      const data = createMockAnalyticsData({ chatMessages: 50 });
      manager.addAnalyticsData(data);
    });

    it('should get chat analytics', () => {
      const chatAnalytics = manager.getChatAnalytics('last_7_days');
      expect(chatAnalytics).toBeDefined();
    });

    it('should get chat heatmap', () => {
      const heatmap = manager.getChatHeatmap('last_7_days');
      expect(Array.isArray(heatmap)).toBe(true);
    });
  });

  describe('Chart Management', () => {
    it('should add a chart', () => {
      const chartId = manager.addChart({
        type: 'line',
        title: 'Test Chart',
        metric: 'viewerCount',
        period: 'last_7_days',
        granularity: 'daily',
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(chartId).toBeDefined();
      expect(typeof chartId).toBe('string');
    });

    it('should get all charts', () => {
      const charts = manager.getCharts();
      expect(Array.isArray(charts)).toBe(true);
    });

    it('should remove a chart', () => {
      const chartId = manager.addChart({
        type: 'line',
        title: 'Test Chart',
        metric: 'viewerCount',
        period: 'last_7_days',
        granularity: 'daily',
        visible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      manager.removeChart(chartId);
      const charts = manager.getCharts();
      expect(charts.length).toBe(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate a report', () => {
      const report = manager.generateReport('summary', 'last_7_days');
      expect(report).toBeDefined();
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('type');
    });

    it('should get all reports', () => {
      const reports = manager.getReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it('should delete a report', () => {
      const report = manager.generateReport('summary', 'last_7_days');
      manager.deleteReport(report.id);
      const reports = manager.getReports();
      expect(reports.length).toBe(0);
    });
  });

  describe('Goal Management', () => {
    it('should add a goal', () => {
      const goalId = manager.addGoal({
        metric: 'viewerCount',
        target: 1000,
        current: 0,
        period: 'last_7_days',
        title: 'Test Goal',
        description: 'Test description',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(goalId).toBeDefined();
      expect(typeof goalId).toBe('string');
    });

    it('should get all goals', () => {
      const goals = manager.getGoals();
      expect(Array.isArray(goals)).toBe(true);
    });

    it('should update a goal', () => {
      const goalId = manager.addGoal({
        metric: 'viewerCount',
        target: 1000,
        current: 0,
        period: 'last_7_days',
        title: 'Original Title',
        description: 'Test',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      manager.updateGoal(goalId, { title: 'Updated Title' });
      const goals = manager.getGoals();
      expect(goals[0].title).toBe('Updated Title');
    });

    it('should remove a goal', () => {
      const goalId = manager.addGoal({
        metric: 'viewerCount',
        target: 1000,
        current: 0,
        period: 'last_7_days',
        title: 'Test Goal',
        description: 'Test',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      manager.removeGoal(goalId);
      const goals = manager.getGoals();
      expect(goals.length).toBe(0);
    });
  });
});