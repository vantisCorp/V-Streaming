use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// MULTICHAT ENGINE - Unified Chat System for Multiple Platforms
// ============================================================================

/// Chat platform types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChatPlatform {
    Twitch,
    YouTube,
    Kick,
    Facebook,
    TikTok,
    Trovo,
    DLive,
}

impl std::fmt::Display for ChatPlatform {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChatPlatform::Twitch => write!(f, "Twitch"),
            ChatPlatform::YouTube => write!(f, "YouTube"),
            ChatPlatform::Kick => write!(f, "Kick"),
            ChatPlatform::Facebook => write!(f, "Facebook"),
            ChatPlatform::TikTok => write!(f, "TikTok"),
            ChatPlatform::Trovo => write!(f, "Trovo"),
            ChatPlatform::DLive => write!(f, "DLive"),
        }
    }
}

impl std::str::FromStr for ChatPlatform {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "twitch" => Ok(ChatPlatform::Twitch),
            "youtube" => Ok(ChatPlatform::YouTube),
            "kick" => Ok(ChatPlatform::Kick),
            "facebook" => Ok(ChatPlatform::Facebook),
            "tiktok" => Ok(ChatPlatform::TikTok),
            "trovo" => Ok(ChatPlatform::Trovo),
            "dlive" => Ok(ChatPlatform::DLive),
            _ => Err(format!("Unknown chat platform: {}", s)),
        }
    }
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub platform: ChatPlatform,
    pub username: String,
    pub display_name: String,
    pub message: String,
    pub timestamp: u64,
    pub badges: Vec<String>,
    pub emotes: Vec<ChatEmote>,
    pub color: Option<String>,
    pub is_moderator: bool,
    pub is_vip: bool,
    pub is_subscriber: bool,
    pub is_owner: bool,
}

/// Chat emote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatEmote {
    pub id: String,
    pub name: String,
    pub url: String,
    pub position: (usize, usize),
}

/// Chat user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatUser {
    pub username: String,
    pub display_name: String,
    pub platform: ChatPlatform,
    pub color: Option<String>,
    pub badges: Vec<String>,
    pub is_moderator: bool,
    pub is_vip: bool,
    pub is_subscriber: bool,
    pub is_owner: bool,
}

/// Chat statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatStats {
    pub total_messages: u64,
    pub unique_users: u64,
    pub messages_per_minute: f32,
    pub active_users: u64,
    pub emote_count: u64,
}

/// Chat filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatFilter {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub filter_type: ChatFilterType,
    pub pattern: String,
    pub action: ChatFilterAction,
}

/// Chat filter types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChatFilterType {
    Profanity,
    Spam,
    Links,
    Caps,
    EmoteSpam,
    Custom,
}

/// Chat filter actions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChatFilterAction {
    Hide,
    Replace,
    Timeout,
    Ban,
}

/// Chat command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatCommand {
    pub name: String,
    pub aliases: Vec<String>,
    pub description: String,
    pub permission: ChatCommandPermission,
    pub cooldown: u32,
    pub enabled: bool,
}

/// Chat command permissions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChatCommandPermission {
    Everyone,
    Subscriber,
    Moderator,
    VIP,
    Owner,
}

/// Multichat configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultichatConfig {
    pub platforms: Vec<ChatPlatform>,
    pub show_platform_badges: bool,
    pub show_user_colors: bool,
    pub show_emotes: bool,
    pub message_limit: u32,
    pub auto_scroll: bool,
    pub sound_enabled: bool,
    pub sound_volume: f32,
}

impl Default for MultichatConfig {
    fn default() -> Self {
        Self {
            platforms: vec![
                ChatPlatform::Twitch,
                ChatPlatform::YouTube,
                ChatPlatform::Kick,
            ],
            show_platform_badges: true,
            show_user_colors: true,
            show_emotes: true,
            message_limit: 100,
            auto_scroll: true,
            sound_enabled: true,
            sound_volume: 0.5,
        }
    }
}

