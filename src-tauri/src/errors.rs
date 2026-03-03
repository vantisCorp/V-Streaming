//! Centralized error handling for V-Streaming
//! 
//! This module provides a unified error handling system with detailed error types
//! for all subsystems of the application.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Main application error type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    /// GPU-related errors
    Gpu(GpuError),
    /// Capture-related errors
    Capture(CaptureError),
    /// Audio-related errors
    Audio(AudioError),
    /// Encoding-related errors
    Encoding(EncodingError),
    /// Streaming-related errors
    Streaming(StreamingError),
    /// VTuber-related errors
    VTuber(VTuberError),
    /// Composition-related errors
    Composition(CompositionError),
    /// Plugin-related errors
    Plugin(PluginError),
    /// Configuration errors
    Config(ConfigError),
    /// Network errors
    Network(NetworkError),
    /// AI-related errors
    AI(AIError),
    /// Cloud service errors
    Cloud(CloudError),
    /// Business/subscription errors
    Business(BusinessError),
    /// Generic error
    Generic { code: String, message: String },
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Gpu(e) => write!(f, "GPU Error: {}", e),
            AppError::Capture(e) => write!(f, "Capture Error: {}", e),
            AppError::Audio(e) => write!(f, "Audio Error: {}", e),
            AppError::Encoding(e) => write!(f, "Encoding Error: {}", e),
            AppError::Streaming(e) => write!(f, "Streaming Error: {}", e),
            AppError::VTuber(e) => write!(f, "VTuber Error: {}", e),
            AppError::Composition(e) => write!(f, "Composition Error: {}", e),
            AppError::Plugin(e) => write!(f, "Plugin Error: {}", e),
            AppError::Config(e) => write!(f, "Config Error: {}", e),
            AppError::Network(e) => write!(f, "Network Error: {}", e),
            AppError::AI(e) => write!(f, "AI Error: {}", e),
            AppError::Cloud(e) => write!(f, "Cloud Error: {}", e),
            AppError::Business(e) => write!(f, "Business Error: {}", e),
            AppError::Generic { code, message } => write!(f, "[{}] {}", code, message),
        }
    }
}

impl std::error::Error for AppError {}

/// GPU-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GpuError {
    /// No compatible GPU found
    NoGpuFound,
    /// Failed to initialize GPU context
    InitializationFailed { reason: String },
    /// Insufficient VRAM
    InsufficientVram { required: u64, available: u64 },
    /// Texture creation failed
    TextureCreationFailed { reason: String },
    /// Shader compilation failed
    ShaderCompilationFailed { shader_name: String, error: String },
    /// Unsupported feature
    UnsupportedFeature { feature: String },
    /// Driver out of date
    DriverOutdated { current: String, required: String },
    /// GPU device lost
    DeviceLost,
    /// Generic GPU error
    Generic { message: String },
}

impl fmt::Display for GpuError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GpuError::NoGpuFound => write!(f, "No compatible GPU found"),
            GpuError::InitializationFailed { reason } => write!(f, "GPU initialization failed: {}", reason),
            GpuError::InsufficientVram { required, available } => {
                write!(f, "Insufficient VRAM: required {} MB, available {} MB", required / 1024 / 1024, available / 1024 / 1024)
            }
            GpuError::TextureCreationFailed { reason } => write!(f, "Texture creation failed: {}", reason),
            GpuError::ShaderCompilationFailed { shader_name, error } => {
                write!(f, "Shader '{}' compilation failed: {}", shader_name, error)
            }
            GpuError::UnsupportedFeature { feature } => write!(f, "Unsupported GPU feature: {}", feature),
            GpuError::DriverOutdated { current, required } => {
                write!(f, "GPU driver outdated: current {}, required {}", current, required)
            }
            GpuError::DeviceLost => write!(f, "GPU device lost"),
            GpuError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Capture-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CaptureError {
    /// No capture sources available
    NoSourcesAvailable,
    /// Source not found
    SourceNotFound { source_id: String },
    /// Capture already in progress
    AlreadyCapturing { source_id: String },
    /// Failed to start capture
    StartFailed { source_id: String, reason: String },
    /// Failed to stop capture
    StopFailed { source_id: String, reason: String },
    /// DirectX hook failed
    DirectXHookFailed { reason: String },
    /// Vulkan hook failed
    VulkanHookFailed { reason: String },
    /// Window not found
    WindowNotFound { window_title: String },
    /// Screen not found
    ScreenNotFound { screen_index: u32 },
    /// Capture card not detected
    CaptureCardNotDetected,
    /// Unsupported capture format
    UnsupportedFormat { format: String },
    /// HDR conversion failed
    HdrConversionFailed { reason: String },
    /// Performance critical
    PerformanceCritical { fps: f32, dropped_frames: u32 },
    /// Generic capture error
    Generic { message: String },
}

