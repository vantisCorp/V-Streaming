// ============================================================================
// OBS WebSocket Type Definitions
// ============================================================================

export enum OBSConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}

export enum OBSEventSubscription {
  All = (1 << 0),
  General = (1 << 0),
  Config = (1 << 1),
  Scenes = (1 << 2),
  Inputs = (1 << 3),
  Transitions = (1 << 4),
  Filters = (1 << 5),
  Outputs = (1 << 6),
  SceneItems = (1 << 7),
  MediaInputs = (1 << 8),
  Vendors = (1 << 9),
  Ui = (1 << 10),
  InputVolumeMeters = (1 << 16),
  InputActiveStateChanged = (1 << 17),
  InputShowStateChanged = (1 << 18),
  SceneItemTransformChanged = (1 << 19)
}

export interface OBSScene {
  sceneIndex: number;
  sceneName: string;
}

export interface OBSSceneItem {
  sceneItemId: number;
  sceneName: string;
  sourceName: string;
  inputKind?: string;
  sceneItemEnabled: boolean;
  sceneItemBlendMode: number;
  sceneItemLock: boolean;
  sceneItemTransform: {
    boundsX: number;
    boundsY: number;
    boundsWidth: number;
    boundsHeight: number;
    boundsAlignment: number;
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;
    scaleX: number;
    scaleY: number;
    positionX: number;
    positionY: number;
    rotation: number;
    alignment: number;
  };
  isGroup: boolean;
  groupChildren?: OBSSceneItem[];
}

export interface OBSSource {
  sourceName: string;
  sourceUuid?: string;
  sourceType: string;
  sourceId?: string;
  sourceSettings?: any;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputReconnecting?: boolean;
  outputCode?: string;
  outputDuration: number;
  outputCongestion: number;
  outputBytes: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
  outputTimecode: string;
  [key: string]: any;
}

export interface OBSRecordStatus {
  outputActive: boolean;
  outputPaused: boolean;
  outputCode?: string;
  outputDuration: number;
  outputBytes: number;
  outputTimecode: string;
  [key: string]: any;
}

export interface OBSTransition {
  transitionName: string;
  transitionKind: string;
  transitionEnabled?: boolean;
  transitionConfigurable?: boolean;
  transitionDuration: number;
  transitionFixed?: boolean;
  transitionSettings?: any;
  transitionUuid?: string;
  [key: string]: any;
}

export interface OBSInput {
  inputName: string;
  inputUuid?: string;
  inputKind?: string;
  inputUnversionedKind?: string;
  inputSettings?: any;
  defaultInputSettings?: any;
  inputMuted: boolean;
  [key: string]: any;
}

export interface OBSVolumeMeter {
  inputName: string;
  inputLevelsMul?: number[];
  [key: string]: any;
}

export interface OBSConnectionConfig {
  address: string;
  port: number;
  password: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  eventSubscriptions: number;
}

export interface IOBSWebSocketService {
  connect(config: OBSConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): OBSConnectionStatus;
  
  // Scene Management
  getScenes(): Promise<OBSScene[]>;
  getCurrentScene(): Promise<string>;
  switchScene(sceneName: string): Promise<void>;
  getSceneItems(sceneName: string): Promise<OBSSceneItem[]>;
  
  // Stream Control
  startStreaming(): Promise<void>;
  stopStreaming(): Promise<void>;
  getStreamStatus(): Promise<OBSStreamStatus>;
  toggleStream(): Promise<void>;
  
  // Recording Control
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  getRecordStatus(): Promise<OBSRecordStatus>;
  toggleRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  
  // Source Management
  getSources(): Promise<OBSSource[]>;
  getSourceSettings(sourceName: string): Promise<any>;
  setSourceSettings(sourceName: string, settings: any): Promise<void>;
  
  // Input Management
  getInputs(): Promise<OBSInput[]>;
  setInputMute(inputName: string, muted: boolean): Promise<void>;
  toggleInputMute(inputName: string): Promise<boolean>;
  setInputVolume(inputName: string, volume: number): Promise<void>;
  getInputVolume(inputName: string): Promise<number>;
  
  // Transition Management
  getTransitions(): Promise<OBSTransition[]>;
  getCurrentTransition(): Promise<OBSTransition>;
  setCurrentTransition(transitionName: string): Promise<void>;
  setTransitionDuration(duration: number): Promise<void>;
  triggerTransition(): Promise<void>;
  
  // Internal Events
  onConnectionOpened(listener: () => void): void;
  onConnectionClosed(listener: (error: any) => void): void;
  onConnectionError(listener: (error: any) => void): void;
}

export interface IOBSWebSocketEvents {
  'connection-status-changed': (status: OBSConnectionStatus) => void;
  'scene-changed': (sceneName: string) => void;
  'stream-started': () => void;
  'stream-stopped': () => void;
  'recording-started': () => void;
  'recording-stopped': () => void;
  'recording-paused': () => void;
  'recording-resumed': () => void;
  'exit-started': () => void;
  'vendor-event': (data: any) => void;
  'input-volume-meters': (meters: OBSVolumeMeter[]) => void;
  'input-active-state-changed': (data: any) => void;
  'input-show-state-changed': (data: any) => void;
}