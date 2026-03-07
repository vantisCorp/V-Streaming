import EventEmitter from 'eventemitter3';
import {
  TikTokLiveConfig,
  TikTokConnectionState,
  TikTokConnectionStatus,
  TikTokStreamStatus,
  TikTokEventType,
  TikTokGiftType,
  TikTokUser,
  TikTokGift,
  TikTokComment,
  TikTokGiftEvent,
  TikTokLikeEvent,
  TikTokFollowEvent,
  TikTokShareEvent,
  TikTokJoinEvent,
  TikTokRoomInfo,
  TikTokStatistics,
  TikTokNotificationConfig,
  TikTokScheduledNotification,
  TikTokStreamSettings,
  TikTokEngagementConfig,
  DEFAULT_TIKTOK_LIVE_CONFIG,
} from '../types/tiktokLive';

// ============ Event Types ============

interface TikTokLiveEvents {
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

/**
 * TikTok Live Service
 * Manages TikTok Live connection, streaming, and engagement
 */
export class TikTokLiveService extends EventEmitter<TikTokLiveEvents> {
  private static instance: TikTokLiveService | null = null;
  private config: TikTokLiveConfig;
  private connectionState: TikTokConnectionState;
  private statistics: TikTokStatistics;
  private streamStatus: TikTokStreamStatus;
  private storageKey = 'v-streaming-tiktok-live-config';
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private statisticsInterval: ReturnType<typeof setInterval> | null = null;
  private eventSimulationInterval: ReturnType<typeof setInterval> | null = null;
  private scheduledNotifications: TikTokScheduledNotification[] = [];
  private notificationCooldowns: Map<string, Date> = new Map();
  private startTime: Date | null = null;
  private currentUser: TikTokUser | null = null;
  private currentRoomInfo: TikTokRoomInfo | null = null;

  private constructor() {
    super();
    this.config = { ...DEFAULT_TIKTOK_LIVE_CONFIG };
    this.connectionState = {
      status: TikTokConnectionStatus.DISCONNECTED,
      reconnectAttempts: 0,
      rateLimitRemaining: 100,
    };
    this.streamStatus = TikTokStreamStatus.IDLE;
    this.statistics = this.getDefaultStatistics();
    this.loadFromStorage();
  }

  static getInstance(): TikTokLiveService {
    if (!TikTokLiveService.instance) {
      TikTokLiveService.instance = new TikTokLiveService();
    }
    return TikTokLiveService.instance;
  }

  // ============ Connection Management ============

  async connect(uniqueId?: string, roomId?: string): Promise<void> {
    const targetUniqueId = uniqueId || this.config.uniqueId;
    const targetRoomId = roomId || this.config.roomId;

    if (!targetUniqueId) {
      throw new Error('TikTok uniqueId is required');
    }

    if (this.connectionState.status === TikTokConnectionStatus.CONNECTED) {
      return;
    }

    this.updateConnectionStatus(TikTokConnectionStatus.CONNECTING);

    try {
      // Simulate connection process
      // In a real implementation, this would use TikTok Live API or TikTokLive library
      await this.simulateConnection();

      this.currentUser = await this.getCurrentUserInfo(targetUniqueId);
      this.currentRoomInfo = await this.fetchRoomInfo(targetUniqueId, targetRoomId);

      this.updateConnectionStatus(TikTokConnectionStatus.CONNECTED, {
        connectedAt: new Date(),
        username: this.currentUser.uniqueId,
        roomId: this.currentRoomInfo.roomId,
        viewerCount: this.currentRoomInfo.viewerCount,
        reconnectAttempts: 0,
      });

      this.streamStatus = TikTokStreamStatus.LIVE;
      this.startTime = new Date();
      this.startStatisticsTracking();
      this.startEventSimulation();

      this.emit('connected', this.currentUser, this.currentRoomInfo);
    } catch (error) {
      this.updateConnectionStatus(TikTokConnectionStatus.ERROR, {
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      this.emit('error', error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionState.status === TikTokConnectionStatus.DISCONNECTED) {
      return;
    }

    this.clearTimers();
    this.updateConnectionStatus(TikTokConnectionStatus.DISCONNECTED);
    this.streamStatus = TikTokStreamStatus.ENDED;
    this.currentUser = null;
    this.currentRoomInfo = null;
    this.startTime = null;
    this.emit('disconnected');
  }

  async reconnect(): Promise<void> {
    await this.disconnect();
    if (this.config.autoConnect && this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.updateConnectionStatus(TikTokConnectionStatus.RECONNECTING, {
        reconnectAttempts: this.connectionState.reconnectAttempts + 1,
      });

      this.reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
        } catch (error) {
          this.emit('error', error instanceof Error ? error : new Error('Reconnection failed'));
        }
      }, this.config.reconnectInterval);
    }
  }

