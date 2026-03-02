use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// INTERACTION ENGINE - Viewer Interaction Triggers and Mini-games
// ============================================================================

/// Interaction trigger type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum InteractionTriggerType {
    ChatCommand,
    Keyword,
    Emote,
    Follow,
    Subscribe,
    Donation,
    Raid,
    Cheer,
    Custom,
}

/// Interaction trigger
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionTrigger {
    pub id: String,
    pub name: String,
    pub trigger_type: InteractionTriggerType,
    pub pattern: String,
    pub enabled: bool,
    pub cooldown: u32,
    pub last_triggered: Option<u64>,
    pub action: InteractionAction,
}

/// Interaction action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionAction {
    pub action_type: InteractionActionType,
    pub parameters: HashMap<String, String>,
}

/// Interaction action types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum InteractionActionType {
    PlaySound,
    ShowOverlay,
    TriggerEffect,
    StartMiniGame,
    SendChatMessage,
    ExecuteCommand,
    ChangeScene,
    PlayVideo,
    ShowImage,
    Custom,
}

/// Mini-game type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MiniGameType {
    Trivia,
    Poll,
    Prediction,
    Bingo,
    SlotMachine,
    Roulette,
    RockPaperScissors,
    GuessNumber,
    WordScramble,
    Custom,
}

/// Mini-game state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MiniGameState {
    Waiting,
    Active,
    Paused,
    Completed,
}

/// Mini-game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiniGame {
    pub id: String,
    pub name: String,
    pub game_type: MiniGameType,
    pub state: MiniGameState,
    pub duration: u32,
    pub remaining_time: u32,
    pub participants: Vec<String>,
    pub questions: Vec<MiniGameQuestion>,
    pub current_question: Option<usize>,
    pub results: HashMap<String, MiniGameResult>,
    pub prize: Option<String>,
}

/// Mini-game question
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiniGameQuestion {
    pub id: String,
    pub question: String,
    pub options: Vec<String>,
    pub correct_answer: Option<usize>,
    pub time_limit: u32,
}

/// Mini-game result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiniGameResult {
    pub username: String,
    pub score: u32,
    pub correct_answers: u32,
    pub is_winner: bool,
}

/// Interaction statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionStats {
    pub total_triggers: u64,
    pub active_triggers: u32,
    pub total_mini_games: u64,
    pub active_mini_games: u32,
    pub total_participants: u64,
}

/// Interaction engine state
pub struct InteractionEngine {
    pub triggers: Vec<InteractionTrigger>,
    pub mini_games: Vec<MiniGame>,
    pub stats: InteractionStats,
}

impl InteractionEngine {
    pub fn new() -> Self {
        Self {
            triggers: Vec::new(),
            mini_games: Vec::new(),
            stats: InteractionStats {
                total_triggers: 0,
                active_triggers: 0,
                total_mini_games: 0,
                active_mini_games: 0,
                total_participants: 0,
            },
        }
    }

    /// Add interaction trigger
    pub fn add_trigger(&mut self, trigger: InteractionTrigger) -> Result<(), String> {
        self.triggers.push(trigger);
        self.stats.total_triggers += 1;
        if trigger.enabled {
            self.stats.active_triggers += 1;
        }
        Ok(())
    }

    /// Remove interaction trigger
    pub fn remove_trigger(&mut self, trigger_id: String) -> Result<(), String> {
        if let Some(trigger) = self.triggers.iter().find(|t| t.id == trigger_id) {
            if trigger.enabled {
                self.stats.active_triggers -= 1;
            }
        }
        self.triggers.retain(|t| t.id != trigger_id);
        Ok(())
    }

    /// Update interaction trigger
    pub fn update_trigger(&mut self, trigger_id: String, enabled: bool) -> Result<(), String> {
        if let Some(trigger) = self.triggers.iter_mut().find(|t| t.id == trigger_id) {
            if trigger.enabled != enabled {
                if enabled {
                    self.stats.active_triggers += 1;
                } else {
                    self.stats.active_triggers -= 1;
                }
            }
            trigger.enabled = enabled;
            Ok(())
        } else {
            Err("Trigger not found".to_string())
        }
    }

    /// Trigger interaction
    pub fn trigger_interaction(&mut self, trigger_id: String) -> Result<InteractionAction, String> {
        let trigger = self
            .triggers
            .iter()
            .find(|t| t.id == trigger_id && t.enabled)
            .ok_or("Trigger not found or disabled")?;

        // Check cooldown
        if let Some(last_triggered) = trigger.last_triggered {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            if now - last_triggered < trigger.cooldown as u64 {
                return Err("Trigger is on cooldown".to_string());
            }
        }

        // Update last triggered time
        if let Some(t) = self.triggers.iter_mut().find(|t| t.id == trigger_id) {
            t.last_triggered = Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs(),
            );
        }

