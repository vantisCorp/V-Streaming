//! Performance profiling and benchmarking tools
//! 
//! This module provides comprehensive performance profiling capabilities
//! for monitoring and optimizing the V-Streaming application.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

/// Performance profiler instance
pub struct Profiler {
    /// Active profiling sessions
    sessions: HashMap<String, ProfilingSession>,
    /// Completed profiling results
    results: Vec<ProfilingResult>,
    /// Configuration
    config: ProfilerConfig,
    /// System metrics collector
    system_metrics: SystemMetrics,
}

/// Profiler configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilerConfig {
    /// Enable CPU profiling
    pub cpu_profiling: bool,
    /// Enable memory profiling
    pub memory_profiling: bool,
    /// Enable GPU profiling
    pub gpu_profiling: bool,
    /// Enable I/O profiling
    pub io_profiling: bool,
    /// Sampling interval in milliseconds
    pub sampling_interval_ms: u64,
    /// Maximum number of results to keep
    pub max_results: usize,
    /// Auto-export results
    pub auto_export: bool,
    /// Export path
    pub export_path: Option<String>,
}

impl Default for ProfilerConfig {
    fn default() -> Self {
        Self {
            cpu_profiling: true,
            memory_profiling: true,
            gpu_profiling: true,
            io_profiling: true,
            sampling_interval_ms: 100,
            max_results: 100,
            auto_export: false,
            export_path: None,
        }
    }
}

/// Active profiling session
#[derive(Debug, Clone)]
pub struct ProfilingSession {
    /// Session ID
    pub id: String,
    /// Session name
    pub name: String,
    /// Start time
    pub start_time: Instant,
    /// System start time
    pub system_start_time: u64,
    /// Profiling category
    pub category: ProfilingCategory,
    /// Collected samples
    pub samples: Vec<ProfileSample>,
    /// Frame times (for rendering profiling)
    pub frame_times: Vec<FrameTime>,
    /// Call stack traces
    pub call_stacks: Vec<CallStack>,
    /// Status
    pub status: SessionStatus,
}

/// Profiling category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProfilingCategory {
    /// Capture performance
    Capture,
    /// Encoding performance
    Encoding,
    /// Streaming performance
    Streaming,
    /// Rendering/composition performance
    Rendering,
    /// Audio processing performance
    Audio,
    /// AI operations performance
    AI,
    /// General application performance
    General,
    /// Custom profiling category
    Custom(String),
}

/// Profile sample
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSample {
    /// Sample timestamp (relative to session start)
    pub timestamp_ms: u64,
    /// CPU usage percentage
    pub cpu_usage: f32,
    /// Memory usage in bytes
    pub memory_bytes: u64,
    /// GPU usage percentage
    pub gpu_usage: Option<f32>,
    /// GPU memory usage in bytes
    pub gpu_memory_bytes: Option<u64>,
    /// Thread count
    pub thread_count: u32,
    /// I/O read bytes
    pub io_read_bytes: u64,
    /// I/O write bytes
    pub io_write_bytes: u64,
    /// Network bytes sent
    pub network_sent_bytes: u64,
    /// Network bytes received
    pub network_recv_bytes: u64,
}

/// Frame timing data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameTime {
    /// Frame number
    pub frame_number: u64,
    /// Frame start time
    pub start_time_ms: u64,
    /// Frame duration
    pub duration_ms: f32,
    /// Frame category (capture, encode, render, etc.)
    pub category: String,
    /// Additional metrics
    pub metrics: HashMap<String, f32>,
}

/// Call stack trace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallStack {
    /// Timestamp
    pub timestamp_ms: u64,
    /// Stack frames
    pub frames: Vec<StackFrame>,
    /// Thread ID
    pub thread_id: u64,
}

/// Stack frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackFrame {
    /// Function name
    pub function: String,
    /// File path
    pub file: Option<String>,
    /// Line number
    pub line: Option<u32>,
    /// Module/library
    pub module: Option<String>,
}

/// Session status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionStatus {
    Running,
    Paused,
    Stopped,
    Completed,
}

