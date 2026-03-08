/**
 * Hardware Acceleration Types for V-Streaming
 * Supports NVIDIA, AMD, Intel, and Apple hardware encoding/decoding
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * GPU vendor types
 */
export enum GPUVendor {
  NVIDIA = 'nvidia',
  AMD = 'amd',
  INTEL = 'intel',
  APPLE = 'apple',
  UNKNOWN = 'unknown'
}

/**
 * Hardware encoder types
 */
export enum HardwareEncoder {
  // NVIDIA
  NVENC_H264 = 'nvenc_h264',
  NVENC_HEVC = 'nvenc_hevc',
  NVENC_AV1 = 'nvenc_av1',
  // AMD
  AMF_H264 = 'amf_h264',
  AMF_HEVC = 'amf_hevc',
  AMF_AV1 = 'amf_av1',
  // Intel
  QSV_H264 = 'qsv_h264',
  QSV_HEVC = 'qsv_hevc',
  QSV_AV1 = 'qsv_av1',
  // Apple
  VIDEOTOOLBOX_H264 = 'videotoolbox_h264',
  VIDEOTOOLBOX_HEVC = 'videotoolbox_hevc',
  // Software fallback
  SOFTWARE_X264 = 'software_x264',
  SOFTWARE_X265 = 'software_x265',
  SOFTWARE_SVTAV1 = 'software_svtav1'
}

/**
 * Hardware decoder types
 */
export enum HardwareDecoder {
  NVIDIA = 'nvidia',
  AMD = 'amd',
  INTEL = 'intel',
  APPLE = 'apple',
  SOFTWARE = 'software'
}

/**
 * Preset quality levels for hardware encoding
 */
export enum EncoderPreset {
  // NVIDIA NVENC
  P1 = 'p1', // Performance
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
  P5 = 'p5',
  P6 = 'p6',
  P7 = 'p7', // Quality
  // AMD AMF
  SPEED = 'speed',
  BALANCED = 'balanced',
  QUALITY = 'quality',
  // Intel QSV
  VERYFAST = 'veryfast',
  FASTER = 'faster',
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow',
  SLOWER = 'slower',
  VERYSLOW = 'veryslow',
  // Generic
  DEFAULT = 'default'
}

/**
 * Rate control modes
 */
export enum RateControlMode {
  CBR = 'cbr',           // Constant Bitrate
  VBR = 'vbr',           // Variable Bitrate
  CQP = 'cqp',           // Constant Quantization Parameter
  CQ = 'cq',             // Constant Quality
  ICQ = 'icq',           // Intelligent Constant Quality
  LA_ICQ = 'la_icq',     // Lookahead ICQ
  LA_CBR = 'la_cbr',     // Lookahead CBR
  LA_VBR = 'la_vbr'      // Lookahead VBR
}

/**
 * Multi-pass encoding modes
 */
export enum MultiPassMode {
  DISABLED = 'disabled',
  QUARTER = 'quarter',
  FULL = 'full'
}

/**
 * GPU workload types
 */
export enum GPUWorkloadType {
  ENCODING = 'encoding',
  DECODING = 'decoding',
  BOTH = 'both'
}

/**
 * Acceleration feature status
 */
export enum AccelerationStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * GPU device information
 */
export interface GPUDevice {
  id: string;
  vendor: GPUVendor;
  name: string;
  driverVersion: string;
  driverDate?: string;
  memory: number; // in MB
  memoryUsed?: number;
  memoryFree?: number;
  temperature?: number;
  utilization?: number;
  encoder?: HardwareEncoder[];
  decoder?: HardwareDecoder[];
  isPrimary: boolean;
  pciId?: string;
}

/**
 * Encoder capabilities
 */
export interface EncoderCapabilities {
  encoder: HardwareEncoder;
  vendor: GPUVendor;
  name: string;
  supportedPresets: EncoderPreset[];
  supportedRateControls: RateControlMode[];
  maxResolution: string;
  maxFrameRate: number;
  supportsBFrames: boolean;
  supportsLookahead: boolean;
  supports10Bit: boolean;
  supportsAlpha: boolean;
  maxBitrate: number;
  minBitrate: number;
  recommendedBitrate: number;
}

/**
 * Hardware encoder settings
 */
