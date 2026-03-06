import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalyticsPro } from '../hooks/useAnalyticsPro';
import {
  AnalyticsPeriod,
  AnalyticsMetric,
  ChartType,
  ReportType,
  ExportFormat,
  TimeGranularity
} from '../types/analyticsPro';
import './AnalyticsPro.css';

export interface AnalyticsProProps {
  onClose: () => void;
}

export const AnalyticsPro: React.FC<AnalyticsProProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'reports' | 'goals' | 'settings'>('dashboard');

  const {
    data,
    charts,
    reports,
    goals,
    settings,
    selectedPeriod,
    selectedMetric,
    selectedChartType,
    isLoading,
    getAnalyticsData,
    getTrends,
    calculateMetrics,
    getViewerEngagement,
    getChatAnalytics,
    generateChart,
    removeChart,
    comparePeriods,
    generateReport,
    exportReport,
    deleteReport,
    addGoal,
    updateGoal,
    removeGoal,
    checkGoals,
    updateSettings,
    setSelectedPeriod,
    setSelectedMetric,
    setSelectedChartType,
  } = useAnalyticsPro();

  const [trends, setTrends] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [viewerEngagement, setViewerEngagement] = useState<any>(null);
  const [chatAnalytics, setChatAnalytics] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  useEffect(() => {
    refreshDashboard();
  }, [selectedPeriod]);

  const refreshDashboard = () => {
    setTrends(getTrends(selectedPeriod));
    setMetrics(calculateMetrics(selectedPeriod));
    setViewerEngagement(getViewerEngagement(selectedPeriod));
    setChatAnalytics(getChatAnalytics(selectedPeriod));
  };

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setSelectedPeriod(period);
  };

  const handleGenerateChart = () => {
    try {
      generateChart(selectedMetric, selectedPeriod, TimeGranularity.DAY);
      refreshDashboard();
    } catch (error) {
      console.error('Error generating chart:', error);
    }
  };

  const handleGenerateReport = (reportType: ReportType) => {
    try {
      generateReport(reportType, selectedPeriod);
      refreshDashboard();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleComparePeriods = () => {
    const period1 = AnalyticsPeriod.LAST_7_DAYS;
    const period2 = AnalyticsPeriod.LAST_MONTH;
    const result = comparePeriods(selectedMetric, period1, period2);
    setComparisonResult(result);
  };

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const goal = {
      title: formData.get('title') as string,
      metric: formData.get('metric') as AnalyticsMetric,
      target: parseFloat(formData.get('targetValue') as string),
      current: 0,
      period: formData.get('period') as AnalyticsPeriod,
      enabled: true,
    };

    try {
      addGoal(goal);
      form.reset();
      refreshDashboard();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    try {
      removeGoal(goalId);
      refreshDashboard();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleExportReport = (reportId: string, format: ExportFormat) => {
    exportReport(reportId, format);
  };

  return (
    <div className="analytics-pro-container">
      <div className="analytics-pro-header">
        <div className="analytics-pro-title">
          <span className="analytics-pro-icon">📈</span>
          <h2>{t('analyticsPro.title')}</h2>
        </div>
        <button className="analytics-pro-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="analytics-pro-tabs">
        <button
          className={`analytics-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {t('analyticsPro.tabs.dashboard')}
        </button>
        <button
          className={`analytics-tab ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          {t('analyticsPro.tabs.charts')}
        </button>
        <button
          className={`analytics-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          {t('analyticsPro.tabs.reports')}
        </button>
        <button
          className={`analytics-tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          {t('analyticsPro.tabs.goals')}
        </button>
        <button
          className={`analytics-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('analyticsPro.tabs.settings')}
        </button>
      </div>

      <div className="analytics-pro-content">
        {activeTab === 'dashboard' && (
          <div className="analytics-dashboard">
            <div className="analytics-controls">
              <div className="analytics-period-selector">
                <label>{t('analyticsPro.period')}</label>
                <select value={selectedPeriod} onChange={(e) => handlePeriodChange(e.target.value as AnalyticsPeriod)}>
                  <option value={AnalyticsPeriod.TODAY}>{t('analyticsPro.periods.today')}</option>
                  <option value={AnalyticsPeriod.YESTERDAY}>{t('analyticsPro.periods.yesterday')}</option>
                  <option value={AnalyticsPeriod.LAST_7_DAYS}>{t('analyticsPro.periods.last7Days')}</option>
                  <option value={AnalyticsPeriod.LAST_30_DAYS}>{t('analyticsPro.periods.last30Days')}</option>
                  <option value={AnalyticsPeriod.LAST_90_DAYS}>{t('analyticsPro.periods.last90Days')}</option>
                  <option value={AnalyticsPeriod.LAST_MONTH}>{t('analyticsPro.periods.previousMonth')}</option>
                  <option value={AnalyticsPeriod.CUSTOM}>{t('analyticsPro.periods.allTime')}</option>
                </select>
              </div>

              <button className="analytics-compare-btn" onClick={handleComparePeriods}>
                {t('analyticsPro.comparePeriods')}
              </button>
            </div>

            {isLoading && <div className="analytics-loading">{t('analyticsPro.loading')}</div>}

            {comparisonResult && (
              <div className="analytics-comparison-result">
                <h3>{t('analyticsPro.comparisonResult')}</h3>
                {comparisonResult.period1 && comparisonResult.period2 && (
                  <div className="comparison-metric">
                    <span className="metric-name">{comparisonResult.period1} vs {comparisonResult.period2}</span>
                    <span className={`metric-change ${comparisonResult.percentageChange >= 0 ? 'positive' : 'negative'}`}>
                      {comparisonResult.percentageChange >= 0 ? '+' : ''}{comparisonResult.percentageChange.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {metrics && (
              <div className="analytics-metrics-grid">
                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.totalViews')}</h4>
                  <div className="metric-value">{metrics.viewerCount?.toLocaleString() || 0}</div>
                  {metrics.trend && (
                    <div className={`metric-trend ${metrics.trend >= 0 ? 'positive' : 'negative'}`}>
                      {metrics.trend >= 0 ? '↑' : '↓'} {Math.abs(metrics.trend)}%
                    </div>
                  )}
                </div>

                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.totalWatchTime')}</h4>
                  <div className="metric-value">{metrics.watchTime?.toLocaleString() || 0}</div>
                  <div className="metric-unit">{t('analyticsPro.minutes')}</div>
                </div>

                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.averageViewers')}</h4>
                  <div className="metric-value">{metrics.viewerAverage?.toLocaleString() || 0}</div>
                </div>

                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.newFollowers')}</h4>
                  <div className="metric-value">{metrics.newFollowers?.toLocaleString() || 0}</div>
                </div>

                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.chatMessages')}</h4>
                  <div className="metric-value">{metrics.chatMessages?.toLocaleString() || 0}</div>
                </div>

                <div className="analytics-metric-card">
                  <h4>{t('analyticsPro.metrics.streamSessions')}</h4>
                  <div className="metric-value">{metrics.streamSessions || 0}</div>
                </div>
              </div>
            )}

            {viewerEngagement && viewerEngagement.length > 0 && (
              <div className="analytics-engagement-section">
                <h3>{t('analyticsPro.viewerEngagement')}</h3>
                <div className="engagement-metrics">
                  {viewerEngagement.slice(0, 3).map((viewer: any, index: number) => (
                    <div key={index} className="engagement-item">
                      <span className="engagement-label">{viewer.username}</span>
                      <span className="engagement-value">{viewer.watchTime} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {chatAnalytics && (
              <div className="analytics-chat-section">
                <h3>{t('analyticsPro.chatAnalytics')}</h3>
                <div className="chat-metrics">
                  <div className="chat-metric-item">
                    <span className="chat-label">{t('analyticsPro.chat.totalMessages')}</span>
                    <span className="chat-value">{chatAnalytics.totalMessages?.toLocaleString() || 0}</span>
                  </div>
                  <div className="chat-metric-item">
                    <span className="chat-label">{t('analyticsPro.chat.uniqueChatters')}</span>
                    <span className="chat-value">{chatAnalytics.uniqueChatters?.toLocaleString() || 0}</span>
                  </div>
                  <div className="chat-metric-item">
                    <span className="chat-label">{t('analyticsPro.chat.emotesUsed')}</span>
                    <span className="chat-value">{chatAnalytics.topEmotes?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="analytics-charts">
            <div className="charts-toolbar">
              <div className="chart-options">
                <select
                  value={selectedChartType}
                  onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
                >
                  <option value={ChartType.LINE}>{t('analyticsPro.chartTypes.line')}</option>
                  <option value={ChartType.BAR}>{t('analyticsPro.chartTypes.bar')}</option>
                  <option value={ChartType.PIE}>{t('analyticsPro.chartTypes.pie')}</option>
                  <option value={ChartType.AREA}>{t('analyticsPro.chartTypes.area')}</option>
                  <option value={ChartType.DONUT}>{t('analyticsPro.chartTypes.doughnut')}</option>
                </select>

                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as AnalyticsMetric)}
                >
                  <option value={AnalyticsMetric.VIEWER_COUNT}>{t('analyticsPro.metrics.totalViews')}</option>
                  <option value={AnalyticsMetric.WATCH_TIME}>{t('analyticsPro.metrics.totalWatchTime')}</option>
                  <option value={AnalyticsMetric.NEW_FOLLOWERS}>{t('analyticsPro.metrics.newFollowers')}</option>
                  <option value={AnalyticsMetric.CHAT_MESSAGES}>{t('analyticsPro.metrics.chatMessages')}</option>
                  <option value={AnalyticsMetric.NEW_SUBSCRIBERS}>{t('analyticsPro.metrics.newSubscribers')}</option>
                  <option value={AnalyticsMetric.DONATIONS}>{t('analyticsPro.metrics.donations')}</option>
                </select>

                <button className="generate-chart-btn" onClick={handleGenerateChart}>
                  {t('analyticsPro.generateChart')}
                </button>
              </div>
            </div>

            <div className="charts-grid">
              {charts.map((chart) => (
                <div key={chart.id} className="chart-card">
                  <div className="chart-header">
                    <h4>{chart.title}</h4>
                    <button
                      className="delete-chart-btn"
                      onClick={() => {
                        removeChart(chart.id);
                        refreshDashboard();
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="chart-content">
                    <div className="chart-placeholder">
                      <span className="chart-icon">📊</span>
                      <p>{chart.type}</p>
                    </div>
                  </div>
                  <div className="chart-footer">
                    <span className="chart-period">{chart.period}</span>
                  </div>
                </div>
              ))}
              {charts.length === 0 && (
                <div className="no-charts">
                  <span className="no-data-icon">📊</span>
                  <p>{t('analyticsPro.noCharts')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="analytics-reports">
            <div className="reports-toolbar">
              <button className="generate-report-btn" onClick={() => handleGenerateReport(ReportType.SUMMARY)}>
                {t('analyticsPro.generateSummaryReport')}
              </button>
              <button className="generate-report-btn" onClick={() => handleGenerateReport(ReportType.DETAILED)}>
                {t('analyticsPro.generateDetailedReport')}
              </button>
              <button className="generate-report-btn" onClick={() => handleGenerateReport(ReportType.COMPARISON)}>
                {t('analyticsPro.generateCompetitiveReport')}
              </button>
            </div>

            <div className="reports-list">
              {reports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <h4>{report.title}</h4>
                    <span className="report-type">{report.type}</span>
                  </div>
                  <div className="report-content">
                    <p className="report-summary">{JSON.stringify(report.summary)}</p>
                    {report.summary?.keyInsights && report.summary.keyInsights.length > 0 && (
                      <div className="report-insights">
                        <h5>{t('analyticsPro.insights')}</h5>
                        <ul>
                          {report.summary.keyInsights.map((insight: string, index: number) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="report-actions">
                    <button
                      className="export-report-btn"
                      onClick={() => handleExportReport(report.id, ExportFormat.PDF)}
                    >
                      {t('analyticsPro.exportPDF')}
                    </button>
                    <button
                      className="export-report-btn"
                      onClick={() => handleExportReport(report.id, ExportFormat.EXCEL)}
                    >
                      {t('analyticsPro.exportExcel')}
                    </button>
                    <button
                      className="export-report-btn"
                      onClick={() => handleExportReport(report.id, ExportFormat.CSV)}
                    >
                      {t('analyticsPro.exportCSV')}
                    </button>
                    <button
                      className="delete-report-btn"
                      onClick={() => {
                        deleteReport(report.id);
                        refreshDashboard();
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="no-reports">
                  <span className="no-data-icon">📋</span>
                  <p>{t('analyticsPro.noReports')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="analytics-goals">
            <div className="goals-header">
              <button className="check-goals-btn" onClick={checkGoals}>
                {t('analyticsPro.checkGoals')}
              </button>
            </div>

            <div className="create-goal-form">
              <h3>{t('analyticsPro.createGoal')}</h3>
              <form onSubmit={handleCreateGoal}>
                <div className="form-group">
                  <label>{t('analyticsPro.goalTitle')}</label>
                  <input type="text" name="title" required />
                </div>

                <div className="form-group">
                  <label>{t('analyticsPro.goalMetric')}</label>
                  <select name="metric" required>
                    <option value={AnalyticsMetric.VIEWER_COUNT}>{t('analyticsPro.metrics.totalViews')}</option>
                    <option value={AnalyticsMetric.WATCH_TIME}>{t('analyticsPro.metrics.totalWatchTime')}</option>
                    <option value={AnalyticsMetric.NEW_FOLLOWERS}>{t('analyticsPro.metrics.newFollowers')}</option>
                    <option value={AnalyticsMetric.CHAT_MESSAGES}>{t('analyticsPro.metrics.chatMessages')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('analyticsPro.goalTargetValue')}</label>
                  <input type="number" name="targetValue" required step="any" />
                </div>

                <div className="form-group">
                  <label>{t('analyticsPro.goalPeriod')}</label>
                  <select name="period" required>
                    <option value={AnalyticsPeriod.LAST_7_DAYS}>{t('analyticsPro.periods.last7Days')}</option>
                    <option value={AnalyticsPeriod.LAST_30_DAYS}>{t('analyticsPro.periods.last30Days')}</option>
                    <option value={AnalyticsPeriod.LAST_MONTH}>{t('analyticsPro.periods.previousMonth')}</option>
                  </select>
                </div>

                <button type="submit" className="create-goal-submit-btn">
                  {t('analyticsPro.createGoalBtn')}
                </button>
              </form>
            </div>

            <div className="goals-list">
              {goals.map((goal) => {
                return (
                  <div key={goal.id} className={`goal-card ${goal.progress >= 100 ? 'achieved' : ''}`}>
                    <div className="goal-header">
                      <h4>{goal.title}</h4>
                      {goal.progress >= 100 && <span className="goal-achieved-badge">✅ {t('analyticsPro.achieved')}</span>}
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(goal.progress, 100)}%` }}></div>
                      </div>
                      <div className="progress-text">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                        <span className="progress-percent">({goal.progress.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="goal-footer">
                      <button
                        className="delete-goal-btn"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="no-goals">
                  <span className="no-data-icon">🎯</span>
                  <p>{t('analyticsPro.noGoals')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="analytics-settings">
            <h3>{t('analyticsPro.settings')}</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh || false}
                    onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
                  />
                  {t('analyticsPro.settings.realtimeUpdates')}
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.showTrends || false}
                    onChange={(e) => updateSettings({ showTrends: e.target.checked })}
                  />
                  {t('analyticsPro.settings.autoGenerateCharts')}
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.enableComparison || false}
                    onChange={(e) => updateSettings({ enableComparison: e.target.checked })}
                  />
                  {t('analyticsPro.settings.goalAlerts')}
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={settings.enableHeatmaps || false}
                    onChange={(e) => updateSettings({ enableHeatmaps: e.target.checked })}
                  />
                  {t('analyticsPro.settings.includeSentiment')}
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  {t('analyticsPro.settings.defaultPeriod')}
                  <select
                    value={settings.defaultPeriod || AnalyticsPeriod.LAST_7_DAYS}
                    onChange={(e) => updateSettings({ defaultPeriod: e.target.value as AnalyticsPeriod })}
                  >
                    <option value={AnalyticsPeriod.TODAY}>{t('analyticsPro.periods.today')}</option>
                    <option value={AnalyticsPeriod.LAST_7_DAYS}>{t('analyticsPro.periods.last7Days')}</option>
                    <option value={AnalyticsPeriod.LAST_30_DAYS}>{t('analyticsPro.periods.last30Days')}</option>
                    <option value={AnalyticsPeriod.LAST_MONTH}>{t('analyticsPro.periods.previousMonth')}</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPro;