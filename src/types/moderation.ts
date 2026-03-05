/**
 * Moderation type definitions for Integrated Chat Moderation Tools
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Moderation action type enum
 */
export enum ModerationActionType {
  TIMEOUT = 'timeout',
  BAN = 'ban',
  UNBAN = 'unban',
  DELETE_MESSAGE = 'delete_message',
  WARN = 'warn',
  PURGE = 'purge',
  SLOW_MODE = 'slow_mode',
  SUBSCRIBER_MODE = 'subscriber_mode',
  FOLLOWER_MODE = 'follower_mode',
  EMOTE_ONLY = 'emote_only',
  R9K_MODE = 'r9k_mode',
}

/**
 * Moderation rule type enum
 */
export enum ModerationRuleType {
  PROFANITY = 'profanity',
  SPAM = 'spam',
  LINKS = 'links',
  CAPS = 'caps',
  EMOTE_SPAM = 'emote_spam',
  CUSTOM_WORDS = 'custom_words',
  URL_SHORTENERS = 'url_shorteners',
  SYMBOLS = 'symbols',
  REPETITION = 'repetition',
  ZALGO = 'zalgo',
  MASS_MENTION = 'mass_mention',
  RAID_PROTECTION = 'raid_protection',
  FOLLOWER_AGE = 'follower_age',
  ACCOUNT_AGE = 'account_age',
}

/**
 * Moderation severity enum
 */
export enum ModerationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Moderation status enum
 */
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  APPEALED = 'appealed',
}

/**
 * Trust level enum
 */
export enum TrustLevel {
  NEW = 'new',
  FOLLOWER = 'follower',
  SUBSCRIBER = 'subscriber',
  VIP = 'vip',
  MODERATOR = 'moderator',
  REGULAR = 'regular',
}

/**
 * AutoMod action enum
 */
export enum AutoModAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  FLAG = 'flag',
  TIMEOUT = 'timeout',
}

/**
 * Moderation log type enum
 */
export enum ModerationLogType {
  ACTION_TAKEN = 'action_taken',
  RULE_TRIGGERED = 'rule_triggered',
  SETTINGS_CHANGED = 'settings_changed',
  USER_EXEMPTED = 'user_exempted',
  WORD_ADDED = 'word_added',
  WORD_REMOVED = 'word_removed',
  APPEAL_SUBMITTED = 'appeal_submitted',
  APPEAL_RESOLVED = 'appeal_resolved',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  content: string;
  timestamp: Date;
  platform: string;
  channelId: string;
  badges: string[];
  color: string;
  emotes: ChatEmote[];
  isDeleted: boolean;
  isHighlighted: boolean;
  isModerator: boolean;
  isSubscriber: boolean;
  isVip: boolean;
  isFirstMessage: boolean;
  isReturning: boolean;
  isSuspicious: boolean;
  flags: ModerationFlag[];
}

/**
 * Chat emote interface
 */
export interface ChatEmote {
  id: string;
  name: string;
  positions: [number, number][];
}

/**
 * Moderation flag interface
 */
export interface ModerationFlag {
  type: ModerationRuleType;
  severity: ModerationSeverity;
  reason: string;
  details?: string;
  ruleId?: string;
}

/**
 * Moderation rule interface
 */
export interface ModerationRule {
  id: string;
  name: string;
  type: ModerationRuleType;
  enabled: boolean;
  severity: ModerationSeverity;
  action: ModerationActionType;
  duration: number; // seconds for timeout
  warnFirst: boolean;
  warnMessage?: string;
  exemptUsers: string[];
  exemptRoles: TrustLevel[];
  customWords?: string[];
  patterns?: string[];
  threshold?: number;
  cooldown?: number;
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
}

/**
 * Moderation action record interface
 */
export interface ModerationActionRecord {
  id: string;
  actionType: ModerationActionType;
  userId: string;
  username: string;
  moderatorId: string;
  moderatorUsername: string;
  reason: string;
  duration?: number;
  platform: string;
  channelId: string;
  messageId?: string;
  messageContent?: string;
  status: ModerationStatus;
  createdAt: Date;
  expiresAt?: Date;
  appealId?: string;
  notes?: string;
}

/**
 * Moderation appeal interface
 */
export interface ModerationAppeal {
  id: string;
  actionId: string;
  userId: string;
  username: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  response?: string;
}

/**
 * Moderation log entry interface
 */
export interface ModerationLogEntry {
  id: string;
  type: ModerationLogType;
  action?: ModerationActionRecord;
  rule?: ModerationRule;
  userId?: string;
  username?: string;
  moderatorId: string;
  moderatorUsername: string;
  details: string;
  platform: string;
  channelId: string;
  timestamp: Date;
}

/**
 * Moderation statistics interface
 */
