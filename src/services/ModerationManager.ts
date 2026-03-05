/**
 * ModerationManager - Service for chat moderation
 */

import { EventEmitter } from 'events';
import {
  ChatMessage,
  ModerationRule,
  ModerationActionRecord,
  ModerationAppeal,
  ModerationLogEntry,
  ModerationStatistics,
  ChatUserInfo,
  ModerationQueueEntry,
  ModerationSettings,
  SpamDetectionConfig,
  ModerationActionType,
  ModerationRuleType,
  ModerationSeverity,
  ModerationStatus,
  ModerationLogType,
  TrustLevel,
  DEFAULT_MODERATION_SETTINGS,
  DEFAULT_SPAM_DETECTION_CONFIG,
  DEFAULT_MODERATION_RULES,
} from '../types/moderation';

// ============================================================================
// MODERATION MANAGER CLASS
// ============================================================================

class ModerationManager extends EventEmitter {
  private static instance: ModerationManager;
  private settings: ModerationSettings;
  private spamConfig: SpamDetectionConfig;
  private rules: Map<string, ModerationRule> = new Map();
  private actions: Map<string, ModerationActionRecord> = new Map();
  private appeals: Map<string, ModerationAppeal> = new Map();
  private logs: Map<string, ModerationLogEntry> = new Map();
  private users: Map<string, ChatUserInfo> = new Map();
  private queue: ModerationQueueEntry[] = [];
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  private constructor() {
    super();
    this.settings = { ...DEFAULT_MODERATION_SETTINGS };
    this.spamConfig = { ...DEFAULT_SPAM_DETECTION_CONFIG };
    this.initializeDefaultRules();
    this.loadFromStorage();
    this.startAutoSave();
  }

  // ============================================================================
  // SINGLETON PATTERN
  // ============================================================================

  static getInstance(): ModerationManager {
    if (!ModerationManager.instance) {
      ModerationManager.instance = new ModerationManager();
    }
    return ModerationManager.instance;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeDefaultRules(): void {
    DEFAULT_MODERATION_RULES.forEach((ruleData) => {
      if (!ruleData.type || !ruleData.severity || !ruleData.action) return;
      
      const rule: ModerationRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: ruleData.name || 'Unnamed Rule',
        type: ruleData.type,
        enabled: true,
        severity: ruleData.severity,
        action: ruleData.action,
        duration: ruleData.duration || 0,
        warnFirst: ruleData.warnFirst || false,
        exemptUsers: [],
        exemptRoles: [],
        cooldown: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
      };
      this.rules.set(rule.id, rule);
    });
  }

  // ============================================================================
  // STORAGE OPERATIONS
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const savedSettings = localStorage.getItem('moderationSettings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
      }

      const savedSpamConfig = localStorage.getItem('spamDetectionConfig');
      if (savedSpamConfig) {
        this.spamConfig = JSON.parse(savedSpamConfig);
      }

      const savedRules = localStorage.getItem('moderationRules');
      if (savedRules) {
        const rulesData = JSON.parse(savedRules);
        rulesData.forEach((rule: any) => {
          rule.createdAt = new Date(rule.createdAt);
          rule.updatedAt = new Date(rule.updatedAt);
          rule.lastTriggered = rule.lastTriggered ? new Date(rule.lastTriggered) : undefined;
          this.rules.set(rule.id, rule);
        });
      }

      const savedActions = localStorage.getItem('moderationActions');
      if (savedActions) {
        const actionsData = JSON.parse(savedActions);
        actionsData.forEach((action: any) => {
          action.createdAt = new Date(action.createdAt);
          action.expiresAt = action.expiresAt ? new Date(action.expiresAt) : undefined;
          this.actions.set(action.id, action);
        });
      }

