//! Centralized logging for V-Streaming
//! 
//! This module provides a unified logging system with structured logging,
//! log rotation, and integration with telemetry.

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tracing::{debug, error, info, trace, warn};
use tracing_appender::{non_blocking, rolling};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Log levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

impl LogLevel {
    /// Convert from string
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "trace" => Self::Trace,
            "debug" => Self::Debug,
            "info" => Self::Info,
            "warn" | "warning" => Self::Warn,
            "error" => Self::Error,
            _ => Self::Info,
        }
    }

    /// Convert to tracing::Level
    pub fn to_tracing_level(&self) -> tracing::Level {
        match self {
            Self::Trace => tracing::Level::TRACE,
            Self::Debug => tracing::Level::DEBUG,
            Self::Info => tracing::Level::INFO,
            Self::Warn => tracing::Level::WARN,
            Self::Error => tracing::Level::ERROR,
        }
    }
}

impl fmt::Display for LogLevel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Trace => write!(f, "TRACE"),
            Self::Debug => write!(f, "DEBUG"),
            Self::Info => write!(f, "INFO"),
            Self::Warn => write!(f, "WARN"),
            Self::Error => write!(f, "ERROR"),
        }
    }
}

/// Log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    /// Timestamp
    pub timestamp: DateTime<Local>,
    /// Log level
    pub level: LogLevel,
    /// Module or component
    pub target: String,
    /// Log message
    pub message: String,
    /// Additional context (optional)
    pub context: Option<serde_json::Value>,
}

/// Logger configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggerConfig {
    /// Log level
    pub level: LogLevel,
    /// Enable console output
    pub console: bool,
    /// Enable file logging
    pub file_logging: bool,
    /// Log directory
    pub log_directory: PathBuf,
    /// Maximum log file size in MB
    pub max_file_size_mb: u32,
    /// Maximum number of log files to keep
    pub max_files: u32,
    /// Enable JSON format
    pub json_format: bool,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("v-streaming")
            .join("logs");

        Self {
            level: LogLevel::Info,
            console: true,
            file_logging: true,
            log_directory: config_dir,
            max_file_size_mb: 10,
            max_files: 10,
            json_format: false,
        }
    }
}

/// Application logger
pub struct Logger {
    config: LoggerConfig,
    entries: Arc<Mutex<Vec<LogEntry>>>,
    max_entries: usize,
}

impl Logger {
    /// Create a new logger
    pub fn new(config: LoggerConfig) -> Self {
        Self {
            config,
            entries: Arc::new(Mutex::new(Vec::new())),
            max_entries: 10000,
        }
    }

    /// Initialize the global tracing subscriber
    pub fn init(config: &LoggerConfig) -> Result<(), LoggerError> {
        let env_filter = EnvFilter::builder()
            .with_default_directive(config.level.to_tracing_level().into())
            .from_env_lossy();

        let subscriber = tracing_subscriber::registry().with(env_filter);

        // Console layer
        if config.console {
            let console_layer = tracing_subscriber::fmt::layer()
                .with_ansi(true)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true);
            subscriber.with(console_layer).init();
        } else {
            subscriber.init();
        }

        // File layer
        if config.file_logging {
            let log_dir = &config.log_directory;
            std::fs::create_dir_all(log_dir).map_err(|e| {
                LoggerError::InitFailed(format!("Failed to create log directory: {}", e))
            })?;

            let file_appender = rolling::daily(log_dir, "v-streaming.log");
            let (non_blocking, _guard) = non_blocking(file_appender);

            let file_layer = tracing_subscriber::fmt::layer()
                .with_writer(non_blocking)
                .with_ansi(false)
                .with_target(true)
                .with_file(true)
                .with_line_number(true);

            tracing_subscriber::registry().with(file_layer).init();
        }