export interface ModerationStatistics {
  totalActions: number;
  todayActions: number;
  weeklyActions: number;
  monthlyActions: number;
  actionsByType: Record<ModerationActionType, number>;
  actionsBySeverity: Record<ModerationSeverity, number>;
  topModerators: ModeratorStats[];
  topReasons: { reason: string; count: number }[];
  activeRules: number;
  triggeredRules: number;
  appealsPending: number;
  appealsApproved: number;
  appealsRejected: number;
  averageResponseTime: number;
}

/**
 * Moderator stats interface
 */
export interface ModeratorStats {
  userId: string;
  username: string;
  actionCount: number;
  lastActive: Date;
}

/**
 * Moderation settings interface
 */
export interface ModerationSettings {
  enabled: boolean;
  autoModerationEnabled: boolean;
  logEnabled: boolean;
  logChannel?: string;
  notifyModerators: boolean;
  notifyUsers: boolean;
  warningMessage: string;
  timeoutMessage: string;
  banMessage: string;
  warningThreshold: number;
  timeoutDuration: number;
  maxTimeoutDuration: number;
  bannedWords: string[];
  permittedLinks: string[];
  permittedUsers: string[];
  permittedRoles: TrustLevel[];
  slowModeDuration: number;
  slowModeEnabled: boolean;
  followerModeDuration: number;
  followerModeEnabled: boolean;
  subscriberModeEnabled: boolean;
  emoteOnlyEnabled: boolean;
  r9kModeEnabled: boolean;
  raidProtectionEnabled: boolean;
  raidProtectionThreshold: number;
  raidProtectionAction: ModerationActionType;
  trustLevels: Record<TrustLevel, TrustLevelConfig>;
}

/**
 * Trust level config interface
 */
export interface TrustLevelConfig {
  minFollowTime: number;
  minMessages: number;
  autoExempt: boolean;
  canPostLinks: boolean;
  canUseEmotes: boolean;
  maxCaps: number;
  maxEmotes: number;
}

/**
 * Spam detection config interface
 */
export interface SpamDetectionConfig {
  enabled: boolean;
  maxRepetition: number;
  maxCapsPercent: number;
  maxEmotes: number;
  maxMentions: number;
  maxNewlines: number;
  maxSymbols: number;
  maxZalgo: number;
  blockedPatterns: string[];
  allowedEmotes: string[];
}

/**
 * Chat user info interface
 */
export interface ChatUserInfo {
  userId: string;
  username: string;
  displayName: string;
  trustLevel: TrustLevel;
  followerSince?: Date;
  subscriberSince?: Date;
  messages: number;
  warnings: number;
  timeouts: number;
  bans: number;
  lastMessage?: Date;
  firstSeen: Date;
  isExempt: boolean;
  notes: string[];
}

/**
 * Moderation queue entry interface
 */
export interface ModerationQueueEntry {
  id: string;
  message: ChatMessage;
  flags: ModerationFlag[];
  suggestedAction: ModerationActionType;
  suggestedDuration?: number;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  priority: number;
}

/**
 * Moderation event interface
 */
export interface ModerationEvent {
  type: string;
  data: any;
  timestamp: Date;
  platform: string;
  channelId: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default moderation settings
 */
export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  enabled: true,
  autoModerationEnabled: true,
  logEnabled: true,
  notifyModerators: true,
  notifyUsers: true,
  warningMessage: 'Your message was removed for violating channel rules.',
  timeoutMessage: 'You have been timed out for violating channel rules.',
  banMessage: 'You have been banned for violating channel rules.',
  warningThreshold: 3,
  timeoutDuration: 600,
  maxTimeoutDuration: 1209600,
  bannedWords: [],
  permittedLinks: [],
  permittedUsers: [],
  permittedRoles: [TrustLevel.MODERATOR, TrustLevel.VIP],
  slowModeDuration: 0,
  slowModeEnabled: false,
  followerModeDuration: 0,
  followerModeEnabled: false,
  subscriberModeEnabled: false,
  emoteOnlyEnabled: false,
  r9kModeEnabled: false,
  raidProtectionEnabled: false,
  raidProtectionThreshold: 10,
  raidProtectionAction: ModerationActionType.FOLLOWER_MODE,
  trustLevels: {
    [TrustLevel.NEW]: {
      minFollowTime: 0,
      minMessages: 0,
      autoExempt: false,
      canPostLinks: false,
      canUseEmotes: true,
      maxCaps: 50,
      maxEmotes: 10,
    },
    [TrustLevel.FOLLOWER]: {
      minFollowTime: 86400,
      minMessages: 10,
      autoExempt: false,
      canPostLinks: false,
      canUseEmotes: true,
      maxCaps: 70,
      maxEmotes: 20,
    },
    [TrustLevel.SUBSCRIBER]: {
      minFollowTime: 0,
      minMessages: 0,
      autoExempt: false,
      canPostLinks: true,
      canUseEmotes: true,
      maxCaps: 80,
      maxEmotes: 50,
    },
    [TrustLevel.VIP]: {
      minFollowTime: 0,
      minMessages: 0,
      autoExempt: true,
      canPostLinks: true,
      canUseEmotes: true,
      maxCaps: 100,
      maxEmotes: 100,
    },
    [TrustLevel.MODERATOR]: {
      minFollowTime: 0,
      minMessages: 0,
      autoExempt: true,
      canPostLinks: true,
      canUseEmotes: true,
      maxCaps: 100,
      maxEmotes: 100,
    },
    [TrustLevel.REGULAR]: {
      minFollowTime: 604800,
      minMessages: 100,
      autoExempt: false,
      canPostLinks: true,
      canUseEmotes: true,
      maxCaps: 80,
      maxEmotes: 30,
    },
  },
};