export interface HardwareEncoderSettings {
  encoder: HardwareEncoder;
  preset: EncoderPreset;
  rateControl: RateControlMode;
  bitrate: number;
  minBitrate?: number;
  maxBitrate?: number;
  keyframeInterval: number;
  bFrames?: number;
  lookahead?: number;
  multiPass?: MultiPassMode;
  cqLevel?: number;
  quality?: number;
  profile?: string;
  level?: string;
  customParams?: Record<string, unknown>;
}

/**
 * Hardware decoder settings
 */
export interface HardwareDecoderSettings {
  decoder: HardwareDecoder;
  enabled: boolean;
  maxInstances?: number;
  lowLatency?: boolean;
}

/**
 * Hardware acceleration configuration
 */
export interface HardwareAccelerationConfig {
  enabled: boolean;
  preferredGPU: string;
  preferredEncoder: HardwareEncoder;
  encoderSettings: HardwareEncoderSettings;
  decoderSettings: HardwareDecoderSettings;
  autoSelectGPU: boolean;
  fallbackToSoftware: boolean;
  enableLowLatency: boolean;
  enablePowerSaving: boolean;
}

/**
 * GPU statistics
 */
export interface GPUStatistics {
  gpuId: string;
  timestamp: Date;
  utilization: number;
  encoderUtilization?: number;
  decoderUtilization?: number;
  memoryUsed: number;
  memoryFree: number;
  memoryTotal: number;
  temperature: number;
  powerDraw?: number;
  powerLimit?: number;
  fanSpeed?: number;
  clockCore?: number;
  clockMemory?: number;
}

/**
 * Hardware acceleration status
 */
export interface HardwareAccelerationStatus {
  isAvailable: boolean;
  isInitialized: boolean;
  activeGPU: GPUDevice | null;
  activeEncoder: HardwareEncoder | null;
  activeDecoder: HardwareDecoder | null;
  availableGPUs: GPUDevice[];
  availableEncoders: EncoderCapabilities[];
  errors: string[];
  warnings: string[];
}

/**
 * Encoding session
 */
export interface EncodingSession {
  id: string;
  encoder: HardwareEncoder;
  startedAt: Date;
  framesEncoded: number;
  bytesEncoded: number;
  averageFPS: number;
  currentBitrate: number;
  droppedFrames: number;
  latency: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  id: string;
  gpuId: string;
  encoder: HardwareEncoder;
  preset: EncoderPreset;
  resolution: string;
  frameRate: number;
  bitrate: number;
  averageFPS: number;
  averageLatency: number;
  cpuUsage: number;
  gpuUsage: number;
  powerConsumption: number;
  qualityScore?: number;
  timestamp: Date;
}

/**
 * Hardware acceleration event types
 */
export type HardwareAccelerationEvent =
  | 'initialized'
  | 'shutdown'
  | 'gpuDetected'
  | 'gpuRemoved'
  | 'encoderChanged'
  | 'decoderChanged'
  | 'settingsChanged'
  | 'error'
  | 'warning'
  | 'statsUpdated'
  | 'benchmarkComplete';

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_HARDWARE_ENCODER_SETTINGS: HardwareEncoderSettings = {
  encoder: HardwareEncoder.NVENC_H264,
  preset: EncoderPreset.P4,
  rateControl: RateControlMode.CBR,
  bitrate: 6000,
  minBitrate: 1000,
  maxBitrate: 10000,
  keyframeInterval: 2,
  bFrames: 2,
  lookahead: 0,
  multiPass: MultiPassMode.QUARTER,
  cqLevel: 23,
  quality: 50
};

export const DEFAULT_HARDWARE_DECODER_SETTINGS: HardwareDecoderSettings = {
  decoder: HardwareDecoder.NVIDIA,
  enabled: true,
  maxInstances: 4,
  lowLatency: true
};

export const DEFAULT_HARDWARE_ACCELERATION_CONFIG: HardwareAccelerationConfig = {
  enabled: true,
  preferredGPU: '',
  preferredEncoder: HardwareEncoder.NVENC_H264,
  encoderSettings: DEFAULT_HARDWARE_ENCODER_SETTINGS,
  decoderSettings: DEFAULT_HARDWARE_DECODER_SETTINGS,
  autoSelectGPU: true,
  fallbackToSoftware: true,
  enableLowLatency: true,
  enablePowerSaving: false
};
