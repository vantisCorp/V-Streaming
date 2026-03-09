use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};

/// UI and Settings management engine
pub struct UiEngine {
    is_active: Arc<Mutex<bool>>,
    settings: Arc<Mutex<UserSettings>>,
    ui_state: Arc<Mutex<UiState>>,
    onboarding_completed: Arc<Mutex<bool>>,
    theme: Arc<Mutex<Theme>>,
    keyboard_shortcuts: Arc<Mutex<HashMap<String, String>>>,
    undo_stack: Arc<Mutex<Vec<UiAction>>>,
    redo_stack: Arc<Mutex<Vec<UiAction>>>,
}

impl UiEngine {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            is_active: Arc::new(Mutex::new(false)),
            settings: Arc::new(Mutex::new(UserSettings::default())),
            ui_state: Arc::new(Mutex::new(UiState::default())),
            onboarding_completed: Arc::new(Mutex::new(false)),
            theme: Arc::new(Mutex::new(Theme::Dark)),
            keyboard_shortcuts: Arc::new(Mutex::new(Self::default_shortcuts())),
            undo_stack: Arc::new(Mutex::new(Vec::new())),
            redo_stack: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Get user settings
    pub fn get_settings(&self) -> Result<UserSettings, String> {
        let settings = self.settings.lock().map_err(|e| e.to_string())?;
        Ok(settings.clone())
    }

    /// Update user settings
    pub fn update_settings(&self, updates: SettingsUpdate) -> Result<UserSettings, String> {
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        
        if let Some(interface_mode) = updates.interface_mode {
            settings.interface_mode = interface_mode;
        }
        if let Some(theme) = updates.theme {
            settings.theme = theme;
        }
        if let Some(language) = updates.language {
            settings.language = language;
        }
        if let Some(auto_save) = updates.auto_save {
            settings.auto_save = auto_save;
        }
        if let Some(save_interval) = updates.save_interval {
            settings.save_interval = save_interval;
        }
        if let Some(show_tooltips) = updates.show_tooltips {
            settings.show_tooltips = show_tooltips;
        }
        if let Some(enable_animations) = updates.enable_animations {
            settings.enable_animations = enable_animations;
        }
        if let Some(window_layout) = updates.window_layout {
            settings.window_layout = window_layout;
        }
        
        Ok(settings.clone())
    }

    /// Get UI state
    pub fn get_ui_state(&self) -> Result<UiState, String> {
        let state = self.ui_state.lock().map_err(|e| e.to_string())?;
        Ok(state.clone())
    }

    /// Update UI state
    pub fn update_ui_state(&self, updates: UiStateUpdate) -> Result<UiState, String> {
        let mut state = self.ui_state.lock().map_err(|e| e.to_string())?;
        
        if let Some(active_tab) = updates.active_tab {
            state.active_tab = active_tab;
        }
        if let Some(dock_layout) = updates.dock_layout {
            state.dock_layout = dock_layout;
        }
        if let Some(panel_visibility) = updates.panel_visibility {
            state.panel_visibility = panel_visibility;
        }
        if let Some(window_size) = updates.window_size {
            state.window_size = window_size;
        }
        if let Some(window_position) = updates.window_position {
            state.window_position = window_position;
        }
        
        Ok(state.clone())
    }

    /// Switch interface mode (Simple/Expert)
    pub fn switch_interface_mode(&self, mode: InterfaceMode) -> Result<(), String> {
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        settings.interface_mode = mode;
        Ok(())
    }

    /// Get current interface mode
    pub fn get_interface_mode(&self) -> Result<InterfaceMode, String> {
        let settings = self.settings.lock().map_err(|e| e.to_string())?;
        Ok(settings.interface_mode)
    }

    /// Check if onboarding is completed
    pub fn is_onboarding_completed(&self) -> Result<bool, String> {
        let completed = self.onboarding_completed.lock().map_err(|e| e.to_string())?;
        Ok(*completed)
    }

    /// Mark onboarding as completed
    pub fn complete_onboarding(&self) -> Result<(), String> {
        let mut completed = self.onboarding_completed.lock().map_err(|e| e.to_string())?;
        *completed = true;
        Ok(())
    }

