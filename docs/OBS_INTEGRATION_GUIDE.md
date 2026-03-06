# OBS WebSocket Integration - User Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Using OBS Integration](#using-obs-integration)
6. [Features](#features)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Overview

The OBS WebSocket Integration feature allows you to control OBS Studio remotely from the V-Streaming application. This integration provides seamless control over scenes, streaming, recording, audio, and transitions.

### Key Features

- 🎬 **Scene Management**: Switch between OBS scenes remotely
- 📡 **Stream Control**: Start/stop streaming and monitor real-time statistics
- 🔴 **Recording Control**: Control recording with pause/resume functionality
- 🎚️ **Audio Management**: Mute/unmute and adjust volume for audio inputs
- ✨ **Transition Control**: Manage and trigger scene transitions
- 🔄 **Auto-Reconnect**: Automatic reconnection if OBS disconnects
- 💾 **Persistent Settings**: Connection settings saved automatically

---

## Requirements

### Software Requirements

- **OBS Studio**: Version 28.0 or higher
  - Download: https://obsproject.com/download
- **V-Streaming**: Version 1.2.0 or higher
- **obs-websocket-js**: Automatically installed with V-Streaming

### Network Requirements

- Both OBS Studio and V-Streaming must be on the same network
- Default port: 4455
- Firewall must allow connections on the configured port

---

## Installation

### Step 1: Enable OBS WebSocket in OBS Studio

1. Open OBS Studio
2. Go to **Tools** → **WebSocket Server Settings**
3. Check **Enable WebSocket Server**
4. Configure settings:
   - **Server Port**: Default is 4455 (you can change this)
   - **Password**: Set a secure password (recommended)
   - **Authentication**: Enable if using a password

5. Click **Apply** and **OK**

### Step 2: Note Your Connection Details

Keep the following information handy:
- **Address**: Usually `127.0.0.1` (localhost) or your local IP
- **Port**: Default is `4455` (unless changed)
- **Password**: The password you set in OBS WebSocket settings

---

## Configuration

### Accessing OBS Integration

1. Launch V-Streaming
2. Click the 🎬 **OBS Integration** button in the header toolbar
3. The OBS Integration panel will open

### Connecting to OBS

1. In the **Connection** tab, enter your OBS details:
   - **Address**: `127.0.0.1` (or your OBS machine's IP)
   - **Port**: `4455` (or your configured port)
   - **Password**: Your OBS WebSocket password (if set)

2. Enable **Auto Reconnect** (recommended) to automatically reconnect if OBS disconnects

3. Click **Connect**

4. If connection is successful, you'll see:
   - ✓ Connected status indicator
   - Current OBS status displayed

5. Click **Save Settings** to save your connection details for future use

---

## Using OBS Integration

### Connection Tab

The Connection tab allows you to manage your OBS connection.

**Fields:**
- **Address**: IP address or hostname of the OBS machine
- **Port**: WebSocket server port (default: 4455)
- **Password**: WebSocket password (if authentication is enabled)
- **Auto Reconnect**: Automatically reconnect if disconnected

**Actions:**
- **Connect**: Establish connection to OBS
- **Disconnect**: Close the connection
- **Save Settings**: Save connection details to localStorage

---

### Scenes Tab

The Scenes tab allows you to view and switch between OBS scenes.

**Features:**
- View all available scenes in your OBS
- Current scene highlighted
- Click any scene to switch to it
- Real-time scene updates

**Usage:**
1. Navigate to the **Scenes** tab
2. You'll see all your OBS scenes as cards
3. Click on a scene card to switch to that scene
4. The scene will change immediately in OBS

---

### Stream Tab

The Stream tab provides full control over your OBS streaming.

**Stream Controls:**
- **Start Stream**: Begin streaming to your platform
- **Stop Stream**: End the current stream
- **Toggle Stream**: Quick start/stop toggle

**Real-time Statistics:**
- **Status**: Offline/Live/Starting/Stopping
- **Duration**: Stream duration in MM:SS format
- **Congestion**: Network congestion percentage
- **Dropped Frames**: Number of dropped frames
- **Bitrate**: Current streaming bitrate (kbps)
- **FPS**: Current frames per second

**Usage:**
1. Navigate to the **Stream** tab
2. Click **Start Stream** to begin streaming
3. Monitor real-time statistics during your stream
4. Click **Stop Stream** to end streaming

---

### Recording Tab

The Recording tab allows you to control OBS recording.

**Recording Controls:**
- **Start Recording**: Begin recording to disk
- **Stop Recording**: End current recording
- **Pause**: Pause recording (keeps file open)
- **Resume**: Resume paused recording
- **Toggle Recording**: Quick start/stop toggle

**Recording Statistics:**
- **Status**: Stopped/Recording/Paused
- **Duration**: Recording duration in MM:SS format
- **File Size**: Current recording file size

**Usage:**
1. Navigate to the **Recording** tab
2. Click **Start Recording** to begin recording
3. Use **Pause** to temporarily pause recording
4. Use **Resume** to continue recording
5. Click **Stop Recording** to save your recording

---

### Audio Tab

The Audio tab allows you to manage OBS audio inputs.

**Audio Controls:**
- **Mute/Unmute**: Toggle audio for each input
- **Volume**: Adjust volume (0-100 scale)

**Features:**
- List of all audio inputs in OBS
- Mute button for each input
- Volume slider for each input
- Real-time audio level indicators

**Usage:**
1. Navigate to the **Audio** tab
2. You'll see all your audio inputs
3. Click the mute button to mute/unmute an input
4. Use the volume slider to adjust volume
5. Changes apply immediately in OBS

---

### Transitions Tab

The Transitions tab allows you to manage scene transitions.

**Transition Controls:**
- **Current Transition**: View currently selected transition
- **Transition List**: All available transitions
- **Duration**: Transition duration in milliseconds
- **Trigger Transition**: Manually trigger the transition

**Usage:**
1. Navigate to the **Transitions** tab
2. Select a transition from the dropdown
3. Set the transition duration
4. Click **Transition** to apply the transition

---

## Features

### Auto-Reconnect

When enabled, V-Streaming will automatically attempt to reconnect to OBS if the connection is lost.

**Configuration:**
- Enable in the Connection tab
- Default reconnect interval: 5 seconds
- Will retry indefinitely until successful

### Persistent Settings

Connection settings are saved to your browser's localStorage:
- Address
- Port
- Password
- Auto-reconnect preference

Settings are loaded automatically when you open the OBS Integration panel.

### Real-Time Updates

All OBS events are reflected in real-time:
- Scene changes
- Stream status
- Recording status
- Audio levels
- Input state changes

---

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to OBS

**Solutions**:
1. Verify OBS WebSocket is enabled in OBS Studio
2. Check that OBS Studio is running
3. Verify the address and port are correct
4. Ensure both applications are on the same network
4. Check firewall settings
5. Verify password is correct (if using authentication)

**Problem**: Connection drops frequently

**Solutions**:
1. Enable Auto-Reconnect
2. Check network stability
3. Reduce network load
4. Update OBS Studio to latest version
5. Restart both OBS and V-Streaming

### Scene Issues

**Problem**: Cannot switch scenes

**Solutions**:
1. Verify you're connected to OBS
2. Check that scenes exist in OBS
3. Refresh the scenes list by disconnecting and reconnecting
4. Restart OBS Studio

### Stream Issues

**Problem**: Cannot start/stop stream

**Solutions**:
1. Verify OBS stream settings are configured
2. Check that stream key is valid
3. Ensure you have an active internet connection
4. Try controlling stream directly in OBS first

### Recording Issues

**Problem**: Recording not working

**Solutions**:
1. Verify OBS recording path is set
2. Check disk space
3. Ensure recording format is supported
4. Try recording directly in OBS first

### Audio Issues

**Problem**: Audio controls not working

**Solutions**:
1. Verify audio inputs are active in OBS
2. Check audio device drivers
3. Refresh connection by disconnecting and reconnecting
4. Restart OBS audio subsystem (Audio → Restart Audio)

---

## FAQ

### Q: Can I control OBS from a different computer?

**A**: Yes! Just use the IP address of the computer running OBS instead of `127.0.0.1`. Make sure both computers are on the same network and the firewall allows connections on the configured port.

### Q: Is the password stored securely?

**A**: The password is stored in your browser's localStorage. While this is convenient for auto-connect, it's not encrypted. For maximum security, consider using a strong password and not sharing your browser profile.

### Q: Can I use this while OBS is streaming/recording?

**A**: Absolutely! You can control OBS at any time, whether it's idle, streaming, or recording. Changes apply in real-time.

### Q: What happens if I close V-Streaming while connected?

**A**: The connection will be closed. OBS will continue running normally. Your connection settings are saved for the next time you open V-Streaming.

### Q: Can multiple V-Streaming instances connect to the same OBS?

**A**: Yes, OBS WebSocket supports multiple connections. Each connection can control OBS independently.

### Q: Does this work with all OBS versions?

**A**: This integration uses obs-websocket-js, which supports OBS 28.0 and higher. Older versions may not be compatible.

### Q: Can I customize the reconnect interval?

**A**: Currently, the reconnect interval is fixed at 5 seconds. Customizable intervals may be added in future updates.

### Q: What languages are supported?

**A**: The OBS Integration UI is available in English and Polish. More languages may be added in the future.

---

## Tips & Best Practices

1. **Test Connection First**: Always test your OBS connection before going live
2. **Use Auto-Reconnect**: Enable auto-reconnect for reliability during streams
3. **Monitor Statistics**: Keep an eye on stream statistics for optimal performance
4. **Save Settings**: Save your connection settings to avoid re-entering them
5. **Secure Your Connection**: Use a strong password for OBS WebSocket
6. **Regular Updates**: Keep both OBS Studio and V-Streaming updated
7. **Backup Settings**: Note your OBS WebSocket settings as backup

---

## Support

If you encounter issues not covered in this guide:

1. Check the [V-Streaming GitHub Issues](https://github.com/vantisCorp/V-Streaming/issues)
2. Search for similar issues before creating a new one
3. Provide detailed information about your setup and the issue
4. Include screenshots if applicable

---

## Changelog

### v1.2.0 (Current)
- Initial release of OBS WebSocket Integration
- Scene management
- Stream control
- Recording control
- Audio management
- Transition control
- Auto-reconnect functionality
- Persistent settings
- English and Polish translations

---

## License

This feature is part of V-Streaming and follows the same license terms.

---

**Last Updated**: 2024
**Version**: 1.2.0