/**
 * Discord Bot Integration Type Definitions
 * Types for Discord bot connection, commands, and notifications
 */

// ============ Enums ============

export enum DiscordConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export enum DiscordMessageType {
  TEXT = 'text',
  EMBED = 'embed',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

export enum DiscordNotificationType {
  STREAM_START = 'stream_start',
  STREAM_END = 'stream_end',
  NEW_FOLLOWER = 'new_follower',
  NEW_SUBSCRIBER = 'new_subscriber',
  DONATION = 'donation',
  RAID = 'raid',
  HOST = 'host',
  CHEER = 'cheer',
  MILESTONE = 'milestone',
  CUSTOM = 'custom',
}

export enum DiscordCommandPermission {
  EVERYONE = 'everyone',
  SUBSCRIBER = 'subscriber',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum DiscordEmbedColor {
  DEFAULT = 0,
  AQUA = 1752220,
  GREEN = 3066993,
  BLUE = 3447003,
  PURPLE = 10181046,
  GOLD = 15844367,
  ORANGE = 15105570,
  RED = 15158332,
  GREY = 9807270,
  DARKER_GREY = 8359053,
  NAVY = 3426654,
  DARK_AQUA = 1146986,
  DARK_GREEN = 2067276,
  DARK_BLUE = 2123412,
  DARK_PURPLE = 7419530,
  DARK_GOLD = 12745742,
  DARK_ORANGE = 11027200,
  DARK_RED = 10038562,
  DARK_GREY = 9936031,
  LIGHT_GREY = 12370112,
  DARK_NAVY = 2899536,
  LUMINOUS_VIVID_PINK = 16580705,
  DARK_VIVID_PINK = 12320855,
}

export enum DiscordActivityType {
  PLAYING = 'PLAYING',
  STREAMING = 'STREAMING',
  LISTENING = 'LISTENING',
  WATCHING = 'WATCHING',
  COMPETING = 'COMPETING',
}

// ============ Interfaces ============

export interface DiscordBotConfig {
  enabled: boolean;
  botToken: string;
  clientId: string;
  clientSecret?: string;
  guildId?: string;
  channelId?: string;
  prefix: string;
  autoConnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  notifications: DiscordNotificationConfig[];
  commands: DiscordCommandConfig[];
  presence: DiscordPresenceConfig;
  embedSettings: DiscordEmbedSettings;
}

export interface DiscordConnectionState {
  status: DiscordConnectionStatus;
  connectedAt?: Date;
  guildName?: string;
  channelName?: string;
  botName?: string;
  botAvatar?: string;
  error?: string;
  reconnectAttempts: number;
  latency: number;
}

export interface DiscordNotificationConfig {
  id: string;
  enabled: boolean;
  type: DiscordNotificationType;
  channelId: string;
  template: string;
  embedEnabled: boolean;
  embedColor: DiscordEmbedColor;
  embedThumbnail?: string;
  embedImage?: string;
  mentionEveryone: boolean;
  mentionRoleIds: string[];
  cooldown: number;
  filters?: DiscordNotificationFilter[];
}

export interface DiscordNotificationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number;
}

export interface DiscordCommandConfig {
  id: string;
  enabled: boolean;
  name: string;
  description: string;
  permission: DiscordCommandPermission;
  cooldown: number;
  aliases: string[];
  response: string;
  embedEnabled: boolean;
  embedColor: DiscordEmbedColor;
  executeScript?: string;
}

export interface DiscordPresenceConfig {
  enabled: boolean;
  activityType: DiscordActivityType;
  activityName: string;
  activityUrl?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  autoUpdate: boolean;
  streamStatus: boolean;
}

export interface DiscordEmbedSettings {
  defaultColor: DiscordEmbedColor;
  showTimestamp: boolean;
  showFooter: boolean;
  footerText: string;
  footerIcon?: string;
  showAuthor: boolean;
  authorName?: string;
  authorIcon?: string;
  authorUrl?: string;
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  guildId?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorIsBot: boolean;
  content: string;
  type: DiscordMessageType;
  timestamp: Date;
  embeds?: DiscordEmbed[];
  attachments?: DiscordAttachment[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: DiscordEmbedColor;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
    width?: number;
    height?: number;
  };
  thumbnail?: {
    url: string;
    width?: number;
    height?: number;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: DiscordEmbedField[];
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  proxyUrl?: string;
  size: number;
  contentType?: string;
  width?: number;
  height?: number;
}

export interface DiscordChannel {
  id: string;
  guildId: string;
  name: string;
  type: DiscordChannelType;
  position: number;
  parentId?: string;
  topic?: string;
  nsfw: boolean;
  permissions?: DiscordChannelPermission[];
}

export enum DiscordChannelType {
  TEXT = 0,
  DM = 1,
  VOICE = 2,
  GROUP_DM = 3,
  CATEGORY = 4,
  NEWS = 5,
  NEWS_THREAD = 10,
  PUBLIC_THREAD = 11,
  PRIVATE_THREAD = 12,
  STAGE_VOICE = 13,
  DIRECTORY = 14,
  FORUM = 15,
}

export interface DiscordChannelPermission {
  id: string;
  type: 'role' | 'member';
  allow: string[];
  deny: string[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
  channels: DiscordChannel[];
  roles: DiscordRole[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string[];
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordNotificationEvent {
  id: string;
  type: DiscordNotificationType;
  timestamp: Date;
  channelId: string;
  messageId?: string;
  success: boolean;
  error?: string;
  data: Record<string, unknown>;
}

export interface DiscordCommandExecution {
  id: string;
  commandName: string;
  userId: string;
  userName: string;
  channelId: string;
  guildId?: string;
  timestamp: Date;
  arguments: string[];
  response: string;
  success: boolean;
  error?: string;
}

export interface DiscordBotStatistics {
  messagesSent: number;
  messagesReceived: number;
  commandsExecuted: number;
  notificationsSent: number;
  errorsCount: number;
  uptime: number;
  lastActivity?: Date;
  serversConnected: number;
  usersReached: number;
}

// ============ Default Config ============

export const DEFAULT_DISCORD_BOT_CONFIG: DiscordBotConfig = {
  enabled: false,
  botToken: '',
  clientId: '',
  prefix: '!',
  autoConnect: false,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  notifications: [],
  commands: [],
  presence: {
    enabled: true,
    activityType: DiscordActivityType.STREAMING,
    activityName: 'Live Stream',
    status: 'online',
    autoUpdate: true,
    streamStatus: true,
  },
  embedSettings: {
    defaultColor: DiscordEmbedColor.PURPLE,
    showTimestamp: true,
    showFooter: true,
    footerText: 'V-Streaming Bot',
    showAuthor: false,
  },
};

export const DEFAULT_DISCORD_NOTIFICATION: Partial<DiscordNotificationConfig> = {
  enabled: true,
  embedEnabled: true,
  embedColor: DiscordEmbedColor.PURPLE,
  mentionEveryone: false,
  mentionRoleIds: [],
  cooldown: 0,
};

export const DEFAULT_DISCORD_COMMAND: Partial<DiscordCommandConfig> = {
  enabled: true,
  permission: DiscordCommandPermission.EVERYONE,
  cooldown: 3,
  aliases: [],
  embedEnabled: false,
  embedColor: DiscordEmbedColor.DEFAULT,
};