    /// Reset onboarding
    pub fn reset_onboarding(&self) -> Result<(), String> {
        let mut completed = self.onboarding_completed.lock().map_err(|e| e.to_string())?;
        *completed = false;
        Ok(())
    }

    /// Get current theme
    pub fn get_theme(&self) -> Result<Theme, String> {
        let theme = self.theme.lock().map_err(|e| e.to_string())?;
        Ok(*theme)
    }

    /// Set theme
    pub fn set_theme(&self, theme: Theme) -> Result<(), String> {
        let mut current_theme = self.theme.lock().map_err(|e| e.to_string())?;
        *current_theme = theme;
        
        // Also update in settings
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        settings.theme = theme;
        
        Ok(())
    }

    /// Get keyboard shortcuts
    pub fn get_keyboard_shortcuts(&self) -> Result<HashMap<String, String>, String> {
        let shortcuts = self.keyboard_shortcuts.lock().map_err(|e| e.to_string())?;
        Ok(shortcuts.clone())
    }

    /// Set keyboard shortcut
    pub fn set_keyboard_shortcut(&self, action: String, shortcut: String) -> Result<(), String> {
        let mut shortcuts = self.keyboard_shortcuts.lock().map_err(|e| e.to_string())?;
        shortcuts.insert(action, shortcut);
        Ok(())
    }

    /// Reset keyboard shortcuts to defaults
    pub fn reset_keyboard_shortcuts(&self) -> Result<(), String> {
        let mut shortcuts = self.keyboard_shortcuts.lock().map_err(|e| e.to_string())?;
        *shortcuts = Self::default_shortcuts();
        Ok(())
    }

    /// Push action to undo stack
    pub fn push_undo(&self, action: UiAction) -> Result<(), String> {
        let mut stack = self.undo_stack.lock().map_err(|e| e.to_string())?;
        stack.push(action);
        // Clear redo stack when new action is performed
        let mut redo = self.redo_stack.lock().map_err(|e| e.to_string())?;
        redo.clear();
        Ok(())
    }

    /// Undo last action
    pub fn undo(&self) -> Result<Option<UiAction>, String> {
        let mut undo_stack = self.undo_stack.lock().map_err(|e| e.to_string())?;
        let mut redo_stack = self.redo_stack.lock().map_err(|e| e.to_string())?;
        
        if let Some(action) = undo_stack.pop() {
            redo_stack.push(action.clone());
            Ok(Some(action))
        } else {
            Ok(None)
        }
    }

    /// Redo last undone action
    pub fn redo(&self) -> Result<Option<UiAction>, String> {
        let mut undo_stack = self.undo_stack.lock().map_err(|e| e.to_string())?;
        let mut redo_stack = self.redo_stack.lock().map_err(|e| e.to_string())?;
        
        if let Some(action) = redo_stack.pop() {
            undo_stack.push(action.clone());
            Ok(Some(action))
        } else {
            Ok(None)
        }
    }

    /// Clear undo/redo stacks
    pub fn clear_undo_redo(&self) -> Result<(), String> {
        let mut undo = self.undo_stack.lock().map_err(|e| e.to_string())?;
        let mut redo = self.redo_stack.lock().map_err(|e| e.to_string())?;
        undo.clear();
        redo.clear();
        Ok(())
    }

    /// Get undo/redo stack sizes
    pub fn get_undo_redo_info(&self) -> Result<UndoRedoInfo, String> {
        let undo = self.undo_stack.lock().map_err(|e| e.to_string())?;
        let redo = self.redo_stack.lock().map_err(|e| e.to_string())?;
        
        Ok(UndoRedoInfo {
            undo_count: undo.len(),
            redo_count: redo.len(),
            can_undo: !undo.is_empty(),
            can_redo: !redo.is_empty(),
        })
    }

    /// Export settings to JSON
    pub fn export_settings(&self) -> Result<String, String> {
        let settings = self.settings.lock().map_err(|e| e.to_string())?;
        serde_json::to_string_pretty(&*settings)
            .map_err(|e| e.to_string())
    }

    /// Import settings from JSON
    pub fn import_settings(&self, json: String) -> Result<(), String> {
        let imported: UserSettings = serde_json::from_str(&json)
            .map_err(|e| e.to_string())?;
        
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        *settings = imported;
        
        Ok(())
    }

