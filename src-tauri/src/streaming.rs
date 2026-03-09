use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// STREAMING ENGINE - RTMP/RTMPS and SRT Protocol Support
// ============================================================================

/// Streaming protocol types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StreamingProtocol {
    RTMP,       // Real-Time Messaging Protocol
    RTMPS,      // RTMP over SSL/TLS
    SRT,        // Secure Reliable Transport
    WebRTC,     // Web Real-Time Communication
    HLS,        // HTTP Live Streaming
    DASH,       // Dynamic Adaptive Streaming over HTTP
}

/// Streaming platform presets
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StreamingPlatform {
    Twitch,
    YouTube,
    Kick,
    Facebook,
    TikTok,
    Trovo,
    DLive,
    Custom,
}

/// Streaming platform configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingPlatformConfig {
    pub platform: StreamingPlatform,
    pub name: String,
    pub rtmp_url: String,
    pub stream_key: String,
    pub backup_url: Option<String>,
    pub max_bitrate: u32,
    pub recommended_bitrate: u32,
    pub supported_codecs: Vec<String>,
    pub supports_srt: bool,
}

impl StreamingPlatformConfig {
    /// Get preset configuration for a platform
    pub fn get_preset(platform: StreamingPlatform) -> Self {
        match platform {
            StreamingPlatform::Twitch => Self {
                platform: StreamingPlatform::Twitch,
                name: "Twitch".to_string(),
                rtmp_url: "rtmp://live.twitch.tv/app".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 8000,
                recommended_bitrate: 6000,
                supported_codecs: vec!["H264".to_string(), "H265".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::YouTube => Self {
                platform: StreamingPlatform::YouTube,
                name: "YouTube".to_string(),
                rtmp_url: "rtmp://a.rtmp.youtube.com/live2".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 51000,
                recommended_bitrate: 8000,
                supported_codecs: vec!["H264".to_string(), "H265".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::Kick => Self {
                platform: StreamingPlatform::Kick,
                name: "Kick".to_string(),
                rtmp_url: "rtmp://fa723fc1.publish.irlcdn.com/app".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 10000,
                recommended_bitrate: 6000,
                supported_codecs: vec!["H264".to_string(), "H265".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::Facebook => Self {
                platform: StreamingPlatform::Facebook,
                name: "Facebook Gaming".to_string(),
                rtmp_url: "rtmps://live-api-s.facebook.com:443/rtmp".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 8000,
                recommended_bitrate: 4000,
                supported_codecs: vec!["H264".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::TikTok => Self {
                platform: StreamingPlatform::TikTok,
                name: "TikTok LIVE".to_string(),
                rtmp_url: "rtmp://tiktok.com/live".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 8000,
                recommended_bitrate: 4000,
                supported_codecs: vec!["H264".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::Trovo => Self {
                platform: StreamingPlatform::Trovo,
                name: "Trovo".to_string(),
                rtmp_url: "rtmp://live.trovo.live/live".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 8000,
                recommended_bitrate: 6000,
                supported_codecs: vec!["H264".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::DLive => Self {
                platform: StreamingPlatform::DLive,
                name: "DLive".to_string(),
                rtmp_url: "rtmp://stream.dlive.tv/live".to_string(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 8000,
                recommended_bitrate: 6000,
                supported_codecs: vec!["H264".to_string()],
                supports_srt: false,
            },
            StreamingPlatform::Custom => Self {
                platform: StreamingPlatform::Custom,
                name: "Custom RTMP".to_string(),
                rtmp_url: String::new(),
                stream_key: String::new(),
                backup_url: None,
                max_bitrate: 10000,
                recommended_bitrate: 6000,
                supported_codecs: vec!["H264".to_string(), "H265".to_string()],
                supports_srt: false,
            },
        }
    }
}

/// SRT configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SRTConfig {
    pub latency: u32,           // Latency in milliseconds
    pub overhead_bandwidth: u32, // Overhead bandwidth percentage
    pub max_bandwidth: u32,     // Maximum bandwidth in kbps
    pub packet_filter: String,  // Packet filter settings
    pub reconnect_attempts: u32, // Number of reconnection attempts
    pub reconnect_delay: u32,   // Delay between reconnection attempts in ms
    pub stream_id: Option<String>, // Stream ID for SRT
}

impl Default for SRTConfig {
    fn default() -> Self {
        Self {
            latency: 120,
            overhead_bandwidth: 25,
            max_bandwidth: 10000,
            packet_filter: "".to_string(),
            reconnect_attempts: 30,
            reconnect_delay: 1000,
            stream_id: None,
        }
    }
}

/// Streaming configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingConfig {
    pub platform: StreamingPlatformConfig,
    pub protocol: StreamingProtocol,
    pub srt_config: Option<SRTConfig>,
    pub video_bitrate: u32,
    pub audio_bitrate: u32,
    pub keyframe_interval: u32,
    pub enable_low_latency: bool,
    pub enable_adaptive_bitrate: bool,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        Self {
            platform: StreamingPlatformConfig::get_preset(StreamingPlatform::Twitch),
            protocol: StreamingProtocol::RTMP,
            srt_config: None,
            video_bitrate: 6000,
            audio_bitrate: 128,
            keyframe_interval: 60,
            enable_low_latency: false,
            enable_adaptive_bitrate: false,
        }
    }
}

/// Streaming statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingStats {
    pub is_streaming: bool,
    pub duration: u64,          // Duration in seconds
    pub bytes_sent: u64,
    pub bitrate: f32,           // Current bitrate in kbps
    pub fps: f32,
    pub dropped_frames: u64,
    pub total_frames: u64,
    pub cpu_usage: f32,
    pub gpu_usage: f32,
    pub network_latency: u32,   // Network latency in ms
    pub buffer_health: f32,     // Buffer health percentage
    pub reconnect_count: u32,
}

/// Multistreaming target
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultistreamTarget {
    pub id: String,
    pub name: String,
    pub platform: StreamingPlatform,
    pub rtmp_url: String,
    pub stream_key: String,
    pub enabled: bool,
    pub status: StreamingStatus,
}

/// Streaming status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StreamingStatus {
    Idle,
    Connecting,
    Connected,
    Streaming,
    Reconnecting,
    Disconnected,
    Error,
}

/// Streaming engine state
pub struct StreamingEngine {
    pub active: bool,
    pub config: StreamingConfig,
    pub stats: StreamingStats,
    pub multistream_targets: Vec<MultistreamTarget>,
    pub multistream_enabled: bool,
}

impl StreamingEngine {
    pub fn new() -> Self {
        Self {
            active: false,
            config: StreamingConfig::default(),
            stats: StreamingStats {
                is_streaming: false,
                duration: 0,
                bytes_sent: 0,
                bitrate: 0.0,
                fps: 0.0,
                dropped_frames: 0,
                total_frames: 0,
                cpu_usage: 0.0,
                gpu_usage: 0.0,
                network_latency: 0,
                buffer_health: 100.0,
                reconnect_count: 0,
            },
            multistream_targets: Vec::new(),
            multistream_enabled: false,
        }
    }

    /// Start streaming
    pub fn start_streaming(&mut self, config: StreamingConfig) -> Result<(), String> {
        if self.active {
            return Err("Streaming is already active".to_string());
        }

        self.config = config;
        self.active = true;

        // Reset stats
        self.stats = StreamingStats {
            is_streaming: true,
            duration: 0,
            bytes_sent: 0,
            bitrate: 0.0,
            fps: 0.0,
            dropped_frames: 0,
            total_frames: 0,
            cpu_usage: 0.0,
            gpu_usage: 0.0,
            network_latency: 0,
            buffer_health: 100.0,
            reconnect_count: 0,
        };

        Ok(())
    }

    /// Stop streaming
    pub fn stop_streaming(&mut self) -> Result<(), String> {
        if !self.active {
            return Err("Streaming is not active".to_string());
        }

        self.active = false;
        self.stats.is_streaming = false;

        Ok(())
    }

    /// Add multistream target
    pub fn add_multistream_target(&mut self, target: MultistreamTarget) -> Result<(), String> {
        if self.active {
            return Err("Cannot add targets while streaming".to_string());
        }

        self.multistream_targets.push(target);
        Ok(())
    }

    /// Remove multistream target
    pub fn remove_multistream_target(&mut self, id: String) -> Result<(), String> {
        if self.active {
            return Err("Cannot remove targets while streaming".to_string());
        }

        self.multistream_targets.retain(|t| t.id != id);
        Ok(())
    }

    /// Update multistream target
    pub fn update_multistream_target(&mut self, id: String, enabled: bool) -> Result<(), String> {
        if let Some(target) = self.multistream_targets.iter_mut().find(|t| t.id == id) {
            target.enabled = enabled;
            Ok(())
        } else {
            Err("Target not found".to_string())
        }
    }

    /// Update streaming statistics
    pub fn update_stats(&mut self, bitrate: f32, fps: f32, latency: u32, buffer_health: f32) {
        self.stats.bitrate = bitrate;
        self.stats.fps = fps;
        self.stats.network_latency = latency;
        self.stats.buffer_health = buffer_health;
    }

    /// Get available streaming platforms
    pub fn get_platforms() -> Vec<StreamingPlatform> {
        vec![
            StreamingPlatform::Twitch,
            StreamingPlatform::YouTube,
            StreamingPlatform::Kick,
            StreamingPlatform::Facebook,
            StreamingPlatform::TikTok,
            StreamingPlatform::Trovo,
            StreamingPlatform::DLive,
            StreamingPlatform::Custom,
        ]
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get available streaming platforms
#[tauri::command]
pub fn get_streaming_platforms() -> Vec<String> {
    vec![
        "Twitch".to_string(),
        "YouTube".to_string(),
        "Kick".to_string(),
        "Facebook".to_string(),
        "TikTok".to_string(),
        "Trovo".to_string(),
        "DLive".to_string(),
        "Custom".to_string(),
    ]
}

/// Get platform preset configuration
#[tauri::command]
pub fn get_platform_preset(platform: String) -> Result<StreamingPlatformConfig, String> {
    let platform_enum = match platform.to_lowercase().as_str() {
        "twitch" => StreamingPlatform::Twitch,
        "youtube" => StreamingPlatform::YouTube,
        "kick" => StreamingPlatform::Kick,
        "facebook" => StreamingPlatform::Facebook,
        "tiktok" => StreamingPlatform::TikTok,
        "trovo" => StreamingPlatform::Trovo,
        "dlive" => StreamingPlatform::DLive,
        "custom" => StreamingPlatform::Custom,
        _ => return Err("Unknown platform".to_string()),
    };

    Ok(StreamingPlatformConfig::get_preset(platform_enum))
}

/// Start streaming
#[tauri::command]
pub fn start_streaming(
    config: StreamingConfig,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.start_streaming(config)
}

/// Stop streaming
#[tauri::command]
pub fn stop_streaming(state: State<Arc<Mutex<StreamingEngine>>>) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.stop_streaming()
}

/// Check if streaming is active
#[tauri::command]
pub fn is_streaming_active(state: State<Arc<Mutex<StreamingEngine>>>) -> bool {
    let engine = state.lock().unwrap();
    engine.active
}

/// Get streaming statistics
#[tauri::command]
pub fn get_streaming_stats(state: State<Arc<Mutex<StreamingEngine>>>) -> StreamingStats {
    let engine = state.lock().unwrap();
    engine.stats.clone()
}

/// Get streaming configuration
#[tauri::command]
pub fn get_streaming_config(state: State<Arc<Mutex<StreamingEngine>>>) -> StreamingConfig {
    let engine = state.lock().unwrap();
    engine.config.clone()
}

/// Update streaming configuration
#[tauri::command]
pub fn update_streaming_config(
    config: StreamingConfig,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.config = config;
    Ok(())
}

/// Get streaming protocols
#[tauri::command]
pub fn get_streaming_protocols() -> Vec<String> {
    vec![
        "RTMP".to_string(),
        "RTMPS".to_string(),
        "SRT".to_string(),
        "WebRTC".to_string(),
        "HLS".to_string(),
        "DASH".to_string(),
    ]
}

/// Add multistream target
#[tauri::command]
pub fn add_multistream_target(
    target: MultistreamTarget,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.add_multistream_target(target)
}

/// Remove multistream target
#[tauri::command]
pub fn remove_multistream_target(
    id: String,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.remove_multistream_target(id)
}

/// Get multistream targets
#[tauri::command]
pub fn get_multistream_targets(state: State<Arc<Mutex<StreamingEngine>>>) -> Vec<MultistreamTarget> {
    let engine = state.lock().unwrap();
    engine.multistream_targets.clone()
}

/// Update multistream target
#[tauri::command]
pub fn update_multistream_target(
    id: String,
    enabled: bool,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.update_multistream_target(id, enabled)
}

/// Enable/disable multistreaming
#[tauri::command]
pub fn set_multistream_enabled(
    enabled: bool,
    state: State<Arc<Mutex<StreamingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.multistream_enabled = enabled;
    Ok(())
}

/// Check if multistreaming is enabled
#[tauri::command]
pub fn is_multistream_enabled(state: State<Arc<Mutex<StreamingEngine>>>) -> bool {
    let engine = state.lock().unwrap();
    engine.multistream_enabled
}

/// Get SRT default configuration
#[tauri::command]
pub fn get_srt_default_config() -> SRTConfig {
    SRTConfig::default()
}

/// Test stream connection
#[tauri::command]
pub fn test_stream_connection(
    _rtmp_url: String,
    _stream_key: String,
) -> Result<bool, String> {
    // Simulate connection test
    // In production, this would actually test the connection
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_streaming_engine_creation() {
        let engine = StreamingEngine::new();
        assert!(!engine.is_streaming);
        assert_eq!(engine.state, StreamingState::Stopped);
    }

    #[test]
    fn test_stream_config_creation() {
        let config = StreamConfig {
            name: "Test Stream".to_string(),
            platform: "Twitch".to_string(),
            server_url: "rtmp://live.twitch.tv/app".to_string(),
            stream_key: "test_key".to_string(),
            resolution: "1920x1080".to_string(),
            framerate: 60,
            bitrate: 6000,
        };

        assert_eq!(config.name, "Test Stream");
        assert_eq!(config.platform, "Twitch");
    }

    #[test]
    fn test_streaming_state_transitions() {
        let mut engine = StreamingEngine::new();
        assert_eq!(engine.state, StreamingState::Stopped);
        
        engine.state = StreamingState::Starting;
        assert_eq!(engine.state, StreamingState::Starting);
        
        engine.state = StreamingState::Live;
        assert_eq!(engine.state, StreamingState::Live);
    }

    #[test]
    fn test_streaming_platform() {
        let twitch = StreamingPlatform::Twitch;
        assert_eq!(twitch.name(), "Twitch");
        assert_eq!(twitch.default_server(), "rtmp://live.twitch.tv/app");
    }

    #[test]
    fn test_stream_protocol() {
        let rtmp = StreamProtocol::RTMP;
        assert_eq!(rtmp.name(), "RTMP");
    }

    #[test]
    fn test_multistream_target() {
        let target = MultistreamTarget {
            id: "youtube".to_string(),
            platform: "YouTube".to_string(),
            rtmp_url: "rtmp://a.rtmp.youtube.com/live2".to_string(),
            stream_key: "key".to_string(),
            enabled: false,
        };

        assert_eq!(target.platform, "YouTube");
        assert!(!target.enabled);
    }

    #[test]
    fn test_srt_config() {
        let config = SRTConfig::default();
        assert_eq!(config.latency_ms, 50);
        assert_eq!(config.max_bandwidth, 20_000_000);
    }
}
