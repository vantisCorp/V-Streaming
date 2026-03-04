import { useState, useEffect, useCallback } from 'react';
import websocketService, { StreamStatus, Scene, AudioTrack, ChatMessage, Notification, AnalyticsData } from '../services/WebSocketService';
import { ConnectionStatus } from '../services/WebSocketService';

interface WebSocketState {
  connectionStatus: ConnectionStatus;
  streamStatus: StreamStatus | null;
  scenes: Scene[];
  audioTracks: AudioTrack[];
  chatMessages: ChatMessage[];
  notifications: Notification[];
  analytics: AnalyticsData | null;
}

export const useWebSocket = () => {
  const [state, setState] = useState<WebSocketState>({
    connectionStatus: 'disconnected',
    streamStatus: null,
    scenes: [],
    audioTracks: [],
    chatMessages: [],
    notifications: [],
    analytics: null,
  });

  const connect = useCallback(async (desktopIP: string, port?: number) => {
    try {
      await websocketService.connect(desktopIP, port);
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  // Stream controls
  const startStream = useCallback(() => {
    websocketService.startStream();
  }, []);

  const stopStream = useCallback(() => {
    websocketService.stopStream();
  }, []);

  // Scene controls
  const getScenes = useCallback(() => {
    websocketService.getScenes();
  }, []);

  const switchScene = useCallback((sceneId: string) => {
    websocketService.switchScene(sceneId);
  }, []);

  // Audio controls
  const getAudioTracks = useCallback(() => {
    websocketService.getAudioTracks();
  }, []);

  const setVolume = useCallback((trackId: string, volume: number) => {
    websocketService.setVolume(trackId, volume);
  }, []);

  const toggleMute = useCallback((trackId: string) => {
    websocketService.toggleMute(trackId);
  }, []);

  // Chat actions
  const sendChatMessage = useCallback((message: string) => {
    websocketService.sendChatMessage(message);
  }, []);

  // VTuber controls
  const setVTuberExpression = useCallback((expression: string) => {
    websocketService.setVTuberExpression(expression);
  }, []);

  const toggleVTuberTracking = useCallback(() => {
    websocketService.toggleVTuberTracking();
  }, []);

  useEffect(() => {
    // Connection status
    const handleConnectionStatus = (status: ConnectionStatus) => {
      setState(prev => ({ ...prev, connectionStatus: status }));
    };

    // Stream events
    const handleStreamStatus = (status: StreamStatus) => {
      setState(prev => ({ ...prev, streamStatus: status }));
    };

    const handleStreamStarted = () => {
      setState(prev => ({
        ...prev,
        streamStatus: prev.streamStatus ? { ...prev.streamStatus, is_streaming: true } : null,
      }));
    };

    const handleStreamStopped = () => {
      setState(prev => ({
        ...prev,
        streamStatus: prev.streamStatus ? { ...prev.streamStatus, is_streaming: false } : null,
      }));
    };

    // Scene events
    const handleSceneList = (scenes: Scene[]) => {
      setState(prev => ({ ...prev, scenes }));
    };

    const handleSceneChanged = (scene: Scene) => {
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === scene.id ? scene : s),
      }));
    };

    // Audio events
    const handleAudioTracks = (tracks: AudioTrack[]) => {
      setState(prev => ({ ...prev, audioTracks: tracks }));
    };

    const handleAudioMeter = (data: { trackId: string; meter: number }) => {
      setState(prev => ({
        ...prev,
        audioTracks: prev.audioTracks.map(track =>
          track.id === data.trackId ? { ...track, meter: data.meter } : track
        ),
      }));
    };

    // Chat events
    const handleChatMessage = (message: ChatMessage) => {
      setState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, message].slice(-100), // Keep last 100 messages
      }));
    };

    // Notifications
    const handleNotification = (notification: Notification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(-50), // Keep last 50
      }));
    };

    // Analytics
    const handleAnalyticsUpdate = (data: AnalyticsData) => {
      setState(prev => ({ ...prev, analytics: data }));
    };

    // Register event listeners
    websocketService.on('connectionStatus', handleConnectionStatus);
    websocketService.on('streamStatus', handleStreamStatus);
    websocketService.on('streamStarted', handleStreamStarted);
    websocketService.on('streamStopped', handleStreamStopped);
    websocketService.on('sceneList', handleSceneList);
    websocketService.on('sceneChanged', handleSceneChanged);
    websocketService.on('audioTracks', handleAudioTracks);
    websocketService.on('audioMeter', handleAudioMeter);
    websocketService.on('chatMessage', handleChatMessage);
    websocketService.on('notification', handleNotification);
    websocketService.on('analyticsUpdate', handleAnalyticsUpdate);

    // Cleanup
    return () => {
      websocketService.off('connectionStatus', handleConnectionStatus);
      websocketService.off('streamStatus', handleStreamStatus);
      websocketService.off('streamStarted', handleStreamStarted);
      websocketService.off('streamStopped', handleStreamStopped);
      websocketService.off('sceneList', handleSceneList);
      websocketService.off('sceneChanged', handleSceneChanged);
      websocketService.off('audioTracks', handleAudioTracks);
      websocketService.off('audioMeter', handleAudioMeter);
      websocketService.off('chatMessage', handleChatMessage);
      websocketService.off('notification', handleNotification);
      websocketService.off('analyticsUpdate', handleAnalyticsUpdate);
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    startStream,
    stopStream,
    getScenes,
    switchScene,
    getAudioTracks,
    setVolume,
    toggleMute,
    sendChatMessage,
    setVTuberExpression,
    toggleVTuberTracking,
  };
};