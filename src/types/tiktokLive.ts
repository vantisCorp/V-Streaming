/**
 * TikTok Live Streaming Integration Type Definitions
 * Types for TikTok Live API connection, streaming, and engagement
 */

// ============ Enums ============

export enum TikTokConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export enum TikTokStreamStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  LIVE = 'live',
  ENDING = 'ending',
  ENDED = 'ended',
}

export enum TikTokEventType {
  COMMENT = 'comment',
  GIFT = 'gift',
  LIKE = 'like',
  FOLLOW = 'follow',
  SHARE = 'share',
  JOIN = 'join',
  SUBSCRIBER = 'subscriber',
  ROOM_CHANGE = 'room_change',
  LIVE_END = 'live_end',
  CONTROL = 'control',
}

export enum TikTokGiftType {
  NORMAL = 'normal',
  STREAKABLE = 'streakable',
  SUBSCRIBER_ONLY = 'subscriber_only',
}

// ============ Interfaces ============

export interface TikTokLiveConfig {
  enabled: boolean;
  sessionId: string;
  roomId: string;
  uniqueId: string;
  username: string;
  autoConnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  streamSettings: TikTokStreamSettings;
  notifications: TikTokNotificationConfig[];
  engagement: TikTokEngagementConfig;
}

export interface TikTokConnectionState {
  status: TikTokConnectionStatus;
  connectedAt?: Date;
  username?: string;
  roomId?: string;
  viewerCount?: number;
  error?: string;
  reconnectAttempts: number;
  rateLimitRemaining: number;
  rateLimitReset?: Date;
}

export interface TikTokStreamSettings {
  autoAnnounceStreamStart: boolean;
  autoAnnounceStreamEnd: boolean;
  announcementTemplate: string;
  showViewerCount: boolean;
  showGiftNotifications: boolean;
  showFollowerNotifications: boolean;
  chatDisplayEnabled: boolean;
  giftGoalEnabled: boolean;
  giftGoalTarget: number;
  giftGoalCurrent: number;
}

export interface TikTokNotificationConfig {
  id: string;
  enabled: boolean;
  type: TikTokEventType;
  template: string;
  includeMedia: boolean;
  cooldown: number;
  filters?: TikTokNotificationFilter[];
}

export interface TikTokNotificationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number;
}

export interface TikTokEngagementConfig {
  autoReplyEnabled: boolean;
  autoReplyTemplate: string;
  thankFollowers: boolean;
  thankTemplate: string;
  thankGifters: boolean;
  giftThankTemplate: string;
  welcomeViewers: boolean;
  welcomeTemplate: string;
}

export interface TikTokUser {
  id: string;
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
  followingCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
  isSubscriber?: boolean;
  subscriberLevel?: number;
  badges?: TikTokUserBadge[];
}

export interface TikTokUserBadge {
  type: string;
  name: string;
  iconUrl?: string;
}

export interface TikTokGift {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  diamondCount: number;
  type: TikTokGiftType;
  repeatCount?: number;
  repeatEnd?: boolean;
}

export interface TikTokComment {
  id: string;
  userId: string;
  uniqueId: string;
  nickname: string;
  text: string;
  timestamp: Date;
  profilePictureUrl?: string;
  badges?: TikTokUserBadge[];
}

export interface TikTokGiftEvent {
  id: string;
  user: TikTokUser;
  gift: TikTokGift;
  repeatCount: number;
  diamondValue: number;
  timestamp: Date;
}

export interface TikTokLikeEvent {
  id: string;
  user: TikTokUser;
  likeCount: number;
  totalLikes: number;
  timestamp: Date;
}

export interface TikTokFollowEvent {
  id: string;
  user: TikTokUser;
  timestamp: Date;
}

export interface TikTokShareEvent {
  id: string;
  user: TikTokUser;
  shareCount: number;
  timestamp: Date;
}

export interface TikTokJoinEvent {
  id: string;
  user: TikTokUser;
  timestamp: Date;
}

export interface TikTokRoomInfo {
  roomId: string;
  title: string;
  description?: string;
  viewerCount: number;
  likeCount: number;
  diamondCount: number;
  startTime?: Date;
  endTime?: Date;
  thumbnailUrl?: string;
  streamUrl?: string;
  hostUser: TikTokUser;
}

export interface TikTokStatistics {
  totalViewers: number;
  peakViewers: number;
  totalLikes: number;
  totalDiamonds: number;
  totalGifts: number;
  totalComments: number;
  totalShares: number;
  totalFollows: number;
  streamDuration: number;
  averageViewers: number;
  newFollowers: number;
}

export interface TikTokScheduledNotification {
  id: string;
  type: TikTokEventType;
  message: string;
  scheduledFor: Date;
  sent: boolean;
}

// ============ Event Types ============

export interface TikTokLiveEvents {
  connectionStateChanged: (state: TikTokConnectionState) => void;
  connected: (user: TikTokUser, roomInfo: TikTokRoomInfo) => void;
  disconnected: () => void;
  error: (error: Error) => void;
  comment: (comment: TikTokComment) => void;
  gift: (event: TikTokGiftEvent) => void;
  like: (event: TikTokLikeEvent) => void;
  follow: (event: TikTokFollowEvent) => void;
  share: (event: TikTokShareEvent) => void;
  join: (event: TikTokJoinEvent) => void;
  viewerCountUpdated: (count: number) => void;
  streamStarted: () => void;
  streamEnded: () => void;
  statisticsUpdated: (stats: TikTokStatistics) => void;
  rateLimitWarning: (remaining: number, resetTime: Date) => void;
}

// ============ Default Config ============

export const DEFAULT_TIKTOK_LIVE_CONFIG: TikTokLiveConfig = {
  enabled: false,
  sessionId: '',
  roomId: '',
  uniqueId: '',
  username: '',
  autoConnect: false,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  streamSettings: {
    autoAnnounceStreamStart: true,
    autoAnnounceStreamEnd: true,
    announcementTemplate: '🔴 LIVE NOW! Come watch my stream on TikTok!',
    showViewerCount: true,
    showGiftNotifications: true,
    showFollowerNotifications: true,
    chatDisplayEnabled: true,
    giftGoalEnabled: false,
    giftGoalTarget: 10000,
    giftGoalCurrent: 0,
  },
  notifications: [],
  engagement: {
    autoReplyEnabled: false,
    autoReplyTemplate: 'Thanks for watching!',
    thankFollowers: true,
    thankTemplate: 'Thanks for following {username}!',
    thankGifters: true,
    giftThankTemplate: 'Thank you {username} for the {giftName}!',
    welcomeViewers: false,
    welcomeTemplate: 'Welcome {username}!',
  },
};