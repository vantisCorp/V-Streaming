// ============================================================================
// STREAM DASHBOARD PRO - TYPE DEFINITIONS
// ============================================================================

import { EventEmitter } from 'events';

// ============================================================================
// ENUMS
// ============================================================================

export enum DashboardWidgetType {
  VIEWER_COUNT = 'viewer_count',
  CHAT_ACTIVITY = 'chat_activity',
  NEW_FOLLOWERS = 'new_followers',
  NEW_SUBSCRIBERS = 'new_subscribers',
  DONATIONS = 'donations',
  STREAM_UPTIME = 'stream_uptime',
  BITRATE = 'bitrate',
  FPS = 'fps',
  GOAL_PROGRESS = 'goal_progress',
  RAID_HOST = 'raid_host',
  TOP_CLIPS = 'top_clips',
  RECENT_EVENTS = 'recent_events',
  CHAT_PREVIEW = 'chat_preview',
  QUICK_ACTIONS = 'quick_actions'
}

export enum StreamEventType {
  FOLLOW = 'follow',
  SUBSCRIPTION = 'subscription',
  DONATION = 'donation',
  RAID = 'raid',
  HOST = 'host',
  CHEER = 'cheer',
  GIFT_SUB = 'gift_sub',
  COMMUNITY_GIFT = 'community_gift',
  NEW_CHAT = 'new_chat',
  NEW_VIEWER = 'new_viewer',
  MILESTONE = 'milestone',
  CUSTOM = 'custom'
}

export enum StreamGoalType {
  FOLLOWERS = 'followers',
  SUBSCRIBERS = 'subscribers',
  DONATIONS = 'donations',
  CHEERS = 'cheers',
  BITS = 'bits',
  VIEWERS = 'viewers',
  DURATION = 'duration'
}

export enum AlertStyle {
  NONE = 'none',
  POPUP = 'popup',
  OVERLAY = 'overlay',
  TEXT = 'text',
  CUSTOM = 'custom'
}

export enum ChatMessageRole {
  VIEWER = 'viewer',
  MODERATOR = 'moderator',
  BROADCASTER = 'broadcaster',
  VIP = 'vip',
  BOT = 'bot'
}

export enum ChatFilterType {
  SPAM = 'spam',
  LINKS = 'links',
  CAPS = 'caps',
  EMOTES = 'emotes',
  KEYWORDS = 'keywords',
  SYMBOLS = 'symbols'
}

// ============================================================================
// INTERFACES
// ============================================================================

// Dashboard Configuration
export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  enabled: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: WidgetConfig;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: number;
  updatedAt: number;
}

export interface StreamDashboardProSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  showNotifications: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  darkMode: boolean;
  activeLayout: string;
}

// Stream Events
export interface StreamEvent {
  id: string;
  type: StreamEventType;
  platform: string;
  timestamp: number;
  userId: string;
  username: string;
  userColor?: string;
  amount?: number;
  currency?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface EventStats {
  total: number;
  followers: number;
  subscribers: number;
  donations: number;
  donationAmount: number;
  cheers: number;
  cheerAmount: number;
  raids: number;
  raidViewers: number;
  hosts: number;
  hostViewers: number;
  giftSubs: number;
}

// Stream Goals
export interface StreamGoal {
  id: string;
  type: StreamGoalType;
  title: string;
  current: number;
  target: number;
  progress: number;
  enabled: boolean;
  deadline?: number;
  rewards?: string[];
}

// Chat System
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  role: ChatMessageRole;
  badges: string[];
  color: string;
  message: string;
  emotes: ChatEmote[];
  timestamp: number;
  isHighlight: boolean;
  isDeleted: boolean;
}

export interface ChatEmote {
  id: string;
  name: string;
  url: string;
  position: { start: number; end: number };
}

export interface ChatFilter {
  id: string;
  type: ChatFilterType;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  keywords?: string[];
  action: 'hide' | 'timeout' | 'ban';
  duration?: number;
}

export interface ChatSettings {
  slowMode: boolean;
  slowModeDelay: number;
  subscriberOnly: boolean;
  followerOnly: boolean;
  followerOnlyDuration: number;
  emoteOnly: boolean;
  filters: ChatFilter[];
}

// Alert System
export interface AlertConfig {
  id: string;
  eventType: StreamEventType;
  style: AlertStyle;
  enabled: boolean;
  duration: number;
  soundUrl?: string;
  soundVolume: number;
  imageUrl?: string;
  videoUrl?: string;
  textTemplate?: string;
  position: { x: number; y: number };
  scale: number;
  animation: string;
}

// Stream Statistics
export interface StreamSessionStats {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  platform: string;
  viewerPeak: number;
  viewerAverage: number;
  newFollowers: number;
  newSubscribers: number;
  giftSubs: number;
  totalDonations: number;
  donationCount: number;
  totalCheerBits: number;
  cheerCount: number;
  raidCount: number;
  raidViewers: number;
  hostCount: number;
  hostViewers: number;
  chatMessages: number;
  uniqueChatters: number;
}

