use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;
use crate::AppState;

// ============================================================================
// AI STREAM COACH - Real-time Streaming Advice and Analytics
// ============================================================================

/// Coach tip type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CoachTipType {
    Engagement,
    Content,
    Technical,
    Monetization,
    Schedule,
    Custom,
}

/// Coach tip priority
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum CoachTipPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// Coach tip
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoachTip {
    pub id: String,
    pub tip_type: CoachTipType,
    pub priority: CoachTipPriority,
    pub title: String,
    pub description: String,
    pub actionable: bool,
    pub action_suggestion: Option<String>,
    pub timestamp: u64,
    pub acknowledged: bool,
}

/// Stream analytics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamAnalytics {
    pub stream_id: String,
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub duration: u64,
    pub peak_viewers: u32,
    pub average_viewers: f32,
    pub new_followers: u32,
    pub new_subscribers: u32,
    pub total_donations: f32,
    pub chat_messages: u64,
    pub unique_chatters: u32,
    pub engagement_rate: f32,
}

/// Coach config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoachConfig {
    pub enabled: bool,
    pub real_time_tips: bool,
    pub tip_frequency: u32, // minutes between tips
    pub min_priority: CoachTipPriority,
    pub show_actionable_only: bool,
    pub auto_analyze: bool,
    pub analyze_on_stream_end: bool,
}

impl Default for CoachConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            real_time_tips: true,
            tip_frequency: 10,
            min_priority: CoachTipPriority::Medium,
            show_actionable_only: false,
            auto_analyze: true,
            analyze_on_stream_end: true,
        }
    }
}

/// Coach statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoachStats {
    pub total_tips: u64,
    pub acknowledged_tips: u64,
    pub actionable_tips: u64,
    pub streams_analyzed: u64,
    pub total_stream_time: u64,
}

/// AI coach engine state
pub struct AiCoachEngine {
    pub config: CoachConfig,
    pub tips: Vec<CoachTip>,
    pub analytics: Vec<StreamAnalytics>,
    pub stats: CoachStats,
    pub current_stream: Option<StreamAnalytics>,
}

impl AiCoachEngine {
    pub fn new() -> Self {
        Self {
            config: CoachConfig::default(),
            tips: Vec::new(),
            analytics: Vec::new(),
            stats: CoachStats {
                total_tips: 0,
                acknowledged_tips: 0,
                actionable_tips: 0,
                streams_analyzed: 0,
                total_stream_time: 0,
            },
            current_stream: None,
        }
    }

    /// Generate coach tip
    pub fn generate_tip(&mut self, tip_type: CoachTipType, title: String, description: String, priority: CoachTipPriority, actionable: bool) -> Result<CoachTip, String> {
        if !self.config.enabled {
            return Err("Coach disabled".to_string());
        }
        
        if priority < self.config.min_priority {
            return Err("Priority too low".to_string());
        }
        
        let tip = CoachTip {
            id: uuid::Uuid::new_v4().to_string(),
            tip_type,
            priority,
            title,
            description,
            actionable,
            action_suggestion: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            acknowledged: false,
        };
        
        self.tips.push(tip.clone());
        self.stats.total_tips += 1;
        
        if actionable {
            self.stats.actionable_tips += 1;
        }
        
        Ok(tip)
    }

    /// Acknowledge tip
    pub fn acknowledge_tip(&mut self, tip_id: String) -> Result<(), String> {
        if let Some(tip) = self.tips.iter_mut().find(|t| t.id == tip_id) {
            tip.acknowledged = true;
            self.stats.acknowledged_tips += 1;
            Ok(())
        } else {
            Err("Tip not found".to_string())
        }
    }

    /// Get all tips
    pub fn get_tips(&self) -> Vec<CoachTip> {
        if self.config.show_actionable_only {
            self.tips.iter().filter(|t| t.actionable).cloned().collect()
        } else {
            self.tips.clone()
        }
    }

    /// Get recent tips
    pub fn get_recent_tips(&self, count: usize) -> Vec<CoachTip> {
        let tips = if self.config.show_actionable_only {
            self.tips.iter().filter(|t| t.actionable).cloned().collect()
        } else {
            self.tips.clone()
        };
        
        let len = tips.len();
        if count >= len {
            tips
        } else {
            tips[len - count..].to_vec()
        }
    }

