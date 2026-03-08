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
  'scene-collection-changed': (collectionName: string) => void;
  'profile-changed': (profileName: string) => void;
  'replay-buffer-started': () => void;
  'replay-buffer-stopped': () => void;
  'replay-buffer-saved': (path: string) => void;
  'virtual-camera-started': () => void;
  'virtual-camera-stopped': () => void;
  'scene-item-created': (data: OBSSceneItemEvent) => void;
  'scene-item-removed': (data: OBSSceneItemEvent) => void;
  'source-filter-created': (data: OBSFilterEvent) => void;
  'source-filter-removed': (data: OBSFilterEvent) => void;
}

// ============================================================================
// Advanced OBS Types
// ============================================================================

// ============ Scene Collection Types ============

export interface OBSSceneCollection {
  /** Collection name */
  collectionName: string;
  /** Collection data (JSON) */
  collectionData?: string;
}

export interface OBSSceneCollectionInfo {
  /** Collection name */
  name: string;
  /** Number of scenes */
  sceneCount: number;
  /** Number of sources */
  sourceCount: number;
  /** Last modified timestamp */
  lastModified?: number;
}

// ============ Profile Types ============

export interface OBSProfile {
  /** Profile name */
  profileName: string;
  /** Profile data (JSON) */
  profileData?: string;
}

export interface OBSProfileInfo {
  /** Profile name */
  name: string;
  /** Stream service */
  streamService?: string;
  /** Stream server */
  streamServer?: string;
  /** Stream key (masked) */
  streamKey?: string;
  /** Recording path */
  recordingPath?: string;
  /** Output resolution */
  outputResolution?: string;
  /** Base resolution */
  baseResolution?: string;
  /** FPS */
  fps?: number;
}

// ============ Filter Types ============

export interface OBSFilter {
  /** Filter name */
  filterName: string;
  /** Filter type/kind */
  filterKind: string;
  /** Filter enabled */
  filterEnabled: boolean;
  /** Filter settings */
  filterSettings: Record<string, unknown>;
  /** Filter index in the stack */
  filterIndex?: number;
}

export interface OBSFilterEvent {
  /** Source/Scene name */
  sourceName: string;
  /** Filter name */
  filterName: string;
  /** Filter kind */
  filterKind: string;
  /** Filter settings */
  filterSettings?: Record<string, unknown>;
  /** Filter enabled */
  filterEnabled?: boolean;
}

// ============ Source Transform Types ============

export interface OBSSceneItemTransform {
  /** X position */
  positionX: number;
  /** Y position */
  positionY: number;
  /** Width scale factor */
  scaleX: number;
  /** Height scale factor */
  scaleY: number;
  /** Rotation in degrees */
  rotation: number;
  /** Bounds X */
  boundsX?: number;
  /** Bounds Y */
  boundsY?: number;
  /** Bounds width */
  boundsWidth?: number;
  /** Bounds height */
  boundsHeight?: number;
  /** Bounds alignment */
  boundsAlignment?: number;
  /** Crop left */
  cropLeft?: number;
  /** Crop right */
  cropRight?: number;
  /** Crop top */
  cropTop?: number;
  /** Crop bottom */
  cropBottom?: number;
  /** Alignment */
  alignment?: number;
}

export interface OBSSceneItemEvent {
  /** Scene name */
  sceneName: string;
  /** Source name */
  sourceName: string;
  /** Scene item ID */
  sceneItemId: number;
  /** Scene item index */
  sceneItemIndex?: number;
}

// ============ Replay Buffer Types ============

export interface OBSReplayBufferStatus {
  /** Is replay buffer active */
  outputActive: boolean;
  /** Is replay buffer saving */
  isSaving: boolean;
  /** Path to saved replay */
  savedReplayPath?: string;
  /** Output duration */
  outputDuration: number;
  /** Output bytes */
  outputBytes: number;
}

// ============ Virtual Camera Types ============