export interface StreamDashboardStats {
  currentSession: StreamSessionStats | null;
  recentSessions: StreamSessionStats[];
  eventStats: EventStats;
  goals: StreamGoal[];
  viewerCount: number;
  chatRate: number;
}

// Quick Actions
export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  action: QuickActionType;
  config: Record<string, any>;
}

export enum QuickActionType {
  START_STREAM = 'start_stream',
  STOP_STREAM = 'stop_stream',
  START_RECORDING = 'start_recording',
  STOP_RECORDING = 'stop_recording',
  SWITCH_SCENE = 'switch_scene',
  SEND_MESSAGE = 'send_message',
  RUN_COMMERCIAL = 'run_commercial',
  MUTE_CHAT = 'mute_chat',
  UNMUTE_CHAT = 'unmute_chat',
  RAID = 'raid',
  CUSTOM = 'custom'
}

// ============================================================================
// MANAGER INTERFACE
// ============================================================================

export interface StreamDashboardProEvents {
  'dashboard-updated': DashboardLayout;
  'widget-added': DashboardWidget;
  'widget-removed': string;
  'event-received': StreamEvent;
  'stats-updated': StreamDashboardStats;
  'goal-progress': StreamGoal;
  'goal-reached': StreamGoal;
  'chat-message': ChatMessage;
  'alert-triggered': AlertConfig;
  'quick-action-executed': QuickAction;
}

export interface IStreamDashboardProManager {
  // Dashboard Management
  getDashboardLayout(): DashboardLayout;
  setDashboardLayout(layout: DashboardLayout): void;
  createLayout(name: string): DashboardLayout;
  deleteLayout(layoutId: string): void;
  
  // Widget Management
  getWidgets(): DashboardWidget[];
  addWidget(widget: Omit<DashboardWidget, 'id'>): string;
  removeWidget(widgetId: string): void;
  updateWidget(widgetId: string, updates: Partial<DashboardWidget>): void;
  moveWidget(widgetId: string, position: { x: number; y: number }): void;
  resizeWidget(widgetId: string, size: { width: number; height: number }): void;
  
  // Stream Events
  addEvent(event: Omit<StreamEvent, 'id' | 'timestamp'>): void;
  getEvents(limit?: number): StreamEvent[];
  getEventStats(): EventStats;
  clearEvents(): void;
  
  // Goals
  getGoals(): StreamGoal[];
  addGoal(goal: Omit<StreamGoal, 'id' | 'progress'>): string;
  updateGoal(goalId: string, updates: Partial<StreamGoal>): void;
  removeGoal(goalId: string): void;
  checkGoals(): void;
  
  // Chat
  getChatMessages(limit?: number): ChatMessage[];
  addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void;
  deleteChatMessage(messageId: string): void;
  clearChat(): void;
  getChatSettings(): ChatSettings;
  updateChatSettings(settings: Partial<ChatSettings>): void;
  
  // Alerts
  getAlertConfigs(): AlertConfig[];
  addAlertConfig(config: Omit<AlertConfig, 'id'>): string;
  updateAlertConfig(configId: string, updates: Partial<AlertConfig>): void;
  removeAlertConfig(configId: string): void;
  triggerAlert(event: StreamEvent): void;
  
  // Statistics
  getStats(): StreamDashboardStats;
  updateViewerCount(count: number): void;
  updateChatRate(rate: number): void;
  startStreamSession(platform: string): string;
  endStreamSession(): StreamSessionStats;
  getStreamSessions(limit?: number): StreamSessionStats[];
  
  // Quick Actions
  getQuickActions(): QuickAction[];
  addQuickAction(action: Omit<QuickAction, 'id'>): string;
  removeQuickAction(actionId: string): void;
  executeQuickAction(actionId: string): void;
  
  // Settings
  getSettings(): StreamDashboardProSettings;
  updateSettings(settings: Partial<StreamDashboardProSettings>): void;
  resetSettings(): void;
  
  // Persistence
  saveToStorage(): void;
  loadFromStorage(): void;
}

// ============================================================================
// PERSISTENCE
// ============================================================================

export interface StreamDashboardProStorage {
  settings: StreamDashboardProSettings;
  layouts: DashboardLayout[];
  widgets: DashboardWidget[];
  goals: StreamGoal[];
  alertConfigs: AlertConfig[];
  quickActions: QuickAction[];
  chatSettings: ChatSettings;
  sessions: StreamSessionStats[];
  events: StreamEvent[];
}

export const DEFAULT_STREAM_DASHBOARD_SETTINGS: StreamDashboardProSettings = {
  autoRefresh: true,
  refreshInterval: 5000,
  showNotifications: true,
  soundEnabled: true,
  compactMode: false,
  darkMode: true,
  activeLayout: 'default'
};

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  widgets: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  slowMode: false,
  slowModeDelay: 30,
  subscriberOnly: false,
  followerOnly: false,
  followerOnlyDuration: 0,
  emoteOnly: false,
  filters: []
};