/// Profiling result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilingResult {
    /// Result ID
    pub id: String,
    /// Session name
    pub session_name: String,
    /// Category
    pub category: ProfilingCategory,
    /// Duration in milliseconds
    pub duration_ms: u64,
    /// Start timestamp (Unix epoch)
    pub start_timestamp: u64,
    /// End timestamp (Unix epoch)
    pub end_timestamp: u64,
    /// Summary statistics
    pub summary: ProfilingSummary,
    /// All samples
    pub samples: Vec<ProfileSample>,
    /// Frame times
    pub frame_times: Vec<FrameTime>,
    /// Performance issues detected
    pub issues: Vec<PerformanceIssue>,
    /// Recommendations
    pub recommendations: Vec<Recommendation>,
}

/// Profiling summary statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilingSummary {
    // CPU statistics
    pub avg_cpu_usage: f32,
    pub max_cpu_usage: f32,
    pub min_cpu_usage: f32,
    pub cpu_usage_stddev: f32,
    
    // Memory statistics
    pub avg_memory_mb: f64,
    pub max_memory_mb: f64,
    pub min_memory_mb: f64,
    pub memory_growth_mb: f64,
    
    // GPU statistics
    pub avg_gpu_usage: Option<f32>,
    pub max_gpu_usage: Option<f32>,
    pub avg_gpu_memory_mb: Option<f64>,
    pub max_gpu_memory_mb: Option<f64>,
    
    // Frame statistics
    pub total_frames: u64,
    pub avg_frame_time_ms: f32,
    pub min_frame_time_ms: f32,
    pub max_frame_time_ms: f32,
    pub frames_below_60fps: u64,
    pub frames_below_30fps: u64,
    
    // I/O statistics
    pub total_io_read_mb: f64,
    pub total_io_write_mb: f64,
    pub avg_io_read_rate_mbps: f64,
    pub avg_io_write_rate_mbps: f64,
    
    // Network statistics
    pub total_network_sent_mb: f64,
    pub total_network_recv_mb: f64,
}

/// Performance issue detected
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceIssue {
    /// Issue type
    pub issue_type: PerformanceIssueType,
    /// Severity (1-10, 10 being critical)
    pub severity: u8,
    /// Description
    pub description: String,
    /// Location/context
    pub location: Option<String>,
    /// Timestamp when detected
    pub timestamp_ms: u64,
    /// Impact score
    pub impact: f32,
    /// Suggested fix
    pub suggested_fix: String,
}

/// Performance issue types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PerformanceIssueType {
    /// High CPU usage
    HighCpuUsage,
    /// High memory usage
    HighMemoryUsage,
    /// Memory leak detected
    MemoryLeak,
    /// High GPU usage
    HighGpuUsage,
    /// GPU memory exhaustion
    GpuMemoryExhaustion,
    /// Frame drops
    FrameDrops,
    /// Stuttering
    Stuttering,
    /// High latency
    HighLatency,
    /// I/O bottleneck
    IoBottleneck,
    /// Network bottleneck
    NetworkBottleneck,
    /// Encoding lag
    EncodingLag,
    /// Buffer underrun
    BufferUnderrun,
    /// Custom issue
    Custom(String),
}

/// Performance recommendation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    /// Recommendation ID
    pub id: String,
    /// Title
    pub title: String,
    /// Description
    pub description: String,
    /// Priority (1-5, 5 being highest)
    pub priority: u8,
    /// Category
    pub category: RecommendationCategory,
    /// Estimated improvement
    pub estimated_improvement: String,
    /// Implementation complexity
    pub complexity: Complexity,
    /// Related issues
    pub related_issues: Vec<String>,
}

/// Recommendation category
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendationCategory {
    Hardware,
    Settings,
    Software,
    Network,
    Encoding,
    Memory,
    Custom(String),
}

/// Implementation complexity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Complexity {
    Low,
    Medium,
    High,
    Expert,
}

/// System metrics collector
#[derive(Debug, Clone)]
pub struct SystemMetrics {
    /// Process ID
    pid: u32,
    /// CPU core count
    cpu_cores: usize,
    /// Total system memory
    total_memory: u64,
    /// Last CPU time
    last_cpu_time: Option<Duration>,
    /// Last sample time
    last_sample_time: Option<Instant>,
}

impl SystemMetrics {
    pub fn new() -> Self {
        Self {
            pid: std::process::id(),
            cpu_cores: num_cpus::get(),
            total_memory: sys_info::mem_info()
                .map(|m| m.total * 1024)
                .unwrap_or(16 * 1024 * 1024 * 1024), // Default 16GB
            last_cpu_time: None,
            last_sample_time: None,
        }
    }