impl fmt::Display for CaptureError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CaptureError::NoSourcesAvailable => write!(f, "No capture sources available"),
            CaptureError::SourceNotFound { source_id } => write!(f, "Capture source not found: {}", source_id),
            CaptureError::AlreadyCapturing { source_id } => write!(f, "Already capturing: {}", source_id),
            CaptureError::StartFailed { source_id, reason } => {
                write!(f, "Failed to start capture for {}: {}", source_id, reason)
            }
            CaptureError::StopFailed { source_id, reason } => {
                write!(f, "Failed to stop capture for {}: {}", source_id, reason)
            }
            CaptureError::DirectXHookFailed { reason } => write!(f, "DirectX hook failed: {}", reason),
            CaptureError::VulkanHookFailed { reason } => write!(f, "Vulkan hook failed: {}", reason),
            CaptureError::WindowNotFound { window_title } => write!(f, "Window not found: {}", window_title),
            CaptureError::ScreenNotFound { screen_index } => write!(f, "Screen not found: index {}", screen_index),
            CaptureError::CaptureCardNotDetected => write!(f, "Capture card not detected"),
            CaptureError::UnsupportedFormat { format } => write!(f, "Unsupported capture format: {}", format),
            CaptureError::HdrConversionFailed { reason } => write!(f, "HDR conversion failed: {}", reason),
            CaptureError::PerformanceCritical { fps, dropped_frames } => {
                write!(f, "Capture performance critical: {:.1} fps, {} dropped frames", fps, dropped_frames)
            }
            CaptureError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Audio-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioError {
    /// No audio devices available
    NoDevicesAvailable,
    /// Device not found
    DeviceNotFound { device_id: String },
    /// Device initialization failed
    DeviceInitFailed { device_id: String, reason: String },
    /// Audio track not found
    TrackNotFound { track_id: String },
    /// Failed to apply audio effect
    EffectApplyFailed { effect: String, reason: String },
    /// VST plugin load failed
    VstLoadFailed { plugin_path: String, reason: String },
    /// Audio format not supported
    UnsupportedFormat { format: String },
    /// Buffer underrun
    BufferUnderrun,
    /// Audio driver error
    DriverError { reason: String },
    /// Sample rate mismatch
    SampleRateMismatch { expected: u32, actual: u32 },
    /// Generic audio error
    Generic { message: String },
}

