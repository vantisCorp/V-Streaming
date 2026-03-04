# V-Streaming API Reference

## Overview

V-Streaming provides a comprehensive IPC (Inter-Process Communication) API for managing all aspects of streaming, capture, encoding, and VTubing functionality. The API is exposed through Tauri's IPC mechanism and can be called from the frontend or from plugins.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
   - [Capture API](#capture-api)
   - [Audio API](#audio-api)
   - [GPU API](#gpu-api)
   - [Encoding API](#encoding-api)
   - [Streaming API](#streaming-api)
   - [VTuber API](#vtuber-api)
   - [Cloud API](#cloud-api)
   - [Analytics API](#analytics-api)
5. [Data Types](#data-types)
6. [Examples](#examples)

## Getting Started

### TypeScript Example

```typescript
import { invoke } from '@tauri-apps/api/core';

// Greeting
const greeting = await invoke<string>('greet', { name: 'World' });
console.log(greeting); // "Hello, World! Welcome to V-Streaming!"

// Get capture sources
const sources = await invoke<CaptureSourceInfo[]>('enumerate_capture_sources');
console.log(sources);

// Start capture
await invoke('start_capture', {
  source: {
    id: 'screen-1',
    name: 'Screen 1',
    type: 'screen',
    active: true
  }
});
```

### Python Example

```python
from tauri_api import invoke

# Get GPU info
gpu_info = invoke('get_gpu_info')
print(f"GPU: {gpu_info['name']}")

# Start audio processing
invoke('start_audio_processing')

# Get audio devices
devices = invoke('enumerate_audio_devices')
for device in devices:
    print(f"{device['name']}: {device['type']}")
```

## Authentication

All API calls require a Tauri context. The API is only accessible from within the V-Streaming application or from authorized plugins.

**No additional authentication required** for local IPC calls.

## Error Handling

All API operations return `Result<T, String>` where `T` is the successful return type and `String` contains error messages on failure.

### Error Response Format

```typescript
try {
  await invoke('start_capture', { source: {...} });
} catch (error) {
  console.error('Capture failed:', error);
  // Error message is a string describing the failure
}
```

### Common Error Codes

| Error | Description |
|-------|-------------|
| `Capture failed` | Unable to start capture from source |
| `No capture sources found` | No available capture sources |
| `Audio device not found` | Specified audio device is unavailable |
| `GPU not initialized` | GPU engine not initialized |
| `Encoding failed` | Failed to start encoding |
| `Stream connection failed` | Unable to connect to streaming platform |
| `Model load failed` | Failed to load VTuber model |

## API Endpoints

### Capture API

The Capture API manages screen, window, and camera capture sources.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/capture/sources` | Enumerate available capture sources |
| POST | `/capture/start` | Start capturing from a source |
| POST | `/capture/stop` | Stop all capture operations |
| GET | `/capture/status` | Check if currently capturing |
| GET | `/capture/active-sources` | Get list of active capture sources |
| GET | `/capture/performance` | Get capture performance statistics |
| GET | `/capture/presets` | Get available capture presets |

#### Example: Start Screen Capture

```typescript
const sources = await invoke<CaptureSourceInfo[]>('enumerate_capture_sources');
const screenSource = sources.find(s => s.type === 'screen');

if (screenSource) {
  await invoke('start_capture', {
    source: {
      id: screenSource.id,
      name: screenSource.name,
      type: 'screen',
      active: true
    }
  });
}
```

### Audio API

The Audio API manages audio input/output devices and processing.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audio/devices` | Enumerate audio devices |
| POST | `/audio/start` | Start audio processing |
| POST | `/audio/stop` | Stop audio processing |
| GET | `/audio/status` | Check audio processing status |
| GET | `/audio/tracks` | Get audio tracks |
| POST | `/audio/tracks` | Create audio track |
| DELETE | `/audio/tracks/{id}` | Remove audio track |
| GET | `/audio/master-volume` | Get master volume |
| PUT | `/audio/master-volume` | Set master volume |
| POST | `/audio/sync` | Sync audio with video |
| GET | `/audio/performance` | Get audio performance stats |

#### Example: Create Audio Track

```typescript
await invoke('create_audio_track', {
  name: 'Microphone',
  device_id: 'mic-1'
});

await invoke('set_master_volume', { volume: 0.8 });
```

### GPU API

The GPU API manages GPU operations, textures, and effects.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/gpu/info` | Get GPU information |
| GET | `/gpu/memory-usage` | Get GPU memory usage |
| POST | `/gpu/texture` | Create GPU texture |
| GET | `/gpu/texture/{id}` | Get texture info |
| DELETE | `/gpu/texture/{id}` | Delete texture |

#### Example: Get GPU Info

```typescript
const gpuInfo = await invoke<GpuInfo>('get_gpu_info');
console.log(`GPU: ${gpuInfo.name} (${gpuInfo.vendor})`);
console.log(`VRAM: ${gpuInfo.vram} MB`);
console.log(`Max Resolution: ${gpuInfo.max_resolution[0]}x${gpuInfo.max_resolution[1]}`);
```

### Encoding API

The Encoding API manages video and audio encoding.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/encoding/encoders` | Get available encoders |
| POST | `/encoding/start` | Start encoding |
| POST | `/encoding/stop` | Stop encoding |
| GET | `/encoding/status` | Get encoding status |
| GET | `/encoding/stats` | Get encoding statistics |
| POST | `/encoding/bitrate` | Get recommended bitrate |

#### Example: Start Encoding

```typescript
await invoke('start_encoding', {
  videoConfig: {
    encoder: 'NVIDIA NVENC',
    codec: 'H264',
    preset: 'Fast',
    rate_control: 'CBR',
    bitrate: 6000,
    keyframe_interval: 60
  },
  audioConfig: {
    codec: 'AAC',
    bitrate: 128,
    sample_rate: 48000,
    channels: 2
  }
});
```

### Streaming API

The Streaming API manages streaming to platforms.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/streaming/platform/{platform}` | Get platform preset |
| POST | `/streaming/start` | Start streaming |
| POST | `/streaming/stop` | Stop streaming |
| GET | `/streaming/status` | Get streaming status |
| GET | `/streaming/stats` | Get streaming statistics |
| GET | `/streaming/multistream/targets` | Get multistream targets |

#### Example: Start Streaming to Twitch

```typescript
await invoke('start_streaming', {
  config: {
    platform: await invoke('get_platform_preset', { platform: 'Twitch' }),
    protocol: 'RTMP',
    video_bitrate: 6000,
    audio_bitrate: 128,
    keyframe_interval: 60,
    enable_low_latency: true,
    enable_adaptive_bitrate: true
  }
});
```

### VTuber API

The VTuber API manages VTuber models and face tracking.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vtuber/vrm/load` | Load VRM model |
| POST | `/vtuber/live2d/load` | Load Live2D model |
| GET | `/vtuber/model-info` | Get model info |
| POST | `/vtuber/tracking/start` | Start face tracking |
| POST | `/vtuber/tracking/stop` | Stop face tracking |
| GET | `/vtuber/tracking/status` | Get tracking status |
| GET | `/vtuber/tracking/data` | Get face tracking data |

#### Example: Load VRM Model

```typescript
await invoke('load_vrm_model', {
  file_path: '/path/to/model.vrm'
});

await invoke('start_face_tracking');

const trackingData = await invoke<FaceTrackingData>('get_face_tracking_data');
console.log('Head rotation:', trackingData.head_rotation);
console.log('Confidence:', trackingData.confidence);
```

### Cloud API

The Cloud API manages cloud services integration.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cloud/connect` | Connect to cloud |
| POST | `/cloud/disconnect` | Disconnect from cloud |
| GET | `/cloud/status` | Get cloud connection status |
| GET | `/cloud/stats` | Get cloud statistics |
| POST | `/cloud/vod/start` | Start VOD recording |
| POST | `/cloud/vod/stop` | Stop VOD recording |
| GET | `/cloud/vod/status` | Get VOD status |

#### Example: Connect to Cloud

```typescript
await invoke('connect_cloud', {
  provider: 'AWS',
  api_key: 'your-api-key',
  api_secret: 'your-api-secret'
});

await invoke('start_vod_recording');
```

### Analytics API

The Analytics API provides performance and viewer analytics.

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | Get dashboard data |
| GET | `/analytics/performance` | Get performance metrics |
| GET | `/analytics/viewers` | Get viewer analytics |

#### Example: Get Performance Metrics

```typescript
const metrics = await invoke<PerformanceMetrics>('get_performance_metrics');
console.log('CPU efficiency:', metrics.cpu_efficiency);
console.log('Stream health:', metrics.stream_health_score);
console.log('Frame time:', metrics.frame_time, 'ms');
```

## Data Types

### CaptureSourceInfo

```typescript
interface CaptureSourceInfo {
  id: string;
  name: string;
  type: 'screen' | 'window' | 'camera';
}
```

### AudioTrack

```typescript
interface AudioTrack {
  id: number;
  name: string;
  device_id: string;
  volume: number; // 0.0-1.0
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
}
```

### VideoEncodingConfig

```typescript
interface VideoEncodingConfig {
  encoder: string;
  codec: 'H264' | 'H265' | 'AV1';
  preset: 'Ultrafast' | 'Superfast' | 'Veryfast' | 'Faster' | 'Fast' | 
          'Medium' | 'Slow' | 'Slower' | 'Veryslow' | 'Placebo';
  rate_control: 'CBR' | 'VBR' | 'CQP' | 'CRF';
  bitrate: number; // kbps
  keyframe_interval: number;
  // ... more properties
}
```

### FaceTrackingData

```typescript
interface FaceTrackingData {
  head_rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  head_position: {
    x: number;
    y: number;
    z: number;
  };
  eye_gaze: {
    x: number;
    y: number;
  };
  mouth_open: number; // 0.0-1.0
  confidence: number; // 0.0-1.0
}
```

## Examples

### Complete Streaming Setup

```typescript
async function startStreaming() {
  // 1. Initialize GPU
  const gpuInfo = await invoke<GpuInfo>('get_gpu_info');
  console.log(`Using GPU: ${gpuInfo.name}`);

  // 2. Start capture
  const sources = await invoke<CaptureSourceInfo[]>('enumerate_capture_sources');
  const screenSource = sources.find(s => s.type === 'screen');
  
  if (screenSource) {
    await invoke('start_capture', {
      source: {
        id: screenSource.id,
        name: screenSource.name,
        type: 'screen',
        active: true
      }
    });
  }

  // 3. Start audio
  await invoke('start_audio_processing');
  await invoke('create_audio_track', {
    name: 'Microphone',
    device_id: 'mic-1'
  });

  // 4. Start encoding
  await invoke('start_encoding', {
    videoConfig: {
      encoder: 'NVIDIA NVENC',
      codec: 'H264',
      preset: 'Fast',
      rate_control: 'CBR',
      bitrate: 6000,
      keyframe_interval: 60
    },
    audioConfig: {
      codec: 'AAC',
      bitrate: 128,
      sample_rate: 48000,
      channels: 2
    }
  });

  // 5. Start streaming
  const platformConfig = await invoke('get_platform_preset', { platform: 'Twitch' });
  await invoke('start_streaming', {
    config: {
      platform: platformConfig,
      protocol: 'RTMP',
      video_bitrate: 6000,
      audio_bitrate: 128,
      keyframe_interval: 60,
      enable_low_latency: true,
      enable_adaptive_bitrate: true
    }
  });

  console.log('Streaming started!');
}
```

### VTuber Setup

```typescript
async function setupVTuber() {
  // Load VRM model
  await invoke('load_vrm_model', {
    file_path: '/path/to/model.vrm'
  });

  const modelInfo = await invoke<ModelInfo>('get_model_info');
  console.log(`Loaded model: ${modelInfo.name}`);

  // Start face tracking
  await invoke('start_face_tracking');

  // Monitor tracking
  setInterval(async () => {
    const trackingData = await invoke<FaceTrackingData>('get_face_tracking_data');
    console.log('Confidence:', trackingData.confidence);
    console.log('Head position:', trackingData.head_position);
  }, 1000);
}
```

## Rate Limiting

No rate limiting for local IPC calls. API can be called as frequently as needed.

## Support

For more information or issues, visit:
- GitHub: https://github.com/vantisCorp/V-Streaming
- Documentation: [OpenAPI Spec](./api/openapi.yaml)