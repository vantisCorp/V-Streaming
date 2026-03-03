# V-Streaming Plugin Development Kit (PDK) Guide

## Overview

The V-Streaming Plugin Development Kit (PDK) enables third-party developers to create plugins that extend the functionality of V-Streaming. Plugins can add new capture sources, audio/video effects, streaming destinations, UI themes, integrations, and utilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Categories](#plugin-categories)
4. [API Reference](#api-reference)
5. [Creating Your First Plugin](#creating-your-first-plugin)
6. [Plugin Configuration](#plugin-configuration)
7. [Testing Plugins](#testing-plugins)
8. [Distributing Plugins](#distributing-plugins)
9. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

- Rust 1.70 or later
- V-Streaming 1.0.0 or later
- Basic understanding of Rust and async/await

### Setting Up Development Environment

1. Create a new Rust project:
```bash
cargo new --lib my-vstreaming-plugin
cd my-vstreaming-plugin
```

2. Add V-Streaming PDK to `Cargo.toml`:
```toml
[dependencies]
vstreaming-pdk = "1.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

3. Create your plugin implementation

---

## Plugin Architecture

### Plugin Lifecycle

```
Unloaded → Loading → Loaded → Initialized → Running → Paused → Stopping → Unloaded
                                              ↓
                                           Error
```

### Plugin Components

1. **Plugin Metadata**: Information about your plugin
2. **Plugin Context**: API client for communicating with V-Streaming
3. **Plugin Implementation**: The core functionality
4. **Plugin Configuration**: User-configurable settings

---

## Plugin Categories

### 1. Capture Source Plugins
Add new capture sources (e.g., virtual cameras, screen sharing services, game-specific capture).

**Capabilities:**
- `AddCaptureSources`

**Example Use Cases:**
- Virtual camera capture
- Remote screen sharing
- Console-specific capture cards

### 2. Audio Effect Plugins
Process audio with custom effects (e.g., noise reduction, voice effects).

**Capabilities:**
- `ProcessAudio`

**Example Use Cases:**
- Noise suppression
- Voice changer
- Audio restoration

### 3. Video Filter Plugins
Apply video effects and filters (e.g., color grading, visual effects).

**Capabilities:**
- `ProcessVideo`

**Example Use Cases:**
- LUT application
- Blur effects
- Visual distortions

### 4. Streaming Destination Plugins
Stream to custom platforms or services.

**Capabilities:**
- `SendStream`

**Example Use Cases:**
- Custom streaming platforms
- Local network streaming
- Recording services

### 5. UI Theme Plugins
Customize the V-Streaming interface appearance.

**Capabilities:**
- `ModifyUI`

**Example Use Cases:**
- Dark/light themes
- Custom color schemes
- Layout modifications

### 6. Integration Plugins
Integrate with third-party services (e.g., Twitch, Discord, Slack).

**Capabilities:**
- `AccessChat`, `SendChat`

**Example Use Cases:**
- Twitch chat integration
- Discord notifications
- Social media posting

### 7. Utility Plugins
General-purpose utilities and helpers.

**Example Use Cases:**
- File management
- Batch operations
- System monitoring

---

## API Reference

### Plugin Trait

All plugins must implement the `Plugin` trait:

```rust
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
```

### Plugin API Client

The `PluginContext` provides an `api` field with methods for communicating with V-Streaming:

```rust
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
    ) -> Result<serde_json::Value, PluginError>;

    /// Emit an event
    pub fn emit(&self, event: &str, data: serde_json::Value);

    /// Subscribe to an event
    pub fn subscribe(&self, event: &str, callback: EventCallback);
}
```

### Available Commands

#### Capture Commands
- `enumerate_capture_sources`: List available capture sources
- `start_capture`: Start capturing from a source
- `stop_capture`: Stop capturing

#### Audio Commands
- `enumerate_audio_devices`: List audio devices
- `create_audio_track`: Create a new audio track
- `apply_audio_effect`: Apply an audio effect

#### Composition Commands
- `create_scene`: Create a new scene
- `add_layer`: Add a layer to a scene
- `set_layer_blend_mode`: Set layer blend mode

#### Streaming Commands
- `start_streaming`: Start streaming
- `stop_streaming`: Stop streaming
- `get_streaming_stats`: Get streaming statistics

### Available Events

#### Stream Events
- `stream_started`: Streaming started
- `stream_stopped`: Streaming stopped
- `stream_error`: Streaming error occurred

#### Chat Events
- `chat_message`: New chat message received
- `chat_command`: Chat command received

#### Capture Events
- `capture_started`: Capture started
- `capture_stopped`: Capture stopped
- `capture_error`: Capture error occurred

---

## Creating Your First Plugin

### Step 1: Define Plugin Metadata

```rust
use vstreaming_pdk::{Plugin, PluginMetadata, PluginCategory, PluginCapability, BasePlugin};
use serde_json::Value;

fn create_metadata() -> PluginMetadata {
    PluginMetadata {
        id: "com.example.my-plugin".to_string(),
        name: "My Plugin".to_string(),
        version: "1.0.0".to_string(),
        description: "A simple example plugin".to_string(),
        author: "Your Name".to_string(),
        license: "MIT".to_string(),
        min_api_version: "1.0.0".to_string(),
        homepage_url: Some("https://example.com".to_string()),
        repository_url: Some("https://github.com/example/my-plugin".to_string()),
        category: PluginCategory::AudioEffect,
        capabilities: vec![PluginCapability::ProcessAudio],
        config_schema: None,
    }
}
```

### Step 2: Implement Plugin Trait

```rust
struct MyPlugin {
    base: BasePlugin,
    // Add your plugin-specific fields here
    custom_setting: bool,
}

impl MyPlugin {
    fn new() -> Self {
        let metadata = create_metadata();
        Self {
            base: BasePlugin::new(metadata),
            custom_setting: true,
        }
    }
}

impl Plugin for MyPlugin {
    fn metadata(&self) -> PluginMetadata {
        self.base.metadata()
    }

    fn initialize(&mut self, context: PluginContext) -> Result<(), PluginError> {
        self.base.initialize(context)?;
        // Your initialization code here
        Ok(())
    }

    fn start(&mut self) -> Result<(), PluginError> {
        self.base.start()?;
        // Your start code here
        Ok(())
    }

    fn stop(&mut self) -> Result<(), PluginError> {
        self.base.stop()?;
        // Your stop code here
        Ok(())
    }

    fn state(&self) -> PluginState {
        self.base.state()
    }

    fn handle_command(
        &mut self,
        command: &str,
        params: Value,
    ) -> Result<Value, PluginError> {
        match command {
            "get_custom_setting" => {
                Ok(json!({ "custom_setting": self.custom_setting }))
            }
            "set_custom_setting" => {
                self.custom_setting = params["value"].as_bool().unwrap_or(false);
                Ok(json!({ "success": true }))
            }
            _ => self.base.handle_command(command, params),
        }
    }

    fn handle_event(&mut self, event: &str, data: Value) -> Result<(), PluginError> {
        match event {
            "stream_started" => {
                // Handle stream started event
                println!("Stream started: {:?}", data);
            }
            _ => {}
        }
        Ok(())
    }

    fn get_config(&self) -> PluginConfig {
        self.base.get_config()
    }

    fn update_config(&mut self, config: PluginConfig) -> Result<(), PluginError> {
        self.base.update_config(config)
    }

    fn cleanup(&mut self) -> Result<(), PluginError> {
        self.base.cleanup()
    }
}
```

### Step 3: Export Plugin

```rust
use vstreaming_pdk::{Plugin, PluginManager};
use std::sync::Arc;
use tokio::sync::Mutex;

// Plugin factory function
#[no_mangle]
pub extern "C" fn create_plugin() -> *mut dyn Plugin {
    let plugin = MyPlugin::new();
    Box::into_raw(Box::new(plugin))
}

// Plugin cleanup function
#[no_mangle]
pub extern "C" fn destroy_plugin(plugin: *mut dyn Plugin) {
    if !plugin.is_null() {
        unsafe {
            let _ = Box::from_raw(plugin);
        }
    }
}
```

---

## Plugin Configuration

### Configuration Schema

Define a JSON Schema for your plugin's configuration:

```rust
let config_schema = json!({
    "type": "object",
    "properties": {
        "custom_setting": {
            "type": "boolean",
            "default": true,
            "description": "A custom boolean setting"
        },
        "threshold": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "default": 50,
            "description": "A threshold value"
        }
    },
    "required": ["custom_setting"]
});
```

### Accessing Configuration

```rust
fn update_config(&mut self, config: PluginConfig) -> Result<(), PluginError> {
    // Access settings
    if let Some(custom_setting) = config.settings.get("custom_setting") {
        self.custom_setting = custom_setting.as_bool().unwrap_or(true);
    }
    
    Ok(())
}
```

---

## Testing Plugins

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_metadata() {
        let metadata = create_metadata();
        assert_eq!(metadata.id, "com.example.my-plugin");
    }

    #[test]
    fn test_plugin_initialization() {
        let mut plugin = MyPlugin::new();
        assert_eq!(plugin.state(), PluginState::Unloaded);
    }
}
```

### Integration Tests

Use V-Streaming's test harness to test plugin integration:

```bash
cargo test --test integration_tests
```

---

## Distributing Plugins

### Package Structure

```
my-plugin/
├── Cargo.toml
├── src/
│   └── lib.rs
├── README.md
├── LICENSE
└── manifest.json
```

### manifest.json

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A simple example plugin",
  "author": "Your Name",
  "license": "MIT",
  "min_vstreaming_version": "1.0.0",
  "files": {
    "windows": "target/release/my_plugin.dll",
    "linux": "target/release/libmy_plugin.so",
    "macos": "target/release/libmy_plugin.dylib"
  },
  "homepage_url": "https://example.com",
  "repository_url": "https://github.com/example/my-plugin",
  "icon": "icon.png"
}
```

### Building for Distribution

```bash
# Windows
cargo build --release

# Linux
cargo build --release

# macOS
cargo build --release
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```rust
fn handle_command(&mut self, command: &str, params: Value) -> Result<Value, PluginError> {
    match command {
        "my_command" => {
            self.validate_params(&params)?;
            Ok(json!({ "success": true }))
        }
        _ => Err(PluginError::CommandNotSupported {
            command: command.to_string()
        })
    }
}
```

### 2. Resource Management

Clean up resources properly:

```rust
fn cleanup(&mut self) -> Result<(), PluginError> {
    // Close connections
    // Free memory
    // Stop threads
    Ok(())
}
```

### 3. Performance

- Use async/await for I/O operations
- Cache frequently accessed data
- Avoid blocking the main thread

### 4. Logging

Use structured logging:

```rust
use tracing::{info, error, debug};

info!("Plugin initialized: {}", self.metadata().id);
error!("Failed to process command: {}", command);
debug!("Processing frame: {}", frame_number);
```

### 5. Security

- Validate all input
- Use secure connections
- Don't expose sensitive data

### 6. Testing

- Write unit tests for all functions
- Write integration tests for plugin interactions
- Test error handling

### 7. Documentation

- Document all public APIs
- Provide examples in README
- Include inline comments for complex logic

---

## Support

- **Documentation**: https://docs.vstreaming.com/pdk
- **GitHub Issues**: https://github.com/vantisCorp/V-Streaming/issues
- **Discord**: https://discord.gg/vstreaming
- **Email**: support@vstreaming.com

---

## License

V-Streaming PDK is licensed under the MIT License. Your plugin can use any license you choose.

---

## Changelog

### Version 1.0.0
- Initial release
- Core plugin API
- Plugin manager
- Documentation