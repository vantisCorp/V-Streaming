/**
 * Multi-Platform Streaming Type Definitions
 * Support for simultaneous streaming to multiple platforms
 */

export type StreamingPlatform = 
  | 'twitch'
  | 'youtube'
  | 'kick'
  | 'facebook'
  | 'tiktok'
  | 'trovo'
  | 'dlive'
  | 'rumble'
  | 'custom';

export interface StreamPlatformConfig {
  platform: StreamingPlatform;
  enabled: boolean;
  name: string;
  rtmpUrl: string;
  streamKey: string;
  quality: StreamQuality;
  bitrate: number;
  fps: number;
  latency: StreamLatency;
  customMetadata?: PlatformMetadata;
  health: PlatformHealth;
  isActive: boolean;
}

export type StreamQuality = 
  | 'source'
  | '1080p60'
  | '1080p30'
  | '720p60'
  | '720p30'
  | '480p30'
  | '360p30'
  | 'audio_only';

export type StreamLatency = 
  | 'ultra_low'
  | 'low'
  | 'normal'
  | 'high';

export interface PlatformMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  language?: string;
  thumbnailUrl?: string;
  isMature?: boolean;
  isPrivate?: boolean;
  scheduleTime?: Date;
}

export interface PlatformHealth {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  bitrate: number;
  fps: number;
  droppedFrames: number;
  latency: number;
  lastUpdate: Date;
  error?: string;
}

export interface MultiPlatformConfig {
  enabled: boolean;
  platforms: StreamPlatformConfig[];
  syncSettings: SyncSettings;
  chatIntegration: ChatIntegrationSettings;
  healthMonitoring: HealthMonitoringSettings;
}

export interface SyncSettings {
  syncChat: boolean;
  syncEmotes: boolean;
  syncCommands: boolean;
  syncModeration: boolean;
  unifiedChat: boolean;
  crossPlatformNotifications: boolean;
}

export interface ChatIntegrationSettings {
  enabled: boolean;
  platforms: StreamingPlatform[];
  filterCommands: boolean;
  filterEmotes: boolean;
  highlightPlatform: boolean;
  platformColors: Record<StreamingPlatform, string>;
  maxMessagesPerSecond: number;
}

export interface HealthMonitoringSettings {
  enabled: boolean;
  checkInterval: number; // seconds
  alertOnDisconnect: boolean;
  alertOnLowBitrate: boolean;
  minBitrateThreshold: number;
  alertOnDroppedFrames: boolean;
  maxDroppedFramesThreshold: number;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number; // seconds
}

export interface StreamAnalytics {
  platform: StreamingPlatform;
  viewerCount: number;
  peakViewers: number;
  duration: number; // seconds
  averageBitrate: number;
  droppedFrames: number;
  totalMessages: number;
  totalFollowers: number;
  newFollowers: number;
  totalSubscribers: number;
  newSubscribers: number;
  totalDonations: number;
  totalDonationsAmount: number;
  startTime: Date;
  endTime?: Date;
}

export interface MultiPlatformAnalytics {
  totalViewers: number;
  peakTotalViewers: number;
  averageViewers: number;
  totalDuration: number;
  platformAnalytics: StreamAnalytics[];
  aggregatedMetrics: AggregatedMetrics;
}

export interface AggregatedMetrics {
  totalMessages: number;
  totalFollowers: number;
  newFollowers: number;
  totalSubscribers: number;
  newSubscribers: number;
  totalDonations: number;
  totalDonationsAmount: number;
  mostActivePlatform: StreamingPlatform;
  fastestGrowingPlatform: StreamingPlatform;
}

