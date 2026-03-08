import { useState, useEffect, useCallback, useRef } from 'react';
import OBSWebSocketService from '../services/OBSWebSocketService';
import {
  OBSConnectionConfig,
  OBSConnectionStatus,
  OBSScene,
  OBSSceneItem,
  OBSSource,
  OBSStreamStatus,
  OBSRecordStatus,
  OBSTransition,
  OBSInput,
  OBSVolumeMeter,
  OBSSceneCollection,
  OBSProfile,
  OBSFilter,
  OBSSceneItemTransform,
  OBSReplayBufferStatus,
  OBSVirtualCameraStatus,
  OBSStudioModeStatus,
  OBSMediaInputStatus,
  OBSStats,
  OBSMonitorType,
} from '../types/obsWebSocket';

export interface UseOBSWebSocketReturn {
  // Connection State
  isConnected: boolean;
  connectionStatus: OBSConnectionStatus;
  config: OBSConnectionConfig | null;
  
  // Connection Actions
  connect: (config: OBSConnectionConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Scene Management
  scenes: OBSScene[];
  currentScene: string;
  getScenes: () => Promise<OBSScene[]>;
  switchScene: (sceneName: string) => Promise<void>;
  getSceneItems: (sceneName: string) => Promise<OBSSceneItem[]>;
  
  // Stream Control
  streamStatus: OBSStreamStatus | null;
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
  toggleStream: () => Promise<void>;
  getStreamStatus: () => Promise<OBSStreamStatus>;
  
  // Recording Control
  recordStatus: OBSRecordStatus | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  toggleRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  getRecordStatus: () => Promise<OBSRecordStatus>;
  
  // Source Management
  sources: OBSSource[];
  getSources: () => Promise<OBSSource[]>;
  getSourceSettings: (sourceName: string) => Promise<any>;
  setSourceSettings: (sourceName: string, settings: any) => Promise<void>;
  
  // Input Management
  inputs: OBSInput[];
  getInputs: () => Promise<OBSInput[]>;
  setInputMute: (inputName: string, muted: boolean) => Promise<void>;
  toggleInputMute: (inputName: string) => Promise<boolean>;
  setInputVolume: (inputName: string, volume: number) => Promise<void>;
  getInputVolume: (inputName: string) => Promise<number>;
  
  // Transition Management
  transitions: OBSTransition[];
  currentTransition: OBSTransition | null;
  getTransitions: () => Promise<OBSTransition[]>;
  getCurrentTransition: () => Promise<OBSTransition>;
  setCurrentTransition: (transitionName: string) => Promise<void>;
  setTransitionDuration: (duration: number) => Promise<void>;
  triggerTransition: () => Promise<void>;
  
  // Volume Meters
  volumeMeters: OBSVolumeMeter[];
  
  // Scene Collection Management
  sceneCollections: OBSSceneCollection[];
  currentSceneCollection: string;
  getSceneCollections: () => Promise<OBSSceneCollection[]>;
  setCurrentSceneCollection: (collectionName: string) => Promise<void>;
  createSceneCollection: (collectionName: string) => Promise<void>;
  
  // Profile Management
  profiles: OBSProfile[];
  currentProfile: string;
  getProfiles: () => Promise<OBSProfile[]>;
  setCurrentProfile: (profileName: string) => Promise<void>;
  createProfile: (profileName: string) => Promise<void>;
  
  // Scene Item Management
  createSceneItem: (sceneName: string, sourceName: string, transform?: OBSSceneItemTransform) => Promise<number>;
  removeSceneItem: (sceneName: string, sceneItemId: number) => Promise<void>;
  setSceneItemTransform: (sceneName: string, sceneItemId: number, transform: Partial<OBSSceneItemTransform>) => Promise<void>;
  setSceneItemEnabled: (sceneName: string, sceneItemId: number, enabled: boolean) => Promise<void>;
  
  // Filter Management
  getSourceFilters: (sourceName: string) => Promise<OBSFilter[]>;
  createSourceFilter: (sourceName: string, filterName: string, filterKind: string, settings?: Record<string, unknown>) => Promise<void>;
  removeSourceFilter: (sourceName: string, filterName: string) => Promise<void>;
  setSourceFilterEnabled: (sourceName: string, filterName: string, enabled: boolean) => Promise<void>;
  setSourceFilterSettings: (sourceName: string, filterName: string, settings: Record<string, unknown>) => Promise<void>;
  
  // Replay Buffer
  replayBufferStatus: OBSReplayBufferStatus | null;
  getReplayBufferStatus: () => Promise<OBSReplayBufferStatus>;
  startReplayBuffer: () => Promise<void>;
  stopReplayBuffer: () => Promise<void>;
  saveReplayBuffer: () => Promise<void>;
  
  // Virtual Camera
  virtualCameraStatus: OBSVirtualCameraStatus | null;
  getVirtualCameraStatus: () => Promise<OBSVirtualCameraStatus>;
  startVirtualCamera: () => Promise<void>;
  stopVirtualCamera: () => Promise<void>;
  
  // Studio Mode
  studioModeStatus: OBSStudioModeStatus | null;
  getStudioModeStatus: () => Promise<OBSStudioModeStatus>;
  setStudioModeEnabled: (enabled: boolean) => Promise<void>;
  setPreviewScene: (sceneName: string) => Promise<void>;
  triggerStudioModeTransition: () => Promise<void>;
  
  // Media Inputs
  getMediaInputStatus: (inputName: string) => Promise<OBSMediaInputStatus>;
  playMediaInput: (inputName: string) => Promise<void>;
  pauseMediaInput: (inputName: string) => Promise<void>;
  stopMediaInput: (inputName: string) => Promise<void>;
  restartMediaInput: (inputName: string) => Promise<void>;
  
  // Stats
  stats: OBSStats | null;
  getStats: () => Promise<OBSStats>;
  
  // Recording Advanced
  resumeRecording: () => Promise<void>;
  splitRecordFile: () => Promise<void>;
  
  // Hotkeys
  triggerHotkey: (hotkeyName: string) => Promise<void>;
  
  // Event Handlers
  onSceneChanged: (callback: (sceneName: string) => void) => void;
  onStreamStarted: (callback: () => void) => void;
  onStreamStopped: (callback: () => void) => void;
  onRecordingStarted: (callback: () => void) => void;
  onRecordingStopped: (callback: () => void) => void;
  onRecordingPaused: (callback: () => void) => void;
  onRecordingResumed: (callback: () => void) => void;
}

export function useOBSWebSocket(): UseOBSWebSocketReturn {
  // @ts-ignore - Type assertion for singleton pattern
  const serviceRef = useRef<OBSWebSocketService>(OBSWebSocketService.getInstance());
  
  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<OBSConnectionStatus>(OBSConnectionStatus.DISCONNECTED);
  const [config, setConfig] = useState<OBSConnectionConfig | null>(null);
  
  // Scene State
  const [scenes, setScenes] = useState<OBSScene[]>([]);
  const [currentScene, setCurrentScene] = useState<string>('');
  
  // Stream State
  const [streamStatus, setStreamStatus] = useState<OBSStreamStatus | null>(null);
  
  // Recording State
  const [recordStatus, setRecordStatus] = useState<OBSRecordStatus | null>(null);
  
  // Source State
  const [sources, setSources] = useState<OBSSource[]>([]);
  
  // Input State
  const [inputs, setInputs] = useState<OBSInput[]>([]);
  
  // Transition State
  const [transitions, setTransitions] = useState<OBSTransition[]>([]);
  const [currentTransition, setCurrentTransition] = useState<OBSTransition | null>(null);
  
  // Volume Meters
  const [volumeMeters, setVolumeMeters] = useState<OBSVolumeMeter[]>([]);
  
  // Scene Collection State
  const [sceneCollections, setSceneCollections] = useState<OBSSceneCollection[]>([]);
  const [currentSceneCollection, setCurrentSceneCollection] = useState<string>('');
  
  // Profile State
  const [profiles, setProfiles] = useState<OBSProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('');
  
  // Replay Buffer State
  const [replayBufferStatus, setReplayBufferStatus] = useState<OBSReplayBufferStatus | null>(null);
  
  // Virtual Camera State
  const [virtualCameraStatus, setVirtualCameraStatus] = useState<OBSVirtualCameraStatus | null>(null);
  
  // Studio Mode State
  const [studioModeStatus, setStudioModeStatus] = useState<OBSStudioModeStatus | null>(null);
  
  // Stats State
  const [stats, setStats] = useState<OBSStats | null>(null);
  
  // Event Handlers Refs
  const eventHandlersRef = useRef<{
    sceneChanged: ((sceneName: string) => void)[];
    streamStarted: (() => void)[];
    streamStopped: (() => void)[];
    recordingStarted: (() => void)[];
    recordingStopped: (() => void)[];
    recordingPaused: (() => void)[];
    recordingResumed: (() => void)[];
  }>({
    sceneChanged: [],
    streamStarted: [],
    streamStopped: [],
    recordingStarted: [],
    recordingStopped: [],
    recordingPaused: [],
    recordingResumed: []
  });
  
  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  useEffect(() => {
    const service = serviceRef.current;
    
    // Connection status listeners
    const handleConnectionStatusChanged = (status: OBSConnectionStatus) => {
      setConnectionStatus(status);
      setIsConnected(status === OBSConnectionStatus.CONNECTED);
    };
    
    // Scene listeners
    const handleSceneChanged = (sceneName: string) => {
      setCurrentScene(sceneName);
      eventHandlersRef.current.sceneChanged.forEach(handler => handler(sceneName));
    };
    
    // Stream listeners
    const handleStreamStarted = () => {
      eventHandlersRef.current.streamStarted.forEach(handler => handler());
    };
    
    const handleStreamStopped = () => {
      eventHandlersRef.current.streamStopped.forEach(handler => handler());
    };
    
    // Recording listeners
    const handleRecordingStarted = () => {
      eventHandlersRef.current.recordingStarted.forEach(handler => handler());
    };
    
    const handleRecordingStopped = () => {
      eventHandlersRef.current.recordingStopped.forEach(handler => handler());
    };
    
    const handleRecordingPaused = () => {
      eventHandlersRef.current.recordingPaused.forEach(handler => handler());
    };
    
    const handleRecordingResumed = () => {
      eventHandlersRef.current.recordingResumed.forEach(handler => handler());
    };
    
    // Volume meters listener
    const handleVolumeMeters = (meters: OBSVolumeMeter[]) => {
      setVolumeMeters(meters);
    };
    
    // Register event listeners
    service.on('connection-status-changed', handleConnectionStatusChanged);
    service.on('scene-changed', handleSceneChanged);
    service.on('stream-started', handleStreamStarted);
    service.on('stream-stopped', handleStreamStopped);
    service.on('recording-started', handleRecordingStarted);
    service.on('recording-stopped', handleRecordingStopped);
    service.on('recording-paused', handleRecordingPaused);
    service.on('recording-resumed', handleRecordingResumed);
    service.on('input-volume-meters', handleVolumeMeters);
    
    return () => {
      service.off('connection-status-changed', handleConnectionStatusChanged);
      service.off('scene-changed', handleSceneChanged);
      service.off('stream-started', handleStreamStarted);
      service.off('stream-stopped', handleStreamStopped);
      service.off('recording-started', handleRecordingStarted);
      service.off('recording-stopped', handleRecordingStopped);
      service.off('recording-paused', handleRecordingPaused);
      service.off('recording-resumed', handleRecordingResumed);
      service.off('input-volume-meters', handleVolumeMeters);
    };
  }, []);
  
  // ==========================================================================
  // CONNECTION ACTIONS
  // ==========================================================================
  
  const connect = useCallback(async (connectionConfig: OBSConnectionConfig) => {
    const service = serviceRef.current;
    await service.connect(connectionConfig);
    setConfig(connectionConfig);
    
    // Load initial data
    if (service.isConnected()) {
      try {
        const sceneList = await service.getScenes();
        setScenes(sceneList);
        const currentSceneName = await service.getCurrentScene();
        setCurrentScene(currentSceneName);
        
        const streamStatus = await service.getStreamStatus();
        setStreamStatus(streamStatus);
        
        const recordStatus = await service.getRecordStatus();
        setRecordStatus(recordStatus);
        
        const sourceList = await service.getSources();
        setSources(sourceList);
        
        const inputList = await service.getInputs();
        setInputs(inputList);
        
        const transitionList = await service.getTransitions();
        setTransitions(transitionList);
        
        const currentTrans = await service.getCurrentTransition();
        setCurrentTransition(currentTrans);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    }
  }, []);
  
  const disconnect = useCallback(async () => {
    const service = serviceRef.current;
    await service.disconnect();
    setConfig(null);
    
    // Clear state
    setScenes([]);
    setCurrentScene('');
    setStreamStatus(null);
    setRecordStatus(null);
    setSources([]);
    setInputs([]);
    setTransitions([]);
    setCurrentTransition(null);
    setVolumeMeters([]);
  }, []);
  
  // ==========================================================================
  // SCENE MANAGEMENT
  // ==========================================================================
  
  const getScenesCallback = useCallback(async (): Promise<OBSScene[]> => {
    const service = serviceRef.current;
    const sceneList = await service.getScenes();
    setScenes(sceneList);
    return sceneList;
  }, []);
  
  const switchSceneCallback = useCallback(async (sceneName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.switchScene(sceneName);
    setCurrentScene(sceneName);
  }, []);
  
  const getSceneItemsCallback = useCallback(async (sceneName: string): Promise<OBSSceneItem[]> => {
    const service = serviceRef.current;
    return await service.getSceneItems(sceneName);
  }, []);
  
  // ==========================================================================
  // STREAM CONTROL
  // ==========================================================================
  
  const startStreamingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.startStreaming();
    const status = await service.getStreamStatus();
    setStreamStatus(status);
  }, []);
  
