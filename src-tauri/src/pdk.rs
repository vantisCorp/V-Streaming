//! Plugin Development Kit (PDK)
//! 
//! This module provides the foundation for third-party plugin development,
//! including plugin APIs, hooks, and integration points.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Plugin metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    /// Unique plugin identifier (e.g., "com.example.my-plugin")
    pub id: String,
    /// Plugin display name
    pub name: String,
    /// Plugin version (semantic versioning)
    pub version: String,
    /// Plugin description
    pub description: String,
    /// Plugin author
    pub author: String,
    /// Plugin license
    pub license: String,
    /// Minimum V-Streaming API version required
    pub min_api_version: String,
    /// Homepage URL
    pub homepage_url: Option<String>,
    /// Repository URL
    pub repository_url: Option<String>,
    /// Plugin category
    pub category: PluginCategory,
    /// Plugin capabilities
    pub capabilities: Vec<PluginCapability>,
    /// Configuration schema (JSON Schema)
    pub config_schema: Option<serde_json::Value>,
}

/// Plugin category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PluginCategory {
    /// Capture source plugin
    Capture,
    /// Audio effect plugin
    AudioEffect,
    /// Video filter plugin
    VideoFilter,
    /// Streaming destination plugin
    Streaming,
    /// UI theme plugin
    Theme,
    /// Integration plugin (e.g., Twitch, Discord)
    Integration,
    /// Utility plugin
    Utility,
    /// Custom category
    Custom(String),
}

/// Plugin capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginCapability {
    /// Can add capture sources
    AddCaptureSources,
    /// Can process audio
    ProcessAudio,
    /// Can process video
    ProcessVideo,
    /// Can send streams
    SendStream,
    /// Can receive streams
    ReceiveStream,
    /// Can modify UI
    ModifyUI,
    /// Can access chat
    AccessChat,
    /// Can send chat messages
    SendChat,
    /// Can manage scenes
    ManageScenes,
    /// Can manage layers
    ManageLayers,
    /// Can access configuration
    AccessConfig,
    /// Custom capability
    Custom(String),
}

/// Plugin configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    /// Plugin ID
    pub plugin_id: String,
    /// Is plugin enabled
    pub enabled: bool,
    /// Plugin-specific settings
    pub settings: HashMap<String, serde_json::Value>,
    /// Auto-start with application
    pub auto_start: bool,
}

/// Plugin context
pub struct PluginContext {
    /// Plugin ID
    pub id: String,
    /// Plugin metadata
    pub metadata: PluginMetadata,
    /// Plugin configuration
    pub config: PluginConfig,
    /// API client for V-Streaming
    pub api: PluginApiClient,
}

/// API client for plugins to interact with V-Streaming
pub struct PluginApiClient {
    /// Event emitter
    event_emitter: EventEmitter,
    /// Command executor
    command_executor: CommandExecutor,
}

