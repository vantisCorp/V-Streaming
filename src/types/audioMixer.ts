/**
 * Audio Mixer Type Definitions
 * Complete type system for advanced audio mixing with VST plugin support
 */

export type AudioSourceType =
  | 'microphone'
  | 'desktop'
  | 'music'
  | 'media'
  | 'game'
  | 'browser'
  | 'custom';

export type AudioChannelType = 'stereo' | 'mono' | 'surround_5_1' | 'surround_7_1';

export type VSTPluginType = 'effect' | 'instrument' | 'analyzer' | 'utility';

export type VSTPluginStatus = 'loaded' | 'unloaded' | 'error' | 'bypassed';

export type AudioRouting = 'output' | 'monitor' | 'record' | 'stream';

export type AudioFilterType =
  | 'lowpass'
  | 'highpass'
  | 'bandpass'
  | 'notch'
  | 'lowshelf'
  | 'highshelf'
  | 'peaking'
  | 'allpass';

export type AudioCompressorMode = 'peak' | 'rms';

export interface AudioSource {
  id: string;
  name: string;
  type: AudioSourceType;
  deviceId?: string;
  icon?: string;
  enabled: boolean;
  volume: number;
  balance: number;
  muted: boolean;
  solo: boolean;
  channelType: AudioChannelType;
  sampleRate: number;
  bitrate: number;
  filters: AudioFilter[];
  routing: AudioRouting[];
  vstPlugins: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioFilter {
  id: string;
  type: AudioFilterType;
  enabled: boolean;
  frequency: number;
  Q?: number;
  gain?: number;
  order?: number;
  name?: string;
}

export interface AudioCompressor {
  id: string;
  enabled: boolean;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeUpGain: number;
  knee: number;
  mode: AudioCompressorMode;
  sidechain?: string;
  name?: string;
}

export interface AudioEqualizer {
  id: string;
  enabled: boolean;
  bands: EqualizerBand[];
  preset?: string;
  name?: string;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  Q: number;
  enabled: boolean;
}

export interface VSTPlugin {
  id: string;
  name: string;
  type: VSTPluginType;
  path: string;
  version: string;
  vendor: string;
  status: VSTPluginStatus;
  enabled: boolean;
  bypassed: boolean;
  parameters: VSTParameter[];
  presets: VSTPreset[];
  currentPreset?: string;
  latency: number;
  cpuUsage: number;
  loadedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VSTParameter {
  id: string;
  name: string;
  value: number;
  minValue: number;
  maxValue: number;
  defaultValue: number;
  step: number;
  type: 'float' | 'integer' | 'boolean' | 'enum';
  enumValues?: string[];
  automatable: boolean;
  midiCC?: number;
}

export interface VSTPreset {
  id: string;
  name: string;
  parameters: Record<string, number>;
  isDefault: boolean;
  createdAt: Date;
}

export interface AudioBus {
  id: string;
  name: string;
  type: 'master' | 'aux' | 'monitor' | 'record';
  volume: number;
  balance: number;
  muted: boolean;
  solo: boolean;
  sources: string[];
  filters: AudioFilter[];
  compressor?: AudioCompressor;
  equalizer?: AudioEqualizer;
  vstPlugins: string[];
  routing: AudioRouting[];
  outputDevice?: string;
  metering: AudioMetering;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioMetering {
  enabled: boolean;
  peak: number;
  rms: number;
  hold: number;
  decay: number;
  reference: number;
}

export interface AudioPreset {
  id: string;
  name: string;
  description?: string;
  sources: Partial<AudioSource>[];
  buses: Partial<AudioBus>[];
  vstPlugins: Partial<VSTPlugin>[];
  globalSettings: AudioMixerConfig;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioMixerConfig {
  sampleRate: number;
  bufferSize: number;
  outputDevice?: string;
  inputDevice?: string;
  monitoringEnabled: boolean;
  monitoringDevice?: string;
  autoRouting: boolean;
  syncWithStream: boolean;
  saveInterval: number;
  theme: 'light' | 'dark';
}

export interface AudioMixerState {
  config: AudioMixerConfig;
  sources: AudioSource[];
  buses: AudioBus[];
  vstPlugins: VSTPlugin[];
  presets: AudioPreset[];
  activePreset?: string;
  isInitialized: boolean;
  isRecording: boolean;
  isMonitoring: boolean;
  meteringEnabled: boolean;
}

export interface AudioMixerEvents {
  'source:added': AudioSource;
  'source:removed': string;
  'source:updated': AudioSource;
  'source:volumeChanged': { sourceId: string; volume: number };
  'source:muted': { sourceId: string; muted: boolean };
  'source:soloed': { sourceId: string; solo: boolean };
  'bus:added': AudioBus;
  'bus:removed': string;
  'bus:updated': AudioBus;
  'bus:volumeChanged': { busId: string; volume: number };
  'plugin:loaded': VSTPlugin;
  'plugin:unloaded': string;
  'plugin:updated': VSTPlugin;
  'plugin:bypassed': { pluginId: string; bypassed: boolean };
  'preset:saved': AudioPreset;
  'preset:loaded': AudioPreset;
  'config:updated': AudioMixerConfig;
  'state:changed': AudioMixerState;
  'metering:updated': { sourceId?: string; busId?: string; levels: { peak: number; rms: number } };
  'error': { type: string; message: string; details?: any };
}

export interface AudioDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  channels: number;
  sampleRate: number;
  isDefault: boolean;
}

export interface CreateSourceOptions {
  name: string;
  type: AudioSourceType;
  deviceId?: string;
  channelType?: AudioChannelType;
  sampleRate?: number;
  bitrate?: number;
  icon?: string;
}

export interface UpdateSourceOptions {
  name?: string;
  icon?: string;
  volume?: number;
  balance?: number;
  muted?: boolean;
  solo?: boolean;
  channelType?: AudioChannelType;
  sampleRate?: number;
  bitrate?: number;
  filters?: AudioFilter[];
  routing?: AudioRouting[];
  vstPlugins?: string[];
  metadata?: Record<string, any>;
}

export interface CreateBusOptions {
  name: string;
  type: 'master' | 'aux' | 'monitor' | 'record';
  sources?: string[];
  outputDevice?: string;
}

export interface LoadVSTPluginOptions {
  path: string;
  name?: string;
  type?: VSTPluginType;
  enabled?: boolean;
}

export interface AudioMixerStats {
  totalSources: number;
  activeSources: number;
  totalBuses: number;
  totalPlugins: number;
  activePlugins: number;
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
}

export interface EqualizerPreset {
  name: string;
  bands: EqualizerBand[];
}