/**
 * Twitter/X Streaming Integration Type Definitions
 * Types for Twitter/X API connection, streaming, and engagement
 */

// ============ Enums ============

export enum TwitterConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export enum TwitterStreamStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  LIVE = 'live',
  ENDING = 'ending',
  ENDED = 'ended',
}

export enum TwitterMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  GIF = 'gif',
}

export enum TwitterPollDuration {
  FIVE_MINUTES = 5,
  THIRTY_MINUTES = 30,
  ONE_HOUR = 60,
  SIX_HOURS = 360,
  TWELVE_HOURS = 720,
  TWENTY_FOUR_HOURS = 1440,
  TWO_DAYS = 2880,
  SEVEN_DAYS = 10080,
}

export enum TwitterSpaceState {
  NOT_STARTED = 'not_started',
  LIVE = 'live',
  ENDED = 'ended',
}

export enum TwitterNotificationType {
  STREAM_START = 'stream_start',
  STREAM_END = 'stream_end',
  NEW_FOLLOWER = 'new_follower',
  NEW_SUBSCRIBER = 'new_subscriber',
  MENTION = 'mention',
  QUOTE_TWEET = 'quote_tweet',
  RETWEET = 'retweet',
  LIKE_MILESTONE = 'like_milestone',
  CUSTOM = 'custom',
}

// ============ Interfaces ============

export interface TwitterXConfig {
  enabled: boolean;
  apiKey: string;
  apiSecret: string;
  bearerToken: string;
  accessToken: string;
  accessTokenSecret: string;
  accountId: string;
  username: string;
  autoConnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  streamSettings: TwitterStreamSettings;
  notifications: TwitterNotificationConfig[];
  autoPost: TwitterAutoPostConfig;
  engagement: TwitterEngagementConfig;
}

export interface TwitterConnectionState {
  status: TwitterConnectionStatus;
  connectedAt?: Date;
  username?: string;
  accountId?: string;
  profileImageUrl?: string;
  error?: string;
  reconnectAttempts: number;
  rateLimitRemaining: number;
  rateLimitReset?: Date;
}

export interface TwitterStreamSettings {
  autoTweetOnStart: boolean;
  autoTweetOnEnd: boolean;
  tweetTemplate: string;
  includeThumbnail: boolean;
  includeLink: boolean;
  hashtags: string[];
  mentionAccounts: string[];
}

export interface TwitterNotificationConfig {
  id: string;
  enabled: boolean;
  type: TwitterNotificationType;
  template: string;
  includeMedia: boolean;
  cooldown: number;
  filters?: TwitterNotificationFilter[];
}

export interface TwitterNotificationFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string | number;
}

export interface TwitterAutoPostConfig {
  enabled: boolean;
  postFollowers: boolean;
  postMilestones: boolean;
  postSchedule: boolean;
  milestoneThresholds: number[];
  scheduleTemplate: string;
}

export interface TwitterEngagementConfig {
  autoLikeMentions: boolean;
  autoRetweetMentions: boolean;
  autoReplyEnabled: boolean;
  autoReplyTemplate: string;
  thankFollowers: boolean;
  thankTemplate: string;
}

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  bearerToken: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  createdAt: Date;
  publicMetrics: TwitterTweetMetrics;
  entities?: TwitterTweetEntities;
  inReplyToTweetId?: string;
  referencedTweets?: TwitterReferencedTweet[];
  attachments?: TwitterMediaAttachment[];
  poll?: TwitterPoll;
}

export interface TwitterTweetMetrics {
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount?: number;
  bookmarkCount: number;
  impressionCount: number;
}

export interface TwitterTweetEntities {
  hashtags?: TwitterEntity[];
  mentions?: TwitterMention[];
  urls?: TwitterUrl[];
  cashtags?: TwitterEntity[];
}

export interface TwitterEntity {
  start: number;
  end: number;
  tag?: string;
}

export interface TwitterMention {
  start: number;
  end: number;
  username: string;
  id: string;
}

