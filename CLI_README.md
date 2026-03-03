# V-Streaming CLI Tool

The V-Streaming Command-Line Interface (CLI) provides administrative and batch operation capabilities for power users and automation.

## Installation

The CLI is included with V-Streaming and can be accessed as:

```bash
vstreaming [OPTIONS] <COMMAND>
```

## Global Options

### `-v, --verbose`
Enable verbose output for debugging.

### `-c, --config <PATH>`
Specify a custom configuration file path.

---

## Commands

### Config

Manage V-Streaming configuration.

#### `config show`
Display current configuration.

```bash
vstreaming config show
```

#### `config reset`
Reset configuration to defaults.

```bash
vstreaming config reset
```

#### `config export`
Export configuration to a file.

```bash
vstreaming config export --output config-backup.json
```

#### `config import`
Import configuration from a file.

```bash
vstreaming config import --file config-backup.json
```

#### `config validate`
Validate configuration.

```bash
vstreaming config validate
```

#### `config set`
Set a configuration value.

```bash
vstreaming config set --key capture.resolution --value "1920x1080"
```

#### `config get`
Get a configuration value.

```bash
vstreaming config get --key capture.resolution
```

---

### Stream

Manage streaming operations.

#### `stream start`
Start streaming to a platform.

```bash
vstreaming stream start --platform twitch --key <your_stream_key>
```

#### `stream stop`
Stop current stream.

```bash
vstreaming stream stop
```

#### `stream status`
Show current stream status.

```bash
vstreaming stream status
```

#### `stream list`
List saved stream configurations.

```bash
vstreaming stream list
```

#### `stream save`
Save current stream configuration.

```bash
vstreaming stream save --name "Main Twitch Stream"
```

#### `stream load`
Load a saved stream configuration.

```bash
vstreaming stream load --name "Main Twitch Stream"
```

---

### Plugin

Manage plugins.

#### `plugin list`
List installed plugins.

```bash
vstreaming plugin list
```

#### `plugin install`
Install a plugin from file or URL.

```bash
vstreaming plugin install --source https://example.com/my-plugin.vsp
vstreaming plugin install --source /path/to/plugin.vsp
```

#### `plugin uninstall`
Uninstall a plugin.

```bash
vstreaming plugin uninstall --name "com.example.my-plugin"
```

#### `plugin enable`
Enable a plugin.

```bash
vstreaming plugin enable --name "com.example.my-plugin"
```

#### `plugin disable`
Disable a plugin.

```bash
vstreaming plugin disable --name "com.example.my-plugin"
```

#### `plugin update`
Update a plugin.

```bash
vstreaming plugin update --name "com.example.my-plugin"
```

#### `plugin info`
Show detailed plugin information.

```bash
vstreaming plugin info --name "com.example.my-plugin"
```

---

### Diagnostics

Run system diagnostics.

#### `diagnostics run`
Run full diagnostics.

```bash
vstreaming diagnostics run
```

Output:
```
=== System Diagnostics ===

✓ CPU: Detected
  Cores: 8
✓ Memory: Available
✓ GPU: Detected
✓ Capture sources: Available
✓ Audio devices: Available

=== Diagnostics Complete ===
```

#### `diagnostics check-requirements`
Check if system meets requirements.

```bash
vstreaming diagnostics check-requirements
```

#### `diagnostics test-capture`
Test capture sources.

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
Test streaming connection.

```bash
vstreaming diagnostics test-stream --server rtmp://live.twitch.tv/app --key <key>
```

#### `diagnostics system-info`
Show system information.

```bash
vstreaming diagnostics system-info
```

Output:
```
System information:
OS: windows
Arch: x86_64
CPU cores: 8
Host: MY-PC
```

#### `diagnostics perf-stats`
Show performance statistics.

```bash
vstreaming diagnostics perf-stats
```

---

### Export

Export data to various formats.

#### `export config`
Export configuration.

```bash
vstreaming export config --output backup-config.json
```

#### `export scenes`
Export scenes.

```bash
vstreaming export scenes --output scenes.json
```

#### `export plugins`
Export plugins list.

```bash
vstreaming export plugins --output plugins.json
```

#### `export all`
Export all data.

```bash
vstreaming export all --output full-backup.json
```

---

### Import

Import data from files.

```bash
vstreaming import --file backup-config.json
```

---

### Profile

Manage streaming profiles.

#### `profile list`
List available profiles.

```bash
vstreaming profile list
```

Output:
```
Available profiles:
- Default
- High Performance
- High Quality
```

#### `profile create`
Create a new profile.

```bash
vstreaming profile create --name "Gaming 4K"
```

#### `profile delete`
Delete a profile.

```bash
vstreaming profile delete --name "Gaming 4K"
```

#### `profile switch`
Switch to a profile.

```bash
vstreaming profile switch --name "High Performance"
```

#### `profile info`
Show profile information.