        Ok(trigger.action.clone())
    }

    /// Create mini-game
    pub fn create_mini_game(&mut self, game: MiniGame) -> Result<(), String> {
        self.mini_games.push(game);
        self.stats.total_mini_games += 1;
        self.stats.active_mini_games += 1;
        Ok(())
    }

    /// Start mini-game
    pub fn start_mini_game(&mut self, game_id: String) -> Result<(), String> {
        if let Some(game) = self.mini_games.iter_mut().find(|g| g.id == game_id) {
            game.state = MiniGameState::Active;
            Ok(())
        } else {
            Err("Game not found".to_string())
        }
    }

    /// Stop mini-game
    pub fn stop_mini_game(&mut self, game_id: String) -> Result<(), String> {
        if let Some(game) = self.mini_games.iter_mut().find(|g| g.id == game_id) {
            game.state = MiniGameState::Completed;
            self.stats.active_mini_games -= 1;
            Ok(())
        } else {
            Err("Game not found".to_string())
        }
    }

    /// Join mini-game
    pub fn join_mini_game(&mut self, game_id: String, username: String) -> Result<(), String> {
        if let Some(game) = self.mini_games.iter_mut().find(|g| g.id == game_id) {
            if !game.participants.contains(&username) {
                game.participants.push(username.clone());
                self.stats.total_participants += 1;
            }
            Ok(())
        } else {
            Err("Game not found".to_string())
        }
    }

    /// Submit mini-game answer
    pub fn submit_mini_game_answer(
        &mut self,
        game_id: String,
        username: String,
        answer: String,
    ) -> Result<(), String> {
        if let Some(game) = self.mini_games.iter_mut().find(|g| g.id == game_id) {
            // Process answer
            // In production, this would validate the answer and update results
            Ok(())
        } else {
            Err("Game not found".to_string())
        }
    }

    /// Get mini-game
    pub fn get_mini_game(&self, game_id: String) -> Option<MiniGame> {
        self.mini_games.iter().find(|g| g.id == game_id).cloned()
    }

    /// Get all mini-games
    pub fn get_mini_games(&self) -> Vec<MiniGame> {
        self.mini_games.clone()
    }

    /// Get active mini-games
    pub fn get_active_mini_games(&self) -> Vec<MiniGame> {
        self.mini_games
            .iter()
            .filter(|g| g.state == MiniGameState::Active)
            .cloned()
            .collect()
    }

    /// Remove mini-game
    pub fn remove_mini_game(&mut self, game_id: String) -> Result<(), String> {
        if let Some(game) = self.mini_games.iter().find(|g| g.id == game_id) {
            if game.state == MiniGameState::Active {
                self.stats.active_mini_games -= 1;
            }
        }
        self.mini_games.retain(|g| g.id != game_id);
        Ok(())
    }

    /// Get default mini-game templates
    pub fn get_mini_game_templates() -> Vec<MiniGame> {
        vec![
            MiniGame {
                id: "trivia_template".to_string(),
                name: "Trivia".to_string(),
                game_type: MiniGameType::Trivia,
                state: MiniGameState::Waiting,
                duration: 60,
                remaining_time: 60,
                participants: Vec::new(),
                questions: vec![
                    MiniGameQuestion {
                        id: "q1".to_string(),
                        question: "What is the capital of France?".to_string(),
                        options: vec!["London".to_string(), "Paris".to_string(), "Berlin".to_string(), "Madrid".to_string()],
                        correct_answer: Some(1),
                        time_limit: 10,
                    },
                ],
                current_question: None,
                results: HashMap::new(),
                prize: None,
            },
            MiniGame {
                id: "poll_template".to_string(),
                name: "Poll".to_string(),
                game_type: MiniGameType::Poll,
                state: MiniGameState::Waiting,
                duration: 30,
                remaining_time: 30,
                participants: Vec::new(),
                questions: vec![
                    MiniGameQuestion {
                        id: "q1".to_string(),
                        question: "What should I play next?".to_string(),
                        options: vec!["Game A".to_string(), "Game B".to_string(), "Game C".to_string()],
                        correct_answer: None,
                        time_limit: 30,
                    },
                ],
                current_question: None,
                results: HashMap::new(),
                prize: None,
            },
        ]
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get interaction trigger types
#[tauri::command]
pub fn get_interaction_trigger_types() -> Vec<String> {
    vec![
        "ChatCommand".to_string(),
        "Keyword".to_string(),
        "Emote".to_string(),
        "Follow".to_string(),
        "Subscribe".to_string(),
        "Donation".to_string(),
        "Raid".to_string(),
        "Cheer".to_string(),
        "Custom".to_string(),
    ]
}

/// Get interaction action types
#[tauri::command]
pub fn get_interaction_action_types() -> Vec<String> {
    vec![
        "PlaySound".to_string(),
        "ShowOverlay".to_string(),
        "TriggerEffect".to_string(),
        "StartMiniGame".to_string(),
        "SendChatMessage".to_string(),
        "ExecuteCommand".to_string(),
        "ChangeScene".to_string(),
        "PlayVideo".to_string(),
        "ShowImage".to_string(),
        "Custom".to_string(),
    ]
}

/// Add interaction trigger
#[tauri::command]
pub fn add_interaction_trigger(
    trigger: InteractionTrigger,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.add_trigger(trigger)
}

/// Remove interaction trigger
#[tauri::command]
pub fn remove_interaction_trigger(
    trigger_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.remove_trigger(trigger_id)
}

/// Get interaction triggers
#[tauri::command]
pub fn get_interaction_triggers(state: State<Arc<Mutex<InteractionEngine>>>) -> Vec<InteractionTrigger> {
    let engine = state.lock().unwrap();
    engine.triggers.clone()
}

/// Update interaction trigger
#[tauri::command]
pub fn update_interaction_trigger(
    trigger_id: String,
    enabled: bool,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.update_trigger(trigger_id, enabled)
}

/// Trigger interaction
#[tauri::command]
pub fn trigger_interaction(
    trigger_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<InteractionAction, String> {
    let mut engine = state.lock().unwrap();
    engine.trigger_interaction(trigger_id)
}

/// Get mini-game types
#[tauri::command]
pub fn get_mini_game_types() -> Vec<String> {
    vec![
        "Trivia".to_string(),
        "Poll".to_string(),
        "Prediction".to_string(),
        "Bingo".to_string(),
        "SlotMachine".to_string(),
        "Roulette".to_string(),
        "RockPaperScissors".to_string(),
        "GuessNumber".to_string(),
        "WordScramble".to_string(),
        "Custom".to_string(),
    ]
}

/// Create mini-game
#[tauri::command]
pub fn create_mini_game(
    game: MiniGame,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.create_mini_game(game)
}

/// Start mini-game
#[tauri::command]
pub fn start_mini_game(
    game_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.start_mini_game(game_id)
}

/// Stop mini-game
#[tauri::command]
pub fn stop_mini_game(
    game_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.stop_mini_game(game_id)
}

/// Join mini-game
#[tauri::command]
pub fn join_mini_game(
    game_id: String,
    username: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.join_mini_game(game_id, username)
}

/// Submit mini-game answer
#[tauri::command]
pub fn submit_mini_game_answer(
    game_id: String,
    username: String,
    answer: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.submit_mini_game_answer(game_id, username, answer)
}

/// Get mini-games
#[tauri::command]
pub fn get_mini_games(state: State<Arc<Mutex<InteractionEngine>>>) -> Vec<MiniGame> {
    let engine = state.lock().unwrap();
    engine.get_mini_games()
}

/// Get active mini-games
#[tauri::command]
pub fn get_active_mini_games(state: State<Arc<Mutex<InteractionEngine>>>) -> Vec<MiniGame> {
    let engine = state.lock().unwrap();
    engine.get_active_mini_games()
}

/// Get mini-game
#[tauri::command]
pub fn get_mini_game(
    game_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Option<MiniGame> {
    let engine = state.lock().unwrap();
    engine.get_mini_game(game_id)
}

/// Remove mini-game
#[tauri::command]
pub fn remove_mini_game(
    game_id: String,
    state: State<Arc<Mutex<InteractionEngine>>>,
) -> Result<(), String> {
    let mut engine = state.lock().unwrap();
    engine.remove_mini_game(game_id)
}

/// Get mini-game templates
#[tauri::command]
pub fn get_mini_game_templates() -> Vec<MiniGame> {
    InteractionEngine::get_mini_game_templates()
}

/// Get interaction statistics
#[tauri::command]
pub fn get_interaction_stats(state: State<Arc<Mutex<InteractionEngine>>>) -> InteractionStats {
    let engine = state.lock().unwrap();
    engine.stats.clone()
}