export interface TwitterUrl {
  start: number;
  end: number;
  url: string;
  expandedUrl: string;
  displayUrl: string;
  images?: TwitterUrlImage[];
}

export interface TwitterUrlImage {
  url: string;
  width: number;
  height: number;
}

export interface TwitterReferencedTweet {
  type: 'retweeted' | 'quoted' | 'replied_to';
  id: string;
}

export interface TwitterMediaAttachment {
  mediaKey: string;
  type: TwitterMediaType;
  url: string;
  previewImageUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
}

export interface TwitterPoll {
  id: string;
  options: TwitterPollOption[];
  durationMinutes: number;
  endDatetime: Date;
  votingStatus: 'open' | 'closed';
}

export interface TwitterPollOption {
  position: number;
  label: string;
  votes: number;
}

export interface TwitterSpace {
  id: string;
  state: TwitterSpaceState;
  title: string;
  creatorId: string;
  creatorUsername: string;
  scheduledStart?: Date;
  startedAt?: Date;
  endedAt?: Date;
  participantCount: number;
  listenerCount?: number;
  isTicketed: boolean;
  topics?: string[];
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profileImageUrl?: string;
  location?: string;
  url?: string;
  verified: boolean;
  verifiedType?: 'blue' | 'gold' | 'government' | 'business';
  publicMetrics: TwitterUserMetrics;
  createdAt: Date;
  protected: boolean;
}

export interface TwitterUserMetrics {
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  likeCount?: number;
}

export interface TwitterNotificationEvent {
  id: string;
  type: TwitterNotificationType;
  timestamp: Date;
  tweetId?: string;
  success: boolean;
  error?: string;
  data: Record<string, unknown>;
}

export interface TwitterStatistics {
  tweetsSent: number;
  tweetsScheduled: number;
  likesReceived: number;
  retweetsReceived: number;
  repliesReceived: number;
  quotesReceived: number;
  newFollowers: number;
  mentions: number;
  spacesHosted: number;
  errorsCount: number;
  uptime: number;
  lastActivity?: Date;
  totalImpressions: number;
  engagementRate: number;
}

export interface TwitterRateLimit {
  endpoint: string;
  limit: number;
  remaining: number;
  reset: Date;
}

export interface TwitterScheduledTweet {
  id: string;
  text: string;
  scheduledAt: Date;
  mediaIds?: string[];
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  postedAt?: Date;
  tweetId?: string;
  error?: string;
}

// ============ Default Config ============

export const DEFAULT_TWITTER_X_CONFIG: TwitterXConfig = {
  enabled: false,
  apiKey: '',
  apiSecret: '',
  bearerToken: '',
  accessToken: '',
  accessTokenSecret: '',
  accountId: '',
  username: '',
  autoConnect: false,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  streamSettings: {
    autoTweetOnStart: true,
    autoTweetOnEnd: true,
    tweetTemplate: '🔴 LIVE NOW! Watch me stream {game} on {platform}\n\n{link}',
    includeThumbnail: true,
    includeLink: true,
    hashtags: ['streaming', 'live'],
    mentionAccounts: [],
  },
  notifications: [],
  autoPost: {
    enabled: true,
    postFollowers: true,
    postMilestones: true,
    postSchedule: true,
    milestoneThresholds: [100, 500, 1000, 5000, 10000],
    scheduleTemplate: '📅 Join me for my next stream on {date} at {time}!',
  },
  engagement: {
    autoLikeMentions: false,
    autoRetweetMentions: false,
    autoReplyEnabled: false,
    autoReplyTemplate: 'Thanks for the mention! 🙏',
    thankFollowers: true,
    thankTemplate: 'Thanks for following! 🎉',
  },
};

export const DEFAULT_TWITTER_NOTIFICATION: Partial<TwitterNotificationConfig> = {
  enabled: true,
  includeMedia: false,
  cooldown: 0,
};

export const DEFAULT_TWITTER_TWEET_TEMPLATE = '🔴 LIVE NOW! Playing {game} on {platform}\n\nJoin: {link}\n\n{hashtags}';