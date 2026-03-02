import React, { useState, useEffect } from 'react';
import './App.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Capture types
interface CaptureSource {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

interface CaptureStats {
  fps: number;
  bitrate: number;
  dropped_frames: number;
  cpu_usage: number;
  gpu_usage: number;
}

// Audio types
interface AudioTrack {
  id: number;
  name: string;
  device_id: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

// GPU types
interface GpuInfo {
  name: string;
  vendor: string;
  vram: number;
  supported_features: string[];
}

// Composition types
interface Scene {
  id: string;
  name: string;
  active: boolean;
}

interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

// VTuber types
interface ModelInfo {
  name: string;
  type: string;
  file_path: string;
}

interface FaceTrackingData {
  head_rotation: { pitch: number; yaw: number; roll: number };
  head_position: { x: number; y: number; z: number };
  eye_gaze: { x: number; y: number };
  mouth_open: number;
  confidence: number;
}

// Encoding types
interface VideoEncodingConfig {
  encoder: string;
  codec: string;
  preset: string;
  rate_control: string;
  bitrate: number;
  max_bitrate: number;
  keyframe_interval: number;
  profile: string;
  level: string;
  b_frames: number;
  reference_frames: number;
  gop_size: number;
  multipass: boolean;
  lookahead: boolean;
  psycho_visual: boolean;
}

interface AudioEncodingConfig {
  codec: string;
  bitrate: number;
  sample_rate: number;
  channels: number;
  format: string;
}

interface EncodingStats {
  fps: number;
  bitrate: number;
  cpu_usage: number;
  gpu_usage: number;
  encoded_frames: number;
  dropped_frames: number;
  average_frame_time: number;
  encoding_time: number;
}

interface EncoderInfo {
  name: string;
  vendor: string;
  supported_codecs: string[];
  max_resolution: [number, number];
  max_fps: number;
  hardware_accelerated: boolean;
}

// Streaming types
interface StreamingPlatformConfig {
  platform: string;
  name: string;
  rtmp_url: string;
  stream_key: string;
  backup_url: string | null;
  max_bitrate: number;
  recommended_bitrate: number;
  supported_codecs: string[];
  supports_srt: boolean;
}

interface StreamingConfig {
  platform: StreamingPlatformConfig;
  protocol: string;
  srt_config: any;
  video_bitrate: number;
  audio_bitrate: number;
  keyframe_interval: number;
  enable_low_latency: boolean;
  enable_adaptive_bitrate: boolean;
}

interface StreamingStats {
  is_streaming: boolean;
  duration: number;
  bytes_sent: number;
  bitrate: number;
  fps: number;
  dropped_frames: number;
  total_frames: number;
  cpu_usage: number;
  gpu_usage: number;
  network_latency: number;
  buffer_health: number;
  reconnect_count: number;
}

interface MultistreamTarget {
  id: string;
  name: string;
  platform: string;
  rtmp_url: string;
  stream_key: string;
  enabled: boolean;
  status: string;
}

// Cloud types
interface CloudAuthConfig {
  provider: string;
  api_key: string;
  api_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
}

interface MultistreamingConfig {
  enabled: boolean;
  provider: string;
  targets: MultistreamTarget[];
  adaptive_bitrate: boolean;
  fallback_enabled: boolean;
  max_concurrent_streams: number;
}

interface VODRecordingConfig {
  enabled: boolean;
  provider: string;
  storage_location: string;
  format: string;
  quality: string;
  auto_upload: boolean;
  local_backup: boolean;
  local_path: string | null;
  max_storage_gb: number | null;
}

interface VODRecordingStatus {
  is_recording: boolean;
  duration: number;
  file_size: number;
  file_path: string | null;
  upload_progress: number;
  upload_status: string;
}

interface CloudStats {
  connected: boolean;
  provider: string;
  uptime: number;
  bytes_transferred: number;
  active_streams: number;
  recordings_count: number;
  storage_used_gb: number;
  api_calls_count: number;
}

// UI types
interface InterfaceMode {
  mode: 'Simple' | 'Expert';
}

interface Theme {
  theme: 'Light' | 'Dark' | 'Auto';
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  // State
  const [activeTab, setActiveTab] = useState('Capture');
  const [interfaceMode, setInterfaceMode] = useState<'Simple' | 'Expert'>('Simple');
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'Auto'>('Dark');

