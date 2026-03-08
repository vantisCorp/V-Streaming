/**
 * Plugin System Types for V-Streaming
 * 
 * Provides type definitions for the plugin ecosystem including
 * plugin lifecycle, hooks, APIs, and platform extensions.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Plugin lifecycle status
 */
export enum PluginStatus {
  UNINSTALLED = 'uninstalled',
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  RUNNING = 'running',
  ERROR = 'error',
  DISABLED = 'disabled',
}

/**
 * Plugin type categorization
 */
export enum PluginType {
  STREAMING_PLATFORM = 'streaming_platform',
  OVERLAY = 'overlay',
  WIDGET = 'widget',
  ENCODER = 'encoder',
  AUDIO_PROCESSOR = 'audio_processor',
  VIDEO_FILTER = 'video_filter',
  CHATBOT = 'chatbot',
  ANALYTICS = 'analytics',
  MODERATION = 'moderation',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
  THEME = 'theme',
  UTILITY = 'utility',
  CUSTOM = 'custom',
}

/**
 * Plugin hook types for lifecycle events
 */
export enum PluginHookType {
  // Stream lifecycle hooks
  PRE_STREAM_START = 'pre_stream_start',
  POST_STREAM_START = 'post_stream_start',
  PRE_STREAM_END = 'pre_stream_end',
  POST_STREAM_END = 'post_stream_end',
  
  // Scene hooks
  PRE_SCENE_SWITCH = 'pre_scene_switch',
  POST_SCENE_SWITCH = 'post_scene_switch',
  
  // Audio hooks
  AUDIO_INPUT_PROCESS = 'audio_input_process',
  AUDIO_OUTPUT_PROCESS = 'audio_output_process',
  
  // Video hooks
  VIDEO_FRAME_PROCESS = 'video_frame_process',
  
  // Chat hooks
  CHAT_MESSAGE_RECEIVED = 'chat_message_received',
  CHAT_MESSAGE_SEND = 'chat_message_send',
  
  // Event hooks
  FOLLOW_EVENT = 'follow_event',
  SUBSCRIPTION_EVENT = 'subscription_event',
  DONATION_EVENT = 'donation_event',
  RAID_EVENT = 'raid_event',
  
  // Plugin lifecycle hooks
  PLUGIN_LOAD = 'plugin_load',
  PLUGIN_UNLOAD = 'plugin_unload',
  PLUGIN_ENABLE = 'plugin_enable',
  PLUGIN_DISABLE = 'plugin_disable',
}

/**
 * Plugin permission levels
 */
export enum PluginPermission {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  ADMIN = 'admin',
}

/**
 * Plugin API access levels
 */
export enum PluginAPIAccess {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  ADVANCED = 'advanced',
  FULL = 'full',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Plugin manifest metadata
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  authorUrl?: string;
  homepage?: string;
  repository?: string;
  license: string;
  keywords: string[];
  categories: PluginType[];
  icon?: string;
  screenshots?: string[];
  readme?: string;
  changelog?: string;
  
  // Dependencies
  dependencies?: PluginDependency[];
  peerDependencies?: PluginDependency[];
  incompatiblePlugins?: string[];
  
  // Requirements
  minAppVersion: string;
  maxAppVersion?: string;
  requiredPermissions: PluginPermission[];
  requiredAPIAccess: PluginAPIAccess;
  
  // Configuration
  hasSettings: boolean;
  settingsSchema?: PluginSettingSchema[];
  defaultConfig?: Record<string, unknown>;
  
  // Extension points
  provides?: PluginExtensionPoint[];
  consumes?: string[];
  
  // Platform-specific
  platforms?: ('windows' | 'macos' | 'linux')[];
}

/**
 * Plugin dependency definition
 */
export interface PluginDependency {
  pluginId: string;
  minVersion?: string;
  maxVersion?: string;
  required: boolean;
}

/**
 * Plugin setting schema for configuration UI
 */
export interface PluginSettingSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'file' | 'directory';
  label: string;
  description?: string;
  defaultValue: unknown;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  options?: { label: string; value: unknown }[];
}

/**
 * Plugin extension point definition
 */
export interface PluginExtensionPoint {
  id: string;
  name: string;
  description?: string;
  interface: string;
}

/**
 * Plugin configuration state
 */
export interface PluginConfig {
  enabled: boolean;
  autoStart: boolean;
  settings: Record<string, unknown>;
  permissions: PluginPermission[];
  lastUpdated: number;
}

/**
 * Plugin runtime state
 */
export interface PluginState {
  status: PluginStatus;
  error?: string;
  lastError?: string;
  loadTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  hooks: PluginHookRegistration[];
}