export interface OBSVirtualCameraStatus {
  /** Is virtual camera active */
  outputActive: boolean;
}

// ============ Studio Mode Types ============

export interface OBSStudioModeStatus {
  /** Is studio mode enabled */
  studioModeEnabled: boolean;
  /** Preview scene name */
  previewSceneName?: string;
}

// ============ Audio Monitor Types ============

export interface OBSAudioMonitor {
  /** Source name */
  sourceName: string;
  /** Monitor type */
  monitorType: OBSMonitorType;
  /** Monitor device */
  monitorDevice?: string;
}

export enum OBSMonitorType {
  NONE = 'OBS_MONITORING_TYPE_NONE',
  MONITOR_ONLY = 'OBS_MONITORING_TYPE_MONITOR_ONLY',
  MONITOR_AND_OUTPUT = 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT'
}

// ============ Output Types ============

export interface OBSOutput {
  /** Output name */
  outputName: string;
  /** Output kind */
  outputKind: string;
  /** Output width */
  outputWidth?: number;
  /** Output height */
  outputHeight?: number;
  /** Output active */
  outputActive: boolean;
  /** Output flags */
  outputFlags?: number;
  /** Output settings */
  outputSettings?: Record<string, unknown>;
}

// ============ Media Input Types ============

export enum OBSMediaPlaybackState {
  PLAYING = 'OBS_MEDIA_STATE_PLAYING',
  PAUSED = 'OBS_MEDIA_STATE_PAUSED',
  STOPPED = 'OBS_MEDIA_STATE_STOPPED',
  ENDED = 'OBS_MEDIA_STATE_ENDED',
  ERROR = 'OBS_MEDIA_STATE_ERROR',
  OPENING = 'OBS_MEDIA_STATE_OPENING',
  BUFFERING = 'OBS_MEDIA_STATE_BUFFERING'
}

export interface OBSMediaInputStatus {
  /** Media state */
  mediaState: OBSMediaPlaybackState;
  /** Media duration */
  mediaDuration: number;
  /** Media cursor position */
  mediaCursor: number;
}

// ============ Stats Types ============

export interface OBSStats {
  /** Current FPS */
  activeFps: number;
  /** Average frame time (ms) */
  averageFrameTime: number;
  /** CPU usage % */
  cpuUsage: number;
  /** Memory usage (MB) */
  memoryUsage: number;
  /** Free disk space (MB) */
  freeDiskSpace: number;
  /** Total render frames dropped */
  renderMissedFrames: number;
  /** Total render frames */
  renderTotalFrames: number;
  /** Total output frames dropped */
  outputSkippedFrames: number;
  /** Total output frames */
  outputTotalFrames: number;
  /** Average time to render frame (ms) */
  averageFrameRenderTime: number;
  /** Video encode lagged frames */
  encodeFrameLag: number;
}

// ============ Advanced Service Interface ============

export interface IAdvancedOBSWebSocketService extends IOBSWebSocketService {
  // Scene Collection Management
  getSceneCollections(): Promise<OBSSceneCollection[]>;
  getCurrentSceneCollection(): Promise<string>;
  setCurrentSceneCollection(collectionName: string): Promise<void>;
  createSceneCollection(collectionName: string): Promise<void>;
  duplicateSceneCollection(collectionName: string, newName: string): Promise<void>;
  deleteSceneCollection(collectionName: string): Promise<void>;
  
  // Profile Management
  getProfiles(): Promise<OBSProfile[]>;
  getCurrentProfile(): Promise<string>;
  setCurrentProfile(profileName: string): Promise<void>;
  createProfile(profileName: string): Promise<void>;
  duplicateProfile(profileName: string, newName: string): Promise<void>;
  deleteProfile(profileName: string): Promise<void>;
  