  private async simulateConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectionTime = Math.random() * 1000 + 500;
      setTimeout(() => {
        if (Math.random() > 0.02) {
          resolve();
        } else {
          reject(new Error('Connection failed'));
        }
      }, connectionTime);
    });
  }

  private async getCurrentUserInfo(uniqueId: string): Promise<TikTokUser> {
    // Return mock user data for demo purposes
    // In real implementation, would call TikTok API
    return {
      id: this.generateId(),
      uniqueId: uniqueId,
      nickname: this.config.username || 'Streamer',
      profilePictureUrl: undefined,
      followingCount: 150,
      followersCount: 5000,
      isFollowing: false,
      isSubscriber: false,
      badges: [],
    };
  }

  private async fetchRoomInfo(uniqueId: string, roomId?: string): Promise<TikTokRoomInfo> {
    // Return mock room info for demo purposes
    // In real implementation, would call TikTok Live API
    return {
      roomId: roomId || this.generateId(),
      title: 'Live Stream',
      description: 'Join my live stream!',
      viewerCount: Math.floor(Math.random() * 100) + 10,
      likeCount: 0,
      diamondCount: 0,
      startTime: new Date(),
      hostUser: {
        id: this.generateId(),
        uniqueId: uniqueId,
        nickname: this.config.username || 'Streamer',
      },
    };
  }

  // ============ Configuration Management ============

  getConfig(): TikTokLiveConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TikTokLiveConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  resetConfig(): void {
    this.config = {
      ...DEFAULT_TIKTOK_LIVE_CONFIG,
      notifications: [],
    };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  // ============ Stream Settings ============

  getStreamSettings(): TikTokStreamSettings {
    return { ...this.config.streamSettings };
  }

  updateStreamSettings(updates: Partial<TikTokStreamSettings>): void {
    this.config.streamSettings = { ...this.config.streamSettings, ...updates };
    this.saveToStorage();
  }

  // ============ Engagement Management ============

  getEngagementConfig(): TikTokEngagementConfig {
    return { ...this.config.engagement };
  }

  updateEngagementConfig(updates: Partial<TikTokEngagementConfig>): void {
    this.config.engagement = { ...this.config.engagement, ...updates };
    this.saveToStorage();
  }

  async sendComment(text: string): Promise<void> {
    if (this.connectionState.status !== TikTokConnectionStatus.CONNECTED) {
      throw new Error('Not connected to TikTok Live');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Comment text is required');
    }

    // Simulate sending comment
    await this.simulateApiCall();
    this.statistics.totalComments++;
  }

  async thankGift(giftEvent: TikTokGiftEvent): Promise<void> {
    if (!this.config.engagement.thankGifters) {
      return;
    }

    const template = this.config.engagement.giftThankTemplate;
    const message = template
      .replace('{username}', giftEvent.user.nickname || giftEvent.user.uniqueId)
      .replace('{giftName}', giftEvent.gift.name);

    await this.sendComment(message);
  }

  async thankFollower(followEvent: TikTokFollowEvent): Promise<void> {
    if (!this.config.engagement.thankFollowers) {
      return;
    }

    const template = this.config.engagement.thankTemplate;
    const message = template
      .replace('{username}', followEvent.user.nickname || followEvent.user.uniqueId);

    await this.sendComment(message);
  }

  async welcomeViewer(joinEvent: TikTokJoinEvent): Promise<void> {
    if (!this.config.engagement.welcomeViewers) {
      return;
    }

    const template = this.config.engagement.welcomeTemplate;
    const message = template
      .replace('{username}', joinEvent.user.nickname || joinEvent.user.uniqueId);

    await this.sendComment(message);
  }

  // ============ Notification Management ============

  addNotification(notification: TikTokNotificationConfig): void {
    this.config.notifications.push(notification);
    this.saveToStorage();
  }

  updateNotification(id: string, updates: Partial<TikTokNotificationConfig>): void {
    const index = this.config.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.config.notifications[index] = { ...this.config.notifications[index], ...updates };
      this.saveToStorage();
    }
  }

  removeNotification(id: string): void {
    this.config.notifications = this.config.notifications.filter((n) => n.id !== id);
    this.saveToStorage();
  }

  async scheduleNotification(
    type: TikTokEventType,
    message: string,
    scheduledFor: Date
  ): Promise<TikTokScheduledNotification> {
    if (scheduledFor <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const notification: TikTokScheduledNotification = {
      id: this.generateId(),
      type,
      message,
      scheduledFor,
      sent: false,
    };

    this.scheduledNotifications.push(notification);
    return notification;
  }

  cancelScheduledNotification(id: string): void {
    const index = this.scheduledNotifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.scheduledNotifications.splice(index, 1);
    }
  }

  getScheduledNotifications(): TikTokScheduledNotification[] {
    return [...this.scheduledNotifications].filter((n) => !n.sent);
  }

  // ============ Gift Goal Management ============

  getGiftGoalProgress(): { current: number; target: number; percentage: number } {
    const settings = this.config.streamSettings;
    return {
      current: settings.giftGoalCurrent,
      target: settings.giftGoalTarget,
      percentage: settings.giftGoalTarget > 0
        ? Math.min(100, (settings.giftGoalCurrent / settings.giftGoalTarget) * 100)
        : 0,
    };
  }

  setGiftGoal(target: number): void {
    this.config.streamSettings.giftGoalTarget = target;
    this.config.streamSettings.giftGoalEnabled = target > 0;
    this.saveToStorage();
  }

  // ============ State & Statistics ============

  getConnectionState(): TikTokConnectionState {
    return { ...this.connectionState };
  }

  getStreamStatus(): TikTokStreamStatus {
    return this.streamStatus;
  }

  getStatistics(): TikTokStatistics {
    return { ...this.statistics };
  }

  getCurrentUser(): TikTokUser | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  getRoomInfo(): TikTokRoomInfo | null {
    return this.currentRoomInfo ? { ...this.currentRoomInfo } : null;
  }

  private updateConnectionStatus(
    status: TikTokConnectionStatus,
    updates: Partial<TikTokConnectionState> = {}
  ): void {
    this.connectionState = {
      ...this.connectionState,
      status,
      ...updates,
    };
    this.emit('connectionStateChanged', this.connectionState);
  }

  private getDefaultStatistics(): TikTokStatistics {
    return {
      totalViewers: 0,
      peakViewers: 0,
      totalLikes: 0,
      totalDiamonds: 0,
      totalGifts: 0,
      totalComments: 0,
      totalShares: 0,
      totalFollows: 0,
      streamDuration: 0,
      averageViewers: 0,
      newFollowers: 0,
    };
  }

  private startStatisticsTracking(): void {
    this.statisticsInterval = setInterval(() => {
      if (this.startTime) {
        this.statistics.streamDuration = Math.floor(
          (Date.now() - this.startTime.getTime()) / 1000
        );

        // Update average viewers
        if (this.statistics.streamDuration > 0) {
          this.statistics.averageViewers = Math.floor(
            this.statistics.totalViewers / (this.statistics.streamDuration / 60)
          );
        }

        this.emit('statisticsUpdated', this.statistics);
      }
    }, 1000);
  }

  // ============ Event Simulation ============

  private startEventSimulation(): void {
    // Simulate random events for demo purposes
    // In a real implementation, this would be handled by TikTok Live API events
    this.eventSimulationInterval = setInterval(() => {
      if (this.connectionState.status !== TikTokConnectionStatus.CONNECTED) {
        return;
      }

      const eventTypes = ['comment', 'gift', 'like', 'follow', 'join', 'share'];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      switch (randomEvent) {
        case 'comment':
          this.simulateComment();
          break;
        case 'gift':
          this.simulateGift();
          break;
        case 'like':
          this.simulateLike();
          break;
        case 'follow':
          this.simulateFollow();
          break;
        case 'join':
          this.simulateJoin();
          break;
        case 'share':
          this.simulateShare();
          break;
      }

      // Update viewer count periodically
      if (this.currentRoomInfo) {
        const viewerChange = Math.floor(Math.random() * 10) - 3;
        this.currentRoomInfo.viewerCount = Math.max(0, this.currentRoomInfo.viewerCount + viewerChange);
        this.statistics.totalViewers += Math.max(0, viewerChange);
        this.statistics.peakViewers = Math.max(this.statistics.peakViewers, this.currentRoomInfo.viewerCount);
        this.emit('viewerCountUpdated', this.currentRoomInfo.viewerCount);
      }
    }, 3000);
  }

  private simulateComment(): void {
    const comments = [
      'Hello! 👋',
      'Great stream!',
      'Love this content!',
      'Keep it up!',
      'Amazing!',
      '🔥🔥🔥',
      'First time here, loving it!',
      'Can you show that again?',
    ];

    const comment: TikTokComment = {
      id: this.generateId(),
      userId: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
      text: comments[Math.floor(Math.random() * comments.length)],
      timestamp: new Date(),
    };

    this.statistics.totalComments++;
    this.emit('comment', comment);

    // Auto reply if enabled
    if (this.config.engagement.autoReplyEnabled && Math.random() > 0.7) {
      this.sendComment(this.config.engagement.autoReplyTemplate);
    }
  }

  private simulateGift(): void {
    const giftNames = ['Rose', 'Heart', 'Diamond Ring', 'Sports Car', 'Rocket', 'Universe'];
    const diamondValues = [5, 10, 100, 500, 1000, 5000];

    const giftIndex = Math.floor(Math.random() * giftNames.length);

    const user: TikTokUser = {
      id: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
    };

    const gift: TikTokGift = {
      id: this.generateId(),
      name: giftNames[giftIndex],
      diamondCount: diamondValues[giftIndex],
      type: giftIndex > 2 ? TikTokGiftType.STREAKABLE : TikTokGiftType.NORMAL,
    };

    const repeatCount = Math.floor(Math.random() * 10) + 1;

    const giftEvent: TikTokGiftEvent = {
      id: this.generateId(),
      user,
      gift,
      repeatCount,
      diamondValue: gift.diamondCount * repeatCount,
      timestamp: new Date(),
    };

    this.statistics.totalGifts++;
    this.statistics.totalDiamonds += giftEvent.diamondValue;
    this.config.streamSettings.giftGoalCurrent += giftEvent.diamondValue;

    this.emit('gift', giftEvent);

    // Thank gifter if enabled
    if (this.config.engagement.thankGifters && Math.random() > 0.5) {
      this.thankGift(giftEvent);
    }
  }

  private simulateLike(): void {
    const user: TikTokUser = {
      id: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
    };

    const likeCount = Math.floor(Math.random() * 50) + 1;

    const likeEvent: TikTokLikeEvent = {
      id: this.generateId(),
      user,
      likeCount,
      totalLikes: this.statistics.totalLikes + likeCount,
      timestamp: new Date(),
    };

    this.statistics.totalLikes += likeCount;
    this.emit('like', likeEvent);
  }

  private simulateFollow(): void {
    const user: TikTokUser = {
      id: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
    };

    const followEvent: TikTokFollowEvent = {
      id: this.generateId(),
      user,
      timestamp: new Date(),
    };

    this.statistics.totalFollows++;
    this.statistics.newFollowers++;
    this.emit('follow', followEvent);

    // Thank follower if enabled
    if (this.config.engagement.thankFollowers && Math.random() > 0.5) {
      this.thankFollower(followEvent);
    }
  }

  private simulateJoin(): void {
    const user: TikTokUser = {
      id: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
    };

    const joinEvent: TikTokJoinEvent = {
      id: this.generateId(),
      user,
      timestamp: new Date(),
    };

    this.emit('join', joinEvent);

    // Welcome viewer if enabled
    if (this.config.engagement.welcomeViewers && Math.random() > 0.7) {
      this.welcomeViewer(joinEvent);
    }
  }

  private simulateShare(): void {
    const user: TikTokUser = {
      id: this.generateId(),
      uniqueId: `user_${Math.floor(Math.random() * 1000)}`,
      nickname: `Viewer ${Math.floor(Math.random() * 100)}`,
    };

    const shareEvent: TikTokShareEvent = {
      id: this.generateId(),
      user,
      shareCount: 1,
      timestamp: new Date(),
    };

    this.statistics.totalShares++;
    this.emit('share', shareEvent);
  }

  // ============ Rate Limiting ============

  private checkRateLimit(): void {
    if (this.connectionState.rateLimitRemaining <= 5) {
      const resetTime = this.connectionState.rateLimitReset || new Date(Date.now() + 900000);
      this.emit('rateLimitWarning', this.connectionState.rateLimitRemaining, resetTime);

      if (this.connectionState.rateLimitRemaining <= 0) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }
    }
  }

  // ============ Helper Methods ============

  private async simulateApiCall(): Promise<void> {
    this.checkRateLimit();
    return new Promise((resolve) => {
      setTimeout(resolve, 50 + Math.random() * 100);
    });
  }

  private isNotificationOnCooldown(notificationId: string): boolean {
    const lastSent = this.notificationCooldowns.get(notificationId);
    if (!lastSent) return false;

    const notification = this.config.notifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    const elapsed = (Date.now() - lastSent.getTime()) / 1000;
    return elapsed < notification.cooldown;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
      this.statisticsInterval = null;
    }
    if (this.eventSimulationInterval) {
      clearInterval(this.eventSimulationInterval);
      this.eventSimulationInterval = null;
    }
  }

  // ============ Storage ============

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save TikTok Live config:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...DEFAULT_TIKTOK_LIVE_CONFIG,
          ...parsed,
          notifications: parsed.notifications || [],
        };
      }
    } catch (error) {
      console.error('Failed to load TikTok Live config:', error);
    }
  }

  // ============ Cleanup ============

  destroy(): void {
    this.clearTimers();
    this.notificationCooldowns.clear();
    this.scheduledNotifications = [];
    TikTokLiveService.instance = null;
  }
}

export default TikTokLiveService;