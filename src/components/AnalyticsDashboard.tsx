import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsDataPoint {
  timestamp: string;
  viewers: number;
  bitrate: number;
  fps: number;
  dropped_frames: number;
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  network_up: number;
  chat_messages: number;
  new_followers: number;
  donations: number;
}

interface RealTimeAnalytics {
  current_viewers: number;
  chat_messages_per_minute: number;
  current_bitrate: number;
  current_fps: number;
  dropped_frames_last_minute: number;
  stream_uptime: number;
  live_status: boolean;
  last_update: string;
}

interface AggregatedAnalytics {
  period: string;
  start_time: string;
  end_time: string;
  avg_viewers: number;
  peak_viewers: number;
  avg_bitrate: number;
  avg_fps: number;
  total_dropped_frames: number;
  avg_cpu: number;
  avg_memory: number;
  avg_gpu: number;
  total_chat_messages: number;
  total_followers: number;
  total_donations: number;
  stream_duration: number;
  uptime: number;
}

interface PerformanceMetrics {
  stream_health_score: number;
  bitrate_stability: number;
  fps_stability: number;
  dropped_frame_rate: number;
  cpu_efficiency: number;
  gpu_efficiency: number;
  network_quality_score: number;
}

interface ViewerStatistics {
  total_unique_viewers: number;
  average_watch_time: number;
  returning_viewers: number;
  new_viewers: number;
  viewer_retention_rate: number;
  peak_concurrent_viewers: number;
  chat_participation_rate: number;
}

interface RevenueStatistics {
  total_tips: number;
  total_subscriptions: number;
  total_bits: number;
  total_sponsorships: number;
  total_merchandise: number;
  average_revenue_per_viewer: number;
  revenue_growth_rate: number;
  top_donors: Array<{
    username: string;
    amount: number;
    count: number;
  }>;
}

type TimePeriod = 'hour' | 'day' | 'week' | 'month';
type TabType = 'overview' | 'viewers' | 'performance' | 'revenue' | 'alerts';

