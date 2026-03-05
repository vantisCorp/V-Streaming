import { useState, useEffect } from 'react';
import './App.css';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { GlobalKeyboardListener } from './components/GlobalKeyboardListener';
import { HotkeySettings } from './components/HotkeySettings';
import { SceneAutomationSettings } from './components/SceneAutomationSettings';
import { CloudBackupSettings } from './components/CloudBackupSettings';
import { StreamSchedulerSettings } from './components/StreamSchedulerSettings';
import { AudioMixerSettings } from './components/AudioMixerSettings';
import ThemeSettings from './components/ThemeSettings';
import MultiPlatformSettings from './components/MultiPlatformSettings';
import AnalyticsDashboard from './components/AnalyticsDashboard';

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
  const { t } = useTranslation();
  
  // State
  const [activeTab, setActiveTab] = useState('Capture');
  const [interfaceMode, setInterfaceMode] = useState<'Simple' | 'Expert'>('Simple');
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'Auto'>('Dark');
  const [showHotkeySettings, setShowHotkeySettings] = useState(false);
  const [showSceneAutomation, setShowSceneAutomation] = useState(false);
  const [showCloudBackup, setShowCloudBackup] = useState(false);
  const [showStreamScheduler, setShowStreamScheduler] = useState(false);
  const [showAudioMixer, setShowAudioMixer] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showMultiPlatform, setShowMultiPlatform] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Capture state
  const [_captureSources, setCaptureSources] = useState<CaptureSource[]>([]);
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
    const tabs = [t('tabs.capture'), t('tabs.audio')];
    if (interfaceMode === 'Expert') {
      tabs.push(t('tabs.composition'), t('tabs.vtuber'), t('tabs.encoding'), t('tabs.streaming'), t('tabs.cloud'));
    }
    return tabs;
  };

  return (
    <div className={`app theme-${theme.toLowerCase()}`}>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>{t('app.title')}</h1>
          <span className="version">{t('app.version')}</span>
        </div>
        <div className="header-center">
          <div className="mode-switcher">
            <button
              className={`mode-btn ${interfaceMode === 'Simple' ? 'active' : ''}`}
              onClick={() => setInterfaceMode('Simple')}
            >
              {t('header.simpleMode')}
            </button>
            <button
              className={`mode-btn ${interfaceMode === 'Expert' ? 'active' : ''}`}
              onClick={() => setInterfaceMode('Expert')}
            >
              {t('header.expertMode')}
            </button>
          </div>
        </div>
        <div className="header-right">
          <LanguageSwitcher />
          <button
            onClick={() => setShowHotkeySettings(true)}
            className="theme-btn"
            title="Keyboard Shortcuts"
            style={{ marginLeft: '8px' }}
          >
            ⌨️
          </button>
          <button
            onClick={() => setShowSceneAutomation(true)}
            className="theme-btn"
            title="Scene Automation"
            style={{ marginLeft: '8px' }}
          >
            🎬
          </button>
          <button
            onClick={() => setShowCloudBackup(true)}
            className="theme-btn"
            title="Cloud Backup"
            style={{ marginLeft: '8px' }}
          >
            ☁️
          </button>
          <button
            onClick={() => setShowStreamScheduler(true)}
            className="theme-btn"
            title="Stream Scheduler"
            style={{ marginLeft: '8px' }}
          >
            📅
          </button>
          <button
            onClick={() => setShowAudioMixer(true)}
            className="theme-btn"
            title="Audio Mixer"
            style={{ marginLeft: '8px' }}
          >
            🎛️
          </button>
          <button
            onClick={() => setShowThemeSettings(true)}
            className="theme-btn"
            title="Theme Settings"
            style={{ marginLeft: '8px' }}
          >
            🎨
          </button>
          <button
            onClick={() => setShowMultiPlatform(true)}
            className="theme-btn"
            title="Multi-Platform Streaming"
            style={{ marginLeft: '8px' }}
          >
            🌐
          </button>
          <button
            onClick={() => setShowAnalytics(true)}
            className="theme-btn"
            title="Analytics Dashboard"
            style={{ marginLeft: '8px' }}
          >
            📊
          </button>
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
        {activeTab === t('tabs.capture') && (
          <div className="tab-content">
            <h2>{t('capture.title')}</h2>
            <div className="capture-controls">
              <button
                className={`btn ${isCapturing ? 'btn-danger' : 'btn-primary'}`}
                onClick={isCapturing ? handleStopCapture : handleStartCapture}
              >
                {isCapturing ? t('capture.stopCapture') : t('capture.startCapture')}
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{t('capture.fps')}</h3>
                <p className="stat-value">{captureStats.fps.toFixed(1)}</p>
              </div>
              <div className="stat-card">
                <h3>{t('capture.bitrate')}</h3>
                <p className="stat-value">{captureStats.bitrate} {t('capture.kbps')}</p>
              </div>
              <div className="stat-card">
                <h3>{t('capture.cpu')}</h3>
                <p className="stat-value">{captureStats.cpu_usage.toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <h3>{t('capture.gpu')}</h3>
                <p className="stat-value">{captureStats.gpu_usage.toFixed(1)}%</p>
              </div>
            </div>
            {gpuInfo && (
              <div className="gpu-info">
                <h3>{t('capture.gpuInfo.title')}</h3>
                <p><strong>{t('capture.gpuInfo.name')}:</strong> {gpuInfo.name}</p>
                <p><strong>{t('capture.gpuInfo.vendor')}:</strong> {gpuInfo.vendor}</p>
                <p><strong>{t('capture.gpuInfo.vram')}:</strong> {gpuInfo.vram} {t('capture.gpuInfo.mb')}</p>
              </div>
            )}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === t('tabs.audio') && (
          <div className="tab-content">
            <h2>{t('audio.title')}</h2>
            <div className="audio-controls">
              <div className="master-volume">
                <label>{t('audio.masterVolume')}</label>
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
        {activeTab === t('tabs.composition') && (
          <div className="tab-content">
            <h2>{t('composition.title')}</h2>
            <div className="scenes-grid">
              {scenes.map((scene) => (
                <div key={scene.id} className={`scene-card ${scene.active ? 'active' : ''}`}>
                  <h4>{scene.name}</h4>
                  <span className="status">{scene.active ? t('composition.active') : t('composition.inactive')}</span>
                </div>
              ))}
            </div>
            <div className="layers-list">
              <h3>{t('composition.layers')}</h3>
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
        {activeTab === t('tabs.vtuber') && (
          <div className="tab-content">
            <h2>{t('vtuber.title')}</h2>
            {modelInfo ? (
              <div className="model-info">
                <h3>{t('vtuber.modelLoaded')}</h3>
                <p><strong>{t('vtuber.model.name')}:</strong> {modelInfo.name}</p>
                <p><strong>{t('vtuber.model.type')}:</strong> {modelInfo.type}</p>
                <p><strong>{t('vtuber.model.file')}:</strong> {modelInfo.file_path}</p>
              </div>
            ) : (
              <div className="no-model">
                <p>{t('vtuber.noModel')}</p>
                <button className="btn btn-primary">{t('vtuber.loadVrm')}</button>
                <button className="btn btn-primary">{t('vtuber.loadLive2D')}</button>
              </div>
            )}
            <div className="face-tracking">
              <h3>{t('vtuber.faceTracking')}</h3>
              <button
                className={`btn ${isFaceTrackingActive ? 'btn-danger' : 'btn-primary'}`}
              >
                {isFaceTrackingActive ? t('vtuber.stopTracking') : t('vtuber.startTracking')}
              </button>
              <div className="tracking-data">
                <p><strong>{t('vtuber.tracking.headRotation')}:</strong> {t('vtuber.tracking.pitch')}:{faceTrackingData.head_rotation.pitch.toFixed(2)} {t('vtuber.tracking.yaw')}:{faceTrackingData.head_rotation.yaw.toFixed(2)} {t('vtuber.tracking.roll')}:{faceTrackingData.head_rotation.roll.toFixed(2)}</p>
                <p><strong>{t('vtuber.tracking.headPosition')}:</strong> {t('vtuber.tracking.x')}:{faceTrackingData.head_position.x.toFixed(2)} {t('vtuber.tracking.y')}:{faceTrackingData.head_position.y.toFixed(2)} {t('vtuber.tracking.z')}:{faceTrackingData.head_position.z.toFixed(2)}</p>
                <p><strong>{t('vtuber.tracking.mouthOpen')}:</strong> {faceTrackingData.mouth_open.toFixed(2)}</p>
                <p><strong>{t('vtuber.tracking.confidence')}:</strong> {(faceTrackingData.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Encoding Tab */}
        {activeTab === t('tabs.encoding') && (
          <div className="tab-content">
            <h2>{t('encoding.title')}</h2>
            <div className="encoding-controls">
              <div className="control-group">
                <label>{t('encoding.encoder')}</label>
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
                <label>{t('encoding.codec')}</label>
                <select
                  value={videoConfig.codec}
                  onChange={(e) => setVideoConfig({ ...videoConfig, codec: e.target.value })}
                >
                  <option value="H264">{t('encoding.codecs.h264')}</option>
                  <option value="H265">{t('encoding.codecs.h265')}</option>
                  <option value="AV1">{t('encoding.codecs.av1')}</option>
                </select>
              </div>
              <div className="control-group">
                <label>{t('encoding.preset')}</label>
                <select
                  value={videoConfig.preset}
                  onChange={(e) => setVideoConfig({ ...videoConfig, preset: e.target.value })}
                >
                  <option value="Ultrafast">{t('encoding.presets.ultrafast')}</option>
                  <option value="Superfast">{t('encoding.presets.superfast')}</option>
                  <option value="Veryfast">{t('encoding.presets.veryfast')}</option>
                  <option value="Faster">{t('encoding.presets.faster')}</option>
                  <option value="Fast">{t('encoding.presets.fast')}</option>
                  <option value="Medium">{t('encoding.presets.medium')}</option>
                  <option value="Slow">{t('encoding.presets.slow')}</option>
                  <option value="Slower">{t('encoding.presets.slower')}</option>
                  <option value="Veryslow">{t('encoding.presets.veryslow')}</option>
                  <option value="Placebo">{t('encoding.presets.placebo')}</option>
                </select>
              </div>
              <div className="control-group">
                <label>{t('encoding.rateControl')}</label>
                <select
                  value={videoConfig.rate_control}
                  onChange={(e) => setVideoConfig({ ...videoConfig, rate_control: e.target.value })}
                >
                  <option value="CBR">{t('encoding.rateControls.cbr')}</option>
                  <option value="VBR">{t('encoding.rateControls.vbr')}</option>
                  <option value="CQP">{t('encoding.rateControls.cqp')}</option>
                  <option value="CRF">{t('encoding.rateControls.crf')}</option>
                </select>
              </div>
              <div className="control-group">
                <label>{t('encoding.bitrate')}</label>
                <input
                  type="number"
                  value={videoConfig.bitrate}
                  onChange={(e) => setVideoConfig({ ...videoConfig, bitrate: Number(e.target.value) })}
                />
                <button className="btn btn-secondary" onClick={handleGetRecommendedBitrate}>
                  {t('common.auto')}
                </button>
              </div>
              <div className="control-group">
                <label>{t('encoding.keyframeInterval')}</label>
                <input
                  type="number"
                  value={videoConfig.keyframe_interval}
                  onChange={(e) => setVideoConfig({ ...videoConfig, keyframe_interval: Number(e.target.value) })}
                />
              </div>
              <div className="control-group">
                <label>{t('encoding.bFrames')}</label>
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
                  {t('encoding.lookahead')}
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={videoConfig.psycho_visual}
                    onChange={(e) => setVideoConfig({ ...videoConfig, psycho_visual: e.target.checked })}
                  />
                  {t('encoding.psychoVisual')}
                </label>
              </div>
            </div>
            <div className="encoding-actions">
              <button
                className={`btn ${isEncodingActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={isEncodingActive ? handleStopEncoding : handleStartEncoding}
              >
                {isEncodingActive ? t('encoding.stopEncoding') : t('encoding.startEncoding')}
              </button>
            </div>
            <div className="encoding-stats">
              <h3>{t('encoding.stats.title')}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{t('capture.fps')}</h3>
                  <p className="stat-value">{encodingStats.fps.toFixed(1)}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('capture.bitrate')}</h3>
                  <p className="stat-value">{encodingStats.bitrate} {t('capture.kbps')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('capture.cpu')}</h3>
                  <p className="stat-value">{encodingStats.cpu_usage.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>{t('capture.gpu')}</h3>
                  <p className="stat-value">{encodingStats.gpu_usage.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>{t('encoding.stats.encodedFrames')}</h3>
                  <p className="stat-value">{encodingStats.encoded_frames}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('encoding.stats.droppedFrames')}</h3>
                  <p className="stat-value">{encodingStats.dropped_frames}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming Tab */}
        {activeTab === t('tabs.streaming') && (
          <div className="tab-content">
            <h2>{t('streaming.title')}</h2>
            <div className="streaming-controls">
              <div className="control-group">
                <label>{t('streaming.platform')}</label>
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
                <label>{t('streaming.rtmpUrl')}</label>
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
                <label>{t('streaming.streamKey')}</label>
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
                <label>{t('streaming.protocol')}</label>
                <select
                  value={streamingConfig.protocol}
                  onChange={(e) => setStreamingConfig({ ...streamingConfig, protocol: e.target.value })}
                >
                  <option value="RTMP">{t('streaming.protocols.rtmp')}</option>
                  <option value="RTMPS">{t('streaming.protocols.rtps')}</option>
                  <option value="SRT">{t('streaming.protocols.srt')}</option>
                  <option value="WebRTC">{t('streaming.protocols.webrtc')}</option>
                  <option value="HLS">{t('streaming.protocols.hls')}</option>
                  <option value="DASH">{t('streaming.protocols.dash')}</option>
                </select>
              </div>
              <div className="control-group">
                <label>{t('streaming.videoBitrate')}</label>
                <input
                  type="number"
                  value={streamingConfig.video_bitrate}
                  onChange={(e) => setStreamingConfig({ ...streamingConfig, video_bitrate: Number(e.target.value) })}
                />
              </div>
              <div className="control-group">
                <label>{t('streaming.audioBitrate')}</label>
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
                  {t('streaming.lowLatency')}
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={streamingConfig.enable_adaptive_bitrate}
                    onChange={(e) => setStreamingConfig({ ...streamingConfig, enable_adaptive_bitrate: e.target.checked })}
                  />
                  {t('streaming.adaptiveBitrate')}
                </label>
              </div>
            </div>
            <div className="streaming-actions">
              <button
                className={`btn ${isStreamingActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={isStreamingActive ? handleStopStreaming : handleStartStreaming}
              >
                {isStreamingActive ? t('streaming.stopStreaming') : t('streaming.startStreaming')}
              </button>
            </div>
            <div className="streaming-stats">
              <h3>{t('streaming.stats.title')}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{t('streaming.stats.status')}</h3>
                  <p className="stat-value">{isStreamingActive ? t('streaming.stats.live') : t('streaming.stats.offline')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('streaming.stats.duration')}</h3>
                  <p className="stat-value">{Math.floor(streamingStats.duration / 60)}:{(streamingStats.duration % 60).toString().padStart(2, '0')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('capture.bitrate')}</h3>
                  <p className="stat-value">{streamingStats.bitrate} {t('capture.kbps')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('capture.fps')}</h3>
                  <p className="stat-value">{streamingStats.fps.toFixed(1)}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('streaming.stats.networkLatency')}</h3>
                  <p className="stat-value">{streamingStats.network_latency} {t('streaming.stats.ms')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('streaming.stats.bufferHealth')}</h3>
                  <p className="stat-value">{streamingStats.buffer_health.toFixed(1)}%</p>
                </div>
                <div className="stat-card">
                  <h3>{t('encoding.stats.droppedFrames')}</h3>
                  <p className="stat-value">{streamingStats.dropped_frames}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('streaming.stats.reconnects')}</h3>
                  <p className="stat-value">{streamingStats.reconnect_count}</p>
                </div>
              </div>
            </div>
            <div className="multistream-section">
              <h3>{t('streaming.multistreaming.title')}</h3>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={multistreamEnabled}
                    onChange={(e) => setMultistreamEnabled(e.target.checked)}
                  />
                  {t('streaming.multistreaming.enable')}
                </label>
              </div>
              {multistreamEnabled && (
                <div className="multistream-targets">
                  <button className="btn btn-primary">{t('streaming.multistreaming.addTarget')}</button>
                  {multistreamTargets.map((target) => (
                    <div key={target.id} className="multistream-target">
                      <span>{target.name} ({target.platform})</span>
                      <span className={`status ${target.enabled ? 'enabled' : 'disabled'}`}>
                        {target.enabled ? t('streaming.multistreaming.enabled') : t('streaming.multistreaming.disabled')}
                      </span>
                      <button className="btn btn-secondary">{t('streaming.multistreaming.edit')}</button>
                      <button className="btn btn-danger">{t('streaming.multistreaming.remove')}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cloud Tab */}
        {activeTab === t('tabs.cloud') && (
          <div className="tab-content">
            <h2>{t('cloud.title')}</h2>
            <div className="cloud-connection">
              <h3>{t('cloud.connection.title')}</h3>
              <div className={`status-indicator ${cloudConnected ? 'connected' : 'disconnected'}`}>
                {cloudConnected ? t('cloud.connection.connected') : t('cloud.connection.disconnected')}
              </div>
              {!cloudConnected && (
                <button className="btn btn-primary">{t('cloud.connection.connect')}</button>
              )}
              {cloudConnected && (
                <button className="btn btn-danger">{t('cloud.connection.disconnect')}</button>
              )}
            </div>
            <div className="cloud-stats">
              <h3>{t('cloud.stats.title')}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{t('cloud.stats.provider')}</h3>
                  <p className="stat-value">{cloudStats.provider}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('cloud.stats.uptime')}</h3>
                  <p className="stat-value">{Math.floor(cloudStats.uptime / 3600)}{t('cloud.stats.hours')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('cloud.stats.bytesTransferred')}</h3>
                  <p className="stat-value">{(cloudStats.bytes_transferred / 1024 / 1024).toFixed(2)} {t('cloud.stats.mb')}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('cloud.stats.activeStreams')}</h3>
                  <p className="stat-value">{cloudStats.active_streams}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('cloud.stats.recordings')}</h3>
                  <p className="stat-value">{cloudStats.recordings_count}</p>
                </div>
                <div className="stat-card">
                  <h3>{t('cloud.stats.storageUsed')}</h3>
                  <p className="stat-value">{cloudStats.storage_used_gb.toFixed(2)} {t('cloud.stats.gb')}</p>
                </div>
              </div>
            </div>
            <div className="vod-section">
              <h3>{t('cloud.vod.title')}</h3>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.enabled}
                    onChange={(e) => setVodConfig({ ...vodConfig, enabled: e.target.checked })}
                  />
                  {t('cloud.vod.enable')}
                </label>
              </div>
              <div className="control-group">
                <label>{t('cloud.vod.format')}</label>
                <select
                  value={vodConfig.format}
                  onChange={(e) => setVodConfig({ ...vodConfig, format: e.target.value })}
                >
                  <option value="MP4">{t('cloud.vod.formats.mp4')}</option>
                  <option value="MKV">{t('cloud.vod.formats.mkv')}</option>
                  <option value="MOV">{t('cloud.vod.formats.mov')}</option>
                  <option value="FLV">{t('cloud.vod.formats.flv')}</option>
                </select>
              </div>
              <div className="control-group">
                <label>{t('cloud.vod.quality')}</label>
                <select
                  value={vodConfig.quality}
                  onChange={(e) => setVodConfig({ ...vodConfig, quality: e.target.value })}
                >
                  <option value="Original">{t('cloud.vod.qualities.original')}</option>
                  <option value="High">{t('cloud.vod.qualities.high')}</option>
                  <option value="Medium">{t('cloud.vod.qualities.medium')}</option>
                  <option value="Low">{t('cloud.vod.qualities.low')}</option>
                </select>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.auto_upload}
                    onChange={(e) => setVodConfig({ ...vodConfig, auto_upload: e.target.checked })}
                  />
                  {t('cloud.vod.autoUpload')}
                </label>
              </div>
              <div className="control-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={vodConfig.local_backup}
                    onChange={(e) => setVodConfig({ ...vodConfig, local_backup: e.target.checked })}
                  />
                  {t('cloud.vod.localBackup')}
                </label>
              </div>
              <div className="vod-actions">
                <button
                  className={`btn ${vodStatus.is_recording ? 'btn-danger' : 'btn-primary'}`}
                  onClick={vodStatus.is_recording ? handleStopVodRecording : handleStartVodRecording}
                >
                  {vodStatus.is_recording ? t('cloud.vod.stopRecording') : t('cloud.vod.startRecording')}
                </button>
              </div>
              {vodStatus.is_recording && (
                <div className="vod-status">
                  <p><strong>{t('cloud.vod.status.duration')}:</strong> {Math.floor(vodStatus.duration / 60)}:{(vodStatus.duration % 60).toString().padStart(2, '0')}</p>
                  <p><strong>{t('cloud.vod.status.fileSize')}:</strong> {(vodStatus.file_size / 1024 / 1024).toFixed(2)} {t('cloud.stats.mb')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Keyboard Listener */}
      <GlobalKeyboardListener />

      {/* Hotkey Settings Modal */}
      {showHotkeySettings && (
        <div className="modal-overlay" onClick={() => setShowHotkeySettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <HotkeySettings onClose={() => setShowHotkeySettings(false)} />
          </div>
        </div>
      )}

      {/* Scene Automation Settings Modal */}
      {showSceneAutomation && (
        <SceneAutomationSettings onClose={() => setShowSceneAutomation(false)} />
      )}

      {/* Cloud Backup Settings Modal */}
      {showCloudBackup && (
        <CloudBackupSettings onClose={() => setShowCloudBackup(false)} />
      )}
      
      {/* Stream Scheduler Settings Modal */}
      {showStreamScheduler && (
        <StreamSchedulerSettings onClose={() => setShowStreamScheduler(false)} />
      )}
      
      {/* Audio Mixer Settings Modal */}
      {showAudioMixer && (
        <AudioMixerSettings onClose={() => setShowAudioMixer(false)} />
      )}

      {/* Theme Settings Modal */}
      {showThemeSettings && (
        <ThemeSettings isOpen={showThemeSettings} onClose={() => setShowThemeSettings(false)} />
      )}

      {/* Multi-Platform Settings Modal */}
      {showMultiPlatform && (
        <MultiPlatformSettings isOpen={showMultiPlatform} onClose={() => setShowMultiPlatform(false)} />
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <AnalyticsDashboard isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
      )}
    </div>
  );
}

export default App;