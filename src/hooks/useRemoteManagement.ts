/**
 * useRemoteManagement - React hook for remote stream management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RemoteManagementService, RemoteManagementEvents } from '../services/RemoteManagementService';
import {
  RemoteConnectionStatus,
  RemoteCommand,
  RemotePermission,
  RemoteSessionType,
  RemoteServerConfig,
  RemoteClient,
  RemoteSession,
  RemoteCommandRequest,
  RemoteCommandResponse,
  RemoteStreamStatus,
  RemoteDashboardData,
  RemoteScene,
  RemoteAudioSource,
  RemoteEvent,
  RemoteChatMessage,
  RemoteAlert,
  RemoteManagementState,
  RemoteStatistics,
  DEFAULT_REMOTE_SERVER_CONFIG,
} from '../types/remote';

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface UseRemoteManagementReturn {
  // Server state
  isServerRunning: boolean;
  serverUrl: string | null;
  qrCode: string | null;
  serverConfig: RemoteServerConfig;
  
  // Connection state
  status: RemoteConnectionStatus;
  clients: RemoteClient[];
  statistics: RemoteStatistics;
  
  // Dashboard data
  dashboardData: RemoteDashboardData | null;
  streamStatus: RemoteStreamStatus | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Server actions
  startServer: () => Promise<boolean>;
  stopServer: () => Promise<void>;
  updateConfig: (config: Partial<RemoteServerConfig>) => void;
  regenerateAccessToken: () => string;
  
  // Client actions
  disconnectClient: (clientId: string) => boolean;
  
  // Command execution
  executeCommand: (command: RemoteCommand, params?: Record<string, unknown>) => Promise<RemoteCommandResponse>;
  
  // Stream control shortcuts
  startStream: () => Promise<RemoteCommandResponse>;
  stopStream: () => Promise<RemoteCommandResponse>;
  switchScene: (sceneId: string) => Promise<RemoteCommandResponse>;
  setVolume: (sourceId: string, volume: number) => Promise<RemoteCommandResponse>;
  toggleMute: (sourceId: string) => Promise<RemoteCommandResponse>;
  startRecording: () => Promise<RemoteCommandResponse>;
  stopRecording: () => Promise<RemoteCommandResponse>;
  takeSnapshot: () => Promise<RemoteCommandResponse>;
  sendChatMessage: (message: string) => Promise<RemoteCommandResponse>;
  triggerHotkey: (hotkeyId: string) => Promise<RemoteCommandResponse>;
  setExpression: (expressionId: string) => Promise<RemoteCommandResponse>;
  startBreak: () => Promise<RemoteCommandResponse>;
  endBreak: () => Promise<RemoteCommandResponse>;
  
  // Status updates
  setStreamStatus: (updates: Partial<RemoteStreamStatus>) => void;
  addChatMessage: (message: RemoteChatMessage) => void;
  addAlert: (alert: RemoteAlert) => void;
  addEvent: (event: RemoteEvent) => void;
  
  // Utility
  refreshState: () => void;
  dispose: () => void;
}

export function useRemoteManagement(): UseRemoteManagementReturn {
  const serviceRef = useRef<RemoteManagementService | null>(null);
  
  // State
  const [state, setState] = useState<RemoteManagementState>({
    status: RemoteConnectionStatus.DISCONNECTED,
    config: DEFAULT_REMOTE_SERVER_CONFIG,
    serverUrl: null,
    qrCode: null,
    clients: [],
    sessions: [],
    dashboardData: null,
    statistics: {
      totalConnections: 0,
      totalCommands: 0,
      averageResponseTime: 0,
      uptime: 0,
      errorsCount: 0,
      lastError: null,
    },
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize service reference
  useEffect(() => {
    serviceRef.current = RemoteManagementService.getInstance();
    
    const service = serviceRef.current;
    
    // Event handlers
    const handleServerStarted = (url: string) => {
      setIsLoading(false);
      setState(prev => ({
        ...prev,
        serverUrl: url,
        status: RemoteConnectionStatus.CONNECTED,
        error: null,
      }));
    };
    
    const handleServerStopped = () => {
      setIsLoading(false);
      setState(prev => ({
        ...prev,
        serverUrl: null,
        qrCode: null,
        status: RemoteConnectionStatus.DISCONNECTED,
        clients: [],
      }));
    };
    
    const handleClientConnected = (client: RemoteClient) => {
      setState(prev => ({
        ...prev,
        clients: [...prev.clients, client],
        statistics: {
          ...prev.statistics,
          totalConnections: prev.statistics.totalConnections + 1,
        },
      }));
    };
    
    const handleClientDisconnected = (clientId: string) => {
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== clientId),
      }));
    };
    
    const handleCommandExecuted = (response: RemoteCommandResponse) => {
      setState(prev => ({
        ...prev,
        statistics: {
          ...prev.statistics,
          totalCommands: prev.statistics.totalCommands + 1,
        },
      }));
    };
    
    const handleStatusUpdated = (status: RemoteStreamStatus) => {
      setState(prev => {
        if (!prev.dashboardData) return prev;
        return {
          ...prev,
          dashboardData: {
            ...prev.dashboardData,
            streamStatus: status,
          },
        };
      });
    };
    
    const handleStateChanged = (newState: RemoteManagementState) => {
      setState(newState);
    };
    
    const handleError = (error: string) => {
      setIsLoading(false);
      setState(prev => ({ ...prev, error }));
    };
    
    // Subscribe to events
    service.on('server:started', handleServerStarted);
    service.on('server:stopped', handleServerStopped);
    service.on('client:connected', handleClientConnected);
    service.on('client:disconnected', handleClientDisconnected);
    service.on('command:executed', handleCommandExecuted);
    service.on('status:updated', handleStatusUpdated);
    service.on('state:changed', handleStateChanged);
    service.on('error', handleError);
    
    // Sync initial state
    setState(service.getState());
    
    return () => {
      service.off('server:started', handleServerStarted);
      service.off('server:stopped', handleServerStopped);
      service.off('client:connected', handleClientConnected);
      service.off('client:disconnected', handleClientDisconnected);
      service.off('command:executed', handleCommandExecuted);
      service.off('status:updated', handleStatusUpdated);
      service.off('state:changed', handleStateChanged);
      service.off('error', handleError);
    };
  }, []);

  // Server actions
  const startServer = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;
    setIsLoading(true);
    setState(prev => ({ ...prev, error: null }));
    try {
      const result = await serviceRef.current.startServer();
      if (!result) {
        setIsLoading(false);
      }
      return result;
    } catch (error) {
      setIsLoading(false);
      setState(prev => ({ ...prev, error: String(error) }));
      return false;
    }
  }, []);

  const stopServer = useCallback(async (): Promise<void> => {
    if (!serviceRef.current) return;
    setIsLoading(true);
    try {
      await serviceRef.current.stopServer();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback((config: Partial<RemoteServerConfig>) => {
    if (!serviceRef.current) return;
    serviceRef.current.updateConfig(config);
  }, []);

  const regenerateAccessToken = useCallback((): string => {
    if (!serviceRef.current) return '';
    return serviceRef.current.regenerateAccessToken();
  }, []);

  // Client actions
  const disconnectClient = useCallback((clientId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.disconnectClient(clientId);
  }, []);

  // Command execution helper
  const executeCommand = useCallback(async (
    command: RemoteCommand, 
    params: Record<string, unknown> = {}
  ): Promise<RemoteCommandResponse> => {
    if (!serviceRef.current) {
      return {
        requestId: '',
        success: false,
        data: null,
        error: 'Service not initialized',
        timestamp: Date.now(),
      };
    }
    
    const request: RemoteCommandRequest = {
      id: generateUUID(),
      command,
      params,
      timestamp: Date.now(),
      clientId: 'local',
    };
    
    return serviceRef.current.executeCommand(request);
  }, []);

  // Stream control shortcuts
  const startStream = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.START_STREAM);
  }, [executeCommand]);

  const stopStream = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.STOP_STREAM);
  }, [executeCommand]);

  const switchScene = useCallback((sceneId: string): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.SWITCH_SCENE, { sceneId });
  }, [executeCommand]);

  const setVolume = useCallback((sourceId: string, volume: number): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.SET_VOLUME, { sourceId, volume });
  }, [executeCommand]);

  const toggleMute = useCallback((sourceId: string): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.TOGGLE_MUTE, { sourceId });
  }, [executeCommand]);

  const startRecording = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.START_RECORDING);
  }, [executeCommand]);

  const stopRecording = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.STOP_RECORDING);
  }, [executeCommand]);

  const takeSnapshot = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.TAKE_SNAPSHOT);
  }, [executeCommand]);

  const sendChatMessage = useCallback((message: string): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.SEND_CHAT_MESSAGE, { message });
  }, [executeCommand]);

  const triggerHotkey = useCallback((hotkeyId: string): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.TRIGGER_HOTKEY, { hotkeyId });
  }, [executeCommand]);

  const setExpression = useCallback((expressionId: string): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.SET_EXPRESSION, { expressionId });
  }, [executeCommand]);

  const startBreak = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.START_BREAK);
  }, [executeCommand]);

  const endBreak = useCallback((): Promise<RemoteCommandResponse> => {
    return executeCommand(RemoteCommand.END_BREAK);
  }, [executeCommand]);

  // Status updates
  const setStreamStatus = useCallback((updates: Partial<RemoteStreamStatus>) => {
    if (!serviceRef.current) return;
    serviceRef.current.setStreamStatus(updates);
  }, []);

  const addChatMessage = useCallback((message: RemoteChatMessage) => {
    if (!serviceRef.current) return;
    serviceRef.current.addChatMessage(message);
  }, []);

  const addAlert = useCallback((alert: RemoteAlert) => {
    if (!serviceRef.current) return;
    serviceRef.current.addAlert(alert);
  }, []);

  const addEvent = useCallback((event: RemoteEvent) => {
    if (!serviceRef.current) return;
    serviceRef.current.addEvent(event);
  }, []);

  // Utility
  const refreshState = useCallback(() => {
    if (!serviceRef.current) return;
    setState(serviceRef.current.getState());
  }, []);

  const dispose = useCallback(() => {
    if (!serviceRef.current) return;
    serviceRef.current.dispose();
    serviceRef.current = null;
  }, []);

  return {
    // Server state
    isServerRunning: state.status === RemoteConnectionStatus.CONNECTED,
    serverUrl: state.serverUrl,
    qrCode: state.qrCode,
    serverConfig: state.config,
    
    // Connection state
    status: state.status,
    clients: state.clients,
    statistics: state.statistics,
    
    // Dashboard data
    dashboardData: state.dashboardData,
    streamStatus: state.dashboardData?.streamStatus ?? null,
    
    // UI state
    isLoading,
    error: state.error,
    
    // Server actions
    startServer,
    stopServer,
    updateConfig,
    regenerateAccessToken,
    
    // Client actions
    disconnectClient,
    
    // Command execution
    executeCommand,
    
    // Stream control shortcuts
    startStream,
    stopStream,
    switchScene,
    setVolume,
    toggleMute,
    startRecording,
    stopRecording,
    takeSnapshot,
    sendChatMessage,
    triggerHotkey,
    setExpression,
    startBreak,
    endBreak,
    
    // Status updates
    setStreamStatus,
    addChatMessage,
    addAlert,
    addEvent,
    
    // Utility
    refreshState,
    dispose,
  };
}

export default useRemoteManagement;