/**
 * Default spam detection config
 */
export const DEFAULT_SPAM_DETECTION_CONFIG: SpamDetectionConfig = {
  enabled: true,
  maxRepetition: 3,
  maxCapsPercent: 70,
  maxEmotes: 20,
  maxMentions: 5,
  maxNewlines: 5,
  maxSymbols: 20,
  maxZalgo: 5,
  blockedPatterns: [],
  allowedEmotes: [],
};

/**
 * Default moderation rules
 */
export const DEFAULT_MODERATION_RULES: Partial<ModerationRule>[] = [
  {
    name: 'Profanity Filter',
    type: ModerationRuleType.PROFANITY,
    severity: ModerationSeverity.MEDIUM,
    action: ModerationActionType.DELETE_MESSAGE,
    warnFirst: true,
  },
  {
    name: 'Spam Protection',
    type: ModerationRuleType.SPAM,
    severity: ModerationSeverity.HIGH,
    action: ModerationActionType.TIMEOUT,
    duration: 300,
    warnFirst: false,
  },
  {
    name: 'No Links',
    type: ModerationRuleType.LINKS,
    severity: ModerationSeverity.LOW,
    action: ModerationActionType.DELETE_MESSAGE,
    warnFirst: true,
  },
  {
    name: 'Caps Limit',
    type: ModerationRuleType.CAPS,
    severity: ModerationSeverity.LOW,
    action: ModerationActionType.DELETE_MESSAGE,
    threshold: 70,
    warnFirst: true,
  },
  {
    name: 'Emote Spam',
    type: ModerationRuleType.EMOTE_SPAM,
    severity: ModerationSeverity.LOW,
    action: ModerationActionType.DELETE_MESSAGE,
    threshold: 20,
    warnFirst: true,
  },
];

/**
 * Moderation action types
 */
export const MODERATION_ACTIONS = [
  { value: ModerationActionType.TIMEOUT, label: 'Timeout', requiresDuration: true },
  { value: ModerationActionType.BAN, label: 'Ban', requiresDuration: false },
  { value: ModerationActionType.UNBAN, label: 'Unban', requiresDuration: false },
  { value: ModerationActionType.DELETE_MESSAGE, label: 'Delete Message', requiresDuration: false },
  { value: ModerationActionType.WARN, label: 'Warn', requiresDuration: false },
  { value: ModerationActionType.PURGE, label: 'Purge', requiresDuration: false },
];

/**
 * Moderation rule types
 */
export const MODERATION_RULE_TYPES = [
  { value: ModerationRuleType.PROFANITY, label: 'Profanity Filter' },
  { value: ModerationRuleType.SPAM, label: 'Spam Protection' },
  { value: ModerationRuleType.LINKS, label: 'Link Blocking' },
  { value: ModerationRuleType.CAPS, label: 'Caps Limit' },
  { value: ModerationRuleType.EMOTE_SPAM, label: 'Emote Spam' },
  { value: ModerationRuleType.CUSTOM_WORDS, label: 'Custom Words' },
  { value: ModerationRuleType.URL_SHORTENERS, label: 'URL Shorteners' },
  { value: ModerationRuleType.SYMBOLS, label: 'Symbol Spam' },
  { value: ModerationRuleType.REPETITION, label: 'Repetition' },
  { value: ModerationRuleType.ZALGO, label: 'Zalgo Text' },
  { value: ModerationRuleType.MASS_MENTION, label: 'Mass Mention' },
  { value: ModerationRuleType.RAID_PROTECTION, label: 'Raid Protection' },
];

/**
 * Moderation severity levels
 */
export const MODERATION_SEVERITIES = [
  { value: ModerationSeverity.LOW, label: 'Low', color: '#22c55e' },
  { value: ModerationSeverity.MEDIUM, label: 'Medium', color: '#f59e0b' },
  { value: ModerationSeverity.HIGH, label: 'High', color: '#ef4444' },
  { value: ModerationSeverity.CRITICAL, label: 'Critical', color: '#dc2626' },
];