impl PluginApiClient {
    /// Send a command to V-Streaming
    pub async fn send_command(
        &self,
        command: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError> {
        self.command_executor.execute(command, params).await
    }

    /// Emit an event
    pub fn emit(&self, event: &str, data: serde_json::Value) {
        self.event_emitter.emit(event, data);
    }

    /// Subscribe to an event
    pub fn subscribe(&self, event: &str, callback: EventCallback) {
        self.event_emitter.subscribe(event, callback);
    }
}

/// Event callback function type
pub type EventCallback = Box<dyn Fn(serde_json::Value) + Send + Sync>;

/// Event emitter
pub struct EventEmitter {
    listeners: Arc<Mutex<HashMap<String, Vec<EventCallback>>>>,
}

impl EventEmitter {
    pub fn new() -> Self {
        Self {
            listeners: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn emit(&self, event: &str, data: serde_json::Value) {
        let listeners = self.listeners.lock().unwrap();
        if let Some(callbacks) = listeners.get(event) {
            for callback in callbacks {
                callback(data.clone());
            }
        }
    }

    pub fn subscribe(&self, event: &str, callback: EventCallback) {
        let mut listeners = self.listeners.lock().unwrap();
        listeners.entry(event.to_string()).or_insert_with(Vec::new).push(callback);
    }
}

/// Command executor
pub struct CommandExecutor;

impl CommandExecutor {
    pub async fn execute(
        &self,
        command: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError> {
        // This would communicate with the main application
        // For now, return a mock response
        Ok(serde_json::json!({ "status": "success", "command": command }))
    }
}

/// Plugin lifecycle states
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PluginState {
    /// Plugin is not loaded
    Unloaded,
    /// Plugin is loading
    Loading,
    /// Plugin is loaded but not initialized
    Loaded,
    /// Plugin is initialized
    Initialized,
    /// Plugin is running
    Running,
    /// Plugin is paused
    Paused,
    /// Plugin is stopping
    Stopping,
    /// Plugin encountered an error
    Error,
}

/// Plugin trait that all plugins must implement
pub trait Plugin: Send + Sync {
    /// Get plugin metadata
    fn metadata(&self) -> PluginMetadata;

    /// Initialize the plugin
    fn initialize(&mut self, context: PluginContext) -> Result<(), PluginError>;

    /// Start the plugin
    fn start(&mut self) -> Result<(), PluginError>;

    /// Stop the plugin
    fn stop(&mut self) -> Result<(), PluginError>;

    /// Get current plugin state
    fn state(&self) -> PluginState;

    /// Handle a command from V-Streaming
    fn handle_command(
        &mut self,
        command: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError>;

    /// Handle an event from V-Streaming
    fn handle_event(&mut self, event: &str, data: serde_json::Value) -> Result<(), PluginError>;

    /// Get plugin configuration
    fn get_config(&self) -> PluginConfig;

    /// Update plugin configuration
    fn update_config(&mut self, config: PluginConfig) -> Result<(), PluginError>;

    /// Clean up plugin resources
    fn cleanup(&mut self) -> Result<(), PluginError>;
}

/// Base plugin implementation with common functionality
pub struct BasePlugin {
    metadata: PluginMetadata,
    state: PluginState,
    config: PluginConfig,
    context: Option<PluginContext>,
}

impl BasePlugin {
    pub fn new(metadata: PluginMetadata) -> Self {
        let config = PluginConfig {
            plugin_id: metadata.id.clone(),
            enabled: true,
            auto_start: true,
            settings: HashMap::new(),
        };

        Self {
            metadata,
            state: PluginState::Unloaded,
            config,
            context: None,
        }
    }

    pub fn set_context(&mut self, context: PluginContext) {
        self.context = Some(context);
    }

    pub fn set_state(&mut self, state: PluginState) {
        self.state = state;
    }
}

impl Plugin for BasePlugin {
    fn metadata(&self) -> PluginMetadata {
        self.metadata.clone()
    }

    fn initialize(&mut self, context: PluginContext) -> Result<(), PluginError> {
        self.set_context(context);
        self.set_state(PluginState::Initialized);
        Ok(())
    }

    fn start(&mut self) -> Result<(), PluginError> {
        self.set_state(PluginState::Running);
        Ok(())
    }

    fn stop(&mut self) -> Result<(), PluginError> {
        self.set_state(PluginState::Paused);
        Ok(())
    }

    fn state(&self) -> PluginState {
        self.state
    }

    fn handle_command(
        &mut self,
        command: &str,
        _params: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError> {
        Ok(serde_json::json!({
            "status": "success",
            "command": command,
            "plugin": self.metadata.id
        }))
    }

    fn handle_event(&mut self, _event: &str, _data: serde_json::Value) -> Result<(), PluginError> {
        Ok(())
    }

    fn get_config(&self) -> PluginConfig {
        self.config.clone()
    }

    fn update_config(&mut self, config: PluginConfig) -> Result<(), PluginError> {
        self.config = config;
        Ok(())
    }

    fn cleanup(&mut self) -> Result<(), PluginError> {
        self.set_state(PluginState::Unloaded);
        Ok(())
    }
}

/// Plugin manager
pub struct PluginManager {
    /// Loaded plugins
    plugins: HashMap<String, Box<dyn Plugin>>,
    /// Plugin states
    plugin_states: HashMap<String, PluginState>,
    /// Event emitter
    event_emitter: EventEmitter,
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            plugin_states: HashMap::new(),
            event_emitter: EventEmitter::new(),
        }
    }

    /// Register a plugin
    pub fn register_plugin(&mut self, plugin: Box<dyn Plugin>) -> Result<(), PluginError> {
        let metadata = plugin.metadata();
        let id = metadata.id.clone();
        
        if self.plugins.contains_key(&id) {
            return Err(PluginError::AlreadyRegistered { plugin_id: id });
        }
        
        self.plugins.insert(id.clone(), plugin);
        self.plugin_states.insert(id, PluginState::Loaded);
        
        Ok(())
    }

    /// Unregister a plugin
    pub fn unregister_plugin(&mut self, plugin_id: &str) -> Result<(), PluginError> {
        if let Some(mut plugin) = self.plugins.remove(plugin_id) {
            plugin.cleanup()?;
            self.plugin_states.remove(plugin_id);
            Ok(())
        } else {
            Err(PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })
        }
    }

    /// Initialize a plugin
    pub fn initialize_plugin(
        &mut self,
        plugin_id: &str,
        config: PluginConfig,
    ) -> Result<(), PluginError> {
        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })?;
        
        let context = PluginContext {
            id: plugin_id.to_string(),
            metadata: plugin.metadata(),
            config: config.clone(),
            api: PluginApiClient {
                event_emitter: EventEmitter::new(),
                command_executor: CommandExecutor,
            },
        };
        
        plugin.initialize(context)?;
        self.plugin_states.insert(plugin_id.to_string(), PluginState::Initialized);
        
        Ok(())
    }

