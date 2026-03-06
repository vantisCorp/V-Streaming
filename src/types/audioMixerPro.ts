/**
 * V-Streaming Audio Mixer Pro Type Definitions
 * Advanced audio mixing with VST plugins, filters, and visualization
 */

/**
 * Audio track status
 */
export enum AudioTrackStatus {
  ACTIVE = 'active',
  MUTED = 'muted',
  SOLO = 'solo',
  INACTIVE = 'inactive',
}

/**
 * Audio filter types
 */
export enum AudioFilterType {
  // EQ Filters
  EQ_3BAND = 'eq_3band',
  EQ_10BAND = 'eq_10band',
  EQ_PARAMETRIC = 'eq_parametric',
  
  // Dynamics
  COMPRESSOR = 'compressor',
  LIMITER = 'limiter',
  GATE = 'gate',
  DEESSER = 'deesser',
  
  // Effects
  REVERB = 'reverb',
  DELAY = 'delay',
  CHORUS = 'chorus',
  FLANGER = 'flanger',
  PHASER = 'phaser',
  
  // Utility
  NOISE_GATE = 'noise_gate',
  NOISE_SUPPRESSION = 'noise_suppression',
  GAIN = 'gain',
  PANNER = 'panner',
  
  // VST
  VST_PLUGIN = 'vst_plugin',
}

/**
 * Audio visualization mode
 */
export enum VisualizationMode {
  WAVEFORM = 'waveform',
  SPECTRUM = 'spectrum',
  VU_METER = 'vu_meter',
  PEAK_METER = 'peak_meter',
  SPECTROGRAM = 'spectrogram',
}

/**
 * Audio sample rate options
 */
export enum SampleRate {
  SR_44100 = 44100,
  SR_48000 = 48000,
  SR_96000 = 96000,
  SR_192000 = 192000,
}

/**
 * Audio bit depth options
 */
export enum BitDepth {
  BIT_16 = 16,
  BIT_24 = 24,
  BIT_32 = 32,
  BIT_64 = 64,
}

/**
 * Audio channel configuration
 */
export enum ChannelConfig {
  MONO = 'mono',
  STEREO = 'stereo',
  SURROUND_51 = '5.1',
  SURROUND_71 = '7.1',
}

/**
 * Filter band for EQ
 */
export interface EQBand {
  frequency: number; // Hz
  gain: number; // dB
  q: number; // Quality factor
  type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass' | 'bandpass' | 'notch';
}

/**
 * Compressor settings
 */
export interface CompressorSettings {
  threshold: number; // dB
  ratio: number; // ratio (e.g., 4:1)
  attack: number; // ms
  release: number; // ms
  knee: number; // dB
  makeupGain: number; // dB
}

/**
 * Gate settings
 */
export interface GateSettings {
  threshold: number; // dB
  attack: number; // ms
  release: number; // ms
  hold: number; // ms
  range: number; // dB
  ratio: number;
}

/**
 * Reverb settings
 */
export interface ReverbSettings {
  roomSize: number; // 0-1
  damping: number; // 0-1
  wetLevel: number; // 0-1
  dryLevel: number; // 0-1
  width: number; // 0-1
  preDelay: number; // ms
  decay: number; // seconds
}

/**
 * Delay settings
 */
export interface DelaySettings {
  time: number; // ms
  feedback: number; // 0-1
  mix: number; // 0-1
  pingPong: boolean;
  syncToBPM: boolean;
  tempoDivision: '1/4' | '1/8' | '1/16' | '1/32' | 'dotted' | 'triplet';
}

/**
 * VST Plugin info
 */
export interface VSTPlugin {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  path: string;
  isInstrument: boolean;
  numInputs: number;
  numOutputs: number;
  parameters: VSTParameter[];
}

/**
 * VST Parameter
 */
export interface VSTParameter {
  id: string;
  name: string;
  value: number; // 0-1
  defaultValue: number;
  minValue: number;
  maxValue: number;
  unit: string;
}

/**
 * Audio filter configuration
 */
export interface AudioFilter {
  id: string;
  type: AudioFilterType;
  enabled: boolean;
  order: number;
  settings: EQBand[] | CompressorSettings | GateSettings | ReverbSettings | DelaySettings | Record<string, number>;
  wetDry: number; // 0-1
  vstPluginId?: string;
  vstPreset?: string;
}

/**
 * Audio device info
 */
export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  isDefault: boolean;
  isAvailable: boolean;
  sampleRates: number[];
  channels: number;
  latency: number; // ms
}

/**
 * Audio track configuration
 */
export interface AudioTrack {
  id: string;
  name: string;
  type: 'input' | 'media' | 'vst' | 'output' | 'master';
  deviceId?: string;
  deviceName?: string;
  
  // Volume and panning
  volume: number; // 0-1 (linear) or dB
  pan: number; // -1 (left) to 1 (right)
  mute: boolean;
  solo: boolean;
  