```bash
vstreaming profile info --name "High Performance"
```

Output:
```
Name: High Performance
Settings:
  Resolution: 1920x1080
  Framerate: 60
  Bitrate: 6000 kbps
  Preset: P4 (Medium)
```

---

### Maintenance

Perform maintenance tasks.

#### `maintenance clear-cache`
Clear application cache.

```bash
vstreaming maintenance clear-cache
```

#### `maintenance clean-logs`
Clean old log files.

```bash
vstreaming maintenance clean-logs
```

#### `maintenance clear-temp`
Clear temporary files.

```bash
vstreaming maintenance clear-temp
```

#### `maintenance rebuild`
Rebuild indices.

```bash
vstreaming maintenance rebuild
```

#### `maintenance verify`
Verify installation.

```bash
vstreaming maintenance verify
```

Output:
```
Verifying installation...
✓ Core files: OK
✓ Configuration: OK
✓ Plugins: OK
```

#### `maintenance repair`
Repair installation.

```bash
vstreaming maintenance repair
```

#### `maintenance update`
Check for updates.

```bash
vstreaming maintenance update
```

---

## Use Cases

### 1. Automated Streaming

Create a script to start streaming:

```bash
#!/bin/bash
# start_stream.sh

echo "Loading stream configuration..."
vstreaming config load --config stream-config.json

echo "Starting stream..."
vstreaming stream start --platform twitch --key $TWITCH_KEY

echo "Stream started!"
```

### 2. Backup Configuration

Create a backup script:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="backups/$DATE"
mkdir -p $BACKUP_DIR

vstreaming export all --output $BACKUP_DIR/full-backup.json
echo "Backup created: $BACKUP_DIR/full-backup.json"
```

### 3. System Check

Create a health check script:

```bash
#!/bin/bash
# health_check.sh

echo "Running system diagnostics..."
vstreaming diagnostics run

echo "Checking requirements..."
vstreaming diagnostics check-requirements

echo "Testing capture..."
vstreaming diagnostics test-capture

echo "Testing audio..."
vstreaming diagnostics test-audio

echo "Health check complete!"
```

### 4. Batch Plugin Management

Update all plugins:

```bash
#!/bin/bash
# update_plugins.sh

vstreaming plugin list | grep -v "^Installed plugins:" | while read plugin; do
    echo "Updating $plugin..."
    vstreaming plugin update --name "$plugin"
done
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid usage |
| 3 | Configuration error |
| 4 | Network error |
| 5 | Permission denied |
| 6 | Not found |
| 7 | Already exists |

---

## Examples

### Start streaming with verbose output

```bash
vstreaming -v stream start --platform twitch --key $KEY
```

### Switch profile and start streaming

```bash
vstreaming profile switch --name "Gaming"
vstreaming stream start --platform twitch --key $KEY
```

### Export configuration before making changes

```bash
vstreaming config export --output config-before.json
vstreaming config set --key capture.framerate --value 144
vstreaming config export --output config-after.json
```

### Run diagnostics on startup

```bash
vstreaming diagnostics run
if [ $? -eq 0 ]; then
    echo "System healthy, starting V-Streaming"
fi
```

---

## Integration with Other Tools

### PowerShell

```powershell
# Automated streaming script
$streamKey = Get-Content -Path $env:USERPROFILE\stream_key.txt
vstreaming stream start --platform twitch --key $streamKey
```

### Python

```python
import subprocess
import os

def start_stream(platform, key):
    subprocess.run([
        "vstreaming", "stream", "start",
        "--platform", platform,
        "--key", key
    ])
```

### Node.js

```javascript
const { execSync } = require('child_process');

function startStream(platform, key) {
    execSync(`vstreaming stream start --platform ${platform} --key ${key}`, {
        stdio: 'inherit'
    });
}
```

---

## Troubleshooting

### "Command not found"
Ensure V-Streaming is installed and in your PATH.

### "Permission denied"
Run with appropriate permissions or use sudo (Linux/macOS).

### "Configuration not found"
Ensure configuration file exists or run with `--config` option.

### "Stream key invalid"
Verify your stream key is correct for the platform.

---

## Advanced Usage

### Custom Configuration Directory

```bash
vstreaming -c /custom/path/config.json config show
```

### Chaining Commands

```bash
vstreaming config set --key capture.resolution --value "1920x1080" && \
vstreaming config set --key capture.framerate --value 60 && \
vstreaming config export --output optimized.json
```

### Background Execution

```bash
vstreaming stream start --platform twitch --key $KEY > /dev/null 2>&1 &
```

---

## Support

- **Documentation**: https://docs.vstreaming.com/cli
- **GitHub Issues**: https://github.com/vantisCorp/V-Streaming/issues
- **Discord**: https://discord.gg/vstreaming

---

## License

The V-Streaming CLI is part of V-Streaming and uses the same license.