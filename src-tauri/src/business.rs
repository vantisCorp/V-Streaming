use serde::{Deserialize, Serialize};
use crate::AppState;

// ============================================================================
// BUSINESS MODEL - Freemium Subscription and Licensing
// ============================================================================

/// Subscription tier
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SubscriptionTier {
    Free,
    Pro,
    Enterprise,
}

/// Subscription status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SubscriptionStatus {
    Active,
    Inactive,
    Trial,
    Expired,
    Cancelled,
}

/// Feature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feature {
    pub id: String,
    pub name: String,
    pub description: String,
    pub available_tiers: Vec<SubscriptionTier>,
    pub enabled: bool,
}

/// Subscription plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubscriptionPlan {
    pub tier: SubscriptionTier,
    pub name: String,
    pub description: String,
    pub price_monthly: f64,
    pub price_yearly: f64,
    pub features: Vec<String>,
    pub max_streams: u32,
    pub max_viewers: u32,
    pub max_bitrate: u32,
    pub support_level: String,
}

/// User subscription
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSubscription {
    pub id: String,
    pub user_id: String,
    pub tier: SubscriptionTier,
    pub status: SubscriptionStatus,
    pub start_date: u64,
    pub end_date: Option<u64>,
    pub auto_renew: bool,
    pub trial_used: bool,
    pub trial_days_remaining: u32,
}

/// Usage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub streams_this_month: u32,
    pub total_stream_time: u64, // seconds
    pub max_concurrent_viewers: u32,
    pub total_bandwidth: u64, // bytes
    pub storage_used: u64, // bytes
}

/// Business config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessConfig {
    pub trial_days: u32,
    pub free_tier_streams_per_month: u32,
    pub free_tier_max_viewers: u32,
    pub free_tier_max_bitrate: u32,
    pub pro_tier_streams_per_month: u32,
    pub pro_tier_max_viewers: u32,
    pub pro_tier_max_bitrate: u32,
    pub enterprise_tier_streams_per_month: u32,
    pub enterprise_tier_max_viewers: u32,
    pub enterprise_tier_max_bitrate: u32,
}

impl Default for BusinessConfig {
    fn default() -> Self {
        Self {
            trial_days: 14,
            free_tier_streams_per_month: 10,
            free_tier_max_viewers: 100,
            free_tier_max_bitrate: 3000,
            pro_tier_streams_per_month: 100,
            pro_tier_max_viewers: 1000,
            pro_tier_max_bitrate: 6000,
            enterprise_tier_streams_per_month: 1000,
            enterprise_tier_max_viewers: 10000,
            enterprise_tier_max_bitrate: 10000,
        }
    }
}

/// Business engine state
pub struct BusinessEngine {
    pub config: BusinessConfig,
    pub subscription: Option<UserSubscription>,
    pub usage_stats: UsageStats,
    pub features: Vec<Feature>,
    pub plans: Vec<SubscriptionPlan>,
}

impl BusinessEngine {
    pub fn new() -> Self {
        Self {
            config: BusinessConfig::default(),
            subscription: None,
            usage_stats: UsageStats {
                streams_this_month: 0,
                total_stream_time: 0,
                max_concurrent_viewers: 0,
                total_bandwidth: 0,
                storage_used: 0,
            },
            features: Self::get_default_features(),
            plans: Self::get_default_plans(),
        }
    }

