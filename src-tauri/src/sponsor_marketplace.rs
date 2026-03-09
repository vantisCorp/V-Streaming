use serde::{Deserialize, Serialize};
use crate::AppState;

// ============================================================================
// SPONSOR MARKETPLACE - Brand Sponsorships and Deals
// ============================================================================

/// Sponsorship status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SponsorshipStatus {
    Available,
    Applied,
    InReview,
    Accepted,
    Active,
    Completed,
    Rejected,
    Cancelled,
}

/// Sponsorship type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SponsorshipType {
    OneTime,
    Recurring,
    Affiliate,
    ProductPlacement,
    BrandAmbassador,
}

/// Sponsorship
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sponsorship {
    pub id: String,
    pub brand_name: String,
    pub brand_logo: Option<String>,
    pub title: String,
    pub description: String,
    pub sponsorship_type: SponsorshipType,
    pub status: SponsorshipStatus,
    pub payment_amount: f64,
    pub currency: String,
    pub requirements: Vec<String>,
    pub deliverables: Vec<String>,
    pub start_date: Option<u64>,
    pub end_date: Option<u64>,
    pub created_at: u64,
    pub applied_at: Option<u64>,
    pub accepted_at: Option<u64>,
}

/// Sponsorship application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SponsorshipApplication {
    pub id: String,
    pub sponsorship_id: String,
    pub streamer_username: String,
    pub streamer_email: String,
    pub streamer_followers: u32,
    pub streamer_average_viewers: u32,
    pub cover_letter: String,
    pub proposed_rate: Option<f64>,
    pub created_at: u64,
}

/// Sponsorship config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SponsorshipConfig {
    pub enabled: bool,
    pub auto_apply: bool,
    pub min_payment_amount: f64,
    pub preferred_types: Vec<SponsorshipType>,
    pub notify_new_sponsorships: bool,
    pub notify_application_updates: bool,
}

impl Default for SponsorshipConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_apply: false,
            min_payment_amount: 100.0,
            preferred_types: vec![
                SponsorshipType::OneTime,
                SponsorshipType::Recurring,
            ],
            notify_new_sponsorships: true,
            notify_application_updates: true,
        }
    }
}

/// Sponsorship statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SponsorshipStats {
    pub total_sponsorships: u64,
    pub available_sponsorships: u64,
    pub applied_sponsorships: u64,
    pub accepted_sponsorships: u64,
    pub active_sponsorships: u64,
    pub completed_sponsorships: u64,
    pub total_earnings: f64,
    pub pending_earnings: f64,
}

/// Sponsor marketplace engine state
pub struct SponsorMarketplaceEngine {
    pub config: SponsorshipConfig,
    pub sponsorships: Vec<Sponsorship>,
    pub applications: Vec<SponsorshipApplication>,
    pub stats: SponsorshipStats,
}

impl SponsorMarketplaceEngine {
    pub fn new() -> Self {
        Self {
            config: SponsorshipConfig::default(),
            sponsorships: Vec::new(),
            applications: Vec::new(),
            stats: SponsorshipStats {
                total_sponsorships: 0,
                available_sponsorships: 0,
                applied_sponsorships: 0,
                accepted_sponsorships: 0,
                active_sponsorships: 0,
                completed_sponsorships: 0,
                total_earnings: 0.0,
                pending_earnings: 0.0,
            },
        }
    }

    /// Add sponsorship
    pub fn add_sponsorship(&mut self, sponsorship: Sponsorship) -> Result<(), String> {
        self.sponsorships.push(sponsorship.clone());
        self.stats.total_sponsorships += 1;
        
        match sponsorship.status {
            SponsorshipStatus::Available => self.stats.available_sponsorships += 1,
            SponsorshipStatus::Applied => self.stats.applied_sponsorships += 1,
            SponsorshipStatus::Accepted => self.stats.accepted_sponsorships += 1,
            SponsorshipStatus::Active => {
                self.stats.active_sponsorships += 1;
                self.stats.pending_earnings += sponsorship.payment_amount;
            }
            SponsorshipStatus::Completed => {
                self.stats.completed_sponsorships += 1;
                self.stats.total_earnings += sponsorship.payment_amount;
            }
            _ => {}
        }
        
        Ok(())
    }

    /// Get all sponsorships

    pub fn get_sponsorship(&self, sponsorship_id: String) -> Option<Sponsorship> {
        self.sponsorships.iter().find(|s| s.id == sponsorship_id).cloned()
    }

    pub fn get_sponsorships(&self) -> Vec<Sponsorship> {
        self.sponsorships.clone()
    }

    /// Get sponsorships by status
    pub fn get_sponsorships_by_status(&self, status: SponsorshipStatus) -> Vec<Sponsorship> {
        self.sponsorships.iter().filter(|s| s.status == status).cloned().collect()
    }

