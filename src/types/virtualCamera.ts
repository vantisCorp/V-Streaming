/**
 * V-Streaming Virtual Camera Type Definitions
 * Virtual camera output for video conferencing applications
 */

/**
 * Virtual camera status
 */
export enum VirtualCameraStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error',
}

/**
 * Virtual camera output format
 */
export enum OutputFormat {
  NV12 = 'nv12',
  I420 = 'i420',
  RGB24 = 'rgb24',
  RGBA = 'rgba',
  YUY2 = 'yuy2',
  UYVY = 'uyvy',
}

/**
 * Virtual camera resolution preset
 */
export enum ResolutionPreset {
  HD_720P = '1280x720',
  FHD_1080P = '1920x1080',
  QHD_1440P = '2560x1440',
  UHD_4K = '3840x2160',
  CUSTOM = 'custom',
}

/**
 * Frame rate options
 */
export enum FrameRate {
  FPS_15 = 15,
  FPS_24 = 24,
  FPS_30 = 30,
  FPS_50 = 50,
  FPS_60 = 60,
  FPS_120 = 120,
  FPS_144 = 144,
}

/**
 * Aspect ratio options
 */
export enum AspectRatio {
  RATIO_16_9 = '16:9',
  RATIO_16_10 = '16:10',
  RATIO_4_3 = '4:3',
  RATIO_1_1 = '1:1',
  RATIO_9_16 = '9:16',
  RATIO_CUSTOM = 'custom',
}

/**
 * Virtual camera source type
 */
export enum SourceType {
  MAIN_OUTPUT = 'main_output',
  SCENE = 'scene',
  SOURCE = 'source',
  PREVIEW = 'preview',
}

/**
 * Virtual camera quality preset
 */
export enum QualityPreset {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  CUSTOM = 'custom',
}

/**
 * Virtual camera device info
 */
export interface VirtualCameraDevice {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isAvailable: boolean;
  supportedFormats: OutputFormat[];
  supportedResolutions: ResolutionPreset[];
  supportedFrameRates: FrameRate[];
  maxBufferSize: number;
}

/**
 * Virtual camera resolution configuration
 */
export interface ResolutionConfig {
  preset: ResolutionPreset;
  customWidth?: number;
  customHeight?: number;
  aspectRatio: AspectRatio;
  customAspectRatio?: string;
}

/**
 * Virtual camera configuration
 */
export interface VirtualCameraConfig {
  enabled: boolean;
  deviceId: string;
  deviceName: string;
  
  // Resolution settings
  resolution: ResolutionConfig;
  
  // Frame rate
  frameRate: FrameRate;
  
  // Output format
  outputFormat: OutputFormat;
  
  // Quality settings
  qualityPreset: QualityPreset;
  bitrate: number; // kbps
  keyframeInterval: number; // seconds
  
  // Source settings
  sourceType: SourceType;
  sourceId?: string;
  sourceName?: string;
  
  // Advanced settings
  bufferSize: number; // frames
  delayedStart: boolean;
  startDelay: number; // ms
  autoRestart: boolean;
  hideFromCapture: boolean;
  
  // Audio settings
  includeAudio: boolean;
  audioDeviceId?: string;
  audioDeviceName?: string;
  
  // Performance settings
  useHardwareAcceleration: boolean;
  priority: 'low' | 'normal' | 'high' | 'realtime';
  
  // Metadata
  lastModified: number;
}

/**
 * Virtual camera statistics
 */
export interface VirtualCameraStats {
  status: VirtualCameraStatus;
  
  // Frame statistics
  framesRendered: number;
  framesDropped: number;
  frameRate: number;
  averageFrameTime: number; // ms
  
  // Performance
  cpuUsage: number; // percentage
  gpuUsage: number; // percentage
  memoryUsage: number; // MB
  
  // Bitrate
  currentBitrate: number; // kbps
  averageBitrate: number; // kbps
  
  // Timing
  uptime: number; // seconds
  startTime?: number; // timestamp
  
  // Error tracking
  errorCount: number;
  lastError?: string;
  lastErrorTime?: number;
}

/**
 * Virtual camera event map
 */
export interface VirtualCameraEvents {
  'status-changed': VirtualCameraStatus;
  'config-changed': VirtualCameraConfig;
  'stats-updated': VirtualCameraStats;
  'frame-rendered': { frameNumber: number; timestamp: number };
  'frame-dropped': { frameNumber: number; reason: string };
  'error': { code: string; message: string; timestamp: number };
  'started': { deviceId: string; timestamp: number };
  'stopped': { deviceId: string; timestamp: number };
}

/**
 * Virtual camera manager interface
 */
export interface IVirtualCameraManager {
  // Device management
  getAvailableDevices(): Promise<VirtualCameraDevice[]>;
  getDefaultDevice(): Promise<VirtualCameraDevice | null>;
  
  // Configuration
  getConfig(): VirtualCameraConfig;
  updateConfig(config: Partial<VirtualCameraConfig>): void;
  resetConfig(): void;
  
  // Control
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  isRunning(): boolean;
  
  // Status
  getStatus(): VirtualCameraStatus;
  getStats(): VirtualCameraStats;
  
  // Source management
  setSource(sourceType: SourceType, sourceId?: string): void;
  getAvailableSources(): Array<{ id: string; name: string; type: SourceType }>;
  
  // Resolution management
  getSupportedResolutions(): ResolutionPreset[];
  getSupportedFrameRates(): FrameRate[];
  