    /// Reset settings to defaults
    pub fn reset_settings(&self) -> Result<(), String> {
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        *settings = UserSettings::default();
        Ok(())
    }

    /// Save settings to file
    pub fn save_settings_to_file(&self, path: String) -> Result<(), String> {
        let settings = self.settings.lock().map_err(|e| e.to_string())?;
        let json = serde_json::to_string_pretty(&*settings)
            .map_err(|e| e.to_string())?;
        
        std::fs::write(&path, json)
            .map_err(|e| e.to_string())?;
        
        Ok(())
    }

    /// Load settings from file
    pub fn load_settings_from_file(&self, path: String) -> Result<(), String> {
        let json = std::fs::read_to_string(&path)
            .map_err(|e| e.to_string())?;
        
        let imported: UserSettings = serde_json::from_str(&json)
            .map_err(|e| e.to_string())?;
        
        let mut settings = self.settings.lock().map_err(|e| e.to_string())?;
        *settings = imported;
        
        Ok(())
    }

    fn default_shortcuts() -> HashMap<String, String> {
        let mut shortcuts = HashMap::new();
        shortcuts.insert("start_stream".to_string(), "Ctrl+Shift+S".to_string());
        shortcuts.insert("stop_stream".to_string(), "Ctrl+Shift+X".to_string());
        shortcuts.insert("mute_audio".to_string(), "Ctrl+M".to_string());
        shortcuts.insert("scene_next".to_string(), "Ctrl+Right".to_string());
        shortcuts.insert("scene_prev".to_string(), "Ctrl+Left".to_string());
        shortcuts.insert("undo".to_string(), "Ctrl+Z".to_string());
        shortcuts.insert("redo".to_string(), "Ctrl+Y".to_string());
        shortcuts.insert("fullscreen".to_string(), "F11".to_string());
        shortcuts.insert("screenshot".to_string(), "F12".to_string());
        shortcuts.insert("recording_toggle".to_string(), "Ctrl+R".to_string());
        shortcuts
    }
}

/// User settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub interface_mode: InterfaceMode,
    pub theme: Theme,
    pub language: String,
    pub auto_save: bool,
    pub save_interval: u32, // in seconds
    pub show_tooltips: bool,
    pub enable_animations: bool,
    pub window_layout: WindowLayout,
    pub cloud_sync_enabled: bool,
    pub cloud_sync_provider: Option<String>,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            interface_mode: InterfaceMode::Simple,
            theme: Theme::Dark,
            language: "en".to_string(),
            auto_save: true,
            save_interval: 300, // 5 minutes
            show_tooltips: true,
            enable_animations: true,
            window_layout: WindowLayout::default(),
            cloud_sync_enabled: false,
            cloud_sync_provider: None,
        }
    }
}

/// Settings update options
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SettingsUpdate {
    pub interface_mode: Option<InterfaceMode>,
    pub theme: Option<Theme>,
    pub language: Option<String>,
    pub auto_save: Option<bool>,
    pub save_interval: Option<u32>,
    pub show_tooltips: Option<bool>,
    pub enable_animations: Option<bool>,
    pub window_layout: Option<WindowLayout>,
}

/// UI state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiState {
    pub active_tab: String,
    pub dock_layout: DockLayout,
    pub panel_visibility: PanelVisibility,
    pub window_size: (u32, u32),
    pub window_position: (i32, i32),
}

impl Default for UiState {
    fn default() -> Self {
        Self {
            active_tab: "capture".to_string(),
            dock_layout: DockLayout::default(),
            panel_visibility: PanelVisibility::default(),
            window_size: (1920, 1080),
            window_position: (100, 100),
        }
    }
}

/// UI state update options
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UiStateUpdate {
    pub active_tab: Option<String>,
    pub dock_layout: Option<DockLayout>,
    pub panel_visibility: Option<PanelVisibility>,
    pub window_size: Option<(u32, u32)>,
    pub window_position: Option<(i32, i32)>,
}

/// Interface mode
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum InterfaceMode {
    Simple,
    Expert,
}

/// Theme
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Theme {
    Light,
    Dark,
    Auto,
}

/// Window layout
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowLayout {
    pub panels: Vec<PanelConfig>,
    pub dock_areas: Vec<DockArea>,
}

