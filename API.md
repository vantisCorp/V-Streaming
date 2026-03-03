# V-Streaming API Documentation

This document provides comprehensive documentation for all Tauri commands available in V-Streaming.

## Table of Contents

- [GPU Commands](#gpu-commands)
- [Capture Commands](#capture-commands)
- [Audio Commands](#audio-commands)
- [Composition Commands](#composition-commands)
- [VTuber Commands](#vtuber-commands)
- [Encoding Commands](#encoding-commands)
- [Streaming Commands](#streaming-commands)
- [Cloud Commands](#cloud-commands)
- [Multichat Commands](#multichat-commands)
- [WebRTC Commands](#webrtc-commands)
- [Interaction Commands](#interaction-commands)
- [AI Highlight Commands](#ai-highlight-commands)
- [Social Media Commands](#social-media-commands)
- [Game State Commands](#game-state-commands)
- [Live Captions Commands](#live-captions-commands)
- [Translation Commands](#translation-commands)
- [AI Coach Commands](#ai-coach-commands)
- [Tip Ecosystem Commands](#tip-ecosystem-commands)
- [Sponsor Marketplace Commands](#sponsor-marketplace-commands)
- [Smart Home Commands](#smart-home-commands)
- [Telemetry Commands](#telemetry-commands)
- [Performance Commands](#performance-commands)
- [Business Commands](#business-commands)
- [UI Commands](#ui-commands)
- [Onboarding Commands](#onboarding-commands)

---

## GPU Commands

### `get_gpu_info`
Retrieves information about the detected GPU.

**Parameters:** None

**Returns:**
```typescript
{
  name: string;       // GPU name (e.g., "NVIDIA GeForce RTX 4090")
  vendor: string;     // Vendor name (NVIDIA, AMD, Intel)
  vram: number;       // VRAM in megabytes
  features: string[]; // Supported features
}
```

### `initialize_gpu`
Initializes the GPU context for rendering operations.

**Parameters:** None

**Returns:** `boolean` - True if initialization successful

### `create_texture`
Creates a new GPU texture.

**Parameters:**
```typescript
{
  width: number;
  height: number;
  format: string; // "RGBA8", "BGRA8", "R8", "R16F", "R32F", "RG16F", "RGBA16F", "RGBA32F"
}
```

**Returns:** `string` - Texture ID

### `delete_texture`
Deletes a GPU texture.

**Parameters:** `texture_id: string`

**Returns:** `boolean`

### `hdr_to_sdr`
Converts HDR content to SDR using specified tonemapping.

**Parameters:**
```typescript
{
  source_texture_id: string;
  method: "Reinhard" | "ACES" | "Filmic";
  max_luminance?: number;
}
```

**Returns:** `string` - Output texture ID

### `apply_color_grading`
Applies color grading to a texture.

**Parameters:**
```typescript
{
  texture_id: string;
  grading: {
    temperature?: number;  // -100 to 100
    tint?: number;         // -100 to 100
    exposure?: number;     // -3.0 to 3.0
    contrast?: number;     // -100 to 100
    highlights?: number;   // -100 to 100
    shadows?: number;      // -100 to 100
    saturation?: number;   // -100 to 100
    vibrance?: number;     // -100 to 100
  }
}
```

**Returns:** `boolean`

---

## Capture Commands

### `enumerate_capture_sources`
Enumerates all available capture sources.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  source_type: "Screen" | "Window" | "Game" | "CaptureCard" | "Webcam";
  is_available: boolean;
  resolution?: { width: number; height: number };
  fps?: number;
}>
```

### `start_capture`
Starts capturing from a specific source.

**Parameters:**
```typescript
{
  source_id: string;
  config?: {
    resolution?: { width: number; height: number };
    fps?: number;
    format?: string;
  }
}
```

**Returns:** `boolean`

### `stop_capture`
Stops all active captures.

**Parameters:** None

**Returns:** `boolean`

### `get_capture_performance_stats`
Returns capture performance statistics.

**Parameters:** None

**Returns:**
```typescript
{
  fps: number;
  frame_time_ms: number;
  dropped_frames: number;
  cpu_usage: number;
  gpu_usage: number;
}
```

---

## Audio Commands

### `enumerate_audio_devices`
Enumerates all available audio devices.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  device_type: "Input" | "Output" | "Application";
  is_default: boolean;
  channels: number;
  sample_rate: number;
}>
```

### `create_audio_track`
Creates a new audio track for mixing.

**Parameters:**
```typescript
{
  name: string;
  source_id?: string;
  volume?: number;  // 0.0 to 1.0
  pan?: number;     // -1.0 to 1.0
}
```

**Returns:** `string` - Track ID

### `remove_audio_track`
Removes an audio track.

**Parameters:** `track_id: string`

**Returns:** `boolean`

### `update_audio_track`
Updates audio track settings.

**Parameters:**
```typescript
{
  track_id: string;
  settings: {
    volume?: number;
    muted?: boolean;
    solo?: boolean;
    pan?: number;
  }
}
```

**Returns:** `boolean`

### `apply_audio_effect`
Applies an audio effect to a track.

**Parameters:**
```typescript
{
  track_id: string;
  effect: {
    effect_type: "NoiseGate" | "Compressor" | "Equalizer" | "Reverb" | "VoiceChanger";
    params: Record<string, number | string | boolean>;
  }
}
```

**Returns:** `boolean`

---

## Composition Commands

### `create_scene`
Creates a new scene.

**Parameters:**
```typescript
{
  name: string;
  resolution?: { width: number; height: number };
}
```

**Returns:** `string` - Scene ID

### `delete_scene`
Deletes a scene.

**Parameters:** `scene_id: string`

**Returns:** `boolean`

### `get_scenes`
Returns all scenes.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  name: string;
  layers: Layer[];
  active: boolean;
  resolution: { width: number; height: number };
}>
```

### `add_layer`
Adds a layer to a scene.

**Parameters:**
```typescript
{
  scene_id: string;
  layer: {
    name: string;
    source_id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    z_index: number;
    visible: boolean;
    blend_mode?: string;
  }
}
```

**Returns:** `string` - Layer ID

### `set_layer_blend_mode`
Sets the blend mode for a layer.

**Parameters:**
```typescript
{
  scene_id: string;
  layer_id: string;
  blend_mode: "Normal" | "Multiply" | "Screen" | "Overlay" | "Darken" | "Lighten" | 
              "ColorDodge" | "ColorBurn" | "HardLight" | "SoftLight" | "Difference" |
              "Exclusion" | "Hue" | "Saturation" | "Color" | "Luminosity";
}
```

**Returns:** `boolean`

---

## VTuber Commands

### `load_vrm_model`
Loads a VRM avatar model.

**Parameters:** `model_path: string`

**Returns:**
```typescript
{
  model_id: string;
  name: string;
  blend_shapes: string[];
  bones: string[];
}
```

### `load_live2d_model`
Loads a Live2D model.

**Parameters:** `model_path: string`

**Returns:**
```typescript
{
  model_id: string;
  name: string;
  expressions: string[];
  motions: string[];
}
```

### `start_face_tracking`
Starts face tracking using webcam.

**Parameters:**
```typescript
{
  camera_id?: string;
  confidence_threshold?: number;
}
```

**Returns:** `boolean`

### `get_face_tracking_data`
Returns current face tracking data.

**Parameters:** None

**Returns:**
```typescript
{
  head_rotation: { pitch: number; yaw: number; roll: number };
  head_position: { x: number; y: number; z: number };
  eye_gaze: { left: { x: number; y: number }; right: { x: number; y: number } };
  mouth: {
    opening: number;
    shape: "Neutral" | "A" | "I" | "U" | "E" | "O" | "Smile" | "Frown";
  };
  eyebrows: { left: number; right: number };
  blink: { left: boolean; right: boolean };
  confidence: number;
}
```

---

## Encoding Commands

### `get_encoding_config`
Returns current encoding configuration.

**Parameters:** None

**Returns:**
```typescript
{
  encoder: "NVENC" | "AMF" | "QuickSync" | "Software" | "Auto";
  video_codec: "H264" | "H265" | "AV1";
  audio_codec: "AAC" | "Opus" | "MP3";
  preset: string;
  rate_control: "CBR" | "VBR" | "CQP" | "CRF";
  bitrate: number;
  keyframe_interval: number;
}
```

### `set_encoding_config`
Updates encoding configuration.

**Parameters:**
```typescript
{
  encoder?: string;
  video_codec?: string;
  audio_codec?: string;
  preset?: string;
  rate_control?: string;
  bitrate?: number;
  keyframe_interval?: number;
}
```

**Returns:** `boolean`

### `detect_hardware_encoders`
Detects available hardware encoders.

**Parameters:** None

**Returns:**
```typescript
Array<{
  encoder_type: string;
  name: string;
  supported_codecs: string[];
  is_available: boolean;
}>
```

---

## Streaming Commands

### `start_streaming`
Starts streaming to configured platforms.

**Parameters:** None

**Returns:** `boolean`

### `stop_streaming`
Stops streaming.

**Parameters:** None

**Returns:** `boolean`

### `get_streaming_config`
Returns streaming configuration.

**Parameters:** None

**Returns:**
```typescript
{
  protocol: "RTMP" | "RTMPS" | "SRT" | "WebRTC" | "HLS" | "DASH";
  server_url: string;
  stream_key: string;
  platform_preset?: string;
}
```

### `set_streaming_config`
Updates streaming configuration.

**Parameters:**
```typescript
{
  protocol?: string;
  server_url: string;
  stream_key: string;
  platform_preset?: "Twitch" | "YouTube" | "Kick" | "Facebook" | "TikTok" | "Trovo" | "DLive";
}
```

**Returns:** `boolean`

### `get_streaming_stats`
Returns streaming statistics.

**Parameters:** None

**Returns:**
```typescript
{
  is_live: boolean;
  duration_seconds: number;
  current_bitrate: number;
  fps: number;
  total_bytes_sent: number;
  reconnect_count: number;
}
```

### `add_multistream_target`
Adds a multistreaming target.

**Parameters:**
```typescript
{
  platform: string;
  server_url: string;
  stream_key: string;
}
```

**Returns:** `string` - Target ID

---

## Cloud Commands

### `connect_cloud_provider`
Connects to a cloud service provider.

**Parameters:**
```typescript
{
  provider: "Custom" | "AWS" | "GoogleCloud" | "Azure" | "Restream" | "Castr" | "Streamlabs";
  api_key: string;
  api_secret?: string;
}
```

**Returns:** `boolean`

### `start_vod_recording`
Starts VOD recording.

**Parameters:**
```typescript
{
  format?: "MP4" | "MKV" | "MOV" | "FLV";
  quality?: "Original" | "High" | "Medium" | "Low";
  auto_upload?: boolean;
}
```

**Returns:** `string` - Recording ID

### `get_vod_recordings`
Returns list of VOD recordings.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  filename: string;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
  status: "Recording" | "Completed" | "Uploading" | "Uploaded" | "Failed";
}>
```

---

## Multichat Commands

### `connect_chat_platform`
Connects to a chat platform.

**Parameters:**
```typescript
{
  platform: "Twitch" | "YouTube" | "Kick" | "Facebook" | "TikTok" | "Trovo" | "DLive";
  credentials: {
    oauth_token?: string;
    channel_id?: string;
    username?: string;
  };
}
```

**Returns:** `boolean`

### `disconnect_chat_platform`
Disconnects from a chat platform.

**Parameters:** `platform: string`

**Returns:** `boolean`

### `get_chat_messages`
Returns recent chat messages.

**Parameters:** 
```typescript
{
  platform?: string;
  limit?: number;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  platform: string;
  user: {
    id: string;
    name: string;
    display_name: string;
    role: "Viewer" | "Subscriber" | "VIP" | "Moderator" | "Owner";
  };
  content: string;
  timestamp: string;
  emotes: Array<{ name: string; url: string }>;
  badges: string[];
}>
```

### `send_chat_message`
Sends a message to connected platforms.

**Parameters:**
```typescript
{
  message: string;
  platforms?: string[];
}
```

**Returns:** `boolean`

---

## WebRTC Commands

### `create_webrtc_room`
Creates a WebRTC room for co-streaming.

**Parameters:** None

**Returns:**
```typescript
{
  room_id: string;
  invite_url: string;
}
```

### `join_webrtc_room`
Joins an existing WebRTC room.

**Parameters:** `room_id: string`

**Returns:** `boolean`

### `get_webrtc_peers`
Returns connected peers.

**Parameters:** None

**Returns:**
```typescript
Array<{
  peer_id: string;
  display_name: string;
  audio_enabled: boolean;
  video_enabled: boolean;
  volume: number;
}>
```

---

## Interaction Commands

### `create_mini_game`
Creates a new mini-game.

**Parameters:**
```typescript
{
  game_type: "Trivia" | "Poll" | "Prediction" | "Bingo" | "SlotMachine" | 
             "Roulette" | "RockPaperScissors" | "GuessNumber" | "WordScramble";
  config: Record<string, unknown>;
}
```

**Returns:** `string` - Game ID

### `start_mini_game`
Starts a mini-game.

**Parameters:** `game_id: string`

**Returns:** `boolean`

### `get_mini_game_results`
Returns results of a completed mini-game.

**Parameters:** `game_id: string`

**Returns:**
```typescript
{
  game_id: string;
  game_type: string;
  winner?: string;
  participants: number;
  results: Record<string, unknown>;
}
```

---

## AI Highlight Commands

### `start_highlight_detection`
Starts AI-powered highlight detection.

**Parameters:**
```typescript
{
  sensitivity?: "Low" | "Medium" | "High";
  auto_save?: boolean;
  highlight_types?: string[];
}
```

**Returns:** `boolean`

### `get_highlights`
Returns detected highlights.

**Parameters:** None

**Returns:**
```typescript
Array<{
  id: string;
  timestamp: string;
  duration_seconds: number;
  highlight_type: string;
  confidence: number;
  thumbnail_url?: string;
  clip_path?: string;
}>
```

### `create_clip_from_highlight`
Creates a video clip from a highlight.

**Parameters:** `highlight_id: string`

**Returns:** `string` - Clip path

---

## Live Captions Commands

### `start_live_captions`
Starts live caption generation.

**Parameters:**
```typescript
{
  language?: string;
  model_size?: "Tiny" | "Base" | "Small" | "Medium" | "Large";
  show_on_stream?: boolean;
}
```

**Returns:** `boolean`

### `get_captions`
Returns current captions.

**Parameters:** None

**Returns:**
```typescript
{
  text: string;
  language: string;
  confidence: number;
  timestamp: string;
}
```

---

## Translation Commands

### `set_translation_config`
Configures real-time translation.

**Parameters:**
```typescript
{
  source_language: string;
  target_language: string;
  service: "Google" | "DeepL" | "Azure" | "Amazon" | "Custom";
  translate_captions?: boolean;
  translate_chat?: boolean;
}
```

**Returns:** `boolean`

### `translate_text`
Translates text using configured service.

**Parameters:**
```typescript
{
  text: string;
  target_language?: string;
}
```

**Returns:**
```typescript
{
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
}
```

---

## Tip Ecosystem Commands

### `get_tip_config`
Returns tip configuration.

**Parameters:** None

**Returns:**
```typescript
{
  enabled: boolean;
  accepted_currencies: string[];
  payment_methods: string[];
  minimum_amount: number;
  goal?: {
    id: string;
    name: string;
    current: number;
    target: number;
  };
}
```

### `get_tips`
Returns received tips.

**Parameters:** 
```typescript
{
  limit?: number;
  since?: string;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  amount: number;
  currency: string;
  from_user: string;
  message: string;
  timestamp: string;
}>
```

---

## Business Commands

### `get_subscription_info`
Returns current subscription information.

**Parameters:** None

**Returns:**
```typescript
{
  tier: "Free" | "Pro" | "Enterprise";
  status: "Active" | "Expired" | "Cancelled";
  expires_at?: string;
  features: string[];
  usage: {
    streams_this_month: number;
    max_streams: number;
    viewers_last_stream: number;
    max_viewers: number;
  };
}
```

### `upgrade_subscription`
Upgrades subscription to a higher tier.

**Parameters:**
```typescript
{
  tier: "Pro" | "Enterprise";
  billing_cycle: "Monthly" | "Yearly";
}
```

**Returns:** `string` - Checkout URL

---

## Error Handling

All commands return errors in the following format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `NOT_INITIALIZED` | Engine not initialized |
| `INVALID_PARAMETER` | Invalid or missing parameter |
| `NOT_FOUND` | Resource not found |
| `ALREADY_EXISTS` | Resource already exists |
| `PERMISSION_DENIED` | Permission denied |
| `NOT_SUPPORTED` | Feature not supported |
| `INTERNAL_ERROR` | Internal error occurred |

---

## Usage Example (TypeScript)

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Start streaming
async function startStream() {
  try {
    const isLive = await invoke('start_streaming');
    console.log('Stream started:', isLive);
  } catch (error) {
    console.error('Failed to start stream:', error);
  }
}

// Get GPU info
async function getGpuInfo() {
  try {
    const gpuInfo = await invoke('get_gpu_info');
    console.log('GPU:', gpuInfo.name, 'VRAM:', gpuInfo.vram, 'MB');
    return gpuInfo;
  } catch (error) {
    console.error('Failed to get GPU info:', error);
  }
}

// Create scene with layers
async function createSceneWithLayers() {
  try {
    const sceneId = await invoke('create_scene', { name: 'Game Scene' });
    await invoke('add_layer', {
      scene_id: sceneId,
      layer: {
        name: 'Game Capture',
        source_id: 'game-1',
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        z_index: 0,
        visible: true,
      }
    });
    return sceneId;
  } catch (error) {
    console.error('Failed to create scene:', error);
  }
}
```

---

## Rate Limits

| Command Category | Rate Limit |
|------------------|------------|
| Streaming | 10 requests/second |
| Chat | 20 requests/second |
| AI Features | 5 requests/second |
| All Others | 50 requests/second |

---

## Version

API Version: 1.0.0  
Minimum App Version: 1.0.0