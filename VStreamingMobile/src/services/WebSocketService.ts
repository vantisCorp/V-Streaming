import { EventEmitter } from 'events';
import { io, Socket } from 'socket.io-client';
import { StreamStatus, Scene, AudioTrack, ChatMessage, Notification, AnalyticsData, VTuberModel } from '../types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class WebSocketService extends EventEmitter {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private desktopIP: string = '';
  private desktopPort: number = 8080;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    super();
  }

  async connect(desktopIP: string, port: number = 8080): Promise<void> {
    this.desktopIP = desktopIP;
    this.desktopPort = port;
    this.connectionStatus = 'connecting';
    this.emit('connectionStatus', this.connectionStatus);

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`http://${desktopIP}:${port}`, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        this.setupEventHandlers();
        
        this.socket!.on('connect', () => {
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.emit('connectionStatus', this.connectionStatus);
          resolve();
        });

        this.socket!.on('connect_error', (error: Error) => {
          this.connectionStatus = 'error';
          this.emit('connectionStatus', this.connectionStatus);
          this.emit('error', error);
          reject(error);
        });
      } catch (error) {
        this.connectionStatus = 'error';
        this.emit('connectionStatus', this.connectionStatus);
        reject(error);
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', () => {
      this.connectionStatus = 'disconnected';
      this.emit('connectionStatus', this.connectionStatus);
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      this.reconnectAttempts = attempt;
      this.emit('reconnectAttempt', attempt);
    });

    // Stream events
    this.socket.on('stream:status', (status: StreamStatus) => {
      this.emit('streamStatus', status);
    });

    this.socket.on('stream:started', () => {
      this.emit('streamStarted');
    });

    this.socket.on('stream:stopped', () => {
      this.emit('streamStopped');
    });

    // Scene events
    this.socket.on('scene:list', (scenes: Scene[]) => {
      this.emit('sceneList', scenes);
    });

    this.socket.on('scene:changed', (scene: Scene) => {
      this.emit('sceneChanged', scene);
    });

    // Audio events
    this.socket.on('audio:tracks', (tracks: AudioTrack[]) => {
      this.emit('audioTracks', tracks);
    });

    this.socket.on('audio:meter', (data: { trackId: string; meter: number }) => {
      this.emit('audioMeter', data);
    });

    // Chat events
    this.socket.on('chat:message', (message: ChatMessage) => {
      this.emit('chatMessage', message);
    });

    // Notifications
    this.socket.on('notification', (notification: Notification) => {
      this.emit('notification', notification);
    });

    // Analytics events
    this.socket.on('analytics:update', (data: AnalyticsData) => {
      this.emit('analyticsUpdate', data);
    });

    // VTuber events
    this.socket.on('vtuber:model', (model: VTuberModel) => {
      this.emit('vtuberModel', model);
    });
  }

  // Stream controls
  startStream(): void {
    this.socket?.emit('stream:start');
  }

  stopStream(): void {
    this.socket?.emit('stream:stop');
  }

  // Scene controls
  getScenes(): void {
    this.socket?.emit('scene:get');
  }

  switchScene(sceneId: string): void {
    this.socket?.emit('scene:switch', { sceneId });
  }

  // Audio controls
  getAudioTracks(): void {
    this.socket?.emit('audio:get');
  }

  setVolume(trackId: string, volume: number): void {
    this.socket?.emit('audio:volume', { trackId, volume });
  }

  toggleMute(trackId: string): void {
    this.socket?.emit('audio:mute', { trackId });
  }

  // Chat actions
  sendChatMessage(message: string): void {
    this.socket?.emit('chat:send', { message });
  }

  // VTuber controls
  setVTuberExpression(expression: string): void {
    this.socket?.emit('vtuber:expression', { expression });
  }

  toggleVTuberTracking(): void {
    this.socket?.emit('vtuber:toggle_tracking');
  }

  // Getters
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.emit('connectionStatus', this.connectionStatus);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;