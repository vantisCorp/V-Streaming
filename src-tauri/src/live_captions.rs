use serde::{Deserialize, Serialize};
use crate::AppState;

// ============================================================================
// LIVE CAPTIONS - Whisper AI Integration
// ============================================================================

/// Caption language
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CaptionLanguage {
    English,
    Spanish,
    French,
    German,
    Italian,
    Portuguese,
    Russian,
    Japanese,
    Korean,
    Chinese,
    Arabic,
    Hindi,
    Custom,
}

/// Caption model size
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CaptionModelSize {
    Tiny,
    Base,
    Small,
    Medium,
    Large,
    LargeV2,
    LargeV3,
}

/// Caption segment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionSegment {
    pub id: String,
    pub text: String,
    pub start_time: f64,
    pub end_time: f64,
    pub confidence: f32,
    pub speaker: Option<String>,
    pub language: CaptionLanguage,
}

/// Caption style
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionStyle {
    pub font_family: String,
    pub font_size: u32,
    pub font_color: String,
    pub background_color: String,
    pub background_opacity: f32,
    pub position: String,
    pub animation: String,
}

impl Default for CaptionStyle {
    fn default() -> Self {
        Self {
            font_family: "Arial".to_string(),
            font_size: 24,
            font_color: "#FFFFFF".to_string(),
            background_color: "#000000".to_string(),
            background_opacity: 0.7,
            position: "bottom".to_string(),
            animation: "fade".to_string(),
        }
    }
}

/// Caption config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionConfig {
    pub enabled: bool,
    pub language: CaptionLanguage,
    pub model_size: CaptionModelSize,
    pub auto_detect_language: bool,
    pub show_speaker_labels: bool,
    pub show_timestamps: bool,
    pub style: CaptionStyle,
    pub min_confidence: f32,
    pub max_segment_length: u32,
}

impl Default for CaptionConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            language: CaptionLanguage::English,
            model_size: CaptionModelSize::Base,
            auto_detect_language: false,
            show_speaker_labels: false,
            show_timestamps: false,
            style: CaptionStyle::default(),
            min_confidence: 0.5,
            max_segment_length: 30,
        }
    }
}

/// Caption statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptionStats {
    pub total_segments: u64,
    pub total_duration: f64,
    pub average_confidence: f32,
    pub words_per_minute: f32,
    pub active_language: Option<CaptionLanguage>,
}

/// Live captions engine state
pub struct LiveCaptionsEngine {
    pub config: CaptionConfig,
    pub segments: Vec<CaptionSegment>,
    pub stats: CaptionStats,
    pub is_processing: bool,
    pub current_speaker: Option<String>,
}

impl LiveCaptionsEngine {
    pub fn new() -> Self {
        Self {
            config: CaptionConfig::default(),
            segments: Vec::new(),
            stats: CaptionStats {
                total_segments: 0,
                total_duration: 0.0,
                average_confidence: 0.0,
                words_per_minute: 0.0,
                active_language: None,
            },
            is_processing: false,
            current_speaker: None,
        }
    }

    /// Start caption processing
    pub fn start_processing(&mut self) -> Result<(), String> {
        if self.is_processing {
            return Err("Already processing".to_string());
        }
        
        self.is_processing = true;
        Ok(())
    }

    /// Stop caption processing
    pub fn stop_processing(&mut self) -> Result<(), String> {
        if !self.is_processing {
            return Err("Not processing".to_string());
        }
        
        self.is_processing = false;
        Ok(())
    }

    /// Add caption segment
    pub fn add_segment(&mut self, text: String, start_time: f64, end_time: f64, confidence: f32) -> Result<CaptionSegment, String> {
        if confidence < self.config.min_confidence {
            return Err("Confidence too low".to_string());
        }
        
        let segment = CaptionSegment {
            id: uuid::Uuid::new_v4().to_string(),
            text,
            start_time,
            end_time,
            confidence,
            speaker: self.current_speaker.clone(),
            language: self.config.language.clone(),
        };
        
        self.segments.push(segment.clone());
        self.stats.total_segments += 1;
        self.stats.total_duration += end_time - start_time;
        
        // Update average confidence
        let total_confidence: f32 = self.segments.iter().map(|s| s.confidence).sum();
        self.stats.average_confidence = total_confidence / self.segments.len() as f32;
        
        // Calculate words per minute
        let total_words: usize = self.segments.iter().map(|s| s.text.split_whitespace().count()).sum();
        let total_minutes = self.stats.total_duration / 60.0;
        if total_minutes > 0.0 {
            self.stats.words_per_minute = total_words as f32 / total_minutes as f32;
        }
        
        self.stats.active_language = Some(self.config.language.clone());
        
        Ok(segment)
    }

    /// Get all segments
    pub fn get_segments(&self) -> Vec<CaptionSegment> {
        self.segments.clone()
    }

    /// Get recent segments
    pub fn get_recent_segments(&self, count: usize) -> Vec<CaptionSegment> {
        let len = self.segments.len();
        if count >= len {
            self.segments.clone()
        } else {
            self.segments[len - count..].to_vec()
        }
    }

    /// Clear segments
    pub fn clear_segments(&mut self) {
        self.segments.clear();
        self.stats = CaptionStats {
            total_segments: 0,
            total_duration: 0.0,
            average_confidence: 0.0,
            words_per_minute: 0.0,
            active_language: None,
        };
    }