/// Multichat engine state
pub struct MultichatEngine {
    pub config: MultichatConfig,
    pub messages: Vec<ChatMessage>,
    pub users: HashMap<String, ChatUser>,
    pub filters: Vec<ChatFilter>,
    pub commands: Vec<ChatCommand>,
    pub stats: ChatStats,
    pub connected_platforms: Vec<ChatPlatform>,
}

impl MultichatEngine {
    pub fn new() -> Self {
        Self {
            config: MultichatConfig::default(),
            messages: Vec::new(),
            users: HashMap::new(),
            filters: Vec::new(),
            commands: Self::get_default_commands(),
            stats: ChatStats {
                total_messages: 0,
                unique_users: 0,
                messages_per_minute: 0.0,
                active_users: 0,
                emote_count: 0,
            },
            connected_platforms: Vec::new(),
        }
    }

    /// Connect to chat platform
    pub fn connect_platform(&mut self, platform: ChatPlatform) -> Result<(), String> {
        if self.connected_platforms.contains(&platform) {
            return Err(format!("Already connected to {:?}", platform));
        }

        self.connected_platforms.push(platform);
        Ok(())
    }

    /// Disconnect from chat platform
    pub fn disconnect_platform(&mut self, platform: ChatPlatform) -> Result<(), String> {
        if !self.connected_platforms.contains(&platform) {
            return Err(format!("Not connected to {:?}", platform));
        }

        self.connected_platforms.retain(|p| p != &platform);
        Ok(())
    }

    /// Add chat message
    pub fn add_message(&mut self, message: ChatMessage) -> Result<(), String> {
        // Apply filters
        for filter in &self.filters {
            if filter.enabled && self.apply_filter(&message, filter) {
                match filter.action {
                    ChatFilterAction::Hide => return Ok(()),
                    ChatFilterAction::Replace => {
                        // Replace message content
                        // In production, this would replace the message
                    }
                    ChatFilterAction::Timeout => {
                        // Timeout user
                        // In production, this would timeout the user
                    }
                    ChatFilterAction::Ban => {
                        // Ban user
                        // In production, this would ban the user
                    }
                }
            }
        }

        // Add message
        self.messages.push(message.clone());

        // Limit messages
        if self.messages.len() > self.config.message_limit as usize {
            self.messages.remove(0);
        }

        // Update stats
        self.stats.total_messages += 1;
        self.stats.emote_count += message.emotes.len() as u64;

        // Add user
        let user_key = format!("{}:{}", message.platform, message.username);
        if !self.users.contains_key(&user_key) {
            self.users.insert(
                user_key.clone(),
                ChatUser {
                    username: message.username.clone(),
                    display_name: message.display_name.clone(),
                    platform: message.platform.clone(),
                    color: message.color.clone(),
                    badges: message.badges.clone(),
                    is_moderator: message.is_moderator,
                    is_vip: message.is_vip,
                    is_subscriber: message.is_subscriber,
                    is_owner: message.is_owner,
                },
            );
            self.stats.unique_users += 1;
        }

        Ok(())
    }

    /// Apply filter to message
    fn apply_filter(&self, message: &ChatMessage, filter: &ChatFilter) -> bool {
        match filter.filter_type {
            ChatFilterType::Profanity => {
                // Check for profanity
                message.message.to_lowercase().contains(&filter.pattern.to_lowercase())
            }
            ChatFilterType::Spam => {
                // Check for spam patterns
                message.message.to_lowercase().contains(&filter.pattern.to_lowercase())
            }
            ChatFilterType::Links => {
                // Check for links
                message.message.contains("http://") || message.message.contains("https://")
            }
            ChatFilterType::Caps => {
                // Check for excessive caps
                let caps_count = message.message.chars().filter(|c| c.is_uppercase()).count();
                caps_count > message.message.len() / 2
            }
            ChatFilterType::EmoteSpam => {
                // Check for emote spam
                message.emotes.len() > 10
            }
            ChatFilterType::Custom => {
                // Custom pattern
                message.message.to_lowercase().contains(&filter.pattern.to_lowercase())
            }
        }
    }

