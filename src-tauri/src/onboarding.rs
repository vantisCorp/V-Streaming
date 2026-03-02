use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

/// Onboarding system for new users
pub struct OnboardingEngine {
    is_active: Arc<Mutex<bool>>,
    current_step: Arc<Mutex<Option<OnboardingStep>>>,
    completed_steps: Arc<Mutex<Vec<OnboardingStep>>>,
    skipped_steps: Arc<Mutex<Vec<OnboardingStep>>>,
    user_preferences: Arc<Mutex<UserPreferences>>,
    progress: Arc<Mutex<OnboardingProgress>>,
}

impl OnboardingEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            is_active: Arc::new(Mutex::new(false)),
            current_step: Arc::new(Mutex::new(None)),
            completed_steps: Arc::new(Mutex::new(Vec::new())),
            skipped_steps: Arc::new(Mutex::new(Vec::new())),
            user_preferences: Arc::new(Mutex::new(UserPreferences::default())),
            progress: Arc::new(Mutex::new(OnboardingProgress::default())),
        })
    }

    /// Start onboarding
    pub fn start_onboarding(&self) -> Result<(), String> {
        let mut active = self.is_active.lock().map_err(|e| e.to_string())?;
        *active = true;
        
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        *current = Some(OnboardingStep::Welcome);
        
        Ok(())
    }

    /// Stop onboarding
    pub fn stop_onboarding(&self) -> Result<(), String> {
        let mut active = self.is_active.lock().map_err(|e| e.to_string())?;
        *active = false;
        
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        *current = None;
        
        Ok(())
    }

    /// Check if onboarding is active
    pub fn is_onboarding_active(&self) -> Result<bool, String> {
        let active = self.is_active.lock().map_err(|e| e.to_string())?;
        Ok(*active)
    }

    /// Get current onboarding step
    pub fn get_current_step(&self) -> Result<Option<OnboardingStep>, String> {
        let current = self.current_step.lock().map_err(|e| e.to_string())?;
        Ok(*current)
    }

    /// Go to next step
    pub fn next_step(&self) -> Result<Option<OnboardingStep>, String> {
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        let mut completed = self.completed_steps.lock().map_err(|e| e.to_string())?;
        let mut progress = self.progress.lock().map_err(|e| e.to_string())?;
        
        if let Some(step) = *current {
            completed.push(step);
            progress.completed_steps += 1;
            
            let next = step.next();
            *current = next;
            
            if next.is_some() {
                progress.current_step_index += 1;
            } else {
                // Onboarding completed
                let mut active = self.is_active.lock().map_err(|e| e.to_string())?;
                *active = false;
                progress.completed = true;
            }
            
            Ok(next)
        } else {
            Ok(None)
        }
    }

    /// Go to previous step
    pub fn previous_step(&self) -> Result<Option<OnboardingStep>, String> {
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        let mut completed = self.completed_steps.lock().map_err(|e| e.to_string())?;
        let mut progress = self.progress.lock().map_err(|e| e.to_string())?;
        
        if let Some(step) = *current {
            let prev = step.previous();
            
            if let Some(prev_step) = prev {
                if let Some(last_completed) = completed.pop() {
                    progress.completed_steps -= 1;
                    progress.current_step_index -= 1;
                }
                *current = Some(prev_step);
                Ok(Some(prev_step))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Skip current step
    pub fn skip_step(&self) -> Result<(), String> {
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        let mut skipped = self.skipped_steps.lock().map_err(|e| e.to_string())?;
        let mut progress = self.progress.lock().map_err(|e| e.to_string())?;
        
        if let Some(step) = *current {
            skipped.push(step);
            progress.skipped_steps += 1;
            
            let next = step.next();
            *current = next;
            
            if next.is_some() {
                progress.current_step_index += 1;
            } else {
                let mut active = self.is_active.lock().map_err(|e| e.to_string())?;
                *active = false;
                progress.completed = true;
            }
        }
        
        Ok(())
    }

    /// Jump to specific step
    pub fn jump_to_step(&self, step: OnboardingStep) -> Result<(), String> {
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        *current = Some(step);
        Ok(())
    }

    /// Get onboarding progress
    pub fn get_progress(&self) -> Result<OnboardingProgress, String> {
        let progress = self.progress.lock().map_err(|e| e.to_string())?;
        Ok(progress.clone())
    }

    /// Get completed steps
    pub fn get_completed_steps(&self) -> Result<Vec<OnboardingStep>, String> {
        let completed = self.completed_steps.lock().map_err(|e| e.to_string())?;
        Ok(completed.clone())
    }

    /// Get skipped steps
    pub fn get_skipped_steps(&self) -> Result<Vec<OnboardingStep>, String> {
        let skipped = self.skipped_steps.lock().map_err(|e| e.to_string())?;
        Ok(skipped.clone())
    }

    /// Save user preference
    pub fn save_preference(&self, key: String, value: String) -> Result<(), String> {
        let mut prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        prefs.preferences.insert(key, value);
        Ok(())
    }

    /// Get user preference
    pub fn get_preference(&self, key: String) -> Result<Option<String>, String> {
        let prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        Ok(prefs.preferences.get(&key).cloned())
    }

    /// Get all user preferences
    pub fn get_all_preferences(&self) -> Result<UserPreferences, String> {
        let prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        Ok(prefs.clone())
    }

    /// Get step content
    pub fn get_step_content(&self, step: OnboardingStep) -> Result<StepContent, String> {
        Ok(step.get_content())
    }

    /// Get all steps
    pub fn get_all_steps(&self) -> Result<Vec<OnboardingStep>, String> {
        Ok(OnboardingStep::all_steps())
    }

    /// Reset onboarding
    pub fn reset_onboarding(&self) -> Result<(), String> {
        let mut active = self.is_active.lock().map_err(|e| e.to_string())?;
        let mut current = self.current_step.lock().map_err(|e| e.to_string())?;
        let mut completed = self.completed_steps.lock().map_err(|e| e.to_string())?;
        let mut skipped = self.skipped_steps.lock().map_err(|e| e.to_string())?;
        let mut progress = self.progress.lock().map_err(|e| e.to_string())?;
        let mut prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        
        *active = false;
        *current = None;
        completed.clear();
        skipped.clear();
        *progress = OnboardingProgress::default();
        *prefs = UserPreferences::default();
        
        Ok(())
    }

    /// Export onboarding data
    pub fn export_data(&self) -> Result<String, String> {
        let prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        let progress = self.progress.lock().map_err(|e| e.to_string())?;
        
        let data = OnboardingData {
            preferences: prefs.clone(),
            progress: progress.clone(),
            completed_steps: self.get_completed_steps()?,
            skipped_steps: self.get_skipped_steps()?,
        };
        
        serde_json::to_string_pretty(&data)
            .map_err(|e| e.to_string())
    }

    /// Import onboarding data
    pub fn import_data(&self, json: String) -> Result<(), String> {
        let data: OnboardingData = serde_json::from_str(&json)
            .map_err(|e| e.to_string())?;
        
        let mut prefs = self.user_preferences.lock().map_err(|e| e.to_string())?;
        *prefs = data.preferences;
        
        let mut progress = self.progress.lock().map_err(|e| e.to_string())?;
        *progress = data.progress;
        
        Ok(())
    }
}

/// Onboarding step
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OnboardingStep {
    Welcome,
    InterfaceMode,
    CaptureSetup,
    AudioSetup,
    SceneCreation,
    StreamingSetup,
    KeyboardShortcuts,
    TipsAndTricks,
    Completion,
}

impl OnboardingStep {
    pub fn next(&self) -> Option<Self> {
        match self {
            OnboardingStep::Welcome => Some(OnboardingStep::InterfaceMode),
            OnboardingStep::InterfaceMode => Some(OnboardingStep::CaptureSetup),
            OnboardingStep::CaptureSetup => Some(OnboardingStep::AudioSetup),
            OnboardingStep::AudioSetup => Some(OnboardingStep::SceneCreation),
            OnboardingStep::SceneCreation => Some(OnboardingStep::StreamingSetup),
            OnboardingStep::StreamingSetup => Some(OnboardingStep::KeyboardShortcuts),
            OnboardingStep::KeyboardShortcuts => Some(OnboardingStep::TipsAndTricks),
            OnboardingStep::TipsAndTricks => Some(OnboardingStep::Completion),
            OnboardingStep::Completion => None,
        }
    }

    pub fn previous(&self) -> Option<Self> {
        match self {
            OnboardingStep::Welcome => None,
            OnboardingStep::InterfaceMode => Some(OnboardingStep::Welcome),
            OnboardingStep::CaptureSetup => Some(OnboardingStep::InterfaceMode),
            OnboardingStep::AudioSetup => Some(OnboardingStep::CaptureSetup),
            OnboardingStep::SceneCreation => Some(OnboardingStep::AudioSetup),
            OnboardingStep::StreamingSetup => Some(OnboardingStep::SceneCreation),
            OnboardingStep::KeyboardShortcuts => Some(OnboardingStep::StreamingSetup),
            OnboardingStep::TipsAndTricks => Some(OnboardingStep::KeyboardShortcuts),
            OnboardingStep::Completion => Some(OnboardingStep::TipsAndTricks),
        }
    }

    pub fn get_content(&self) -> StepContent {
        match self {
            OnboardingStep::Welcome => StepContent {
                title: "Welcome to V-Streaming!".to_string(),
                description: "Let's get you set up for professional streaming in just a few minutes.".to_string(),
                tips: vec![
                    "This onboarding will guide you through the essential features".to_string(),
                    "You can skip any step and come back later".to_string(),
                    "Your preferences will be saved automatically".to_string(),
                ],
                action_text: "Get Started".to_string(),
                can_skip: false,
            },
            OnboardingStep::InterfaceMode => StepContent {
                title: "Choose Your Experience".to_string(),
                description: "Select the interface mode that best fits your needs.".to_string(),
                tips: vec![
                    "Simple mode: Essential controls for beginners".to_string(),
                    "Expert mode: Full access to all features and settings".to_string(),
                    "You can switch modes anytime in settings".to_string(),
                ],
                action_text: "Continue".to_string(),
                can_skip: false,
            },
            OnboardingStep::CaptureSetup => StepContent {
                title: "Set Up Your Capture".to_string(),
                description: "Configure your video capture source for streaming.".to_string(),
                tips: vec![
                    "Select your game window or screen".to_string(),
                    "For best quality, use game capture when possible".to_string(),
                    "Test your capture before going live".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::AudioSetup => StepContent {
                title: "Configure Your Audio".to_string(),
                description: "Set up your microphone and audio sources.".to_string(),
                tips: vec![
                    "Select your default microphone".to_string(),
                    "Adjust levels to avoid clipping".to_string(),
                    "Use headphones to prevent echo".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::SceneCreation => StepContent {
                title: "Create Your First Scene".to_string(),
                description: "Scenes let you organize your stream layout.".to_string(),
                tips: vec![
                    "Add layers to build your scene".to_string(),
                    "Use different scenes for different activities".to_string(),
                    "Switch scenes instantly during your stream".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::StreamingSetup => StepContent {
                title: "Connect Your Streaming Platform".to_string(),
                description: "Link your Twitch, YouTube, or other streaming account.".to_string(),
                tips: vec![
                    "You'll need your stream key from your platform".to_string(),
                    "Test your stream before going live".to_string(),
                    "Save multiple stream profiles for different platforms".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::KeyboardShortcuts => StepContent {
                title: "Keyboard Shortcuts".to_string(),
                description: "Learn the essential shortcuts for faster control.".to_string(),
                tips: vec![
                    "Ctrl+Shift+S: Start/Stop Stream".to_string(),
                    "Ctrl+M: Mute/Unmute Audio".to_string(),
                    "Ctrl+Left/Right: Switch Scenes".to_string(),
                    "F11: Toggle Fullscreen".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::TipsAndTricks => StepContent {
                title: "Pro Tips".to_string(),
                description: "Here are some tips to improve your streaming experience.".to_string(),
                tips: vec![
                    "Use a stable internet connection (at least 5 Mbps upload)".to_string(),
                    "Keep your background clean and professional".to_string(),
                    "Engage with your chat regularly".to_string(),
                    "Take breaks to avoid burnout".to_string(),
                ],
                action_text: "Next".to_string(),
                can_skip: true,
            },
            OnboardingStep::Completion => StepContent {
                title: "You're All Set!".to_string(),
                description: "You've completed the onboarding. Start streaming now!".to_string(),
                tips: vec![
                    "Access settings anytime from the gear icon".to_string(),
                    "Check out our documentation for more tips".to_string(),
                    "Join our community for support and updates".to_string(),
                ],
                action_text: "Start Streaming".to_string(),
                can_skip: false,
            },
        }
    }

    pub fn all_steps() -> Vec<Self> {
        vec![
            OnboardingStep::Welcome,
            OnboardingStep::InterfaceMode,
            OnboardingStep::CaptureSetup,
            OnboardingStep::AudioSetup,
            OnboardingStep::SceneCreation,
            OnboardingStep::StreamingSetup,
            OnboardingStep::KeyboardShortcuts,
            OnboardingStep::TipsAndTricks,
            OnboardingStep::Completion,
        ]
    }
}

/// Step content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepContent {
    pub title: String,
    pub description: String,
    pub tips: Vec<String>,
    pub action_text: String,
    pub can_skip: bool,
}

/// User preferences collected during onboarding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub preferences: std::collections::HashMap<String, String>,
    pub interface_mode: Option<String>,
    pub capture_source: Option<String>,
    pub audio_device: Option<String>,
    pub streaming_platform: Option<String>,
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            preferences: std::collections::HashMap::new(),
            interface_mode: None,
            capture_source: None,
            audio_device: None,
            streaming_platform: None,
        }
    }
}

/// Onboarding progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnboardingProgress {
    pub current_step_index: usize,
    pub total_steps: usize,
    pub completed_steps: usize,
    pub skipped_steps: usize,
    pub completed: bool,
}

impl Default for OnboardingProgress {
    fn default() -> Self {
        Self {
            current_step_index: 0,
            total_steps: 9,
            completed_steps: 0,
            skipped_steps: 0,
            completed: false,
        }
    }
}

/// Onboarding data for export/import
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnboardingData {
    pub preferences: UserPreferences,
    pub progress: OnboardingProgress,
    pub completed_steps: Vec<OnboardingStep>,
    pub skipped_steps: Vec<OnboardingStep>,
}