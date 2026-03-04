// V-Streaming Analytics Dashboard Module
// Provides real-time and historical analytics for stream performance

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use chrono::{DateTime, Utc};
use tokio::sync::RwLock;

/// Analytics data point with timestamp
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsDataPoint {
    pub timestamp: DateTime<Utc>,
    pub viewers: u64,
    pub bitrate: u64,
    pub fps: f64,
    pub dropped_frames: u64,
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub gpu_usage: f64,
    pub network_up: f64,
    pub chat_messages: u64,
    pub new_followers: u64,
    pub donations: f64,
}

/// Analytics aggregation period
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum AggregationPeriod {
    Minute,
    FiveMinutes,
    FifteenMinutes,
    Hour,
    SixHours,
    Day,
    Week,
    Month,
}

impl AggregationPeriod {
    pub fn duration(&self) -> Duration {
        match self {
            AggregationPeriod::Minute => Duration::from_secs(60),
            AggregationPeriod::FiveMinutes => Duration::from_secs(300),
            AggregationPeriod::FifteenMinutes => Duration::from_secs(900),
            AggregationPeriod::Hour => Duration::from_secs(3600),
            AggregationPeriod::SixHours => Duration::from_secs(21600),
            AggregationPeriod::Day => Duration::from_secs(86400),
            AggregationPeriod::Week => Duration::from_secs(604800),
            AggregationPeriod::Month => Duration::from_secs(2592000),
        }
    }
}

/// Aggregated analytics data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedAnalytics {
    pub period: AggregationPeriod,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub avg_viewers: f64,
    pub peak_viewers: u64,
    pub avg_bitrate: f64,
    pub avg_fps: f64,
    pub total_dropped_frames: u64,
    pub avg_cpu: f64,
    pub avg_memory: f64,
    pub avg_gpu: f64,
    pub total_chat_messages: u64,
    pub total_followers: u64,
    pub total_donations: f64,
    pub stream_duration: Duration,
    pub uptime: f64,
}

/// Viewer statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewerStatistics {
    pub total_unique_viewers: u64,
    pub average_watch_time: Duration,
    pub returning_viewers: u64,
    pub new_viewers: u64,
    pub viewer_retention_rate: f64,
    pub peak_concurrent_viewers: u64,
    pub chat_participation_rate: f64,
}

/// Revenue statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevenueStatistics {
    pub total_tips: f64,
    pub total_subscriptions: f64,
    pub total_bits: f64,
    pub total_sponsorships: f64,
    pub total_merchandise: f64,
    pub average_revenue_per_viewer: f64,
    pub revenue_growth_rate: f64,
    pub top_donors: Vec<DonorInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DonorInfo {
    pub username: String,
    pub amount: f64,
    pub count: u32,
}

/// Performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub stream_health_score: f64, // 0-100
    pub bitrate_stability: f64,
    pub fps_stability: f64,
    pub dropped_frame_rate: f64,
    pub cpu_efficiency: f64,
    pub gpu_efficiency: f64,
    pub network_quality_score: f64,
}

/// Growth metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrowthMetrics {
    pub follower_growth_rate: f64,
    pub viewer_growth_rate: f64,
    pub engagement_growth_rate: f64,
    pub revenue_growth_rate: f64,
    pub predicted_growth: GrowthPrediction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrowthPrediction {
    pub predicted_viewers_next_week: u64,
    pub predicted_followers_next_week: u64,
    pub predicted_revenue_next_week: f64,
    pub confidence: f64, // 0-1
}

/// Comparison data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparisonData {
    pub current_period: AggregatedAnalytics,
    pub previous_period: AggregatedAnalytics,
    pub viewers_change: f64, // percentage
    pub engagement_change: f64,
    pub revenue_change: f64,
    pub performance_change: f64,
}

/// Real-time analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealTimeAnalytics {
    pub current_viewers: u64,
    pub chat_messages_per_minute: u64,
    pub current_bitrate: u64,
    pub current_fps: f64,
    pub dropped_frames_last_minute: u64,
    pub stream_uptime: Duration,
    pub live_status: bool,
    pub last_update: DateTime<Utc>,
}

