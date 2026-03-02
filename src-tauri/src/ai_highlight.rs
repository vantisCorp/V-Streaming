use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// AI HIGHLIGHT CATCHER - Auto-clipping with AI
// ============================================================================

/// Highlight detection type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HighlightType {
    Kill,
    Death,
    Victory,
    Defeat,
    FunnyMoment,
    ChatReaction,
    Donation,
    Raid,
    Custom,
}

/// Highlight clip
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighlightClip {
    pub id: String,
    pub name: String,
    pub highlight_type: HighlightType,
    pub start_time: f64,
    pub end_time: f64,
    pub duration: f64,
    pub thumbnail_path: Option<String>,
    pub video_path: Option<String>,
    pub confidence_score: f32,
    pub tags: Vec<String>,
    pub created_at: u64,
    pub auto_saved: bool,
}

/// Highlight detection config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighlightDetectionConfig {
    pub enabled: bool,
    pub auto_clip: bool,
    pub min_clip_duration: f64,
    pub max_clip_duration: f64,
    pub confidence_threshold: f32,
    pub auto_save: bool,
    pub save_format: String,
    pub save_quality: String,
    pub detection_types: Vec<HighlightType>,
}

impl Default for HighlightDetectionConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_clip: true,
            min_clip_duration: 10.0,
            max_clip_duration: 60.0,
            confidence_threshold: 0.7,
            auto_save: true,
            save_format: "mp4".to_string(),
            save_quality: "high".to_string(),
            detection_types: vec![
                HighlightType::Kill,
                HighlightType::Victory,
                HighlightType::FunnyMoment,
                HighlightType::ChatReaction,
            ],
        }
    }
}

/// Highlight statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighlightStats {
    pub total_clips: u64,
    pub auto_clips: u64,
    pub manual_clips: u64,
    pub total_duration: f64,
    pub saved_clips: u64,
    pub unsaved_clips: u64,
}

/// AI highlight engine state
pub struct AiHighlightEngine {
    pub config: HighlightDetectionConfig,
    pub clips: Vec<HighlightClip>,
    pub stats: HighlightStats,
    pub is_recording: bool,
    pub recording_start_time: Option<f64>,
}

impl AiHighlightEngine {
    pub fn new() -> Self {
        Self {
            config: HighlightDetectionConfig::default(),
            clips: Vec::new(),
            stats: HighlightStats {
                total_clips: 0,
                auto_clips: 0,
                manual_clips: 0,
                total_duration: 0.0,
                saved_clips: 0,
                unsaved_clips: 0,
            },
            is_recording: false,
            recording_start_time: None,
        }
    }

    /// Create highlight clip
    pub fn create_clip(&mut self, name: String, highlight_type: HighlightType, start_time: f64, end_time: f64) -> Result<HighlightClip, String> {
        let duration = end_time - start_time;
        
        if duration < self.config.min_clip_duration {
            return Err("Clip duration is too short".to_string());
        }
        
        if duration > self.config.max_clip_duration {
            return Err("Clip duration is too long".to_string());
        }
        
        let clip = HighlightClip {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            highlight_type,
            start_time,
            end_time,
            duration,
            thumbnail_path: None,
            video_path: None,
            confidence_score: 0.8,
            tags: vec![],
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            auto_saved: self.config.auto_save,
        };
        
        self.clips.push(clip.clone());
        self.stats.total_clips += 1;
        self.stats.auto_clips += 1;
        self.stats.total_duration += duration;
        
        if self.config.auto_save {
            self.stats.saved_clips += 1;
        } else {
            self.stats.unsaved_clips += 1;
        }
        
        Ok(clip)
    }

    /// Get all clips
    pub fn get_clips(&self) -> Vec<HighlightClip> {
        self.clips.clone()
    }

    /// Get clip by ID
    pub fn get_clip(&self, clip_id: String) -> Option<HighlightClip> {
        self.clips.iter().find(|c| c.id == clip_id).cloned()
    }

    /// Delete clip
    pub fn delete_clip(&mut self, clip_id: String) -> Result<(), String> {
        if let Some(pos) = self.clips.iter().position(|c| c.id == clip_id) {
            self.clips.remove(pos);
            Ok(())
        } else {
            Err("Clip not found".to_string())
        }
    }

    /// Update detection config
    pub fn update_config(&mut self, config: HighlightDetectionConfig) {
        self.config = config;
    }

    /// Get detection config
    pub fn get_config(&self) -> HighlightDetectionConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> HighlightStats {
        self.stats.clone()
    }

    /// Start recording
    pub fn start_recording(&mut self) -> Result<(), String> {
        if self.is_recording {
            return Err("Already recording".to_string());
        }
        
        self.is_recording = true;
        self.recording_start_time = Some(std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs_f64());
        
        Ok(())
    }

    /// Stop recording
    pub fn stop_recording(&mut self) -> Result<(), String> {
        if !self.is_recording {
            return Err("Not recording".to_string());
        }
        
        self.is_recording = false;
        self.recording_start_time = None;
        
        Ok(())
    }

    /// Get recording status
    pub fn is_recording_status(&self) -> bool {
        self.is_recording
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_highlight_config(state: tauri::State<AppState>) -> HighlightDetectionConfig {
    state.ai_highlight_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_highlight_config(
    config: HighlightDetectionConfig,
    state: tauri::State<AppState>,
) {
    state.ai_highlight_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn create_highlight_clip(
    name: String,
    highlight_type: HighlightType,
    start_time: f64,
    end_time: f64,
    state: tauri::State<AppState>,
) -> Result<HighlightClip, String> {
    state.ai_highlight_engine.lock().unwrap().create_clip(name, highlight_type, start_time, end_time)
}

#[tauri::command]
fn get_highlight_clips(state: tauri::State<AppState>) -> Vec<HighlightClip> {
    state.ai_highlight_engine.lock().unwrap().get_clips()
}

#[tauri::command]
fn get_highlight_clip(
    clip_id: String,
    state: tauri::State<AppState>,
) -> Option<HighlightClip> {
    state.ai_highlight_engine.lock().unwrap().get_clip(clip_id)
}

#[tauri::command]
fn delete_highlight_clip(
    clip_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().delete_clip(clip_id)
}

#[tauri::command]
fn get_highlight_stats(state: tauri::State<AppState>) -> HighlightStats {
    state.ai_highlight_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn start_highlight_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().start_recording()
}

#[tauri::command]
fn stop_highlight_recording(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_highlight_engine.lock().unwrap().stop_recording()
}

#[tauri::command]
fn is_highlight_recording(state: tauri::State<AppState>) -> bool {
    state.ai_highlight_engine.lock().unwrap().is_recording_status()
}

#[tauri::command]
fn get_highlight_types() -> Vec<String> {
    vec![
        "kill".to_string(),
        "death".to_string(),
        "victory".to_string(),
        "defeat".to_string(),
        "funny_moment".to_string(),
        "chat_reaction".to_string(),
        "donation".to_string(),
        "raid".to_string(),
        "custom".to_string(),
    ]
}