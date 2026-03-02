# V-Streaming Architecture Documentation

## Overview

V-Streaming is built on a high-performance, zero-copy architecture designed specifically for streaming applications. The system is divided into three main components:

1. **Rust Backend (Engine)** - Handles all video/audio processing, capture, and encoding
2. **React Frontend (UI)** - Provides a modern, responsive user interface
3. **Tauri Bridge** - Enables secure, efficient communication between UI and backend

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (UI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Scene Editor│  │  Settings    │  │  Chat/Stats  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                    Tauri IPC Bridge
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Rust Backend (Engine)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Main Thread (Orchestrator)               │  │
│  │  - Command handling                                   │  │
│  │  - State management                                   │  │
│  │  - Plugin coordination                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Video Engine Thread (Isolated)                │  │
│  │  - Capture (DirectX/Vulkan/Screen)                    │  │
│  │  - Composition (Canvas/Layers)                        │  │
│  │  - Encoding (NVENC/AMF/QuickSync)                     │  │
│  │  - Streaming (RTMP/SRT)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Audio Engine Thread (Isolated)                │  │
│  │  - Capture (WASAPI)                                   │  │
│  │  - Mixing (VST plugins)                               │  │
│  │  - Processing (Noise gate/Compressor)                 │  │
│  │  - Synchronization (Lip-sync)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         GPU Pipeline (Zero-Copy)                      │  │
│  │  - VRAM-only processing                               │  │
│  │  - HDR to SDR tonemapping                             │  │
│  │  - Filters and effects                                │  │
│  │  - Hardware encoding                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Capture Engine

**Purpose**: Capture video and audio from various sources

**Components**:
- `capture::directx` - DirectX game capture
- `capture::vulkan` - Vulkan game capture
- `capture::screen` - Screen/window capture
- `capture::uvc` - USB capture card support
- `capture::console` - Console capture (PS Remote Play, Xbox App)
- `audio::wasapi` - Windows Audio Session API capture

**Key Features**:
- Zero-copy GPU capture
- HDR to SDR conversion
- Multi-source capture
- Low-latency audio capture

### 2. Composition Engine

**Purpose**: Combine and manipulate video sources

**Components**:
- `composition::canvas` - Main composition canvas
- `composition::layers` - Layer management system
- `composition::filters` - Video filters (LUTs, sharpening, etc.)
- `composition::vtuber` - VTubing model support
- `composition::effects` - Visual effects

**Key Features**:
- Dual-output (16:9 and 9:16)
- Layer-based composition
- Real-time filters
- VTubing integration

### 3. Audio Engine

**Purpose**: Process and mix audio streams

**Components**:
- `audio::mixer` - Audio mixing engine
- `audio::vst` - VST plugin support
- `audio::effects` - Audio effects (noise gate, compressor)
- `audio::voice_changer` - AI voice changer
- `audio::sync` - Lip-sync synchronization

**Key Features**:
- Multi-track mixing
- VST plugin support
- Real-time effects
- Automatic synchronization

### 4. Encoding Engine

**Purpose**: Encode video and audio for streaming

**Components**:
- `encoding::nvenc` - NVIDIA NVENC encoder
- `encoding::amf` - AMD AMF encoder
- `encoding::quicksync` - Intel Quick Sync encoder
- `encoding::software` - Software encoder fallback
- `encoding::codecs` - Codec support (H.264, H.265, AV1)

**Key Features**:
- Hardware acceleration
- Multiple codec support
- Adaptive bitrate
- Quality presets

### 5. Streaming Engine

**Purpose**: Send encoded streams to platforms

**Components**:
- `streaming::rtmp` - RTMP/RTMPS protocol
- `streaming::srt` - SRT protocol
- `streaming::multistream` - Multi-platform streaming
- `streaming::cloud` - Cloud streaming service

**Key Features**:
- Multi-platform support
- Adaptive streaming
- Low latency
- Cloud integration

### 6. Plugin System

**Purpose**: Extensible architecture for third-party plugins

**Components**:
- `plugin::manager` - Plugin manager
- `plugin::api` - Plugin API
- `plugin::loader` - Plugin loader

**Key Features**:
- Dynamic loading
- Safe API
- Hot-reloading
- Sandboxing

## Thread Architecture

### Main Thread
- Handles Tauri commands
- Manages application state
- Coordinates between threads
- Handles UI communication

### Video Engine Thread
- Video capture
- Composition
- Encoding
- Streaming
- **Isolated from UI to prevent freezes**

### Audio Engine Thread
- Audio capture
- Mixing
- Processing
- Synchronization
- **Isolated from UI to prevent freezes**

### GPU Thread Pool
- GPU operations
- Shader processing
- Texture operations
- Parallel processing

## Memory Management

### Zero-Copy Pipeline
- Video frames stay in VRAM
- No CPU-GPU transfers
- Direct GPU-to-GPU operations
- Minimal memory overhead

### Memory Safety
- Rust's ownership system
- No memory leaks
- Thread-safe operations
- Efficient allocation

## Performance Optimizations

### GPU Acceleration
- All video processing on GPU
- Hardware encoding
- GPU-based filters
- Shader effects

### Thread Isolation
- UI never blocks streaming
- Separate threads for video/audio
- Lock-free communication
- Efficient scheduling

### Resource Management
- Efficient memory usage
- Smart caching
- Lazy loading
- Resource pooling

## Security

### Sandboxing
- Plugin sandboxing
- Restricted file access
- Secure IPC
- Input validation

### Data Protection
- Encrypted streaming
- Secure credentials
- Privacy controls
- Audit logging

## Scalability

### Modular Design
- Pluggable components
- Easy to extend
- Clear interfaces
- Minimal coupling

### Performance Scaling
- Multi-threading
- GPU acceleration
- Efficient algorithms
- Resource management

## Development Guidelines

### Code Organization
- Each module in its own crate
- Clear separation of concerns
- Well-documented APIs
- Comprehensive tests

### Best Practices
- Use Rust's type system
- Minimize unsafe code
- Proper error handling
- Extensive logging

### Testing
- Unit tests for all modules
- Integration tests
- Performance benchmarks
- Stress testing

## Future Enhancements

### AI Integration
- AI-based scene detection
- Auto-clipping
- Content moderation
- Quality optimization

### Cloud Features
- Cloud rendering
- Distributed encoding
- Real-time collaboration
- Analytics

### Mobile Support
- Mobile companion app
- Remote control
- Mobile streaming
- Cross-platform sync