    /// Start a plugin
    pub fn start_plugin(&mut self, plugin_id: &str) -> Result<(), PluginError> {
        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })?;
        
        plugin.start()?;
        self.plugin_states.insert(plugin_id.to_string(), PluginState::Running);
        
        Ok(())
    }

    /// Stop a plugin
    pub fn stop_plugin(&mut self, plugin_id: &str) -> Result<(), PluginError> {
        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })?;
        
        plugin.stop()?;
        self.plugin_states.insert(plugin_id.to_string(), PluginState::Paused);
        
        Ok(())
    }

    /// Send a command to a plugin
    pub fn send_command(
        &mut self,
        plugin_id: &str,
        command: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, PluginError> {
        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })?;
        
        plugin.handle_command(command, params)
    }

    /// Send an event to a plugin
    pub fn send_event(
        &mut self,
        plugin_id: &str,
        event: &str,
        data: serde_json::Value,
    ) -> Result<(), PluginError> {
        let plugin = self.plugins.get_mut(plugin_id)
            .ok_or_else(|| PluginError::PluginNotFound { plugin_id: plugin_id.to_string() })?;
        
        plugin.handle_event(event, data)
    }

    /// Get plugin state
    pub fn get_plugin_state(&self, plugin_id: &str) -> Option<PluginState> {
        self.plugin_states.get(plugin_id).copied()
    }

    /// Get all plugins
    pub fn get_plugins(&self) -> Vec<PluginMetadata> {
        self.plugins.values().map(|p| p.metadata()).collect()
    }

    /// Get plugin metadata
    pub fn get_plugin_metadata(&self, plugin_id: &str) -> Option<PluginMetadata> {
        self.plugins.get(plugin_id).map(|p| p.metadata())
    }
}

/// Plugin errors
#[derive(Debug, thiserror::Error)]
pub enum PluginError {
    #[error("Plugin not found: {plugin_id}")]
    PluginNotFound { plugin_id: String },
    
    #[error("Plugin already registered: {plugin_id}")]
    AlreadyRegistered { plugin_id: String },
    
    #[error("Plugin initialization failed: {reason}")]
    InitializationFailed { reason: String },
    
    #[error("Plugin execution failed: {reason}")]
    ExecutionFailed { reason: String },
    
    #[error("Command not supported: {command}")]
    CommandNotSupported { command: String },
    
    #[error("Invalid configuration: {reason}")]
    InvalidConfig { reason: String },
    
    #[error("Permission denied: {permission}")]
    PermissionDenied { permission: String },
    
    #[error("API version mismatch: required {required}, found {found}")]
    ApiVersionMismatch { required: String, found: String },
    
    #[error("Plugin error: {0}")]
    Generic(String),
}

/// Helper macro for plugin metadata
#[macro_export]
macro_rules! plugin_metadata {
    ($id:expr, $name:expr, $version:expr, $description:expr, $author:expr) => {
        PluginMetadata {
            id: $id.to_string(),
            name: $name.to_string(),
            version: $version.to_string(),
            description: $description.to_string(),
            author: $author.to_string(),
            license: "MIT".to_string(),
            min_api_version: "1.0.0".to_string(),
            homepage_url: None,
            repository_url: None,
            category: PluginCategory::Custom("generic".to_string()),
            capabilities: vec![],
            config_schema: None,
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_metadata() {
        let metadata = plugin_metadata!(
            "com.example.test-plugin",
            "Test Plugin",
            "1.0.0",
            "A test plugin",
            "Test Author"
        );
        
        assert_eq!(metadata.id, "com.example.test-plugin");
        assert_eq!(metadata.name, "Test Plugin");
        assert_eq!(metadata.version, "1.0.0");
    }

    #[test]
    fn test_base_plugin() {
        let metadata = plugin_metadata!(
            "com.example.test-plugin",
            "Test Plugin",
            "1.0.0",
            "A test plugin",
            "Test Author"
        );
        
        let mut plugin = BasePlugin::new(metadata);
        assert_eq!(plugin.state(), PluginState::Unloaded);
        
        let config = plugin.get_config();
        assert_eq!(config.plugin_id, "com.example.test-plugin");
    }

    #[test]
    fn test_plugin_manager() {
        let mut manager = PluginManager::new();
        
        let metadata = plugin_metadata!(
            "com.example.test-plugin",
            "Test Plugin",
            "1.0.0",
            "A test plugin",
            "Test Author"
        );
        
        let plugin = BasePlugin::new(metadata);
        manager.register_plugin(Box::new(plugin)).unwrap();
        
        let plugins = manager.get_plugins();
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].id, "com.example.test-plugin");
    }
}