export interface PlatformPreset {
  id: string;
  name: string;
  platform: StreamingPlatform;
  description: string;
  rtmpUrl: string;
  defaultQuality: StreamQuality;
  defaultBitrate: number;
  defaultFps: number;
  supportedQualities: StreamQuality[];
  icon: string;
  color: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'preset-twitch',
    name: 'Twitch',
    platform: 'twitch',
    description: 'Live streaming platform focused on video games',
    rtmpUrl: 'rtmp://live.twitch.tv/app/',
    defaultQuality: '1080p60',
    defaultBitrate: 6000,
    defaultFps: 60,
    supportedQualities: ['source', '1080p60', '1080p30', '720p60', '720p30', '480p30', '360p30'],
    icon: '🟣',
    color: '#9146FF',
  },
  {
    id: 'preset-youtube',
    name: 'YouTube',
    platform: 'youtube',
    description: 'Video sharing and live streaming platform',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2/',
    defaultQuality: '1080p60',
    defaultBitrate: 8000,
    defaultFps: 60,
    supportedQualities: ['source', '1080p60', '1080p30', '720p60', '720p30', '480p30', '360p30'],
    icon: '🔴',
    color: '#FF0000',
  },
  {
    id: 'preset-kick',
    name: 'Kick',
    platform: 'kick',
    description: 'New live streaming platform',
    rtmpUrl: 'rtmp://fa703.compute-1.amazonaws.com/live/',
    defaultQuality: '1080p60',
    defaultBitrate: 6000,
    defaultFps: 60,
    supportedQualities: ['source', '1080p60', '1080p30', '720p60', '720p30', '480p30', '360p30'],
    icon: '🟢',
    color: '#53FC18',
  },
  {
    id: 'preset-facebook',
    name: 'Facebook Gaming',
    platform: 'facebook',
    description: 'Social media live streaming',
    rtmpUrl: 'rtmps://live-api-s.facebook.com:443/rtmp/',
    defaultQuality: '720p30',
    defaultBitrate: 4000,
    defaultFps: 30,
    supportedQualities: ['1080p30', '720p30', '480p30', '360p30'],
    icon: '🔵',
    color: '#1877F2',
  },
  {
    id: 'preset-tiktok',
    name: 'TikTok',
    platform: 'tiktok',
    description: 'Short video and live streaming platform',
    rtmpUrl: 'rtmp://tiktok.com/live/',
    defaultQuality: '720p30',
    defaultBitrate: 3000,
    defaultFps: 30,
    supportedQualities: ['720p30', '480p30', '360p30'],
    icon: '⚫',
    color: '#000000',
  },
  {
    id: 'preset-trovo',
    name: 'Trovo',
    platform: 'trovo',
    description: 'Live streaming and gaming community',
    rtmpUrl: 'rtmp://livepush.trovo.live/live/',
    defaultQuality: '1080p30',
    defaultBitrate: 5000,
    defaultFps: 30,
    supportedQualities: ['1080p30', '720p30', '480p30', '360p30'],
    icon: '🟠',
    color: '#FF6B00',
  },
  {
    id: 'preset-dlive',
    name: 'DLive',
    platform: 'dlive',
    description: 'Blockchain-based live streaming platform',
    rtmpUrl: 'rtmp://stream.dlive.tv/live/',
    defaultQuality: '1080p30',
    defaultBitrate: 5000,
    defaultFps: 30,
    supportedQualities: ['1080p30', '720p30', '480p30', '360p30'],
    icon: '🟡',
    color: '#1DA1F2',
  },
  {
    id: 'preset-rumble',
    name: 'Rumble',
    platform: 'rumble',
    description: 'Video hosting and live streaming',
    rtmpUrl: 'rtmp://live.rumble.com/live/',
    defaultQuality: '720p30',
    defaultBitrate: 4000,
    defaultFps: 30,
    supportedQualities: ['1080p30', '720p30', '480p30', '360p30'],
    icon: '🔶',
    color: '#83CC29',
  },
];

export const DEFAULT_MULTIPLATFORM_CONFIG: MultiPlatformConfig = {
  enabled: false,
  platforms: [],
  syncSettings: {
    syncChat: true,
    syncEmotes: true,
    syncCommands: true,
    syncModeration: true,
    unifiedChat: true,
    crossPlatformNotifications: true,
  },
  chatIntegration: {
    enabled: true,
    platforms: ['twitch', 'youtube'],
    filterCommands: true,
    filterEmotes: false,
    highlightPlatform: true,
    platformColors: {
      twitch: '#9146FF',
      youtube: '#FF0000',
      kick: '#53FC18',
      facebook: '#1877F2',
      tiktok: '#000000',
      trovo: '#FF6B00',
      dlive: '#1DA1F2',
      rumble: '#83CC29',
      custom: '#666666',
    },
    maxMessagesPerSecond: 100,
  },
  healthMonitoring: {
    enabled: true,
    checkInterval: 5,
    alertOnDisconnect: true,
    alertOnLowBitrate: true,
    minBitrateThreshold: 3000,
    alertOnDroppedFrames: true,
    maxDroppedFramesThreshold: 5,
    autoReconnect: true,
    reconnectAttempts: 3,
    reconnectDelay: 10,
  },
};