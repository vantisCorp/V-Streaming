/**
 * V-Streaming Hardware Encoding Type Definitions
 * Supports NVENC (NVIDIA), AMF (AMD), and QuickSync (Intel)
 */

import EventEmitter from 'eventemitter3';

// Encoder backend types
export enum EncoderBackend {
  NVENC = 'nvenc',
  AMF = 'amf',
  QUICKSYNC = 'quicksync',
  SOFTWARE = 'software',
}

// Codec types
export enum CodecType {
  H264 = 'h264',
  HEVC = 'hevc',
  AV1 = 'av1',
}

// Preset types for encoding quality vs performance
export enum EncoderPreset {
  P1 = 'p1', // Max Performance
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
  P5 = 'p5', // Balanced
  P6 = 'p6',
  P7 = 'p7',
  P8 = 'p8',
  P9 = 'p9', // Max Quality
}

// Rate control modes
export enum RateControlMode {
  CBR = 'cbr', // Constant Bitrate
  VBR = 'vbr', // Variable Bitrate
  CQP = 'cqp', // Constant Quantization Parameter
  VQVBR = 'vqvbr', // Variable Quality VBR
}

// Profile types
export enum H264Profile {
  BASELINE = 'baseline',
  MAIN = 'main',
  HIGH = 'high',
  HIGH444 = 'high444',
}

export enum HEVCProfile {
  MAIN = 'main',
  MAIN10 = 'main10',
  MAIN12 = 'main12',
}

// Tiers for HEVC
export enum HEVCTier {
  MAIN = 'main',
  HIGH = 'high',
}

// Encoder status
export enum EncoderStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  ENCODING = 'encoding',
  STOPPING = 'stopping',
  ERROR = 'error',
}

// Encoder capability info
export interface EncoderCapability {
  backend: EncoderBackend;
  name: string;
  description: string;
  available: boolean;
  supportedCodecs: CodecType[];
  maxResolution: { width: number; height: number };
  maxFramerate: number;
  maxBitrate: number;
  features: EncoderFeature[];
  presets: EncoderPreset[];
  version?: string;
}

// Encoder features
export interface EncoderFeature {
  name: string;
  available: boolean;
  description: string;
}

// Encoder configuration
export interface EncoderConfig {
  backend: EncoderBackend;
  codec: CodecType;
  preset: EncoderPreset;
  rateControlMode: RateControlMode;
  bitrate: number; // in kbps
  maxBitrate?: number; // in kbps (for VBR)
  keyframeInterval: number; // in seconds
  profile?: H264Profile | HEVCProfile;
  tier?: HEVCTier;
  cqp?: number; // for CQP mode
  minQp?: number;
  maxQp?: number;
  bFrames?: number;
  referenceFrames?: number;
  multipass?: 'disabled' | 'quarter' | 'full';
  lookahead?: number;
  adaptiveQuantization?: boolean;
  psychoVisualTuning?: boolean;
  temporalAQ?: boolean;
  spatialAQ?: number;
  vuiParameters?: boolean;
}

// Default encoder configuration
export const defaultEncoderConfig: EncoderConfig = {
  backend: EncoderBackend.NVENC,
  codec: CodecType.H264,
  preset: EncoderPreset.P6,
  rateControlMode: RateControlMode.CBR,
  bitrate: 6000,
  maxBitrate: 6000,
  keyframeInterval: 2,
  profile: H264Profile.HIGH,
  minQp: 18,
  maxQp: 28,
  bFrames: 0,
  referenceFrames: 3,
  multipass: 'quarter',
  lookahead: 10,
  adaptiveQuantization: true,
  psychoVisualTuning: false,
  temporalAQ: true,
  spatialAQ: 15,
  vuiParameters: true,
};

// Real-time encoder statistics
export interface EncoderStatistics {
  status: EncoderStatus;
  fps: number;
  bitrate: number; // actual bitrate in kbps
  avgBitrate: number; // average bitrate over time
  droppedFrames: number;
  totalFrames: number;
  encodedFrames: number;
  latency: number; // encoding latency in ms
  avgLatency: number;
  cpuUsage: number; // percentage
  gpuUsage: number; // percentage
  memoryUsage: number; // in MB
  qualityMetric?: {
    psnr?: number;
    ssim?: number;
    vmaf?: number;
  };
  timestamp: number;
}

// Encoder performance metrics
export interface EncoderPerformanceMetrics {
  avgEncodeTime: number; // in ms
  maxEncodeTime: number;
  minEncodeTime: number;
  frameVariance: number;
  droppedFrameRate: number; // percentage
  bitrateVariance: number; // in kbps
  timestamp: number;
}

// Preset configuration
export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  config: Partial<EncoderConfig>;
  recommendedFor: string[];
  icon?: string;
}

// Resolution preset
export interface ResolutionPreset {
  width: number;
  height: number;
  name: string;
  recommendedBitrates: {
    min: number;
    recommended: number;
    max: number;
  };
}

// Framerate preset
export interface FrameratePreset {
  fps: number;
  name: string;
  recommendedBitrates: {
    min: number;
    recommended: number;
    max: number;
  };
}

// Encoder error
export interface EncoderError {
  type: 'initialization' | 'encoding' | 'configuration' | 'hardware' | 'generic';
  message: string;
  code?: string;
  details?: string;
  timestamp: number;
}

// Encoder event types
export type EncoderEventType =
  | 'statusChanged'
  | 'statisticsUpdated'
  | 'error'
  | 'configChanged'
  | 'backendChanged'
  | 'codecChanged';

export interface EncoderEvent {
  type: EncoderEventType;
  data: unknown;
  timestamp: number;
}

// Encoder events interface
export interface EncoderEvents {
  statusChanged: (status: EncoderStatus) => void;
  statisticsUpdated: (stats: EncoderStatistics) => void;
  error: (error: EncoderError) => void;
  configChanged: (config: EncoderConfig) => void;
  backendChanged: (backend: EncoderBackend) => void;
  codecChanged: (codec: CodecType) => void;
}

// Encoder manager interface
export interface IEncoderManager {
  getAvailableBackends(): EncoderCapability[];
  getCurrentBackend(): EncoderBackend;
  setBackend(backend: EncoderBackend): Promise<void>;
  getSupportedCodecs(backend: EncoderBackend): CodecType[];
  getCurrentCodec(): CodecType;
  setCodec(codec: CodecType): Promise<void>;
  getConfig(): EncoderConfig;
  setConfig(config: Partial<EncoderConfig>): Promise<void>;
  getStatistics(): EncoderStatistics;
  getStatus(): EncoderStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  getCapabilities(backend: EncoderBackend): EncoderCapability | null;
  resetToDefaults(): void;
}

// Export type for EventEmitter
export type EncoderEventEmitter = EventEmitter<EncoderEvents>;