impl fmt::Display for AudioError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AudioError::NoDevicesAvailable => write!(f, "No audio devices available"),
            AudioError::DeviceNotFound { device_id } => write!(f, "Audio device not found: {}", device_id),
            AudioError::DeviceInitFailed { device_id, reason } => {
                write!(f, "Failed to initialize audio device {}: {}", device_id, reason)
            }
            AudioError::TrackNotFound { track_id } => write!(f, "Audio track not found: {}", track_id),
            AudioError::EffectApplyFailed { effect, reason } => {
                write!(f, "Failed to apply audio effect '{}': {}", effect, reason)
            }
            AudioError::VstLoadFailed { plugin_path, reason } => {
                write!(f, "Failed to load VST plugin '{}': {}", plugin_path, reason)
            }
            AudioError::UnsupportedFormat { format } => write!(f, "Unsupported audio format: {}", format),
            AudioError::BufferUnderrun => write!(f, "Audio buffer underrun"),
            AudioError::DriverError { reason } => write!(f, "Audio driver error: {}", reason),
            AudioError::SampleRateMismatch { expected, actual } => {
                write!(f, "Sample rate mismatch: expected {} Hz, actual {} Hz", expected, actual)
            }
            AudioError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Encoding-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EncodingError {
    /// No hardware encoders available
    NoHardwareEncoders,
    /// Encoder initialization failed
    EncoderInitFailed { encoder: String, reason: String },
    /// Encoder not found
    EncoderNotFound { encoder: String },
    /// Unsupported codec
    UnsupportedCodec { codec: String },
    /// Encoding failed
    EncodingFailed { reason: String },
    /// Invalid encoding parameters
    InvalidParameters { param: String, value: String, reason: String },
    /// Bitrate exceeded maximum
    BitrateExceeded { requested: u32, maximum: u32 },
    /// NVENC error
    NvencError { code: i32, message: String },
    /// AMF error
    AmfError { code: i32, message: String },
    /// QuickSync error
    QuickSyncError { code: i32, message: String },
    /// Generic encoding error
    Generic { message: String },
}

impl fmt::Display for EncodingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EncodingError::NoHardwareEncoders => write!(f, "No hardware encoders available"),
            EncodingError::EncoderInitFailed { encoder, reason } => {
                write!(f, "Failed to initialize encoder '{}': {}", encoder, reason)
            }
            EncodingError::EncoderNotFound { encoder } => write!(f, "Encoder not found: {}", encoder),
            EncodingError::UnsupportedCodec { codec } => write!(f, "Unsupported codec: {}", codec),
            EncodingError::EncodingFailed { reason } => write!(f, "Encoding failed: {}", reason),
            EncodingError::InvalidParameters { param, value, reason } => {
                write!(f, "Invalid encoding parameter '{}={}'': {}", param, value, reason)
            }
            EncodingError::BitrateExceeded { requested, maximum } => {
                write!(f, "Requested bitrate {} kbps exceeds maximum {} kbps", requested, maximum)
            }
            EncodingError::NvencError { code, message } => {
                write!(f, "NVENC error (code {}): {}", code, message)
            }
            EncodingError::AmfError { code, message } => {
                write!(f, "AMF error (code {}): {}", code, message)
            }
            EncodingError::QuickSyncError { code, message } => {
                write!(f, "QuickSync error (code {}): {}", code, message)
            }
            EncodingError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Streaming-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StreamingError {
    /// Not connected to server
    NotConnected,
    /// Already streaming
    AlreadyStreaming,
    /// Connection failed
    ConnectionFailed { server: String, reason: String },
    /// Authentication failed
    AuthenticationFailed { platform: String },
    /// Stream key invalid
    InvalidStreamKey { platform: String },
    /// Server unreachable
    ServerUnreachable { server: String },
    /// Connection timeout
    ConnectionTimeout { timeout_ms: u32 },
    /// Data send failed
    SendFailed { bytes: usize, reason: String },
    /// RTMP error
    RtmpError { code: u32, message: String },
    /// SRT error
    SrtError { code: i32, message: String },
    /// WebRTC error
    WebRTCError { message: String },
    /// Reconnection failed
    ReconnectionFailed { attempts: u32 },
    /// Platform not supported
    UnsupportedPlatform { platform: String },
    /// Generic streaming error
    Generic { message: String },
}