  // Events
  on<K extends keyof VirtualCameraEvents>(
    event: K,
    listener: (data: VirtualCameraEvents[K]) => void
  ): void;
  off<K extends keyof VirtualCameraEvents>(
    event: K,
    listener: (data: VirtualCameraEvents[K]) => void
  ): void;
}

/**
 * Virtual camera preset configuration
 */
export interface VirtualCameraPreset {
  id: string;
  name: string;
  description?: string;
  config: Partial<VirtualCameraConfig>;
  icon?: string;
}

/**
 * Default virtual camera configuration
 */
export const defaultVirtualCameraConfig: VirtualCameraConfig = {
  enabled: false,
  deviceId: '',
  deviceName: '',
  
  resolution: {
    preset: ResolutionPreset.FHD_1080P,
    aspectRatio: AspectRatio.RATIO_16_9,
  },
  
  frameRate: FrameRate.FPS_30,
  outputFormat: OutputFormat.NV12,
  
  qualityPreset: QualityPreset.HIGH,
  bitrate: 5000,
  keyframeInterval: 2,
  
  sourceType: SourceType.MAIN_OUTPUT,
  
  bufferSize: 3,
  delayedStart: false,
  startDelay: 0,
  autoRestart: true,
  hideFromCapture: false,
  
  includeAudio: false,
  
  useHardwareAcceleration: true,
  priority: 'normal',
  
  lastModified: Date.now(),
};

/**
 * Quality preset configurations
 */
export const qualityPresetConfigs: Record<QualityPreset, Partial<VirtualCameraConfig>> = {
  [QualityPreset.LOW]: {
    resolution: { preset: ResolutionPreset.HD_720P, aspectRatio: AspectRatio.RATIO_16_9 },
    frameRate: FrameRate.FPS_30,
    bitrate: 2000,
    useHardwareAcceleration: false,
  },
  [QualityPreset.MEDIUM]: {
    resolution: { preset: ResolutionPreset.FHD_1080P, aspectRatio: AspectRatio.RATIO_16_9 },
    frameRate: FrameRate.FPS_30,
    bitrate: 4000,
    useHardwareAcceleration: true,
  },
  [QualityPreset.HIGH]: {
    resolution: { preset: ResolutionPreset.FHD_1080P, aspectRatio: AspectRatio.RATIO_16_9 },
    frameRate: FrameRate.FPS_60,
    bitrate: 8000,
    useHardwareAcceleration: true,
  },
  [QualityPreset.ULTRA]: {
    resolution: { preset: ResolutionPreset.QHD_1440P, aspectRatio: AspectRatio.RATIO_16_9 },
    frameRate: FrameRate.FPS_60,
    bitrate: 12000,
    useHardwareAcceleration: true,
  },
  [QualityPreset.CUSTOM]: {},
};

/**
 * Resolution preset dimensions
 */
export const resolutionDimensions: Record<ResolutionPreset, { width: number; height: number } | null> = {
  [ResolutionPreset.HD_720P]: { width: 1280, height: 720 },
  [ResolutionPreset.FHD_1080P]: { width: 1920, height: 1080 },
  [ResolutionPreset.QHD_1440P]: { width: 2560, height: 1440 },
  [ResolutionPreset.UHD_4K]: { width: 3840, height: 2160 },
  [ResolutionPreset.CUSTOM]: null,
};

/**
 * Aspect ratio multipliers
 */
export const aspectRatioMultipliers: Record<AspectRatio, { width: number; height: number } | null> = {
  [AspectRatio.RATIO_16_9]: { width: 16, height: 9 },
  [AspectRatio.RATIO_16_10]: { width: 16, height: 10 },
  [AspectRatio.RATIO_4_3]: { width: 4, height: 3 },
  [AspectRatio.RATIO_1_1]: { width: 1, height: 1 },
  [AspectRatio.RATIO_9_16]: { width: 9, height: 16 },
  [AspectRatio.RATIO_CUSTOM]: null,
};

/**
 * Frame rate display names
 */
export const frameRateDisplayNames: Record<FrameRate, string> = {
  [FrameRate.FPS_15]: '15 FPS',
  [FrameRate.FPS_24]: '24 FPS (Cinema)',
  [FrameRate.FPS_30]: '30 FPS (Standard)',
  [FrameRate.FPS_50]: '50 FPS',
  [FrameRate.FPS_60]: '60 FPS (Smooth)',
  [FrameRate.FPS_120]: '120 FPS (High)',
  [FrameRate.FPS_144]: '144 FPS (Gaming)',
};

/**
 * Output format display names
 */
export const outputFormatDisplayNames: Record<OutputFormat, string> = {
  [OutputFormat.NV12]: 'NV12 (Recommended)',
  [OutputFormat.I420]: 'I420 (YUV 4:2:0)',
  [OutputFormat.RGB24]: 'RGB24',
  [OutputFormat.RGBA]: 'RGBA (With Alpha)',
  [OutputFormat.YUY2]: 'YUY2',
  [OutputFormat.UYVY]: 'UYVY',
};

/**
 * Quality preset display names
 */
export const qualityPresetDisplayNames: Record<QualityPreset, string> = {
  [QualityPreset.LOW]: 'Low (720p 30fps)',
  [QualityPreset.MEDIUM]: 'Medium (1080p 30fps)',
  [QualityPreset.HIGH]: 'High (1080p 60fps)',
  [QualityPreset.ULTRA]: 'Ultra (1440p 60fps)',
  [QualityPreset.CUSTOM]: 'Custom',
};