      const savedUsers = localStorage.getItem('moderationUsers');
      if (savedUsers) {
        const usersData = JSON.parse(savedUsers);
        usersData.forEach((user: any) => {
          user.followerSince = user.followerSince ? new Date(user.followerSince) : undefined;
          user.subscriberSince = user.subscriberSince ? new Date(user.subscriberSince) : undefined;
          user.lastMessage = user.lastMessage ? new Date(user.lastMessage) : undefined;
          user.firstSeen = new Date(user.firstSeen);
          this.users.set(user.userId, user);
        });
      }
    } catch (error) {
      console.error('Failed to load moderation data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('moderationSettings', JSON.stringify(this.settings));
      localStorage.setItem('spamDetectionConfig', JSON.stringify(this.spamConfig));
      localStorage.setItem('moderationRules', JSON.stringify(Array.from(this.rules.values())));
      localStorage.setItem('moderationActions', JSON.stringify(Array.from(this.actions.values())));
      localStorage.setItem('moderationUsers', JSON.stringify(Array.from(this.users.values())));
    } catch (error) {
      console.error('Failed to save moderation data to storage:', error);
    }
  }

  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = setInterval(() => {
      this.saveToStorage();
    }, 30000); // Auto-save every 30 seconds
  }

  // ============================================================================
  // MESSAGE PROCESSING
  // ============================================================================

  /**
   * Process a chat message for moderation
   */
  processMessage(message: ChatMessage): ChatMessage {
    if (!this.settings.enabled) {
      return message;
    }

    // Update user info
    this.updateUserInfoFromMessage(message);

    // Check if user is exempt
    const userInfo = this.users.get(message.userId);
    if (userInfo?.isExempt || userInfo?.trustLevel === TrustLevel.MODERATOR) {
      return message;
    }

    const flags: any[] = [];

    // Run all enabled moderation rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.checkRule(rule, message, userInfo)) {
        flags.push({
          type: rule.type,
          severity: rule.severity,
          reason: `Rule "${rule.name}" triggered`,
          ruleId: rule.id,
        });

        // Update rule statistics
        rule.triggeredCount++;
        rule.lastTriggered = new Date();
        this.rules.set(rule.id, rule);

        // Add to moderation queue if needed
        if (rule.action === ModerationActionType.DELETE_MESSAGE) {
          this.addToQueue(message, flags, rule.action);
        } else {
          // Execute action
          this.executeAction(rule.action, message, rule, userInfo);
        }
      }
    }

    // Spam detection
    if (this.spamConfig.enabled) {
      const spamFlags = this.detectSpam(message, userInfo);
      flags.push(...spamFlags);
    }

    // Update message with flags
    message.flags = flags;
    message.isSuspicious = flags.length > 0;

    return message;
  }

  /**
   * Check if a rule is triggered
   */
  private checkRule(rule: ModerationRule, message: ChatMessage, userInfo?: ChatUserInfo): boolean {
    // Check exempt users
    if (rule.exemptUsers.includes(message.userId)) {
      return false;
    }

    // Check exempt roles
    if (userInfo && rule.exemptRoles.includes(userInfo.trustLevel)) {
      return false;
    }

    switch (rule.type) {
      case ModerationRuleType.PROFANITY:
        return this.checkProfanity(message.content);

      case ModerationRuleType.SPAM:
        return this.checkSpam(message, userInfo);

      case ModerationRuleType.LINKS:
        return this.checkLinks(message.content);

      case ModerationRuleType.CAPS:
        return this.checkCaps(message.content, rule.threshold || 70);

      case ModerationRuleType.EMOTE_SPAM:
        return this.checkEmoteSpam(message, rule.threshold || 20);

      case ModerationRuleType.CUSTOM_WORDS:
        return rule.customWords?.some(word => 
          message.content.toLowerCase().includes(word.toLowerCase())
        ) || false;

      case ModerationRuleType.URL_SHORTENERS:
        return this.checkUrlShorteners(message.content);

      case ModerationRuleType.SYMBOLS:
        return this.checkSymbols(message.content, rule.threshold || 20);

      case ModerationRuleType.REPETITION:
        return this.checkRepetition(message, rule.threshold || 3, userInfo);

      case ModerationRuleType.ZALGO:
        return this.checkZalgo(message.content, rule.threshold || 5);

      case ModerationRuleType.MASS_MENTION:
        return this.checkMassMention(message.content, rule.threshold || 5);

      case ModerationRuleType.FOLLOWER_AGE:
      case ModerationRuleType.ACCOUNT_AGE:
        // These would need platform-specific data
        return false;

      default:
        return false;
    }
  }

  /**
   * Check for profanity
   */
  private checkProfanity(content: string): boolean {
    const profanityList = this.settings.bannedWords || [];
    const lowerContent = content.toLowerCase();
    return profanityList.some(word => lowerContent.includes(word.toLowerCase()));
  }

  /**
   * Check for spam patterns
   */
  private checkSpam(message: ChatMessage, userInfo?: ChatUserInfo): boolean {
    if (!userInfo) return false;

    // Check message rate
    if (userInfo.messages > 0 && userInfo.lastMessage) {
      const timeSinceLastMessage = Date.now() - userInfo.lastMessage.getTime();
      if (timeSinceLastMessage < 1000) { // Less than 1 second
        return true;
      }
    }

    return false;
  }

  /**
   * Check for links
   */
  private checkLinks(content: string): boolean {
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/g;
    const links = content.match(linkRegex) || [];

    // Check if any links are not permitted
    return links.some(link => {
      return !this.settings.permittedLinks.some(permitted => 
        link.toLowerCase().includes(permitted.toLowerCase())
      );
    });
  }

  /**
   * Check for excessive caps
   */
  private checkCaps(content: string, threshold: number): boolean {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 5) return false;

    const caps = content.replace(/[^A-Z]/g, '');
    const capsPercent = (caps.length / letters.length) * 100;

    return capsPercent > threshold;
  }

  /**
   * Check for emote spam
   */
  private checkEmoteSpam(message: ChatMessage, threshold: number): boolean {
    return message.emotes.length > threshold;
  }

  /**
   * Check for URL shorteners
   */
  private checkUrlShorteners(content: string): boolean {
    const shorteners = ['bit.ly', 'goo.gl', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd'];
    return shorteners.some(shortener => content.toLowerCase().includes(shortener));
  }

  /**
   * Check for excessive symbols
   */
  private checkSymbols(content: string, threshold: number): boolean {
    const symbols = content.replace(/[a-zA-Z0-9\s]/g, '');
    return symbols.length > threshold;
  }

  /**
   * Check for message repetition
   */
  private checkRepetition(message: ChatMessage, threshold: number, userInfo?: ChatUserInfo): boolean {
    // In a real implementation, this would check against recent messages
    return false;
  }

  /**
   * Check for zalgo text
   */
  private checkZalgo(content: string, threshold: number): boolean {
    // Zalgo characters are combining diacritical marks (U+0300 to U+036F)
    const zalgoRegex = /[\u0300-\u036F]/g;
    const matches = content.match(zalgoRegex) || [];
    return matches.length > threshold;
  }

  /**
   * Check for mass mentions
   */
  private checkMassMention(content: string, threshold: number): boolean {
    const mentionRegex = /@[\w]+/g;
    const mentions = content.match(mentionRegex) || [];
    return mentions.length > threshold;
  }

  /**
   * Detect spam using spam config
   */
  private detectSpam(message: ChatMessage, userInfo?: ChatUserInfo): any[] {
    const flags: any[] = [];

    if (this.checkCaps(message.content, this.spamConfig.maxCapsPercent)) {
      flags.push({
        type: ModerationRuleType.CAPS,
        severity: ModerationSeverity.LOW,
        reason: `Excessive caps (${this.spamConfig.maxCapsPercent}%)`,
      });
    }

    if (this.checkEmoteSpam(message, this.spamConfig.maxEmotes)) {
      flags.push({
        type: ModerationRuleType.EMOTE_SPAM,
        severity: ModerationSeverity.LOW,
        reason: `Excessive emotes (${this.spamConfig.maxEmotes})`,
      });
    }

    if (this.checkSymbols(message.content, this.spamConfig.maxSymbols)) {
      flags.push({
        type: ModerationRuleType.SYMBOLS,
        severity: ModerationSeverity.LOW,
        reason: `Excessive symbols (${this.spamConfig.maxSymbols})`,
      });
    }

    if (this.checkZalgo(message.content, this.spamConfig.maxZalgo)) {
      flags.push({
        type: ModerationRuleType.ZALGO,
        severity: ModerationSeverity.MEDIUM,
        reason: `Zalgo text detected`,
      });
    }

    if (this.checkMassMention(message.content, this.spamConfig.maxMentions)) {
      flags.push({
        type: ModerationRuleType.MASS_MENTION,
        severity: ModerationSeverity.HIGH,
        reason: `Mass mention (${this.spamConfig.maxMentions})`,
      });
    }

    return flags;
  }

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Execute moderation action
   */
  private executeAction(
    actionType: ModerationActionType,
    message: ChatMessage,
    rule: ModerationRule,
    userInfo?: ChatUserInfo
  ): void {
    const action: ModerationActionRecord = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      userId: message.userId,
      username: message.username,
      moderatorId: 'automod',
      moderatorUsername: 'AutoMod',
      reason: `Rule "${rule.name}" triggered`,
      duration: rule.duration,
      platform: message.platform,
      channelId: message.channelId,
      messageId: message.id,
      messageContent: message.content,
      status: ModerationStatus.APPROVED,
      createdAt: new Date(),
    };

    if (actionType === ModerationActionType.TIMEOUT) {
      action.expiresAt = new Date(Date.now() + rule.duration * 1000);
      this.updateUserInfo(message.userId, { timeouts: (userInfo?.timeouts || 0) + 1 });
    }

    if (actionType === ModerationActionType.BAN) {
      this.updateUserInfo(message.userId, { bans: (userInfo?.bans || 0) + 1 });
    }

    this.actions.set(action.id, action);
    this.logAction(action);

    this.emit('actionTaken', action);
  }

  /**
   * Create manual moderation action
   */
  createAction(
    actionType: ModerationActionType,
    userId: string,
    username: string,
    moderatorId: string,
    moderatorUsername: string,
    reason: string,
    duration?: number,
    messageId?: string,
    messageContent?: string
  ): ModerationActionRecord {
    const action: ModerationActionRecord = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionType,
      userId,
      username,
      moderatorId,
      moderatorUsername,
      reason,
      duration,
      platform: 'unknown',
      channelId: 'unknown',
      messageId,
      messageContent,
      status: ModerationStatus.APPROVED,
      createdAt: new Date(),
    };

    if (duration && (actionType === ModerationActionType.TIMEOUT)) {
      action.expiresAt = new Date(Date.now() + duration * 1000);
    }

    this.actions.set(action.id, action);
    this.logAction(action);
    this.saveToStorage();

    this.emit('actionTaken', action);
    return action;
  }

  /**
   * Log moderation action
   */
  private logAction(action: ModerationActionRecord): void {
    const log: ModerationLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ModerationLogType.ACTION_TAKEN,
      action,
      userId: action.userId,
      username: action.username,
      moderatorId: action.moderatorId,
      moderatorUsername: action.moderatorUsername,
      details: `${action.actionType} action taken against ${action.username}: ${action.reason}`,
      platform: action.platform,
      channelId: action.channelId,
      timestamp: new Date(),
    };

    this.logs.set(log.id, log);
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Add flagged message to moderation queue
   */
  private addToQueue(
    message: ChatMessage,
    flags: any[],
    action: ModerationActionType
  ): void {
    const entry: ModerationQueueEntry = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      flags,
      suggestedAction: action,
      status: 'pending',
      priority: this.calculatePriority(flags),
      createdAt: new Date(),
    };

    this.queue.push(entry);
    this.queue.sort((a, b) => b.priority - a.priority);

    this.emit('queueUpdated', entry);
  }

  /**
   * Calculate queue priority based on flags
   */
  private calculatePriority(flags: any[]): number {
    let priority = 0;
    flags.forEach(flag => {
      switch (flag.severity) {
        case ModerationSeverity.CRITICAL:
          priority += 100;
          break;
        case ModerationSeverity.HIGH:
          priority += 50;
          break;
        case ModerationSeverity.MEDIUM:
          priority += 25;
          break;
        case ModerationSeverity.LOW:
          priority += 10;
          break;
      }
    });
    return priority;
  }

  /**
   * Get moderation queue
   */
  getQueue(): ModerationQueueEntry[] {
    return this.queue.filter(entry => entry.status === 'pending');
  }

  /**
   * Resolve queue entry
   */
  resolveQueueEntry(entryId: string, resolvedBy: string, resolution: string): void {
    const entry = this.queue.find(e => e.id === entryId);
    if (!entry) return;

    entry.status = 'resolved';
    entry.resolvedBy = resolvedBy;
    entry.resolvedAt = new Date();
    entry.resolution = resolution;

    this.saveToStorage();
    this.emit('queueUpdated', entry);
  }

  /**
   * Dismiss queue entry
   */
  dismissQueueEntry(entryId: string, resolvedBy: string): void {
    const entry = this.queue.find(e => e.id === entryId);
    if (!entry) return;

    entry.status = 'dismissed';
    entry.resolvedBy = resolvedBy;
    entry.resolvedAt = new Date();

    this.saveToStorage();
    this.emit('queueUpdated', entry);
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Update user info from message
   */
  private updateUserInfoFromMessage(message: ChatMessage): void {
    let userInfo = this.users.get(message.userId);

    if (!userInfo) {
      userInfo = {
        userId: message.userId,
        username: message.username,
        displayName: message.displayName,
        trustLevel: TrustLevel.NEW,
        messages: 0,
        warnings: 0,
        timeouts: 0,
        bans: 0,
        firstSeen: new Date(),
        isExempt: false,
        notes: [],
      };
    }

    userInfo.messages++;
    userInfo.lastMessage = new Date();

    // Determine trust level based on message count and time
    const daysSinceFirstSeen = (Date.now() - userInfo.firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    if (userInfo.messages >= 100 && daysSinceFirstSeen >= 7) {
      userInfo.trustLevel = TrustLevel.REGULAR;
    } else if (message.isSubscriber) {
      userInfo.trustLevel = TrustLevel.SUBSCRIBER;
    } else if (message.isVip) {
      userInfo.trustLevel = TrustLevel.VIP;
    } else if (message.isModerator) {
      userInfo.trustLevel = TrustLevel.MODERATOR;
    } else if (message.isReturning) {
      userInfo.trustLevel = TrustLevel.FOLLOWER;
    }

    this.users.set(message.userId, userInfo);
  }

  /**
   * Update user info
   */
  updateUserInfo(userId: string, updates: Partial<ChatUserInfo>): void {
    const userInfo = this.users.get(userId);
    if (!userInfo) return;

    Object.assign(userInfo, updates);
    this.users.set(userId, userInfo);
    this.saveToStorage();
  }

  /**
   * Get user info
   */
  getUserInfo(userId: string): ChatUserInfo | undefined {
    return this.users.get(userId);
  }

  /**
   * Get all users
   */
  getAllUsers(): ChatUserInfo[] {
    return Array.from(this.users.values());
  }

  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================

  /**
   * Get all rules
   */
  getAllRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRuleById(id: string): ModerationRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Create rule
   */
  createRule(rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>): ModerationRule {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: ModerationRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggeredCount: 0,
    };
    this.rules.set(id, newRule);
    this.saveToStorage();
    return newRule;
  }

  /**
   * Update rule
   */
  updateRule(id: string, updates: Partial<ModerationRule>): ModerationRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(id, updatedRule);
    this.saveToStorage();
    return updatedRule;
  }

  /**
   * Delete rule
   */
  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  // ============================================================================
  // ACTION MANAGEMENT
  // ============================================================================

  /**
   * Get all actions
   */
  getAllActions(): ModerationActionRecord[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by user
   */
  getActionsByUser(userId: string): ModerationActionRecord[] {
    return this.getAllActions().filter(action => action.userId === userId);
  }

  /**
   * Get active actions (timeouts/bans)
   */
  getActiveActions(): ModerationActionRecord[] {
    const now = new Date();
    return this.getAllActions().filter(action => 
      action.status === ModerationStatus.APPROVED &&
      action.expiresAt && action.expiresAt > now
    );
  }

  /**
   * Revoke action
   */
  revokeAction(actionId: string, moderatorId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    action.status = ModerationStatus.REJECTED;
    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // APPEALS MANAGEMENT
  // ============================================================================

  /**
   * Create appeal
   */
  createAppeal(actionId: string, userId: string, username: string, reason: string): ModerationAppeal {
    const id = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const appeal: ModerationAppeal = {
      id,
      actionId,
      userId,
      username,
      reason,
      status: 'pending',
      submittedAt: new Date(),
    };
    this.appeals.set(id, appeal);
    this.saveToStorage();
    return appeal;
  }

  /**
   * Get all appeals
   */
  getAllAppeals(): ModerationAppeal[] {
    return Array.from(this.appeals.values());
  }

  /**
   * Get pending appeals
   */
  getPendingAppeals(): ModerationAppeal[] {
    return this.getAllAppeals().filter(appeal => appeal.status === 'pending');
  }

  /**
   * Resolve appeal
   */
  resolveAppeal(appealId: string, status: 'approved' | 'rejected', reviewedBy: string, response?: string): ModerationAppeal | null {
    const appeal = this.appeals.get(appealId);
    if (!appeal) return null;

    appeal.status = status;
    appeal.reviewedAt = new Date();
    appeal.reviewedBy = reviewedBy;
    appeal.response = response;

    // If approved, revoke the action
    if (status === 'approved') {
      this.revokeAction(appeal.actionId, reviewedBy);
    }

    this.saveToStorage();
    return appeal;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get moderation statistics
   */
  getStatistics(): ModerationStatistics {
    const actions = this.getAllActions();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const actionsByType: Record<ModerationActionType, number> = {
      [ModerationActionType.TIMEOUT]: 0,
      [ModerationActionType.BAN]: 0,
      [ModerationActionType.UNBAN]: 0,
      [ModerationActionType.DELETE_MESSAGE]: 0,
      [ModerationActionType.WARN]: 0,
      [ModerationActionType.PURGE]: 0,
      [ModerationActionType.SLOW_MODE]: 0,
      [ModerationActionType.SUBSCRIBER_MODE]: 0,
      [ModerationActionType.FOLLOWER_MODE]: 0,
      [ModerationActionType.EMOTE_ONLY]: 0,
      [ModerationActionType.R9K_MODE]: 0,
    };

    const actionsBySeverity: Record<ModerationSeverity, number> = {
      [ModerationSeverity.LOW]: 0,
      [ModerationSeverity.MEDIUM]: 0,
      [ModerationSeverity.HIGH]: 0,
      [ModerationSeverity.CRITICAL]: 0,
    };

    actions.forEach(action => {
      actionsByType[action.actionType]++;
    });

    const moderatorStats = new Map<string, { count: number; lastActive: Date }>();
    actions.forEach(action => {
      const key = action.moderatorId;
      const existing = moderatorStats.get(key) || { count: 0, lastActive: new Date(0) };
      moderatorStats.set(key, {
        count: existing.count + 1,
        lastActive: action.createdAt > existing.lastActive ? action.createdAt : existing.lastActive,
      });
    });

    const topModerators = Array.from(moderatorStats.entries())
      .map(([userId, stats]) => ({
        userId,
        username: actions.find(a => a.moderatorId === userId)?.moderatorUsername || userId,
        actionCount: stats.count,
        lastActive: stats.lastActive,
      }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);

    const reasonCounts = new Map<string, number>();
    actions.forEach(action => {
      const existing = reasonCounts.get(action.reason) || 0;
      reasonCounts.set(action.reason, existing + 1);
    });

    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const appeals = this.getAllAppeals();

    return {
      totalActions: actions.length,
      todayActions: actions.filter(a => a.createdAt >= today).length,
      weeklyActions: actions.filter(a => a.createdAt >= weekAgo).length,
      monthlyActions: actions.filter(a => a.createdAt >= monthAgo).length,
      actionsByType,
      actionsBySeverity,
      topModerators,
      topReasons,
      activeRules: this.getAllRules().filter(r => r.enabled).length,
      triggeredRules: this.getAllRules().reduce((sum, r) => sum + r.triggeredCount, 0),
      appealsPending: appeals.filter(a => a.status === 'pending').length,
      appealsApproved: appeals.filter(a => a.status === 'approved').length,
      appealsRejected: appeals.filter(a => a.status === 'rejected').length,
      averageResponseTime: 0, // Would need actual appeal resolution data
    };
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  /**
   * Get moderation settings
   */
  getSettings(): ModerationSettings {
    return { ...this.settings };
  }

  /**
   * Update moderation settings
   */
  updateSettings(settings: Partial<ModerationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveToStorage();
  }

  /**
   * Get spam detection config
   */
  getSpamConfig(): SpamDetectionConfig {
    return { ...this.spamConfig };
  }

  /**
   * Update spam detection config
   */
  updateSpamConfig(config: Partial<SpamDetectionConfig>): void {
    this.spamConfig = { ...this.spamConfig, ...config };
    this.saveToStorage();
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    this.removeAllListeners();
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const moderationManager = ModerationManager.getInstance();
export default moderationManager;