impl fmt::Display for StreamingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StreamingError::NotConnected => write!(f, "Not connected to streaming server"),
            StreamingError::AlreadyStreaming => write!(f, "Already streaming"),
            StreamingError::ConnectionFailed { server, reason } => {
                write!(f, "Failed to connect to '{}': {}", server, reason)
            }
            StreamingError::AuthenticationFailed { platform } => {
                write!(f, "Authentication failed for '{}'", platform)
            }
            StreamingError::InvalidStreamKey { platform } => {
                write!(f, "Invalid stream key for '{}'", platform)
            }
            StreamingError::ServerUnreachable { server } => {
                write!(f, "Server unreachable: {}", server)
            }
            StreamingError::ConnectionTimeout { timeout_ms } => {
                write!(f, "Connection timeout after {} ms", timeout_ms)
            }
            StreamingError::SendFailed { bytes, reason } => {
                write!(f, "Failed to send {} bytes: {}", bytes, reason)
            }
            StreamingError::RtmpError { code, message } => {
                write!(f, "RTMP error (code {}): {}", code, message)
            }
            StreamingError::SrtError { code, message } => {
                write!(f, "SRT error (code {}): {}", code, message)
            }
            StreamingError::WebRTCError { message } => write!(f, "WebRTC error: {}", message),
            StreamingError::ReconnectionFailed { attempts } => {
                write!(f, "Reconnection failed after {} attempts", attempts)
            }
            StreamingError::UnsupportedPlatform { platform } => {
                write!(f, "Unsupported streaming platform: {}", platform)
            }
            StreamingError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// VTuber-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VTuberError {
    /// Model not found
    ModelNotFound { model_path: String },
    /// Model load failed
    ModelLoadFailed { model_path: String, reason: String },
    /// Unsupported model format
    UnsupportedFormat { format: String },
    /// Face tracking not available
    FaceTrackingNotAvailable,
    /// Face tracking initialization failed
    FaceTrackingInitFailed { reason: String },
    /// No webcam found
    NoWebcamFound,
    /// Expression not found
    ExpressionNotFound { expression: String },
    /// Bone not found
    BoneNotFound { bone: String },
    /// Animation not found
    AnimationNotFound { animation: String },
    /// VRM parsing error
    VrmParseError { reason: String },
    /// Live2D error
    Live2DError { reason: String },
    /// Generic VTuber error
    Generic { message: String },
}

impl fmt::Display for VTuberError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            VTuberError::ModelNotFound { model_path } => write!(f, "Model not found: {}", model_path),
            VTuberError::ModelLoadFailed { model_path, reason } => {
                write!(f, "Failed to load model '{}': {}", model_path, reason)
            }
            VTuberError::UnsupportedFormat { format } => write!(f, "Unsupported model format: {}", format),
            VTuberError::FaceTrackingNotAvailable => write!(f, "Face tracking not available"),
            VTuberError::FaceTrackingInitFailed { reason } => {
                write!(f, "Face tracking initialization failed: {}", reason)
            }
            VTuberError::NoWebcamFound => write!(f, "No webcam found for face tracking"),
            VTuberError::ExpressionNotFound { expression } => write!(f, "Expression not found: {}", expression),
            VTuberError::BoneNotFound { bone } => write!(f, "Bone not found: {}", bone),
            VTuberError::AnimationNotFound { animation } => write!(f, "Animation not found: {}", animation),
            VTuberError::VrmParseError { reason } => write!(f, "VRM parsing error: {}", reason),
            VTuberError::Live2DError { reason } => write!(f, "Live2D error: {}", reason),
            VTuberError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Composition-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompositionError {
    /// Scene not found
    SceneNotFound { scene_id: String },
    /// Layer not found
    LayerNotFound { layer_id: String },
    /// Invalid layer configuration
    InvalidLayerConfig { reason: String },
    /// Blend mode not supported
    UnsupportedBlendMode { mode: String },
    /// Filter not found
    FilterNotFound { filter: String },
    /// Transition failed
    TransitionFailed { reason: String },
    /// Source not found for layer
    SourceNotFound { source_id: String },
    /// Maximum layers exceeded
    MaxLayersExceeded { current: usize, maximum: usize },
    /// Invalid resolution
    InvalidResolution { width: u32, height: u32, reason: String },
    /// Canvas creation failed
    CanvasCreationFailed { reason: String },
    /// Generic composition error
    Generic { message: String },
}

