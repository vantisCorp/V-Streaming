use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// REAL-TIME TRANSLATION - Live Translation for Chat and Captions
// ============================================================================

/// Translation language
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TranslationLanguage {
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
    Dutch,
    Polish,
    Turkish,
    Vietnamese,
    Thai,
    Indonesian,
    Custom,
}

/// Translation service
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TranslationService {
    Google,
    DeepL,
    Microsoft,
    Amazon,
    Custom,
}

/// Translation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub id: String,
    pub original_text: String,
    pub translated_text: String,
    pub source_language: TranslationLanguage,
    pub target_language: TranslationLanguage,
    pub confidence: f32,
    pub timestamp: u64,
}

/// Translation config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationConfig {
    pub enabled: bool,
    pub service: TranslationService,
    pub source_language: TranslationLanguage,
    pub target_language: TranslationLanguage,
    pub auto_detect: bool,
    pub translate_chat: bool,
    pub translate_captions: bool,
    pub show_original: bool,
    pub api_key: Option<String>,
}

impl Default for TranslationConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            service: TranslationService::Google,
            source_language: TranslationLanguage::English,
            target_language: TranslationLanguage::Spanish,
            auto_detect: true,
            translate_chat: true,
            translate_captions: true,
            show_original: true,
            api_key: None,
        }
    }
}

/// Translation statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationStats {
    pub total_translations: u64,
    pub chat_translations: u64,
    pub caption_translations: u64,
    pub characters_translated: u64,
    pub average_confidence: f32,
}

/// Translation engine state
pub struct TranslationEngine {
    pub config: TranslationConfig,
    pub translations: Vec<TranslationResult>,
    pub stats: TranslationStats,
}

impl TranslationEngine {
    pub fn new() -> Self {
        Self {
            config: TranslationConfig::default(),
            translations: Vec::new(),
            stats: TranslationStats {
                total_translations: 0,
                chat_translations: 0,
                caption_translations: 0,
                characters_translated: 0,
                average_confidence: 0.0,
            },
        }
    }