/**
 * Complete plugin information
 */
export interface Plugin {
  manifest: PluginManifest;
  config: PluginConfig;
  state: PluginState;
  instance?: PluginInstance;
}

/**
 * Plugin instance interface (implemented by plugin)
 */
export interface PluginInstance {
  // Lifecycle methods
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(): Promise<void>;
  onEnable?(): Promise<void>;
  onDisable?(): Promise<void>;
  
  // Configuration
  onSettingsChange?(settings: Record<string, unknown>): Promise<void>;
  
  // Hooks
  onHook?(event: PluginHookEvent): Promise<PluginHookResult>;
  
  // API
  getAPI?(): Record<string, unknown>;
}

/**
 * Plugin context provided to plugin instances
 */
export interface PluginContext {
  pluginId: string;
  manifest: PluginManifest;
  config: PluginConfig;
  logger: PluginLogger;
  storage: PluginStorage;
  api: PluginAPI;
  events: PluginEventEmitter;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/**
 * Plugin API interface
 */
export interface PluginAPI {
  // Stream control
  startStream(config?: unknown): Promise<void>;
  stopStream(): Promise<void>;
  getStreamStatus(): Promise<unknown>;
  
  // Scene management
  getScenes(): Promise<unknown[]>;
  getCurrentScene(): Promise<unknown>;
  switchScene(sceneId: string): Promise<void>;
  
  // Audio control
  getAudioSources(): Promise<unknown[]>;
  setVolume(sourceId: string, volume: number): Promise<void>;
  muteSource(sourceId: string, muted: boolean): Promise<void>;
  
  // Chat
  sendChatMessage(message: string): Promise<void>;
  getChatHistory(): Promise<unknown[]>;
  
  // Notifications
  showNotification(title: string, message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
  
  // HTTP requests
  fetch(url: string, options?: RequestInit): Promise<Response>;
  
  // Platform-specific
  invokeNative<T>(command: string, args?: unknown): Promise<T>;
}

/**
 * Plugin hook registration
 */
export interface PluginHookRegistration {
  hookType: PluginHookType;
  priority: number;
  handler: string; // Handler method name on plugin instance
}

/**
 * Plugin hook event data
 */
export interface PluginHookEvent {
  hookType: PluginHookType;
  timestamp: number;
  data: unknown;
  source?: string;
}

/**
 * Plugin hook result
 */
export interface PluginHookResult {
  handled: boolean;
  modified?: unknown;
  error?: string;
}

/**
 * Plugin event emitter interface
 */
export interface PluginEventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
}

/**
 * Plugin statistics
 */
export interface PluginStatistics {
  totalPlugins: number;
  enabledPlugins: number;
  runningPlugins: number;
  errorPlugins: number;
  byType: Record<PluginType, number>;
  byStatus: Record<PluginStatus, number>;
  totalHooks: number;
  totalMemoryUsage: number;
}

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  enabled: boolean;
  autoLoadPlugins: boolean;
  pluginDirectory: string;
  allowRemotePlugins: boolean;
  trustedAuthors: string[];
  sandboxEnabled: boolean;
  maxPlugins: number;
  updateCheckInterval: number;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  success: boolean;
  pluginId?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Plugin update info
 */
export interface PluginUpdateInfo {
  pluginId: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  changelog?: string;
  downloadUrl?: string;
}

/**
 * Streaming platform plugin interface (extends base plugin)
 */
export interface StreamingPlatformPlugin extends PluginInstance {
  // Platform identification
  getPlatformId(): string;
  getPlatformName(): string;
  getPlatformIcon(): string;
  
  // Connection
  connect(config: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Streaming
  goLive(config: unknown): Promise<void>;
  endLive(): Promise<void>;
  getStreamInfo(): Promise<unknown>;
  
  // Chat
  getChatMessages(): Promise<unknown[]>;
  sendChatMessage(message: string): Promise<void>;
  
  // Events
  onEvent(callback: (event: unknown) => void): void;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_PLUGIN_MANAGER_CONFIG: PluginManagerConfig = {
  enabled: true,
  autoLoadPlugins: true,
  pluginDirectory: './plugins',
  allowRemotePlugins: false,
  trustedAuthors: [],
  sandboxEnabled: true,
  maxPlugins: 50,
  updateCheckInterval: 3600000, // 1 hour
};

export const DEFAULT_PLUGIN_CONFIG: Omit<PluginConfig, 'lastUpdated'> = {
  enabled: false,
  autoStart: false,
  settings: {},
  permissions: [PluginPermission.READ],
};