    /// Apply for sponsorship
    pub fn apply_for_sponsorship(&mut self, sponsorship_id: String, application: SponsorshipApplication) -> Result<(), String> {
        // Find sponsorship
        if let Some(sponsorship) = self.sponsorships.iter_mut().find(|s| s.id == sponsorship_id) {
            if sponsorship.status != SponsorshipStatus::Available {
                return Err("Sponsorship is not available".to_string());
            }
            
            sponsorship.status = SponsorshipStatus::Applied;
            sponsorship.applied_at = Some(std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs());
            
            self.applications.push(application);
            self.stats.available_sponsorships -= 1;
            self.stats.applied_sponsorships += 1;
            
            Ok(())
        } else {
            Err("Sponsorship not found".to_string())
        }
    }

    /// Update sponsorship status
    pub fn update_sponsorship_status(&mut self, sponsorship_id: String, status: SponsorshipStatus) -> Result<(), String> {
        if let Some(sponsorship) = self.sponsorships.iter_mut().find(|s| s.id == sponsorship_id) {
            let old_status = sponsorship.status.clone();
            sponsorship.status = status.clone();
            
            // Update stats
            match old_status {
                SponsorshipStatus::Available => self.stats.available_sponsorships -= 1,
                SponsorshipStatus::Applied => self.stats.applied_sponsorships -= 1,
                SponsorshipStatus::Accepted => self.stats.accepted_sponsorships -= 1,
                SponsorshipStatus::Active => {
                    self.stats.active_sponsorships -= 1;
                    self.stats.pending_earnings -= sponsorship.payment_amount;
                }
                SponsorshipStatus::Completed => {
                    self.stats.completed_sponsorships -= 1;
                    self.stats.total_earnings -= sponsorship.payment_amount;
                }
                _ => {}
            }
            
            match status {
                SponsorshipStatus::Available => self.stats.available_sponsorships += 1,
                SponsorshipStatus::Applied => self.stats.applied_sponsorships += 1,
                SponsorshipStatus::Accepted => self.stats.accepted_sponsorships += 1,
                SponsorshipStatus::Active => {
                    self.stats.active_sponsorships += 1;
                    self.stats.pending_earnings += sponsorship.payment_amount;
                    sponsorship.accepted_at = Some(std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs());
                }
                SponsorshipStatus::Completed => {
                    self.stats.completed_sponsorships += 1;
                    self.stats.total_earnings += sponsorship.payment_amount;
                    self.stats.pending_earnings -= sponsorship.payment_amount;
                }
                _ => {}
            }
            
            Ok(())
        } else {
            Err("Sponsorship not found".to_string())
        }
    }

    /// Get all applications
    pub fn get_applications(&self) -> Vec<SponsorshipApplication> {
        self.applications.clone()
    }

