# V-Streaming CLI API Documentation

## Overview

V-Streaming provides a comprehensive command-line interface (CLI) for administrative tasks, batch operations, and system management. The CLI is built using [Clap](https://clap.rs/) and provides a rich set of commands for managing configuration, streams, plugins, diagnostics, and more.

## Installation

The CLI is integrated into the V-Streaming application. To use it:

```bash
vstreaming [OPTIONS] <COMMAND>
```

## Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--verbose` | `-v` | Enable verbose output |
| `--config <FILE>` | `-c` | Specify a custom configuration file path |

## Commands

### Configuration Management

#### `config show`

Display the current configuration in JSON format.

```bash
vstreaming config show
```

**Output Example:**
```json
{
  "general": {
    "language": "en",
    "auto_save_interval": 60
  },
  "capture": {
    "default_resolution": { "width": 1920, "height": 1080 },
    "default_framerate": 60
  }
}
```

#### `config reset`

Reset configuration to default values.

```bash
vstreaming config reset
```

#### `config export`

Export configuration to a file.

```bash
vstreaming config export -o ./config-backup.json
```

**Options:**
- `-o, --output <FILE>` - Output file path (required)

#### `config import`

Import configuration from a file.

```bash
vstreaming config import -f ./config-backup.json
```

**Options:**
- `-f, --file <FILE>` - Input file path (required)

#### `config validate`

Validate the current configuration.

```bash
vstreaming config validate
```

**Validation Rules:**
- `general.language` cannot be empty
- `audio.sample_rate` cannot be zero
- `encoding.bitrate` cannot be zero

#### `config set`

Set a specific configuration value.

```bash
vstreaming config set -k general.language -v pl
```

**Options:**
- `-k, --key <KEY>` - Configuration key path (required)
- `-v, --value <VALUE>` - New value (required)

#### `config get`

Get a specific configuration value.

```bash
vstreaming config get -k general.language
```

**Options:**
- `-k, --key <KEY>` - Configuration key path (required)

---

### Stream Management

#### `stream start`

Start streaming to a platform.

```bash
vstreaming stream start -p twitch -k YOUR_STREAM_KEY
```

**Options:**
- `-p, --platform <PLATFORM>` - Target platform (twitch, youtube, kick) (required)
- `-k, --key <KEY>` - Stream key (required)

#### `stream stop`

Stop the current stream.

```bash
vstreaming stream stop
```

#### `stream status`

Get the current stream status.

```bash
vstreaming stream status
```

**Output:**
```
Status: Not streaming
Active streams: 0
```

#### `stream list`

List all saved stream configurations.

```bash
vstreaming stream list
```

**Output Example:**
```
📺 Gaming Stream
   Platform: Twitch
   Resolution: 1920x1080
   Framerate: 60 fps
   Bitrate: 6000 kbps
```

#### `stream save`

Save the current stream configuration.

```bash
vstreaming stream save -n "Gaming Stream"
```

**Options:**
- `-n, --name <NAME>` - Configuration name (required)

#### `stream load`

Load a saved stream configuration.

```bash
vstreaming stream load -n "Gaming Stream"
```

**Options:**
- `-n, --name <NAME>` - Configuration name (required)

---

### Plugin Management

#### `plugin list`

List all installed plugins.

```bash
vstreaming plugin list
```

**Output Example:**
```
🟢 Chat Overlay
   ID: com.vstreaming.chat-overlay
   Version: 1.2.0
   Author: V-Streaming Team
   Description: Display chat overlay on stream
```

**Status Icons:**
- 🟢 Running
- 🟡 Initialized
- ⚪ Unloaded

#### `plugin install`

Install a plugin from a file or URL.

```bash
vstreaming plugin install -s ./my-plugin.tar.gz
# or from URL
vstreaming plugin install -s https://example.com/plugin.tar.gz
```

**Options:**
- `-s, --source <SOURCE>` - Plugin file path or URL (required)

#### `plugin uninstall`

Uninstall a plugin.

```bash
vstreaming plugin uninstall -n "Chat Overlay"
```

**Options:**
- `-n, --name <NAME>` - Plugin name (required)

#### `plugin enable`

Enable (start) a plugin.

```bash
vstreaming plugin enable -n "Chat Overlay"
```

**Options:**
- `-n, --name <NAME>` - Plugin name (required)

#### `plugin disable`

Disable (stop) a plugin.

```bash
vstreaming plugin disable -n "Chat Overlay"
```

**Options:**
- `-n, --name <NAME>` - Plugin name (required)

#### `plugin update`

Update a plugin to the latest version.

```bash
vstreaming plugin update -n "Chat Overlay"
```

**Options:**
- `-n, --name <NAME>` - Plugin name (required)

#### `plugin info`

Display detailed information about a plugin.

```bash
vstreaming plugin info -n "Chat Overlay"
```

**Output Example:**
```
📦 Chat Overlay
   ID: com.vstreaming.chat-overlay
   Version: 1.2.0
   Author: V-Streaming Team
   License: MIT
   Description: Display chat overlay on stream
   Category: Integration
   Homepage: https://v-streaming.com/plugins/chat-overlay
   Repository: https://github.com/vantisCorp/chat-overlay
   Status: Running
```

---

### Diagnostics

#### `diagnostics run`

Run a full system diagnostic.

```bash
vstreaming diagnostics run
```

**Output:**
```
=== System Diagnostics ===

✓ CPU: Detected
  Cores: 8
✓ Memory: Available
✓ GPU: Detected
✓ Capture sources: Available
✓ Audio devices: Available

=== Diagnostics Complete ===

✅ All systems operational
```

#### `diagnostics check-requirements`

Check if the system meets minimum and recommended requirements.

```bash
vstreaming diagnostics check-requirements
```

**Requirements:**
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU Cores | 4 | 8 |
| RAM | 8 GB | 16 GB |

#### `diagnostics test-capture`

Test capture sources availability.

```bash
vstreaming diagnostics test-capture
```

#### `diagnostics test-audio`

Test audio devices.

```bash
vstreaming diagnostics test-audio
```

#### `diagnostics test-encoding`

Test encoding capabilities.

```bash
vstreaming diagnostics test-encoding
```

#### `diagnostics test-stream`

Test streaming connection to a server.

```bash
vstreaming diagnostics test-stream -s rtmp://live.twitch.tv/app -k YOUR_KEY
```

**Options:**
- `-s, --server <SERVER>` - Server URL (required)
- `-k, --key <KEY>` - Stream key (required)

#### `diagnostics system-info`

Display detailed system information.

```bash
vstreaming diagnostics system-info
```

**Output Example:**
```
OS: windows
Arch: x86_64
CPU cores: 8
Host: MY-COMPUTER
Disk total: 500 GB
Disk free: 250 GB
OS release: 10.0.19045
Load average: 0.50
```

#### `diagnostics perf-stats`

Display real-time performance statistics.

```bash
vstreaming diagnostics perf-stats
```

---

### Export Operations

#### `export config`

Export configuration to a file.

```bash
vstreaming export config -o ./exported-config.json
```

#### `export scenes`

Export scenes configuration.

```bash
vstreaming export scenes -o ./scenes-backup.json
```

#### `export plugins`

Export plugin list and settings.

```bash
vstreaming export plugins -o ./plugins-backup.json
```

#### `export all`

Export all settings (configuration, plugins, scenes).

```bash
vstreaming export all -o ./full-backup.json
```

---

### Import Operations

#### `import`

Import settings from a backup file.

```bash
vstreaming import -f ./full-backup.json
```

**Options:**
- `-f, --file <FILE>` - Import file path (required)

---

### Profile Management

#### `profile list`

List all available profiles.

```bash
vstreaming profile list
```

**Default Profiles:**
- **Default** - Standard 1080p60 streaming
- **High Performance** - 720p120 for competitive gaming
- **High Quality** - 1080p60 with high bitrate

#### `profile create`

Create a new profile.

```bash
vstreaming profile create -n "My Custom Profile"
```

**Options:**
- `-n, --name <NAME>` - Profile name (required)

#### `profile delete`

Delete a profile.

```bash
vstreaming profile delete -n "My Custom Profile"
```

**Options:**
- `-n, --name <NAME>` - Profile name (required)

#### `profile switch`

Switch to a different profile.

```bash
vstreaming profile switch -n "High Performance"
```

**Options:**
- `-n, --name <NAME>` - Profile name (required)

#### `profile info`

Display profile details.

```bash
vstreaming profile info -n "Default"
```

**Output Example:**
```
🎯 Default
   Resolution: 1920x1080
   Framerate: 60 fps
   Bitrate: 6000 kbps
   Encoder: Auto
```

---

### Maintenance

#### `maintenance clear-cache`

Clear application cache.

```bash
vstreaming maintenance clear-cache
```

#### `maintenance clean-logs`

Remove log files older than 7 days.

```bash
vstreaming maintenance clean-logs
```

#### `maintenance clear-temp`

Clear temporary files.

```bash
vstreaming maintenance clear-temp
```

#### `maintenance rebuild`

Rebuild application indices.

```bash
vstreaming maintenance rebuild
```

#### `maintenance verify`

Verify installation integrity.

```bash
vstreaming maintenance verify
```

**Output:**
```
✓ Core files: OK
✓ Configuration: OK
✓ Plugins: OK
✓ Dependencies: OK
✅ Installation verified
```

#### `maintenance repair`

Repair the installation.

```bash
vstreaming maintenance repair
```

#### `maintenance update`

Check for application updates.

```bash
vstreaming maintenance update
```

---

## Configuration File

The CLI stores configuration in the following locations:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\v-streaming\config.json` |
| macOS | `~/Library/Application Support/v-streaming/config.json` |
| Linux | `~/.config/v-streaming/config.json` |

### Configuration Schema

```json
{
  "general": {
    "language": "en",
    "auto_save_interval": 60,
    "check_updates": true,
    "send_statistics": true,
    "crash_reporting": true,
    "log_level": "info",
    "max_log_files": 10
  },
  "capture": {
    "default_resolution": { "width": 1920, "height": 1080 },
    "default_framerate": 60,
    "capture_method": "automatic",
    "hdr_enabled": false,
    "show_cursor": true
  },
  "audio": {
    "sample_rate": 48000,
    "buffer_size": 256,
    "bit_depth": 24,
    "monitoring_enabled": true,
    "noise_suppression": 0.0,
    "echo_cancellation": false,
    "auto_gain": false
  },
  "encoding": {
    "encoder": "auto",
    "video_codec": "h264",
    "audio_codec": "aac",
    "preset": "medium",
    "rate_control": "cbr",
    "bitrate": 6000,
    "keyframe_interval": 2.0
  },
  "streaming": {
    "reconnect_attempts": 5,
    "reconnect_delay": 2,
    "low_latency": false,
    "adaptive_bitrate": false,
    "min_bitrate": 500,
    "max_bitrate": 6000,
    "multistreaming_enabled": false
  },
  "ui": {
    "interface_mode": "simple",
    "theme": "dark",
    "show_tooltips": true,
    "animations_enabled": true,
    "preview_enabled": true,
    "preview_quality": "medium"
  },
  "ai": {
    "highlight_detection": false,
    "highlight_sensitivity": 0.7,
    "live_captions": false,
    "caption_language": "en",
    "translation_enabled": false,
    "ai_coach": false,
    "whisper_model": "base"
  }
}
```

---

## Error Handling

The CLI returns appropriate exit codes:

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | IO error |
| 4 | Parse error |
| 5 | Validation error |

---

## Examples

### Quick Start

```bash
# Show current configuration
vstreaming config show

# Start streaming to Twitch
vstreaming stream start -p twitch -k YOUR_KEY

# Check system requirements
vstreaming diagnostics check-requirements

# Run full diagnostics
vstreaming diagnostics run
```

### Backup and Restore

```bash
# Export all settings
vstreaming export all -o ./backup-$(date +%Y%m%d).json

# Restore from backup
vstreaming import -f ./backup-20240101.json
```

### Profile Management

```bash
# Create a profile for gaming
vstreaming profile create -n "Gaming"

# Switch to gaming profile
vstreaming profile switch -n "Gaming"

# Verify the switch
vstreaming profile info -n "Gaming"
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `V_STREAMING_CONFIG` | Custom configuration file path |
| `V_STREAMING_LOG_LEVEL` | Override log level (trace, debug, info, warn, error) |
| `V_STREAMING_DATA_DIR` | Custom data directory |

---

## See Also

- [Configuration Guide](./DEVELOPMENT.md)
- [Plugin Development Kit](./PDK_GUIDE.md)
- [API Documentation](./API.md)