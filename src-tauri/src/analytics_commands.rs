// Analytics Tauri Commands
use crate::analytics::{AggregatedAnalytics, AnalyticsDataPoint, RealTimeAnalytics};
use crate::analytics::{AnalyticsEngine, AggregationPeriod, ExportFormat};
use tauri::State;
use std::sync::Mutex;

/// Analytics engine state
pub struct AnalyticsState(pub Mutex<AnalyticsEngine>);

/// Initialize analytics engine
pub fn init_analytics() -> AnalyticsEngine {
    AnalyticsEngine::new().expect("Failed to initialize analytics engine")
}

#[tauri::command]
pub async fn analytics_get_real_time(
    state: State<'_, AnalyticsState>
) -> Result<RealTimeAnalytics, String> {
    Ok(state.0.lock()
        .unwrap()
        .get_real_time()
        .await)
}

#[tauri::command]
pub fn analytics_get_aggregated(
    period: String,
    state: State<'_, AnalyticsState>
) -> Result<Option<AggregatedAnalytics>, String> {
    let period = match period.as_str() {
        "minute" => AggregationPeriod::Minute,
        "five_minutes" => AggregationPeriod::FiveMinutes,
        "fifteen_minutes" => AggregationPeriod::FifteenMinutes,
        "hour" => AggregationPeriod::Hour,
        "six_hours" => AggregationPeriod::SixHours,
        "day" => AggregationPeriod::Day,
        "week" => AggregationPeriod::Week,
        "month" => AggregationPeriod::Month,
        _ => return Err("Invalid period".to_string()),
    };
    Ok(state.0.lock().unwrap().get_aggregated(period).cloned())
}

#[tauri::command]
pub fn analytics_get_performance_metrics(
    state: State<'_, AnalyticsState>
) -> Result<Option<crate::analytics::PerformanceMetrics>, String> {
    Ok(state.0.lock().unwrap().get_performance_metrics())
}

#[tauri::command]
pub fn analytics_get_viewer_statistics(
    state: State<'_, AnalyticsState>
) -> Result<Option<crate::analytics::ViewerStatistics>, String> {
    Ok(state.0.lock().unwrap().get_viewer_statistics())
}

#[tauri::command]
pub fn analytics_get_revenue_statistics(
    state: State<'_, AnalyticsState>
) -> Result<Option<crate::analytics::RevenueStatistics>, String> {
    Ok(state.0.lock().unwrap().get_revenue_statistics())
}

#[tauri::command]
pub async fn analytics_update_real_time(
    data: RealTimeAnalytics,
    state: State<'_, AnalyticsState>
) -> Result<(), String> {
    state.0.lock().unwrap().update_real_time(data).await;
    Ok(())
}

#[tauri::command]
pub fn analytics_add_data_point(
    data: AnalyticsDataPoint,
    state: State<'_, AnalyticsState>
) -> Result<(), String> {
    state.0.lock().unwrap().add_data_point(data);
    Ok(())
}

#[tauri::command]
pub fn analytics_export_data(
    format: String,
    period: String,
    state: State<'_, AnalyticsState>
) -> Result<String, String> {
    let format = match format.as_str() {
        "json" => ExportFormat::Json,
        "csv" => ExportFormat::Csv,
        "excel" => ExportFormat::Excel,
        "pdf" => ExportFormat::Pdf,
        _ => return Err("Invalid format".to_string()),
    };
    let period = match period.as_str() {
        "minute" => AggregationPeriod::Minute,
        "five_minutes" => AggregationPeriod::FiveMinutes,
        "fifteen_minutes" => AggregationPeriod::FifteenMinutes,
        "hour" => AggregationPeriod::Hour,
        "six_hours" => AggregationPeriod::SixHours,
        "day" => AggregationPeriod::Day,
        "week" => AggregationPeriod::Week,
        "month" => AggregationPeriod::Month,
        _ => return Err("Invalid period".to_string()),
    };
    state.0.lock().unwrap().export_data(format, period)
}

#[tauri::command]
pub fn analytics_get_summary(
    state: State<'_, AnalyticsState>
) -> Result<crate::analytics::AnalyticsSummary, String> {
    Ok(state.0.lock().unwrap().get_summary())
}