/**
 * useAudioMixer Hook
 * React hook for integrating with the Audio Mixer Manager service
 */

import { useState, useEffect, useCallback } from 'react';
import { audioMixerManager, AudioMixerManager } from '../services/AudioMixerManager';
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
  AudioMixerStats,
  EqualizerPreset,
} from '../types/audioMixer';

interface UseAudioMixerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useAudioMixer = (options: UseAudioMixerOptions = {}) => {
  const { autoRefresh = true, refreshInterval = 100 } = options;

  const [state, setState] = useState<AudioMixerState>(() => ({
    config: audioMixerManager.getConfig(),
    sources: audioMixerManager.getAllSources(),
    buses: audioMixerManager.getAllBuses(),
    vstPlugins: audioMixerManager.getAllPlugins(),
    presets: audioMixerManager.getAllPresets(),
    isInitialized: false,
    isRecording: false,
    isMonitoring: false,
    meteringEnabled: false,
  }));

  const [stats, setStats] = useState<AudioMixerStats>(() => audioMixerManager.getStats());
  const [meteringLevels, setMeteringLevels] = useState<Map<string, { peak: number; rms: number }>>(new Map());

  // Setup event listeners
  useEffect(() => {
    const handleStateChange = (newState: AudioMixerState) => {
      setState(prev => ({ ...prev, config: audioMixerManager.getConfig() }));
      setStats(audioMixerManager.getStats());
    };

    const handleSourceAdded = (source: AudioSource) => {
      setState(prev => ({ ...prev, sources: audioMixerManager.getAllSources() }));
      setStats(audioMixerManager.getStats());
    };

    const handleSourceUpdated = (source: AudioSource) => {
      setState(prev => ({ ...prev, sources: audioMixerManager.getAllSources() }));
    };

    const handleSourceRemoved = (id: string) => {
      setState(prev => ({ ...prev, sources: audioMixerManager.getAllSources() }));
      setStats(audioMixerManager.getStats());
    };

    const handleBusAdded = (bus: AudioBus) => {
      setState(prev => ({ ...prev, buses: audioMixerManager.getAllBuses() }));
      setStats(audioMixerManager.getStats());
    };

    const handleBusUpdated = (bus: AudioBus) => {
      setState(prev => ({ ...prev, buses: audioMixerManager.getAllBuses() }));
    };

    const handleBusRemoved = (id: string) => {
      setState(prev => ({ ...prev, buses: audioMixerManager.getAllBuses() }));
      setStats(audioMixerManager.getStats());
    };

    const handlePluginLoaded = (plugin: VSTPlugin) => {
      setState(prev => ({ ...prev, vstPlugins: audioMixerManager.getAllPlugins() }));
      setStats(audioMixerManager.getStats());
    };

    const handlePluginUnloaded = (id: string) => {
      setState(prev => ({ ...prev, vstPlugins: audioMixerManager.getAllPlugins() }));
      setStats(audioMixerManager.getStats());
    };

    const handlePluginUpdated = (plugin: VSTPlugin) => {
      setState(prev => ({ ...prev, vstPlugins: audioMixerManager.getAllPlugins() }));
    };

    const handlePresetSaved = (preset: AudioPreset) => {
      setState(prev => ({ ...prev, presets: audioMixerManager.getAllPresets() }));
    };

    const handlePresetLoaded = (preset: AudioPreset) => {
      setState(prev => ({
        ...prev,
        config: audioMixerManager.getConfig(),
        sources: audioMixerManager.getAllSources(),
        buses: audioMixerManager.getAllBuses(),
        vstPlugins: audioMixerManager.getAllPlugins(),
        presets: audioMixerManager.getAllPresets(),
      }));
      setStats(audioMixerManager.getStats());
    };

    const handleMeteringUpdated = (data: { sourceId?: string; busId?: string; levels: { peak: number; rms: number } }) => {
      setMeteringLevels(prev => {
        const key = data.sourceId || data.busId || 'unknown';
        const newLevels = new Map(prev);
        newLevels.set(key, data.levels);
        return newLevels;
      });
    };

    // Listen to all audio mixer events
    audioMixerManager.on('state:changed', handleStateChange);
    audioMixerManager.on('source:added', handleSourceAdded);
    audioMixerManager.on('source:updated', handleSourceUpdated);
    audioMixerManager.on('source:removed', handleSourceRemoved);
    audioMixerManager.on('bus:added', handleBusAdded);
    audioMixerManager.on('bus:updated', handleBusUpdated);
    audioMixerManager.on('bus:removed', handleBusRemoved);
    audioMixerManager.on('plugin:loaded', handlePluginLoaded);
    audioMixerManager.on('plugin:unloaded', handlePluginUnloaded);
    audioMixerManager.on('plugin:updated', handlePluginUpdated);
    audioMixerManager.on('preset:saved', handlePresetSaved);
    audioMixerManager.on('preset:loaded', handlePresetLoaded);
    audioMixerManager.on('metering:updated', handleMeteringUpdated);

    return () => {
      audioMixerManager.off('state:changed', handleStateChange);
      audioMixerManager.off('source:added', handleSourceAdded);
      audioMixerManager.off('source:updated', handleSourceUpdated);
      audioMixerManager.off('source:removed', handleSourceRemoved);
      audioMixerManager.off('bus:added', handleBusAdded);
      audioMixerManager.off('bus:updated', handleBusUpdated);
      audioMixerManager.off('bus:removed', handleBusRemoved);
      audioMixerManager.off('plugin:loaded', handlePluginLoaded);
      audioMixerManager.off('plugin:unloaded', handlePluginUnloaded);
      audioMixerManager.off('plugin:updated', handlePluginUpdated);
      audioMixerManager.off('preset:saved', handlePresetSaved);
      audioMixerManager.off('preset:loaded', handlePresetLoaded);
      audioMixerManager.off('metering:updated', handleMeteringUpdated);
    };
  }, []);