    /// Start stream analytics
    pub fn start_stream_analytics(&mut self) -> Result<(), String> {
        if self.current_stream.is_some() {
            return Err("Stream already in progress".to_string());
        }
        
        let stream = StreamAnalytics {
            stream_id: uuid::Uuid::new_v4().to_string(),
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            end_time: None,
            duration: 0,
            peak_viewers: 0,
            average_viewers: 0.0,
            new_followers: 0,
            new_subscribers: 0,
            total_donations: 0.0,
            chat_messages: 0,
            unique_chatters: 0,
            engagement_rate: 0.0,
        };
        
        self.current_stream = Some(stream);
        Ok(())
    }

    /// Update stream analytics
    pub fn update_stream_analytics(&mut self, viewers: u32, chat_messages: u64, unique_chatters: u32) -> Result<(), String> {
        if let Some(stream) = &mut self.current_stream {
            if viewers > stream.peak_viewers {
                stream.peak_viewers = viewers;
            }
            stream.chat_messages = chat_messages;
            stream.unique_chatters = unique_chatters;
            
            // Calculate engagement rate
            if viewers > 0 {
                stream.engagement_rate = (chat_messages as f32) / (viewers as f32);
            }
            
            Ok(())
        } else {
            Err("No stream in progress".to_string())
        }
    }

