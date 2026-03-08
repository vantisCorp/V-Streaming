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
  // SCENE COLLECTION MANAGEMENT
  // ==========================================================================
  
  public async getSceneCollections(): Promise<any[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSceneCollectionList');
    return response.sceneCollections || [];
  }
  
  public async getCurrentSceneCollection(): Promise<string> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSceneCollectionList');
    return response.currentSceneCollectionName || '';
  }
  
  public async setCurrentSceneCollection(collectionName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentSceneCollection', { sceneCollectionName: collectionName });
  }
  
  public async createSceneCollection(collectionName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('CreateSceneCollection', { sceneCollectionName: collectionName });
  }
  
  // ==========================================================================
  // PROFILE MANAGEMENT
  // ==========================================================================
  
  public async getProfiles(): Promise<any[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetProfileList');
    return response.profiles || [];
  }
  
  public async getCurrentProfile(): Promise<string> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetProfileList');
    return response.currentProfileName || '';
  }
  
  public async setCurrentProfile(profileName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentProfile', { profileName });
  }
  
  public async createProfile(profileName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('CreateProfile', { profileName });
  }
  
  // ==========================================================================
  // SCENE ITEM MANAGEMENT (Advanced)
  // ==========================================================================
  
  public async createSceneItem(sceneName: string, sourceName: string, sceneItemEnabled?: boolean): Promise<number> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('CreateSceneItem', {
      sceneName,
      sourceName,
      sceneItemEnabled: sceneItemEnabled ?? true
    });
    return response.sceneItemId;
  }
  
  public async removeSceneItem(sceneName: string, sceneItemId: number): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('RemoveSceneItem', { sceneName, sceneItemId });
  }
  
  public async setSceneItemTransform(sceneName: string, sceneItemId: number, transform: any): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetSceneItemTransform', {
      sceneName,
      sceneItemId,
      sceneItemTransform: transform
    });
  }
  
  public async setSceneItemEnabled(sceneName: string, sceneItemId: number, enabled: boolean): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetSceneItemEnabled', {
      sceneName,
      sceneItemId,
      sceneItemEnabled: enabled
    });
  }
  
  public async getSceneItemTransform(sceneName: string, sceneItemId: number): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSceneItemTransform', { sceneName, sceneItemId });
    return response.sceneItemTransform;
  }
  
  // ==========================================================================
  // FILTER MANAGEMENT
  // ==========================================================================
  
  public async getSourceFilters(sourceName: string): Promise<any[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSourceFilterList', { sourceName });
    return response.filters || [];
  }
  
  public async getSourceFilter(sourceName: string, filterName: string): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetSourceFilter', { sourceName, filterName });
    return response;
  }
  
  public async createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: any): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('CreateSourceFilter', {
      sourceName,
      filterName,
      filterKind,
      filterSettings: filterSettings || {}
    });
  }
  
  public async removeSourceFilter(sourceName: string, filterName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('RemoveSourceFilter', { sourceName, filterName });
  }
  
  public async setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetSourceFilterEnabled', { sourceName, filterName, filterEnabled });
  }
  
  public async setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetSourceFilterIndex', { sourceName, filterName, filterIndex });
  }
  
  public async setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: any): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings });
  }
  
  // ==========================================================================
  // REPLAY BUFFER
  // ==========================================================================
  
  public async getReplayBufferStatus(): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetReplayBufferStatus');
    return {
      outputActive: response.outputActive || false,
      isSaving: response.isSaving || false
    };
  }
  
  public async startReplayBuffer(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StartReplayBuffer');
  }
  
  public async stopReplayBuffer(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StopReplayBuffer');
  }
  
  public async saveReplayBuffer(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SaveReplayBuffer');
  }
  
  // ==========================================================================
  // VIRTUAL CAMERA
  // ==========================================================================
  
  public async getVirtualCameraStatus(): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetVirtualCamStatus');
    return {
      outputActive: response.outputActive || false
    };
  }
  
  public async startVirtualCamera(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StartVirtualCam');
  }
  
  public async stopVirtualCamera(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('StopVirtualCam');
  }
  
  // ==========================================================================
  // STUDIO MODE
  // ==========================================================================
  
  public async getStudioModeStatus(): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetStudioModeEnabled');
    return {
      studioModeEnabled: response.studioModeEnabled || false,
      previewSceneName: response.previewSceneName
    };
  }
  
  public async setStudioModeEnabled(enabled: boolean): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled });
  }
  
  public async setPreviewScene(sceneName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetCurrentPreviewScene', { sceneName });
  }
  
  public async getPreviewScene(): Promise<string> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetCurrentPreviewScene');
    return response.currentPreviewSceneName || '';
  }
  
  // ==========================================================================
  // AUDIO MONITORING
  // ==========================================================================
  
  public async setInputAudioMonitor(inputName: string, monitorType: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetInputAudioMonitorType', { inputName, monitorType });
  }
  
  public async getAudioMonitor(inputName: string): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetInputAudioMonitorType', { inputName });
    return {
      sourceName: inputName,
      monitorType: response.monitorType
    };
  }
  
  // ==========================================================================
  // MEDIA INPUTS
  // ==========================================================================
  
  public async getMediaInputStatus(inputName: string): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetMediaInputStatus', { inputName });
    return {
      mediaState: response.mediaState,
      mediaDuration: response.mediaDuration || 0,
      mediaCursor: response.mediaCursor || 0
    };
  }
  
  public async playMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY' });
  }
  
  public async pauseMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE' });
  }
  
  public async restartMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART' });
  }
  
  public async stopMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP' });
  }
  
  public async nextMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NEXT' });
  }
  
  public async previousMediaInput(inputName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerMediaInputAction', { inputName, mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PREVIOUS' });
  }
  
  public async setMediaInputCursor(inputName: string, cursor: number): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SetMediaInputCursor', { inputName, mediaCursor: cursor });
  }
  
  // ==========================================================================
  // STATS
  // ==========================================================================
  
  public async getStats(): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetStats');
    return {
      activeFps: response.activeFps || 0,
      averageFrameTime: response.averageFrameTime || 0,
      cpuUsage: response.cpuUsage || 0,
      memoryUsage: response.memoryUsage || 0,
      freeDiskSpace: response.freeDiskSpace || 0,
      renderMissedFrames: response.renderMissedFrames || 0,
      renderTotalFrames: response.renderTotalFrames || 0,
      outputSkippedFrames: response.outputSkippedFrames || 0,
      outputTotalFrames: response.outputTotalFrames || 0,
      averageFrameRenderTime: response.averageFrameRenderTime || 0
    };
  }
  
  // ==========================================================================
  // RECORDING (Advanced)
  // ==========================================================================
  
  public async resumeRecording(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('ResumeRecord');
  }
  
  public async splitRecordFile(): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('SplitRecordFile');
  }
  
  // ==========================================================================
  // HOTKEYS
  // ==========================================================================
  
  public async triggerHotkey(hotkeyName: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    await this.obs.call('TriggerHotkeyByName', { hotkeyName });
  }
  
  public async triggerHotkeyByName(hotkeyName: string, sceneName?: string, sourceName?: string): Promise<void> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const params: any = { hotkeyName };
    if (sceneName) params.sceneName = sceneName;
    if (sourceName) params.sourceName = sourceName;
    
    await this.obs.call('TriggerHotkeyByName', params);
  }
  
  // ==========================================================================
  // OUTPUTS
  // ==========================================================================
  
  public async getOutputs(): Promise<any[]> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetOutputList');
    return response.outputs || [];
  }
  
  public async getOutput(outputName: string): Promise<any> {
    if (!this.obs || !this.isConnected()) {
      throw new Error('Not connected to OBS');
    }
    
    const response: any = await this.obs.call('GetOutputStatus', { outputName });
    return response;
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