impl fmt::Display for CompositionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CompositionError::SceneNotFound { scene_id } => write!(f, "Scene not found: {}", scene_id),
            CompositionError::LayerNotFound { layer_id } => write!(f, "Layer not found: {}", layer_id),
            CompositionError::InvalidLayerConfig { reason } => write!(f, "Invalid layer configuration: {}", reason),
            CompositionError::UnsupportedBlendMode { mode } => write!(f, "Unsupported blend mode: {}", mode),
            CompositionError::FilterNotFound { filter } => write!(f, "Filter not found: {}", filter),
            CompositionError::TransitionFailed { reason } => write!(f, "Transition failed: {}", reason),
            CompositionError::SourceNotFound { source_id } => write!(f, "Source not found: {}", source_id),
            CompositionError::MaxLayersExceeded { current, maximum } => {
                write!(f, "Maximum layers exceeded: {} / {}", current, maximum)
            }
            CompositionError::InvalidResolution { width, height, reason } => {
                write!(f, "Invalid resolution {}x{}: {}", width, height, reason)
            }
            CompositionError::CanvasCreationFailed { reason } => write!(f, "Canvas creation failed: {}", reason),
            CompositionError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Plugin-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginError {
    /// Plugin not found
    PluginNotFound { plugin_name: String },
    /// Plugin load failed
    LoadFailed { plugin_name: String, reason: String },
    /// Plugin initialization failed
    InitFailed { plugin_name: String, reason: String },
    /// Plugin version mismatch
    VersionMismatch { plugin_name: String, expected: String, actual: String },
    /// Plugin API mismatch
    ApiMismatch { plugin_name: String, reason: String },
    /// Plugin dependency missing
    DependencyMissing { plugin_name: String, dependency: String },
    /// Plugin permission denied
    PermissionDenied { plugin_name: String, permission: String },
    /// Generic plugin error
    Generic { message: String },
}

