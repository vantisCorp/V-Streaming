use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// TIP ECOSYSTEM - Donation and Tipping System
// ============================================================================

/// Tip currency
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TipCurrency {
    USD,
    EUR,
    GBP,
    JPY,
    BTC,
    ETH,
    Custom,
}

/// Tip payment method
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TipPaymentMethod {
    PayPal,
    Stripe,
    Crypto,
    Streamlabs,
    StreamElements,
    Custom,
}

/// Tip
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tip {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub amount: f64,
    pub currency: TipCurrency,
    pub payment_method: TipPaymentMethod,
    pub message: Option<String>,
    pub timestamp: u64,
    pub is_anonymous: bool,
    pub is_recurring: bool,
}

/// Tip goal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipGoal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub currency: TipCurrency,
    pub deadline: Option<u64>,
    pub created_at: u64,
    pub completed: bool,
}

/// Tip reward
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipReward {
    pub id: String,
    pub title: String,
    pub description: String,
    pub min_amount: f64,
    pub currency: TipCurrency,
    pub enabled: bool,
}

/// Tip config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipConfig {
    pub enabled: bool,
    pub default_currency: TipCurrency,
    pub min_tip_amount: f64,
    pub max_tip_amount: f64,
    pub allow_anonymous: bool,
    pub allow_recurring: bool,
    pub show_on_stream: bool,
    pub play_sound: bool,
    pub sound_volume: f32,
    pub show_message: bool,
    pub auto_thank: bool,
}

impl Default for TipConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            default_currency: TipCurrency::USD,
            min_tip_amount: 1.0,
            max_tip_amount: 10000.0,
            allow_anonymous: true,
            allow_recurring: true,
            show_on_stream: true,
            play_sound: true,
            sound_volume: 0.7,
            show_message: true,
            auto_thank: true,
        }
    }
}

/// Tip statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TipStats {
    pub total_tips: u64,
    pub total_amount: f64,
    pub unique_tippers: u64,
    pub average_tip: f64,
    pub largest_tip: f64,
    pub recurring_tips: u64,
    pub anonymous_tips: u64,
}

/// Tip ecosystem engine state
pub struct TipEcosystemEngine {
    pub config: TipConfig,
    pub tips: Vec<Tip>,
    pub goals: Vec<TipGoal>,
    pub rewards: Vec<TipReward>,
    pub stats: TipStats,
}

impl TipEcosystemEngine {
    pub fn new() -> Self {
        Self {
            config: TipConfig::default(),
            tips: Vec::new(),
            goals: Vec::new(),
            rewards: Vec::new(),
            stats: TipStats {
                total_tips: 0,
                total_amount: 0.0,
                unique_tippers: 0,
                average_tip: 0.0,
                largest_tip: 0.0,
                recurring_tips: 0,
                anonymous_tips: 0,
            },
        }
    }

    /// Add tip
    pub fn add_tip(&mut self, tip: Tip) -> Result<(), String> {
        if tip.amount < self.config.min_tip_amount {
            return Err("Tip amount is below minimum".to_string());
        }
        
        if tip.amount > self.config.max_tip_amount {
            return Err("Tip amount exceeds maximum".to_string());
        }
        
        self.tips.push(tip.clone());
        self.stats.total_tips += 1;
        self.stats.total_amount += tip.amount;
        
        // Update largest tip
        if tip.amount > self.stats.largest_tip {
            self.stats.largest_tip = tip.amount;
        }
        
        // Update recurring tips count
        if tip.is_recurring {
            self.stats.recurring_tips += 1;
        }
        
        // Update anonymous tips count
        if tip.is_anonymous {
            self.stats.anonymous_tips += 1;
        }
        
        // Calculate average tip
        self.stats.average_tip = self.stats.total_amount / self.stats.total_tips as f64;
        
        // Update unique tippers
        let unique_usernames: std::collections::HashSet<&String> = self.tips.iter().map(|t| &t.username).collect();
        self.stats.unique_tippers = unique_usernames.len() as u64;
        
        // Update goals
        for goal in &mut self.goals {
            if goal.currency == tip.currency && !goal.completed {
                goal.current_amount += tip.amount;
                if goal.current_amount >= goal.target_amount {
                    goal.completed = true;
                }
            }
        }
        
        Ok(())
    }

    /// Get all tips
    pub fn get_tips(&self) -> Vec<Tip> {
        self.tips.clone()
    }

    /// Get recent tips
    pub fn get_recent_tips(&self, count: usize) -> Vec<Tip> {
        let len = self.tips.len();
        if count >= len {
            self.tips.clone()
        } else {
            self.tips[len - count..].to_vec()
        }
    }

