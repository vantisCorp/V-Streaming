use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use thiserror::Error;

/// Capture engine for video and audio sources
pub struct CaptureEngine {
    is_capturing: Arc<Mutex<bool>>,
    active_sources: Arc<Mutex<HashMap<String, CaptureSource>>>,
    performance_stats: Arc<Mutex<CapturePerformanceStats>>,
}

impl CaptureEngine {
    pub fn new() -> Result<Self, CaptureError> {
        Ok(Self {
            is_capturing: Arc::new(Mutex::new(false)),
            active_sources: Arc::new(Mutex::new(HashMap::new())),
            performance_stats: Arc::new(Mutex::new(CapturePerformanceStats::default())),
        })
    }

    /// Get all available capture sources
    pub fn enumerate_sources(&self) -> Result<Vec<CaptureSourceInfo>, CaptureError> {
        let mut sources = Vec::new();

        // Enumerate windows
        sources.extend(self.enumerate_windows()?);

        // Enumerate screens
        sources.extend(self.enumerate_screens()?);

        // Enumerate capture cards
        sources.extend(self.enumerate_capture_cards()?);

        Ok(sources)
    }

    /// Enumerate available windows
    fn enumerate_windows(&self) -> Result<Vec<CaptureSourceInfo>, CaptureError> {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::UI::WindowsAndMessaging::{
                EnumWindows, GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible,
            };
            use windows::core::PWSTR;

            let mut windows = Vec::new();
            let mut counter = 0;

            unsafe {
                EnumWindows(
                    Some(enumerate_windows_callback),
                    &mut windows as *mut Vec<CaptureSourceInfo> as isize,
                )
                .ok()?;
            }

            return Ok(windows);
        }

        #[cfg(not(target_os = "windows"))]
        Ok(Vec::new())
    }

    /// Enumerate available screens
    fn enumerate_screens(&self) -> Result<Vec<CaptureSourceInfo>, CaptureError> {
        Ok(vec![
            CaptureSourceInfo {
                id: "screen_0".to_string(),
                name: "Primary Screen".to_string(),
                source_type: CaptureSourceType::Screen,
                width: 1920,
                height: 1080,
                refresh_rate: 60,
            },
        ])
    }

    /// Enumerate capture cards
    fn enumerate_capture_cards(&self) -> Result<Vec<CaptureSourceInfo>, CaptureError> {
        Ok(vec![
            CaptureSourceInfo {
                id: "uvc_0".to_string(),
                name: "USB Capture Card".to_string(),
                source_type: CaptureSourceType::Uvc,
                width: 1920,
                height: 1080,
                refresh_rate: 60,
            },
        ])
    }

    /// Start capturing from a source
    pub fn start_capture(&self, source: CaptureSource) -> Result<(), CaptureError> {
        let mut capturing = self.is_capturing.lock().unwrap();
        *capturing = true;

        let mut sources = self.active_sources.lock().unwrap();
        let source_id = source.get_id();
        sources.insert(source_id.clone(), source);

        tracing::info!("Started capture from source: {}", source_id);
        Ok(())
    }

    /// Stop capturing from a specific source
    pub fn stop_capture_source(&self, source_id: String) -> Result<(), CaptureError> {
        let mut sources = self.active_sources.lock().unwrap();
        sources.remove(&source_id);

        if sources.is_empty() {
            let mut capturing = self.is_capturing.lock().unwrap();
            *capturing = false;
        }

        tracing::info!("Stopped capture from source: {}", source_id);
        Ok(())
    }

    /// Stop all capturing
    pub fn stop_capture(&self) -> Result<(), CaptureError> {
        let mut capturing = self.is_capturing.lock().unwrap();
        *capturing = false;

        let mut sources = self.active_sources.lock().unwrap();
        sources.clear();

        tracing::info!("Stopped all capture");
        Ok(())
    }

    /// Check if currently capturing
    pub fn is_capturing(&self) -> bool {
        *self.is_capturing.lock().unwrap()
    }

    /// Get active capture sources
    pub fn get_active_sources(&self) -> Vec<CaptureSource> {
        self.active_sources
            .lock()
            .unwrap()
            .values()
            .cloned()
            .collect()
    }

    /// Get capture performance statistics
    pub fn get_performance_stats(&self) -> CapturePerformanceStats {
        self.performance_stats.lock().unwrap().clone()
    }

    /// Update performance statistics
    pub fn update_performance_stats(&self, stats: CapturePerformanceStats) {
        *self.performance_stats.lock().unwrap() = stats;
    }
}

