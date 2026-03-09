use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;
use crate::AppState;

// ============================================================================
// TELEMETRY AND ERROR TRACKING - Analytics and Monitoring
// ============================================================================

/// Telemetry event type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TelemetryEventType {
    AppStart,
    AppClose,
    StreamStart,
    StreamEnd,
    FeatureUsed,
    Error,
    Warning,
    Performance,
    Custom,
}

/// Error severity
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ErrorSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Telemetry event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEvent {
    pub id: String,
    pub event_type: TelemetryEventType,
    pub timestamp: u64,
    pub data: HashMap<String, String>,
    pub user_id: Option<String>,
    pub session_id: String,
}

/// Error report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorReport {
    pub id: String,
    pub error_type: String,
    pub message: String,
    pub stack_trace: Option<String>,
    pub severity: ErrorSeverity,
    pub timestamp: u64,
    pub user_id: Option<String>,
    pub session_id: String,
    pub app_version: String,
    pub os_version: String,
    pub hardware_info: HashMap<String, String>,
}

/// Performance metric
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub id: String,
    pub metric_name: String,
    pub value: f64,
    pub unit: String,
    pub timestamp: u64,
    pub tags: HashMap<String, String>,
}

/// Telemetry config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub send_anonymous_data: bool,
    pub send_error_reports: bool,
    pub send_performance_metrics: bool,
    pub endpoint_url: Option<String>,
    pub batch_size: u32,
    pub flush_interval: u32, // seconds
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            send_anonymous_data: true,
            send_error_reports: true,
            send_performance_metrics: true,
            endpoint_url: None,
            batch_size: 10,
            flush_interval: 60,
        }
    }
}

/// Telemetry statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryStats {
    pub total_events: u64,
    pub total_errors: u64,
    pub total_warnings: u64,
    pub total_performance_metrics: u64,
    pub events_sent: u64,
    pub events_failed: u64,
}

/// Telemetry engine state
pub struct TelemetryEngine {
    pub config: TelemetryConfig,
    pub events: Vec<TelemetryEvent>,
    pub errors: Vec<ErrorReport>,
    pub performance_metrics: Vec<PerformanceMetric>,
    pub stats: TelemetryStats,
    pub session_id: String,
    pub user_id: Option<String>,
}

impl TelemetryEngine {
    pub fn new() -> Self {
        Self {
            config: TelemetryConfig::default(),
            events: Vec::new(),
            errors: Vec::new(),
            performance_metrics: Vec::new(),
            stats: TelemetryStats {
                total_events: 0,
                total_errors: 0,
                total_warnings: 0,
                total_performance_metrics: 0,
                events_sent: 0,
                events_failed: 0,
            },
            session_id: uuid::Uuid::new_v4().to_string(),
            user_id: None,
        }
    }

    /// Log telemetry event
    pub fn log_event(&mut self, event_type: TelemetryEventType, data: HashMap<String, String>) -> Result<(), String> {
        if !self.config.enabled {
            return Ok(());
        }
        
        let event = TelemetryEvent {
            id: uuid::Uuid::new_v4().to_string(),
            event_type,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            data,
            user_id: self.user_id.clone(),
            session_id: self.session_id.clone(),
        };
        
        self.events.push(event);
        self.stats.total_events += 1;
        
        Ok(())
    }

    /// Report error
    pub fn report_error(&mut self, error_type: String, message: String, stack_trace: Option<String>, severity: ErrorSeverity) -> Result<(), String> {
        if !self.config.send_error_reports {
            return Ok(());
        }
        
        let error = ErrorReport {
            id: uuid::Uuid::new_v4().to_string(),
            error_type,
            message,
            stack_trace,
            severity: severity.clone(),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            user_id: self.user_id.clone(),
            session_id: self.session_id.clone(),
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            os_version: std::env::consts::OS.to_string(),
            hardware_info: HashMap::new(),
        };
        
        self.errors.push(error.clone());
        self.stats.total_events += 1;
        
        match severity {
            ErrorSeverity::Error => self.stats.total_errors += 1,
            ErrorSeverity::Critical => self.stats.total_errors += 1,
            ErrorSeverity::Warning => self.stats.total_warnings += 1,
            _ => {}
        }
        
        Ok(())
    }

    /// Record performance metric
    pub fn record_metric(&mut self, metric_name: String, value: f64, unit: String, tags: HashMap<String, String>) -> Result<(), String> {
        if !self.config.send_performance_metrics {
            return Ok(());
        }
        
        let metric = PerformanceMetric {
            id: uuid::Uuid::new_v4().to_string(),
            metric_name,
            value,
            unit,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            tags,
        };
        
        self.performance_metrics.push(metric);
        self.stats.total_performance_metrics += 1;
        
        Ok(())
    }