    /// Get default commands
    fn get_default_commands() -> Vec<ChatCommand> {
        vec![
            ChatCommand {
                name: "!uptime".to_string(),
                aliases: vec!["!time".to_string()],
                description: "Shows stream uptime".to_string(),
                permission: ChatCommandPermission::Everyone,
                cooldown: 10,
                enabled: true,
            },
            ChatCommand {
                name: "!commands".to_string(),
                aliases: vec!["!help".to_string()],
                description: "Shows available commands".to_string(),
                permission: ChatCommandPermission::Everyone,
                cooldown: 30,
                enabled: true,
            },
            ChatCommand {
                name: "!song".to_string(),
                aliases: vec!["!music".to_string()],
                description: "Shows current song".to_string(),
                permission: ChatCommandPermission::Everyone,
                cooldown: 10,
                enabled: true,
            },
            ChatCommand {
                name: "!social".to_string(),
                aliases: vec!["!links".to_string()],
                description: "Shows social media links".to_string(),
                permission: ChatCommandPermission::Everyone,
                cooldown: 30,
                enabled: true,
            },
            ChatCommand {
                name: "!mod".to_string(),
                aliases: vec![],
                description: "Moderator commands".to_string(),
                permission: ChatCommandPermission::Moderator,
                cooldown: 0,
                enabled: true,
            },
        ]
    }

    /// Add chat filter
    pub fn add_filter(&mut self, filter: ChatFilter) -> Result<(), String> {
        self.filters.push(filter);
        Ok(())
    }

    /// Remove chat filter
    pub fn remove_filter(&mut self, filter_id: String) -> Result<(), String> {
        self.filters.retain(|f| f.id != filter_id);
        Ok(())
    }

    /// Update chat filter
    pub fn update_filter(&mut self, filter_id: String, enabled: bool) -> Result<(), String> {
        if let Some(filter) = self.filters.iter_mut().find(|f| f.id == filter_id) {
            filter.enabled = enabled;
            Ok(())
        } else {
            Err("Filter not found".to_string())
        }
    }

    /// Clear chat messages
    pub fn clear_messages(&mut self) {
        self.messages.clear();
    }

    /// Update configuration
    pub fn update_config(&mut self, config: MultichatConfig) {
        self.config = config;
    }

    /// Get messages for platform
    pub fn get_messages_for_platform(&self, platform: ChatPlatform) -> Vec<ChatMessage> {
        self.messages
            .iter()
            .filter(|m| m.platform == platform)
            .cloned()
            .collect()
    }