    /// Collect current system metrics
    pub fn collect(&mut self) -> ProfileSample {
        let now = Instant::now();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        // CPU usage
        let cpu_usage = self.get_cpu_usage();
        
        // Memory usage
        let memory_bytes = self.get_memory_usage();
        
        // Thread count
        let thread_count = self.get_thread_count();

        // I/O stats (simplified)
        let (io_read, io_write) = self.get_io_stats();
        
        // Network stats (placeholder - would require platform-specific code)
        let (net_sent, net_recv) = (0, 0);

        self.last_sample_time = Some(now);

        ProfileSample {
            timestamp_ms: timestamp,
            cpu_usage,
            memory_bytes,
            gpu_usage: None, // Would require GPU-specific code
            gpu_memory_bytes: None,
            thread_count,
            io_read_bytes: io_read,
            io_write_bytes: io_write,
            network_sent_bytes: net_sent,
            network_recv_bytes: net_recv,
        }
    }

    fn get_cpu_usage(&self) -> f32 {
        // Simplified CPU usage calculation
        // In production, would use platform-specific APIs
        use std::fs;
        
        if let Ok(stat) = fs::read_to_string("/proc/self/stat") {
            let parts: Vec<&str> = stat.split_whitespace().collect();
            if parts.len() > 15 {
                let utime: f64 = parts[13].parse().unwrap_or(0.0);
                let stime: f64 = parts[14].parse().unwrap_or(0.0);
                let total_time = (utime + stime) / 100.0; // Convert from clock ticks
                
                // This is a simplified calculation
                // Real implementation would track time between samples
                return total_time as f32;
            }
        }
        
        0.0
    }

    fn get_memory_usage(&self) -> u64 {
        // Get process memory usage
        use std::fs;
        
        if let Ok(statm) = fs::read_to_string("/proc/self/statm") {
            let parts: Vec<&str> = statm.split_whitespace().collect();
            if parts.len() > 1 {
                let resident: u64 = parts[1].parse().unwrap_or(0);
                let page_size = 4096; // Typical Linux page size
                return resident * page_size;
            }
        }
        
        // Fallback for Windows (would need different implementation)
        0
    }

    fn get_thread_count(&self) -> u32 {
        // Count threads
        // Simplified - would use platform-specific APIs
        1
    }

    fn get_io_stats(&self) -> (u64, u64) {
        // Get I/O statistics
        // Simplified - would use platform-specific APIs
        (0, 0)
    }
}

impl Profiler {
    /// Create a new profiler instance
    pub fn new(config: ProfilerConfig) -> Self {
        Self {
            sessions: HashMap::new(),
            results: Vec::new(),
            config,
            system_metrics: SystemMetrics::new(),
        }
    }

    /// Start a new profiling session
    pub fn start_session(&mut self, name: &str, category: ProfilingCategory) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        
        let session = ProfilingSession {
            id: id.clone(),
            name: name.to_string(),
            start_time: Instant::now(),
            system_start_time: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            category,
            samples: Vec::new(),
            frame_times: Vec::new(),
            call_stacks: Vec::new(),
            status: SessionStatus::Running,
        };
        