  // Auto-refresh state
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setState({
        config: audioMixerManager.getConfig(),
        sources: audioMixerManager.getAllSources(),
        buses: audioMixerManager.getAllBuses(),
        vstPlugins: audioMixerManager.getAllPlugins(),
        presets: audioMixerManager.getAllPresets(),
        isInitialized: audioMixerManager['state'].isInitialized,
        isRecording: audioMixerManager['state'].isRecording,
        isMonitoring: audioMixerManager['state'].isMonitoring,
        meteringEnabled: audioMixerManager['state'].meteringEnabled,
      });
      setStats(audioMixerManager.getStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Configuration
  const config = state.config;
  const updateConfig = useCallback((updates: Partial<AudioMixerConfig>) => {
    audioMixerManager.updateConfig(updates);
  }, []);

  // Source operations
  const sources = state.sources;
  const getSource = useCallback((id: string) => {
    return audioMixerManager.getSource(id);
  }, []);

  const getActiveSources = useCallback(() => {
    return audioMixerManager.getActiveSources();
  }, []);

  const createSource = useCallback(async (options: CreateSourceOptions) => {
    return await audioMixerManager.createSource(options);
  }, []);

  const updateSource = useCallback(async (id: string, options: UpdateSourceOptions) => {
    return await audioMixerManager.updateSource(id, options);
  }, []);

  const deleteSource = useCallback(async (id: string) => {
    return await audioMixerManager.deleteSource(id);
  }, []);

  const setSourceVolume = useCallback((id: string, volume: number) => {
    audioMixerManager.setSourceVolume(id, volume);
  }, []);

  const setSourceMuted = useCallback((id: string, muted: boolean) => {
    audioMixerManager.setSourceMuted(id, muted);
  }, []);

  const setSourceSolo = useCallback((id: string, solo: boolean) => {
    audioMixerManager.setSourceSolo(id, solo);
  }, []);

  // Bus operations
  const buses = state.buses;
  const getBus = useCallback((id: string) => {
    return audioMixerManager.getBus(id);
  }, []);

  const getMasterBus = useCallback(() => {
    return audioMixerManager.getMasterBus();
  }, []);

  const createBus = useCallback(async (options: CreateBusOptions) => {
    return await audioMixerManager.createBus(options);
  }, []);

  const updateBus = useCallback(async (id: string, updates: Partial<AudioBus>) => {
    return await audioMixerManager.updateBus(id, updates);
  }, []);

  const deleteBus = useCallback(async (id: string) => {
    return await audioMixerManager.deleteBus(id);
  }, []);

  const setBusVolume = useCallback((id: string, volume: number) => {
    audioMixerManager.setBusVolume(id, volume);
  }, []);

  // Filter operations
  const addFilter = useCallback((sourceId: string, filter: AudioFilter) => {
    audioMixerManager.addFilter(sourceId, filter);
  }, []);

  const removeFilter = useCallback((sourceId: string, filterId: string) => {
    audioMixerManager.removeFilter(sourceId, filterId);
  }, []);

  // Plugin operations
  const vstPlugins = state.vstPlugins;
  const getPlugin = useCallback((id: string) => {
    return audioMixerManager.getPlugin(id);
  }, []);

  const loadPlugin = useCallback(async (options: LoadVSTPluginOptions) => {
    return await audioMixerManager.loadPlugin(options);
  }, []);

  const unloadPlugin = useCallback(async (id: string) => {
    return await audioMixerManager.unloadPlugin(id);
  }, []);

  const setPluginBypass = useCallback((id: string, bypassed: boolean) => {
    audioMixerManager.setPluginBypass(id, bypassed);
  }, []);

  const updatePluginParameter = useCallback((pluginId: string, parameterId: string, value: number) => {
    audioMixerManager.updatePluginParameter(pluginId, parameterId, value);
  }, []);

  // Preset operations
  const presets = state.presets;
  const activePreset = audioMixerManager['state'].activePreset;

  const savePreset = useCallback(async (name: string, description?: string) => {
    return await audioMixerManager.savePreset(name, description);
  }, []);

  const loadPreset = useCallback(async (id: string) => {
    return await audioMixerManager.loadPreset(id);
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    return await audioMixerManager.deletePreset(id);
  }, []);

  // Metering
  const getMeteringLevels = useCallback((id: string) => {
    return meteringLevels.get(id);
  }, [meteringLevels]);

  // Equalizer presets
  const equalizerPresets = (AudioMixerManager as any).EQUALIZER_PRESETS || [];

  // Status checks
  const isInitialized = state.isInitialized;
  const isRecording = state.isRecording;
  const isMonitoring = state.isMonitoring;
  const meteringEnabled = state.meteringEnabled;

  const hasSources = useCallback(() => {
    return sources.length > 0;
  }, [sources.length]);

  const hasPlugins = useCallback(() => {
    return vstPlugins.length > 0;
  }, [vstPlugins.length]);

  return {
    // State
    state,
    config,
    sources,
    buses,
    vstPlugins,
    presets,
    stats,
    activePreset,
    isInitialized,
    isRecording,
    isMonitoring,
    meteringEnabled,

    // Configuration
    updateConfig,

    // Source operations
    getSource,
    getActiveSources,
    createSource,
    updateSource,
    deleteSource,
    setSourceVolume,
    setSourceMuted,
    setSourceSolo,

    // Bus operations
    getBus,
    getMasterBus,
    createBus,
    updateBus,
    deleteBus,
    setBusVolume,

    // Filter operations
    addFilter,
    removeFilter,

    // Plugin operations
    getPlugin,
    loadPlugin,
    unloadPlugin,
    setPluginBypass,
    updatePluginParameter,

    // Preset operations
    savePreset,
    loadPreset,
    deletePreset,

    // Metering
    getMeteringLevels,

    // Equalizer presets
    equalizerPresets,

    // Status checks
    hasSources,
    hasPlugins,
  };
};