/**
 * V-Streaming useAudioMixerPro Hook
 * React hook for Audio Mixer Pro state management
 */

import { useState, useEffect, useCallback } from 'react';
import { audioMixerProManager } from '../services/AudioMixerProManager';
import type {
  AudioTrack,
  AudioFilter,
  AudioSettings,
  AudioStats,
  AudioDevice,
  AudioScene,
  VSTPlugin,
} from '../types/audioMixerPro';

interface UseAudioMixerProReturn {
  // State
  tracks: AudioTrack[];
  settings: AudioSettings;
  stats: AudioStats;
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  scenes: AudioScene[];
  vstPlugins: VSTPlugin[];
  
  // Track actions
  addTrack: (track: Omit<AudioTrack, 'id' | 'createdAt' | 'modifiedAt'>) => AudioTrack;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<AudioTrack>) => void;
  
  // Filter actions
  addFilter: (trackId: string, filter: Omit<AudioFilter, 'id'>) => AudioFilter;
  removeFilter: (trackId: string, filterId: string) => void;
  updateFilter: (trackId: string, filterId: string, updates: Partial<AudioFilter>) => void;
  reorderFilters: (trackId: string, filterIds: string[]) => void;
  
  // Scene actions
  loadScene: (sceneId: string) => void;
  saveScene: (name: string, description?: string) => AudioScene;
  deleteScene: (sceneId: string) => void;
  
  // Settings
  updateSettings: (settings: Partial<AudioSettings>) => void;
  
  // Device actions
  refreshDevices: () => Promise<void>;
  refreshVSTPlugins: () => Promise<void>;
  
  // Computed
  activeTrackCount: number;
  mutedTrackCount: number;
  soloedTrackCount: number;
  masterTrack: AudioTrack | undefined;
}

export const useAudioMixerPro = (): UseAudioMixerProReturn => {
  const [tracks, setTracks] = useState<AudioTrack[]>(audioMixerProManager.getTracks());
  const [settings, setSettings] = useState<AudioSettings>(audioMixerProManager.getSettings());
  const [stats, setStats] = useState<AudioStats>(audioMixerProManager.getStats());
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [scenes, setScenes] = useState<AudioScene[]>(audioMixerProManager.getScenes());
  const [vstPlugins, setVstPlugins] = useState<VSTPlugin[]>([]);

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      const inputs = await audioMixerProManager.getInputDevices();
      const outputs = await audioMixerProManager.getOutputDevices();
      setInputDevices(inputs);
      setOutputDevices(outputs);
    };
    loadDevices();
  }, []);

  // Load VST plugins on mount
  useEffect(() => {
    const loadPlugins = async () => {
      const plugins = await audioMixerProManager.getVSTPlugins();
      setVstPlugins(plugins);
    };
    loadPlugins();
  }, []);

  // Subscribe to events
  useEffect(() => {
    const handleTrackAdded = (track: AudioTrack) => {
      setTracks(audioMixerProManager.getTracks());
    };
    const handleTrackRemoved = (trackId: string) => {
      setTracks(audioMixerProManager.getTracks());
    };
    const handleTrackUpdated = (track: AudioTrack) => {
      setTracks(audioMixerProManager.getTracks());
    };
    const handleSettingsChanged = (newSettings: AudioSettings) => {
      setSettings(newSettings);
    };
    const handleSceneLoaded = (scene: AudioScene) => {
      setTracks(audioMixerProManager.getTracks());
      setScenes(audioMixerProManager.getScenes());
    };

    audioMixerProManager.on('track-added', handleTrackAdded);
    audioMixerProManager.on('track-removed', handleTrackRemoved);
    audioMixerProManager.on('track-updated', handleTrackUpdated);
    audioMixerProManager.on('settings-changed', handleSettingsChanged);
    audioMixerProManager.on('scene-loaded', handleSceneLoaded);

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(audioMixerProManager.getStats());
    }, 100);

    return () => {
      audioMixerProManager.off('track-added', handleTrackAdded);
      audioMixerProManager.off('track-removed', handleTrackRemoved);
      audioMixerProManager.off('track-updated', handleTrackUpdated);
      audioMixerProManager.off('settings-changed', handleSettingsChanged);
      audioMixerProManager.off('scene-loaded', handleSceneLoaded);
      clearInterval(statsInterval);
    };
  }, []);

  // Track actions
  const addTrack = useCallback((track: Omit<AudioTrack, 'id' | 'createdAt' | 'modifiedAt'>) => {
    return audioMixerProManager.addTrack(track);
  }, []);

  const removeTrack = useCallback((id: string) => {
    audioMixerProManager.removeTrack(id);
  }, []);

  const updateTrack = useCallback((id: string, updates: Partial<AudioTrack>) => {
    audioMixerProManager.updateTrack(id, updates);
  }, []);

  // Filter actions
  const addFilter = useCallback((trackId: string, filter: Omit<AudioFilter, 'id'>) => {
    return audioMixerProManager.addFilter(trackId, filter);
  }, []);

  const removeFilter = useCallback((trackId: string, filterId: string) => {
    audioMixerProManager.removeFilter(trackId, filterId);
  }, []);

  const updateFilter = useCallback((trackId: string, filterId: string, updates: Partial<AudioFilter>) => {
    audioMixerProManager.updateFilter(trackId, filterId, updates);
  }, []);

  const reorderFilters = useCallback((trackId: string, filterIds: string[]) => {
    audioMixerProManager.reorderFilters(trackId, filterIds);
  }, []);

  // Scene actions
  const loadScene = useCallback((sceneId: string) => {
    audioMixerProManager.loadScene(sceneId);
  }, []);

  const saveScene = useCallback((name: string, description?: string) => {
    return audioMixerProManager.saveScene(name, description);
  }, []);

  const deleteScene = useCallback((sceneId: string) => {
    audioMixerProManager.deleteScene(sceneId);
  }, []);

  // Settings
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    audioMixerProManager.updateSettings(newSettings);
  }, []);

  // Device actions
  const refreshDevices = useCallback(async () => {
    const inputs = await audioMixerProManager.getInputDevices();
    const outputs = await audioMixerProManager.getOutputDevices();
    setInputDevices(inputs);
    setOutputDevices(outputs);
  }, []);

  const refreshVSTPlugins = useCallback(async () => {
    const plugins = await audioMixerProManager.getVSTPlugins();
    setVstPlugins(plugins);
  }, []);

  // Computed values
  const activeTrackCount = tracks.filter(t => t.type !== 'master' && !t.mute).length;
  const mutedTrackCount = tracks.filter(t => t.mute).length;
  const soloedTrackCount = tracks.filter(t => t.solo).length;
  const masterTrack = tracks.find(t => t.id === 'master');

  return {
    tracks,
    settings,
    stats,
    inputDevices,
    outputDevices,
    scenes,
    vstPlugins,
    
    addTrack,
    removeTrack,
    updateTrack,
    
    addFilter,
    removeFilter,
    updateFilter,
    reorderFilters,
    
    loadScene,
    saveScene,
    deleteScene,
    
    updateSettings,
    
    refreshDevices,
    refreshVSTPlugins,
    
    activeTrackCount,
    mutedTrackCount,
    soloedTrackCount,
    masterTrack,
  };
};