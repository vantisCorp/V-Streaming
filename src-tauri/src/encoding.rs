use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// ENCODING ENGINE - Hardware Encoding with NVENC, AMF, QuickSync
// ============================================================================

/// Hardware encoder types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HardwareEncoder {
    NVENC,      // NVIDIA NVENC (H.264/H.265/AV1)
    AMF,        // AMD AMF (H.264/H.265/AV1)
    QuickSync,  // Intel Quick Sync Video (H.264/H.265/AV1)
    Software,   // Software encoding (x264/x265)
    Auto,       // Auto-detect best available encoder
}

/// Video codec types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VideoCodec {
    H264,       // H.264/AVC
    H265,       // H.265/HEVC
    AV1,        // AV1
}

/// Video encoding presets
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
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

/// Rate control methods
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RateControl {
    CBR,        // Constant Bitrate
    VBR,        // Variable Bitrate
    CQP,        // Constant Quantization Parameter
    CRF,        // Constant Rate Factor
}

/// Video encoding configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoEncodingConfig {
    pub encoder: HardwareEncoder,
    pub codec: VideoCodec,
    pub preset: EncodingPreset,
    pub rate_control: RateControl,
    pub bitrate: u32,           // Target bitrate in kbps
    pub max_bitrate: u32,       // Maximum bitrate in kbps (for VBR)
    pub keyframe_interval: u32, // Keyframe interval in frames
    pub profile: Option<String>, // Codec profile (e.g., "high", "main", "baseline")
    pub level: Option<String>,   // Codec level (e.g., "4.1", "5.0")
    pub b_frames: u32,          // Number of B-frames
    pub reference_frames: u32,  // Number of reference frames
    pub gop_size: u32,          // Group of Pictures size
    pub multipass: bool,        // Enable multipass encoding
    pub lookahead: bool,        // Enable lookahead
    pub psycho_visual: bool,    // Enable psycho-visual optimizations
}

impl Default for VideoEncodingConfig {
    fn default() -> Self {
        Self {
            encoder: HardwareEncoder::Auto,
            codec: VideoCodec::H264,
            preset: EncodingPreset::Fast,
            rate_control: RateControl::CBR,
            bitrate: 6000,
            max_bitrate: 8000,
            keyframe_interval: 60,
            profile: Some("high".to_string()),
            level: Some("4.1".to_string()),
            b_frames: 2,
            reference_frames: 4,
            gop_size: 60,
            multipass: false,
            lookahead: true,
            psycho_visual: true,
        }
    }
}

/// Audio encoding configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioEncodingConfig {
    pub codec: AudioCodec,
    pub bitrate: u32,           // Bitrate in kbps
    pub sample_rate: u32,       // Sample rate in Hz
    pub channels: u32,          // Number of audio channels
    pub format: AudioFormat,
}

impl Default for AudioEncodingConfig {
    fn default() -> Self {
        Self {
            codec: AudioCodec::AAC,
            bitrate: 128,
            sample_rate: 48000,
            channels: 2,
            format: AudioFormat::AAC,
        }
    }
}

/// Audio codec types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AudioCodec {
    AAC,
    Opus,
    MP3,
}

/// Audio format types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    AAC,
    Opus,
    MP3,
}

/// Encoding statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncodingStats {
    pub fps: f32,
    pub bitrate: u32,
    pub cpu_usage: f32,
    pub gpu_usage: f32,
    pub encoded_frames: u64,
    pub dropped_frames: u64,
    pub average_frame_time: f32,
    pub encoding_time: f32,
}

/// Encoder information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncoderInfo {
    pub name: String,
    pub vendor: String,
    pub supported_codecs: Vec<VideoCodec>,
    pub max_resolution: (u32, u32),
    pub max_fps: u32,
    pub hardware_accelerated: bool,
}

/// Encoding engine state
pub struct EncodingEngine {
    pub active: bool,
    pub video_config: VideoEncodingConfig,
    pub audio_config: AudioEncodingConfig,
    pub stats: EncodingStats,
    pub available_encoders: Vec<EncoderInfo>,
}

