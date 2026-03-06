/**
 * Recording Engine Pro - Advanced Recording Capabilities
 * Type definitions for professional recording with multiple formats,
 * quality presets, and real-time monitoring
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Recording format types
 */
export enum RecordingFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  MOV = 'mov',
  FLV = 'flv',
  WEBM = 'webm',
  TS = 'ts',
  AVI = 'avi',
  GIF = 'gif',
}

/**
 * Recording quality presets
 */
export enum RecordingQuality {
  LOW = 'low',           // 720p 30fps
  MEDIUM = 'medium',     // 1080p 30fps
  HIGH = 'high',         // 1080p 60fps
  ULTRA = 'ultra',       // 1440p 60fps
  ORIGINAL = 'original', // Source quality
  CUSTOM = 'custom',     // Custom settings
}

/**
 * Recording status
 */
export enum RecordingStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Recording mode
 */
export enum RecordingMode {
  CONTINUOUS = 'continuous',   // Record until manually stopped
  SCHEDULED = 'scheduled',     // Record at scheduled time
  DURATION = 'duration',       // Record for specific duration
  SIZE_LIMIT = 'size_limit',   // Record until file size limit
  INSTANT_REPLAY = 'instant_replay', // Replay buffer
  SCREENSHOT = 'screenshot',   // Screenshot capture
}

/**
 * Audio recording mode
 */
export enum AudioRecordingMode {
  NONE = 'none',
  ALL_AUDIO = 'all_audio',
  DESKTOP_AUDIO = 'desktop_audio',
  MICROPHONE = 'microphone',
  SEPARATE_TRACKS = 'separate_tracks',
}

/**
 * Video codec for recording
 */
export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  H265_10BIT = 'h265_10bit',
  AV1 = 'av1',
  VP9 = 'vp9',
}

/**
 * Audio codec for recording
 */
export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'mp3',
  OPUS = 'opus',
  FLAC = 'flac',
  WAV = 'wav',
  AC3 = 'ac3',
}

/**
 * Recording category for organization
 */
export enum RecordingCategory {
  GAMING = 'gaming',
  JUST_CHATTING = 'just_chatting',
  MUSIC = 'music',
  PODCAST = 'podcast',
  TUTORIAL = 'tutorial',
  HIGHLIGHT = 'highlight',
  IRL = 'irl',
  EVENT = 'event',
  OTHER = 'other',
}

/**
 * Split mode for automatic file splitting
 */
export enum SplitMode {
  NONE = 'none',
  BY_DURATION = 'by_duration',
  BY_SIZE = 'by_size',
  BY_SCENE = 'by_scene',
}

/**
 * Replay buffer status
 */
