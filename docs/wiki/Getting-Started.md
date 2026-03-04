# Getting Started with V-Streaming

Welcome to V-Streaming! This guide will help you get up and running with the ultimate AI-powered streaming platform.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Initial Setup](#initial-setup)
- [Basic Usage](#basic-usage)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **CPU**: 4 cores (Intel i5 8th Gen or AMD Ryzen 5 2nd Gen)
- **RAM**: 8 GB
- **GPU**: NVIDIA GTX 1060 / AMD RX 580 or equivalent
- **Storage**: 500 MB free space
- **Internet**: Stable broadband connection

### Recommended Requirements
- **OS**: Windows 11 or macOS 12+
- **CPU**: 8 cores (Intel i7 10th Gen or AMD Ryzen 7 3rd Gen)
- **RAM**: 16 GB
- **GPU**: NVIDIA RTX 3060 / AMD RX 6600 or better
- **Storage**: 2 GB SSD
- **Internet**: High-speed fiber connection

### For VTubing Features
- **Webcam**: 720p or higher (1080p recommended)
- **CPU**: 8 cores recommended
- **RAM**: 16 GB recommended

## Installation

### Windows

1. **Download the installer**
   - Visit [v-streaming.com/download](https://v-streaming.com/download)
   - Download the Windows installer (.exe)
   
2. **Run the installer**
   - Double-click the downloaded file
   - Follow the installation wizard
   - Choose your preferred installation directory
   
3. **Launch V-Streaming**
   - Click "Finish" after installation
   - V-Streaming will launch automatically

### macOS

1. **Download the disk image**
   - Visit [v-streaming.com/download](https://v-streaming.com/download)
   - Download the macOS disk image (.dmg)
   
2. **Install the application**
   - Open the downloaded .dmg file
   - Drag V-Streaming to your Applications folder
   
3. **Grant permissions**
   - On first launch, you may need to grant camera/microphone permissions
   - Go to System Preferences > Security & Privacy > Privacy
   - Allow V-Streaming access to camera and microphone

### Linux

```bash
# Download and install using AppImage
wget https://github.com/vantisCorp/V-Streaming/releases/latest/download/V-Streaming-linux.AppImage
chmod +x V-Streaming-linux.AppImage
./V-Streaming-linux.AppImage

# Or using Snap
sudo snap install v-streaming

# Or using Flatpak
flatpak install flathub com.vstreaming.VStreaming
```

### Building from Source

If you prefer to build from source:

```bash
# Clone the repository
git clone https://github.com/vantisCorp/V-Streaming.git
cd V-Streaming

# Install Node.js dependencies
npm install

# Install Rust toolchain (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build the application
npm run tauri:build

# Run the development version
npm run tauri:dev
```

## Initial Setup

### First Launch Wizard

When you first launch V-Streaming, you'll be greeted by an onboarding wizard:

1. **Welcome Screen**
   - Introduction to V-Streaming features
   - Click "Get Started" to begin

2. **Language Selection**
   - Choose your preferred language
   - Supported: English, Polish, German, Chinese, Russian, Korean, Spanish, French

3. **Platform Setup**
   - Select your streaming platform (Twitch, YouTube, Kick)
   - Enter your stream key

4. **Hardware Configuration**
   - V-Streaming will detect your capture sources
   - Select your default capture source
   - Configure your audio devices

5. **Performance Tuning**
   - Choose a preset based on your hardware:
     - **High Quality**: Best visual quality (requires strong hardware)
     - **Balanced**: Good balance of quality and performance
     - **High Performance**: Maximum FPS, lower quality

6. **Theme Selection**
   - Choose between Light, Dark, or Auto theme
   - Dark theme is recommended for long streaming sessions

### Manual Configuration

If you prefer to configure manually:

#### Stream Settings

1. **Go to Streaming tab**
2. **Enter your stream key** (get it from your platform's dashboard)
3. **Select your server** (usually auto-detected)
4. **Configure stream settings**:
   - Resolution: 1920x1080 (1080p) recommended
   - Framerate: 60 fps (60 frames per second)
   - Bitrate: 6000 Kbps (for 1080p60)

#### Encoder Settings

V-Streaming supports multiple encoders:

- **NVENC** (NVIDIA): Best performance, recommended for NVIDIA GPUs
- **AMF** (AMD): Good performance for AMD GPUs
- **Quick Sync** (Intel): Good performance for Intel GPUs
- **x264** (Software): High quality, higher CPU usage

Recommended preset: `P4` (quality/efficiency balance)

#### Audio Settings

1. **Select your microphone** as the default input
2. **Select your speakers** as the default output
3. **Configure audio monitoring** to hear yourself (optional)
4. **Adjust sample rate**: 48 kHz is recommended

## Basic Usage

### Starting Your First Stream

1. **Configure your scene**
   - Add sources (game capture, webcam, overlays)
   - Arrange them in the composition editor

2. **Preview your stream**
   - Use the preview window to check your layout
   - Test audio levels

3. **Start streaming**
   - Click the "Start Streaming" button (or press F1)
   - Monitor your stream stats in the dashboard

### Using Hotkeys

V-Streaming includes useful hotkeys:

| Hotkey | Action |
|--------|--------|
| `F1` | Start/Stop streaming |
| `F2` | Mute/Unmute microphone |
| `F5` | Toggle preview |
| `F8` | Start/Stop recording |
| `1-9` | Switch to scene 1-9 |
| `Ctrl+M` | Mute/Unmute audio |
| `Ctrl+R` | Refresh sources |

### Managing Scenes

1. **Create a new scene**
   - Click "Add Scene" button
   - Name your scene (e.g., "Gaming", "Just Chatting")

2. **Add sources to scene**
   - Click "Add Source"
   - Choose source type (Game Capture, Window Capture, etc.)
   - Configure source settings

3. **Switch between scenes**
   - Use hotkeys (1-9) or click on scene list
   - Smooth transitions available

### Adding Overlays

V-Streaming supports various overlays:

1. **Image overlays**
   - Click "Add Source" > "Image"
   - Select your overlay image (PNG with transparency recommended)

2. **Browser sources**
   - Click "Add Source" > "Browser Source"
   - Enter URL for web-based overlays (alerts, chat, etc.)

3. **Text overlays**
   - Click "Add Source" > "Text"
   - Enter your text and configure font/style

## VTubing Setup

If you want to use V-Streaming's VTuber features:

1. **Prepare your 3D model**
   - Export your model in VRM format
   - Recommended size: < 10 MB

2. **Load the model**
   - Go to VTuber tab
   - Click "Load VRM Model"
   - Select your VRM file

3. **Configure tracking**
   - Enable face tracking
   - Adjust sensitivity
   - Calibrate for your lighting conditions

4. **Customize expressions**
   - Set up facial expressions
   - Configure mouth shapes
   - Add animations

## AI Features

### Live Captions

1. Enable "Live Captions" in the AI tab
2. Select caption language
3. Customize caption appearance
4. Captions appear in real-time

### Auto-Clipping

1. Enable "Auto-Clipping" in the AI tab
2. Adjust sensitivity (0.0 - 1.0)
3. Clips are automatically created during highlights
4. Find clips in the Media library

### AI Coach

1. Enable "AI Coach" in the AI tab
2. Set tip frequency (e.g., every 30 seconds)
3. Receive real-time streaming tips
4. Tips appear as notifications

## Troubleshooting

### Stream Not Starting

**Problem**: Clicking "Start Streaming" does nothing

**Solutions**:
1. Check your stream key is correct
2. Verify your internet connection
3. Try a different server
4. Check firewall settings

### Low FPS

**Problem**: Stream looks choppy or laggy

**Solutions**:
1. Lower your bitrate (try 4500 Kbps for 1080p60)
2. Switch to a faster encoder preset (P5 or P6)
3. Close other applications
4. Lower your resolution (try 1280x720)
5. Use hardware encoder (NVENC/AMF) instead of x264

### Audio Issues

**Problem**: No audio or poor audio quality

**Solutions**:
1. Check your audio device selection
2. Verify your microphone is not muted
3. Adjust sample rate to 48 kHz
4. Try different audio devices

### Capture Source Not Working

**Problem**: Game capture or window capture shows black screen

**Solutions**:
1. Run V-Streaming as administrator
2. Use "Window Capture" instead of "Game Capture"
3. Enable "Game Mode" in Windows
4. Update your GPU drivers

### VTuber Model Not Loading

**Problem**: VRM model fails to load

**Solutions**:
1. Ensure the file is in VRM format
2. Check file size (< 10 MB recommended)
3. Verify model integrity
4. Try a different VRM file

## Next Steps

Now that you're set up, explore more features:

- [ ] **Check out the CLI documentation** - Learn command-line operations
- [ ] **Install plugins** - Extend V-Streaming with community plugins
- [ ] **Set up multi-streaming** - Stream to multiple platforms simultaneously
- [ ] **Configure alerts** - Add follower, sub, and donation alerts
- [ ] **Join the community** - Get help and share tips with other users

## Additional Resources

- [Full Documentation](../README.md)
- [API Documentation](../API.md)
- [CLI API Reference](../CLI_API.md)
- [Plugin Development Guide](../PDK_GUIDE.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)
- [Community Forum](https://community.v-streaming.com)
- [Discord Server](https://discord.gg/vstreaming)
- [GitHub Repository](https://github.com/vantisCorp/V-Streaming)
- [Report Issues](https://github.com/vantisCorp/V-Streaming/issues)

## Support

If you need help:

1. **Check the documentation** - Most questions are answered here
2. **Search existing issues** - Your problem may already be solved
3. **Ask in the community** - Get help from other users
4. **Create a GitHub issue** - Report bugs or request features
5. **Contact support** - Email support@v-streaming.com

---

Happy streaming! 🎮📺