    /// Update config
    pub fn update_config(&mut self, config: CaptionConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> CaptionConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> CaptionStats {
        self.stats.clone()
    }

    /// Set current speaker
    pub fn set_speaker(&mut self, speaker: String) {
        self.current_speaker = Some(speaker);
    }

    /// Get processing status
    pub fn is_processing_status(&self) -> bool {
        self.is_processing
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_caption_config(state: tauri::State<AppState>) -> CaptionConfig {
    state.live_captions_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_caption_config(
    config: CaptionConfig,
    state: tauri::State<AppState>,
) {
    state.live_captions_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_caption_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.live_captions_engine.lock().unwrap().start_processing()
}

#[tauri::command]
fn stop_caption_processing(state: tauri::State<AppState>) -> Result<(), String> {
    state.live_captions_engine.lock().unwrap().stop_processing()
}

#[tauri::command]
fn is_caption_processing(state: tauri::State<AppState>) -> bool {
    state.live_captions_engine.lock().unwrap().is_processing_status()
}

#[tauri::command]
fn add_caption_segment(
    text: String,
    start_time: f64,
    end_time: f64,
    confidence: f32,
    state: tauri::State<AppState>,
) -> Result<CaptionSegment, String> {
    state.live_captions_engine.lock().unwrap().add_segment(text, start_time, end_time, confidence)
}

#[tauri::command]
fn get_caption_segments(state: tauri::State<AppState>) -> Vec<CaptionSegment> {
    state.live_captions_engine.lock().unwrap().get_segments()
}

#[tauri::command]
fn get_recent_caption_segments(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<CaptionSegment> {
    state.live_captions_engine.lock().unwrap().get_recent_segments(count)
}

#[tauri::command]
fn clear_caption_segments(state: tauri::State<AppState>) {
    state.live_captions_engine.lock().unwrap().clear_segments();
}

#[tauri::command]
fn get_caption_stats(state: tauri::State<AppState>) -> CaptionStats {
    state.live_captions_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn set_caption_speaker(
    speaker: String,
    state: tauri::State<AppState>,
) {
    state.live_captions_engine.lock().unwrap().set_speaker(speaker);
}

#[tauri::command]
fn get_caption_languages() -> Vec<String> {
    vec![
        "english".to_string(),
        "spanish".to_string(),
        "french".to_string(),
        "german".to_string(),
        "italian".to_string(),
        "portuguese".to_string(),
        "russian".to_string(),
        "japanese".to_string(),
        "korean".to_string(),
        "chinese".to_string(),
        "arabic".to_string(),
        "hindi".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_caption_model_sizes() -> Vec<String> {
    vec![
        "tiny".to_string(),
        "base".to_string(),
        "small".to_string(),
        "medium".to_string(),
        "large".to_string(),
        "large_v2".to_string(),
        "large_v3".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_caption_segment_creation() {
        let segment = CaptionSegment {
            id: "seg123".to_string(),
            text: "Hello world".to_string(),
            start_time: 0.0,
            end_time: 2.5,
            confidence: 0.95,
            speaker: Some("Speaker1".to_string()),
            language: CaptionLanguage::English,
        };

        assert_eq!(segment.id, "seg123");
        assert_eq!(segment.text, "Hello world");
        assert_eq!(segment.confidence, 0.95);
        assert_eq!(segment.language, CaptionLanguage::English);
    }

    #[test]
    fn test_caption_style_default() {
        let style = CaptionStyle::default();
        
        assert_eq!(style.font_family, "Arial");
        assert_eq!(style.font_size, 24);
        assert_eq!(style.font_color, "#FFFFFF");
        assert_eq!(style.background_opacity, 0.7);
    }

    #[test]
    fn test_caption_config_default() {
        let config = CaptionConfig::default();
        
        assert_eq!(config.enabled, true);
        assert_eq!(config.language, CaptionLanguage::English);
        assert_eq!(config.model_size, CaptionModelSize::Base);
    }

    #[test]
    fn test_caption_language_variants() {
        let languages = vec![
            CaptionLanguage::English,
            CaptionLanguage::Spanish,
            CaptionLanguage::French,
            CaptionLanguage::German,
            CaptionLanguage::Italian,
            CaptionLanguage::Portuguese,
            CaptionLanguage::Russian,
            CaptionLanguage::Japanese,
            CaptionLanguage::Korean,
            CaptionLanguage::Chinese,
            CaptionLanguage::Arabic,
            CaptionLanguage::Hindi,
            CaptionLanguage::Custom,
        ];

        assert_eq!(languages.len(), 13);
        assert_eq!(languages[0], CaptionLanguage::English);
    }

    #[test]
    fn test_caption_model_size_variants() {
        let sizes = vec![
            CaptionModelSize::Tiny,
            CaptionModelSize::Base,
            CaptionModelSize::Small,
            CaptionModelSize::Medium,
            CaptionModelSize::Large,
            CaptionModelSize::LargeV2,
            CaptionModelSize::LargeV3,
        ];

        assert_eq!(sizes.len(), 7);
        assert_eq!(sizes[1], CaptionModelSize::Base);
    }

    #[test]
    fn test_caption_style_creation() {
        let style = CaptionStyle {
            font_family: "Roboto".to_string(),
            font_size: 28,
            font_color: "#FFFF00".to_string(),
            background_color: "#000000".to_string(),
            background_opacity: 0.8,
            position: "top".to_string(),
            animation: "slide".to_string(),
        };

        assert_eq!(style.font_family, "Roboto");
        assert_eq!(style.font_size, 28);
        assert_eq!(style.position, "top");
    }
}
