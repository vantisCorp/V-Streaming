/**
 * Remote Management Types - Type definitions for remote stream management
 * Enables web-based remote control of streaming features
 */

// ============ Enums ============

/**
 * Remote connection status
 */
export enum RemoteConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error',
}

/**
 * Remote command types
 */
export enum RemoteCommand {
  START_STREAM = 'startStream',
  STOP_STREAM = 'stopStream',
  PAUSE_STREAM = 'pauseStream',
  RESUME_STREAM = 'resumeStream',
  SWITCH_SCENE = 'switchScene',
  TOGGLE_SOURCE = 'toggleSource',
  SET_VOLUME = 'setVolume',
  TOGGLE_MUTE = 'toggleMute',
  START_RECORDING = 'startRecording',
  STOP_RECORDING = 'stopRecording',
  TAKE_SNAPSHOT = 'takeSnapshot',
  SEND_CHAT_MESSAGE = 'sendChatMessage',
  TOGGLE_CHAT_VISIBILITY = 'toggleChatVisibility',
  TRIGGER_HOTKEY = 'triggerHotkey',
  UPDATE_OVERLAY = 'updateOverlay',
  SET_EXPRESSION = 'setExpression',
  START_BREAK = 'startBreak',
  END_BREAK = 'endBreak',
}

/**
 * Remote permission levels
 */
export enum RemotePermission {
  VIEW_ONLY = 'viewOnly',
  MODERATOR = 'moderator',
  EDITOR = 'editor',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * Remote session type
 */
export enum RemoteSessionType {
  WEB = 'web',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  API = 'api',
}

// ============ Interfaces ============

/**
 * Remote server configuration
 */
export interface RemoteServerConfig {
  /** Enable remote management */
  enabled: boolean;
  /** Server port */
  port: number;
  /** HTTPS enabled */
  httpsEnabled: boolean;
  /** Authentication required */
  authRequired: boolean;
  /** Access token */
  accessToken: string | null;
  /** Session timeout in seconds */
  sessionTimeout: number;
  /** Max concurrent connections */
  maxConnections: number;
  /** Allowed IP addresses (empty = all) */
  allowedIPs: string[];
  /** Rate limit per minute */
  rateLimit: number;
  /** Enable CORS */
  corsEnabled: boolean;
  /** Allowed origins for CORS */
  corsOrigins: string[];
}

/**
 * Remote client information
 */
export interface RemoteClient {
  /** Client ID */
  id: string;
  /** Client name */
  name: string;
  /** Client IP address */
  ipAddress: string;
  /** Session type */
  sessionType: RemoteSessionType;
  /** Permission level */
  permission: RemotePermission;
  /** Connected at timestamp */
  connectedAt: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Is active */
  isActive: boolean;
  /** User agent string */
  userAgent: string | null;
}

/**
 * Remote session
 */
export interface RemoteSession {
  /** Session ID */
  id: string;
  /** Session token */
  token: string;
  /** Client info */
  client: RemoteClient;
  /** Created at */
  createdAt: number;
  /** Expires at */
  expiresAt: number;
  /** Commands executed count */
  commandsExecuted: number;
  /** Last command timestamp */
  lastCommand: RemoteCommand | null;
}

/**
 * Remote command request
 */
export interface RemoteCommandRequest {
  /** Request ID */
  id: string;
  /** Command */
  command: RemoteCommand;
  /** Command parameters */
  params: Record<string, unknown>;
  /** Timestamp */
  timestamp: number;
  /** Client ID */
  clientId: string;
}

/**
 * Remote command response
 */
export interface RemoteCommandResponse {
  /** Request ID */
  requestId: string;
  /** Success */
  success: boolean;
  /** Response data */
  data: unknown;
  /** Error message */
  error: string | null;
  /** Timestamp */
  timestamp: number;
}

/**
 * Stream status for remote display
 */
export interface RemoteStreamStatus {
  /** Is streaming */
  isStreaming: boolean;
  /** Is recording */
  isRecording: boolean;
  /** Stream uptime in seconds */
  uptime: number;
  /** Current scene */
  currentScene: string;
  /** Active sources */
  activeSources: string[];
  /** Viewer count */
  viewerCount: number;
  /** Bitrate */
  bitrate: number;
  /** FPS */
  fps: number;
  /** CPU usage */
  cpuUsage: number;
  /** Memory usage */
  memoryUsage: number;
  /** Dropped frames */
  droppedFrames: number;
  /** Stream title */
  streamTitle: string;
  /** Stream category/game */
  streamCategory: string;
  /** Is on break */
  isOnBreak: boolean;
  /** Break duration */
  breakDuration: number;
}

/**
 * Remote dashboard data
 */
export interface RemoteDashboardData {
  /** Stream status */
  streamStatus: RemoteStreamStatus;
  /** Available scenes */
  scenes: RemoteScene[];
  /** Audio sources */
  audioSources: RemoteAudioSource[];
  /** Recent events */
  recentEvents: RemoteEvent[];
  /** Chat messages */
  chatMessages: RemoteChatMessage[];
  /** Alerts queue */
  alertsQueue: RemoteAlert[];
}

/**
 * Remote scene info
 */
export interface RemoteScene {
  /** Scene ID */
  id: string;
  /** Scene name */
  name: string;
  /** Is current */
  isCurrent: boolean;
  /** Sources in scene */
  sources: RemoteSource[];
}

/**
 * Remote source info
 */
export interface RemoteSource {
  /** Source ID */
  id: string;
  /** Source name */
  name: string;
  /** Source type */
  type: string;
  /** Is visible */
  visible: boolean;
  /** Is locked */
  locked: boolean;
}

/**
 * Remote audio source
 */
export interface RemoteAudioSource {
  /** Source ID */
  id: string;
  /** Source name */
  name: string;
  /** Volume level (0-1) */
  volume: number;
  /** Is muted */
  muted: boolean;
  /** Audio level (0-1) */
  level: number;
  /** Is monitoring */
  monitoring: boolean;
}

/**
 * Remote event
 */
export interface RemoteEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: string;
  /** Event title */
  title: string;
  /** Event description */
  description: string;
  /** Timestamp */
  timestamp: number;
  /** Additional data */
  data: Record<string, unknown>;
}