    /// End stream analytics
    pub fn end_stream_analytics(&mut self) -> Result<StreamAnalytics, String> {
        if let Some(mut stream) = self.current_stream.take() {
            stream.end_time = Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs());
            stream.duration = stream.end_time.unwrap() - stream.start_time;
            
            self.analytics.push(stream.clone());
            self.stats.streams_analyzed += 1;
            self.stats.total_stream_time += stream.duration;
            
            // Auto-analyze if enabled
            if self.config.auto_analyze {
                self.analyze_stream(&stream);
            }
            
            Ok(stream)
        } else {
            Err("No stream in progress".to_string())
        }
    }

    /// Analyze stream and generate tips
    fn analyze_stream(&mut self, stream: &StreamAnalytics) {
        // Analyze engagement
        if stream.engagement_rate < 0.1 {
            let _ = self.generate_tip(
                CoachTipType::Engagement,
                "Low Chat Engagement".to_string(),
                "Your chat engagement rate is below 10%. Try asking questions, running polls, or encouraging chat interaction.".to_string(),
                CoachTipPriority::High,
                true,
            );
        }
        
        // Analyze viewership
        if stream.average_viewers < 10.0 {
            let _ = self.generate_tip(
                CoachTipType::Engagement,
                "Low Viewer Count".to_string(),
                "Your average viewer count is low. Consider improving your stream title, thumbnail, or promotion strategy.".to_string(),
                CoachTipPriority::Medium,
                true,
            );
        }
        
        // Analyze duration
        if stream.duration < 3600 {
            let _ = self.generate_tip(
                CoachTipType::Schedule,
                "Short Stream Duration".to_string(),
                "Your stream was less than 1 hour. Longer streams (3-4 hours) tend to perform better on most platforms.".to_string(),
                CoachTipPriority::Low,
                true,
            );
        }
        
        // Analyze monetization
        if stream.total_donations == 0.0 && stream.new_subscribers == 0 {
            let _ = self.generate_tip(
                CoachTipType::Monetization,
                "No Monetization".to_string(),
                "You didn't receive any donations or subscriptions this stream. Consider setting up donation goals or subscription tiers.".to_string(),
                CoachTipPriority::Medium,
                true,
            );
        }
    }

    /// Get all analytics
    pub fn get_analytics(&self) -> Vec<StreamAnalytics> {
        self.analytics.clone()
    }

    /// Update config
    pub fn update_config(&mut self, config: CoachConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> CoachConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> CoachStats {
        self.stats.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_coach_config(state: tauri::State<AppState>) -> CoachConfig {
    state.ai_coach_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_coach_config(
    config: CoachConfig,
    state: tauri::State<AppState>,
) {
    state.ai_coach_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn generate_coach_tip(
    tip_type: String,
    title: String,
    description: String,
    priority: String,
    actionable: bool,
    state: tauri::State<AppState>,
) -> Result<CoachTip, String> {
    let tip_type = match tip_type.as_str() {
        "engagement" => CoachTipType::Engagement,
        "content" => CoachTipType::Content,
        "technical" => CoachTipType::Technical,
        "monetization" => CoachTipType::Monetization,
        "schedule" => CoachTipType::Schedule,
        "custom" => CoachTipType::Custom,
        _ => return Err("Invalid tip type".to_string()),
    };
    
    let priority = match priority.as_str() {
        "low" => CoachTipPriority::Low,
        "medium" => CoachTipPriority::Medium,
        "high" => CoachTipPriority::High,
        "critical" => CoachTipPriority::Critical,
        _ => return Err("Invalid priority".to_string()),
    };
    
    state.ai_coach_engine.lock().unwrap().generate_tip(tip_type, title, description, priority, actionable)
}

#[tauri::command]
fn acknowledge_coach_tip(
    tip_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().acknowledge_tip(tip_id)
}

#[tauri::command]
fn get_coach_tips(state: tauri::State<AppState>) -> Vec<CoachTip> {
    state.ai_coach_engine.lock().unwrap().get_tips()
}

#[tauri::command]
fn get_recent_coach_tips(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<CoachTip> {
    state.ai_coach_engine.lock().unwrap().get_recent_tips(count)
}

#[tauri::command]
fn start_stream_analytics(state: tauri::State<AppState>) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().start_stream_analytics()
}

#[tauri::command]
fn update_stream_analytics(
    viewers: u32,
    chat_messages: u64,
    unique_chatters: u32,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.ai_coach_engine.lock().unwrap().update_stream_analytics(viewers, chat_messages, unique_chatters)
}

#[tauri::command]
fn end_stream_analytics(state: tauri::State<AppState>) -> Result<StreamAnalytics, String> {
    state.ai_coach_engine.lock().unwrap().end_stream_analytics()
}

#[tauri::command]
fn get_stream_analytics(state: tauri::State<AppState>) -> Vec<StreamAnalytics> {
    state.ai_coach_engine.lock().unwrap().get_analytics()
}

#[tauri::command]
fn get_coach_stats(state: tauri::State<AppState>) -> CoachStats {
    state.ai_coach_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_coach_tip_types() -> Vec<String> {
    vec![
        "engagement".to_string(),
        "content".to_string(),
        "technical".to_string(),
        "monetization".to_string(),
        "schedule".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_coach_tip_priorities() -> Vec<String> {
    vec![
        "low".to_string(),
        "medium".to_string(),
        "high".to_string(),
        "critical".to_string(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ai_coach_engine_creation() {
        let engine = AICoachEngine::new();
        assert_eq!(engine.tips.len(), 0);
    }

    #[test]
    fn test_coach_tip() {
        let tip = CoachTip {
            id: "tip_1".to_string(),
            tip_type: TipType::Engagement,
            priority: TipPriority::Medium,
            message: "Consider asking chat a question".to_string(),
            created_at: SystemTime::now(),
            acknowledged: false,
        };

        assert_eq!(tip.tip_type, TipType::Engagement);
        assert!(!tip.acknowledged);
    }

    #[test]
    fn test_stream_analytics() {
        let analytics = StreamAnalytics {
            stream_id: "stream_1".to_string(),
            started_at: SystemTime::now(),
            ended_at: Some(SystemTime::now()),
            avg_viewers: 150.0,
            peak_viewers: 250,
            total_chat_messages: 5000,
            unique_chatters: 120,
            avg_chat_rate: 25.0,
        };

        assert_eq!(analytics.stream_id, "stream_1");
        assert_eq!(analytics.peak_viewers, 250);
    }

    #[test]
    fn test_coach_stats() {
        let stats = CoachStats {
            total_tips: 50,
            acknowledged_tips: 30,
            dismissed_tips: 10,
            improvement_score: 15.5,
            streams_analyzed: 25,
        };

        assert_eq!(stats.total_tips, 50);
        assert_eq!(stats.streams_analyzed, 25);
    }

    #[test]
    fn test_tip_type() {
        assert_eq!(TipType::Engagement.to_string(), "engagement");
        assert_eq!(TipType::Technical.to_string(), "technical");
    }

    #[test]
    fn test_tip_priority() {
        assert_eq!(TipPriority::Low.to_string(), "low");
        assert_eq!(TipPriority::High.to_string(), "high");
    }

    #[test]
    fn test_coach_tip_types_list() {
        let types = get_coach_tip_types();
        assert!(!types.is_empty());
        assert!(types.contains(&"engagement".to_string()));
    }
}