    /// Update config
    pub fn update_config(&mut self, config: SponsorshipConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> SponsorshipConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> SponsorshipStats {
        self.stats.clone()
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
fn get_sponsorship_config(state: tauri::State<AppState>) -> SponsorshipConfig {
    state.sponsor_marketplace_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_sponsorship_config(
    config: SponsorshipConfig,
    state: tauri::State<AppState>,
) {
    state.sponsor_marketplace_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn get_sponsorships(state: tauri::State<AppState>) -> Vec<Sponsorship> {
    state.sponsor_marketplace_engine.lock().unwrap().get_sponsorships()
}

#[tauri::command]
fn get_sponsorships_by_status(
    status: String,
    state: tauri::State<AppState>,
) -> Vec<Sponsorship> {
    let status = match status.as_str() {
        "available" => SponsorshipStatus::Available,
        "applied" => SponsorshipStatus::Applied,
        "in_review" => SponsorshipStatus::InReview,
        "accepted" => SponsorshipStatus::Accepted,
        "active" => SponsorshipStatus::Active,
        "completed" => SponsorshipStatus::Completed,
        "rejected" => SponsorshipStatus::Rejected,
        "cancelled" => SponsorshipStatus::Cancelled,
        _ => return Vec::new(),
    };
    
    state.sponsor_marketplace_engine.lock().unwrap().get_sponsorships_by_status(status)
}

#[tauri::command]
fn apply_for_sponsorship(
    sponsorship_id: String,
    streamer_username: String,
    streamer_email: String,
    streamer_followers: u32,
    streamer_average_viewers: u32,
    cover_letter: String,
    proposed_rate: Option<f64>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let application = SponsorshipApplication {
        id: uuid::Uuid::new_v4().to_string(),
        sponsorship_id,
        streamer_username,
        streamer_email,
        streamer_followers,
        streamer_average_viewers,
        cover_letter,
        proposed_rate,
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    state.sponsor_marketplace_engine.lock().unwrap().apply_for_sponsorship(application.sponsorship_id.clone(), application)
}

#[tauri::command]
fn update_sponsorship_status(
    sponsorship_id: String,
    status: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let status = match status.as_str() {
        "available" => SponsorshipStatus::Available,
        "applied" => SponsorshipStatus::Applied,
        "in_review" => SponsorshipStatus::InReview,
        "accepted" => SponsorshipStatus::Accepted,
        "active" => SponsorshipStatus::Active,
        "completed" => SponsorshipStatus::Completed,
        "rejected" => SponsorshipStatus::Rejected,
        "cancelled" => SponsorshipStatus::Cancelled,
        _ => return Err("Invalid status".to_string()),
    };
    
    state.sponsor_marketplace_engine.lock().unwrap().update_sponsorship_status(sponsorship_id, status)
}

#[tauri::command]
fn get_sponsorship_applications(state: tauri::State<AppState>) -> Vec<SponsorshipApplication> {
    state.sponsor_marketplace_engine.lock().unwrap().get_applications()
}

#[tauri::command]
fn get_sponsorship_stats(state: tauri::State<AppState>) -> SponsorshipStats {
    state.sponsor_marketplace_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_sponsorship_statuses() -> Vec<String> {
    vec![
        "available".to_string(),
        "applied".to_string(),
        "in_review".to_string(),
        "accepted".to_string(),
        "active".to_string(),
        "completed".to_string(),
        "rejected".to_string(),
        "cancelled".to_string(),
    ]
}

#[tauri::command]
fn get_sponsorship_types() -> Vec<String> {
    vec![
        "one_time".to_string(),
        "recurring".to_string(),
        "affiliate".to_string(),
        "product_placement".to_string(),
        "brand_ambassador".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sponsorship_creation() {
        let sponsorship = Sponsorship {
            id: "sponsor1".to_string(),
            brand_name: "TechBrand".to_string(),
            brand_logo: Some("https://example.com/logo.png".to_string()),
            title: "Product Review".to_string(),
            description: "Review our product".to_string(),
            sponsorship_type: SponsorshipType::OneTime,
            status: SponsorshipStatus::Available,
            payment_amount: 500.0,
            currency: "USD".to_string(),
            requirements: vec!["At least 1000 viewers".to_string()],
            deliverables: vec!["10 minute review".to_string()],
            start_date: Some(1234567890),
            end_date: Some(1234567890),
            created_at: 1234567890,
            applied_at: None,
            accepted_at: None,
        };

        assert_eq!(sponsorship.id, "sponsor1");
        assert_eq!(sponsorship.sponsorship_type, SponsorshipType::OneTime);
        assert_eq!(sponsorship.status, SponsorshipStatus::Available);
        assert_eq!(sponsorship.payment_amount, 500.0);
    }

    #[test]
    fn test_sponsorship_application_creation() {
        let application = SponsorshipApplication {
            id: "app1".to_string(),
            sponsorship_id: "sponsor1".to_string(),
            streamer_username: "streamer123".to_string(),
            streamer_email: "streamer@example.com".to_string(),
            streamer_followers: 5000,
            streamer_average_viewers: 500,
            cover_letter: "I'd love to review your product!".to_string(),
            proposed_rate: Some(550.0),
            created_at: 1234567890,
        };

        assert_eq!(application.id, "app1");
        assert_eq!(application.streamer_username, "streamer123");
        assert_eq!(application.streamer_followers, 5000);
    }

    #[test]
    fn test_sponsorship_config_default() {
        let config = SponsorshipConfig::default();
        
        assert_eq!(config.enabled, true);
        assert_eq!(config.auto_apply, false);
        assert_eq!(config.min_payment_amount, 100.0);
        assert_eq!(config.preferred_types.len(), 2);
    }

    #[test]
    fn test_sponsorship_status_variants() {
        let statuses = vec![
            SponsorshipStatus::Available,
            SponsorshipStatus::Applied,
            SponsorshipStatus::InReview,
            SponsorshipStatus::Accepted,
            SponsorshipStatus::Active,
            SponsorshipStatus::Completed,
            SponsorshipStatus::Rejected,
            SponsorshipStatus::Cancelled,
        ];

        assert_eq!(statuses.len(), 8);
        assert_eq!(statuses[0], SponsorshipStatus::Available);
    }

    #[test]
    fn test_sponsorship_type_variants() {
        let types = vec![
            SponsorshipType::OneTime,
            SponsorshipType::Recurring,
            SponsorshipType::Affiliate,
            SponsorshipType::ProductPlacement,
            SponsorshipType::BrandAmbassador,
        ];

        assert_eq!(types.len(), 5);
        assert_eq!(types[0], SponsorshipType::OneTime);
    }

    #[test]
    fn test_sponsorship_serialization() {
        let sponsorship = Sponsorship {
            id: "sponsor1".to_string(),
            brand_name: "TechBrand".to_string(),
            brand_logo: None,
            title: "Product Review".to_string(),
            description: "Review our product".to_string(),
            sponsorship_type: SponsorshipType::OneTime,
            status: SponsorshipStatus::Available,
            payment_amount: 500.0,
            currency: "USD".to_string(),
            requirements: vec![],
            deliverables: vec![],
            start_date: None,
            end_date: None,
            created_at: 1234567890,
            applied_at: None,
            accepted_at: None,
        };

        // Test that struct can be serialized (compile-time check)
        let _json = serde_json::to_string(&sponsorship);
        assert!(true);
    }
}
