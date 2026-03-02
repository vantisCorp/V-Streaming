use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// PERFORMANCE PROFILING - System Performance Monitoring
// ============================================================================

/// Performance metric type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PerformanceMetricType {
    CPU,
    Memory,
    GPU,
    Network,
    Disk,
    FrameTime,
    Encoding,
    Streaming,
    Custom,
}

/// Performance sample
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSample {
    pub id: String,
    pub metric_type: PerformanceMetricType,
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub timestamp: u64,
    pub tags: HashMap<String, String>,
}

/// Performance profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub samples: Vec<PerformanceSample>,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub active: bool,
}

/// Performance alert
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub id: String,
    pub metric_type: PerformanceMetricType,
    pub name: String,
    pub threshold: f64,
    pub current_value: f64,
    pub severity: String,
    pub message: String,
    pub timestamp: u64,
    pub acknowledged: bool,
}

/// Performance config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub enabled: bool,
    pub sampling_interval: u32, // milliseconds
    pub max_samples: u32,
    pub enable_alerts: bool,
    pub cpu_threshold: f64, // percentage
    pub memory_threshold: f64, // percentage
    pub gpu_threshold: f64, // percentage
    pub frame_time_threshold: f64, // milliseconds
    pub network_latency_threshold: f64, // milliseconds
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            sampling_interval: 1000,
            max_samples: 1000,
            enable_alerts: true,
            cpu_threshold: 90.0,
            memory_threshold: 90.0,
            gpu_threshold: 90.0,
            frame_time_threshold: 33.33, // ~30 FPS
            network_latency_threshold: 1000.0,
        }
    }
}

/// Performance statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub total_samples: u64,
    pub active_profiles: u32,
    pub total_alerts: u64,
    pub acknowledged_alerts: u64,
    pub average_cpu: f64,
    pub average_memory: f64,
    pub average_gpu: f64,
    pub average_frame_time: f64,
}

/// Performance engine state
pub struct PerformanceEngine {
    pub config: PerformanceConfig,
    pub samples: Vec<PerformanceSample>,
    pub profiles: Vec<PerformanceProfile>,
    pub alerts: Vec<PerformanceAlert>,
    pub stats: PerformanceStats,
    pub is_profiling: bool,
}

impl PerformanceEngine {
    pub fn new() -> Self {
        Self {
            config: PerformanceConfig::default(),
            samples: Vec::new(),
            profiles: Vec::new(),
            alerts: Vec::new(),
            stats: PerformanceStats {
                total_samples: 0,
                active_profiles: 0,
                total_alerts: 0,
                acknowledged_alerts: 0,
                average_cpu: 0.0,
                average_memory: 0.0,
                average_gpu: 0.0,
                average_frame_time: 0.0,
            },
            is_profiling: false,
        }
    }

    /// Start profiling
    pub fn start_profiling(&mut self) -> Result<(), String> {
        if self.is_profiling {
            return Err("Already profiling".to_string());
        }
        
        self.is_profiling = true;
        Ok(())
    }

    /// Stop profiling
    pub fn stop_profiling(&mut self) -> Result<(), String> {
        if !self.is_profiling {
            return Err("Not profiling".to_string());
        }
        
        self.is_profiling = false;
        Ok(())
    }

    /// Record performance sample
    pub fn record_sample(&mut self, metric_type: PerformanceMetricType, name: String, value: f64, unit: String, tags: HashMap<String, String>) -> Result<(), String> {
        if !self.config.enabled {
            return Ok(());
        }
        
        let sample = PerformanceSample {
            id: uuid::Uuid::new_v4().to_string(),
            metric_type,
            name,
            value,
            unit,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            tags,
        };
        
        self.samples.push(sample.clone());
        self.stats.total_samples += 1;
        
        // Check thresholds and create alerts
        if self.config.enable_alerts {
            self.check_thresholds(&sample);
        }
        
        // Limit samples
        if self.samples.len() > self.config.max_samples as usize {
            self.samples.remove(0);
        }
        
        Ok(())
    }

