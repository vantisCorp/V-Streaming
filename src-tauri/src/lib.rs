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
pub mod analytics;
pub mod analytics_commands;
pub mod cli;
pub mod config;
pub mod pdk;
pub mod errors;
pub mod logging;
pub mod profiler;

use std::sync::Mutex;

pub use capture::{CaptureEngine, CaptureSource, CaptureSourceInfo, CapturePerformanceStats, CapturePreset, get_default_presets};
pub use composition::{CompositionEngine, Scene, Layer, Filter, OutputFormat, LayerUpdate, LayerSource, BlendMode, LayerMask, LayerGroup, SceneTransition, CanvasOutputs, ComposedFrame, CompositionStats};
pub use audio::{AudioEngine, AudioTrack, AudioDeviceInfo, AudioEffect, TrackUpdate, AudioPerformanceStats, AudioRoutingConfig};
pub use encoding::{EncodingEngine, EncodingPreset};
pub use streaming::{StreamingEngine, StreamingPlatform};
pub use plugin::{PluginApi, PluginInfo};
pub use gpu::{GpuContext, GpuInfo, Texture, Shader, TonemapMethod, ColorGrading, TextureFilter, GpuMemoryUsage, Shaders};
pub use vtuber::{VtuberEngine, VtuberModel, VtuberModelType, Animation, Expression, BoneTransform, FaceTracker, TrackingFeature, FaceTrackingData, MouthShape, VtuberStats};
pub use ui::{UiEngine, UserSettings, SettingsUpdate, UiState, UiStateUpdate, InterfaceMode, Theme, WindowLayout, PanelConfig, DockLayout, PanelVisibility, UiAction, UndoRedoInfo};
pub use onboarding::{OnboardingEngine, OnboardingStep, StepContent, UserPreferences, OnboardingProgress, OnboardingData};
pub use cloud::CloudEngine;
pub use multichat::MultichatEngine;
pub use webrtc::WebRTCEngine;
pub use interaction::InteractionEngine;
pub use ai_highlight::AiHighlightEngine;
pub use social_media::SocialMediaEngine;
pub use game_state::GameStateEngine;
pub use live_captions::LiveCaptionsEngine;
pub use translation::TranslationEngine;
pub use ai_coach::AiCoachEngine;
pub use tip_ecosystem::TipEcosystemEngine;
pub use sponsor_marketplace::SponsorMarketplaceEngine;
pub use smart_home::SmartHomeEngine;
pub use telemetry::TelemetryEngine;
pub use performance::PerformanceEngine;
pub use business::BusinessEngine;
pub use analytics::{AnalyticsEngine, AnalyticsDataPoint, AggregatedAnalytics, RealTimeAnalytics, PerformanceMetrics, ViewerStatistics, RevenueStatistics, AggregationPeriod, ExportFormat};
pub use cli::{Cli, CliContext, run_cli};
pub use config::{AppConfig, GeneralConfig, CaptureConfig, AudioConfig, EncodingConfig, StreamingConfig, UIConfig, AIConfig};
pub use pdk::{BasePlugin, PluginMetadata, PluginState, PluginConfig, PluginContext, PluginError, PluginManager as PdkPluginManager};
pub use logging::{Logger, LogLevel, LogEntry};
pub use profiler::{Profiler, ProfilingSession};
pub use errors::AppError;

/// Core application state - shared between library and binary
pub struct AppState {
    pub capture_engine: Mutex<CaptureEngine>,
    pub composition_engine: Mutex<CompositionEngine>,
    pub audio_engine: Mutex<AudioEngine>,
    pub encoding_engine: Mutex<EncodingEngine>,
    pub streaming_engine: Mutex<StreamingEngine>,
    pub plugin_manager: Mutex<plugin::PluginManager>,
    pub gpu_context: Mutex<GpuContext>,
    pub vtuber_engine: Mutex<VtuberEngine>,
    pub ui_engine: Mutex<UiEngine>,
    pub onboarding_engine: Mutex<OnboardingEngine>,
    pub cloud_engine: Mutex<CloudEngine>,
    pub multichat_engine: Mutex<MultichatEngine>,
    pub webrtc_engine: Mutex<WebRTCEngine>,
    pub interaction_engine: Mutex<InteractionEngine>,
    pub ai_highlight_engine: Mutex<AiHighlightEngine>,
    pub social_media_engine: Mutex<SocialMediaEngine>,
    pub game_state_engine: Mutex<GameStateEngine>,
    pub live_captions_engine: Mutex<LiveCaptionsEngine>,
    pub translation_engine: Mutex<TranslationEngine>,
    pub ai_coach_engine: Mutex<AiCoachEngine>,
    pub tip_ecosystem_engine: Mutex<TipEcosystemEngine>,
    pub sponsor_marketplace_engine: Mutex<SponsorMarketplaceEngine>,
    pub smart_home_engine: Mutex<SmartHomeEngine>,
    pub telemetry_engine: Mutex<TelemetryEngine>,
    pub performance_engine: Mutex<PerformanceEngine>,
    pub business_engine: Mutex<BusinessEngine>,
    pub analytics_engine: Mutex<AnalyticsEngine>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = config::AppConfig::default();
        assert_eq!(config.general.app_name, "V-Streaming");
    }

    #[test]
    fn test_error_creation() {
        let error = errors::AppError::Config(errors::ConfigError::Generic {
            message: "Test error".to_string(),
        });
        assert!(error.to_string().contains("Test error"));
    }
}