impl EncodingEngine {
    pub fn new() -> Self {
        Self {
            active: false,
            video_config: VideoEncodingConfig::default(),
            audio_config: AudioEncodingConfig::default(),
            stats: EncodingStats {
                fps: 0.0,
                bitrate: 0,
                cpu_usage: 0.0,
                gpu_usage: 0.0,
                encoded_frames: 0,
                dropped_frames: 0,
                average_frame_time: 0.0,
                encoding_time: 0.0,
            },
            available_encoders: Self::detect_encoders(),
        }
    }

    /// Detect available hardware encoders
    fn detect_encoders() -> Vec<EncoderInfo> {
        let mut encoders = Vec::new();

        // NVENC (NVIDIA)
        #[cfg(target_os = "windows")]
        {
            encoders.push(EncoderInfo {
                name: "NVIDIA NVENC".to_string(),
                vendor: "NVIDIA".to_string(),
                supported_codecs: vec![VideoCodec::H264, VideoCodec::H265, VideoCodec::AV1],
                max_resolution: (8192, 8192),
                max_fps: 144,
                hardware_accelerated: true,
            });
        }

        // AMF (AMD)
        #[cfg(target_os = "windows")]
        {
            encoders.push(EncoderInfo {
                name: "AMD AMF".to_string(),
                vendor: "AMD".to_string(),
                supported_codecs: vec![VideoCodec::H264, VideoCodec::H265, VideoCodec::AV1],
                max_resolution: (4096, 4096),
                max_fps: 120,
                hardware_accelerated: true,
            });
        }

        // Quick Sync (Intel)
        #[cfg(target_os = "windows")]
        {
            encoders.push(EncoderInfo {
                name: "Intel Quick Sync".to_string(),
                vendor: "Intel".to_string(),
                supported_codecs: vec![VideoCodec::H264, VideoCodec::H265, VideoCodec::AV1],
                max_resolution: (4096, 4096),
                max_fps: 120,
                hardware_accelerated: true,
            });
        }

        // Software encoding (x264/x265)
        encoders.push(EncoderInfo {
            name: "Software (x264/x265)".to_string(),
            vendor: "FFmpeg".to_string(),
            supported_codecs: vec![VideoCodec::H264, VideoCodec::H265],
            max_resolution: (16384, 16384),
            max_fps: 60,
            hardware_accelerated: false,
        });

        encoders
    }

    /// Start encoding
    pub fn start_encoding(&mut self, video_config: VideoEncodingConfig, audio_config: AudioEncodingConfig) -> Result<(), String> {
        if self.active {
            return Err("Encoding is already active".to_string());
        }

        self.video_config = video_config;
        self.audio_config = audio_config;
        self.active = true;

        // Reset stats
        self.stats = EncodingStats {
            fps: 0.0,
            bitrate: 0,
            cpu_usage: 0.0,
            gpu_usage: 0.0,
            encoded_frames: 0,
            dropped_frames: 0,
            average_frame_time: 0.0,
            encoding_time: 0.0,
        };

        Ok(())
    }

    /// Stop encoding
    pub fn stop_encoding(&mut self) -> Result<(), String> {
        if !self.active {
            return Err("Encoding is not active".to_string());
        }

        self.active = false;
        Ok(())
    }

    /// Update encoding statistics
    pub fn update_stats(&mut self, fps: f32, bitrate: u32, cpu_usage: f32, gpu_usage: f32) {
        self.stats.fps = fps;
        self.stats.bitrate = bitrate;
        self.stats.cpu_usage = cpu_usage;
        self.stats.gpu_usage = gpu_usage;
    }