    /// Check thresholds and create alerts
    fn check_thresholds(&mut self, sample: &PerformanceSample) {
        let (threshold, severity, message) = match sample.metric_type {
            PerformanceMetricType::CPU => {
                if sample.value > self.config.cpu_threshold {
                    (self.config.cpu_threshold, "warning".to_string(), format!("CPU usage is high: {:.1}%", sample.value))
                } else {
                    return;
                }
            }
            PerformanceMetricType::Memory => {
                if sample.value > self.config.memory_threshold {
                    (self.config.memory_threshold, "warning".to_string(), format!("Memory usage is high: {:.1}%", sample.value))
                } else {
                    return;
                }
            }
            PerformanceMetricType::GPU => {
                if sample.value > self.config.gpu_threshold {
                    (self.config.gpu_threshold, "warning".to_string(), format!("GPU usage is high: {:.1}%", sample.value))
                } else {
                    return;
                }
            }
            PerformanceMetricType::FrameTime => {
                if sample.value > self.config.frame_time_threshold {
                    (self.config.frame_time_threshold, "error".to_string(), format!("Frame time is high: {:.2}ms", sample.value))
                } else {
                    return;
                }
            }
            _ => return,
        };
        
        let alert = PerformanceAlert {
            id: uuid::Uuid::new_v4().to_string(),
            metric_type: sample.metric_type.clone(),
            name: sample.name.clone(),
            threshold,
            current_value: sample.value,
            severity,
            message,
            timestamp: sample.timestamp,
            acknowledged: false,
        };
        
        self.alerts.push(alert);
        self.stats.total_alerts += 1;
    }

    /// Create performance profile
    pub fn create_profile(&mut self, name: String, description: String) -> Result<PerformanceProfile, String> {
        let profile = PerformanceProfile {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            description,
            samples: Vec::new(),
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            end_time: None,
            active: true,
        };
        
        self.profiles.push(profile.clone());
        self.stats.active_profiles += 1;
        
        Ok(profile)
    }