impl fmt::Display for PluginError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PluginError::PluginNotFound { plugin_name } => write!(f, "Plugin not found: {}", plugin_name),
            PluginError::LoadFailed { plugin_name, reason } => {
                write!(f, "Failed to load plugin '{}': {}", plugin_name, reason)
            }
            PluginError::InitFailed { plugin_name, reason } => {
                write!(f, "Failed to initialize plugin '{}': {}", plugin_name, reason)
            }
            PluginError::VersionMismatch { plugin_name, expected, actual } => {
                write!(f, "Plugin '{}' version mismatch: expected {}, actual {}", plugin_name, expected, actual)
            }
            PluginError::ApiMismatch { plugin_name, reason } => {
                write!(f, "Plugin '{}' API mismatch: {}", plugin_name, reason)
            }
            PluginError::DependencyMissing { plugin_name, dependency } => {
                write!(f, "Plugin '{}' missing dependency: {}", plugin_name, dependency)
            }
            PluginError::PermissionDenied { plugin_name, permission } => {
                write!(f, "Plugin '{}' permission denied: {}", plugin_name, permission)
            }
            PluginError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Configuration-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConfigError {
    /// Configuration file not found
    FileNotFound { path: String },
    /// Configuration parse error
    ParseError { reason: String },
    /// Configuration validation error
    ValidationError { field: String, reason: String },
    /// Configuration save error
    SaveError { reason: String },
    /// Invalid configuration value
    InvalidValue { field: String, value: String, reason: String },
    /// Missing required field
    MissingField { field: String },
    /// Generic configuration error
    Generic { message: String },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::FileNotFound { path } => write!(f, "Configuration file not found: {}", path),
            ConfigError::ParseError { reason } => write!(f, "Configuration parse error: {}", reason),
            ConfigError::ValidationError { field, reason } => {
                write!(f, "Configuration validation error for '{}': {}", field, reason)
            }
            ConfigError::SaveError { reason } => write!(f, "Failed to save configuration: {}", reason),
            ConfigError::InvalidValue { field, value, reason } => {
                write!(f, "Invalid configuration value for '{}': {} ({})", field, value, reason)
            }
            ConfigError::MissingField { field } => write!(f, "Missing required configuration field: {}", field),
            ConfigError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Network-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkError {
    /// Connection refused
    ConnectionRefused { address: String },
    /// Connection timeout
    Timeout { operation: String },
    /// DNS resolution failed
    DnsResolutionFailed { host: String },
    /// SSL/TLS error
    SslError { reason: String },
    /// Proxy error
    ProxyError { reason: String },
    /// Too many redirects
    TooManyRedirects { count: u32 },
    /// Request failed
    RequestFailed { status: u16, reason: String },
    /// Network unreachable
    NetworkUnreachable,
    /// Generic network error
    Generic { message: String },
}

impl fmt::Display for NetworkError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NetworkError::ConnectionRefused { address } => write!(f, "Connection refused: {}", address),
            NetworkError::Timeout { operation } => write!(f, "Network timeout during: {}", operation),
            NetworkError::DnsResolutionFailed { host } => write!(f, "DNS resolution failed for: {}", host),
            NetworkError::SslError { reason } => write!(f, "SSL/TLS error: {}", reason),
            NetworkError::ProxyError { reason } => write!(f, "Proxy error: {}", reason),
            NetworkError::TooManyRedirects { count } => write!(f, "Too many redirects: {}", count),
            NetworkError::RequestFailed { status, reason } => {
                write!(f, "Request failed with status {}: {}", status, reason)
            }
            NetworkError::NetworkUnreachable => write!(f, "Network unreachable"),
            NetworkError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// AI-related errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AIError {
    /// Model not loaded
    ModelNotLoaded { model: String },
    /// Model load failed
    ModelLoadFailed { model: String, reason: String },
    /// Inference failed
    InferenceFailed { reason: String },
    /// Whisper error
    WhisperError { reason: String },
    /// Translation service error
    TranslationError { service: String, reason: String },
    /// Highlight detection error
    HighlightDetectionError { reason: String },
    /// AI coach error
    CoachError { reason: String },
    /// Resource not available
    ResourceNotAvailable { resource: String },
    /// Generic AI error
    Generic { message: String },
}

impl fmt::Display for AIError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AIError::ModelNotLoaded { model } => write!(f, "AI model not loaded: {}", model),
            AIError::ModelLoadFailed { model, reason } => {
                write!(f, "Failed to load AI model '{}': {}", model, reason)
            }
            AIError::InferenceFailed { reason } => write!(f, "AI inference failed: {}", reason),
            AIError::WhisperError { reason } => write!(f, "Whisper error: {}", reason),
            AIError::TranslationError { service, reason } => {
                write!(f, "Translation service '{}' error: {}", service, reason)
            }
            AIError::HighlightDetectionError { reason } => write!(f, "Highlight detection error: {}", reason),
            AIError::CoachError { reason } => write!(f, "AI coach error: {}", reason),
            AIError::ResourceNotAvailable { resource } => write!(f, "AI resource not available: {}", resource),
            AIError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Cloud service errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CloudError {
    /// Not connected to cloud service
    NotConnected,
    /// Authentication failed
    AuthenticationFailed { provider: String },
    /// API error
    ApiError { provider: String, code: u32, message: String },
    /// Upload failed
    UploadFailed { reason: String },
    /// Download failed
    DownloadFailed { reason: String },
    /// Storage quota exceeded
    StorageQuotaExceeded { used: u64, limit: u64 },
    /// VOD recording failed
    RecordingFailed { reason: String },
    /// Multistream target error
    MultistreamError { platform: String, reason: String },
    /// Generic cloud error
    Generic { message: String },
}

