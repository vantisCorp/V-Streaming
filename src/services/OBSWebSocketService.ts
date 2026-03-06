import { EventEmitter } from 'eventemitter3';
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
import {
  IOBSWebSocketService,
  IOBSWebSocketEvents,
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

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class OBSWebSocketService extends EventEmitter<IOBSWebSocketEvents> implements IOBSWebSocketService {
  
  // ==========================================================================
  // PRIVATE FIELDS
  // ==========================================================================
  
  private obs: OBSWebSocket | null = null;
  private config: OBSConnectionConfig | null = null;
  private connectionStatus: OBSConnectionStatus = OBSConnectionStatus.DISCONNECTED;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  private constructor() {
    super();
  }
  
  // ==========================================================================
  // SINGLETON INSTANCE
  // ==========================================================================
  
  private static instance: OBSWebSocketService | null = null;
  
  public static getInstance(): OBSWebSocketService {
    if (!OBSWebSocketService.instance) {
      OBSWebSocketService.instance = new OBSWebSocketService();
    }
    return OBSWebSocketService.instance;
  }
  
  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================
  
  public async connect(config: OBSConnectionConfig): Promise<void> {
    if (this.connectionStatus === OBSConnectionStatus.CONNECTED || 
        this.connectionStatus === OBSConnectionStatus.CONNECTING) {
      throw new Error('Already connected or connecting');
    }
    
    this.config = config;
    this.updateConnectionStatus(OBSConnectionStatus.CONNECTING);
    
    try {
      // Create new OBS WebSocket instance
      this.obs = new OBSWebSocket();
      this.setupInternalEventListeners();
      
      // Connect to OBS
      const url = `ws://${config.address}:${config.port}`;
      const { obsWebSocketVersion, negotiatedRpcVersion } = await this.obs.connect(
        url,
        config.password,
        {
          rpcVersion: 1,
          eventSubscriptions: config.eventSubscriptions || EventSubscription.All
        }
      );
      
      console.log(`Connected to OBS ${obsWebSocketVersion} (RPC ${negotiatedRpcVersion})`);
      this.updateConnectionStatus(OBSConnectionStatus.CONNECTED);
      this.emit('connection-status-changed', OBSConnectionStatus.CONNECTED);
      
      // Setup auto-reconnect if enabled
      if (config.autoReconnect) {
        this.setupAutoReconnect();
      }
      
    } catch (error: any) {
      console.error('Failed to connect to OBS:', error);
      this.updateConnectionStatus(OBSConnectionStatus.ERROR);
      this.emit('connection-status-changed', OBSConnectionStatus.ERROR);
      throw error;
    }
  }
  
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.obs) {
      try {
        await this.obs.disconnect();
        this.obs.removeAllListeners();
        this.obs = null;
      } catch (error) {
        console.error('Error disconnecting from OBS:', error);
      }
    }
    
    this.updateConnectionStatus(OBSConnectionStatus.DISCONNECTED);
    this.emit('connection-status-changed', OBSConnectionStatus.DISCONNECTED);
  }
  
  public isConnected(): boolean {
    return this.connectionStatus === OBSConnectionStatus.CONNECTED;
  }
  
  public getConnectionStatus(): OBSConnectionStatus {
    return this.connectionStatus;
  }
  
  private updateConnectionStatus(status: OBSConnectionStatus): void {
    this.connectionStatus = status;
    this.emit('connection-status-changed', status);
  }
  
  private setupAutoReconnect(): void {
    if (!this.config || !this.config.autoReconnect) return;
    
    this.obs?.on('ConnectionClosed', () => {
      if (this.config?.autoReconnect) {
        console.log('Connection closed, attempting to reconnect...');
        this.reconnectTimer = setTimeout(() => {
          if (this.config) {
            this.connect(this.config!).catch((error) => {
              console.error('Reconnection failed:', error);
            });
          }
        }, this.config.reconnectInterval);
      }
    });
  }
  
  private setupInternalEventListeners(): void {
    if (!this.obs) return;
    
    this.obs.on('ConnectionOpened', () => {
      console.log('OBS WebSocket connection opened');
    });
    
    this.obs.on('ConnectionClosed', () => {
      console.log('OBS WebSocket connection closed');
      this.updateConnectionStatus(OBSConnectionStatus.DISCONNECTED);
    });
    
    this.obs.on('ConnectionError', (error) => {
      console.error('OBS WebSocket connection error:', error);
      this.updateConnectionStatus(OBSConnectionStatus.ERROR);
    });
    
    // OBS Events
    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this.emit('scene-changed', data.sceneName);
    });
    
    this.obs.on('StreamStateChanged', (data) => {
      if (data.outputActive) {
        this.emit('stream-started');
      } else {
        this.emit('stream-stopped');
      }
    });
    
    this.obs.on('RecordStateChanged', (data: any) => {
      if (data.outputActive && !(data.outputPaused ?? false)) {
        this.emit('recording-started');
      } else if (data.outputActive && (data.outputPaused ?? false)) {
        this.emit('recording-paused');
      } else if (!data.outputActive && (data.outputPaused ?? false)) {
        this.emit('recording-resumed');
      } else {
        this.emit('recording-stopped');
      }
    });
    
    this.obs.on('ExitStarted', () => {
      this.emit('exit-started');
    });
    
    this.obs.on('VendorEvent', (data) => {
      this.emit('vendor-event', data);
    });
    
    this.obs.on('InputVolumeMeters', (data: any) => {
      this.emit('input-volume-meters', data.inputs);
    });
    
    this.obs.on('InputActiveStateChanged', (data) => {
      this.emit('input-active-state-changed', data);
    });
    
    this.obs.on('InputShowStateChanged', (data) => {
      this.emit('input-show-state-changed', data);
    });
  }
  
  // ==========================================================================
  // SCENE MANAGEMENT
  // ==========================================================================
  
  public async getScenes(): Promise<OBSScene[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSceneList');
    return response.scenes as OBSScene[];
  }
  
  public async getCurrentScene(): Promise<string> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response = await this.obs.call('GetCurrentProgramScene');
    return response.currentProgramSceneName;
  }
  
  public async switchScene(sceneName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentProgramScene', { sceneName });
  }
  
  public async getSceneItems(sceneName: string): Promise<OBSSceneItem[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSceneItemList', { sceneName });
    return response.sceneItems as OBSSceneItem[];
  }
  
  // ==========================================================================
  // STREAM CONTROL
  // ==========================================================================
  
  public async startStreaming(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StartStream');
  }
  
  public async stopStreaming(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StopStream');
  }
  
  public async getStreamStatus(): Promise<OBSStreamStatus> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    return await this.obs.call('GetStreamStatus');
  }
  
  public async toggleStream(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const status = await this.getStreamStatus();
    if (status.outputActive) {
      await this.stopStreaming();
    } else {
      await this.startStreaming();
    }
  }
  
  // ==========================================================================
  // RECORDING CONTROL
  // ==========================================================================
  
  public async startRecording(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StartRecord');
  }
  
  public async stopRecording(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StopRecord');
  }
  
  public async getRecordStatus(): Promise<OBSRecordStatus> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    return await this.obs.call('GetRecordStatus');
  }
  
  public async toggleRecording(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const status = await this.getRecordStatus();
    if (status.outputActive) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }
  
  public async pauseRecording(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('PauseRecord');
  }
  
  // ==========================================================================
  // SOURCE MANAGEMENT
  // ==========================================================================
  
  public async getSources(): Promise<OBSSource[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetInputList');
    return response.inputs as OBSSource[];
  }
  
  public async getSourceSettings(sourceName: string): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response = await this.obs.call('GetInputSettings', { inputName: sourceName });
    return response.inputSettings;
  }
  
  public async setSourceSettings(sourceName: string, settings: any): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetInputSettings', {
      inputName: sourceName,
      inputSettings: settings
    });
  }
  
  // ==========================================================================
  // INPUT MANAGEMENT
  // ==========================================================================
  
  public async getInputs(): Promise<OBSInput[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetInputList');
    return response.inputs as OBSInput[];
  }
  
  public async setInputMute(inputName: string, muted: boolean): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetInputMute', { inputName, inputMuted: muted });
  }
  
  public async toggleInputMute(inputName: string): Promise<boolean> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response = await this.obs.call('ToggleInputMute', { inputName });
    return response.inputMuted;
  }
  
  public async setInputVolume(inputName: string, volume: number): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetInputVolume', {
      inputName,
      inputVolumeMul: volume / 100 // Convert 0-100 to 0.0-1.0
    });
  }
  
  public async getInputVolume(inputName: string): Promise<number> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetInputVolume', { inputName });
    return Math.round((response.inputVolumeMul || response.volumeMul || 0) * 100); // Convert 0.0-1.0 to 0-100
  }
  
  // ==========================================================================
  // TRANSITION MANAGEMENT
  // ==========================================================================
  
  public async getTransitions(): Promise<OBSTransition[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    // @ts-ignore - obs-websocket-js type issue
    const response: any = await this.obs.call('GetTransitionList');
    return response.transitions || [];
  }
  
  public async getCurrentTransition(): Promise<OBSTransition> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetCurrentSceneTransition');
    return response;
  }
  
  public async setCurrentTransition(transitionName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentSceneTransition', { transitionName });
  }
  
  public async setTransitionDuration(duration: number): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentSceneTransitionDuration', { transitionDuration: duration });
  }
  
  public async triggerTransition(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerStudioModeTransition');
  }
  
  // ==========================================================================
  // INTERNAL EVENT LISTENERS
  // ==========================================================================
  
  public onConnectionOpened(listener: () => void): void {
    this.obs?.on('ConnectionOpened', listener);
  }
  
  public onConnectionClosed(listener: (error: any) => void): void {
    this.obs?.on('ConnectionClosed', listener);
  }
  
  public onConnectionError(listener: (error: any) => void): void {
    this.obs?.on('ConnectionError', listener);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export default OBSWebSocketService.getInstance();