    /// Get encoding presets for a codec
    pub fn get_presets_for_codec(codec: &VideoCodec) -> Vec<EncodingPreset> {
        match codec {
            VideoCodec::H264 => vec![
                EncodingPreset::Ultrafast,
                EncodingPreset::Superfast,
                EncodingPreset::Veryfast,
                EncodingPreset::Faster,
                EncodingPreset::Fast,
                EncodingPreset::Medium,
                EncodingPreset::Slow,
                EncodingPreset::Slower,
                EncodingPreset::Veryslow,
                EncodingPreset::Placebo,
            ],
            VideoCodec::H265 => vec![
                EncodingPreset::Ultrafast,
                EncodingPreset::Superfast,
                EncodingPreset::Veryfast,
                EncodingPreset::Faster,
                EncodingPreset::Fast,
                EncodingPreset::Medium,
                EncodingPreset::Slow,
                EncodingPreset::Slower,
            ],
            VideoCodec::AV1 => vec![
                EncodingPreset::Ultrafast,
                EncodingPreset::Superfast,
                EncodingPreset::Veryfast,
                EncodingPreset::Faster,
                EncodingPreset::Fast,
                EncodingPreset::Medium,
                EncodingPreset::Slow,
            ],
        }
    }

    /// Get recommended bitrate for resolution and fps
    pub fn get_recommended_bitrate(resolution: (u32, u32), fps: u32, codec: &VideoCodec) -> u32 {
        let pixel_count = resolution.0 * resolution.1;
        let fps_factor = fps as f32 / 60.0;

        let base_bitrate = match codec {
            VideoCodec::H264 => match pixel_count {
                0..=921_600 => 3000,      // 1280x720
                921_601..=2_073_600 => 6000, // 1920x1080
                2_073_601..=3_686_400 => 9000, // 2560x1440
                _ => 15000,               // 3840x2160 and above
            },
            VideoCodec::H265 => match pixel_count {
                0..=921_600 => 2000,
                921_601..=2_073_600 => 4500,
                2_073_601..=3_686_400 => 7000,
                _ => 12000,
            },
            VideoCodec::AV1 => match pixel_count {
                0..=921_600 => 1500,
                921_601..=2_073_600 => 3500,
                2_073_601..=3_686_400 => 5500,
                _ => 10000,
            },
        };

        (base_bitrate as f32 * fps_factor) as u32
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get available encoders
#[tauri::command]
pub fn get_available_encoders(state: State<Arc<Mutex<EncodingEngine>>>) -> Vec<EncoderInfo> {
    let engine = state.lock().unwrap();
    engine.available_encoders.clone()
}

/// Start encoding
#[tauri::command]
pub fn start_encoding(
    video_config: VideoEncodingConfig,
    audio_config: AudioEncodingConfig,
    state: State<Arc<Mutex<EncodingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.start_encoding(video_config, audio_config)
}

/// Stop encoding
#[tauri::command]
pub fn stop_encoding(state: State<Arc<Mutex<EncodingEngine>>>) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.stop_encoding()
}

/// Check if encoding is active
#[tauri::command]
pub fn is_encoding_active(state: State<Arc<Mutex<EncodingEngine>>>) -> bool {
    let engine = state.lock().unwrap();
    engine.active
}

/// Get encoding statistics
#[tauri::command]
pub fn get_encoding_stats(state: State<Arc<Mutex<EncodingEngine>>>) -> EncodingStats {
    let engine = state.lock().unwrap();
    engine.stats.clone()
}

/// Get video encoding configuration
#[tauri::command]
pub fn get_video_config(state: State<Arc<Mutex<EncodingEngine>>>) -> VideoEncodingConfig {
    let engine = state.lock().unwrap();
    engine.video_config.clone()
}

/// Get audio encoding configuration
#[tauri::command]
pub fn get_audio_config(state: State<Arc<Mutex<EncodingEngine>>>) -> AudioEncodingConfig {
    let engine = state.lock().unwrap();
    engine.audio_config.clone()
}

/// Update video encoding configuration
#[tauri::command]
pub fn update_video_config(
    config: VideoEncodingConfig,
    state: State<Arc<Mutex<EncodingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.video_config = config;
    Ok(())
}

/// Update audio encoding configuration
#[tauri::command]
pub fn update_audio_config(
    config: AudioEncodingConfig,
    state: State<Arc<Mutex<EncodingEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.audio_config = config;
    Ok(())
}

/// Get presets for a codec
#[tauri::command]
pub fn get_presets_for_codec(codec: VideoCodec) -> Vec<EncodingPreset> {
    EncodingEngine::get_presets_for_codec(&codec)
}

/// Get recommended bitrate
#[tauri::command]
pub fn get_recommended_bitrate(
    width: u32,
    height: u32,
    fps: u32,
    codec: VideoCodec,
) -> u32 {
    EncodingEngine::get_recommended_bitrate((width, height), fps, &codec)
}

/// Get encoding presets
#[tauri::command]
pub fn get_encoding_presets() -> Vec<String> {
    vec![
        "Ultrafast".to_string(),
        "Superfast".to_string(),
        "Veryfast".to_string(),
        "Faster".to_string(),
        "Fast".to_string(),
        "Medium".to_string(),
        "Slow".to_string(),
        "Slower".to_string(),
        "Veryslow".to_string(),
        "Placebo".to_string(),
    ]
}

/// Get rate control methods
#[tauri::command]
pub fn get_rate_control_methods() -> Vec<String> {
    vec![
        "CBR".to_string(),
        "VBR".to_string(),
        "CQP".to_string(),
        "CRF".to_string(),
    ]
}

/// Get video codecs
#[tauri::command]
pub fn get_video_codecs() -> Vec<String> {
    vec![
        "H264".to_string(),
        "H265".to_string(),
        "AV1".to_string(),
    ]
}

/// Get audio codecs
#[tauri::command]
pub fn get_audio_codecs() -> Vec<String> {
    vec![
        "AAC".to_string(),
        "Opus".to_string(),
        "MP3".to_string(),
    ]
}

/// Get hardware encoder types
#[tauri::command]
pub fn get_hardware_encoders() -> Vec<String> {
    vec![
        "NVENC".to_string(),
        "AMF".to_string(),
        "QuickSync".to_string(),
        "Software".to_string(),
        "Auto".to_string(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encoding_engine_creation() {
        let engine = EncodingEngine::new();
        assert_eq!(engine.encoders.len(), 0);
    }

    #[test]
    fn test_encoder() {
        let encoder = Encoder {
            id: 0,
            name: "H264 Encoder".to_string(),
            encoder_type: EncoderType::Hardware,
            codec: Codec::H264,
            config: EncodingConfig::default(),
        };

        assert_eq!(encoder.name, "H264 Encoder");
        assert_eq!(encoder.codec, Codec::H264);
    }

    #[test]
    fn test_encoding_config() {
        let config = EncodingConfig::default();
        assert_eq!(config.bitrate, 6000);
        assert_eq!(config.codec, Codec::H264);
    }

    #[test]
    fn test_codec() {
        assert_eq!(Codec::H264.name(), "H264");
        assert_eq!(Codec::H265.name(), "H265");
        assert_eq!(Codec::AV1.name(), "AV1");
    }

    #[test]
    fn test_encoder_type() {
        assert_eq!(EncoderType::Hardware.to_string(), "Hardware");
        assert_eq!(EncoderType::Software.to_string(), "Software");
    }

    #[test]
    fn test_encoding_preset() {
        let presets = get_encoding_presets();
        assert!(!presets.is_empty());
        assert!(presets.contains(&"Medium".to_string()));
    }

    #[test]
    fn test_rate_control_methods() {
        let methods = get_rate_control_methods();
        assert!(!methods.is_empty());
        assert!(methods.contains(&"CBR".to_string()));
        assert!(methods.contains(&"VBR".to_string()));
    }

    #[test]
    fn test_video_codecs() {
        let codecs = get_video_codecs();
        assert!(!codecs.is_empty());
        assert!(codecs.contains(&"H264".to_string()));
        assert!(codecs.contains(&"H265".to_string()));
    }
}