    /// Create goal
    pub fn create_goal(&mut self, title: String, description: String, target_amount: f64, currency: TipCurrency, deadline: Option<u64>) -> Result<TipGoal, String> {
        let goal = TipGoal {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description,
            target_amount,
            current_amount: 0.0,
            currency,
            deadline,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            completed: false,
        };
        
        self.goals.push(goal.clone());
        Ok(goal)
    }

    /// Get all goals
    pub fn get_goals(&self) -> Vec<TipGoal> {
        self.goals.clone()
    }

    /// Delete goal
    pub fn delete_goal(&mut self, goal_id: String) -> Result<(), String> {
        if let Some(pos) = self.goals.iter().position(|g| g.id == goal_id) {
            self.goals.remove(pos);
            Ok(())
        } else {
            Err("Goal not found".to_string())
        }
    }

    /// Create reward
    pub fn create_reward(&mut self, title: String, description: String, min_amount: f64, currency: TipCurrency) -> Result<TipReward, String> {
        let reward = TipReward {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description,
            min_amount,
            currency,
            enabled: true,
        };
        
        self.rewards.push(reward.clone());
        Ok(reward)
    }

    /// Get all rewards
    pub fn get_rewards(&self) -> Vec<TipReward> {
        self.rewards.clone()
    }

    /// Delete reward
    pub fn delete_reward(&mut self, reward_id: String) -> Result<(), String> {
        if let Some(pos) = self.rewards.iter().position(|r| r.id == reward_id) {
            self.rewards.remove(pos);
            Ok(())
        } else {
            Err("Reward not found".to_string())
        }
    }