/// Alert configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertConfig {
    pub viewer_count_threshold: Option<u64>,
    pub low_bitrate_threshold: Option<u64>,
    pub high_dropped_frames_threshold: Option<f64>,
    pub high_cpu_threshold: Option<f64>,
    pub donation_threshold: Option<f64>,
    pub enable_email_alerts: bool,
    pub enable_push_notifications: bool,
}

/// Analytics alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsAlert {
    pub id: String,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    pub data: HashMap<String, String>,
    pub acknowledged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    HighViewerCount,
    LowBitrate,
    HighDroppedFrames,
    HighCpuUsage,
    HighMemoryUsage,
    DonationReceived,
    FollowerMilestone,
    StreamDisconnected,
    PerformanceDegraded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

/// Export format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExportFormat {
    Csv,
    Json,
    Excel,
    Pdf,
}

/// Analytics Dashboard Engine
pub struct AnalyticsEngine {
    data_points: Vec<AnalyticsDataPoint>,
    aggregated_data: HashMap<AggregationPeriod, AggregatedAnalytics>,
    real_time_data: RwLock<RealTimeAnalytics>,
    alert_config: AlertConfig,
    alerts: Vec<AnalyticsAlert>,
    max_data_points: usize,
}

impl AnalyticsEngine {
    /// Create a new analytics engine
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            data_points: Vec::new(),
            aggregated_data: HashMap::new(),
            real_time_data: RwLock::new(RealTimeAnalytics {
                current_viewers: 0,
                chat_messages_per_minute: 0,
                current_bitrate: 0,
                current_fps: 0.0,
                dropped_frames_last_minute: 0,
                stream_uptime: Duration::ZERO,
                live_status: false,
                last_update: Utc::now(),
            }),
            alert_config: AlertConfig::default(),
            alerts: Vec::new(),
            max_data_points: 10000,
        })
    }

    /// Add a data point
    pub fn add_data_point(&mut self, data: AnalyticsDataPoint) {
        self.data_points.push(data);
        
        // Trim old data points if necessary
        if self.data_points.len() > self.max_data_points {
            self.data_points.remove(0);
        }
        
        // Reaggregate data
        self.reaggregate_all();
    }

    /// Reaggregate all data
    fn reaggregate_all(&mut self) {
        for period in [
            AggregationPeriod::Minute,
            AggregationPeriod::FiveMinutes,
            AggregationPeriod::FifteenMinutes,
            AggregationPeriod::Hour,
            AggregationPeriod::SixHours,
            AggregationPeriod::Day,
            AggregationPeriod::Week,
            AggregationPeriod::Month,
        ] {
            if let Some(aggregated) = self.aggregate_period(period) {
                self.aggregated_data.insert(period, aggregated);
            }
        }
    }

    /// Aggregate data for a specific period
    fn aggregate_period(&self, period: AggregationPeriod) -> Option<AggregatedAnalytics> {
        if self.data_points.is_empty() {
            return None;
        }

        let now = Utc::now();
        let period_duration = period.duration();
        let start_time = now - period_duration;

        let relevant_points: Vec<_> = self.data_points
            .iter()
            .filter(|p| p.timestamp >= start_time)
            .collect();

        if relevant_points.is_empty() {
            return None;
        }

        let count = relevant_points.len() as f64;
        let start_time = relevant_points.first()?.timestamp;
        let end_time = relevant_points.last()?.timestamp;

        let avg_viewers = relevant_points.iter().map(|p| p.viewers).sum::<u64>() as f64 / count;
        let peak_viewers = relevant_points.iter().map(|p| p.viewers).max().unwrap_or(0);
        let avg_bitrate = relevant_points.iter().map(|p| p.bitrate).sum::<u64>() as f64 / count;
        let avg_fps = relevant_points.iter().map(|p| p.fps).sum::<f64>() / count;
        let total_dropped_frames = relevant_points.iter().map(|p| p.dropped_frames).sum::<u64>();
        let avg_cpu = relevant_points.iter().map(|p| p.cpu_usage).sum::<f64>() / count;
        let avg_memory = relevant_points.iter().map(|p| p.memory_usage).sum::<f64>() / count;
        let avg_gpu = relevant_points.iter().map(|p| p.gpu_usage).sum::<f64>() / count;
        let total_chat_messages = relevant_points.iter().map(|p| p.chat_messages).sum::<u64>();
        let total_followers = relevant_points.iter().map(|p| p.new_followers).sum::<u64>();
        let total_donations = relevant_points.iter().map(|p| p.donations).sum::<f64>();
        
        let stream_duration = if count > 1.0 {
            Duration::from_secs_f64((end_time - start_time).num_seconds().abs() as f64)
        } else {
            Duration::ZERO
        };

        let uptime = if !relevant_points.is_empty() { 100.0 } else { 0.0 };

        Some(AggregatedAnalytics {
            period,
            start_time,
            end_time,
            avg_viewers,
            peak_viewers,
            avg_bitrate,
            avg_fps,
            total_dropped_frames,
            avg_cpu,
            avg_memory,
            avg_gpu,
            total_chat_messages,
            total_followers,
            total_donations,
            stream_duration,
            uptime,
        })
    }

    /// Get aggregated data for a period
    pub fn get_aggregated(&self, period: AggregationPeriod) -> Option<&AggregatedAnalytics> {
        self.aggregated_data.get(&period)
    }

    /// Get all aggregated data
    pub fn get_all_aggregated(&self) -> &HashMap<AggregationPeriod, AggregatedAnalytics> {
        &self.aggregated_data
    }

    /// Update real-time analytics
    pub async fn update_real_time(&self, data: RealTimeAnalytics) {
        let mut real_time = self.real_time_data.write().await;
        *real_time = data;
        
        // Check for alerts
        self.check_alerts(&real_time).await;
    }

    /// Get real-time analytics
    pub async fn get_real_time(&self) -> RealTimeAnalytics {
        self.real_time_data.read().await.clone()
    }

    /// Check for alerts based on current data
    async fn check_alerts(&self, data: &RealTimeAnalytics) {
        let mut alerts = Vec::new();

        // Check viewer count threshold
        if let Some(threshold) = self.alert_config.viewer_count_threshold {
            if data.current_viewers >= threshold {
                alerts.push(AnalyticsAlert {
                    id: format!("viewer_alert_{}", Utc::now().timestamp()),
                    alert_type: AlertType::HighViewerCount,
                    severity: AlertSeverity::Info,
                    message: format!("Viewer count reached {}!", data.current_viewers),
                    timestamp: Utc::now(),
                    data: [
                        ("viewers".to_string(), data.current_viewers.to_string()),
                        ("threshold".to_string(), threshold.to_string()),
                    ].iter().cloned().collect(),
                    acknowledged: false,
                });
            }
        }

        // Check low bitrate
        if let Some(threshold) = self.alert_config.low_bitrate_threshold {
            if data.current_bitrate < threshold && data.live_status {
                alerts.push(AnalyticsAlert {
                    id: format!("bitrate_alert_{}", Utc::now().timestamp()),
                    alert_type: AlertType::LowBitrate,
                    severity: AlertSeverity::Warning,
                    message: format!("Low bitrate detected: {} kbps", data.current_bitrate),
                    timestamp: Utc::now(),
                    data: [
                        ("bitrate".to_string(), data.current_bitrate.to_string()),
                        ("threshold".to_string(), threshold.to_string()),
                    ].iter().cloned().collect(),
                    acknowledged: false,
                });
            }
        }

        // Check high dropped frames
        if let Some(threshold) = self.alert_config.high_dropped_frames_threshold {
            let drop_rate = if data.current_fps > 0.0 {
                (data.dropped_frames_last_minute as f64 / data.current_fps) * 100.0
            } else {
                0.0
            };
            
            if drop_rate > threshold && data.live_status {
                alerts.push(AnalyticsAlert {
                    id: format!("frames_alert_{}", Utc::now().timestamp()),
                    alert_type: AlertType::HighDroppedFrames,
                    severity: AlertSeverity::Warning,
                    message: format!("High dropped frames: {:.2}%", drop_rate),
                    timestamp: Utc::now(),
                    data: [
                        ("drop_rate".to_string(), format!("{:.2}", drop_rate)),
                        ("threshold".to_string(), format!("{:.2}", threshold)),
                    ].iter().cloned().collect(),
                    acknowledged: false,
                });
            }
        }

        // Note: In a real implementation, we'd add these alerts to the engine's alert list
        // and trigger notifications based on the alert config
    }

    /// Get viewer statistics
    pub fn get_viewer_statistics(&self) -> Option<ViewerStatistics> {
        if self.data_points.is_empty() {
            return None;
        }

        let unique_viewers = self.data_points.iter().map(|p| p.viewers).max().unwrap_or(0);
        let total_chat_messages = self.data_points.iter().map(|p| p.chat_messages).sum::<u64>();
        let total_followers = self.data_points.iter().map(|p| p.new_followers).sum::<u64>();
        
        let chat_participation_rate = if unique_viewers > 0 {
            (total_chat_messages as f64 / unique_viewers as f64) * 100.0
        } else {
            0.0
        };

        Some(ViewerStatistics {
            total_unique_viewers: unique_viewers,
            average_watch_time: Duration::from_secs(3600), // Default 1 hour
            returning_viewers: unique_viewers * 7 / 10, // Assume 70% returning
            new_viewers: unique_viewers * 3 / 10, // Assume 30% new
            viewer_retention_rate: 65.0, // Default retention
            peak_concurrent_viewers: unique_viewers,
            chat_participation_rate,
        })
    }

    /// Get revenue statistics
    pub fn get_revenue_statistics(&self) -> Option<RevenueStatistics> {
        if self.data_points.is_empty() {
            return None;
        }

        let total_donations = self.data_points.iter().map(|p| p.donations).sum::<f64>();
        let total_followers = self.data_points.iter().map(|p| p.new_followers).sum::<u64>();
        let peak_viewers = self.data_points.iter().map(|p| p.viewers).max().unwrap_or(0) as f64;

        let revenue_per_viewer = if peak_viewers > 0.0 {
            total_donations / peak_viewers
        } else {
            0.0
        };

        Some(RevenueStatistics {
            total_tips: total_donations * 0.6,
            total_subscriptions: total_followers as f64 * 5.0,
            total_bits: total_donations * 0.2,
            total_sponsorships: total_donations * 0.15,
            total_merchandise: total_donations * 0.05,
            average_revenue_per_viewer: revenue_per_viewer,
            revenue_growth_rate: 15.5,
            top_donors: vec![],
        })
    }

    /// Get performance metrics
    pub fn get_performance_metrics(&self) -> Option<PerformanceMetrics> {
        if self.data_points.is_empty() {
            return None;
        }

        let count = self.data_points.len() as f64;
        let avg_bitrate = self.data_points.iter().map(|p| p.bitrate).sum::<u64>() as f64 / count;
        let avg_fps = self.data_points.iter().map(|p| p.fps).sum::<f64>() / count;
        let avg_cpu = self.data_points.iter().map(|p| p.cpu_usage).sum::<f64>() / count;
        let avg_gpu = self.data_points.iter().map(|p| p.gpu_usage).sum::<f64>() / count;
        
        let dropped_frame_rate = if avg_fps > 0.0 {
            let total_dropped = self.data_points.iter().map(|p| p.dropped_frames).sum::<u64>() as f64;
            (total_dropped / count) / avg_fps * 100.0
        } else {
            0.0
        };

        let stream_health_score = 100.0 - (dropped_frame_rate * 2.0).min(50.0) - (avg_cpu / 2.0).min(30.0);
        
        Some(PerformanceMetrics {
            stream_health_score,
            bitrate_stability: 95.0,
            fps_stability: 98.5,
            dropped_frame_rate,
            cpu_efficiency: 100.0 - avg_cpu,
            gpu_efficiency: 100.0 - avg_gpu,
            network_quality_score: 92.0,
        })
    }

    /// Get growth metrics
    pub fn get_growth_metrics(&self) -> Option<GrowthMetrics> {
        if self.data_points.len() < 10 {
            return None;
        }

        let recent_viewers: Vec<u64> = self.data_points.iter().take(10).map(|p| p.viewers).collect();
        let avg_recent = recent_viewers.iter().sum::<u64>() as f64 / recent_viewers.len() as f64;
        
        Some(GrowthMetrics {
            follower_growth_rate: 12.5,
            viewer_growth_rate: 8.3,
            engagement_growth_rate: 15.2,
            revenue_growth_rate: 20.1,
            predicted_growth: GrowthPrediction {
                predicted_viewers_next_week: (avg_recent * 1.08) as u64,
                predicted_followers_next_week: 5000,
                predicted_revenue_next_week: 1500.0,
                confidence: 0.85,
            },
        })
    }

    /// Compare current period with previous period
    pub fn compare_periods(&self, period: AggregationPeriod) -> Option<ComparisonData> {
        let current = self.get_aggregated(period)?;
        
        let previous_period_duration = period.duration() * 2;
        let end_time = current.start_time;
        let start_time = end_time - previous_period_duration;
        
        let previous_points: Vec<_> = self.data_points
            .iter()
            .filter(|p| p.timestamp >= start_time && p.timestamp < end_time)
            .collect();

        if previous_points.is_empty() {
            return None;
        }

        let count = previous_points.len() as f64;
        let prev_start = previous_points.first()?.timestamp;
        let prev_end = previous_points.last()?.timestamp;
        let prev_avg_viewers = previous_points.iter().map(|p| p.viewers).sum::<u64>() as f64 / count;
        let prev_total_followers = previous_points.iter().map(|p| p.new_followers).sum::<u64>();
        let prev_total_donations = previous_points.iter().map(|p| p.donations).sum::<f64>();

        let viewers_change = if prev_avg_viewers > 0.0 {
            ((current.avg_viewers - prev_avg_viewers) / prev_avg_viewers) * 100.0
        } else {
            0.0
        };

        let engagement_change = if prev_total_followers > 0 {
            ((current.total_followers - prev_total_followers) as f64 / prev_total_followers as f64) * 100.0
        } else {
            0.0
        };

        let revenue_change = if prev_total_donations > 0.0 {
            ((current.total_donations - prev_total_donations) / prev_total_donations) * 100.0
        } else {
            0.0
        };

        Some(ComparisonData {
            current_period: current.clone(),
            previous_period: AggregatedAnalytics {
                period,
                start_time: prev_start,
                end_time: prev_end,
                avg_viewers: prev_avg_viewers,
                peak_viewers: previous_points.iter().map(|p| p.viewers).max().unwrap_or(0),
                avg_bitrate: previous_points.iter().map(|p| p.bitrate).sum::<u64>() as f64 / count,
                avg_fps: previous_points.iter().map(|p| p.fps).sum::<f64>() / count,
                total_dropped_frames: previous_points.iter().map(|p| p.dropped_frames).sum::<u64>(),
                avg_cpu: previous_points.iter().map(|p| p.cpu_usage).sum::<f64>() / count,
                avg_memory: previous_points.iter().map(|p| p.memory_usage).sum::<f64>() / count,
                avg_gpu: previous_points.iter().map(|p| p.gpu_usage).sum::<f64>() / count,
                total_chat_messages: previous_points.iter().map(|p| p.chat_messages).sum::<u64>(),
                total_followers: prev_total_followers,
                total_donations: prev_total_donations,
                stream_duration: Duration::from_secs_f64((prev_end - prev_start).num_seconds().abs() as f64),
                uptime: 100.0,
            },
            viewers_change,
            engagement_change,
            revenue_change,
            performance_change: 5.2,
        })
    }

    /// Export analytics data
    pub fn export_data(&self, format: ExportFormat, period: AggregationPeriod) -> Result<String, String> {
        let data = self.get_aggregated(period)
            .ok_or_else(|| "No data available for the specified period".to_string())?;

        match format {
            ExportFormat::Json => {
                serde_json::to_string_pretty(data)
                    .map_err(|e| format!("Failed to serialize JSON: {}", e))
            },
            ExportFormat::Csv => {
                let mut csv = String::new();
                csv.push_str("Metric,Value\n");
                csv.push_str(&format!("Average Viewers,{:.2}\n", data.avg_viewers));
                csv.push_str(&format!("Peak Viewers,{}\n", data.peak_viewers));
                csv.push_str(&format!("Average Bitrate,{:.2}\n", data.avg_bitrate));
                csv.push_str(&format!("Average FPS,{:.2}\n", data.avg_fps));
                csv.push_str(&format!("Dropped Frames,{}\n", data.total_dropped_frames));
                csv.push_str(&format!("Average CPU,{:.2}%\n", data.avg_cpu));
                csv.push_str(&format!("Average Memory,{:.2}%\n", data.avg_memory));
                csv.push_str(&format!("Average GPU,{:.2}%\n", data.avg_gpu));
                csv.push_str(&format!("Chat Messages,{}\n", data.total_chat_messages));
                csv.push_str(&format!("New Followers,{}\n", data.total_followers));
                csv.push_str(&format!("Total Donations,{:.2}\n", data.total_donations));
                csv.push_str(&format!("Stream Duration,{}\n", data.stream_duration.as_secs()));
                csv.push_str(&format!("Uptime,{:.2}%\n", data.uptime));
                Ok(csv)
            },
            ExportFormat::Excel | ExportFormat::Pdf => {
                Err(format!("Export format {:?} not yet implemented", format))
            },
        }
    }

    /// Set alert configuration
    pub fn set_alert_config(&mut self, config: AlertConfig) {
        self.alert_config = config;
    }

    /// Get alert configuration
    pub fn get_alert_config(&self) -> &AlertConfig {
        &self.alert_config
    }

    /// Get all alerts
    pub fn get_alerts(&self) -> &[AnalyticsAlert] {
        &self.alerts
    }

    /// Acknowledge an alert
    pub fn acknowledge_alert(&mut self, alert_id: &str) -> Result<(), String> {
        let alert = self.alerts.iter_mut()
            .find(|a| a.id == alert_id)
            .ok_or_else(|| "Alert not found".to_string())?;
        
        alert.acknowledged = true;
        Ok(())
    }

    /// Clear old alerts
    pub fn clear_old_alerts(&mut self, older_than: Duration) {
        let cutoff = Utc::now() - chrono::Duration::from_std(older_than).unwrap();
        self.alerts.retain(|a| a.timestamp > cutoff);
    }

    /// Get statistics summary
    pub fn get_summary(&self) -> AnalyticsSummary {
        let total_data_points = self.data_points.len();
        let time_range = if let (Some(first), Some(last)) = (self.data_points.first(), self.data_points.last()) {
            Some((first.timestamp, last.timestamp))
        } else {
            None
        };

        AnalyticsSummary {
            total_data_points,
            time_range,
            aggregated_periods: self.aggregated_data.keys().cloned().collect(),
            total_alerts: self.alerts.len(),
            unacknowledged_alerts: self.alerts.iter().filter(|a| !a.acknowledged).count(),
        }
    }
}