    /// Get default features
    fn get_default_features() -> Vec<Feature> {
        vec![
            Feature {
                id: "basic_capture".to_string(),
                name: "Basic Capture".to_string(),
                description: "Screen and window capture".to_string(),
                available_tiers: vec![SubscriptionTier::Free, SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: true,
            },
            Feature {
                id: "hardware_encoding".to_string(),
                name: "Hardware Encoding".to_string(),
                description: "NVENC, AMF, QuickSync support".to_string(),
                available_tiers: vec![SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "multistreaming".to_string(),
                name: "Multistreaming".to_string(),
                description: "Stream to multiple platforms".to_string(),
                available_tiers: vec![SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "vtubing".to_string(),
                name: "VTubing".to_string(),
                description: ".VRM and Live2D support".to_string(),
                available_tiers: vec![SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "ai_highlights".to_string(),
                name: "AI Highlights".to_string(),
                description: "Auto-clipping with AI".to_string(),
                available_tiers: vec![SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "live_captions".to_string(),
                name: "Live Captions".to_string(),
                description: "Whisper AI integration".to_string(),
                available_tiers: vec![SubscriptionTier::Pro, SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "smart_home".to_string(),
                name: "Smart Home".to_string(),
                description: "IoT device integration".to_string(),
                available_tiers: vec![SubscriptionTier::Enterprise],
                enabled: false,
            },
            Feature {
                id: "priority_support".to_string(),
                name: "Priority Support".to_string(),
                description: "24/7 priority support".to_string(),
                available_tiers: vec![SubscriptionTier::Enterprise],
                enabled: false,
            },
        ]
    }

    /// Get default plans
    fn get_default_plans() -> Vec<SubscriptionPlan> {
        vec![
            SubscriptionPlan {
                tier: SubscriptionTier::Free,
                name: "Free".to_string(),
                description: "Perfect for getting started".to_string(),
                price_monthly: 0.0,
                price_yearly: 0.0,
                features: vec![
                    "basic_capture".to_string(),
                    "audio_mixer".to_string(),
                    "basic_filters".to_string(),
                ],
                max_streams: 10,
                max_viewers: 100,
                max_bitrate: 3000,
                support_level: "Community".to_string(),
            },
            SubscriptionPlan {
                tier: SubscriptionTier::Pro,
                name: "Pro".to_string(),
                description: "For serious streamers".to_string(),
                price_monthly: 9.99,
                price_yearly: 99.99,
                features: vec![
                    "basic_capture".to_string(),
                    "hardware_encoding".to_string(),
                    "multistreaming".to_string(),
                    "vtubing".to_string(),
                    "ai_highlights".to_string(),
                    "live_captions".to_string(),
                    "audio_mixer".to_string(),
                    "advanced_filters".to_string(),
                ],
                max_streams: 100,
                max_viewers: 1000,
                max_bitrate: 6000,
                support_level: "Email".to_string(),
            },
            SubscriptionPlan {
                tier: SubscriptionTier::Enterprise,
                name: "Enterprise".to_string(),
                description: "For professional studios".to_string(),
                price_monthly: 49.99,
                price_yearly: 499.99,
                features: vec![
                    "basic_capture".to_string(),
                    "hardware_encoding".to_string(),
                    "multistreaming".to_string(),
                    "vtubing".to_string(),
                    "ai_highlights".to_string(),
                    "live_captions".to_string(),
                    "smart_home".to_string(),
                    "priority_support".to_string(),
                    "audio_mixer".to_string(),
                    "advanced_filters".to_string(),
                ],
                max_streams: 1000,
                max_viewers: 10000,
                max_bitrate: 10000,
                support_level: "24/7 Priority".to_string(),
            },
        ]
    }

    /// Start trial
    pub fn start_trial(&mut self, user_id: String) -> Result<UserSubscription, String> {
        if let Some(sub) = &self.subscription {
            if sub.trial_used {
                return Err("Trial already used".to_string());
            }
        }
        
        let subscription = UserSubscription {
            id: uuid::Uuid::new_v4().to_string(),
            user_id,
            tier: SubscriptionTier::Pro,
            status: SubscriptionStatus::Trial,
            start_date: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            end_date: Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + (self.config.trial_days as u64 * 86400)),
            auto_renew: false,
            trial_used: true,
            trial_days_remaining: self.config.trial_days,
        };
        
        self.subscription = Some(subscription.clone());
        Ok(subscription)
    }

    /// Subscribe to plan
    pub fn subscribe(&mut self, user_id: String, tier: SubscriptionTier, yearly: bool) -> Result<UserSubscription, String> {
        let _plan = self.plans.iter().find(|p| p.tier == tier).ok_or("Plan not found")?;
        
        let duration_days = if yearly { 365 } else { 30 };
        
        let subscription = UserSubscription {
            id: uuid::Uuid::new_v4().to_string(),
            user_id,
            tier,
            status: SubscriptionStatus::Active,
            start_date: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            end_date: Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() + (duration_days as u64 * 86400)),
            auto_renew: true,
            trial_used: false,
            trial_days_remaining: 0,
        };
        
        self.subscription = Some(subscription.clone());
        Ok(subscription)
    }

    /// Cancel subscription
    pub fn cancel_subscription(&mut self) -> Result<(), String> {
        if let Some(sub) = &mut self.subscription {
            sub.status = SubscriptionStatus::Cancelled;
            sub.auto_renew = false;
            Ok(())
        } else {
            Err("No active subscription".to_string())
        }
    }

    /// Check if feature is available
    pub fn is_feature_available(&self, feature_id: String) -> bool {
        let tier = self.subscription.as_ref().map(|s| s.tier.clone()).unwrap_or(SubscriptionTier::Free);
        
        if let Some(feature) = self.features.iter().find(|f| f.id == feature_id) {
            feature.available_tiers.contains(&tier)
        } else {
            false
        }
    }

    /// Get available features
    pub fn get_available_features(&self) -> Vec<Feature> {
        let tier = self.subscription.as_ref().map(|s| s.tier.clone()).unwrap_or(SubscriptionTier::Free);
        
        self.features.iter()
            .filter(|f| f.available_tiers.contains(&tier))
            .cloned()
            .collect()
    }

    /// Get subscription
    pub fn get_subscription(&self) -> Option<UserSubscription> {
        self.subscription.clone()
    }

    /// Get plans
    pub fn get_plans(&self) -> Vec<SubscriptionPlan> {
        self.plans.clone()
    }

    /// Get usage stats
    pub fn get_usage_stats(&self) -> UsageStats {
        self.usage_stats.clone()
    }

    /// Update usage stats
    pub fn update_usage_stats(&mut self, stats: UsageStats) {
        self.usage_stats = stats;
    }

    /// Update config
    pub fn update_config(&mut self, config: BusinessConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> BusinessConfig {
        self.config.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_business_config(state: tauri::State<AppState>) -> BusinessConfig {
    state.business_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_business_config(
    config: BusinessConfig,
    state: tauri::State<AppState>,
) {
    state.business_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn start_trial(
    user_id: String,
    state: tauri::State<AppState>,
) -> Result<UserSubscription, String> {
    state.business_engine.lock().unwrap().start_trial(user_id)
}

#[tauri::command]
fn subscribe(
    user_id: String,
    tier: String,
    yearly: bool,
    state: tauri::State<AppState>,
) -> Result<UserSubscription, String> {
    let tier = match tier.as_str() {
        "free" => SubscriptionTier::Free,
        "pro" => SubscriptionTier::Pro,
        "enterprise" => SubscriptionTier::Enterprise,
        _ => return Err("Invalid tier".to_string()),
    };
    
    state.business_engine.lock().unwrap().subscribe(user_id, tier, yearly)
}

#[tauri::command]
fn cancel_subscription(state: tauri::State<AppState>) -> Result<(), String> {
    state.business_engine.lock().unwrap().cancel_subscription()
}

#[tauri::command]
fn get_subscription(state: tauri::State<AppState>) -> Option<UserSubscription> {
    state.business_engine.lock().unwrap().get_subscription()
}

#[tauri::command]
fn get_subscription_plans(state: tauri::State<AppState>) -> Vec<SubscriptionPlan> {
    state.business_engine.lock().unwrap().get_plans()
}

#[tauri::command]
fn get_available_features(state: tauri::State<AppState>) -> Vec<Feature> {
    state.business_engine.lock().unwrap().get_available_features()
}

#[tauri::command]
fn is_feature_available(
    feature_id: String,
    state: tauri::State<AppState>,
) -> bool {
    state.business_engine.lock().unwrap().is_feature_available(feature_id)
}

#[tauri::command]
fn get_usage_stats(state: tauri::State<AppState>) -> UsageStats {
    state.business_engine.lock().unwrap().get_usage_stats()
}

#[tauri::command]
fn update_usage_stats(
    stats: UsageStats,
    state: tauri::State<AppState>,
) {
    state.business_engine.lock().unwrap().update_usage_stats(stats);
}

#[tauri::command]
fn get_subscription_tiers() -> Vec<String> {
    vec![
        "free".to_string(),
        "pro".to_string(),
        "enterprise".to_string(),
    ]
}

#[tauri::command]
fn get_subscription_statuses() -> Vec<String> {
    vec![
        "active".to_string(),
        "inactive".to_string(),
        "trial".to_string(),
        "expired".to_string(),
        "cancelled".to_string(),
    ]
}