export enum ReplayBufferStatus {
  INACTIVE = 'inactive',
  BUFFERING = 'buffering',
  SAVING = 'saving',
  SAVED = 'saved',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Recording resolution configuration
 */
export interface RecordingResolution {
  width: number;
  height: number;
  frameRate: number;
  aspectRatio: string;
}

/**
 * Recording video configuration
 */
export interface RecordingVideoConfig {
  codec: VideoCodec;
  bitrate: number;          // in kbps
  quality: RecordingQuality;
  resolution: RecordingResolution;
  keyframeInterval: number; // in frames
  profile: string;          // codec profile
  preset: string;           // encoder preset
  pixelFormat: string;
  colorSpace: string;
  hdrEnabled: boolean;
  hardwareEncoding: boolean;
}

/**
 * Recording audio configuration
 */
export interface RecordingAudioConfig {
  codec: AudioCodec;
  bitrate: number;          // in kbps
  sampleRate: number;       // in Hz
  channels: number;
  mode: AudioRecordingMode;
  trackCount: number;
  normalizeAudio: boolean;
  noiseReduction: boolean;
}

/**
 * Recording file configuration
 */
export interface RecordingFileConfig {
  format: RecordingFormat;
  directory: string;
  filenamePattern: string;
  category: RecordingCategory;
  tags: string[];
  addToLibrary: boolean;
  autoCompress: boolean;
}

/**
 * Recording split configuration
 */
export interface RecordingSplitConfig {
  enabled: boolean;
  mode: SplitMode;
  duration: number;         // in seconds (for BY_DURATION)
  size: number;             // in MB (for BY_SIZE)
  customFilename: boolean;
}

/**
 * Recording schedule configuration
 */
export interface RecordingSchedule {
  enabled: boolean;
  startTime: Date | null;
  endTime: Date | null;
  recurring: boolean;
  recurringDays: number[];  // 0-6 (Sunday-Saturday)
  recurringTime: string;    // HH:MM format
}

/**
 * Recording replay buffer configuration
 */
export interface ReplayBufferConfig {
  enabled: boolean;
  duration: number;         // in seconds
  maxDuration: number;      // max buffer duration
  quality: RecordingQuality;
  format: RecordingFormat;
  savePath: string;
  hotkey: string;
}

/**
 * Recording statistics
 */
export interface RecordingStats {
  status: RecordingStatus;
  duration: number;         // in seconds
  fileSize: number;         // in bytes
  bitrate: number;          // current bitrate in kbps
  frameRate: number;        // current frame rate
  droppedFrames: number;
  diskUsage: number;        // percentage
  estimatedSize: number;    // estimated final size
  timeRemaining: number;    // estimated time remaining (for scheduled)
  cpuUsage: number;         // percentage
  gpuUsage: number;         // percentage
  memoryUsage: number;      // in MB
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  id: string;
  filename: string;
  filePath: string;
  format: RecordingFormat;
  category: RecordingCategory;
  tags: string[];
  duration: number;         // in seconds
  fileSize: number;         // in bytes
  resolution: RecordingResolution;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  bitrate: number;
  frameRate: number;
  createdAt: Date;
  modifiedAt: Date;
  thumbnail?: string;
  description?: string;
  favorite: boolean;
  protected: boolean;
}

/**
 * Recording session
 */
export interface RecordingSession {
  id: string;
  name: string;
  status: RecordingStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number;
  config: RecordingConfiguration;
  stats: RecordingStats;
  metadata?: RecordingMetadata;
  error?: string;
}

/**
 * Recording configuration
 */
export interface RecordingConfiguration {
  mode: RecordingMode;
  video: RecordingVideoConfig;
  audio: RecordingAudioConfig;
  file: RecordingFileConfig;
  split: RecordingSplitConfig;
  schedule: RecordingSchedule;
  replayBuffer: ReplayBufferConfig;
}

/**
 * Recording preset
 */
export interface RecordingPreset {
  id: string;
  name: string;
  description: string;
  config: RecordingConfiguration;
  isDefault: boolean;
  isBuiltIn: boolean;
}

/**
 * Recording settings
 */
export interface RecordingSettings {
  defaultConfig: RecordingConfiguration;
  presets: RecordingPreset[];
  autoRecord: boolean;
  autoRecordDelay: number;  // in seconds
  showRecordingIndicator: boolean;
  showTimer: boolean;
  minimizeOnRecord: boolean;
  notificationOnComplete: boolean;
  notificationOnError: boolean;
  soundEnabled: boolean;
  soundOnStart: string;     // sound file path
  soundOnStop: string;      // sound file path
  soundOnError: string;     // sound file path
}

/**
 * Recording disk info
 */
export interface RecordingDiskInfo {
  totalSpace: number;       // in bytes
  usedSpace: number;        // in bytes
  freeSpace: number;        // in bytes
  recordingPath: string;
  estimatedRecordTime: number; // in seconds
}

/**
 * Recording engine state
 */
export interface RecordingEngineState {
  currentSession: RecordingSession | null;
  sessions: RecordingSession[];
  settings: RecordingSettings;
  diskInfo: RecordingDiskInfo;
  recentRecordings: RecordingMetadata[];
  replayBufferStatus: ReplayBufferStatus;
  replayBufferAvailable: boolean;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_RECORDING_RESOLUTION: RecordingResolution = {
  width: 1920,
  height: 1080,
  frameRate: 60,
  aspectRatio: '16:9',
};

export const DEFAULT_RECORDING_VIDEO_CONFIG: RecordingVideoConfig = {
  codec: VideoCodec.H264,
  bitrate: 6000,
  quality: RecordingQuality.HIGH,
  resolution: DEFAULT_RECORDING_RESOLUTION,
  keyframeInterval: 250,
  profile: 'high',
  preset: 'medium',
  pixelFormat: 'yuv420p',
  colorSpace: 'bt709',
  hdrEnabled: false,
  hardwareEncoding: true,
};

export const DEFAULT_RECORDING_AUDIO_CONFIG: RecordingAudioConfig = {
  codec: AudioCodec.AAC,
  bitrate: 192,
  sampleRate: 48000,
  channels: 2,
  mode: AudioRecordingMode.ALL_AUDIO,
  trackCount: 1,
  normalizeAudio: true,
  noiseReduction: false,
};

export const DEFAULT_RECORDING_FILE_CONFIG: RecordingFileConfig = {
  format: RecordingFormat.MP4,
  directory: './recordings',
  filenamePattern: '{date}_{time}_{name}',
  category: RecordingCategory.OTHER,
  tags: [],
  addToLibrary: true,
  autoCompress: false,
};

export const DEFAULT_RECORDING_SPLIT_CONFIG: RecordingSplitConfig = {
  enabled: false,
  mode: SplitMode.NONE,
  duration: 600,  // 10 minutes
  size: 2048,     // 2 GB
  customFilename: false,
};

export const DEFAULT_RECORDING_SCHEDULE: RecordingSchedule = {
  enabled: false,
  startTime: null,
  endTime: null,
  recurring: false,
  recurringDays: [],
  recurringTime: '00:00',
};

export const DEFAULT_REPLAY_BUFFER_CONFIG: ReplayBufferConfig = {
  enabled: false,
  duration: 30,
  maxDuration: 300,
  quality: RecordingQuality.HIGH,
  format: RecordingFormat.MP4,
  savePath: './replays',
  hotkey: 'F9',
};

export const DEFAULT_RECORDING_CONFIG: RecordingConfiguration = {
  mode: RecordingMode.CONTINUOUS,
  video: DEFAULT_RECORDING_VIDEO_CONFIG,
  audio: DEFAULT_RECORDING_AUDIO_CONFIG,
  file: DEFAULT_RECORDING_FILE_CONFIG,
  split: DEFAULT_RECORDING_SPLIT_CONFIG,
  schedule: DEFAULT_RECORDING_SCHEDULE,
  replayBuffer: DEFAULT_REPLAY_BUFFER_CONFIG,
};

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  defaultConfig: DEFAULT_RECORDING_CONFIG,
  presets: [],
  autoRecord: false,
  autoRecordDelay: 0,
  showRecordingIndicator: true,
  showTimer: true,
  minimizeOnRecord: false,
  notificationOnComplete: true,
  notificationOnError: true,
  soundEnabled: true,
  soundOnStart: '',
  soundOnStop: '',
  soundOnError: '',
};

export const DEFAULT_RECORDING_STATS: RecordingStats = {
  status: RecordingStatus.IDLE,
  duration: 0,
  fileSize: 0,
  bitrate: 0,
  frameRate: 0,
  droppedFrames: 0,
  diskUsage: 0,
  estimatedSize: 0,
  timeRemaining: 0,
  cpuUsage: 0,
  gpuUsage: 0,
  memoryUsage: 0,
};

// ============================================================================
// BUILT-IN PRESETS
// ============================================================================

export const BUILTIN_RECORDING_PRESETS: RecordingPreset[] = [
  {
    id: 'preset_gaming',
    name: 'Gaming',
    description: 'Optimized for gameplay recording with high quality',
    config: {
      ...DEFAULT_RECORDING_CONFIG,
      video: {
        ...DEFAULT_RECORDING_VIDEO_CONFIG,
        quality: RecordingQuality.HIGH,
        bitrate: 8000,
        resolution: {
          ...DEFAULT_RECORDING_VIDEO_CONFIG.resolution,
          frameRate: 60,
        },
      },
      file: {
        ...DEFAULT_RECORDING_FILE_CONFIG,
        category: RecordingCategory.GAMING,
      },
    },
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'preset_stream',
    name: 'Stream Recording',
    description: 'Balanced quality for simultaneous streaming and recording',
    config: {
      ...DEFAULT_RECORDING_CONFIG,
      video: {
        ...DEFAULT_RECORDING_VIDEO_CONFIG,
        quality: RecordingQuality.MEDIUM,
        bitrate: 6000,
      },
      file: {
        ...DEFAULT_RECORDING_FILE_CONFIG,
        category: RecordingCategory.OTHER,
      },
    },
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'preset_high_quality',
    name: 'High Quality',
    description: 'Maximum quality for professional content',
    config: {
      ...DEFAULT_RECORDING_CONFIG,
      video: {
        ...DEFAULT_RECORDING_VIDEO_CONFIG,
        quality: RecordingQuality.ULTRA,
        bitrate: 15000,
        codec: VideoCodec.H265,
        resolution: {
          width: 2560,
          height: 1440,
          frameRate: 60,
          aspectRatio: '16:9',
        },
      },
      audio: {
        ...DEFAULT_RECORDING_AUDIO_CONFIG,
        codec: AudioCodec.FLAC,
        bitrate: 320,
      },
    },
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'preset_small_file',
    name: 'Small File Size',
    description: 'Optimized for storage efficiency',
    config: {
      ...DEFAULT_RECORDING_CONFIG,
      video: {
        ...DEFAULT_RECORDING_VIDEO_CONFIG,
        quality: RecordingQuality.MEDIUM,
        bitrate: 3000,
        codec: VideoCodec.H265,
      },
      audio: {
        ...DEFAULT_RECORDING_AUDIO_CONFIG,
        bitrate: 128,
      },
    },
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'preset_instant_replay',
    name: 'Instant Replay',
    description: 'Configured for replay buffer capture',
    config: {
      ...DEFAULT_RECORDING_CONFIG,
      mode: RecordingMode.INSTANT_REPLAY,
      replayBuffer: {
        ...DEFAULT_REPLAY_BUFFER_CONFIG,
        enabled: true,
        duration: 60,
      },
    },
    isDefault: false,
    isBuiltIn: true,
  },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isRecordingActive(status: RecordingStatus): boolean {
  return status === RecordingStatus.RECORDING || 
         status === RecordingStatus.PAUSED ||
         status === RecordingStatus.PREPARING;
}

export function canStartRecording(status: RecordingStatus): boolean {
  return status === RecordingStatus.IDLE || 
         status === RecordingStatus.COMPLETED ||
         status === RecordingStatus.FAILED;
}

export function canPauseRecording(status: RecordingStatus): boolean {
  return status === RecordingStatus.RECORDING;
}

export function canResumeRecording(status: RecordingStatus): boolean {
  return status === RecordingStatus.PAUSED;
}

export function canStopRecording(status: RecordingStatus): boolean {
  return status === RecordingStatus.RECORDING || 
         status === RecordingStatus.PAUSED ||
         status === RecordingStatus.PREPARING;
}