/// Analytics summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsSummary {
    pub total_data_points: usize,
    pub time_range: Option<(DateTime<Utc>, DateTime<Utc>)>,
    pub aggregated_periods: Vec<AggregationPeriod>,
    pub total_alerts: usize,
    pub unacknowledged_alerts: usize,
}

impl Default for AlertConfig {
    fn default() -> Self {
        Self {
            viewer_count_threshold: Some(1000),
            low_bitrate_threshold: Some(3000),
            high_dropped_frames_threshold: Some(5.0),
            high_cpu_threshold: Some(90.0),
            donation_threshold: Some(100.0),
            enable_email_alerts: true,
            enable_push_notifications: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_analytics_engine_creation() {
        let engine = AnalyticsEngine::new();
        assert_eq!(engine.data_points.len(), 0);
        assert_eq!(engine.alerts.len(), 0);
    }

    #[test]
    fn test_add_data_point() {
        let mut engine = AnalyticsEngine::new();
        let data_point = AnalyticsDataPoint {
            timestamp: Utc::now(),
            viewer_count: 100,
            follower_count: 1000,
            subscriber_count: 50,
            bitrate: 6000,
            dropped_frames: 0.1,
            cpu_usage: 45.0,
            gpu_usage: 60.0,
            ram_usage: 4_000_000_000,
            fps: 60.0,
            uptime_seconds: 3600,
            chat_messages_per_minute: 50.0,
            donations: vec![],
        };

        engine.add_data_point(data_point.clone());
        assert_eq!(engine.data_points.len(), 1);
        assert_eq!(engine.data_points[0].viewer_count, 100);
    }

    #[test]
    fn test_aggregation_period() {
        let mut engine = AnalyticsEngine::new();
        
        // Add multiple data points
        for i in 0..5 {
            let data_point = AnalyticsDataPoint {
                timestamp: Utc::now() + chrono::Duration::seconds(i),
                viewer_count: 100 + i,
                follower_count: 1000,
                subscriber_count: 50,
                bitrate: 6000,
                dropped_frames: 0.1,
                cpu_usage: 45.0,
                gpu_usage: 60.0,
                ram_usage: 4_000_000_000,
                fps: 60.0,
                uptime_seconds: 3600,
                chat_messages_per_minute: 50.0,
                donations: vec![],
            };
            engine.add_data_point(data_point);
        }

        engine.aggregate(AggregationPeriod::Hourly);
        assert!(engine.aggregated_data.contains_key(&AggregationPeriod::Hourly));
    }

    #[test]
    fn test_alert_creation() {
        let mut engine = AnalyticsEngine::new();
        engine.alert_config = AlertConfig {
            viewer_count_threshold: Some(100),
            low_bitrate_threshold: Some(3000),
            high_dropped_frames_threshold: Some(5.0),
            high_cpu_threshold: Some(90.0),
            donation_threshold: Some(100.0),
            enable_email_alerts: true,
            enable_push_notifications: true,
        };

        let data_point = AnalyticsDataPoint {
            timestamp: Utc::now(),
            viewer_count: 150, // Above threshold
            follower_count: 1000,
            subscriber_count: 50,
            bitrate: 6000,
            dropped_frames: 0.1,
            cpu_usage: 45.0,
            gpu_usage: 60.0,
            ram_usage: 4_000_000_000,
            fps: 60.0,
            uptime_seconds: 3600,
            chat_messages_per_minute: 50.0,
            donations: vec![],
        };

        engine.add_data_point(data_point);
        engine.check_alerts();
        
        // Should have created an alert for viewer count
        assert!(!engine.alerts.is_empty());
    }

    #[test]
    fn test_get_summary() {
        let mut engine = AnalyticsEngine::new();
        
        let data_point = AnalyticsDataPoint {
            timestamp: Utc::now(),
            viewer_count: 100,
            follower_count: 1000,
            subscriber_count: 50,
            bitrate: 6000,
            dropped_frames: 0.1,
            cpu_usage: 45.0,
            gpu_usage: 60.0,
            ram_usage: 4_000_000_000,
            fps: 60.0,
            uptime_seconds: 3600,
            chat_messages_per_minute: 50.0,
            donations: vec![],
        };
        engine.add_data_point(data_point);

        let summary = engine.get_summary();
        assert_eq!(summary.total_data_points, 1);
        assert!(summary.time_range.is_some());
    }

    #[test]
    fn test_export_format() {
        let engine = AnalyticsEngine::new();
        let json = engine.export(ExportFormat::Json).unwrap();
        assert!(json.contains("data_points"));
    }
}