/// Windows enumeration callback (Windows only)
#[cfg(target_os = "windows")]
unsafe extern "system" fn enumerate_windows_callback(
    hwnd: windows::Win32::Foundation::HWND,
    lparam: isize,
) -> windows::Win32::Foundation::BOOL {
    use windows::Win32::UI::WindowsAndMessaging::{GetWindowTextW, IsWindowVisible};
    use windows::core::PWSTR;

    if !IsWindowVisible(hwnd).as_bool() {
        return windows::Win32::Foundation::BOOL::from(true);
    }

    let mut buffer = [0u16; 256];
    let length = GetWindowTextW(hwnd, PWSTR(buffer.as_mut_ptr()), 256);

    if length > 0 {
        let name = String::from_utf16_lossy(&buffer[..length as usize]);
        let windows = &mut *(lparam as *mut Vec<CaptureSourceInfo>);

        windows.push(CaptureSourceInfo {
            id: format!("window_{}", hwnd.0),
            name,
            source_type: CaptureSourceType::Window,
            width: 0,
            height: 0,
            refresh_rate: 0,
        });
    }

    windows::Win32::Foundation::BOOL::from(true)
}

/// Available capture sources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaptureSource {
    /// DirectX game capture
    DirectX { window_name: String, window_handle: u64 },
    /// Vulkan game capture
    Vulkan { window_name: String, window_handle: u64 },
    /// Screen capture
    Screen { monitor_index: usize },
    /// Window capture
    Window { window_handle: u64, window_name: String },
    /// USB capture card
    Uvc { device_id: String, device_name: String },
    /// Console capture (PS Remote Play)
    PsRemotePlay { window_handle: u64 },
    /// Console capture (Xbox App)
    XboxApp { window_handle: u64 },
}

impl CaptureSource {
    pub fn get_id(&self) -> String {
        match self {
            CaptureSource::DirectX { window_name, .. } => format!("dx_{}", window_name),
            CaptureSource::Vulkan { window_name, .. } => format!("vk_{}", window_name),
            CaptureSource::Screen { monitor_index } => format!("screen_{}", monitor_index),
            CaptureSource::Window { window_handle, .. } => format!("window_{}", window_handle),
            CaptureSource::Uvc { device_id, .. } => device_id.clone(),
            CaptureSource::PsRemotePlay { .. } => "ps_remote_play".to_string(),
            CaptureSource::XboxApp { .. } => "xbox_app".to_string(),
        }
    }
}

/// Capture source information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureSourceInfo {
    pub id: String,
    pub name: String,
    pub source_type: CaptureSourceType,
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
}

/// Capture source type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaptureSourceType {
    DirectX,
    Vulkan,
    Screen,
    Window,
    Uvc,
    PsRemotePlay,
    XboxApp,
}

/// Audio capture configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioCaptureConfig {
    pub device_id: String,
    pub device_name: String,
    pub sample_rate: u32,
    pub channels: u16,
    pub bit_depth: u16,
}

/// Capture performance statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CapturePerformanceStats {
    pub fps: f32,
    pub frame_time_ms: f32,
    pub dropped_frames: u32,
    pub total_frames: u64,
    pub capture_latency_ms: f32,
    pub cpu_usage_percent: f32,
    pub gpu_usage_percent: f32,
}

/// Capture error types
#[derive(Error, Debug)]
pub enum CaptureError {
    #[error("Source not found: {0}")]
    SourceNotFound(String),
    #[error("Capture already active")]
    AlreadyActive,
    #[error("Capture failed: {0}")]
    CaptureFailed(String),
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
    #[error("Hardware not supported: {0}")]
    HardwareNotSupported(String),
    #[error("Permission denied")]
    PermissionDenied,
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Capture configuration presets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturePreset {
    pub name: String,
    pub description: String,
    pub resolution: (u32, u32),
    pub fps: u32,
    pub color_format: ColorFormat,
    pub use_hdr: bool,
}

/// Color format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ColorFormat {
    Rgba8,
    Bgra8,
    Rgba16Float,
    Rgba32Float,
}

/// Default capture presets
pub fn get_default_presets() -> Vec<CapturePreset> {
    vec![
        CapturePreset {
            name: "1080p 60fps".to_string(),
            description: "Standard HD quality".to_string(),
            resolution: (1920, 1080),
            fps: 60,
            color_format: ColorFormat::Rgba8,
            use_hdr: false,
        },
        CapturePreset {
            name: "1080p 144fps".to_string(),
            description: "High refresh rate gaming".to_string(),
            resolution: (1920, 1080),
            fps: 144,
            color_format: ColorFormat::Rgba8,
            use_hdr: false,
        },
        CapturePreset {
            name: "4K 60fps".to_string(),
            description: "Ultra HD quality".to_string(),
            resolution: (3840, 2160),
            fps: 60,
            color_format: ColorFormat::Rgba8,
            use_hdr: true,
        },
        CapturePreset {
            name: "1440p 120fps".to_string(),
            description: "Balanced quality and performance".to_string(),
            resolution: (2560, 1440),
            fps: 120,
            color_format: ColorFormat::Rgba8,
            use_hdr: false,
        },
    ]
}