  // Metering
  peakL: number; // dB
  peakR: number; // dB
  rmsL: number; // dB
  rmsR: number; // dB
  clipping: boolean;
  
  // Effects chain
  filters: AudioFilter[];
  
  // Routing
  outputId: string; // Which track/bus this outputs to
  sends: AudioSend[];
  
  // Monitoring
  monitoring: boolean;
  monitoringType: 'off' | 'input' | 'output';
  
  // Color for UI
  color: string;
  
  // Visualization data
  waveform?: Float32Array;
  spectrum?: Float32Array;
  
  // Metadata
  createdAt: number;
  modifiedAt: number;
}

/**
 * Audio send (for routing between tracks)
 */
export interface AudioSend {
  id: string;
  destinationId: string;
  destinationName: string;
  level: number; // 0-1
  mute: boolean;
  preFader: boolean;
}

/**
 * Audio bus configuration
 */
export interface AudioBus {
  id: string;
  name: string;
  type: 'submix' | 'aux' | 'master';
  tracks: string[]; // Track IDs routed to this bus
  
  // Volume and panning
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  
  // Effects
  filters: AudioFilter[];
  
  // Metering
  peakL: number;
  peakR: number;
  rmsL: number;
  rmsR: number;
  
  // Color
  color: string;
}

/**
 * Audio scene/preset
 */
export interface AudioScene {
  id: string;
  name: string;
  description?: string;
  tracks: AudioTrack[];
  buses: AudioBus[];
  masterVolume: number;
  createdAt: number;
  isDefault?: boolean;
}

/**
 * Audio settings
 */
export interface AudioSettings {
  sampleRate: SampleRate;
  bitDepth: BitDepth;
  bufferLength: number; // samples
  channelConfig: ChannelConfig;
  
  // Monitoring
  monitorOutput: boolean;
  monitorInput: boolean;
  exclusiveMode: boolean;
  
  // Processing
  useHardwareAcceleration: boolean;
  processingQuality: 'low' | 'medium' | 'high' | 'ultra';
  
  // Metering
  meterFalloff: number; // dB/s
  peakHold: boolean;
  peakHoldTime: number; // ms
  clippingThreshold: number; // dB
  
  // Visualization
  visualizationMode: VisualizationMode;
  fftSize: number;
  smoothing: number;
  
  // Latency
  inputLatency: number; // ms
  outputLatency: number; // ms
  totalLatency: number; // ms
}

/**
 * Audio statistics
 */
export interface AudioStats {
  // Overall
  cpuUsage: number;
  memoryUsage: number;
  dspLoad: number;
  
  // Latency
  inputLatency: number;
  outputLatency: number;
  totalLatency: number;
  bufferUnderruns: number;
  
  // Quality
  sampleRate: number;
  bitDepth: number;
  activeTracks: number;
  activeFilters: number;
  
  // Errors
  errorCount: number;
  lastError?: string;
}

/**
 * Audio event map
 */
export interface AudioMixerEvents {
  'track-added': AudioTrack;
  'track-removed': string;
  'track-updated': AudioTrack;
  'filter-added': { trackId: string; filter: AudioFilter };
  'filter-removed': { trackId: string; filterId: string };
  'filter-updated': { trackId: string; filter: AudioFilter };
  'volume-changed': { trackId: string; volume: number };
  'pan-changed': { trackId: string; pan: number };
  'mute-changed': { trackId: string; muted: boolean };
  'solo-changed': { trackId: string; soloed: boolean };
  'metering-updated': { trackId: string; peakL: number; peakR: number; rmsL: number; rmsR: number };
  'settings-changed': AudioSettings;
  'scene-loaded': AudioScene;
  'error': { code: string; message: string; timestamp: number };
}

/**
 * Audio Mixer Pro Manager interface
 */
export interface IAudioMixerProManager {
  // Device management
  getInputDevices(): Promise<AudioDevice[]>;
  getOutputDevices(): Promise<AudioDevice[]>;
  getDefaultInputDevice(): Promise<AudioDevice | null>;
  getDefaultOutputDevice(): Promise<AudioDevice | null>;
  
  // Track management
  getTracks(): AudioTrack[];
  getTrack(id: string): AudioTrack | undefined;
  addTrack(track: Omit<AudioTrack, 'id' | 'createdAt' | 'modifiedAt'>): AudioTrack;
  removeTrack(id: string): void;
  updateTrack(id: string, updates: Partial<AudioTrack>): void;
  
  // Filter management
  addFilter(trackId: string, filter: Omit<AudioFilter, 'id'>): AudioFilter;
  removeFilter(trackId: string, filterId: string): void;
  updateFilter(trackId: string, filterId: string, updates: Partial<AudioFilter>): void;
  reorderFilters(trackId: string, filterIds: string[]): void;
  
