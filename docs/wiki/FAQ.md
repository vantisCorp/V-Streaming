# Frequently Asked Questions (FAQ)

Find answers to the most common questions about V-Streaming.

## General

### What is V-Streaming?

V-Streaming is a revolutionary AI-powered streaming application built with Tauri (Rust + React + TypeScript). It supports multiple streaming platforms including Twitch, YouTube, Kick, and more. Features include VTubing, AI auto-clipping, live captions, dual-output streaming, and smart home integration.

### Is V-Streaming free?

Yes! V-Streaming is open-source and free to use under the MIT license. There are no subscription fees or premium tiers required for basic functionality.

### Which platforms does V-Streaming support?

V-Streaming supports streaming to:
- **Twitch** (full integration)
- **YouTube** (full integration)
- **Kick** (full integration)
- **Facebook Gaming**
- **TikTok Live**
- **Custom RTMP servers**

### What are the system requirements?

**Minimum:**
- CPU: 4 cores
- RAM: 8 GB
- GPU: NVIDIA GTX 1060 / AMD RX 580
- Storage: 500 MB
- Windows 10, macOS 10.15, or Linux

**Recommended:**
- CPU: 8 cores
- RAM: 16 GB
- GPU: NVIDIA RTX 3060 / AMD RX 6600
- Storage: 2 GB SSD
- Windows 11 or macOS 12+

### Is V-Streaming open source?

