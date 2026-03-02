use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// GAME STATE INTEGRATION - CS2, LoL, Valorant, etc.
// ============================================================================

/// Game type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GameType {
    CS2,
    LoL,
    Valorant,
    Dota2,
    Overwatch2,
    ApexLegends,
    Fortnite,
    Minecraft,
    Custom,
}

/// Game state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GameState {
    Menu,
    InGame,
    Paused,
    Loading,
    Ended,
}

/// Player stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerStats {
    pub username: String,
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub score: u32,
    pub level: u32,
    pub health: f32,
    pub armor: f32,
    pub money: Option<u32>,
}

/// Team stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamStats {
    pub name: String,
    pub score: u32,
    pub rounds_won: u32,
    pub players: Vec<PlayerStats>,
}

/// Game data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameData {
    pub game_type: GameType,
    pub game_state: GameState,
    pub map_name: Option<String>,
    pub round: Option<u32>,
    pub teams: Vec<TeamStats>,
    pub local_player: Option<PlayerStats>,
    pub match_time: Option<u64>,
    pub is_spectating: bool,
}

/// Game event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameEvent {
    pub id: String,
    pub event_type: GameEventType,
    pub description: String,
    pub timestamp: u64,
    pub data: HashMap<String, String>,
}

/// Game event type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GameEventType {
    Kill,
    Death,
    Assist,
    RoundStart,
    RoundEnd,
    MatchStart,
    MatchEnd,
    LevelUp,
    Achievement,
    Custom,
}

/// Game state config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStateConfig {
    pub enabled: bool,
    pub auto_detect: bool,
    pub show_overlay: bool,
    pub overlay_position: String,
    pub track_stats: bool,
    pub auto_clip_on_kill: bool,
    pub auto_clip_on_victory: bool,
    pub supported_games: Vec<GameType>,
}

impl Default for GameStateConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_detect: true,
            show_overlay: true,
            overlay_position: "top-left".to_string(),
            track_stats: true,
            auto_clip_on_kill: true,
            auto_clip_on_victory: true,
            supported_games: vec![
                GameType::CS2,
                GameType::LoL,
                GameType::Valorant,
                GameType::Dota2,
            ],
        }
    }
}

/// Game state statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStateStats {
    pub total_events: u64,
    pub kills: u64,
    pub deaths: u64,
    pub assists: u64,
    pub matches_played: u64,
    pub matches_won: u64,
    pub matches_lost: u64,
}

/// Game state engine state
pub struct GameStateEngine {
    pub config: GameStateConfig,
    pub current_game: Option<GameData>,
    pub events: Vec<GameEvent>,
    pub stats: GameStateStats,
    pub is_connected: bool,
}

impl GameStateEngine {
    pub fn new() -> Self {
        Self {
            config: GameStateConfig::default(),
            current_game: None,
            events: Vec::new(),
            stats: GameStateStats {
                total_events: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                matches_played: 0,
                matches_won: 0,
                matches_lost: 0,
            },
            is_connected: false,
        }
    }

    /// Connect to game
    pub fn connect_game(&mut self, game_type: GameType) -> Result<(), String> {
        if !self.config.supported_games.contains(&game_type) {
            return Err("Game not supported".to_string());
        }
        
        self.is_connected = true;
        
        // Initialize game data
        self.current_game = Some(GameData {
            game_type,
            game_state: GameState::Menu,
            map_name: None,
            round: None,
            teams: Vec::new(),
            local_player: None,
            match_time: None,
            is_spectating: false,
        });
        
        Ok(())
    }

    /// Disconnect from game
    pub fn disconnect_game(&mut self) -> Result<(), String> {
        self.is_connected = false;
        self.current_game = None;
        Ok(())
    }

    /// Update game data
    pub fn update_game_data(&mut self, game_data: GameData) -> Result<(), String> {
        if !self.is_connected {
            return Err("Not connected to game".to_string());
        }
        
        self.current_game = Some(game_data);
        Ok(())
    }

