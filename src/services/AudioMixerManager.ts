/**
 * Audio Mixer Manager Service
 * Manages advanced audio mixing with VST plugin support
 */

import { EventEmitter } from 'events';
import {
  AudioMixerConfig,
  AudioMixerState,
  AudioSource,
  AudioBus,
  VSTPlugin,
  AudioPreset,
  CreateSourceOptions,
  UpdateSourceOptions,
  CreateBusOptions,
  LoadVSTPluginOptions,
  AudioFilter,
  AudioCompressor,
  AudioEqualizer,
  AudioMixerEvents,
  AudioMixerStats,
  VSTParameter,
  VSTPreset,
  EqualizerBand,
  EqualizerPreset,
} from '../types/audioMixer';

const DEFAULT_CONFIG: AudioMixerConfig = {
  sampleRate: 48000,
  bufferSize: 512,
  monitoringEnabled: false,
  autoRouting: true,
  syncWithStream: true,
  saveInterval: 30000,
  theme: 'dark',
};

class AudioMixerManager extends EventEmitter {
  private state: AudioMixerState;
  private saveTimer?: ReturnType<typeof setTimeout>;
  private meteringTimer?: ReturnType<typeof setTimeout>;
  private storageKey = 'audio-mixer-state';
  private context: AudioContext | null = null;

  constructor() {
    super();
    this.state = this.loadState();
    this.initialize();
  }

  // Initialization
  private async initialize(): Promise<void> {
    try {
      // Create Web Audio API context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.state.config.sampleRate,
      });

