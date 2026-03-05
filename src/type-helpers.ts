/**
 * V-Streaming Type Helpers
 * Re-exports for type-safe value usage
 */

// Encoding types
export {
  EncoderBackend,
  CodecType,
  EncoderPreset,
  RateControlMode,
  EncoderStatus,
  defaultEncoderConfig,
} from './types/encoding';

// SRT types
export {
  SRTConnectionMode,
  SRTLatencyMode,
  SRTEncryptionType,
  defaultSRTConfig,
} from './types/srt';

// Virtual Camera types
export {
  VirtualCameraStatus,
  OutputFormat,
  ResolutionPreset,
  FrameRate,
  AspectRatio,
  SourceType,
  QualityPreset,
  defaultVirtualCameraConfig,
  qualityPresetConfigs,
  resolutionDimensions,
  aspectRatioMultipliers,
  frameRateDisplayNames,
  outputFormatDisplayNames,
  qualityPresetDisplayNames,
} from './types/virtualCamera';