  // Scene Item Management
  createSceneItem(sceneName: string, sourceName: string, sceneItemTransform?: OBSSceneItemTransform): Promise<number>;
  removeSceneItem(sceneName: string, sceneItemId: number): Promise<void>;
  setSceneItemTransform(sceneName: string, sceneItemId: number, transform: Partial<OBSSceneItemTransform>): Promise<void>;
  setSceneItemEnabled(sceneName: string, sceneItemId: number, enabled: boolean): Promise<void>;
  setSceneItemIndex(sceneName: string, sceneItemId: number, sceneItemIndex: number): Promise<void>;
  duplicateSceneItem(sceneName: string, sceneItemId: number): Promise<number>;
  
  // Filter Management
  getSourceFilters(sourceName: string): Promise<OBSFilter[]>;
  getSourceFilter(sourceName: string, filterName: string): Promise<OBSFilter>;
  createSourceFilter(sourceName: string, filterName: string, filterKind: string, filterSettings?: Record<string, unknown>): Promise<void>;
  removeSourceFilter(sourceName: string, filterName: string): Promise<void>;
  setSourceFilterEnabled(sourceName: string, filterName: string, filterEnabled: boolean): Promise<void>;
  setSourceFilterIndex(sourceName: string, filterName: string, filterIndex: number): Promise<void>;
  setSourceFilterSettings(sourceName: string, filterName: string, filterSettings: Record<string, unknown>): Promise<void>;
  
  // Replay Buffer
  getReplayBufferStatus(): Promise<OBSReplayBufferStatus>;
  startReplayBuffer(): Promise<void>;
  stopReplayBuffer(): Promise<void>;
  saveReplayBuffer(): Promise<void>;
  
  // Virtual Camera
  getVirtualCameraStatus(): Promise<OBSVirtualCameraStatus>;
  startVirtualCamera(): Promise<void>;
  stopVirtualCamera(): Promise<void>;
  
  // Studio Mode
  getStudioModeStatus(): Promise<OBSStudioModeStatus>;
  setStudioModeEnabled(enabled: boolean): Promise<void>;
  setPreviewScene(sceneName: string): Promise<void>;
  triggerStudioModeTransition(): Promise<void>;
  
  // Audio Monitoring
  setInputAudioMonitor(inputName: string, monitorType: OBSMonitorType): Promise<void>;
  getAudioMonitor(inputName: string): Promise<OBSAudioMonitor>;
  
  // Media Inputs
  getMediaInputStatus(inputName: string): Promise<OBSMediaInputStatus>;
  playMediaInput(inputName: string): Promise<void>;
  pauseMediaInput(inputName: string): Promise<void>;
  stopMediaInput(inputName: string): Promise<void>;
  restartMediaInput(inputName: string): Promise<void>;
  setMediaInputCursor(inputName: string, cursor: number): Promise<void>;
  setMediaInputSpeed(inputName: string, speed: number): Promise<void>;
  
  // Stats
  getStats(): Promise<OBSStats>;
  
  // Recording (Advanced)
  resumeRecording(): Promise<void>;
  splitRecordFile(): Promise<void>;
  
  // Outputs
  getOutputs(): Promise<OBSOutput[]>;
  getOutput(outputName: string): Promise<OBSOutput>;
  
  // Hotkeys
  triggerHotkey(hotkeyName: string): Promise<void>;
  triggerHotkeyByName(hotkeyName: string, sceneName?: string, sourceName?: string): Promise<void>;
  
  // Sleep Mode
  setSleepMode(sleeping: boolean): Promise<void>;
}

// ============ Default Values ============

export const DEFAULT_SCENE_ITEM_TRANSFORM: OBSSceneItemTransform = {
  positionX: 0,
  positionY: 0,
  scaleX: 1.0,
  scaleY: 1.0,
  rotation: 0,
  boundsX: 0,
  boundsY: 0,
  boundsWidth: 0,
  boundsHeight: 0,
  boundsAlignment: 0,
  cropLeft: 0,
  cropRight: 0,
  cropTop: 0,
  cropBottom: 0,
  alignment: 5 // Center alignment
};

export const DEFAULT_FILTER_SETTINGS: Record<string, unknown> = {};