    /// Stop performance profile
    pub fn stop_profile(&mut self, profile_id: String) -> Result<(), String> {
        if let Some(profile) = self.profiles.iter_mut().find(|p| p.id == profile_id) {
            profile.end_time = Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs());
            profile.active = false;
            self.stats.active_profiles -= 1;
            Ok(())
        } else {
            Err("Profile not found".to_string())
        }
    }

    /// Get all samples
    pub fn get_samples(&self) -> Vec<PerformanceSample> {
        self.samples.clone()
    }

    /// Get recent samples
    pub fn get_recent_samples(&self, count: usize) -> Vec<PerformanceSample> {
        self.samples.iter().rev().take(count).cloned().collect()
    }

    /// Get all profiles
    pub fn get_profiles(&self) -> Vec<PerformanceProfile> {
        self.profiles.clone()
    }

    /// Get all alerts
    pub fn get_alerts(&self) -> Vec<PerformanceAlert> {
        self.alerts.clone()
    }

    /// Get unacknowledged alerts
    pub fn get_unacknowledged_alerts(&self) -> Vec<PerformanceAlert> {
        self.alerts.iter().filter(|a| !a.acknowledged).cloned().collect()
    }

    /// Acknowledge alert
    pub fn acknowledge_alert(&mut self, alert_id: String) -> Result<(), String> {
        if let Some(alert) = self.alerts.iter_mut().find(|a| a.id == alert_id) {
            alert.acknowledged = true;
            self.stats.acknowledged_alerts += 1;
            Ok(())
        } else {
            Err("Alert not found".to_string())
        }
    }

    /// Clear samples
    pub fn clear_samples(&mut self) {
        self.samples.clear();
    }

    /// Clear alerts
    pub fn clear_alerts(&mut self) {
        self.alerts.clear();
    }

    /// Update config
    pub fn update_config(&mut self, config: PerformanceConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> PerformanceConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> PerformanceStats {
        self.stats.clone()
    }

    /// Is profiling
    pub fn is_profiling_status(&self) -> bool {
        self.is_profiling
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_performance_config(state: tauri::State<AppState>) -> PerformanceConfig {
    state.performance_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_performance_config(
    config: PerformanceConfig,
    state: tauri::State<AppState>,
) {
    state.performance_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_performance_profiling(state: tauri::State<AppState>) -> Result<(), String> {
    state.performance_engine.lock().unwrap().start_profiling()
}

#[tauri::command]
fn stop_performance_profiling(state: tauri::State<AppState>) -> Result<(), String> {
    state.performance_engine.lock().unwrap().stop_profiling()
}

#[tauri::command]
fn is_performance_profiling(state: tauri::State<AppState>) -> bool {
    state.performance_engine.lock().unwrap().is_profiling_status()
}

#[tauri::command]
fn record_performance_sample(
    metric_type: String,
    name: String,
    value: f64,
    unit: String,
    tags: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let metric_type = match metric_type.as_str() {
        "cpu" => PerformanceMetricType::CPU,
        "memory" => PerformanceMetricType::Memory,
        "gpu" => PerformanceMetricType::GPU,
        "network" => PerformanceMetricType::Network,
        "disk" => PerformanceMetricType::Disk,
        "frame_time" => PerformanceMetricType::FrameTime,
        "encoding" => PerformanceMetricType::Encoding,
        "streaming" => PerformanceMetricType::Streaming,
        "custom" => PerformanceMetricType::Custom,
        _ => return Err("Invalid metric type".to_string()),
    };
    
    state.performance_engine.lock().unwrap().record_sample(metric_type, name, value, unit, tags)
}

#[tauri::command]
fn create_performance_profile(
    name: String,
    description: String,
    state: tauri::State<AppState>,
) -> Result<PerformanceProfile, String> {
    state.performance_engine.lock().unwrap().create_profile(name, description)
}

#[tauri::command]
fn stop_performance_profile(
    profile_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.performance_engine.lock().unwrap().stop_profile(profile_id)
}

#[tauri::command]
fn get_performance_samples(state: tauri::State<AppState>) -> Vec<PerformanceSample> {
    state.performance_engine.lock().unwrap().get_samples()
}

#[tauri::command]
fn get_recent_performance_samples(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<PerformanceSample> {
    state.performance_engine.lock().unwrap().get_recent_samples(count)
}

#[tauri::command]
fn get_performance_profiles(state: tauri::State<AppState>) -> Vec<PerformanceProfile> {
    state.performance_engine.lock().unwrap().get_profiles()
}

#[tauri::command]
fn get_performance_alerts(state: tauri::State<AppState>) -> Vec<PerformanceAlert> {
    state.performance_engine.lock().unwrap().get_alerts()
}

#[tauri::command]
fn get_unacknowledged_performance_alerts(state: tauri::State<AppState>) -> Vec<PerformanceAlert> {
    state.performance_engine.lock().unwrap().get_unacknowledged_alerts()
}

#[tauri::command]
fn acknowledge_performance_alert(
    alert_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.performance_engine.lock().unwrap().acknowledge_alert(alert_id)
}

#[tauri::command]
fn clear_performance_samples(state: tauri::State<AppState>) {
    state.performance_engine.lock().unwrap().clear_samples();
}

#[tauri::command]
fn clear_performance_alerts(state: tauri::State<AppState>) {
    state.performance_engine.lock().unwrap().clear_alerts();
}

#[tauri::command]
fn get_performance_stats(state: tauri::State<AppState>) -> PerformanceStats {
    state.performance_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_performance_metric_types() -> Vec<String> {
    vec![
        "cpu".to_string(),
        "memory".to_string(),
        "gpu".to_string(),
        "network".to_string(),
        "disk".to_string(),
        "frame_time".to_string(),
        "encoding".to_string(),
        "streaming".to_string(),
        "custom".to_string(),
    ]
}