impl Default for WindowLayout {
    fn default() -> Self {
        Self {
            panels: vec![
                PanelConfig {
                    id: "preview".to_string(),
                    title: "Preview".to_string(),
                    position: (0, 0),
                    size: (1280, 720),
                    visible: true,
                    docked: true,
                },
                PanelConfig {
                    id: "controls".to_string(),
                    title: "Controls".to_string(),
                    position: (1280, 0),
                    size: (640, 720),
                    visible: true,
                    docked: true,
                },
            ],
            dock_areas: vec![
                DockArea {
                    id: "left".to_string(),
                    position: (0, 0),
                    size: (1280, 1080),
                },
                DockArea {
                    id: "right".to_string(),
                    position: (1280, 0),
                    size: (640, 1080),
                },
            ],
        }
    }
}

/// Panel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelConfig {
    pub id: String,
    pub title: String,
    pub position: (u32, u32),
    pub size: (u32, u32),
    pub visible: bool,
    pub docked: bool,
}

/// Dock area
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockArea {
    pub id: String,
    pub position: (u32, u32),
    pub size: (u32, u32),
}

/// Dock layout
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockLayout {
    pub panels: Vec<String>,
    pub layout_type: LayoutType,
}

impl Default for DockLayout {
    fn default() -> Self {
        Self {
            panels: vec![
                "preview".to_string(),
                "controls".to_string(),
                "audio".to_string(),
                "composition".to_string(),
            ],
            layout_type: LayoutType::Grid,
        }
    }
}

/// Layout type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LayoutType {
    Grid,
    Horizontal,
    Vertical,
    Free,
}

/// Panel visibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelVisibility {
    pub preview: bool,
    pub controls: bool,
    pub audio: bool,
    pub composition: bool,
    pub vtuber: bool,
    pub settings: bool,
}

impl Default for PanelVisibility {
    fn default() -> Self {
        Self {
            preview: true,
            controls: true,
            audio: true,
            composition: true,
            vtuber: true,
            settings: false,
        }
    }
}

/// UI action for undo/redo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UiAction {
    LayerAdded { scene_id: usize, layer_id: usize },
    LayerRemoved { scene_id: usize, layer: usize },
    LayerUpdated { scene_id: usize, layer_id: usize, old_value: String, new_value: String },
    SceneCreated { scene_id: usize },
    SceneDeleted { scene: usize },
    SceneSwitched { old_scene: Option<usize>, new_scene: usize },
    SettingsChanged { setting: String, old_value: String, new_value: String },
}

/// Undo/Redo info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoRedoInfo {
    pub undo_count: usize,
    pub redo_count: usize,
    pub can_undo: bool,
    pub can_redo: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ui_engine_creation() {
        let engine = UiEngine::new();
        assert!(engine.settings.is_some());
    }

    #[test]
    fn test_user_settings() {
        let settings = UserSettings {
            theme: Theme::Dark,
            language: "en".to_string(),
            auto_save: true,
            interface_mode: InterfaceMode::Simple,
            preview_resolution: (1920, 1080),
            show_fps: true,
        };

        assert_eq!(settings.language, "en");
        assert!(settings.auto_save);
    }

    #[test]
    fn test_ui_state() {
        let state = UiState {
            current_scene_id: Some(0),
            interface_mode: InterfaceMode::Simple,
            sidebar_visible: true,
            settings_panel_visible: false,
        };

        assert_eq!(state.current_scene_id, Some(0));
        assert!(state.sidebar_visible);
    }

    #[test]
    fn test_panel_visibility() {
        let visibility = PanelVisibility::default();
        assert!(visibility.preview);
        assert!(visibility.controls);
        assert!(!visibility.settings);
    }

    #[test]
    fn test_theme() {
        assert_eq!(Theme::Dark.to_string(), "Dark");
        assert_eq!(Theme::Light.to_string(), "Light");
    }

    #[test]
    fn test_interface_mode() {
        assert_eq!(InterfaceMode::Simple.to_string(), "Simple");
        assert_eq!(InterfaceMode::Advanced.to_string(), "Advanced");
    }

    #[test]
    fn test_window_layout() {
        let layout = WindowLayout {
            name: "Default".to_string(),
            panels: vec![],
            layout_type: LayoutType::Grid,
        };

        assert_eq!(layout.name, "Default");
    }
}
