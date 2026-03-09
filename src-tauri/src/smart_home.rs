use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;
use crate::AppState;

// ============================================================================
// SMART HOME INTEGRATION - IoT Device Control
// ============================================================================

/// Smart home device type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SmartDeviceType {
    Light,
    Switch,
    Thermostat,
    Camera,
    Sensor,
    Lock,
    Speaker,
    Display,
    Custom,
}

/// Smart home device status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SmartDeviceStatus {
    Online,
    Offline,
    Error,
}

/// Smart home device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartDevice {
    pub id: String,
    pub name: String,
    pub device_type: SmartDeviceType,
    pub status: SmartDeviceStatus,
    pub is_on: bool,
    pub properties: HashMap<String, String>,
    pub room: Option<String>,
    pub last_updated: u64,
}

/// Smart home automation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAutomation {
    pub id: String,
    pub name: String,
    pub description: String,
    pub trigger_type: AutomationTriggerType,
    pub trigger_value: String,
    pub actions: Vec<AutomationAction>,
    pub enabled: bool,
}

/// Automation trigger type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AutomationTriggerType {
    StreamStart,
    StreamEnd,
    Donation,
    Follower,
    Subscriber,
    Raid,
    Custom,
}

/// Automation action
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationAction {
    pub device_id: String,
    pub action: String,
    pub value: Option<String>,
}

/// Smart home config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartHomeConfig {
    pub enabled: bool,
    pub auto_connect: bool,
    pub notify_device_changes: bool,
    pub enable_automations: bool,
}

impl Default for SmartHomeConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_connect: true,
            notify_device_changes: true,
            enable_automations: true,
        }
    }
}

/// Smart home statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartHomeStats {
    pub total_devices: u64,
    pub online_devices: u64,
    pub offline_devices: u64,
    pub total_automations: u64,
    pub active_automations: u64,
}

/// Smart home engine state
pub struct SmartHomeEngine {
    pub config: SmartHomeConfig,
    pub devices: Vec<SmartDevice>,
    pub automations: Vec<SmartAutomation>,
    pub stats: SmartHomeStats,
    pub is_connected: bool,
}

impl SmartHomeEngine {
    pub fn new() -> Self {
        Self {
            config: SmartHomeConfig::default(),
            devices: Vec::new(),
            automations: Vec::new(),
            stats: SmartHomeStats {
                total_devices: 0,
                online_devices: 0,
                offline_devices: 0,
                total_automations: 0,
                active_automations: 0,
            },
            is_connected: false,
        }
    }

    /// Connect to smart home
    pub fn connect(&mut self) -> Result<(), String> {
        self.is_connected = true;
        Ok(())
    }

    /// Disconnect from smart home
    pub fn disconnect(&mut self) -> Result<(), String> {
        self.is_connected = false;
        Ok(())
    }

    /// Add device
    pub fn add_device(&mut self, device: SmartDevice) -> Result<(), String> {
        self.devices.push(device.clone());
        self.stats.total_devices += 1;
        
        if device.status == SmartDeviceStatus::Online {
            self.stats.online_devices += 1;
        } else {
            self.stats.offline_devices += 1;
        }
        
        Ok(())
    }

    /// Get all devices
    pub fn get_devices(&self) -> Vec<SmartDevice> {
        self.devices.clone()
    }

    /// Get device by ID
    pub fn get_device(&self, device_id: String) -> Option<SmartDevice> {
        self.devices.iter().find(|d| d.id == device_id).cloned()
    }