  const stopStreamingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.stopStreaming();
    const status = await service.getStreamStatus();
    setStreamStatus(status);
  }, []);
  
  const toggleStreamCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.toggleStream();
    const status = await service.getStreamStatus();
    setStreamStatus(status);
  }, []);
  
  const getStreamStatusCallback = useCallback(async (): Promise<OBSStreamStatus> => {
    const service = serviceRef.current;
    const status = await service.getStreamStatus();
    setStreamStatus(status);
    return status;
  }, []);
  
  // ==========================================================================
  // RECORDING CONTROL
  // ==========================================================================
  
  const startRecordingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.startRecording();
    const status = await service.getRecordStatus();
    setRecordStatus(status);
  }, []);
  
  const stopRecordingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.stopRecording();
    const status = await service.getRecordStatus();
    setRecordStatus(status);
  }, []);
  
  const toggleRecordingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.toggleRecording();
    const status = await service.getRecordStatus();
    setRecordStatus(status);
  }, []);
  
  const pauseRecordingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.pauseRecording();
    const status = await service.getRecordStatus();
    setRecordStatus(status);
  }, []);
  
  const getRecordStatusCallback = useCallback(async (): Promise<OBSRecordStatus> => {
    const service = serviceRef.current;
    const status = await service.getRecordStatus();
    setRecordStatus(status);
    return status;
  }, []);
  
  // ==========================================================================
  // SOURCE MANAGEMENT
  // ==========================================================================
  
  const getSourcesCallback = useCallback(async (): Promise<OBSSource[]> => {
    const service = serviceRef.current;
    const sourceList = await service.getSources();
    setSources(sourceList);
    return sourceList;
  }, []);
  
  const getSourceSettingsCallback = useCallback(async (sourceName: string): Promise<any> => {
    const service = serviceRef.current;
    return await service.getSourceSettings(sourceName);
  }, []);
  
  const setSourceSettingsCallback = useCallback(async (sourceName: string, settings: any): Promise<void> => {
    const service = serviceRef.current;
    await service.setSourceSettings(sourceName, settings);
  }, []);
  
  // ==========================================================================
  // INPUT MANAGEMENT
  // ==========================================================================
  
  const getInputsCallback = useCallback(async (): Promise<OBSInput[]> => {
    const service = serviceRef.current;
    const inputList = await service.getInputs();
    setInputs(inputList);
    return inputList;
  }, []);
  
  const setInputMuteCallback = useCallback(async (inputName: string, muted: boolean): Promise<void> => {
    const service = serviceRef.current;
    await service.setInputMute(inputName, muted);
    const inputList = await service.getInputs();
    setInputs(inputList);
  }, []);
  
  const toggleInputMuteCallback = useCallback(async (inputName: string): Promise<boolean> => {
    const service = serviceRef.current;
    const muted = await service.toggleInputMute(inputName);
    const inputList = await service.getInputs();
    setInputs(inputList);
    return muted;
  }, []);
  
  const setInputVolumeCallback = useCallback(async (inputName: string, volume: number): Promise<void> => {
    const service = serviceRef.current;
    await service.setInputVolume(inputName, volume);
  }, []);
  
  const getInputVolumeCallback = useCallback(async (inputName: string): Promise<number> => {
    const service = serviceRef.current;
    return await service.getInputVolume(inputName);
  }, []);
  
  // ==========================================================================
  // TRANSITION MANAGEMENT
  // ==========================================================================
  
  const getTransitionsCallback = useCallback(async (): Promise<OBSTransition[]> => {
    const service = serviceRef.current;
    const transitionList = await service.getTransitions();
    setTransitions(transitionList);
    return transitionList;
  }, []);
  
  const getCurrentTransitionCallback = useCallback(async (): Promise<OBSTransition> => {
    const service = serviceRef.current;
    const trans = await service.getCurrentTransition();
    setCurrentTransition(trans);
    return trans;
  }, []);
  
  const setCurrentTransitionCallback = useCallback(async (transitionName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.setCurrentTransition(transitionName);
    const trans = await service.getCurrentTransition();
    setCurrentTransition(trans);
  }, []);
  
  const setTransitionDurationCallback = useCallback(async (duration: number): Promise<void> => {
    const service = serviceRef.current;
    await service.setTransitionDuration(duration);
    const trans = await service.getCurrentTransition();
    setCurrentTransition(trans);
  }, []);
  
  const triggerTransitionCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.triggerTransition();
  }, []);
  
  // ==========================================================================
  // SCENE COLLECTION MANAGEMENT
  // ==========================================================================
  
  const getSceneCollectionsCallback = useCallback(async (): Promise<OBSSceneCollection[]> => {
    const service = serviceRef.current;
    const collections = await service.getSceneCollections();
    setSceneCollections(collections);
    return collections;
  }, []);
  
  const setCurrentSceneCollectionCallback = useCallback(async (collectionName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.setCurrentSceneCollection(collectionName);
    setCurrentSceneCollection(collectionName);
  }, []);
  
  const createSceneCollectionCallback = useCallback(async (collectionName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.createSceneCollection(collectionName);
    const collections = await service.getSceneCollections();
    setSceneCollections(collections);
  }, []);
  
  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================
  
  const getProfilesCallback = useCallback(async (): Promise<OBSProfile[]> => {
    const service = serviceRef.current;
    const profileList = await service.getProfiles();
    setProfiles(profileList);
    return profileList;
  }, []);
  
  const setCurrentProfileCallback = useCallback(async (profileName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.setCurrentProfile(profileName);
    setCurrentProfile(profileName);
  }, []);
  
  const createProfileCallback = useCallback(async (profileName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.createProfile(profileName);
    const profileList = await service.getProfiles();
    setProfiles(profileList);
  }, []);
  
  // ==========================================================================
  // SCENE ITEM MANAGEMENT
  // ==========================================================================
  
  const createSceneItemCallback = useCallback(async (sceneName: string, sourceName: string, transform?: OBSSceneItemTransform): Promise<number> => {
    const service = serviceRef.current;
    return await service.createSceneItem(sceneName, sourceName, transform);
  }, []);
  
  const removeSceneItemCallback = useCallback(async (sceneName: string, sceneItemId: number): Promise<void> => {
    const service = serviceRef.current;
    await service.removeSceneItem(sceneName, sceneItemId);
  }, []);
  
  const setSceneItemTransformCallback = useCallback(async (sceneName: string, sceneItemId: number, transform: Partial<OBSSceneItemTransform>): Promise<void> => {
    const service = serviceRef.current;
    await service.setSceneItemTransform(sceneName, sceneItemId, transform);
  }, []);
  
  const setSceneItemEnabledCallback = useCallback(async (sceneName: string, sceneItemId: number, enabled: boolean): Promise<void> => {
    const service = serviceRef.current;
    await service.setSceneItemEnabled(sceneName, sceneItemId, enabled);
  }, []);
  
  // ==========================================================================
  // FILTER MANAGEMENT
  // ==========================================================================
  
  const getSourceFiltersCallback = useCallback(async (sourceName: string): Promise<OBSFilter[]> => {
    const service = serviceRef.current;
    return await service.getSourceFilters(sourceName);
  }, []);
  
  const createSourceFilterCallback = useCallback(async (sourceName: string, filterName: string, filterKind: string, settings?: Record<string, unknown>): Promise<void> => {
    const service = serviceRef.current;
    await service.createSourceFilter(sourceName, filterName, filterKind, settings);
  }, []);
  
  const removeSourceFilterCallback = useCallback(async (sourceName: string, filterName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.removeSourceFilter(sourceName, filterName);
  }, []);
  
  const setSourceFilterEnabledCallback = useCallback(async (sourceName: string, filterName: string, enabled: boolean): Promise<void> => {
    const service = serviceRef.current;
    await service.setSourceFilterEnabled(sourceName, filterName, enabled);
  }, []);
  
  const setSourceFilterSettingsCallback = useCallback(async (sourceName: string, filterName: string, settings: Record<string, unknown>): Promise<void> => {
    const service = serviceRef.current;
    await service.setSourceFilterSettings(sourceName, filterName, settings);
  }, []);
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  const getReplayBufferStatusCallback = useCallback(async (): Promise<OBSReplayBufferStatus> => {
    const service = serviceRef.current;
    const status = await service.getReplayBufferStatus();
    setReplayBufferStatus(status);
    return status;
  }, []);
  
  const startReplayBufferCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.startReplayBuffer();
    const status = await service.getReplayBufferStatus();
    setReplayBufferStatus(status);
  }, []);
  
  const stopReplayBufferCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.stopReplayBuffer();
    const status = await service.getReplayBufferStatus();
    setReplayBufferStatus(status);
  }, []);
  
  const saveReplayBufferCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.saveReplayBuffer();
  }, []);
  
  // ==========================================================================
  // VIRTUAL CAMERA
  // ==========================================================================
  
  const getVirtualCameraStatusCallback = useCallback(async (): Promise<OBSVirtualCameraStatus> => {
    const service = serviceRef.current;
    const status = await service.getVirtualCameraStatus();
    setVirtualCameraStatus(status);
    return status;
  }, []);
  
  const startVirtualCameraCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.startVirtualCamera();
    const status = await service.getVirtualCameraStatus();
    setVirtualCameraStatus(status);
  }, []);
  
  const stopVirtualCameraCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.stopVirtualCamera();
    const status = await service.getVirtualCameraStatus();
    setVirtualCameraStatus(status);
  }, []);
  
  // ==========================================================================
  // STUDIO MODE
  // ==========================================================================
  
  const getStudioModeStatusCallback = useCallback(async (): Promise<OBSStudioModeStatus> => {
    const service = serviceRef.current;
    const status = await service.getStudioModeStatus();
    setStudioModeStatus(status);
    return status;
  }, []);
  
  const setStudioModeEnabledCallback = useCallback(async (enabled: boolean): Promise<void> => {
    const service = serviceRef.current;
    await service.setStudioModeEnabled(enabled);
    const status = await service.getStudioModeStatus();
    setStudioModeStatus(status);
  }, []);
  
  const setPreviewSceneCallback = useCallback(async (sceneName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.setPreviewScene(sceneName);
  }, []);
  
  const triggerStudioModeTransitionCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.triggerTransition();
  }, []);
  
  // ==========================================================================
  // MEDIA INPUTS
  // ==========================================================================
  
  const getMediaInputStatusCallback = useCallback(async (inputName: string): Promise<OBSMediaInputStatus> => {
    const service = serviceRef.current;
    return await service.getMediaInputStatus(inputName);
  }, []);
  
  const playMediaInputCallback = useCallback(async (inputName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.playMediaInput(inputName);
  }, []);
  
  const pauseMediaInputCallback = useCallback(async (inputName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.pauseMediaInput(inputName);
  }, []);
  
  const stopMediaInputCallback = useCallback(async (inputName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.stopMediaInput(inputName);
  }, []);
  
  const restartMediaInputCallback = useCallback(async (inputName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.restartMediaInput(inputName);
  }, []);
  
  // ==========================================================================
  // STATS
  // ==========================================================================
  
  const getStatsCallback = useCallback(async (): Promise<OBSStats> => {
    const service = serviceRef.current;
    const statsData = await service.getStats();
    setStats(statsData);
    return statsData;
  }, []);
  
  // ==========================================================================
  // RECORDING (Advanced)
  // ==========================================================================
  
  const resumeRecordingCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.resumeRecording();
  }, []);
  
  const splitRecordFileCallback = useCallback(async (): Promise<void> => {
    const service = serviceRef.current;
    await service.splitRecordFile();
  }, []);
  
  // ==========================================================================
  // HOTKEYS
  // ==========================================================================
  
  const triggerHotkeyCallback = useCallback(async (hotkeyName: string): Promise<void> => {
    const service = serviceRef.current;
    await service.triggerHotkey(hotkeyName);
  }, []);
  
  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  
  const onSceneChanged = useCallback((callback: (sceneName: string) => void) => {
    eventHandlersRef.current.sceneChanged.push(callback);
  }, []);
  
  const onStreamStarted = useCallback((callback: () => void) => {
    eventHandlersRef.current.streamStarted.push(callback);
  }, []);
  
  const onStreamStopped = useCallback((callback: () => void) => {
    eventHandlersRef.current.streamStopped.push(callback);
  }, []);
  
  const onRecordingStarted = useCallback((callback: () => void) => {
    eventHandlersRef.current.recordingStarted.push(callback);
  }, []);
  
  const onRecordingStopped = useCallback((callback: () => void) => {
    eventHandlersRef.current.recordingStopped.push(callback);
  }, []);
  
  const onRecordingPaused = useCallback((callback: () => void) => {
    eventHandlersRef.current.recordingPaused.push(callback);
  }, []);
  
  const onRecordingResumed = useCallback((callback: () => void) => {
    eventHandlersRef.current.recordingResumed.push(callback);
  }, []);
  
  // ==========================================================================
  // RETURN
  // ==========================================================================
  
  return {
    // Connection State
    isConnected,
    connectionStatus,
    config,
    
    // Connection Actions
    connect,
    disconnect,
    
    // Scene Management
    scenes,
    currentScene,
    getScenes: getScenesCallback,
    switchScene: switchSceneCallback,
    getSceneItems: getSceneItemsCallback,
    
    // Stream Control
    streamStatus,
    startStreaming: startStreamingCallback,
    stopStreaming: stopStreamingCallback,
    toggleStream: toggleStreamCallback,
    getStreamStatus: getStreamStatusCallback,
    
    // Recording Control
    recordStatus,
    startRecording: startRecordingCallback,
    stopRecording: stopRecordingCallback,
    toggleRecording: toggleRecordingCallback,
    pauseRecording: pauseRecordingCallback,
    getRecordStatus: getRecordStatusCallback,
    
    // Source Management
    sources,
    getSources: getSourcesCallback,
    getSourceSettings: getSourceSettingsCallback,
    setSourceSettings: setSourceSettingsCallback,
    
    // Input Management
    inputs,
    getInputs: getInputsCallback,
    setInputMute: setInputMuteCallback,
    toggleInputMute: toggleInputMuteCallback,
    setInputVolume: setInputVolumeCallback,
    getInputVolume: getInputVolumeCallback,
    
    // Transition Management
    transitions,
    currentTransition,
    getTransitions: getTransitionsCallback,
    getCurrentTransition: getCurrentTransitionCallback,
    setCurrentTransition: setCurrentTransitionCallback,
    setTransitionDuration: setTransitionDurationCallback,
    triggerTransition: triggerTransitionCallback,
    
    // Volume Meters
    volumeMeters,
    
    // Scene Collection Management
    sceneCollections,
    currentSceneCollection,
    getSceneCollections: getSceneCollectionsCallback,
    setCurrentSceneCollection: setCurrentSceneCollectionCallback,
    createSceneCollection: createSceneCollectionCallback,
    
    // Profile Management
    profiles,
    currentProfile,
    getProfiles: getProfilesCallback,
    setCurrentProfile: setCurrentProfileCallback,
    createProfile: createProfileCallback,
    
    // Scene Item Management
    createSceneItem: createSceneItemCallback,
    removeSceneItem: removeSceneItemCallback,
    setSceneItemTransform: setSceneItemTransformCallback,
    setSceneItemEnabled: setSceneItemEnabledCallback,
    
    // Filter Management
    getSourceFilters: getSourceFiltersCallback,
    createSourceFilter: createSourceFilterCallback,
    removeSourceFilter: removeSourceFilterCallback,
    setSourceFilterEnabled: setSourceFilterEnabledCallback,
    setSourceFilterSettings: setSourceFilterSettingsCallback,
    
    // Replay Buffer
    replayBufferStatus,
    getReplayBufferStatus: getReplayBufferStatusCallback,
    startReplayBuffer: startReplayBufferCallback,
    stopReplayBuffer: stopReplayBufferCallback,
    saveReplayBuffer: saveReplayBufferCallback,
    
    // Virtual Camera
    virtualCameraStatus,
    getVirtualCameraStatus: getVirtualCameraStatusCallback,
    startVirtualCamera: startVirtualCameraCallback,
    stopVirtualCamera: stopVirtualCameraCallback,
    
    // Studio Mode
    studioModeStatus,
    getStudioModeStatus: getStudioModeStatusCallback,
    setStudioModeEnabled: setStudioModeEnabledCallback,
    setPreviewScene: setPreviewSceneCallback,
    triggerStudioModeTransition: triggerStudioModeTransitionCallback,
    
    // Media Inputs
    getMediaInputStatus: getMediaInputStatusCallback,
    playMediaInput: playMediaInputCallback,
    pauseMediaInput: pauseMediaInputCallback,
    stopMediaInput: stopMediaInputCallback,
    restartMediaInput: restartMediaInputCallback,
    
    // Stats
    stats,
    getStats: getStatsCallback,
    
    // Recording Advanced
    resumeRecording: resumeRecordingCallback,
    splitRecordFile: splitRecordFileCallback,
    
    // Hotkeys
    triggerHotkey: triggerHotkeyCallback,
    
    // Event Handlers
    onSceneChanged,
    onStreamStarted,
    onStreamStopped,
    onRecordingStarted,
    onRecordingStopped,
    onRecordingPaused,
    onRecordingResumed
  };
}