impl fmt::Display for CloudError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CloudError::NotConnected => write!(f, "Not connected to cloud service"),
            CloudError::AuthenticationFailed { provider } => {
                write!(f, "Cloud authentication failed for: {}", provider)
            }
            CloudError::ApiError { provider, code, message } => {
                write!(f, "Cloud API error for '{}' (code {}): {}", provider, code, message)
            }
            CloudError::UploadFailed { reason } => write!(f, "Cloud upload failed: {}", reason),
            CloudError::DownloadFailed { reason } => write!(f, "Cloud download failed: {}", reason),
            CloudError::StorageQuotaExceeded { used, limit } => {
                write!(f, "Storage quota exceeded: {} / {} GB", used / 1024 / 1024 / 1024, limit / 1024 / 1024 / 1024)
            }
            CloudError::RecordingFailed { reason } => write!(f, "VOD recording failed: {}", reason),
            CloudError::MultistreamError { platform, reason } => {
                write!(f, "Multistream error for '{}': {}", platform, reason)
            }
            CloudError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Business/subscription errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BusinessError {
    /// Not subscribed
    NotSubscribed,
    /// Subscription expired
    SubscriptionExpired { expired_at: String },
    /// Feature not available
    FeatureNotAvailable { feature: String, required_tier: String },
    /// Usage limit exceeded
    UsageLimitExceeded { usage_type: String, limit: u32 },
    /// Payment failed
    PaymentFailed { reason: String },
    /// Trial expired
    TrialExpired,
    /// Referral code invalid
    InvalidReferralCode { code: String },
    /// Generic business error
    Generic { message: String },
}

impl fmt::Display for BusinessError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BusinessError::NotSubscribed => write!(f, "Not subscribed"),
            BusinessError::SubscriptionExpired { expired_at } => {
                write!(f, "Subscription expired on: {}", expired_at)
            }
            BusinessError::FeatureNotAvailable { feature, required_tier } => {
                write!(f, "Feature '{}' requires {} tier", feature, required_tier)
            }
            BusinessError::UsageLimitExceeded { usage_type, limit } => {
                write!(f, "Usage limit exceeded for '{}': limit is {}", usage_type, limit)
            }
            BusinessError::PaymentFailed { reason } => write!(f, "Payment failed: {}", reason),
            BusinessError::TrialExpired => write!(f, "Trial period expired"),
            BusinessError::InvalidReferralCode { code } => write!(f, "Invalid referral code: {}", code),
            BusinessError::Generic { message } => write!(f, "{}", message),
        }
    }
}

/// Helper macro for creating errors
#[macro_export]
macro_rules! app_error {
    ($type:ident :: $variant:ident) => {
        AppError::$type($type::$variant)
    };
    ($type:ident :: $variant:ident { $($field:ident : $value:expr),+ $(,)? }) => {
        AppError::$type($type::$variant { $($field: $value),+ })
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = AppError::Gpu(GpuError::NoGpuFound);
        assert_eq!(format!("{}", error), "GPU Error: No compatible GPU found");

        let error = AppError::Capture(CaptureError::SourceNotFound {
            source_id: "test-123".to_string(),
        });
        assert_eq!(format!("{}", error), "Capture Error: Capture source not found: test-123");
    }

    #[test]
    fn test_error_serialization() {
        let error = GpuError::InsufficientVram {
            required: 8 * 1024 * 1024 * 1024,
            available: 4 * 1024 * 1024 * 1024,
        };
        let json = serde_json::to_string(&error).unwrap();
        assert!(json.contains("InsufficientVram"));
    }

    #[test]
    fn test_app_error_macro() {
        let error = app_error!(Gpu::NoGpuFound);
        match error {
            AppError::Gpu(GpuError::NoGpuFound) => (),
            _ => panic!("Unexpected error type"),
        }
    }
}