    /// Update device
    pub fn update_device(&mut self, device_id: String, is_on: bool, properties: HashMap<String, String>) -> Result<(), String> {
        if let Some(device) = self.devices.iter_mut().find(|d| d.id == device_id) {
            device.is_on = is_on;
            device.properties = properties;
            device.last_updated = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }

    /// Delete device
    pub fn delete_device(&mut self, device_id: String) -> Result<(), String> {
        if let Some(pos) = self.devices.iter().position(|d| d.id == device_id) {
            let device = &self.devices[pos];
            
            if device.status == SmartDeviceStatus::Online {
                self.stats.online_devices -= 1;
            } else {
                self.stats.offline_devices -= 1;
            }
            
            self.devices.remove(pos);
            self.stats.total_devices -= 1;
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }

    /// Create automation
    pub fn create_automation(&mut self, name: String, description: String, trigger_type: AutomationTriggerType, trigger_value: String, actions: Vec<AutomationAction>) -> Result<SmartAutomation, String> {
        let automation = SmartAutomation {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            description,
            trigger_type,
            trigger_value,
            actions,
            enabled: true,
        };
        
        self.automations.push(automation.clone());
        self.stats.total_automations += 1;
        self.stats.active_automations += 1;
        
        Ok(automation)
    }

    /// Get all automations
    pub fn get_automations(&self) -> Vec<SmartAutomation> {
        self.automations.clone()
    }

    /// Delete automation
    pub fn delete_automation(&mut self, automation_id: String) -> Result<(), String> {
        if let Some(pos) = self.automations.iter().position(|a| a.id == automation_id) {
            let automation = &self.automations[pos];
            
            if automation.enabled {
                self.stats.active_automations -= 1;
            }
            
            self.automations.remove(pos);
            self.stats.total_automations -= 1;
            Ok(())
        } else {
            Err("Automation not found".to_string())
        }
    }

    /// Trigger automation
    pub fn trigger_automation(&mut self, trigger_type: AutomationTriggerType, trigger_value: String) -> Result<Vec<AutomationAction>, String> {
        if !self.config.enable_automations {
            return Ok(Vec::new());
        }
        
        let mut triggered_actions = Vec::new();
        
        for automation in &self.automations {
            if automation.enabled && automation.trigger_type == trigger_type {
                if automation.trigger_value.is_empty() || automation.trigger_value == trigger_value {
                    triggered_actions.extend(automation.actions.clone());
                }
            }
        }
        
        Ok(triggered_actions)
    }

    /// Update config
    pub fn update_config(&mut self, config: SmartHomeConfig) {
        self.config = config;
    }

    /// Get config
    pub fn get_config(&self) -> SmartHomeConfig {
        self.config.clone()
    }

    /// Get statistics
    pub fn get_stats(&self) -> SmartHomeStats {
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
fn get_smart_home_config(state: tauri::State<AppState>) -> SmartHomeConfig {
    state.smart_home_engine.lock().unwrap().get_config()
}

#[tauri::command]
fn update_smart_home_config(
    config: SmartHomeConfig,
    state: tauri::State<AppState>,
) {
    state.smart_home_engine.lock().unwrap().update_config(config);
}

#[tauri::command]
fn connect_smart_home(state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().connect()
}

#[tauri::command]
fn disconnect_smart_home(state: tauri::State<AppState>) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().disconnect()
}

#[tauri::command]
fn is_smart_home_connected(state: tauri::State<AppState>) -> bool {
    state.smart_home_engine.lock().unwrap().is_connected_status()
}

#[tauri::command]
fn add_smart_device(
    name: String,
    device_type: String,
    room: Option<String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let device_type = match device_type.as_str() {
        "light" => SmartDeviceType::Light,
        "switch" => SmartDeviceType::Switch,
        "thermostat" => SmartDeviceType::Thermostat,
        "camera" => SmartDeviceType::Camera,
        "sensor" => SmartDeviceType::Sensor,
        "lock" => SmartDeviceType::Lock,
        "speaker" => SmartDeviceType::Speaker,
        "display" => SmartDeviceType::Display,
        "custom" => SmartDeviceType::Custom,
        _ => return Err("Invalid device type".to_string()),
    };
    
    let device = SmartDevice {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        device_type,
        status: SmartDeviceStatus::Online,
        is_on: false,
        properties: HashMap::new(),
        room,
        last_updated: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    
    state.smart_home_engine.lock().unwrap().add_device(device)
}

#[tauri::command]
fn get_smart_devices(state: tauri::State<AppState>) -> Vec<SmartDevice> {
    state.smart_home_engine.lock().unwrap().get_devices()
}

#[tauri::command]
fn get_smart_device(
    device_id: String,
    state: tauri::State<AppState>,
) -> Option<SmartDevice> {
    state.smart_home_engine.lock().unwrap().get_device(device_id)
}

#[tauri::command]
fn update_smart_device(
    device_id: String,
    is_on: bool,
    properties: HashMap<String, String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().update_device(device_id, is_on, properties)
}

#[tauri::command]
fn delete_smart_device(
    device_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().delete_device(device_id)
}

#[tauri::command]
fn create_smart_automation(
    name: String,
    description: String,
    trigger_type: String,
    trigger_value: String,
    actions: Vec<AutomationAction>,
    state: tauri::State<AppState>,
) -> Result<SmartAutomation, String> {
    let trigger_type = match trigger_type.as_str() {
        "stream_start" => AutomationTriggerType::StreamStart,
        "stream_end" => AutomationTriggerType::StreamEnd,
        "donation" => AutomationTriggerType::Donation,
        "follower" => AutomationTriggerType::Follower,
        "subscriber" => AutomationTriggerType::Subscriber,
        "raid" => AutomationTriggerType::Raid,
        "custom" => AutomationTriggerType::Custom,
        _ => return Err("Invalid trigger type".to_string()),
    };
    
    state.smart_home_engine.lock().unwrap().create_automation(name, description, trigger_type, trigger_value, actions)
}

#[tauri::command]
fn get_smart_automations(state: tauri::State<AppState>) -> Vec<SmartAutomation> {
    state.smart_home_engine.lock().unwrap().get_automations()
}

#[tauri::command]
fn delete_smart_automation(
    automation_id: String,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    state.smart_home_engine.lock().unwrap().delete_automation(automation_id)
}

#[tauri::command]
fn trigger_smart_automation(
    trigger_type: String,
    trigger_value: String,
    state: tauri::State<AppState>,
) -> Result<Vec<AutomationAction>, String> {
    let trigger_type = match trigger_type.as_str() {
        "stream_start" => AutomationTriggerType::StreamStart,
        "stream_end" => AutomationTriggerType::StreamEnd,
        "donation" => AutomationTriggerType::Donation,
        "follower" => AutomationTriggerType::Follower,
        "subscriber" => AutomationTriggerType::Subscriber,
        "raid" => AutomationTriggerType::Raid,
        "custom" => AutomationTriggerType::Custom,
        _ => return Err("Invalid trigger type".to_string()),
    };
    
    state.smart_home_engine.lock().unwrap().trigger_automation(trigger_type, trigger_value)
}

#[tauri::command]
fn get_smart_home_stats(state: tauri::State<AppState>) -> SmartHomeStats {
    state.smart_home_engine.lock().unwrap().get_stats()
}

#[tauri::command]
fn get_smart_device_types() -> Vec<String> {
    vec![
        "light".to_string(),
        "switch".to_string(),
        "thermostat".to_string(),
        "camera".to_string(),
        "sensor".to_string(),
        "lock".to_string(),
        "speaker".to_string(),
        "display".to_string(),
        "custom".to_string(),
    ]
}

#[tauri::command]
fn get_automation_trigger_types() -> Vec<String> {
    vec![
        "stream_start".to_string(),
        "stream_end".to_string(),
        "donation".to_string(),
        "follower".to_string(),
        "subscriber".to_string(),
        "raid".to_string(),
        "custom".to_string(),
    ]
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_smart_device_creation() {
        let mut properties = HashMap::new();
        properties.insert("brightness".to_string(), "80".to_string());
        
        let device = SmartDevice {
            id: "device1".to_string(),
            name: "Living Room Light".to_string(),
            device_type: SmartDeviceType::Light,
            status: SmartDeviceStatus::Online,
            is_on: true,
            properties: properties,
            room: Some("Living Room".to_string()),
            last_updated: 1234567890,
        };

        assert_eq!(device.id, "device1");
        assert_eq!(device.device_type, SmartDeviceType::Light);
        assert_eq!(device.status, SmartDeviceStatus::Online);
        assert!(device.is_on);
    }

    #[test]
    fn test_smart_automation_creation() {
        let automation = SmartAutomation {
            id: "auto1".to_string(),
            name: "Stream Start Lights".to_string(),
            description: "Turn on lights when stream starts".to_string(),
            trigger_type: AutomationTriggerType::StreamStart,
            trigger_value: "start".to_string(),
            actions: vec![
                AutomationAction {
                    device_id: "device1".to_string(),
                    action: "turn_on".to_string(),
                    value: Some("true".to_string()),
                }
            ],
            enabled: true,
        };

        assert_eq!(automation.id, "auto1");
        assert_eq!(automation.trigger_type, AutomationTriggerType::StreamStart);
        assert!(automation.enabled);
        assert_eq!(automation.actions.len(), 1);
    }

    #[test]
    fn test_smart_home_config_default() {
        let config = SmartHomeConfig::default();
        
        assert_eq!(config.enabled, true);
        assert_eq!(config.auto_connect, true);
        assert_eq!(config.enable_automations, true);
    }

    #[test]
    fn test_smart_device_type_variants() {
        let types = vec![
            SmartDeviceType::Light,
            SmartDeviceType::Switch,
            SmartDeviceType::Thermostat,
            SmartDeviceType::Camera,
            SmartDeviceType::Sensor,
            SmartDeviceType::Lock,
            SmartDeviceType::Speaker,
            SmartDeviceType::Display,
            SmartDeviceType::Custom,
        ];

        assert_eq!(types.len(), 9);
        assert_eq!(types[0], SmartDeviceType::Light);
    }

    #[test]
    fn test_smart_device_status_variants() {
        let statuses = vec![
            SmartDeviceStatus::Online,
            SmartDeviceStatus::Offline,
            SmartDeviceStatus::Error,
        ];

        assert_eq!(statuses.len(), 3);
        assert_eq!(statuses[0], SmartDeviceStatus::Online);
    }

    #[test]
    fn test_automation_trigger_type_variants() {
        let types = vec![
            AutomationTriggerType::StreamStart,
            AutomationTriggerType::StreamEnd,
            AutomationTriggerType::Donation,
            AutomationTriggerType::Follower,
            AutomationTriggerType::Subscriber,
            AutomationTriggerType::Raid,
            AutomationTriggerType::Custom,
        ];

        assert_eq!(types.len(), 7);
        assert_eq!(types[0], AutomationTriggerType::StreamStart);
    }
}