Yes! V-Streaming is fully open-source under the MIT license. You can find the source code on [GitHub](https://github.com/vantisCorp/V-Streaming).

## Getting Started

### How do I install V-Streaming?

See our [Getting Started Guide](./Getting-Started.md#installation) for detailed installation instructions for Windows, macOS, and Linux.

### How do I set up my first stream?

1. Download and install V-Streaming
2. Get your stream key from your platform's dashboard
3. Open V-Streaming and go through the setup wizard
4. Enter your stream key
5. Add your capture sources (game, webcam, overlays)
6. Click "Start Streaming"

See the [Getting Started Guide](./Getting-Started.md#basic-usage) for more details.

### How do I get my stream key?

- **Twitch**: Dashboard > Settings > Stream > Copy Stream Key
- **YouTube**: YouTube Studio > Create > Go Live > Stream > Copy Stream Key
- **Kick**: Dashboard > Stream Key > Show > Copy

## Streaming

### What bitrate should I use?

| Resolution | Framerate | Recommended Bitrate |
|------------|-----------|---------------------|
| 1080p | 60 fps | 6000 Kbps |
| 1080p | 30 fps | 4500 Kbps |
| 720p | 60 fps | 4500 Kbps |
| 720p | 30 fps | 3000 Kbps |
| 4K | 60 fps | 12000 Kbps |

### What encoder should I use?

| GPU | Recommended Encoder |
|-----|---------------------|
| NVIDIA | NVENC (H.264 or HEVC) |
| AMD | AMF (H.264 or HEVC) |
| Intel | Quick Sync |
| No dedicated GPU | x264 (software) |

NVENC is generally the best choice for NVIDIA users. It provides excellent quality with minimal CPU usage.

### What is the best encoder preset?

For most users, **P4 (Medium)** provides the best balance of quality and performance:
- P1-P3: Better quality, slower encoding
- P4: Balanced (recommended)
- P5-P7: Faster encoding, slightly lower quality

### How do I stream to multiple platforms?

1. Go to Settings > Streaming
2. Enable "Multistreaming"
3. Add platforms and their stream keys
4. Configure each platform's settings
5. Start streaming

Note: Multistreaming requires sufficient upload bandwidth.

### Why is my stream lagging?

Common causes:
1. **High bitrate** - Lower your bitrate
2. **Slow encoder preset** - Use faster preset (P5 or P6)
3. **CPU overloaded** - Use hardware encoder (NVENC/AMF)
4. **Internet issues** - Test your upload speed
5. **Too many sources** - Reduce number of sources

See our [Troubleshooting Guide](./Troubleshooting.md#streaming-issues) for more solutions.

## Capture

### Why is my capture showing a black screen?

Common solutions:
1. Run V-Streaming as administrator
2. Use Window Capture instead of Game Capture
3. Disable overlay software (Discord, Steam, GeForce Experience)
4. Update GPU drivers
5. Try different capture method (DirectX, Vulkan, DXGI)

See [Capture Issues](./Troubleshooting.md#capture-issues) for detailed solutions.

### How do I capture my game?

1. Click "Add Source"
2. Select "Game Capture"
3. Choose your game from the list
4. If not listed, use "Window Capture" or run the game first

### How do I add my webcam?

1. Click "Add Source"
2. Select "Video Capture Device"
3. Choose your webcam
4. Resize and position in the preview

### What capture sources are available?

- **Screen/Display Capture**: Captures entire screen
- **Window Capture**: Captures specific window
- **Game Capture**: Optimized for games
- **Video Capture Device**: Webcams, capture cards
- **Image Source**: Static images (PNG, JPG, etc.)
- **Browser Source**: Web content (alerts, chat, etc.)
- **Text Source**: Custom text overlays

## Audio

### Why is my audio not working?

1. Check audio device selection
2. Verify device volume is not muted
3. Test audio devices in system settings
4. Run `vstreaming diagnostics test-audio`
5. Restart the audio engine

See [Audio Issues](./Troubleshooting.md#audio-issues) for more solutions.

### How do I add background music?

1. Click "Add Source"
2. Select "Media Source"
3. Choose your audio file
4. Adjust volume in the audio mixer
5. Ensure you have rights to use the music

### How do I fix audio delay?

1. Go to Settings > Audio > Audio Delay
2. Adjust the delay (positive or negative)
3. Monitor and adjust until synced
4. Typical delay: -200ms to +500ms

### Can I use noise suppression?

Yes! V-Streaming includes built-in noise suppression:
1. Go to Settings > Audio
2. Enable "Noise Suppression"
3. Adjust the level (0.0 to 1.0)
4. Higher values suppress more noise but may affect voice

## VTuber

### What model formats are supported?

V-Streaming supports **VRM** format for 3D VTuber models. This is an open standard for 3D avatars.

### Where can I get a VRM model?

- **Create your own**: VRoid Studio (free)
- **Commission an artist**: Many artists create VRM models
- **Marketplace**: VRoid Hub, BOOTH
- **Community**: Free models available

### Why isn't my model loading?

Common issues:
1. **Wrong format**: Must be VRM format
2. **File too large**: Recommended < 10 MB
3. **Corrupted file**: Try a different file
4. **Missing components**: Model must have proper mesh and bones

### How do I set up face tracking?

1. Go to VTuber tab
2. Load your VRM model
3. Enable "Face Tracking"
4. Grant camera permissions if prompted
5. Calibrate for your lighting
6. Adjust sensitivity if needed

### Can I use VTuber features without a webcam?

Face tracking requires a webcam. However, you can use the model without tracking by animating it manually or using preset animations.

## AI Features

### How does auto-clipping work?

V-Streaming uses AI to detect exciting moments:
1. Go to AI tab
2. Enable "Highlight Detection"
3. Adjust sensitivity (0.0 to 1.0)
4. Stream normally
5. Check the Media library for clips

### What is the AI Coach?

AI Coach provides real-time streaming tips:
1. Enable in AI tab
2. Set tip frequency
3. Receive notifications during stream
4. Tips include viewer engagement, quality, etc.

### How do I enable live captions?

1. Go to AI tab
2. Enable "Live Captions"
3. Select caption language
4. Customize appearance
5. Captions appear in real-time

### Does V-Streaming support translation?

Yes! V-Streaming can translate speech:
1. Enable "Translation" in AI tab
2. Select source language (usually auto-detected)
3. Select target language
4. Translations appear as text overlay

## Performance

### How do I reduce CPU usage?

1. Use hardware encoder (NVENC/AMF)
2. Use faster encoder preset (P5 or P6)
3. Lower resolution or framerate
4. Close other applications
5. Disable unused features

### How do I reduce GPU usage?

1. Lower preview quality
2. Disable hardware acceleration
3. Use software encoder (x264)
4. Reduce capture resolution

### How much upload speed do I need?

| Bitrate | Minimum Upload Speed |
|---------|---------------------|
| 3000 Kbps | 5 Mbps |
| 4500 Kbps | 7 Mbps |
| 6000 Kbps | 10 Mbps |
| 8000 Kbps | 12 Mbps |
| 12000 Kbps | 15 Mbps |

## CLI

### How do I use the CLI?

V-Streaming includes a command-line interface:

```bash
# Show configuration
vstreaming config show

# Start streaming
vstreaming stream start -p twitch -k YOUR_KEY

# Run diagnostics
vstreaming diagnostics run

# List plugins
vstreaming plugin list
```

See the [CLI API Documentation](../CLI_API.md) for all commands.

### What can I do with the CLI?

- Manage configuration
- Start/stop streams
- Manage plugins
- Run diagnostics
- Export/import settings
- Manage profiles
- Maintenance tasks

## Plugins

### How do I install plugins?

1. Download the plugin file (.vplugin or .tar.gz)
2. Go to Settings > Plugins
3. Click "Install Plugin"
4. Select the file
5. Enable the plugin

Or use CLI:
```bash
vstreaming plugin install -s ./my-plugin.tar.gz
```

### Where can I find plugins?

- Official plugin marketplace (coming soon)
- Community forums
- GitHub repositories
- Third-party websites

### How do I create my own plugin?

See the [Plugin Development Guide](../PDK_GUIDE.md) for comprehensive documentation on creating plugins.

## Security & Privacy

### Is my stream key safe?

Yes! V-Streaming stores stream keys locally and encrypted. They are never sent to third-party servers.

### What data does V-Streaming collect?

V-Streaming collects minimal anonymous usage statistics (optional):
- Application crashes (for debugging)
- Feature usage (for improvement)
- Performance metrics (for optimization)

You can disable this in Settings > Privacy.

### Can I disable crash reporting?

Yes:
1. Go to Settings > Privacy
2. Disable "Crash Reporting"
3. Disable "Send Statistics"

## Support

### How do I get help?

1. Check the [documentation](../README.md)
2. See [Troubleshooting Guide](./Troubleshooting.md)
3. Search [GitHub Issues](https://github.com/vantisCorp/V-Streaming/issues)
4. Join [Discord](https://discord.gg/vstreaming)
5. Contact support@v-streaming.com

### How do I report a bug?

1. Check existing issues first
2. Create a new issue on GitHub
3. Include:
   - System information
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs

### How do I request a feature?

1. Check existing feature requests
2. Create a new issue with "Feature Request" label
3. Describe the feature in detail
4. Explain the use case

### How do I contribute?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [Contributing Guide](../CONTRIBUTING.md) for details.

---

Still have questions? [Contact Support](mailto:support@v-streaming.com)