    /// Get recent messages
    pub fn get_recent_messages(&self, count: usize) -> Vec<ChatMessage> {
        let start = if self.messages.len() > count {
            self.messages.len() - count
        } else {
            0
        };
        self.messages[start..].to_vec()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get available chat platforms
#[tauri::command]
pub fn get_chat_platforms() -> Vec<String> {
    vec![
        "Twitch".to_string(),
        "YouTube".to_string(),
        "Kick".to_string(),
        "Facebook".to_string(),
        "TikTok".to_string(),
        "Trovo".to_string(),
        "DLive".to_string(),
    ]
}

/// Connect to chat platform
#[tauri::command]
pub fn connect_chat_platform(
    platform: String,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let platform_enum = match platform.to_lowercase().as_str() {
        "twitch" => ChatPlatform::Twitch,
        "youtube" => ChatPlatform::YouTube,
        "kick" => ChatPlatform::Kick,
        "facebook" => ChatPlatform::Facebook,
        "tiktok" => ChatPlatform::TikTok,
        "trovo" => ChatPlatform::Trovo,
        "dlive" => ChatPlatform::DLive,
        _ => return Err("Unknown platform".to_string()),
    };

    let mut engine = state.lock().unwrap();
    engine.connect_platform(platform_enum)
}

/// Disconnect from chat platform
#[tauri::command]
pub fn disconnect_chat_platform(
    platform: String,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let platform_enum = match platform.to_lowercase().as_str() {
        "twitch" => ChatPlatform::Twitch,
        "youtube" => ChatPlatform::YouTube,
        "kick" => ChatPlatform::Kick,
        "facebook" => ChatPlatform::Facebook,
        "tiktok" => ChatPlatform::TikTok,
        "trovo" => ChatPlatform::Trovo,
        "dlive" => ChatPlatform::DLive,
        _ => return Err("Unknown platform".to_string()),
    };

    let mut engine = state.lock().unwrap();
    engine.disconnect_platform(platform_enum)
}

/// Get connected platforms
#[tauri::command]
pub fn get_connected_platforms(state: State<Arc<Mutex<MultichatEngine>>>) -> Vec<String> {
    let engine = state.lock().unwrap();
    engine
        .connected_platforms
        .iter()
        .map(|p| format!("{:?}", p))
        .collect()
}

/// Get chat messages
#[tauri::command]
pub fn get_chat_messages(state: State<Arc<Mutex<MultichatEngine>>>) -> Vec<ChatMessage> {
    let engine = state.lock().unwrap();
    engine.messages.clone()
}

/// Get recent chat messages
#[tauri::command]
pub fn get_recent_chat_messages(
    count: usize,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Vec<ChatMessage> {
    let engine = state.lock().unwrap();
    engine.get_recent_messages(count)
}

/// Add chat message
#[tauri::command]
pub fn add_chat_message(
    message: ChatMessage,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.add_message(message)
}

/// Clear chat messages
#[tauri::command]
pub fn clear_chat_messages(state: State<Arc<Mutex<MultichatEngine>>>) {
    let mut engine = state.lock().unwrap();
    engine.clear_messages();
}

/// Get chat statistics
#[tauri::command]
pub fn get_chat_stats(state: State<Arc<Mutex<MultichatEngine>>>) -> ChatStats {
    let engine = state.lock().unwrap();
    engine.stats.clone()
}

/// Get multichat configuration
#[tauri::command]
pub fn get_multichat_config(state: State<Arc<Mutex<MultichatEngine>>>) -> MultichatConfig {
    let engine = state.lock().unwrap();
    engine.config.clone()
}

/// Update multichat configuration
#[tauri::command]
pub fn update_multichat_config(
    config: MultichatConfig,
    state: State<Arc<Mutex<MultichatEngine>>>,
) {
    let mut engine = state.lock().unwrap();
    engine.update_config(config);
}

/// Get chat filters
#[tauri::command]
pub fn get_chat_filters(state: State<Arc<Mutex<MultichatEngine>>>) -> Vec<ChatFilter> {
    let engine = state.lock().unwrap();
    engine.filters.clone()
}

/// Add chat filter
#[tauri::command]
pub fn add_chat_filter(
    filter: ChatFilter,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.add_filter(filter)
}

/// Remove chat filter
#[tauri::command]
pub fn remove_chat_filter(
    filter_id: String,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.remove_filter(filter_id)
}

/// Update chat filter
#[tauri::command]
pub fn update_chat_filter(
    filter_id: String,
    enabled: bool,
    state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.update_filter(filter_id, enabled)
}

/// Get chat commands
#[tauri::command]
pub fn get_chat_commands(state: State<Arc<Mutex<MultichatEngine>>>) -> Vec<ChatCommand> {
    let engine = state.lock().unwrap();
    engine.commands.clone()
}

/// Get chat users
#[tauri::command]
pub fn get_chat_users(state: State<Arc<Mutex<MultichatEngine>>>) -> Vec<ChatUser> {
    let engine = state.lock().unwrap();
    engine.users.values().cloned().collect()
}

/// Send chat message
#[tauri::command]
pub fn send_chat_message(
    _platform: String,
    _message: String,
    _state: State<Arc<Mutex<MultichatEngine>>>,
) -> Result<(), String> {
    // In production, this would send the message to the platform
    Ok(())
}

/// Get chat filter types
#[tauri::command]
pub fn get_chat_filter_types() -> Vec<String> {
    vec![
        "Profanity".to_string(),
        "Spam".to_string(),
        "Links".to_string(),
        "Caps".to_string(),
        "EmoteSpam".to_string(),
        "Custom".to_string(),
    ]
}

/// Get chat filter actions
#[tauri::command]
pub fn get_chat_filter_actions() -> Vec<String> {
    vec![
        "Hide".to_string(),
        "Replace".to_string(),
        "Timeout".to_string(),
        "Ban".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_message_creation() {
        let msg = ChatMessage {
            id: "msg123".to_string(),
            platform: ChatPlatform::Twitch,
            username: "testuser".to_string(),
            display_name: "TestUser".to_string(),
            message: "Hello chat!".to_string(),
            timestamp: 1234567890,
            badges: vec!["subscriber".to_string()],
            emotes: Vec::new(),
            color: Some("#FF0000".to_string()),
            is_moderator: false,
            is_vip: false,
            is_subscriber: true,
            is_owner: false,
        };

        assert_eq!(msg.id, "msg123");
        assert_eq!(msg.platform, ChatPlatform::Twitch);
        assert_eq!(msg.message, "Hello chat!");
        assert!(msg.is_subscriber);
    }

    #[test]
    fn test_chat_emote_creation() {
        let emote = ChatEmote {
            id: "emote1".to_string(),
            name: "Kappa".to_string(),
            url: "https://example.com/kappa.png".to_string(),
            position: (0, 5),
        };

        assert_eq!(emote.id, "emote1");
        assert_eq!(emote.name, "Kappa");
        assert_eq!(emote.position, (0, 5));
    }

    #[test]
    fn test_chat_user_creation() {
        let user = ChatUser {
            username: "testuser".to_string(),
            display_name: "TestUser".to_string(),
            platform: ChatPlatform::YouTube,
            color: Some("#00FF00".to_string()),
            badges: vec!["verified".to_string()],
            is_moderator: false,
            is_vip: false,
            is_subscriber: false,
            is_owner: false,
        };

        assert_eq!(user.username, "testuser");
        assert_eq!(user.platform, ChatPlatform::YouTube);
        assert_eq!(user.badges.len(), 1);
    }

    #[test]
    fn test_chat_stats_creation() {
        let stats = ChatStats {
            total_messages: 1000,
            unique_users: 50,
            messages_per_minute: 25.5,
            active_users: 20,
            emote_count: 500,
        };

        assert_eq!(stats.total_messages, 1000);
        assert_eq!(stats.messages_per_minute, 25.5);
    }

    #[test]
    fn test_chat_filter_creation() {
        let filter = ChatFilter {
            id: "filter1".to_string(),
            name: "Block Links".to_string(),
            enabled: true,
            filter_type: ChatFilterType::Links,
            pattern: "https?://".to_string(),
            action: ChatFilterAction::Hide,
        };

        assert_eq!(filter.id, "filter1");
        assert_eq!(filter.filter_type, ChatFilterType::Links);
        assert!(filter.enabled);
    }

    #[test]
    fn test_chat_platform_variants() {
        let platforms = vec![
            ChatPlatform::Twitch,
            ChatPlatform::YouTube,
            ChatPlatform::Kick,
            ChatPlatform::Facebook,
            ChatPlatform::TikTok,
            ChatPlatform::Trovo,
            ChatPlatform::DLive,
        ];

        assert_eq!(platforms.len(), 7);
        assert_eq!(platforms[0], ChatPlatform::Twitch);
    }

    #[test]
    fn test_chat_filter_type_variants() {
        let types = vec![
            ChatFilterType::Profanity,
            ChatFilterType::Spam,
            ChatFilterType::Links,
            ChatFilterType::Caps,
            ChatFilterType::EmoteSpam,
            ChatFilterType::Custom,
        ];

        assert_eq!(types.len(), 6);
        assert_eq!(types[0], ChatFilterType::Profanity);
    }
}
