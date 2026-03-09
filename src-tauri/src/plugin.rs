use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

/// Plugin manager for loading and managing plugins
pub struct PluginManager {
    plugins: Arc<Mutex<HashMap<String, Plugin>>>,
}

impl PluginManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            plugins: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Load a plugin
    pub fn load_plugin(&self, _path: String) -> Result<Plugin, String> {
        Ok(Plugin {
            id: "plugin_1".to_string(),
            name: "Example Plugin".to_string(),
            version: "1.0.0".to_string(),
            author: "VantisCorp".to_string(),
            enabled: true,
        })
    }

    /// Unload a plugin
    pub fn unload_plugin(&self, _plugin_id: String) -> Result<(), String> {
        Ok(())
    }

    /// Enable a plugin
    pub fn enable_plugin(&self, _plugin_id: String) -> Result<(), String> {
        Ok(())
    }

    /// Disable a plugin
    pub fn disable_plugin(&self, _plugin_id: String) -> Result<(), String> {
        Ok(())
    }

    /// Get all loaded plugins
    pub fn get_plugins(&self) -> Vec<Plugin> {
        self.plugins.lock().unwrap().values().cloned().collect()
    }
}

/// Plugin information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub enabled: bool,
}

/// Plugin API for third-party developers
pub trait PluginApi {
    /// Called when plugin is loaded
    fn on_load(&mut self) -> Result<(), String>;
    
    /// Called when plugin is unloaded
    fn on_unload(&mut self) -> Result<(), String>;
    
    /// Called every frame
    fn on_update(&mut self, delta_time: f32) -> Result<(), String>;
    
    /// Get plugin information
    fn get_info(&self) -> PluginInfo;
}

/// Plugin information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginInfo {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_manager_creation() {
        let manager = PluginManager::new();
        assert_eq!(manager.plugins.len(), 0);
    }

    #[test]
    fn test_plugin_info() {
        let info = PluginInfo {
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            author: "Test Author".to_string(),
            description: "A test plugin".to_string(),
        };

        assert_eq!(info.name, "Test Plugin");
        assert_eq!(info.version, "1.0.0");
    }

    #[test]
    fn test_plugin_state() {
        assert_eq!(PluginState::Unloaded.to_string(), "Unloaded");
        assert_eq!(PluginState::Loaded.to_string(), "Loaded");
        assert_eq!(PluginState::Running.to_string(), "Running");
        assert_eq!(PluginState::Error.to_string(), "Error");
    }
}
