//! Application configuration management
//! 
//! This module provides centralized configuration management for V-Streaming,
//! including user preferences, default settings, and configuration persistence.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Main application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// General application settings
    pub general: GeneralConfig,
    /// Capture settings
    pub capture: CaptureConfig,
    /// Audio settings
    pub audio: AudioConfig,
    /// Encoding settings
    pub encoding: EncodingConfig,
    /// Streaming settings
    pub streaming: StreamingConfig,
    /// UI settings
    pub ui: UIConfig,
    /// AI features settings
    pub ai: AIConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    /// Application name
    pub app_name: String,
    /// Application language
    pub language: String,
    /// Auto-save interval in seconds (0 = disabled)
    pub auto_save_interval: u32,
    /// Check for updates on startup
    pub check_updates: bool,
    /// Send anonymous usage statistics
    pub send_statistics: bool,
    /// Enable crash reporting
    pub crash_reporting: bool,
    /// Log level (trace, debug, info, warn, error)
    pub log_level: String,
    /// Maximum log files to keep
    pub max_log_files: u32,
}

impl Default for GeneralConfig {
    fn default() -> Self {
        Self {
            app_name: "V-Streaming".to_string(),
            language: "en".to_string(),
            auto_save_interval: 60,
            check_updates: true,
            send_statistics: true,
            crash_reporting: true,
            log_level: "info".to_string(),
            max_log_files: 10,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    /// Default capture resolution
    pub default_resolution: Resolution,
    /// Default capture framerate
    pub default_framerate: u32,
    /// Capture method preference
    pub capture_method: CaptureMethod,
    /// Enable HDR capture
    pub hdr_enabled: bool,
    /// HDR to SDR tonemapping method
    pub tonemapping_method: TonemappingMethod,
    /// Show capture cursor
    pub show_cursor: bool,
    /// Capture delay in milliseconds
    pub capture_delay: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

impl Default for Resolution {
    fn default() -> Self {
        Self { width: 1920, height: 1080 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CaptureMethod {
    Automatic,
    DirectX,
    Vulkan,
    DXGI,
    GDI,
}

impl Default for CaptureMethod {
    fn default() -> Self {
        Self::Automatic
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TonemappingMethod {
    Reinhard,
    ACES,
    Filmic,
}

impl Default for TonemappingMethod {
    fn default() -> Self {
        Self::ACES
    }
}

impl Default for CaptureConfig {
    fn default() -> Self {
        Self {
            default_resolution: Resolution::default(),
            default_framerate: 60,
            capture_method: CaptureMethod::Automatic,
            hdr_enabled: false,
            tonemapping_method: TonemappingMethod::ACES,
            show_cursor: true,
            capture_delay: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioConfig {
    /// Default sample rate
    pub sample_rate: u32,
    /// Buffer size in samples
    pub buffer_size: u32,
    /// Bit depth
    pub bit_depth: u32,
    /// Enable audio monitoring
    pub monitoring_enabled: bool,
    /// Monitoring device ID
    pub monitoring_device: Option<String>,
    /// Default input device
    pub default_input_device: Option<String>,
    /// Default output device
    pub default_output_device: Option<String>,
    /// Noise suppression level
    pub noise_suppression: f32,
    /// Echo cancellation
    pub echo_cancellation: bool,
    /// Auto-gain control
    pub auto_gain: bool,
}

impl Default for AudioConfig {
    fn default() -> Self {
        Self {
            sample_rate: 48000,
            buffer_size: 256,
            bit_depth: 24,
            monitoring_enabled: true,
            monitoring_device: None,
            default_input_device: None,
            default_output_device: None,
            noise_suppression: 0.0,
            echo_cancellation: false,
            auto_gain: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncodingConfig {
    /// Preferred encoder
    pub encoder: EncoderType,
    /// Video codec
    pub video_codec: VideoCodec,
    /// Audio codec
    pub audio_codec: AudioCodec,
    /// Encoding preset
    pub preset: EncodingPreset,
    /// Rate control method
    pub rate_control: RateControl,
    /// Target bitrate in kbps
    pub bitrate: u32,
    /// Keyframe interval in seconds
    pub keyframe_interval: f32,
    /// Use two-pass encoding
    pub two_pass: bool,
    /// Multi-threaded encoding
    pub multi_threaded: bool,
    /// GPU index for encoding (-1 = auto)
    pub gpu_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EncoderType {
    Auto,
    NVENC,
    AMF,
    QuickSync,
    Software,
}

impl Default for EncoderType {
    fn default() -> Self {
        Self::Auto
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VideoCodec {
    H264,
    H265,
    AV1,
}

impl Default for VideoCodec {
    fn default() -> Self {
        Self::H264
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AudioCodec {
    AAC,
    Opus,
    MP3,
}

impl Default for AudioCodec {
    fn default() -> Self {
        Self::AAC
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EncodingPreset {
    Ultrafast,
    Superfast,
    Veryfast,
    Faster,
    Fast,
    Medium,
    Slow,
    Slower,
    Veryslow,
    Placebo,
}

impl Default for EncodingPreset {
    fn default() -> Self {
        Self::Medium
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RateControl {
    CBR,
    VBR,
    CQP,
    CRF,
}

impl Default for RateControl {
    fn default() -> Self {
        Self::CBR
    }
}

impl Default for EncodingConfig {
    fn default() -> Self {
        Self {
            encoder: EncoderType::Auto,
            video_codec: VideoCodec::H264,
            audio_codec: AudioCodec::AAC,
            preset: EncodingPreset::Medium,
            rate_control: RateControl::CBR,
            bitrate: 6000,
            keyframe_interval: 2.0,
            two_pass: false,
            multi_threaded: true,
            gpu_index: -1,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingConfig {
    /// Platform presets
    pub platform_presets: HashMap<String, PlatformPreset>,
    /// Reconnect attempts
    pub reconnect_attempts: u32,
    /// Reconnect delay in seconds
    pub reconnect_delay: u32,
    /// Low latency mode
    pub low_latency: bool,
    /// Adaptive bitrate
    pub adaptive_bitrate: bool,
    /// Minimum bitrate for adaptive streaming
    pub min_bitrate: u32,
    /// Maximum bitrate for adaptive streaming
    pub max_bitrate: u32,
    /// Enable multistreaming
    pub multistreaming_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformPreset {
    pub platform: String,
    pub server_url: String,
    pub max_bitrate: u32,
    pub recommended_resolution: Resolution,
    pub recommended_framerate: u32,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        let mut presets = HashMap::new();
        
        presets.insert("twitch".to_string(), PlatformPreset {
            platform: "Twitch".to_string(),
            server_url: "rtmp://live.twitch.tv/app".to_string(),
            max_bitrate: 6000,
            recommended_resolution: Resolution { width: 1920, height: 1080 },
            recommended_framerate: 60,
        });
        
        presets.insert("youtube".to_string(), PlatformPreset {
            platform: "YouTube".to_string(),
            server_url: "rtmp://a.rtmp.youtube.com/live2".to_string(),
            max_bitrate: 12000,
            recommended_resolution: Resolution { width: 2560, height: 1440 },
            recommended_framerate: 60,
        });
        
        presets.insert("kick".to_string(), PlatformPreset {
            platform: "Kick".to_string(),
            server_url: "rtmp://live.kick.com/app".to_string(),
            max_bitrate: 8000,
            recommended_resolution: Resolution { width: 1920, height: 1080 },
            recommended_framerate: 60,
        });

        Self {
            platform_presets: presets,
            reconnect_attempts: 5,
            reconnect_delay: 2,
            low_latency: false,
            adaptive_bitrate: false,
            min_bitrate: 500,
            max_bitrate: 6000,
            multistreaming_enabled: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIConfig {
    /// Interface mode
    pub interface_mode: InterfaceMode,
    /// Theme
    pub theme: Theme,
    /// Show tooltips
    pub show_tooltips: bool,
    /// Enable animations
    pub animations_enabled: bool,
    /// Sidebar collapsed
    pub sidebar_collapsed: bool,
    /// Preview enabled
    pub preview_enabled: bool,
    /// Preview quality
    pub preview_quality: PreviewQuality,
    /// Custom keyboard shortcuts
    pub keyboard_shortcuts: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InterfaceMode {
    Simple,
    Expert,
}

impl Default for InterfaceMode {
    fn default() -> Self {
        Self::Simple
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    Auto,
}

impl Default for Theme {
    fn default() -> Self {
        Self::Dark
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PreviewQuality {
    Low,
    Medium,
    High,
    Original,
}

impl Default for PreviewQuality {
    fn default() -> Self {
        Self::Medium
    }
}

impl Default for UIConfig {
    fn default() -> Self {
        let mut shortcuts = HashMap::new();
        shortcuts.insert("start_streaming".to_string(), "F1".to_string());
        shortcuts.insert("stop_streaming".to_string(), "F2".to_string());
        shortcuts.insert("switch_scene_1".to_string(), "1".to_string());
        shortcuts.insert("switch_scene_2".to_string(), "2".to_string());
        shortcuts.insert("mute_audio".to_string(), "Ctrl+M".to_string());
        shortcuts.insert("toggle_preview".to_string(), "F5".to_string());
        shortcuts.insert("record_vod".to_string(), "F8".to_string());

        Self {
            interface_mode: InterfaceMode::Simple,
            theme: Theme::Dark,
            show_tooltips: true,
            animations_enabled: true,
            sidebar_collapsed: false,
            preview_enabled: true,
            preview_quality: PreviewQuality::Medium,
            keyboard_shortcuts: shortcuts,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    /// Enable AI highlight detection
    pub highlight_detection: bool,
    /// Highlight detection sensitivity
    pub highlight_sensitivity: f32,
    /// Enable live captions
    pub live_captions: bool,
    /// Caption language
    pub caption_language: String,
    /// Enable translation
    pub translation_enabled: bool,
    /// Translation target language
    pub translation_target_language: String,
    /// Enable AI coach
    pub ai_coach: bool,
    /// Coach tip frequency
    pub coach_tip_frequency: u32,
    /// Whisper model size
    pub whisper_model: WhisperModel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WhisperModel {
    Tiny,
    Base,
    Small,
    Medium,
    Large,
}

impl Default for WhisperModel {
    fn default() -> Self {
        Self::Base
    }
}

impl Default for AIConfig {
    fn default() -> Self {
        Self {
            highlight_detection: false,
            highlight_sensitivity: 0.7,
            live_captions: false,
            caption_language: "en".to_string(),
            translation_enabled: false,
            translation_target_language: "en".to_string(),
            ai_coach: false,
            coach_tip_frequency: 30,
            whisper_model: WhisperModel::Base,
        }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            general: GeneralConfig::default(),
            capture: CaptureConfig::default(),
            audio: AudioConfig::default(),
            encoding: EncodingConfig::default(),
            streaming: StreamingConfig::default(),
            ui: UIConfig::default(),
            ai: AIConfig::default(),
        }
    }
}

impl AppConfig {
    /// Create a new configuration with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Load configuration from a file
    pub fn load(path: &PathBuf) -> Result<Self, ConfigError> {
        let content = fs::read_to_string(path)
            .map_err(|e| ConfigError::IoError(e.to_string()))?;
        
        let config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| ConfigError::ParseError(e.to_string()))?;
        
        Ok(config)
    }

    /// Save configuration to a file
    pub fn save(&self, path: &PathBuf) -> Result<(), ConfigError> {
        let content = serde_json::to_string_pretty(self)
            .map_err(|e| ConfigError::SerializeError(e.to_string()))?;
        
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| ConfigError::IoError(e.to_string()))?;
        }
        
        fs::write(path, content)
            .map_err(|e| ConfigError::IoError(e.to_string()))?;
        
        Ok(())
    }

    /// Get the default configuration file path
    pub fn default_config_path() -> PathBuf {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."));
        
        config_dir
            .join("v-streaming")
            .join("config.json")
    }

    /// Reset configuration to defaults
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    /// Merge another configuration into this one
    pub fn merge(&mut self, other: &AppConfig) {
        // General
        if !other.general.language.is_empty() {
            self.general.language = other.general.language.clone();
        }
        
        // Audio
        if other.audio.sample_rate > 0 {
            self.audio.sample_rate = other.audio.sample_rate;
        }
        
        // Encoding
        if other.encoding.bitrate > 0 {
            self.encoding.bitrate = other.encoding.bitrate;
        }
        
        // Streaming
        for (key, value) in &other.streaming.platform_presets {
            self.streaming.platform_presets.insert(key.clone(), value.clone());
        }
        
        // UI
        for (key, value) in &other.ui.keyboard_shortcuts {
            self.ui.keyboard_shortcuts.insert(key.clone(), value.clone());
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("IO error: {0}")]
    IoError(String),
    
    #[error("Parse error: {0}")]
    ParseError(String),
    
    #[error("Serialize error: {0}")]
    SerializeError(String),
    
    #[error("Validation error: {0}")]
    ValidationError(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.general.language, "en");
        assert_eq!(config.capture.default_framerate, 60);
        assert_eq!(config.audio.sample_rate, 48000);
        assert_eq!(config.encoding.bitrate, 6000);
    }

    #[test]
    fn test_config_serialization() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.general.language, parsed.general.language);
    }

    #[test]
    fn test_platform_presets() {
        let config = AppConfig::default();
        assert!(config.streaming.platform_presets.contains_key("twitch"));
        assert!(config.streaming.platform_presets.contains_key("youtube"));
        assert!(config.streaming.platform_presets.contains_key("kick"));
    }
}