    /// Update config
    pub fn update_config(&mut self, config: TipConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> TipConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> TipStats {
        self.stats.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_tip_config(state: tauri::State<AppState>) -> TipConfig {
    state.tip_ecosystem_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_tip_config(
    config: TipConfig,
    state: tauri::State<AppState>,
) {
    state.tip_ecosystem_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn add_tip(
    username: String,
    display_name: String,
    amount: f64,
    currency: String,
    payment_method: String,
    message: Option<String>,
    is_anonymous: bool,
    is_recurring: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let currency = match currency.as_str() {
        "usd" => TipCurrency::USD,
        "eur" => TipCurrency::EUR,
        "gbp" => TipCurrency::GBP,
        "jpy" => TipCurrency::JPY,
        "btc" => TipCurrency::BTC,
        "eth" => TipCurrency::ETH,
        "custom" => TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    let payment_method = match payment_method.as_str() {
        "paypal" => TipPaymentMethod::PayPal,
        "stripe" => TipPaymentMethod::Stripe,
        "crypto" => TipPaymentMethod::Crypto,
        "streamlabs" => TipPaymentMethod::Streamlabs,
        "streamelements" => TipPaymentMethod::StreamElements,
        "custom" => TipPaymentMethod::Custom,
        _ => return Err("Invalid payment method".to_string()),
    };
    
    let tip = Tip {
        id: uuid::Uuid::new_v4().to_string(),
        username,
        display_name,
        amount,
        currency,
        payment_method,
        message,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        is_anonymous,
        is_recurring,
    };
    
    state.tip_ecosystem_engine.lock().unwrap().add_tip(tip)
}

#[tauri::command]
fn get_tips(state: tauri::State<AppState>) -> Vec<Tip> {
    state.tip_ecosystem_engine.lock().unwrap().get_tips()
}

#[tauri::command]
fn get_recent_tips(
    count: usize,
    state: tauri::State<AppState>,
) -> Vec<Tip> {
    state.tip_ecosystem_engine.lock().unwrap().get_recent_tips(count)
}

#[tauri::command]
fn create_tip_goal(
    title: String,
    description: String,
    target_amount: f64,
    currency: String,
    deadline: Option<u64>,
    state: tauri::State<AppState>,
) -> Result<TipGoal, String> {
    let currency = match currency.as_str() {
        "usd" => TipCurrency::USD,
        "eur" => TipCurrency::EUR,
        "gbp" => TipCurrency::GBP,
        "jpy" => TipCurrency::JPY,
        "btc" => TipCurrency::BTC,
        "eth" => TipCurrency::ETH,
        "custom" => TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    state.tip_ecosystem_engine.lock().unwrap().create_goal(title, description, target_amount, currency, deadline)
}

#[tauri::command]
fn get_tip_goals(state: tauri::State<AppState>) -> Vec<TipGoal> {
    state.tip_ecosystem_engine.lock().unwrap().get_goals()
}

#[tauri::command]
fn delete_tip_goal(
    goal_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().delete_goal(goal_id)
}

#[tauri::command]
fn create_tip_reward(
    title: String,
    description: String,
    min_amount: f64,
    currency: String,
    state: tauri::State<AppState>,
) -> Result<TipReward, String> {
    let currency = match currency.as_str() {
        "usd" => TipCurrency::USD,
        "eur" => TipCurrency::EUR,
        "gbp" => TipCurrency::GBP,
        "jpy" => TipCurrency::JPY,
        "btc" => TipCurrency::BTC,
        "eth" => TipCurrency::ETH,
        "custom" => TipCurrency::Custom,
        _ => return Err("Invalid currency".to_string()),
    };
    
    state.tip_ecosystem_engine.lock().unwrap().create_reward(title, description, min_amount, currency)
}

#[tauri::command]
fn get_tip_rewards(state: tauri::State<AppState>) -> Vec<TipReward> {
    state.tip_ecosystem_engine.lock().unwrap().get_rewards()
}

#[tauri::command]
fn delete_tip_reward(
    reward_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.tip_ecosystem_engine.lock().unwrap().delete_reward(reward_id)
}

#[tauri::command]
fn get_tip_stats(state: tauri::State<AppState>) -> TipStats {
    state.tip_ecosystem_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_tip_currencies() -> Vec<String> {
    vec![
        "usd".to_string(),
        "eur".to_string(),
        "gbp".to_string(),
        "jpy".to_string(),
        "btc".to_string(),
        "eth".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_tip_payment_methods() -> Vec<String> {
    vec![
        "paypal".to_string(),
        "stripe".to_string(),
        "crypto".to_string(),
        "streamlabs".to_string(),
        "streamelements".to_string(),
        "custom".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tip_creation() {
        let tip = Tip {
            id: "tip1".to_string(),
            username: "donor123".to_string(),
            display_name: "Donor123".to_string(),
            amount: 10.0,
            currency: TipCurrency::USD,
            payment_method: TipPaymentMethod::PayPal,
            message: Some("Great stream!".to_string()),
            timestamp: 1234567890,
            is_anonymous: false,
            is_recurring: false,
        };

        assert_eq!(tip.id, "tip1");
        assert_eq!(tip.amount, 10.0);
        assert_eq!(tip.currency, TipCurrency::USD);
        assert!(!tip.is_anonymous);
    }

    #[test]
    fn test_tip_goal_creation() {
        let goal = TipGoal {
            id: "goal1".to_string(),
            title: "New Microphone".to_string(),
            description: "Help me get a new mic".to_string(),
            target_amount: 500.0,
            current_amount: 250.0,
            currency: TipCurrency::USD,
            deadline: Some(1234567890),
            created_at: 1234567890,
            completed: false,
        };

        assert_eq!(goal.id, "goal1");
        assert_eq!(goal.target_amount, 500.0);
        assert_eq!(goal.current_amount, 250.0);
        assert!(!goal.completed);
    }

    #[test]
    fn test_tip_reward_creation() {
        let reward = TipReward {
            id: "reward1".to_string(),
            title: "Shoutout".to_string(),
            description: "I'll give you a shoutout".to_string(),
            min_amount: 5.0,
            currency: TipCurrency::USD,
            enabled: true,
        };

        assert_eq!(reward.id, "reward1");
        assert_eq!(reward.min_amount, 5.0);
        assert!(reward.enabled);
    }

    #[test]
    fn test_tip_config_default() {
        let config = TipConfig::default();
        
        assert_eq!(config.enabled, true);
        assert_eq!(config.default_currency, TipCurrency::USD);
        assert_eq!(config.min_tip_amount, 1.0);
        assert_eq!(config.max_tip_amount, 10000.0);
    }

    #[test]
    fn test_tip_currency_variants() {
        let currencies = vec![
            TipCurrency::USD,
            TipCurrency::EUR,
            TipCurrency::GBP,
            TipCurrency::JPY,
            TipCurrency::BTC,
            TipCurrency::ETH,
            TipCurrency::Custom,
        ];

        assert_eq!(currencies.len(), 7);
        assert_eq!(currencies[0], TipCurrency::USD);
    }

    #[test]
    fn test_tip_payment_method_variants() {
        let methods = vec![
            TipPaymentMethod::PayPal,
            TipPaymentMethod::Stripe,
            TipPaymentMethod::Crypto,
            TipPaymentMethod::Streamlabs,
            TipPaymentMethod::StreamElements,
            TipPaymentMethod::Custom,
        ];

        assert_eq!(methods.len(), 6);
        assert_eq!(methods[0], TipPaymentMethod::PayPal);
    }

    #[test]
    fn test_tip_serialization() {
        let tip = Tip {
            id: "tip1".to_string(),
            username: "donor123".to_string(),
            display_name: "Donor123".to_string(),
            amount: 10.0,
            currency: TipCurrency::USD,
            payment_method: TipPaymentMethod::PayPal,
            message: None,
            timestamp: 1234567890,
            is_anonymous: false,
            is_recurring: false,
        };

        // Test that struct can be serialized (compile-time check)
        let _json = serde_json::to_string(&tip);
        assert!(true);
    }
}