  // VST management
  getVSTPlugins(): Promise<VSTPlugin[]>;
  loadVSTPreset(trackId: string, filterId: string, presetPath: string): Promise<void>;
  saveVSTPreset(trackId: string, filterId: string, presetPath: string): Promise<void>;
  
  // Scene management
  getScenes(): AudioScene[];
  loadScene(sceneId: string): void;
  saveScene(name: string, description?: string): AudioScene;
  deleteScene(sceneId: string): void;
  
  // Settings
  getSettings(): AudioSettings;
  updateSettings(settings: Partial<AudioSettings>): void;
  
  // Statistics
  getStats(): AudioStats;
  
  // Events
  on<K extends keyof AudioMixerEvents>(
    event: K,
    listener: (data: AudioMixerEvents[K]) => void
  ): void;
  off<K extends keyof AudioMixerEvents>(
    event: K,
    listener: (data: AudioMixerEvents[K]) => void
  ): void;
}

/**
 * Default audio settings
 */
export const defaultAudioSettings: AudioSettings = {
  sampleRate: SampleRate.SR_48000,
  bitDepth: BitDepth.BIT_24,
  bufferLength: 256,
  channelConfig: ChannelConfig.STEREO,
  
  monitorOutput: false,
  monitorInput: false,
  exclusiveMode: false,
  
  useHardwareAcceleration: true,
  processingQuality: 'high',
  
  meterFalloff: 20,
  peakHold: true,
  peakHoldTime: 1500,
  clippingThreshold: -0.1,
  
  visualizationMode: VisualizationMode.VU_METER,
  fftSize: 2048,
  smoothing: 0.8,
  
  inputLatency: 0,
  outputLatency: 0,
  totalLatency: 0,
};

/**
 * Default EQ bands for 10-band EQ
 */
export const defaultEQ10Bands: EQBand[] = [
  { frequency: 31, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 62, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 125, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 250, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 500, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 1000, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 2000, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 4000, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 8000, gain: 0, q: 1.4, type: 'peaking' },
  { frequency: 16000, gain: 0, q: 1.4, type: 'peaking' },
];

/**
 * Default compressor settings
 */
export const defaultCompressorSettings: CompressorSettings = {
  threshold: -24,
  ratio: 4,
  attack: 5,
  release: 100,
  knee: 6,
  makeupGain: 0,
};

/**
 * Default gate settings
 */
export const defaultGateSettings: GateSettings = {
  threshold: -40,
  attack: 0.5,
  release: 100,
  hold: 50,
  range: -60,
  ratio: 10,
};

/**
 * Default reverb settings
 */
export const defaultReverbSettings: ReverbSettings = {
  roomSize: 0.5,
  damping: 0.5,
  wetLevel: 0.3,
  dryLevel: 0.7,
  width: 1,
  preDelay: 10,
  decay: 2,
};

/**
 * Default delay settings
 */
export const defaultDelaySettings: DelaySettings = {
  time: 250,
  feedback: 0.4,
  mix: 0.3,
  pingPong: false,
  syncToBPM: false,
  tempoDivision: '1/4',
};

/**
 * Audio filter display names
 */
export const audioFilterDisplayNames: Record<AudioFilterType, string> = {
  [AudioFilterType.EQ_3BAND]: '3-Band EQ',
  [AudioFilterType.EQ_10BAND]: '10-Band EQ',
  [AudioFilterType.EQ_PARAMETRIC]: 'Parametric EQ',
  [AudioFilterType.COMPRESSOR]: 'Compressor',
  [AudioFilterType.LIMITER]: 'Limiter',
  [AudioFilterType.GATE]: 'Gate',
  [AudioFilterType.DEESSER]: 'De-Esser',
  [AudioFilterType.REVERB]: 'Reverb',
  [AudioFilterType.DELAY]: 'Delay',
  [AudioFilterType.CHORUS]: 'Chorus',
  [AudioFilterType.FLANGER]: 'Flanger',
  [AudioFilterType.PHASER]: 'Phaser',
  [AudioFilterType.NOISE_GATE]: 'Noise Gate',
  [AudioFilterType.NOISE_SUPPRESSION]: 'Noise Suppression',
  [AudioFilterType.GAIN]: 'Gain',
  [AudioFilterType.PANNER]: 'Panner',
  [AudioFilterType.VST_PLUGIN]: 'VST Plugin',
};

/**
 * Visualization mode display names
 */
export const visualizationModeDisplayNames: Record<VisualizationMode, string> = {
  [VisualizationMode.WAVEFORM]: 'Waveform',
  [VisualizationMode.SPECTRUM]: 'Spectrum Analyzer',
  [VisualizationMode.VU_METER]: 'VU Meter',
  [VisualizationMode.PEAK_METER]: 'Peak Meter',
  [VisualizationMode.SPECTROGRAM]: 'Spectrogram',
};