        self.sessions.insert(id.clone(), session);
        id
    }

    /// Stop a profiling session
    pub fn stop_session(&mut self, session_id: &str) -> Option<ProfilingResult> {
        if let Some(session) = self.sessions.remove(session_id) {
            let result = self.create_result(session);
            
            // Keep only the most recent results
            if self.results.len() >= self.config.max_results {
                self.results.remove(0);
            }
            
            self.results.push(result.clone());
            
            // Auto-export if enabled
            if self.config.auto_export {
                if let Some(path) = &self.config.export_path {
                    let _ = self.export_result(&result, path);
                }
            }
            
            Some(result)
        } else {
            None
        }
    }

    /// Pause a profiling session
    pub fn pause_session(&mut self, session_id: &str) -> bool {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = SessionStatus::Paused;
            true
        } else {
            false
        }
    }

    /// Resume a paused session
    pub fn resume_session(&mut self, session_id: &str) -> bool {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = SessionStatus::Running;
            true
        } else {
            false
        }
    }

    /// Collect a sample for a session
    pub fn collect_sample(&mut self, session_id: &str) -> bool {
        if let Some(session) = self.sessions.get_mut(session_id) {
            if session.status != SessionStatus::Running {
                return false;
            }
            
            let sample = self.system_metrics.collect();
            session.samples.push(sample);
            true
        } else {
            false
        }
    }

    /// Record a frame time
    pub fn record_frame_time(
        &mut self,
        session_id: &str,
        duration_ms: f32,
        category: &str,
    ) -> bool {
        if let Some(session) = self.sessions.get_mut(session_id) {
            let frame_number = session.frame_times.len() as u64;
            let start_time = session.start_time.elapsed().as_millis() as u64 - duration_ms as u64;
            
            session.frame_times.push(FrameTime {
                frame_number,
                start_time_ms: start_time,
                duration_ms,
                category: category.to_string(),
                metrics: HashMap::new(),
            });
            true
        } else {
            false
        }
    }

    /// Get session status
    pub fn get_session_status(&self, session_id: &str) -> Option<&SessionStatus> {
        self.sessions.get(session_id).map(|s| &s.status)
    }

    /// Get all active sessions
    pub fn get_active_sessions(&self) -> Vec<&ProfilingSession> {
        self.sessions.values().collect()
    }

    /// Get all results
    pub fn get_results(&self) -> &[ProfilingResult] {
        &self.results
    }

    /// Get a specific result
    pub fn get_result(&self, result_id: &str) -> Option<&ProfilingResult> {
        self.results.iter().find(|r| &r.id == result_id)
    }

    /// Create a profiling result from a session
    fn create_result(&self, session: ProfilingSession) -> ProfilingResult {
        let duration_ms = session.start_time.elapsed().as_millis() as u64;
        let end_timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        
        let summary = self.calculate_summary(&session);
        let issues = self.detect_issues(&session);
        let recommendations = self.generate_recommendations(&issues);
        
        ProfilingResult {
            id: session.id.clone(),
            session_name: session.name,
            category: session.category,
            duration_ms,
            start_timestamp: session.system_start_time,
            end_timestamp,
            summary,
            samples: session.samples,
            frame_times: session.frame_times,
            issues,
            recommendations,
        }
    }

    /// Calculate summary statistics
    fn calculate_summary(&self, session: &ProfilingSession) -> ProfilingSummary {
        let samples = &session.samples;
        
        if samples.is_empty() {
            return ProfilingSummary {
                avg_cpu_usage: 0.0,
                max_cpu_usage: 0.0,
                min_cpu_usage: 0.0,
                cpu_usage_stddev: 0.0,
                avg_memory_mb: 0.0,
                max_memory_mb: 0.0,
                min_memory_mb: 0.0,
                memory_growth_mb: 0.0,
                avg_gpu_usage: None,
                max_gpu_usage: None,
                avg_gpu_memory_mb: None,
                max_gpu_memory_mb: None,
                total_frames: 0,
                avg_frame_time_ms: 0.0,
                min_frame_time_ms: 0.0,
                max_frame_time_ms: 0.0,
                frames_below_60fps: 0,
                frames_below_30fps: 0,
                total_io_read_mb: 0.0,
                total_io_write_mb: 0.0,
                avg_io_read_rate_mbps: 0.0,
                avg_io_write_rate_mbps: 0.0,
                total_network_sent_mb: 0.0,
                total_network_recv_mb: 0.0,
            };
        }
        
        // Calculate CPU statistics
        let cpu_values: Vec<f32> = samples.iter().map(|s| s.cpu_usage).collect();
        let avg_cpu = cpu_values.iter().sum::<f32>() / cpu_values.len() as f32;
        let max_cpu = cpu_values.iter().cloned().fold(0.0, f32::max);
        let min_cpu = cpu_values.iter().cloned().fold(f32::MAX, f32::min);
        
        // Calculate variance for stddev
        let variance = cpu_values.iter()
            .map(|v| (v - avg_cpu).powi(2))
            .sum::<f32>() / cpu_values.len() as f32;
        let cpu_stddev = variance.sqrt();
        
        // Calculate memory statistics
        let mem_values: Vec<f64> = samples.iter()
            .map(|s| s.memory_bytes as f64 / (1024.0 * 1024.0))
            .collect();
        let avg_mem = mem_values.iter().sum::<f64>() / mem_values.len() as f64;
        let max_mem = mem_values.iter().cloned().fold(0.0, f64::max);
        let min_mem = mem_values.iter().cloned().fold(f64::MAX, f64::min);
        let mem_growth = mem_values.last().unwrap_or(&0.0) - mem_values.first().unwrap_or(&0.0);
        
        // Calculate frame statistics
        let frame_times = &session.frame_times;
        let total_frames = frame_times.len() as u64;
        let frame_durations: Vec<f32> = frame_times.iter().map(|f| f.duration_ms).collect();
        let avg_frame = if frame_durations.is_empty() {
            0.0
        } else {
            frame_durations.iter().sum::<f32>() / frame_durations.len() as f32
        };
        let max_frame = frame_durations.iter().cloned().fold(0.0, f32::max);
        let min_frame = if frame_durations.is_empty() {
            0.0
        } else {
            frame_durations.iter().cloned().fold(f32::MAX, f32::min)
        };
        
        // Count frames below thresholds
        let frames_below_60fps = frame_durations.iter()
            .filter(|&&d| d > 16.67) // 60fps = 16.67ms per frame
            .count() as u64;
        let frames_below_30fps = frame_durations.iter()
            .filter(|&&d| d > 33.33) // 30fps = 33.33ms per frame
            .count() as u64;
        
        // Calculate I/O statistics
        let total_io_read = samples.last()
            .map(|s| s.io_read_bytes as f64 / (1024.0 * 1024.0))
            .unwrap_or(0.0);
        let total_io_write = samples.last()
            .map(|s| s.io_write_bytes as f64 / (1024.0 * 1024.0))
            .unwrap_or(0.0);
        
        ProfilingSummary {
            avg_cpu_usage: avg_cpu,
            max_cpu_usage: max_cpu,
            min_cpu_usage: min_cpu,
            cpu_usage_stddev: cpu_stddev,
            avg_memory_mb: avg_mem,
            max_memory_mb: max_mem,
            min_memory_mb: min_mem,
            memory_growth_mb: mem_growth,
            avg_gpu_usage: samples.iter().filter_map(|s| s.gpu_usage).sum::<f32>() 
                / samples.iter().filter(|s| s.gpu_usage.is_some()).count().max(1) as f32,
            max_gpu_usage: samples.iter().filter_map(|s| s.gpu_usage).fold(0.0, f32::max),
            avg_gpu_memory_mb: None,
            max_gpu_memory_mb: None,
            total_frames,
            avg_frame_time_ms: avg_frame,
            min_frame_time_ms: min_frame,
            max_frame_time_ms: max_frame,
            frames_below_60fps,
            frames_below_30fps,
            total_io_read_mb: total_io_read,
            total_io_write_mb: total_io_write,
            avg_io_read_rate_mbps: 0.0,
            avg_io_write_rate_mbps: 0.0,
            total_network_sent_mb: 0.0,
            total_network_recv_mb: 0.0,
        }
    }

    /// Detect performance issues
    fn detect_issues(&self, session: &ProfilingSession) -> Vec<PerformanceIssue> {
        let mut issues = Vec::new();
        let summary = self.calculate_summary(session);
        
        // Check for high CPU usage
        if summary.avg_cpu_usage > 80.0 {
            issues.push(PerformanceIssue {
                issue_type: PerformanceIssueType::HighCpuUsage,
                severity: if summary.avg_cpu_usage > 95.0 { 9 } else { 6 },
                description: format!("Average CPU usage is {:.1}% (high)", summary.avg_cpu_usage),
                location: None,
                timestamp_ms: 0,
                impact: summary.avg_cpu_usage / 100.0,
                suggested_fix: "Consider reducing encoding preset, lowering resolution, or disabling some features.".to_string(),
            });
        }
        
        // Check for high memory usage
        if summary.max_memory_mb > 2000.0 {
            issues.push(PerformanceIssue {
                issue_type: PerformanceIssueType::HighMemoryUsage,
                severity: if summary.max_memory_mb > 4000.0 { 8 } else { 5 },
                description: format!("Peak memory usage is {:.0} MB", summary.max_memory_mb),
                location: None,
                timestamp_ms: 0,
                impact: (summary.max_memory_mb / 8000.0).min(1.0) as f32,
                suggested_fix: "Close unused scenes/layers or enable memory optimization mode.".to_string(),
            });
        }
        
        // Check for memory leak
        if summary.memory_growth_mb > 500.0 {
            issues.push(PerformanceIssue {
                issue_type: PerformanceIssueType::MemoryLeak,
                severity: 8,
                description: format!("Memory grew by {:.0} MB during session", summary.memory_growth_mb),
                location: None,
                timestamp_ms: 0,
                impact: (summary.memory_growth_mb / 1000.0).min(1.0) as f32,
                suggested_fix: "Possible memory leak detected. Check for unclosed resources.".to_string(),
            });
        }
        
        // Check for frame drops
        if summary.frames_below_60fps > summary.total_frames / 10 {
            issues.push(PerformanceIssue {
                issue_type: PerformanceIssueType::FrameDrops,
                severity: 7,
                description: format!("{} frames dropped below 60fps ({}%)", 
                    summary.frames_below_60fps,
                    (summary.frames_below_60fps * 100 / summary.total_frames.max(1))),
                location: None,
                timestamp_ms: 0,
                impact: (summary.frames_below_60fps as f32 / summary.total_frames.max(1) as f32),
                suggested_fix: "Reduce capture resolution or encoding quality to improve frame rate.".to_string(),
            });
        }
        
        issues
    }

    /// Generate recommendations based on issues
    fn generate_recommendations(&self, issues: &[PerformanceIssue]) -> Vec<Recommendation> {
        let mut recommendations = Vec::new();
        
        for issue in issues {
            match issue.issue_type {
                PerformanceIssueType::HighCpuUsage => {
                    recommendations.push(Recommendation {
                        id: uuid::Uuid::new_v4().to_string(),
                        title: "Reduce CPU Load".to_string(),
                        description: issue.suggested_fix.clone(),
                        priority: if issue.severity > 7 { 5 } else { 3 },
                        category: RecommendationCategory::Hardware,
                        estimated_improvement: "20-40% CPU reduction".to_string(),
                        complexity: Complexity::Low,
                        related_issues: vec!["high_cpu_usage".to_string()],
                    });
                }
                PerformanceIssueType::HighMemoryUsage => {
                    recommendations.push(Recommendation {
                        id: uuid::Uuid::new_v4().to_string(),
                        title: "Optimize Memory Usage".to_string(),
                        description: issue.suggested_fix.clone(),
                        priority: if issue.severity > 7 { 5 } else { 3 },
                        category: RecommendationCategory::Memory,
                        estimated_improvement: "30-50% memory reduction".to_string(),
                        complexity: Complexity::Medium,
                        related_issues: vec!["high_memory_usage".to_string()],
                    });
                }
                PerformanceIssueType::FrameDrops => {
                    recommendations.push(Recommendation {
                        id: uuid::Uuid::new_v4().to_string(),
                        title: "Improve Frame Rate".to_string(),
                        description: issue.suggested_fix.clone(),
                        priority: 4,
                        category: RecommendationCategory::Encoding,
                        estimated_improvement: "Smoother stream quality".to_string(),
                        complexity: Complexity::Low,
                        related_issues: vec!["frame_drops".to_string()],
                    });
                }
                _ => {}
            }
        }
        
        recommendations
    }

    /// Export result to file
    pub fn export_result(&self, result: &ProfilingResult, path: &str) -> Result<(), std::io::Error> {
        let json = serde_json::to_string_pretty(result)?;
        std::fs::write(path, json)
    }

    /// Export all results
    pub fn export_all_results(&self, directory: &str) -> Result<(), std::io::Error> {
        std::fs::create_dir_all(directory)?;
        
        for result in &self.results {
            let filename = format!("{}/profile_{}.json", directory, result.id);
            self.export_result(result, &filename)?;
        }
        
        Ok(())
    }

    /// Clear all results
    pub fn clear_results(&mut self) {
        self.results.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profiler_creation() {
        let config = ProfilerConfig::default();
        let profiler = Profiler::new(config);
        assert!(profiler.get_active_sessions().is_empty());
    }

    #[test]
    fn test_start_stop_session() {
        let config = ProfilerConfig::default();
        let mut profiler = Profiler::new(config);
        
        let session_id = profiler.start_session("test", ProfilingCategory::General);
        assert!(!session_id.is_empty());
        assert_eq!(profiler.get_active_sessions().len(), 1);
        
        let result = profiler.stop_session(&session_id);
        assert!(result.is_some());
        assert!(profiler.get_active_sessions().is_empty());
    }

    #[test]
    fn test_pause_resume() {
        let config = ProfilerConfig::default();
        let mut profiler = Profiler::new(config);
        
        let session_id = profiler.start_session("test", ProfilingCategory::General);
        
        profiler.pause_session(&session_id);
        assert_eq!(profiler.get_session_status(&session_id), Some(&SessionStatus::Paused));
        
        profiler.resume_session(&session_id);
        assert_eq!(profiler.get_session_status(&session_id), Some(&SessionStatus::Running));
        
        profiler.stop_session(&session_id);
    }
}