    /// Translate text
    pub fn translate(&mut self, text: String, source_lang: Option<TranslationLanguage>, is_chat: bool) -> Result<TranslationResult, String> {
        if !self.config.enabled {
            return Err("Translation disabled".to_string());
        }
        
        let source_language = source_lang.unwrap_or(self.config.source_language.clone());
        let target_language = self.config.target_language.clone();
        
        // In real implementation, would call translation API
        // For now, simulate translation
        let translated_text = format!("[{}] {}", target_language, text);
        
        let result = TranslationResult {
            id: uuid::Uuid::new_v4().to_string(),
            original_text: text.clone(),
            translated_text,
            source_language,
            target_language,
            confidence: 0.9,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        self.translations.push(result.clone());
        self.stats.total_translations += 1;
        self.stats.characters_translated += text.len() as u64;
        
        if is_chat {
            self.stats.chat_translations += 1;
        } else {
            self.stats.caption_translations += 1;
        }
        
        // Update average confidence
        let total_confidence: f32 = self.translations.iter().map(|t| t.confidence).sum();
        self.stats.average_confidence = total_confidence / self.translations.len() as f32;
        
        Ok(result)
    }

    /// Get all translations
    pub fn get_translations(&self) -> Vec<TranslationResult> {
        self.translations.clone()
    }

    /// Get recent translations
    pub fn get_recent_translations(&self, count: usize) -> Vec<TranslationResult> {
        let len = self.translations.len();
        if count >= len {
            self.translations.clone()
        } else {
            self.translations[len - count..].to_vec()
        }
    }

    /// Clear translations
    pub fn clear_translations(&mut self) {
        self.translations.clear();
        self.stats = TranslationStats {
            total_translations: 0,
            chat_translations: 0,
            caption_translations: 0,
            characters_translated: 0,
            average_confidence: 0.0,
        };
    }

    /// Update config
    pub fn update_config(&mut self, config: TranslationConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> TranslationConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> TranslationStats {
        self.stats.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_translation_config(state: tauri::State<AppState>) -> TranslationConfig {
    state.translation_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_translation_config(
    config: TranslationConfig,
    state: tauri::State<AppState>,
) {
    state.translation_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn translate_text(
    text: String,
    source_language: Option<String>,
    is_chat: bool,
    state: tauri::State<AppState>,
) -> Result<TranslationResult, String> {
    let source_lang = if let Some(lang) = source_language {
        Some(match lang.as_str() {
            "english" => TranslationLanguage::English,
            "spanish" => TranslationLanguage::Spanish,
            "french" => TranslationLanguage::French,
            "german" => TranslationLanguage::German,
            "italian" => TranslationLanguage::Italian,
            "portuguese" => TranslationLanguage::Portuguese,
            "russian" => TranslationLanguage::Russian,
            "japanese" => TranslationLanguage::Japanese,
            "korean" => TranslationLanguage::Korean,
            "chinese" => TranslationLanguage::Chinese,
            "arabic" => TranslationLanguage::Arabic,
            "hindi" => TranslationLanguage::Hindi,
            "dutch" => TranslationLanguage::Dutch,
            "polish" => TranslationLanguage::Polish,
            "turkish" => TranslationLanguage::Turkish,
            "vietnamese" => TranslationLanguage::Vietnamese,
            "thai" => TranslationLanguage::Thai,
            "indonesian" => TranslationLanguage::Indonesian,
            "custom" => TranslationLanguage::Custom,
            _ => return Err("Invalid language".to_string()),
        })
    } else {
        None
    };
    
    state.translation_engine.lock().unwrap().translate(text, source_lang, is_chat)
}

#[tauri::command]
fn get_translations(state: tauri::State<AppState>) -> Vec<TranslationResult> {
    state.translation_engine.lock().unwrap().get_translations()
}

#[tauri::command]
fn get_recent_translations(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<TranslationResult> {
    state.translation_engine.lock().unwrap().get_recent_translations(count)
}

#[tauri::command]
fn clear_translations(state: tauri::State<AppState>) {
    state.translation_engine.lock().unwrap().clear_translations();
}

#[tauri::command]
fn get_translation_stats(state: tauri::State<AppState>) -> TranslationStats {
    state.translation_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_translation_languages() -> Vec<String> {
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
        "dutch".to_string(),
        "polish".to_string(),
        "turkish".to_string(),
        "vietnamese".to_string(),
        "thai".to_string(),
        "indonesian".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_translation_services() -> Vec<String> {
    vec![
        "google".to_string(),
        "deepl".to_string(),
        "microsoft".to_string(),
        "amazon".to_string(),
        "custom".to_string(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_translation_engine_creation() {
        let engine = TranslationEngine::new();
        assert_eq!(engine.translations.len(), 0);
    }

    #[test]
    fn test_translation_result() {
        let result = TranslationResult {
            id: "trans_1".to_string(),
            original_text: "Hello world".to_string(),
            translated_text: "Hola mundo".to_string(),
            source_language: "english".to_string(),
            target_language: "spanish".to_string(),
            timestamp: SystemTime::now(),
        };

        assert_eq!(result.original_text, "Hello world");
        assert_eq!(result.translated_text, "Hola mundo");
    }

    #[test]
    fn test_translation_config() {
        let config = TranslationConfig {
            enabled: true,
            auto_translate: true,
            source_language: "english".to_string(),
            target_languages: vec!["spanish".to_string(), "french".to_string()],
            service: TranslationService::Google,
        };

        assert!(config.enabled);
        assert_eq!(config.source_language, "english");
    }

    #[test]
    fn test_translation_stats() {
        let stats = TranslationStats {
            total_translations: 1000,
            translations_by_language: vec![
                ("spanish".to_string(), 500),
                ("french".to_string(), 300),
            ],
            avg_latency_ms: 150.0,
        };

        assert_eq!(stats.total_translations, 1000);
        assert_eq!(stats.avg_latency_ms, 150.0);
    }

    #[test]
    fn test_translation_service() {
        assert_eq!(TranslationService::Google.to_string(), "google");
        assert_eq!(TranslationService::DeepL.to_string(), "deepl");
    }

    #[test]
    fn test_translation_languages_list() {
        let languages = get_translation_languages();
        assert!(!languages.is_empty());
        assert!(languages.contains(&"english".to_string()));
        assert!(languages.contains(&"spanish".to_string()));
    }

    #[test]
    fn test_translation_services_list() {
        let services = get_translation_services();
        assert!(!services.is_empty());
        assert!(services.contains(&"google".to_string()));
        assert!(services.contains(&"deepl".to_string()));
    }
}