export const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('hour');
  const [realTimeData, setRealTimeData] = useState<RealTimeAnalytics | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [viewerStats, setViewerStats] = useState<ViewerStatistics | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerHistory, setViewerHistory] = useState<AnalyticsDataPoint[]>([]);

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 5000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [realTime, aggregated, performance, viewers, revenue] = await Promise.all([
        invoke<RealTimeAnalytics>('analytics_get_real_time'),
        invoke<AggregatedAnalytics>('analytics_get_aggregated', { period: selectedPeriod }),
        invoke<PerformanceMetrics>('analytics_get_performance_metrics'),
        invoke<ViewerStatistics>('analytics_get_viewer_statistics'),
        invoke<RevenueStatistics>('analytics_get_revenue_statistics')
      ]);

      setRealTimeData(realTime);
      setAggregatedData(aggregated || null);
      setPerformanceMetrics(performance || null);
      setViewerStats(viewers || null);
      setRevenueStats(revenue || null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Viewers"
          value={realTimeData?.current_viewers || 0}
          icon="👥"
          trend="+12.5%"
        />
        <MetricCard
          title="Peak Viewers"
          value={aggregatedData?.peak_viewers || 0}
          icon="📈"
          trend="+8.3%"
        />
        <MetricCard
          title="Total Donations"
          value={`$${(revenueStats?.total_tips || 0).toFixed(2)}`}
          icon="💰"
          trend="+15.2%"
        />
        <MetricCard
          title="Chat Activity"
          value={`${realTimeData?.chat_messages_per_minute || 0}/min`}
          icon="💬"
          trend="+22.1%"
        />
      </div>

      {/* Viewer Chart */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Viewer Activity</h3>
        <Line
          data={{
            labels: viewerHistory.map(p => new Date(p.timestamp).toLocaleTimeString()),
            datasets: [{
              label: 'Viewers',
              data: viewerHistory.map(p => p.viewers),
              borderColor: 'rgb(147, 51, 234)',
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              fill: true,
              tension: 0.4
            }]
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }}
        />
      </div>

      {/* Performance Score */}
      {performanceMetrics && (
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Stream Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <PerformanceScoreCard
              label="Overall"
              score={performanceMetrics.stream_health_score}
              color={performanceMetrics.stream_health_score >= 80 ? 'green' : performanceMetrics.stream_health_score >= 60 ? 'yellow' : 'red'}
            />
            <PerformanceScoreCard
              label="Bitrate"
              score={performanceMetrics.bitrate_stability}
              color="green"
            />
            <PerformanceScoreCard
              label="FPS"
              score={performanceMetrics.fps_stability}
              color="green"
            />
            <PerformanceScoreCard
              label="CPU"
              score={performanceMetrics.cpu_efficiency}
              color={performanceMetrics.cpu_efficiency >= 80 ? 'green' : 'yellow'}
            />
            <PerformanceScoreCard
              label="GPU"
              score={performanceMetrics.gpu_efficiency}
              color="performanceMetrics.gpu_efficiency >= 80 ? 'green' : 'yellow'}
            />
            <PerformanceScoreCard
              label="Network"
              score={performanceMetrics.network_quality_score}
              color="green"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderViewersTab = () => (
    <div className="space-y-6">
      {viewerStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Unique Viewers"
              value={viewerStats.total_unique_viewers}
              icon="👤"
            />
            <MetricCard
              title="Average Watch Time"
              value={`${Math.floor(viewerStats.average_watch_time / 60)}m`}
              icon="⏱️"
            />
            <MetricCard
              title="Returning Viewers"
              value={viewerStats.returning_viewers}
              icon="🔄"
            />
            <MetricCard
              title="New Viewers"
              value={viewerStats.new_viewers}
              icon="✨"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Viewer Composition</h3>
              <Pie
                data={{
                  labels: ['Returning', 'New'],
                  datasets: [{
                    data: [viewerStats.returning_viewers, viewerStats.new_viewers],
                    backgroundColor: ['rgba(147, 51, 234, 0.8)', 'rgba(59, 130, 246, 0.8)']
                  }]
                }}
              />
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Retention & Engagement</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Retention Rate</span>
                    <span className="font-semibold">{viewerStats.viewer_retention_rate}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${viewerStats.viewer_retention_rate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Chat Participation</span>
                    <span className="font-semibold">{viewerStats.chat_participation_rate.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${viewerStats.chat_participation_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {aggregatedData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Average FPS"
              value={aggregatedData.avg_fps.toFixed(1)}
              icon="🎬"
            />
            <MetricCard
              title="Average Bitrate"
              value={`${(aggregatedData.avg_bitrate / 1000).toFixed(1)} Mbps`}
              icon="⚡"
            />
            <MetricCard
              title="Dropped Frames"
              value={aggregatedData.total_dropped_frames}
              icon="⚠️"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">System Usage</h3>
              <Line
                data={{
                  labels: viewerHistory.map(p => new Date(p.timestamp).toLocaleTimeString()),
                  datasets: [
                    {
                      label: 'CPU %',
                      data: viewerHistory.map(p => p.cpu_usage),
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      fill: true,
                      tension: 0.4
                    },
                    {
                      label: 'GPU %',
                      data: viewerHistory.map(p => p.gpu_usage),
                      borderColor: 'rgb(34, 197, 94)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      fill: true,
                      tension: 0.4
                    },
                    {
                      label: 'Memory %',
                      data: viewerHistory.map(p => p.memory_usage),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4
                    }
                  ]
                }}
              />
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Network Performance</h3>
              <Line
                data={{
                  labels: viewerHistory.map(p => new Date(p.timestamp).toLocaleTimeString()),
                  datasets: [
                    {
                      label: 'Bitrate (Mbps)',
                      data: viewerHistory.map(p => p.bitrate / 1000),
                      borderColor: 'rgb(147, 51, 234)',
                      backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      fill: true,
                      tension: 0.4
                    },
                    {
                      label: 'Upload (Mbps)',
                      data: viewerHistory.map(p => p.network_up),
                      borderColor: 'rgb(236, 72, 153)',
                      backgroundColor: 'rgba(236, 72, 153, 0.1)',
                      fill: true,
                      tension: 0.4
                    }
                  ]
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderRevenueTab = () => (
    <div className="space-y-6">
      {revenueStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Revenue"
              value={`$${(revenueStats.total_tips + revenueStats.total_subscriptions + revenueStats.total_bits + revenueStats.total_sponsorships + revenueStats.total_merchandise).toFixed(2)}`}
              icon="💵"
              trend={`+${revenueStats.revenue_growth_rate}%`}
            />
            <MetricCard
              title="Average per Viewer"
              value={`$${revenueStats.average_revenue_per_viewer.toFixed(2)}`}
              icon="👥"
            />
            <MetricCard
              title="Top Donor"
              value={revenueStats.top_donors[0]?.username || 'N/A'}
              icon="⭐"
            />
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Revenue Breakdown</h3>
            <Bar
              data={{
                labels: ['Tips', 'Subscriptions', 'Bits', 'Sponsorships', 'Merchandise'],
                datasets: [{
                  label: 'Revenue ($)',
                  data: [
                    revenueStats.total_tips,
                    revenueStats.total_subscriptions,
                    revenueStats.total_bits,
                    revenueStats.total_sponsorships,
                    revenueStats.total_merchandise
                  ],
                  backgroundColor: [
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                  ]
                }]
              }}
            />
          </div>

          {revenueStats.top_donors.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Top Donors</h3>
              <div className="space-y-3">
                {revenueStats.top_donors.map((donor, index) => (
                  <div key={donor.username} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <div className="font-semibold">{donor.username}</div>
                        <div className="text-sm text-gray-400">{donor.count} donations</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      ${donor.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-4">
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Analytics Alerts</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">
              Configure Alerts
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-4">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold">System Healthy</div>
              <div className="text-sm text-gray-300">All metrics are within optimal ranges</div>
            </div>
          </div>
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold">Bitrate Fluctuation Detected</div>
              <div className="text-sm text-gray-300">Bitrate dropped by 15% in the last 5 minutes</div>
            </div>
            <button className="ml-auto px-3 py-1 bg-yellow-600 rounded">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Real-time insights and performance metrics</p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {(['hour', 'day', 'week', 'month'] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg transition ${
              selectedPeriod === period
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Live Status Indicator */}
      {realTimeData && (
        <div className="mb-6 flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${realTimeData.live_status ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="font-semibold">
            {realTimeData.live_status ? 'Live' : 'Offline'}
          </span>
          {realTimeData.live_status && (
            <span className="text-gray-400">
              Uptime: {Math.floor(realTimeData.stream_uptime / 3600)}h {Math.floor((realTimeData.stream_uptime % 3600) / 60)}m
            </span>
          )}
          <span className="ml-auto text-gray-400">
            Last updated: {new Date(realTimeData.last_update).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'viewers', label: 'Viewers' },
          { id: 'performance', label: 'Performance' },
          { id: 'revenue', label: 'Revenue' },
          { id: 'alerts', label: 'Alerts' }
        ] as { id: TabType; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === tab.id
                ? 'bg-white/10 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'viewers' && renderViewersTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'revenue' && renderRevenueTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
        </>
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
}> = ({ title, value, icon, trend }) => (
  <div className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-400">{title}</span>
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    {trend && (
      <div className={`text-sm ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
        {trend}
      </div>
    )}
  </div>
);

const PerformanceScoreCard: React.FC<{
  label: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
}> = ({ label, score, color }) => {
  const colorClasses = {
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-orange-500',
    red: 'from-red-500 to-rose-500'
  };

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-bold mb-2">{score.toFixed(0)}%</div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};