    /// Add game event
    pub fn add_event(&mut self, event_type: GameEventType, description: String, data: HashMap<String, String>) -> Result<GameEvent, String> {
        let event = GameEvent {
            id: uuid::Uuid::new_v4().to_string(),
            event_type,
            description,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            data,
        };
        
        self.events.push(event.clone());
        self.stats.total_events += 1;
        
        // Update stats based on event type
        match event_type {
            GameEventType::Kill => self.stats.kills += 1,
            GameEventType::Death => self.stats.deaths += 1,
            GameEventType::Assist => self.stats.assists += 1,
            GameEventType::MatchStart => self.stats.matches_played += 1,
            GameEventType::MatchEnd => {
                // Determine win/loss based on event data
                if let Some(result) = event.data.get("result") {
                    if result == "victory" {
                        self.stats.matches_won += 1;
                    } else if result == "defeat" {
                        self.stats.matches_lost += 1;
                    }
                }
            }
            _ => {}
        }
        
        Ok(event)
    }

    /// Get current game data
    pub fn get_current_game(&self) -> Option<GameData> {
        self.current_game.clone()
    }

    /// Get events
    pub fn get_events(&self) -> Vec<GameEvent> {
        self.events.clone()
    }

    /// Get recent events
    pub fn get_recent_events(&self, count: usize) -> Vec<GameEvent> {
        let len = self.events.len();
        if count >= len {
            self.events.clone()
        } else {
            self.events[len - count..].to_vec()
        }
    }

    /// Update config
    pub fn update_config(&mut self, config: GameStateConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> GameStateConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> GameStateStats {
        self.stats.clone()
    }

    /// Get connection status
    pub fn is_connected_status(&self) -> bool {
        self.is_connected
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_game_state_config(state: tauri::State<AppState>) -> GameStateConfig {
    state.game_state_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_game_state_config(
    config: GameStateConfig,
    state: tauri::State<AppState>,
) {
    state.game_state_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn connect_game(
    game_type: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let game_type = match game_type.as_str() {
        "cs2" => GameType::CS2,
        "lol" => GameType::LoL,
        "valorant" => GameType::Valorant,
        "dota2" => GameType::Dota2,
        "overwatch2" => GameType::Overwatch2,
        "apexlegends" => GameType::ApexLegends,
        "fortnite" => GameType::Fortnite,
        "minecraft" => GameType::Minecraft,
        "custom" => GameType::Custom,
        _ => return Err("Invalid game type".to_string()),
    };
    
    state.game_state_engine.lock().unwrap().connect_game(game_type)
}

#[tauri::command]
fn disconnect_game(state: tauri::State<AppState>) -> Result<(), String> {
    state.game_state_engine.lock().unwrap().disconnect_game()
}

#[tauri::command]
fn is_game_connected(state: tauri::State<AppState>) -> bool {
    state.game_state_engine.lock().unwrap().is_connected_status()
}

#[tauri::command]
fn get_current_game_data(state: tauri::State<AppState>) -> Option<GameData> {
    state.game_state_engine.lock().unwrap().get_current_game()
}

#[tauri::command]
fn add_game_event(
    event_type: String,
    description: String,
    data: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<GameEvent, String> {
    let event_type = match event_type.as_str() {
        "kill" => GameEventType::Kill,
        "death" => GameEventType::Death,
        "assist" => GameEventType::Assist,
        "round_start" => GameEventType::RoundStart,
        "round_end" => GameEventType::RoundEnd,
        "match_start" => GameEventType::MatchStart,
        "match_end" => GameEventType::MatchEnd,
        "level_up" => GameEventType::LevelUp,
        "achievement" => GameEventType::Achievement,
        "custom" => GameEventType::Custom,
        _ => return Err("Invalid event type".to_string()),
    };
    
    state.game_state_engine.lock().unwrap().add_event(event_type, description, data)
}

#[tauri::command]
fn get_game_events(state: tauri::State<AppState>) -> Vec<GameEvent> {
    state.game_state_engine.lock().unwrap().get_events()
}

#[tauri::command]
fn get_recent_game_events(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<GameEvent> {
    state.game_state_engine.lock().unwrap().get_recent_events(count)
}

#[tauri::command]
fn get_game_state_stats(state: tauri::State<AppState>) -> GameStateStats {
    state.game_state_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_supported_games() -> Vec<String> {
    vec![
        "cs2".to_string(),
        "lol".to_string(),
        "valorant".to_string(),
        "dota2".to_string(),
        "overwatch2".to_string(),
        "apexlegends".to_string(),
        "fortnite".to_string(),
        "minecraft".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_game_event_types() -> Vec<String> {
    vec![
        "kill".to_string(),
        "death".to_string(),
        "assist".to_string(),
        "round_start".to_string(),
        "round_end".to_string(),
        "match_start".to_string(),
        "match_end".to_string(),
        "level_up".to_string(),
        "achievement".to_string(),
        "custom".to_string(),
    ]
}