        Ok(())
    }

    /// Log a message
    pub fn log(&self, entry: LogEntry) {
        let mut entries = self.entries.lock().unwrap();
        entries.push(entry.clone());

        // Keep only the most recent entries
        if entries.len() > self.max_entries {
            entries.remove(0);
        }
    }

    /// Get all log entries
    pub fn get_entries(&self) -> Vec<LogEntry> {
        self.entries.lock().unwrap().clone()
    }

    /// Get log entries filtered by level
    pub fn get_entries_by_level(&self, level: LogLevel) -> Vec<LogEntry> {
        self.entries
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.level >= level)
            .cloned()
            .collect()
    }

    /// Get log entries filtered by target
    pub fn get_entries_by_target(&self, target: &str) -> Vec<LogEntry> {
        self.entries
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.target == target)
            .cloned()
            .collect()
    }

    /// Get log entries filtered by time range
    pub fn get_entries_by_time_range(
        &self,
        start: DateTime<Local>,
        end: DateTime<Local>,
    ) -> Vec<LogEntry> {
        self.entries
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.timestamp >= start && e.timestamp <= end)
            .cloned()
            .collect()
    }

    /// Clear all log entries
    pub fn clear(&self) {
        self.entries.lock().unwrap().clear();
    }

    /// Export log entries to a file
    pub fn export_to_file(&self, path: &PathBuf) -> Result<(), LoggerError> {
        let entries = self.get_entries();
        let content = entries
            .iter()
            .map(|e| format!("[{}] [{}] {}: {}", e.timestamp, e.level, e.target, e.message))
            .collect::<Vec<_>>()
            .join("\n");

        std::fs::write(path, content).map_err(|e| {
            LoggerError::ExportFailed(format!("Failed to export logs: {}", e))
        })?;

        Ok(())
    }

    /// Get log statistics
    pub fn get_stats(&self) -> LogStats {
        let entries = self.entries.lock().unwrap();

        let stats = LogStats {
            total_entries: entries.len(),
            trace_count: entries.iter().filter(|e| e.level == LogLevel::Trace).count(),
            debug_count: entries.iter().filter(|e| e.level == LogLevel::Debug).count(),
            info_count: entries.iter().filter(|e| e.level == LogLevel::Info).count(),
            warn_count: entries.iter().filter(|e| e.level == LogLevel::Warn).count(),
            error_count: entries.iter().filter(|e| e.level == LogLevel::Error).count(),
        };

        stats
    }
}

/// Log statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total_entries: usize,
    pub trace_count: usize,
    pub debug_count: usize,
    pub info_count: usize,
    pub warn_count: usize,
    pub error_count: usize,
}

/// Logger errors
#[derive(Debug, thiserror::Error)]
pub enum LoggerError {
    #[error("Initialization failed: {0}")]
    InitFailed(String),

    #[error("Export failed: {0}")]
    ExportFailed(String),

    #[error("File error: {0}")]
    FileError(String),

    #[error("Serialization error: {0}")]
    SerializationError(String),
}

/// Structured logging macros
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        info!($($arg)*)
    };
}

#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        debug!($($arg)*)
    };
}

#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        warn!($($arg)*)
    };
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        error!($($arg)*)
    };
}

#[macro_export]
macro_rules! log_trace {
    ($($arg:tt)*) => {
        trace!($($arg)*)
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_level_conversion() {
        assert_eq!(LogLevel::from_str("info"), LogLevel::Info);
        assert_eq!(LogLevel::from_str("trace"), LogLevel::Trace);
        assert_eq!(LogLevel::from_str("debug"), LogLevel::Debug);
        assert_eq!(LogLevel::from_str("warn"), LogLevel::Warn);
        assert_eq!(LogLevel::from_str("error"), LogLevel::Error);
        assert_eq!(LogLevel::from_str("invalid"), LogLevel::Info);
    }

    #[test]
    fn test_logger_creation() {
        let config = LoggerConfig::default();
        let logger = Logger::new(config);
        assert_eq!(logger.get_entries().len(), 0);
    }

    #[test]
    fn test_log_entry() {
        let entry = LogEntry {
            timestamp: Local::now(),
            level: LogLevel::Info,
            target: "test".to_string(),
            message: "Test message".to_string(),
            context: None,
        };

        let config = LoggerConfig::default();
        let logger = Logger::new(config);
        logger.log(entry);
        
        let entries = logger.get_entries();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].message, "Test message");
    }

    #[test]
    fn test_log_filtering() {
        let config = LoggerConfig::default();
        let logger = Logger::new(config);

        logger.log(LogEntry {
            timestamp: Local::now(),
            level: LogLevel::Trace,
            target: "test".to_string(),
            message: "Trace".to_string(),
            context: None,
        });

        logger.log(LogEntry {
            timestamp: Local::now(),
            level: LogLevel::Error,
            target: "test".to_string(),
            message: "Error".to_string(),
            context: None,
        });

        let entries = logger.get_entries_by_level(LogLevel::Warn);
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].message, "Error");
    }

    #[test]
    fn test_log_stats() {
        let config = LoggerConfig::default();
        let logger = Logger::new(config);

        logger.log(LogEntry {
            timestamp: Local::now(),
            level: LogLevel::Info,
            target: "test".to_string(),
            message: "Test".to_string(),
            context: None,
        });

        let stats = logger.get_stats();
        assert_eq!(stats.total_entries, 1);
        assert_eq!(stats.info_count, 1);
        assert_eq!(stats.error_count, 0);
    }
}