    /// Get all events
    pub fn get_events(&self) -> Vec<TelemetryEvent> {
        self.events.clone()
    }

    /// Get recent events
    pub fn get_recent_events(&self, count: usize) -> Vec<TelemetryEvent> {
        self.events.iter().rev().take(count).cloned().collect()
    }

    /// Get all errors
    pub fn get_errors(&self) -> Vec<ErrorReport> {
        self.errors.clone()
    }

    /// Get recent errors
    pub fn get_recent_errors(&self, count: usize) -> Vec<ErrorReport> {
        self.errors.iter().rev().take(count).cloned().collect()
    }

    /// Get performance metrics
    pub fn get_performance_metrics(&self) -> Vec<PerformanceMetric> {
        self.performance_metrics.clone()
    }

    /// Clear events
    pub fn clear_events(&mut self) {
        self.events.clear();
    }

    /// Clear errors
    pub fn clear_errors(&mut self) {
        self.errors.clear();
    }

    /// Clear performance metrics
    pub fn clear_metrics(&mut self) {
        self.performance_metrics.clear();
    }

    /// Update config
    pub fn update_config(&mut self, config: TelemetryConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> TelemetryConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> TelemetryStats {
        self.stats.clone()
    }

    /// Set user ID
    pub fn set_user_id(&mut self, user_id: String) {
        self.user_id = Some(user_id);
    }

    /// Get session ID
    pub fn get_session_id(&self) -> String {
        self.session_id.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_telemetry_config(state: tauri::State<AppState>) -> TelemetryConfig {
    state.telemetry_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_telemetry_config(
    config: TelemetryConfig,
    state: tauri::State<AppState>,
) {
    state.telemetry_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn log_telemetry_event(
    event_type: String,
    data: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let event_type = match event_type.as_str() {
        "app_start" => TelemetryEventType::AppStart,
        "app_close" => TelemetryEventType::AppClose,
        "stream_start" => TelemetryEventType::StreamStart,
        "stream_end" => TelemetryEventType::StreamEnd,
        "feature_used" => TelemetryEventType::FeatureUsed,
        "error" => TelemetryEventType::Error,
        "warning" => TelemetryEventType::Warning,
        "performance" => TelemetryEventType::Performance,
        "custom" => TelemetryEventType::Custom,
        _ => return Err("Invalid event type".to_string()),
    };
    
    state.telemetry_engine.lock().unwrap().log_event(event_type, data)
}

#[tauri::command]
fn report_error(
    error_type: String,
    message: String,
    stack_trace: Option<String>,
    severity: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let severity = match severity.as_str() {
        "info" => ErrorSeverity::Info,
        "warning" => ErrorSeverity::Warning,
        "error" => ErrorSeverity::Error,
        "critical" => ErrorSeverity::Critical,
        _ => return Err("Invalid severity".to_string()),
    };
    
    state.telemetry_engine.lock().unwrap().report_error(error_type, message, stack_trace, severity)
}

#[tauri::command]
fn record_performance_metric(
    metric_name: String,
    value: f64,
    unit: String,
    tags: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.telemetry_engine.lock().unwrap().record_metric(metric_name, value, unit, tags)
}

#[tauri::command]
fn get_telemetry_events(state: tauri::State<AppState>) -> Vec<TelemetryEvent> {
    state.telemetry_engine.lock().unwrap().get_events()
}

#[tauri::command]
fn get_recent_telemetry_events(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<TelemetryEvent> {
    state.telemetry_engine.lock().unwrap().get_recent_events(count)
}

#[tauri::command]
fn get_error_reports(state: tauri::State<AppState>) -> Vec<ErrorReport> {
    state.telemetry_engine.lock().unwrap().get_errors()
}

#[tauri::command]
fn get_recent_error_reports(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<ErrorReport> {
    state.telemetry_engine.lock().unwrap().get_recent_errors(count)
}

#[tauri::command]
fn get_performance_metrics(state: tauri::State<AppState>) -> Vec<PerformanceMetric> {
    state.telemetry_engine.lock().unwrap().get_performance_metrics()
}

#[tauri::command]
fn clear_telemetry_events(state: tauri::State<AppState>) {
    state.telemetry_engine.lock().unwrap().clear_events();
}

#[tauri::command]
fn clear_error_reports(state: tauri::State<AppState>) {
    state.telemetry_engine.lock().unwrap().clear_errors();
}

#[tauri::command]
fn clear_performance_metrics(state: tauri::State<AppState>) {
    state.telemetry_engine.lock().unwrap().clear_metrics();
}

#[tauri::command]
fn get_telemetry_stats(state: tauri::State<AppState>) -> TelemetryStats {
    state.telemetry_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn set_telemetry_user_id(
    user_id: String,
    state: tauri::State<AppState>,
) {
    state.telemetry_engine.lock().unwrap().set_user_id(user_id);
}

#[tauri::command]
fn get_telemetry_session_id(state: tauri::State<AppState>) -> String {
    state.telemetry_engine.lock().unwrap().get_session_id()
}

#[tauri::command]
fn get_telemetry_event_types() -> Vec<String> {
    vec![
        "app_start".to_string(),
        "app_close".to_string(),
        "stream_start".to_string(),
        "stream_end".to_string(),
        "feature_used".to_string(),
        "error".to_string(),
        "warning".to_string(),
        "performance".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_error_severities() -> Vec<String> {
    vec![
        "info".to_string(),
        "warning".to_string(),
        "error".to_string(),
        "critical".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_telemetry_event_creation() {
        let mut data = HashMap::new();
        data.insert("feature".to_string(), "streaming".to_string());
        
        let event = TelemetryEvent {
            id: "event1".to_string(),
            event_type: TelemetryEventType::FeatureUsed,
            timestamp: 1234567890,
            data: data,
            user_id: Some("user123".to_string()),
            session_id: "session456".to_string(),
        };

        assert_eq!(event.id, "event1");
        assert_eq!(event.event_type, TelemetryEventType::FeatureUsed);
        assert_eq!(event.user_id, Some("user123".to_string()));
    }

    #[test]
    fn test_error_report_creation() {
        let mut hardware_info = HashMap::new();
        hardware_info.insert("gpu".to_string(), "NVIDIA RTX 3080".to_string());
        
        let error = ErrorReport {
            id: "error1".to_string(),
            error_type: "StreamError".to_string(),
            message: "Failed to start stream".to_string(),
            stack_trace: Some("at line 123".to_string()),
            severity: ErrorSeverity::Error,
            timestamp: 1234567890,
            user_id: Some("user123".to_string()),
            session_id: "session456".to_string(),
            app_version: "1.0.0".to_string(),
            os_version: "Windows 11".to_string(),
            hardware_info: hardware_info,
        };

        assert_eq!(error.id, "error1");
        assert_eq!(error.severity, ErrorSeverity::Error);
        assert_eq!(error.error_type, "StreamError");
    }

    #[test]
    fn test_performance_metric_creation() {
        let mut tags = HashMap::new();
        tags.insert("module".to_string(), "encoding".to_string());
        
        let metric = PerformanceMetric {
            id: "metric1".to_string(),
            metric_name: "fps".to_string(),
            value: 60.0,
            unit: "frames/sec".to_string(),
            timestamp: 1234567890,
            tags: tags,
        };

        assert_eq!(metric.id, "metric1");
        assert_eq!(metric.value, 60.0);
        assert_eq!(metric.unit, "frames/sec");
    }

    #[test]
    fn test_telemetry_config_default() {
        let config = TelemetryConfig::default();
        
        assert_eq!(config.enabled, true);
        assert_eq!(config.send_anonymous_data, true);
        assert_eq!(config.batch_size, 10);
        assert_eq!(config.flush_interval, 60);
    }

    #[test]
    fn test_telemetry_event_type_variants() {
        let types = vec![
            TelemetryEventType::AppStart,
            TelemetryEventType::AppClose,
            TelemetryEventType::StreamStart,
            TelemetryEventType::StreamEnd,
            TelemetryEventType::FeatureUsed,
            TelemetryEventType::Error,
            TelemetryEventType::Warning,
            TelemetryEventType::Performance,
            TelemetryEventType::Custom,
        ];

        assert_eq!(types.len(), 9);
        assert_eq!(types[0], TelemetryEventType::AppStart);
    }

    #[test]
    fn test_error_severity_variants() {
        let severities = vec![
            ErrorSeverity::Info,
            ErrorSeverity::Warning,
            ErrorSeverity::Error,
            ErrorSeverity::Critical,
        ];

        assert_eq!(severities.len(), 4);
        assert_eq!(severities[0], ErrorSeverity::Info);
    }

    #[test]
    fn test_error_report_serialization() {
        let error = ErrorReport {
            id: "error1".to_string(),
            error_type: "TestError".to_string(),
            message: "Test error message".to_string(),
            stack_trace: None,
            severity: ErrorSeverity::Warning,
            timestamp: 1234567890,
            user_id: None,
            session_id: "session1".to_string(),
            app_version: "1.0.0".to_string(),
            os_version: "Linux".to_string(),
            hardware_info: HashMap::new(),
        };

        // Test that struct can be serialized (compile-time check)
        let _json = serde_json::to_string(&error);
        assert!(true);
    }
}
