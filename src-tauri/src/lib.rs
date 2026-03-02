pub mod capture;
pub mod composition;
pub mod audio;
pub mod encoding;
pub mod streaming;
pub mod plugin;
pub mod gpu;
pub mod vtuber;
pub mod ui;
pub mod onboarding;
pub mod cloud;
pub mod multichat;
pub mod webrtc;
pub mod interaction;
pub mod ai_highlight;
pub mod social_media;
pub mod game_state;
pub mod live_captions;
pub mod translation;
pub mod ai_coach;
pub mod tip_ecosystem;
pub mod sponsor_marketplace;
pub mod smart_home;
pub mod telemetry;
pub mod performance;
pub mod business;

pub use capture::{CaptureEngine, CaptureSource, CaptureSourceInfo, CapturePerformanceStats, CapturePreset, get_default_presets};
pub use composition::{CompositionEngine, Scene, Layer, Filter, OutputFormat, LayerUpdate, LayerSource, BlendMode, LayerMask, LayerGroup, SceneTransition, CanvasOutputs, ComposedFrame, CompositionStats};
pub use audio::{AudioEngine, AudioTrack, AudioDeviceInfo, AudioEffect, TrackUpdate, AudioPerformanceStats, AudioRoutingConfig};
pub use encoding::{EncodingEngine, Encoder, Codec, EncodingConfig, EncodingPreset};
pub use streaming::{StreamingEngine, StreamConfig, StreamingPlatform, StreamProtocol, StreamStats};
pub use plugin::{PluginManager, Plugin, PluginApi, PluginInfo};
pub use gpu::{GpuContext, GpuInfo, Texture, Shader, TonemapMethod, ColorGrading, TextureFilter, GpuMemoryUsage, Shaders};
pub use vtuber::{VtuberEngine, VtuberModel, VtuberModelType, Animation, Expression, BoneTransform, FaceTracker, TrackingFeature, FaceTrackingData, MouthShape, VtuberStats};
pub use ui::{UiEngine, UserSettings, SettingsUpdate, UiState, UiStateUpdate, InterfaceMode, Theme, WindowLayout, PanelConfig, DockLayout, PanelVisibility, UiAction, UndoRedoInfo};
pub use onboarding::{OnboardingEngine, OnboardingStep, StepContent, UserPreferences, OnboardingProgress, OnboardingData};

/// Core application state
pub struct AppState {
    pub capture: CaptureEngine,
    pub composition: CompositionEngine,
    pub audio: AudioEngine,
    pub encoding: EncodingEngine,
    pub streaming: StreamingEngine,
    pub plugin: PluginManager,
    pub gpu: GpuContext,
    pub vtuber: VtuberEngine,
    pub ui: UiEngine,
    pub onboarding: OnboardingEngine,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            capture: CaptureEngine::new()?,
            composition: CompositionEngine::new()?,
            audio: AudioEngine::new()?,
            encoding: EncodingEngine::new()?,
            streaming: StreamingEngine::new()?,
            plugin: PluginManager::new()?,
            gpu: GpuContext::new()?,
            vtuber: VtuberEngine::new()?,
            ui: UiEngine::new()?,
            onboarding: OnboardingEngine::new()?,
        })
    }
}