  // Capture state
  const [captureSources, setCaptureSources] = useState<CaptureSource[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStats, setCaptureStats] = useState<CaptureStats>({
    fps: 0,
    bitrate: 0,
    dropped_frames: 0,
    cpu_usage: 0,
    gpu_usage: 0,
  });

  // Audio state
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [masterVolume, setMasterVolume] = useState(100);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);

  // GPU state
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null);

  // Composition state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);

  // VTuber state
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isFaceTrackingActive, setIsFaceTrackingActive] = useState(false);
  const [faceTrackingData, setFaceTrackingData] = useState<FaceTrackingData>({
    head_rotation: { pitch: 0, yaw: 0, roll: 0 },
    head_position: { x: 0, y: 0, z: 0 },
    eye_gaze: { x: 0, y: 0 },
    mouth_open: 0,
    confidence: 0,
  });

  // Encoding state
  const [videoConfig, setVideoConfig] = useState<VideoEncodingConfig>({
    encoder: 'Auto',
    codec: 'H264',
    preset: 'Fast',
    rate_control: 'CBR',
    bitrate: 6000,
    max_bitrate: 8000,
    keyframe_interval: 60,
    profile: 'high',
    level: '4.1',
    b_frames: 2,
    reference_frames: 4,
    gop_size: 60,
    multipass: false,
    lookahead: true,
    psycho_visual: true,
  });
  const [audioConfig, setAudioConfig] = useState<AudioEncodingConfig>({
    codec: 'AAC',
    bitrate: 128,
    sample_rate: 48000,
    channels: 2,
    format: 'AAC',
  });
  const [encodingStats, setEncodingStats] = useState<EncodingStats>({
    fps: 0,
    bitrate: 0,
    cpu_usage: 0,
    gpu_usage: 0,
    encoded_frames: 0,
    dropped_frames: 0,
    average_frame_time: 0,
    encoding_time: 0,
  });
  const [isEncodingActive, setIsEncodingActive] = useState(false);
  const [availableEncoders, setAvailableEncoders] = useState<EncoderInfo[]>([]);

  // Streaming state
  const [streamingConfig, setStreamingConfig] = useState<StreamingConfig>({
    platform: {
      platform: 'Twitch',
      name: 'Twitch',
      rtmp_url: 'rtmp://live.twitch.tv/app',
      stream_key: '',
      backup_url: null,
      max_bitrate: 8000,
      recommended_bitrate: 6000,
      supported_codecs: ['H264', 'H265'],
      supports_srt: false,
    },
    protocol: 'RTMP',
    srt_config: null,
    video_bitrate: 6000,
    audio_bitrate: 128,
    keyframe_interval: 60,
    enable_low_latency: false,
    enable_adaptive_bitrate: false,
  });
  const [streamingStats, setStreamingStats] = useState<StreamingStats>({
    is_streaming: false,
    duration: 0,
    bytes_sent: 0,
    bitrate: 0,
    fps: 0,
    dropped_frames: 0,
    total_frames: 0,
    cpu_usage: 0,
    gpu_usage: 0,
    network_latency: 0,
    buffer_health: 100,
    reconnect_count: 0,
  });
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [multistreamTargets, setMultistreamTargets] = useState<MultistreamTarget[]>([]);
  const [multistreamEnabled, setMultistreamEnabled] = useState(false);

  // Cloud state
  const [cloudConnected, setCloudConnected] = useState(false);
  const [cloudStats, setCloudStats] = useState<CloudStats>({
    connected: false,
    provider: 'Custom',
    uptime: 0,
    bytes_transferred: 0,
    active_streams: 0,
    recordings_count: 0,
    storage_used_gb: 0,
    api_calls_count: 0,
  });
  const [multistreamingConfig, setMultistreamingConfig] = useState<MultistreamingConfig>({
    enabled: false,
    provider: 'Custom',
    targets: [],
    adaptive_bitrate: true,
    fallback_enabled: true,
    max_concurrent_streams: 5,
  });
  const [vodConfig, setVodConfig] = useState<VODRecordingConfig>({
    enabled: false,
    provider: 'Custom',
    storage_location: '',
    format: 'MP4',
    quality: 'Original',
    auto_upload: false,
    local_backup: true,
    local_path: null,
    max_storage_gb: null,
  });
  const [vodStatus, setVodStatus] = useState<VODRecordingStatus>({
    is_recording: false,
    duration: 0,
    file_size: 0,
    file_path: null,
    upload_progress: 0,
    upload_status: 'Disconnected',
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Initialize GPU info
    const initGpu = async () => {
      try {
        const info = await (window as any).__TAURI__.invoke('get_gpu_info');
        setGpuInfo(info);
      } catch (error) {
        console.error('Failed to get GPU info:', error);
      }
    };
    initGpu();

    // Initialize available encoders
    const initEncoders = async () => {
      try {
        const encoders = await (window as any).__TAURI__.invoke('get_available_encoders');
        setAvailableEncoders(encoders);
      } catch (error) {
        console.error('Failed to get available encoders:', error);
      }
    };
    initEncoders();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartCapture = async () => {
    try {
      await (window as any).__TAURI__.invoke('start_capture', {
        source: { id: 'screen', name: 'Screen', type: 'screen' },
      });
      setIsCapturing(true);
    } catch (error) {
      console.error('Failed to start capture:', error);
    }
  };

  const handleStopCapture = async () => {
    try {
      await (window as any).__TAURI__.invoke('stop_capture');
      setIsCapturing(false);
    } catch (error) {
      console.error('Failed to stop capture:', error);
    }
  };

  const handleStartEncoding = async () => {
    try {
      await (window as any).__TAURI__.invoke('start_encoding', {
        videoConfig,
        audioConfig,
      });
      setIsEncodingActive(true);
    } catch (error) {
      console.error('Failed to start encoding:', error);
    }
  };

  const handleStopEncoding = async () => {
    try {
      await (window as any).__TAURI__.invoke('stop_encoding');
      setIsEncodingActive(false);
    } catch (error) {
      console.error('Failed to stop encoding:', error);
    }
  };

  const handleStartStreaming = async () => {
    try {
      await (window as any).__TAURI__.invoke('start_streaming', {
        config: streamingConfig,
      });
      setIsStreamingActive(true);
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  };

  const handleStopStreaming = async () => {
    try {
      await (window as any).__TAURI__.invoke('stop_streaming');
      setIsStreamingActive(false);
    } catch (error) {
      console.error('Failed to stop streaming:', error);
    }
  };

  const handleStartVodRecording = async () => {
    try {
      await (window as any).__TAURI__.invoke('start_vod_recording');
      setVodStatus({ ...vodStatus, is_recording: true });
    } catch (error) {
      console.error('Failed to start VOD recording:', error);
    }
  };

  const handleStopVodRecording = async () => {
    try {
      await (window as any).__TAURI__.invoke('stop_vod_recording');
      setVodStatus({ ...vodStatus, is_recording: false });
    } catch (error) {
      console.error('Failed to stop VOD recording:', error);
    }
  };

  const handlePlatformChange = async (platform: string) => {
    try {
      const preset = await (window as any).__TAURI__.invoke('get_platform_preset', { platform });
      setStreamingConfig({ ...streamingConfig, platform: preset });
    } catch (error) {
      console.error('Failed to get platform preset:', error);
    }
  };

  const handleGetRecommendedBitrate = async () => {
    try {
      const bitrate = await (window as any).__TAURI__.invoke('get_recommended_bitrate', {
        width: 1920,
        height: 1080,
        fps: 60,
        codec: videoConfig.codec,
      });
      setVideoConfig({ ...videoConfig, bitrate });
    } catch (error) {
      console.error('Failed to get recommended bitrate:', error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const getTabs = () => {
    const tabs = ['Capture', 'Audio'];
    if (interfaceMode === 'Expert') {
      tabs.push('Composition', 'VTuber', 'Encoding', 'Streaming', 'Cloud');
    }
    return tabs;
  };

  return (
    <div className={`app theme-${theme.toLowerCase()}`}>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>V-Streaming</h1>
          <span className="version">v0.1.0</span>
        </div>
        <div className="header-center">
          <div className="mode-switcher">
            <button
              className={`mode-btn ${interfaceMode === 'Simple' ? 'active' : ''}`}
              onClick={() => setInterfaceMode('Simple')}
            >
              Simple
            </button>
            <button
              className={`mode-btn ${interfaceMode === 'Expert' ? 'active' : ''}`}
              onClick={() => setInterfaceMode('Expert')}
            >
              Expert
            </button>
          </div>
        </div>
        <div className="header-right">
          <div className="theme-switcher">
            <button
              className={`theme-btn ${theme === 'Light' ? 'active' : ''}`}
              onClick={() => setTheme('Light')}
            >
              ☀️
            </button>
            <button
              className={`theme-btn ${theme === 'Dark' ? 'active' : ''}`}
              onClick={() => setTheme('Dark')}
            >
              🌙
            </button>
            <button
              className={`theme-btn ${theme === 'Auto' ? 'active' : ''}`}
              onClick={() => setTheme('Auto')}
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-nav">
        {getTabs().map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Capture Tab */}
        {activeTab === 'Capture' && (
          <div className="tab-content">
            <h2>Capture Sources</h2>
            <div className="capture-controls">
              <button
                className={`btn ${isCapturing ? 'btn-danger' : 'btn-primary'}`}
                onClick={isCapturing ? handleStopCapture : handleStartCapture}
              >
                {isCapturing ? 'Stop Capture' : 'Start Capture'}
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>FPS</h3>
                <p className="stat-value">{captureStats.fps.toFixed(1)}</p>
              </div>
              <div className="stat-card">
                <h3>Bitrate</h3>
                <p className="stat-value">{captureStats.bitrate} kbps</p>
              </div>
              <div className="stat-card">
                <h3>CPU</h3>
                <p className="stat-value">{captureStats.cpu_usage.toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <h3>GPU</h3>
                <p className="stat-value">{captureStats.gpu_usage.toFixed(1)}%</p>
              </div>
            </div>
            {gpuInfo && (
              <div className="gpu-info">
                <h3>GPU Information</h3>
                <p><strong>Name:</strong> {gpuInfo.name}</p>
                <p><strong>Vendor:</strong> {gpuInfo.vendor}</p>
                <p><strong>VRAM:</strong> {gpuInfo.vram} MB</p>
              </div>
            )}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'Audio' && (
          <div className="tab-content">
            <h2>Audio Mixer</h2>
            <div className="audio-controls">
              <div className="master-volume">
                <label>Master Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                />
                <span>{masterVolume}%</span>
              </div>
            </div>
            <div className="audio-tracks">
              {audioTracks.map((track) => (
                <div key={track.id} className="audio-track">
                  <h4>{track.name}</h4>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume}
                    onChange={(e) => {
                      const newTracks = audioTracks.map((t) =>
                        t.id === track.id ? { ...t, volume: Number(e.target.value) } : t
                      );
                      setAudioTracks(newTracks);
                    }}
                  />
                  <span>{track.volume}%</span>
                  <button
                    className={`btn ${track.muted ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => {
                      const newTracks = audioTracks.map((t) =>
                        t.id === track.id ? { ...t, muted: !t.muted } : t
                      );
                      setAudioTracks(newTracks);
                    }}
                  >
                    {track.muted ? '🔇' : '🔊'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Composition Tab */}
        {activeTab === 'Composition' && (
          <div className="tab-content">
            <h2>Scene Composition</h2>
            <div className="scenes-grid">
              {scenes.map((scene) => (
                <div key={scene.id} className={`scene-card ${scene.active ? 'active' : ''}`}>
                  <h4>{scene.name}</h4>
                  <span className="status">{scene.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
            <div className="layers-list">
              <h3>Layers</h3>
              {layers.map((layer) => (
                <div key={layer.id} className="layer-item">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-type">{layer.type}</span>
                  <button
                    className={`btn ${layer.visible ? 'btn-success' : 'btn-secondary'}`}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    className={`btn ${layer.locked ? 'btn-warning' : 'btn-secondary'}`}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VTuber Tab */}
        {activeTab === 'VTuber' && (
          <div className="tab-content">
            <h2>VTubing Engine</h2>
            {modelInfo ? (
              <div className="model-info">
                <h3>Model Loaded</h3>
                <p><strong>Name:</strong> {modelInfo.name}</p>
                <p><strong>Type:</strong> {modelInfo.type}</p>
                <p><strong>File:</strong> {modelInfo.file_path}</p>
              </div>
            ) : (
              <div className="no-model">
                <p>No model loaded</p>
                <button className="btn btn-primary">Load VRM Model</button>
                <button className="btn btn-primary">Load Live2D Model</button>
              </div>
            )}
            <div className="face-tracking">
              <h3>Face Tracking</h3>
              <button
                className={`btn ${isFaceTrackingActive ? 'btn-danger' : 'btn-primary'}`}
              >
                {isFaceTrackingActive ? 'Stop Tracking' : 'Start Tracking'}
              </button>
              <div className="tracking-data">
                <p><strong>Head Rotation:</strong> P:{faceTrackingData.head_rotation.pitch.toFixed(2)} Y:{faceTrackingData.head_rotation.yaw.toFixed(2)} R:{faceTrackingData.head_rotation.roll.toFixed(2)}</p>
                <p><strong>Head Position:</strong> X:{faceTrackingData.head_position.x.toFixed(2)} Y:{faceTrackingData.head_position.y.toFixed(2)} Z:{faceTrackingData.head_position.z.toFixed(2)}</p>
                <p><strong>Mouth Open:</strong> {faceTrackingData.mouth_open.toFixed(2)}</p>
                <p><strong>Confidence:</strong> {(faceTrackingData.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Encoding Tab */}
        {activeTab === 'Encoding' && (
          <div className="tab-content">
            <h2>Encoding Settings</h2>
            <div className="encoding-controls">
              <div className="control-group">
                <label>Encoder</label>
                <select
                  value={videoConfig.encoder}
                  onChange={(e) => setVideoConfig({ ...videoConfig, encoder: e.target.value })}
                >
                  {availableEncoders.map((encoder) => (
                    <option key={encoder.name} value={encoder.name}>
                      {encoder.name} ({encoder.vendor})
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group">
                <label>Codec</label>
                <select
                  value={videoConfig.codec}
                  onChange={(e) => setVideoConfig({ ...videoConfig, codec: e.target.value })}
                >
                  <option value="H264">H.264</option>
                  <option value="H265">H.265/HEVC</option>
                  <option value="AV1">AV1</option>
                </select>
              </div>
              <div className="control-group">
                <label>Preset</label>
                <select
                  value={videoConfig.preset}
                  onChange={(e) => setVideoConfig({ ...videoConfig, preset: e.target.value })}
                >
                  <option value="Ultrafast">Ultrafast</option>
                  <option value="Superfast">Superfast</option>
                  <option value="Veryfast">Veryfast</option>
                  <option value="Faster">Faster</option>
                  <option value="Fast">Fast</option>
                  <option value="Medium">Medium</option>
                  <option value="Slow">Slow</option>
                  <option value="Slower">Slower</option>
                  <option value="Veryslow">Veryslow</option>
                  <option value="Placebo">Placebo</option>
                </select>
              </div>
              <div className="control-group">
                <label>Rate Control</label>
                <select
                  value={videoConfig.rate_control}
                  onChange={(e) => setVideoConfig({ ...videoConfig, rate_control: e.target.value })}
                >
                  <option value="CBR">CBR (Constant Bitrate)</option>
                  <option value="VBR">VBR (Variable Bitrate)</option>
                  <option value="CQP">CQP (Constant Quantization)</option>
                  <option value="CRF">CRF (Constant Rate Factor)</option>
                </select>
              </div>
              <div className="control-group">
                <label>Bitrate (kbps)</label>
                <input
                  type="number"
                  value={videoConfig.bitrate}
                  onChange={(e) => setVideoConfig({ ...videoConfig, bitrate: Number(e.target.value) })}
                />
                <button className="btn btn-secondary" onClick={handleGetRecommendedBitrate}>
                  Auto
                </button>
              </div>
              <div className="control-group">
                <label>Keyframe Interval</label>
                <input
                  type="number"
                  value={videoConfig.keyframe_interval}
                  onChange={(e) => setVideoConfig({ ...videoConfig, keyframe_interval: Number(e.target.value) })}
                />
              </div>
              <div className="control-group">
                <label>B-Frames</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={videoConfig.b_frames}
                  onChange={(e) => setVideoConfig({ ...videoConfig, b_frames: Number(e.target.value) })}
                />
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={videoConfig.lookahead}
                    onChange={(e) => setVideoConfig({ ...videoConfig, lookahead: e.target.checked })}
                  />
                  Lookahead
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={videoConfig.psycho_visual}
                    onChange={(e) => setVideoConfig({ ...videoConfig, psycho_visual: e.target.checked })}
                  />
                  Psycho-Visual Optimizations
                </label>
              </div>
            </div>
            <div className="encoding-actions">
              <button
                className={`btn ${isEncodingActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={isEncodingActive ? handleStopEncoding : handleStartEncoding}
              >
                {isEncodingActive ? 'Stop Encoding' : 'Start Encoding'}
              </button>
            </div>
            <div className="encoding-stats">
              <h3>Encoding Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>FPS</h3>
                  <p className="stat-value">{encodingStats.fps.toFixed(1)}</p>
                </div>
                <div className="stat-card">
                  <h3>Bitrate</h3>
                  <p className="stat-value">{encodingStats.bitrate} kbps</p>
                </div>
                <div className="stat-card">
                  <h3>CPU</h3>
                  <p className="stat-value">{encodingStats.cpu_usage.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>GPU</h3>
                  <p className="stat-value">{encodingStats.gpu_usage.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>Encoded Frames</h3>
                  <p className="stat-value">{encodingStats.encoded_frames}</p>
                </div>
                <div className="stat-card">
                  <h3>Dropped Frames</h3>
                  <p className="stat-value">{encodingStats.dropped_frames}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming Tab */}
        {activeTab === 'Streaming' && (
          <div className="tab-content">
            <h2>Streaming Settings</h2>
            <div className="streaming-controls">
              <div className="control-group">
                <label>Platform</label>
                <select
                  value={streamingConfig.platform.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                >
                  <option value="Twitch">Twitch</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Kick">Kick</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Trovo">Trovo</option>
                  <option value="DLive">DLive</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="control-group">
                <label>RTMP URL</label>
                <input
                  type="text"
                  value={streamingConfig.platform.rtmp_url}
                  onChange={(e) => setStreamingConfig({
                    ...streamingConfig,
                    platform: { ...streamingConfig.platform, rtmp_url: e.target.value }
                  })}
                />
              </div>
              <div className="control-group">
                <label>Stream Key</label>
                <input
                  type="password"
                  value={streamingConfig.platform.stream_key}
                  onChange={(e) => setStreamingConfig({
                    ...streamingConfig,
                    platform: { ...streamingConfig.platform, stream_key: e.target.value }
                  })}
                />
              </div>
              <div className="control-group">
                <label>Protocol</label>
                <select
                  value={streamingConfig.protocol}
                  onChange={(e) => setStreamingConfig({ ...streamingConfig, protocol: e.target.value })}
                >
                  <option value="RTMP">RTMP</option>
                  <option value="RTMPS">RTMPS</option>
                  <option value="SRT">SRT</option>
                  <option value="WebRTC">WebRTC</option>
                  <option value="HLS">HLS</option>
                  <option value="DASH">DASH</option>
                </select>
              </div>
              <div className="control-group">
                <label>Video Bitrate (kbps)</label>
                <input
                  type="number"
                  value={streamingConfig.video_bitrate}
                  onChange={(e) => setStreamingConfig({ ...streamingConfig, video_bitrate: Number(e.target.value) })}
                />
              </div>
              <div className="control-group">
                <label>Audio Bitrate (kbps)</label>
                <input
                  type="number"
                  value={streamingConfig.audio_bitrate}
                  onChange={(e) => setStreamingConfig({ ...streamingConfig, audio_bitrate: Number(e.target.value) })}
                />
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={streamingConfig.enable_low_latency}
                    onChange={(e) => setStreamingConfig({ ...streamingConfig, enable_low_latency: e.target.checked })}
                  />
                  Low Latency Mode
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={streamingConfig.enable_adaptive_bitrate}
                    onChange={(e) => setStreamingConfig({ ...streamingConfig, enable_adaptive_bitrate: e.target.checked })}
                  />
                  Adaptive Bitrate
                </label>
              </div>
            </div>
            <div className="streaming-actions">
              <button
                className={`btn ${isStreamingActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={isStreamingActive ? handleStopStreaming : handleStartStreaming}
              >
                {isStreamingActive ? 'Stop Streaming' : 'Start Streaming'}
              </button>
            </div>
            <div className="streaming-stats">
              <h3>Streaming Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Status</h3>
                  <p className="stat-value">{isStreamingActive ? 'Live' : 'Offline'}</p>
                </div>
                <div className="stat-card">
                  <h3>Duration</h3>
                  <p className="stat-value">{Math.floor(streamingStats.duration / 60)}:{(streamingStats.duration % 60).toString().padStart(2, '0')}</p>
                </div>
                <div className="stat-card">
                  <h3>Bitrate</h3>
                  <p className="stat-value">{streamingStats.bitrate} kbps</p>
                </div>
                <div className="stat-card">
                  <h3>FPS</h3>
                  <p className="stat-value">{streamingStats.fps.toFixed(1)}</p>
                </div>
                <div className="stat-card">
                  <h3>Network Latency</h3>
                  <p className="stat-value">{streamingStats.network_latency} ms</p>
                </div>
                <div className="stat-card">
                  <h3>Buffer Health</h3>
                  <p className="stat-value">{streamingStats.buffer_health.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>Dropped Frames</h3>
                  <p className="stat-value">{streamingStats.dropped_frames}</p>
                </div>
                <div className="stat-card">
                  <h3>Reconnects</h3>
                  <p className="stat-value">{streamingStats.reconnect_count}</p>
                </div>
              </div>
            </div>
            <div className="multistream-section">
              <h3>Multistreaming</h3>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={multistreamEnabled}
                    onChange={(e) => setMultistreamEnabled(e.target.checked)}
                  />
                  Enable Multistreaming
                </label>
              </div>
              {multistreamEnabled && (
                <div className="multistream-targets">
                  <button className="btn btn-primary">Add Target</button>
                  {multistreamTargets.map((target) => (
                    <div key={target.id} className="multistream-target">
                      <span>{target.name} ({target.platform})</span>
                      <span className={`status ${target.enabled ? 'enabled' : 'disabled'}`}>
                        {target.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="btn btn-secondary">Edit</button>
                      <button className="btn btn-danger">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cloud Tab */}
        {activeTab === 'Cloud' && (
          <div className="tab-content">
            <h2>Cloud Services</h2>
            <div className="cloud-connection">
              <h3>Connection Status</h3>
              <div className={`status-indicator ${cloudConnected ? 'connected' : 'disconnected'}`}>
                {cloudConnected ? 'Connected' : 'Disconnected'}
              </div>
              {!cloudConnected && (
                <button className="btn btn-primary">Connect to Cloud</button>
              )}
              {cloudConnected && (
                <button className="btn btn-danger">Disconnect</button>
              )}
            </div>
            <div className="cloud-stats">
              <h3>Cloud Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Provider</h3>
                  <p className="stat-value">{cloudStats.provider}</p>
                </div>
                <div className="stat-card">
                  <h3>Uptime</h3>
                  <p className="stat-value">{Math.floor(cloudStats.uptime / 3600)}h</p>
                </div>
                <div className="stat-card">
                  <h3>Bytes Transferred</h3>
                  <p className="stat-value">{(cloudStats.bytes_transferred / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="stat-card">
                  <h3>Active Streams</h3>
                  <p className="stat-value">{cloudStats.active_streams}</p>
                </div>
                <div className="stat-card">
                  <h3>Recordings</h3>
                  <p className="stat-value">{cloudStats.recordings_count}</p>
                </div>
                <div className="stat-card">
                  <h3>Storage Used</h3>
                  <p className="stat-value">{cloudStats.storage_used_gb.toFixed(2)} GB</p>
                </div>
              </div>
            </div>
            <div className="vod-section">
              <h3>VOD Recording</h3>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.enabled}
                    onChange={(e) => setVodConfig({ ...vodConfig, enabled: e.target.checked })}
                  />
                  Enable VOD Recording
                </label>
              </div>
              <div className="control-group">
                <label>Format</label>
                <select
                  value={vodConfig.format}
                  onChange={(e) => setVodConfig({ ...vodConfig, format: e.target.value })}
                >
                  <option value="MP4">MP4</option>
                  <option value="MKV">MKV</option>
                  <option value="MOV">MOV</option>
                  <option value="FLV">FLV</option>
                </select>
              </div>
              <div className="control-group">
                <label>Quality</label>
                <select
                  value={vodConfig.quality}
                  onChange={(e) => setVodConfig({ ...vodConfig, quality: e.target.value })}
                >
                  <option value="Original">Original</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.auto_upload}
                    onChange={(e) => setVodConfig({ ...vodConfig, auto_upload: e.target.checked })}
                  />
                  Auto Upload to Cloud
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.local_backup}
                    onChange={(e) => setVodConfig({ ...vodConfig, local_backup: e.target.checked })}
                  />
                  Keep Local Backup
                </label>
              </div>
              <div className="vod-actions">
                <button
                  className={`btn ${vodStatus.is_recording ? 'btn-danger' : 'btn-primary'}`}
                  onClick={vodStatus.is_recording ? handleStopVodRecording : handleStartVodRecording}
                >
                  {vodStatus.is_recording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>
              {vodStatus.is_recording && (
                <div className="vod-status">
                  <p><strong>Duration:</strong> {Math.floor(vodStatus.duration / 60)}:{(vodStatus.duration % 60).toString().padStart(2, '0')}</p>
                  <p><strong>File Size:</strong> {(vodStatus.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;