/**
 * Remote chat message
 */
export interface RemoteChatMessage {
  /** Message ID */
  id: string;
  /** Author name */
  author: string;
  /** Author avatar */
  avatar: string | null;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Platform */
  platform: string;
  /** Is highlighted */
  highlighted: boolean;
  /** Badges */
  badges: string[];
}

/**
 * Remote alert
 */
export interface RemoteAlert {
  /** Alert ID */
  id: string;
  /** Alert type */
  type: 'follow' | 'subscription' | 'donation' | 'raid' | 'host' | 'bits' | 'superchat';
  /** Username */
  username: string;
  /** Amount (if applicable) */
  amount: number | null;
  /** Message */
  message: string | null;
  /** Timestamp */
  timestamp: number;
  /** Is processed */
  processed: boolean;
}

/**
 * Remote management state
 */
export interface RemoteManagementState {
  /** Connection status */
  status: RemoteConnectionStatus;
  /** Server config */
  config: RemoteServerConfig;
  /** Active sessions */
  sessions: RemoteSession[];
  /** Connected clients */
  clients: RemoteClient[];
  /** Dashboard data */
  dashboardData: RemoteDashboardData | null;
  /** Server URL */
  serverUrl: string | null;
  /** QR code for connection */
  qrCode: string | null;
  /** Error message */
  error: string | null;
  /** Statistics */
  statistics: RemoteStatistics;
}

/**
 * Remote statistics
 */
export interface RemoteStatistics {
  /** Total connections */
  totalConnections: number;
  /** Total commands executed */
  totalCommands: number;
  /** Average response time */
  averageResponseTime: number;
  /** Uptime in seconds */
  uptime: number;
  /** Errors count */
  errorsCount: number;
  /** Last error timestamp */
  lastError: number | null;
}

// ============ Defaults ============

export const DEFAULT_REMOTE_SERVER_CONFIG: RemoteServerConfig = {
  enabled: false,
  port: 8080,
  httpsEnabled: false,
  authRequired: true,
  accessToken: null,
  sessionTimeout: 3600,
  maxConnections: 5,
  allowedIPs: [],
  rateLimit: 60,
  corsEnabled: true,
  corsOrigins: ['*'],
};

export const DEFAULT_REMOTE_STREAM_STATUS: RemoteStreamStatus = {
  isStreaming: false,
  isRecording: false,
  uptime: 0,
  currentScene: '',
  activeSources: [],
  viewerCount: 0,
  bitrate: 0,
  fps: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  droppedFrames: 0,
  streamTitle: '',
  streamCategory: '',
  isOnBreak: false,
  breakDuration: 0,
};

export const DEFAULT_REMOTE_STATISTICS: RemoteStatistics = {
  totalConnections: 0,
  totalCommands: 0,
  averageResponseTime: 0,
  uptime: 0,
  errorsCount: 0,
  lastError: null,
};

export const DEFAULT_REMOTE_MANAGEMENT_STATE: RemoteManagementState = {
  status: RemoteConnectionStatus.DISCONNECTED,
  config: DEFAULT_REMOTE_SERVER_CONFIG,
  sessions: [],
  clients: [],
  dashboardData: null,
  serverUrl: null,
  qrCode: null,
  error: null,
  statistics: DEFAULT_REMOTE_STATISTICS,
};