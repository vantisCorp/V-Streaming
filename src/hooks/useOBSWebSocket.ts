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
  OBSVolumeMeter
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