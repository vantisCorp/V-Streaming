# Troubleshooting Guide

This guide helps you resolve common issues with V-Streaming.

## Table of Contents

- [General Issues](#general-issues)
- [Capture Issues](#capture-issues)
- [Audio Issues](#audio-issues)
- [Streaming Issues](#streaming-issues)
- [Encoding Issues](#encoding-issues)
- [VTuber Issues](#vtuber-issues)
- [Performance Issues](#performance-issues)
- [Platform-Specific Issues](#platform-specific-issues)

## General Issues

### V-Streaming won't start

**Symptoms**: Application crashes on launch or doesn't open

**Solutions**:

1. **Check system requirements**
   - Ensure your system meets minimum requirements
   - See [Getting Started](./Getting-Started.md#system-requirements)

2. **Run as administrator**
   ```bash
   # Windows: Right-click > Run as administrator
   # Linux: sudo ./V-Streaming
   ```

3. **Check logs**
   - Windows: `%APPDATA%\v-streaming\logs\`
   - macOS: `~/Library/Logs/v-streaming/`
   - Linux: `~/.local/share/v-streaming/logs/`

4. **Reinstall the application**
   - Uninstall V-Streaming
   - Delete configuration directory
   - Reinstall latest version

5. **Update GPU drivers**
   - NVIDIA: https://www.nvidia.com/Download/index.aspx
   - AMD: https://www.amd.com/en/support
   - Intel: https://www.intel.com/content/www/us/en/download-center/home.html

### Application freezes

**Symptoms**: V-Streaming becomes unresponsive

**Solutions**:

1. **Wait a few seconds** - It may be processing something
2. **Check CPU/GPU usage** - Close other demanding applications
3. **Lower quality settings** - Reduce bitrate or resolution
4. **Disable hardware acceleration** - Settings > Performance
5. **Restart V-Streaming**

## Capture Issues

### Black screen in capture source

**Symptoms**: Game/window capture shows nothing or black

**Solutions**:

1. **Use Window Capture instead**
   - Game Capture can be problematic on some games
   - Window Capture is more reliable

2. **Run V-Streaming as administrator**
   - Required for some games and applications

3. **Enable Game Mode** (Windows)
   - Settings > Gaming > Game Mode > On

4. **Disable overlay software**
   - Discord overlay
   - Steam overlay
   - NVIDIA GeForce Experience overlay

5. **Update GPU drivers**
   - Ensure you have the latest drivers

6. **Try different capture methods**
   - DirectX
   - Vulkan
   - DXGI
   - GDI

### Capture source not detected

**Symptoms**: Game/window not listed in sources

**Solutions**:

1. **Start the game/application first**
   - V-Streaming detects running processes

2. **Refresh sources**
   - Click "Refresh" in the source selector

3. **Check application compatibility**
   - Some applications block capture
   - Try running as administrator

4. **Use alternative capture**
   - Screen Capture (captures entire screen)
   - Display Capture

### Flickering or tearing in capture

**Symptoms**: Video flickers or has horizontal lines

**Solutions**:

1. **Enable VSync in the game**
   - Reduces tearing

2. **Adjust capture framerate**
   - Match game framerate
   - Or use higher capture rate

3. **Enable/disable vsync in V-Streaming**
   - Settings > Capture > VSync

4. **Use different color format**
   - Try BGRA8 or RGBA16Float

## Audio Issues

### No audio in stream

**Symptoms**: Stream has no sound

**Solutions**:

1. **Check audio device selection**
   - Verify correct microphone is selected
   - Verify correct speakers are selected

2. **Check device volume**
   - Ensure microphone is not muted
   - Ensure system volume is up

3. **Check audio monitoring**
   - Enable "Monitor Audio" to hear yourself
   - Verify audio levels in the mixer

4. **Test audio devices**
   - Windows: Sound Settings > Test
   - Use CLI: `vstreaming diagnostics test-audio`

5. **Restart audio engine**
   - Settings > Audio > Restart Engine

### Poor audio quality

**Symptoms**: Audio sounds distorted, static, or robotic

**Solutions**:

1. **Adjust sample rate**
   - Use 48 kHz (recommended)
   - Match system sample rate

2. **Adjust bit depth**
   - Use 24-bit (recommended)

3. **Enable noise suppression**
   - Settings > Audio > Noise Suppression
   - Adjust level (0.0 - 1.0)

4. **Enable echo cancellation**
   - Settings > Audio > Echo Cancellation

5. **Try different audio device**
   - Some devices have better quality

6. **Update audio drivers**

### Audio delay or latency

**Symptoms**: Audio is out of sync with video

**Solutions**:

1. **Adjust audio delay**
   - Settings > Audio > Audio Delay
   - Positive value: audio delayed
   - Negative value: audio advanced

2. **Reduce buffer size**
   - Settings > Audio > Buffer Size
   - Lower values reduce latency but may cause crackling

3. **Disable audio monitoring**
   - Monitoring adds latency

4. **Use WASAPI (Windows) or CoreAudio (macOS)**
   - These have lower latency than other APIs

## Streaming Issues

### Stream won't start

**Symptoms**: Clicking "Start Streaming" does nothing

**Solutions**:

1. **Check stream key**
   - Verify stream key is correct
   - Regenerate key if needed (platform dashboard)

2. **Check server selection**
   - Try a different server
   - Auto-select usually works best

3. **Check internet connection**
   - Run speed test
   - Ensure stable connection

4. **Check firewall**
   - Allow V-Streaming through firewall
   - Ports: 1935 (RTMP), 443 (HTTPS)

5. **Check platform status**
   - Platform may be experiencing issues
   - Check status page

### Stream disconnects frequently

**Symptoms**: Stream drops and reconnects repeatedly

**Solutions**:

1. **Check internet stability**
   - Test connection stability
   - Use wired connection if possible

2. **Increase reconnect attempts**
   - Settings > Streaming > Reconnect Attempts
   - Default: 5

3. **Adjust reconnect delay**
   - Settings > Streaming > Reconnect Delay
   - Default: 2 seconds

4. **Lower bitrate**
   - High bitrate may cause disconnects
   - Try 4500 Kbps for 1080p60

5. **Enable low latency mode**
   - Settings > Streaming > Low Latency

6. **Check network congestion**
   - Close other bandwidth-heavy applications

### Stream looks choppy or laggy

**Symptoms**: Viewers report stuttering or low FPS

**Solutions**:

1. **Lower bitrate**
   - Try 4500 Kbps for 1080p60
   - Try 3000 Kbps for 720p60

2. **Lower framerate**
   - Try 30 fps instead of 60 fps
   - Easier for viewers with slow connections

3. **Enable adaptive bitrate**
   - Settings > Streaming > Adaptive Bitrate
   - Automatically adjusts based on network

4. **Check your upload speed**
   - Need at least 6 Mbps for 1080p60
   - Need at least 4.5 Mbps for 720p60

5. **Use faster encoder preset**
   - Try P5 or P6
   - Better performance, slightly lower quality

### Stream not appearing on platform

**Symptoms**: Stream starts but not visible on platform

**Solutions**:

1. **Wait a few minutes**
   - Sometimes takes time to appear

2. **Check stream title/category**
   - Ensure they're set
   - Platform may hide streams without title

3. **Check platform dashboard**
   - Verify stream is active
   - May need to enable "Go Live"

4. **Check stream key**
   - Verify it's correct
   - Regenerate if needed

## Encoding Issues

### High CPU usage

**Symptoms**: CPU usage is very high (80-100%)

**Solutions**:

1. **Use hardware encoder**
   - NVENC (NVIDIA)
   - AMF (AMD)
   - Quick Sync (Intel)

2. **Use faster encoder preset**
   - P6 (faster) or P7 (fastest)
   - Lower quality but better performance

3. **Lower resolution or bitrate**
   - Try 720p60 instead of 1080p60

4. **Close other applications**
   - Free up CPU resources

5. **Enable multi-threading**
   - Settings > Encoding > Multi-threaded

### Poor quality encoding

**Symptoms**: Video looks blocky or pixelated

**Solutions**:

1. **Use slower encoder preset**
   - P4 (recommended) or P3 (better quality)
   - Higher quality but more CPU usage

2. **Increase bitrate**
   - Try 8000 Kbps for 1080p60
   - Ensure sufficient upload speed

3. **Use better encoder**
   - H.265 (HEVC) for better quality at same bitrate
   - AV1 for best quality (if supported)

4. **Enable two-pass encoding**
   - Settings > Encoding > Two-pass
   - Better quality but slower

5. **Adjust keyframe interval**
   - Settings > Encoding > Keyframe Interval
   - 2 seconds (default) is usually good

## VTuber Issues

### Model not loading

**Symptoms**: VRM model fails to load or appears as placeholder

**Solutions**:

1. **Check file format**
   - Must be VRM format
   - Other formats not supported

2. **Check file size**
   - Recommended: < 10 MB
   - Large files may not load

3. **Check model integrity**
   - Ensure VRM file is not corrupted
   - Try a different VRM file

4. **Check model requirements**
   - Must have proper mesh
   - Must have proper materials
   - Must have proper bones

5. **Restart V-Streaming**
   - Sometimes helps with loading issues

### Face tracking not working

**Symptoms**: Model doesn't follow face movements

**Solutions**:

1. **Check camera**
   - Ensure camera is detected
   - Test camera in system settings

2. **Check lighting**
   - Face tracking needs good lighting
   - Avoid backlighting
   - Use frontal lighting

3. **Adjust sensitivity**
   - Settings > VTuber > Tracking Sensitivity
   - Try different values (0.0 - 1.0)

4. **Calibrate**
   - Settings > VTuber > Calibrate
   - Follow on-screen instructions

5. **Update camera drivers**

### Model looks distorted

**Symptoms**: Model appears stretched, squashed, or broken

**Solutions**:

1. **Check model scale**
   - Settings > VTuber > Model Scale
   - Adjust X, Y, Z scales

2. **Check model rotation**
   - Settings > VTuber > Model Rotation
   - Adjust X, Y, Z rotations

3. **Check model position**
   - Settings > VTuber > Model Position
   - Adjust X, Y, Z positions

4. **Try different VRM model**
   - Some models have issues

## Performance Issues

### Low FPS in preview

**Symptoms**: Preview is choppy or low FPS

**Solutions**:

1. **Lower preview quality**
   - Settings > UI > Preview Quality
   - Try "Low" or "Medium"

2. **Disable preview**
   - Settings > UI > Preview Enabled
   - Use external monitor instead

3. **Close other applications**
   - Free up GPU resources

4. **Reduce capture resolution**
   - Lower source resolution

5. **Use hardware acceleration**
   - Settings > Performance > Hardware Acceleration

### High memory usage

**Symptoms**: Application uses excessive RAM

**Solutions**:

1. **Reduce buffer sizes**
   - Settings > Audio > Buffer Size
   - Settings > Capture > Buffer Size

2. **Disable unused features**
   - Turn off VTuber if not using
   - Turn off AI features

3. **Clear cache**
   - CLI: `vstreaming maintenance clear-cache`

4. **Restart V-Streaming**
   - Regular restarts help

5. **Increase system RAM**
   - 16 GB recommended

### High GPU usage

**Symptoms**: GPU usage is very high

**Solutions**:

1. **Lower preview quality**
   - Settings > UI > Preview Quality

2. **Disable hardware acceleration**
   - Settings > Performance > Hardware Acceleration

3. **Use software encoding**
   - x264 instead of NVENC/AMF
   - More CPU, less GPU

4. **Reduce capture resolution**
   - Lower source resolution

## Platform-Specific Issues

### Windows

**Issue**: Capturing UWP apps/games

**Solution**: Use "Window Capture" or run as administrator

**Issue**: Capturing full-screen applications

**Solution**: Use "Display Capture" or run in borderless windowed

**Issue**: Audio device not detected

**Solution**: 
- Restart Windows Audio service
- Update audio drivers
- Try WASAPI audio API

### macOS

**Issue**: Camera permissions

**Solution**:
- System Preferences > Security & Privacy > Privacy
- Allow V-Streaming camera access
- Restart V-Streaming

**Issue**: Microphone permissions

**Solution**:
- System Preferences > Security & Privacy > Privacy
- Allow V-Streaming microphone access
- Restart V-Streaming

**Issue**: Capture not working

**Solution**:
- Grant screen recording permissions
- System Preferences > Security & Privacy > Privacy
- Allow V-Streaming screen recording

### Linux

**Issue**: Capture not working

**Solution**:
- Install required dependencies
```bash
sudo apt install libx11-dev libxrandr-dev libxinerama-dev libxcursor-dev
```

**Issue**: Audio not working

**Solution**:
- Install PulseAudio or PipeWire
- Configure audio in V-Streaming settings

**Issue**: Wayland issues

**Solution**:
- Use X11 session
- Or enable Wayland support in settings

## Getting Additional Help

If you can't resolve your issue:

1. **Search existing issues**
   - Check [GitHub Issues](https://github.com/vantisCorp/V-Streaming/issues)
   - Your problem may already be solved

2. **Check documentation**
   - [Getting Started](./Getting-Started.md)
   - [API Documentation](../API.md)
   - [CLI API Reference](../CLI_API.md)

3. **Run diagnostics**
   ```bash
   vstreaming diagnostics run
   ```

4. **Create a GitHub issue**
   - Include system information
   - Include error logs
   - Include steps to reproduce
   - Screenshots/videos if applicable

5. **Join the community**
   - [Discord Server](https://discord.gg/vstreaming)
   - [Community Forum](https://community.v-streaming.com)

6. **Contact support**
   - Email: support@v-streaming.com

## Reporting Issues

When reporting an issue, include:

1. **System information**
   - OS and version
   - CPU, GPU, RAM
   - V-Streaming version

2. **Steps to reproduce**
   - What you were trying to do
   - What happened
   - Expected behavior

3. **Error messages**
   - Any error messages shown
   - Full stack traces if available

4. **Logs**
   - V-Streaming logs
   - System logs

5. **Screenshots/Recordings**
   - Visual evidence of the issue

---

Still having trouble? [Contact Support](mailto:support@v-streaming.com)