      this.state.isInitialized = true;
      this.state.meteringEnabled = true;
      this.emit('state:changed', this.state);
      this.saveState();
      this.startMetering();
    } catch (error) {
      console.error('Failed to initialize audio mixer:', error);
      this.emit('error', {
        type: 'initialization_error',
        message: 'Failed to initialize audio mixer',
        details: error,
      });
    }
  }

  // State Management
  private loadState(): AudioMixerState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          sources: parsed.sources.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          })),
          buses: parsed.buses.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          })),
          vstPlugins: parsed.vstPlugins.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            loadedAt: p.loadedAt ? new Date(p.loadedAt) : undefined,
            presets: p.presets.map((pr: any) => ({ ...pr, createdAt: new Date(pr.createdAt) })),
          })),
          presets: parsed.presets.map((pr: any) => ({
            ...pr,
            createdAt: new Date(pr.createdAt),
            updatedAt: new Date(pr.updatedAt),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load audio mixer state:', error);
    }
    return this.getDefaultState();
  }

  private getDefaultState(): AudioMixerState {
    return {
      config: { ...DEFAULT_CONFIG },
      sources: [],
      buses: [
        this.createMasterBus(),
      ],
      vstPlugins: [],
      presets: [],
      isInitialized: false,
      isRecording: false,
      isMonitoring: false,
      meteringEnabled: false,
    };
  }

  private createMasterBus(): AudioBus {
    return {
      id: 'bus-master',
      name: 'Master',
      type: 'master',
      volume: 1.0,
      balance: 0,
      muted: false,
      solo: false,
      sources: [],
      filters: [],
      routing: ['output', 'stream'],
      vstPlugins: [],
      metering: {
        enabled: true,
        peak: 0,
        rms: 0,
        hold: 0,
        decay: 0,
        reference: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.emit('state:changed', this.state);
    } catch (error) {
      console.error('Failed to save audio mixer state:', error);
      this.emit('error', {
        type: 'storage_error',
        message: 'Failed to save audio mixer state',
        details: error,
      });
    }
  }

  // Configuration
  getConfig(): AudioMixerConfig {
    return { ...this.state.config };
  }

  updateConfig(updates: Partial<AudioMixerConfig>): void {
    this.state.config = { ...this.state.config, ...updates };
    this.saveState();
    this.emit('config:updated', this.state.config);
  }

  // Source Management
  getAllSources(): AudioSource[] {
    return [...this.state.sources];
  }

  getSource(id: string): AudioSource | undefined {
    return this.state.sources.find(s => s.id === id);
  }

  getActiveSources(): AudioSource[] {
    return this.state.sources.filter(s => s.enabled);
  }

  async createSource(options: CreateSourceOptions): Promise<AudioSource> {
    const id = `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const source: AudioSource = {
      id,
      name: options.name,
      type: options.type,
      deviceId: options.deviceId,
      icon: options.icon,
      enabled: true,
      volume: 1.0,
      balance: 0,
      muted: false,
      solo: false,
      channelType: options.channelType || 'stereo',
      sampleRate: options.sampleRate || this.state.config.sampleRate,
      bitrate: options.bitrate || 128,
      filters: [],
      routing: ['output'],
      vstPlugins: [],
      createdAt: now,
      updatedAt: now,
    };

    this.state.sources.push(source);
    this.saveState();
    this.emit('source:added', source);

    return source;
  }

  async updateSource(id: string, options: UpdateSourceOptions): Promise<AudioSource> {
    const source = this.getSource(id);
    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    Object.assign(source, options, { updatedAt: new Date() });
    this.saveState();
    this.emit('source:updated', source);

    return source;
  }

  async deleteSource(id: string): Promise<void> {
    const index = this.state.sources.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Source not found: ${id}`);
    }

    this.state.sources.splice(index, 1);
    this.saveState();
    this.emit('source:removed', id);
  }

  setSourceVolume(id: string, volume: number): void {
    const source = this.getSource(id);
    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    source.volume = Math.max(0, Math.min(1, volume));
    source.updatedAt = new Date();
    this.saveState();
    this.emit('source:volumeChanged', { sourceId: id, volume: source.volume });
  }

  setSourceMuted(id: string, muted: boolean): void {
    const source = this.getSource(id);
    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    source.muted = muted;
    source.updatedAt = new Date();
    this.saveState();
    this.emit('source:muted', { sourceId: id, muted });
  }

  setSourceSolo(id: string, solo: boolean): void {
    const source = this.getSource(id);
    if (!source) {
      throw new Error(`Source not found: ${id}`);
    }

    // If soloing, unmute and solo only this source
    // If unsoloing, return all sources to normal
    if (solo) {
      this.state.sources.forEach(s => {
        s.solo = s.id === id;
      });
    } else {
      source.solo = false;
    }

    this.saveState();
    this.emit('source:soloed', { sourceId: id, solo });
  }

  // Bus Management
  getAllBuses(): AudioBus[] {
    return [...this.state.buses];
  }

  getBus(id: string): AudioBus | undefined {
    return this.state.buses.find(b => b.id === id);
  }

  getMasterBus(): AudioBus | undefined {
    return this.state.buses.find(b => b.type === 'master');
  }

  async createBus(options: CreateBusOptions): Promise<AudioBus> {
    const id = `bus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const bus: AudioBus = {
      id,
      name: options.name,
      type: options.type,
      volume: 1.0,
      balance: 0,
      muted: false,
      solo: false,
      sources: options.sources || [],
      filters: [],
      routing: ['output'],
      vstPlugins: [],
      outputDevice: options.outputDevice,
      metering: {
        enabled: true,
        peak: 0,
        rms: 0,
        hold: 0,
        decay: 0,
        reference: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.state.buses.push(bus);
    this.saveState();
    this.emit('bus:added', bus);

    return bus;
  }

  async updateBus(id: string, updates: Partial<AudioBus>): Promise<AudioBus> {
    const bus = this.getBus(id);
    if (!bus) {
      throw new Error(`Bus not found: ${id}`);
    }

    Object.assign(bus, updates, { updatedAt: new Date() });
    this.saveState();
    this.emit('bus:updated', bus);

    return bus;
  }

  async deleteBus(id: string): Promise<void> {
    const bus = this.getBus(id);
    if (!bus) {
      throw new Error(`Bus not found: ${id}`);
    }

    if (bus.type === 'master') {
      throw new Error('Cannot delete master bus');
    }

    const index = this.state.buses.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Bus not found: ${id}`);
    }

    this.state.buses.splice(index, 1);
    this.saveState();
    this.emit('bus:removed', id);
  }

  setBusVolume(id: string, volume: number): void {
    const bus = this.getBus(id);
    if (!bus) {
      throw new Error(`Bus not found: ${id}`);
    }

    bus.volume = Math.max(0, Math.min(1, volume));
    bus.updatedAt = new Date();
    this.saveState();
    this.emit('bus:volumeChanged', { busId: id, volume: bus.volume });
  }

  // Filter Management
  addFilter(sourceId: string, filter: AudioFilter): void {
    const source = this.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    source.filters.push(filter);
    source.updatedAt = new Date();
    this.saveState();
    this.emit('source:updated', source);
  }

  removeFilter(sourceId: string, filterId: string): void {
    const source = this.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    const index = source.filters.findIndex(f => f.id === filterId);
    if (index === -1) {
      throw new Error(`Filter not found: ${filterId}`);
    }

    source.filters.splice(index, 1);
    source.updatedAt = new Date();
    this.saveState();
    this.emit('source:updated', source);
  }

  // VST Plugin Management
  getAllPlugins(): VSTPlugin[] {
    return [...this.state.vstPlugins];
  }

  getPlugin(id: string): VSTPlugin | undefined {
    return this.state.vstPlugins.find(p => p.id === id);
  }

  async loadPlugin(options: LoadVSTPluginOptions): Promise<VSTPlugin> {
    const id = `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const plugin: VSTPlugin = {
      id,
      name: options.name || options.path.split('/').pop() || 'Unknown Plugin',
      type: options.type || 'effect',
      path: options.path,
      version: '1.0.0',
      vendor: 'Unknown',
      status: 'loaded',
      enabled: options.enabled ?? true,
      bypassed: false,
      parameters: [],
      presets: [],
      latency: 0,
      cpuUsage: 0,
      loadedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Simulate plugin loading (in real implementation, this would load the actual VST)
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      plugin.status = 'loaded';
    } catch (error) {
      plugin.status = 'error';
      throw error;
    }

    this.state.vstPlugins.push(plugin);
    this.saveState();
    this.emit('plugin:loaded', plugin);

    return plugin;
  }

  async unloadPlugin(id: string): Promise<void> {
    const index = this.state.vstPlugins.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Plugin not found: ${id}`);
    }

    this.state.vstPlugins.splice(index, 1);
    this.saveState();
    this.emit('plugin:unloaded', id);
  }

  setPluginBypass(id: string, bypassed: boolean): void {
    const plugin = this.getPlugin(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }

    plugin.bypassed = bypassed;
    plugin.updatedAt = new Date();
    this.saveState();
    this.emit('plugin:bypassed', { pluginId: id, bypassed });
  }

  updatePluginParameter(pluginId: string, parameterId: string, value: number): void {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const param = plugin.parameters.find(p => p.id === parameterId);
    if (!param) {
      throw new Error(`Parameter not found: ${parameterId}`);
    }

    param.value = value;
    plugin.updatedAt = new Date();
    this.saveState();
    this.emit('plugin:updated', plugin);
  }

  // Preset Management
  getAllPresets(): AudioPreset[] {
    return [...this.state.presets];
  }

  async savePreset(name: string, description?: string): Promise<AudioPreset> {
    const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const preset: AudioPreset = {
      id,
      name,
      description,
      sources: this.state.sources.map(s => ({ ...s })),
      buses: this.state.buses.map(b => ({ ...b })),
      vstPlugins: this.state.vstPlugins.map(p => ({ ...p })),
      globalSettings: { ...this.state.config },
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    this.state.presets.push(preset);
    this.state.activePreset = id;
    this.saveState();
    this.emit('preset:saved', preset);

    return preset;
  }

  async loadPreset(id: string): Promise<void> {
    const preset = this.state.presets.find(p => p.id === id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    // Load preset configuration
    this.state.config = { ...preset.globalSettings };
    this.state.sources = preset.sources.map(s => ({ ...s, createdAt: new Date(s.createdAt!), updatedAt: new Date(s.updatedAt!) })) as any;
    this.state.buses = preset.buses.map(b => ({ ...b, createdAt: new Date(b.createdAt!), updatedAt: new Date(b.updatedAt!) })) as any;
    this.state.vstPlugins = preset.vstPlugins.map(p => ({ ...p, createdAt: new Date(p.createdAt!), updatedAt: new Date(p.updatedAt!) })) as any;
    this.state.activePreset = id;

    this.saveState();
    this.emit('preset:loaded', preset);
  }

  async deletePreset(id: string): Promise<void> {
    const index = this.state.presets.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Preset not found: ${id}`);
    }

    if (this.state.presets[index].isDefault) {
      throw new Error('Cannot delete default preset');
    }

    this.state.presets.splice(index, 1);
    if (this.state.activePreset === id) {
      this.state.activePreset = undefined;
    }
    this.saveState();
  }

  // Equalizer Presets
  static readonly EQUALIZER_PRESETS: EqualizerPreset[] = [
    {
      name: 'Flat',
      bands: [
        { frequency: 60, gain: 0, Q: 1, enabled: true },
        { frequency: 170, gain: 0, Q: 1, enabled: true },
        { frequency: 310, gain: 0, Q: 1, enabled: true },
        { frequency: 600, gain: 0, Q: 1, enabled: true },
        { frequency: 1000, gain: 0, Q: 1, enabled: true },
        { frequency: 3000, gain: 0, Q: 1, enabled: true },
        { frequency: 6000, gain: 0, Q: 1, enabled: true },
        { frequency: 12000, gain: 0, Q: 1, enabled: true },
        { frequency: 14000, gain: 0, Q: 1, enabled: true },
        { frequency: 16000, gain: 0, Q: 1, enabled: true },
      ],
    },
    {
      name: 'Bass Boost',
      bands: [
        { frequency: 60, gain: 6, Q: 1, enabled: true },
        { frequency: 170, gain: 4, Q: 1, enabled: true },
        { frequency: 310, gain: 2, Q: 1, enabled: true },
        { frequency: 600, gain: 0, Q: 1, enabled: true },
        { frequency: 1000, gain: 0, Q: 1, enabled: true },
        { frequency: 3000, gain: 0, Q: 1, enabled: true },
        { frequency: 6000, gain: 0, Q: 1, enabled: true },
        { frequency: 12000, gain: 0, Q: 1, enabled: true },
        { frequency: 14000, gain: 0, Q: 1, enabled: true },
        { frequency: 16000, gain: 0, Q: 1, enabled: true },
      ],
    },
    {
      name: 'Vocal Boost',
      bands: [
        { frequency: 60, gain: 0, Q: 1, enabled: true },
        { frequency: 170, gain: 0, Q: 1, enabled: true },
        { frequency: 310, gain: 0, Q: 1, enabled: true },
        { frequency: 600, gain: 2, Q: 1, enabled: true },
        { frequency: 1000, gain: 4, Q: 1, enabled: true },
        { frequency: 3000, gain: 5, Q: 1, enabled: true },
        { frequency: 6000, gain: 3, Q: 1, enabled: true },
        { frequency: 12000, gain: 2, Q: 1, enabled: true },
        { frequency: 14000, gain: 0, Q: 1, enabled: true },
        { frequency: 16000, gain: 0, Q: 1, enabled: true },
      ],
    },
  ];

  // Metering
  private startMetering(): void {
    if (this.meteringTimer) {
      clearInterval(this.meteringTimer);
    }

    this.meteringTimer = setInterval(() => {
      this.updateMetering();
    }, 100);
  }

  private stopMetering(): void {
    if (this.meteringTimer) {
      clearInterval(this.meteringTimer);
      this.meteringTimer = undefined;
    }
  }

  private updateMetering(): void {
    if (!this.state.meteringEnabled) {
      return;
    }

    // Update source metering
    for (const source of this.state.sources) {
      const levels = this.calculateLevels(source);
      this.emit('metering:updated', { sourceId: source.id, levels });
    }

    // Update bus metering
    for (const bus of this.state.buses) {
      if (bus.metering.enabled) {
        const levels = this.calculateLevels(bus as any);
        bus.metering.peak = levels.peak;
        bus.metering.rms = levels.rms;
        this.emit('metering:updated', { busId: bus.id, levels });
      }
    }
  }

  private calculateLevels(item: any): { peak: number; rms: number } {
    // Simulate metering (in real implementation, this would analyze actual audio)
    const baseLevel = item.volume || 1.0;
    const noise = Math.random() * 0.1;
    const peak = Math.min(1, baseLevel * (0.8 + noise * 0.2));
    const rms = peak * 0.707;
    return { peak, rms };
  }

  // Statistics
  getStats(): AudioMixerStats {
    return {
      totalSources: this.state.sources.length,
      activeSources: this.state.sources.filter(s => s.enabled).length,
      totalBuses: this.state.buses.length,
      totalPlugins: this.state.vstPlugins.length,
      activePlugins: this.state.vstPlugins.filter(p => p.enabled && !p.bypassed).length,
      cpuUsage: this.state.vstPlugins.reduce((sum, p) => sum + p.cpuUsage, 0),
      memoryUsage: 0, // Would be calculated in real implementation
      latency: this.state.vstPlugins.reduce((sum, p) => sum + p.latency, 0),
    };
  }

  // Cleanup
  destroy(): void {
    this.stopMetering();
    if (this.context) {
      this.context.close();
    }
  }
}

// Export class and singleton instance
export { AudioMixerManager };
export const audioMixerManager = new AudioMixerManager();