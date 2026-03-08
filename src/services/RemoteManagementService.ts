/**
 * RemoteManagementService - Service for remote stream management
 * Enables web-based remote control of streaming features
 */

import { EventEmitter } from 'eventemitter3';
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
  DEFAULT_REMOTE_STREAM_STATUS,
  DEFAULT_REMOTE_STATISTICS,
  DEFAULT_REMOTE_MANAGEMENT_STATE,
} from '../types/remote';

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Simple token generator
const generateToken = (): string => {
  return Array.from({ length: 32 }, () => 
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
};

// ============ Events ============

export interface RemoteManagementEvents {
  'server:started': (url: string) => void;
  'server:stopped': () => void;
  'client:connected': (client: RemoteClient) => void;
  'client:disconnected': (clientId: string) => void;
  'command:received': (request: RemoteCommandRequest) => void;
  'command:executed': (response: RemoteCommandResponse) => void;
  'status:updated': (status: RemoteStreamStatus) => void;
  'state:changed': (state: RemoteManagementState) => void;
  'error': (error: string) => void;
}

// ============ Service ============

export class RemoteManagementService extends EventEmitter<RemoteManagementEvents> {
  private static instance: RemoteManagementService | null = null;
  
  private state: RemoteManagementState;
  private serverRunning: boolean = false;
  private commandHandlers: Map<RemoteCommand, (params: Record<string, unknown>) => Promise<unknown>>;
  private statusUpdateInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    super();
    this.state = { ...DEFAULT_REMOTE_MANAGEMENT_STATE };
    this.commandHandlers = new Map();
    this.registerDefaultCommandHandlers();
  }

  static getInstance(): RemoteManagementService {
    if (!RemoteManagementService.instance) {
      RemoteManagementService.instance = new RemoteManagementService();
    }
    return RemoteManagementService.instance;
  }

  // ============ Server Management ============

  /**
   * Start remote management server
   */
  async startServer(): Promise<boolean> {
    if (this.serverRunning) {
      this.state.error = 'Server is already running';
      this.emit('error', this.state.error);
      return false;
    }

    this.state.status = RemoteConnectionStatus.CONNECTING;
    this.emit('state:changed', this.state);

    try {
      // Generate access token if required
      if (this.state.config.authRequired && !this.state.config.accessToken) {
        this.state.config.accessToken = generateToken();
      }

      // Simulate server start
      await new Promise(resolve => setTimeout(resolve, 500));

      this.serverRunning = true;
      this.state.status = RemoteConnectionStatus.CONNECTED;
      this.state.serverUrl = this.generateServerUrl();
      this.state.qrCode = this.generateQRCodeUrl();
      this.state.statistics.uptime = Date.now();

      // Start status updates
      this.startStatusUpdates();

      this.emit('server:started', this.state.serverUrl);
      this.emit('state:changed', this.state);

      return true;
    } catch (error) {
      this.state.status = RemoteConnectionStatus.ERROR;
      this.state.error = `Failed to start server: ${error}`;
      this.emit('error', this.state.error);
      this.emit('state:changed', this.state);
      return false;
    }
  }

  /**
   * Stop remote management server
   */
  async stopServer(): Promise<void> {
    if (!this.serverRunning) return;

    // Disconnect all clients
    for (const session of this.state.sessions) {
      this.disconnectClient(session.client.id);
    }

    // Stop status updates
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }

    this.serverRunning = false;
    this.state.status = RemoteConnectionStatus.DISCONNECTED;
    this.state.sessions = [];
    this.state.clients = [];
    this.state.serverUrl = null;
    this.state.qrCode = null;

    this.emit('server:stopped');
    this.emit('state:changed', this.state);
  }

  /**
   * Generate server URL
   */
  private generateServerUrl(): string {
    const protocol = this.state.config.httpsEnabled ? 'https' : 'http';
    // In a real implementation, this would get the actual IP
    return `${protocol}://localhost:${this.state.config.port}`;
  }

  /**
   * Generate QR code URL
   */
  private generateQRCodeUrl(): string {
    // In a real implementation, this would generate an actual QR code
    return `qr-code://${this.state.serverUrl}?token=${this.state.config.accessToken}`;
  }

  // ============ Client Management ============

  /**
   * Connect a new client
   */
  connectClient(
    name: string,
    ipAddress: string,
    sessionType: RemoteSessionType,
    userAgent?: string
  ): RemoteClient | null {
    if (!this.serverRunning) {
      return null;
    }

    if (this.state.clients.length >= this.state.config.maxConnections) {
      this.state.error = 'Maximum connections reached';
      this.emit('error', this.state.error);
      return null;
    }

    // Check IP whitelist
    if (this.state.config.allowedIPs.length > 0 && 
        !this.state.config.allowedIPs.includes(ipAddress)) {
      this.state.error = 'IP address not allowed';
      this.emit('error', this.state.error);
      return null;
    }

    const client: RemoteClient = {
      id: generateUUID(),
      name,
      ipAddress,
      sessionType,
      permission: RemotePermission.VIEW_ONLY,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      userAgent: userAgent || null,
    };

    const session: RemoteSession = {
      id: generateUUID(),
      token: generateToken(),
      client,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.state.config.sessionTimeout * 1000),
      commandsExecuted: 0,
      lastCommand: null,
    };

    this.state.clients.push(client);
    this.state.sessions.push(session);
    this.state.statistics.totalConnections++;

    this.emit('client:connected', client);
    this.emit('state:changed', this.state);

    return client;
  }

  /**
   * Disconnect a client
   */
  disconnectClient(clientId: string): boolean {
    const clientIndex = this.state.clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) return false;

    const [client] = this.state.clients.splice(clientIndex, 1);
    this.state.sessions = this.state.sessions.filter(s => s.client.id !== clientId);

    this.emit('client:disconnected', clientId);
    this.emit('state:changed', this.state);

    return true;
  }

  /**
   * Update client permission
   */
  updateClientPermission(clientId: string, permission: RemotePermission): boolean {
    const client = this.state.clients.find(c => c.id === clientId);
    if (!client) return false;

    client.permission = permission;
    this.emit('state:changed', this.state);
    return true;
  }

  // ============ Command Execution ============

  /**
   * Register default command handlers
   */
  private registerDefaultCommandHandlers(): void {
    this.commandHandlers.set(RemoteCommand.START_STREAM, async () => {
      // Simulate starting stream
      return { success: true, message: 'Stream started' };
    });

    this.commandHandlers.set(RemoteCommand.STOP_STREAM, async () => {
      // Simulate stopping stream
      return { success: true, message: 'Stream stopped' };
    });

    this.commandHandlers.set(RemoteCommand.SWITCH_SCENE, async (params) => {
      const sceneName = params.sceneName as string;
      return { success: true, message: `Switched to scene: ${sceneName}` };
    });

    this.commandHandlers.set(RemoteCommand.SET_VOLUME, async (params) => {
      const sourceId = params.sourceId as string;
      const volume = params.volume as number;
      return { success: true, message: `Set volume for ${sourceId} to ${volume}` };
    });

    this.commandHandlers.set(RemoteCommand.TOGGLE_MUTE, async (params) => {
      const sourceId = params.sourceId as string;
      return { success: true, message: `Toggled mute for ${sourceId}` };
    });

    this.commandHandlers.set(RemoteCommand.START_RECORDING, async () => {
      return { success: true, message: 'Recording started' };
    });

    this.commandHandlers.set(RemoteCommand.STOP_RECORDING, async () => {
      return { success: true, message: 'Recording stopped' };
    });

    this.commandHandlers.set(RemoteCommand.TAKE_SNAPSHOT, async () => {
      return { success: true, message: 'Snapshot taken', snapshotPath: '/snapshots/snapshot.png' };
    });

    this.commandHandlers.set(RemoteCommand.SEND_CHAT_MESSAGE, async (params) => {
      const message = params.message as string;
      return { success: true, message: `Sent: ${message}` };
    });

    this.commandHandlers.set(RemoteCommand.TRIGGER_HOTKEY, async (params) => {
      const hotkeyId = params.hotkeyId as string;
      return { success: true, message: `Triggered hotkey: ${hotkeyId}` };
    });

    this.commandHandlers.set(RemoteCommand.SET_EXPRESSION, async (params) => {
      const expressionId = params.expressionId as string;
      return { success: true, message: `Set expression: ${expressionId}` };
    });

    this.commandHandlers.set(RemoteCommand.START_BREAK, async () => {
      return { success: true, message: 'Break started' };
    });

    this.commandHandlers.set(RemoteCommand.END_BREAK, async () => {
      return { success: true, message: 'Break ended' };
    });
  }

  /**
   * Register custom command handler
   */
  registerCommandHandler(command: RemoteCommand, handler: (params: Record<string, unknown>) => Promise<unknown>): void {
    this.commandHandlers.set(command, handler);
  }

  /**
   * Execute a command
   */
  async executeCommand(request: RemoteCommandRequest): Promise<RemoteCommandResponse> {
    const session = this.state.sessions.find(s => s.client.id === request.clientId);
    
    // Validate session
    if (!session) {
      return {
        requestId: request.id,
        success: false,
        data: null,
        error: 'Invalid session',
        timestamp: Date.now(),
      };
    }

    // Check session expiry
    if (session.expiresAt < Date.now()) {
      this.disconnectClient(request.clientId);
      return {
        requestId: request.id,
        success: false,
        data: null,
        error: 'Session expired',
        timestamp: Date.now(),
      };
    }

    // Check permission
    const client = session.client;
    if (client.permission === RemotePermission.VIEW_ONLY) {
      return {
        requestId: request.id,
        success: false,
        data: null,
        error: 'Insufficient permissions',
        timestamp: Date.now(),
      };
    }

    this.emit('command:received', request);

    const handler = this.commandHandlers.get(request.command);
    if (!handler) {
      return {
        requestId: request.id,
        success: false,
        data: null,
        error: `Unknown command: ${request.command}`,
        timestamp: Date.now(),
      };
    }

    try {
      const data = await handler(request.params);
      
      // Update session stats
      session.commandsExecuted++;
      session.lastCommand = request.command;
      session.client.lastActivity = Date.now();

      this.state.statistics.totalCommands++;

      const response: RemoteCommandResponse = {
        requestId: request.id,
        success: true,
        data,
        error: null,
        timestamp: Date.now(),
      };

      this.emit('command:executed', response);
      this.emit('state:changed', this.state);

      return response;
    } catch (error) {
      this.state.statistics.errorsCount++;
      this.state.statistics.lastError = Date.now();

      const response: RemoteCommandResponse = {
        requestId: request.id,
        success: false,
        data: null,
        error: String(error),
        timestamp: Date.now(),
      };

      this.emit('command:executed', response);
      this.emit('state:changed', this.state);

      return response;
    }
  }

  // ============ Status Updates ============

  /**
   * Start status updates
   */
  private startStatusUpdates(): void {
    this.statusUpdateInterval = setInterval(() => {
      this.updateStatus();
    }, 1000);
  }

  /**
   * Update stream status
   */
  private updateStatus(): void {
    if (!this.state.dashboardData) {
      this.state.dashboardData = this.createDefaultDashboardData();
    }

    // Simulate status updates
    const status = this.state.dashboardData.streamStatus;
    if (status.isStreaming) {
      status.uptime++;
      status.viewerCount = Math.max(0, status.viewerCount + Math.floor(Math.random() * 10) - 5);
      status.bitrate = 6000 + Math.floor(Math.random() * 500);
      status.fps = 60;
      status.cpuUsage = 20 + Math.floor(Math.random() * 15);
      status.memoryUsage = 40 + Math.floor(Math.random() * 10);
      status.droppedFrames = Math.max(0, status.droppedFrames + Math.floor(Math.random() * 3) - 1);
    }

    // Update audio levels
    for (const source of this.state.dashboardData.audioSources) {
      source.level = Math.random() * 0.8;
    }

    this.emit('status:updated', status);
  }

  /**
   * Create default dashboard data
   */
  private createDefaultDashboardData(): RemoteDashboardData {
    return {
      streamStatus: {
        ...DEFAULT_REMOTE_STREAM_STATUS,
        currentScene: 'Main',
        streamTitle: 'Live Stream',
        streamCategory: 'Just Chatting',
      },
      scenes: [
        { id: 'scene-1', name: 'Main', isCurrent: true, sources: [] },
        { id: 'scene-2', name: 'Gaming', isCurrent: false, sources: [] },
        { id: 'scene-3', name: 'Just Chatting', isCurrent: false, sources: [] },
      ],
      audioSources: [
        { id: 'audio-1', name: 'Microphone', volume: 0.8, muted: false, level: 0, monitoring: true },
        { id: 'audio-2', name: 'Desktop Audio', volume: 0.5, muted: false, level: 0, monitoring: false },
        { id: 'audio-3', name: 'Music', volume: 0.3, muted: true, level: 0, monitoring: false },
      ],
      recentEvents: [],
      chatMessages: [],
      alertsQueue: [],
    };
  }

  /**
   * Set stream status
   */
  setStreamStatus(updates: Partial<RemoteStreamStatus>): void {
    if (!this.state.dashboardData) return;

    Object.assign(this.state.dashboardData.streamStatus, updates);
    this.emit('status:updated', this.state.dashboardData.streamStatus);
    this.emit('state:changed', this.state);
  }

  /**
   * Add chat message
   */
  addChatMessage(message: RemoteChatMessage): void {
    if (!this.state.dashboardData) return;

    this.state.dashboardData.chatMessages.unshift(message);
    if (this.state.dashboardData.chatMessages.length > 100) {
      this.state.dashboardData.chatMessages.pop();
    }

    this.emit('state:changed', this.state);
  }

  /**
   * Add alert
   */
  addAlert(alert: RemoteAlert): void {
    if (!this.state.dashboardData) return;

    this.state.dashboardData.alertsQueue.push(alert);
    this.emit('state:changed', this.state);
  }

  /**
   * Add event
   */
  addEvent(event: RemoteEvent): void {
    if (!this.state.dashboardData) return;

    this.state.dashboardData.recentEvents.unshift(event);
    if (this.state.dashboardData.recentEvents.length > 50) {
      this.state.dashboardData.recentEvents.pop();
    }

    this.emit('state:changed', this.state);
  }

  // ============ Configuration ============

  /**
   * Update server configuration
   */
  updateConfig(config: Partial<RemoteServerConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    this.emit('state:changed', this.state);
  }

  /**
   * Generate new access token
   */
  regenerateAccessToken(): string {
    this.state.config.accessToken = generateToken();
    this.state.qrCode = this.generateQRCodeUrl();
    this.emit('state:changed', this.state);
    return this.state.config.accessToken;
  }

  // ============ Getters ============

  /**
   * Get current state
   */
  getState(): RemoteManagementState {
    return { ...this.state };
  }

  /**
   * Get server URL
   */
  getServerUrl(): string | null {
    return this.state.serverUrl;
  }

  /**
   * Get QR code
   */
  getQRCode(): string | null {
    return this.state.qrCode;
  }

  /**
   * Get connected clients
   */
  getClients(): RemoteClient[] {
    return [...this.state.clients];
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): RemoteDashboardData | null {
    return this.state.dashboardData ? { ...this.state.dashboardData } : null;
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.serverRunning;
  }

  // ============ Cleanup ============

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopServer();
    this.removeAllListeners();
    RemoteManagementService.instance = null;
  }
}

export default RemoteManagementService;