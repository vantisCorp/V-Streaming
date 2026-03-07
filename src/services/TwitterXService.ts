import EventEmitter from 'eventemitter3';
import {
  TwitterXConfig,
  TwitterConnectionState,
  TwitterConnectionStatus,
  TwitterStreamStatus,
  TwitterNotificationConfig,
  TwitterNotificationType,
  TwitterTweet,
  TwitterUser,
  TwitterSpace,
  TwitterNotificationEvent,
  TwitterStatistics,
  TwitterScheduledTweet,
  TwitterMediaType,
  TwitterStreamSettings,
  TwitterEngagementConfig,
  DEFAULT_TWITTER_X_CONFIG,
} from '../types/twitterX';

// ============ Event Types ============

interface TwitterXEvents {
  connectionStateChanged: (state: TwitterConnectionState) => void;
  connected: (user: TwitterUser) => void;
  disconnected: () => void;
  error: (error: Error) => void;
  tweetSent: (tweet: TwitterTweet) => void;
  tweetScheduled: (scheduledTweet: TwitterScheduledTweet) => void;
  notificationSent: (event: TwitterNotificationEvent) => void;
  mentionReceived: (tweet: TwitterTweet) => void;
  newFollower: (user: TwitterUser) => void;
  streamStarted: () => void;
  streamEnded: () => void;
  statisticsUpdated: (stats: TwitterStatistics) => void;
  rateLimitWarning: (remaining: number, resetTime: Date) => void;
}

/**
 * Twitter/X Service
 * Manages Twitter/X API connection, streaming, and engagement
 */
export class TwitterXService extends EventEmitter<TwitterXEvents> {
  private static instance: TwitterXService | null = null;
  private config: TwitterXConfig;
  private connectionState: TwitterConnectionState;
  private statistics: TwitterStatistics;
  private storageKey = 'v-streaming-twitter-x-config';
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private statisticsInterval: ReturnType<typeof setInterval> | null = null;
  private scheduledTweets: TwitterScheduledTweet[] = [];
  private notificationCooldowns: Map<string, Date> = new Map();
  private startTime: Date | null = null;
  private currentUser: TwitterUser | null = null;

  private constructor() {
    super();
    this.config = { ...DEFAULT_TWITTER_X_CONFIG };
    this.connectionState = {
      status: TwitterConnectionStatus.DISCONNECTED,
      reconnectAttempts: 0,
      rateLimitRemaining: 100,
    };
    this.statistics = this.getDefaultStatistics();
    this.loadFromStorage();
  }

  static getInstance(): TwitterXService {
    if (!TwitterXService.instance) {
      TwitterXService.instance = new TwitterXService();
    }
    return TwitterXService.instance;
  }

  // ============ Connection Management ============

  async connect(): Promise<void> {
    if (!this.config.apiKey || !this.config.apiSecret || !this.config.bearerToken) {
      throw new Error('Twitter/X API credentials are required');
    }

    if (this.connectionState.status === TwitterConnectionStatus.CONNECTED) {
      return;
    }

    this.updateConnectionStatus(TwitterConnectionStatus.CONNECTING);

    try {
      // Simulate connection process
      // In a real implementation, this would use Twitter API v2
      await this.simulateConnection();

      this.currentUser = await this.getCurrentUser();

      this.updateConnectionStatus(TwitterConnectionStatus.CONNECTED, {
        connectedAt: new Date(),
        username: this.currentUser.username,
        accountId: this.currentUser.id,
        profileImageUrl: this.currentUser.profileImageUrl,
        reconnectAttempts: 0,
      });

      this.startTime = new Date();
      this.startStatisticsTracking();

      this.emit('connected', this.currentUser);
    } catch (error) {
      this.updateConnectionStatus(TwitterConnectionStatus.ERROR, {
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      this.emit('error', error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionState.status === TwitterConnectionStatus.DISCONNECTED) {
      return;
    }

    this.clearTimers();
    this.updateConnectionStatus(TwitterConnectionStatus.DISCONNECTED);
    this.currentUser = null;
    this.startTime = null;
    this.emit('disconnected');
  }

  async reconnect(): Promise<void> {
    await this.disconnect();

    if (this.config.autoConnect && this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.updateConnectionStatus(TwitterConnectionStatus.RECONNECTING, {
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

  private async getCurrentUser(): Promise<TwitterUser> {
    // Return mock user data for demo purposes
    // In real implementation, would call Twitter API v2 /users/me
    return {
      id: this.config.accountId || '1234567890',
      name: this.config.username || 'Streamer',
      username: this.config.username || 'streamer',
      description: 'Content Creator & Streamer',
      profileImageUrl: undefined,
      verified: false,
      publicMetrics: {
        followersCount: 5000,
        followingCount: 250,
        tweetCount: 1250,
        listedCount: 25,
      },
      createdAt: new Date('2020-01-01'),
      protected: false,
    };
  }

  // ============ Configuration Management ============

  getConfig(): TwitterXConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TwitterXConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  resetConfig(): void {
    this.config = {
      ...DEFAULT_TWITTER_X_CONFIG,
      notifications: [],
    };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  // ============ Tweet Management ============

  async sendTweet(
    text: string,
    mediaIds?: string[],
    replyToId?: string
  ): Promise<TwitterTweet> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    if (!text && (!mediaIds || mediaIds.length === 0)) {
      throw new Error('Tweet must have text or media');
    }

    // Check rate limit
    this.checkRateLimit('tweets');

    try {
      // Simulate sending tweet
      const tweet = await this.simulateSendTweet(text, mediaIds, replyToId);

      this.statistics.tweetsSent++;
      this.emit('tweetSent', tweet);

      return tweet;
    } catch (error) {
      this.statistics.errorsCount++;
      throw error;
    }
  }

  async scheduleTweet(
    text: string,
    scheduledAt: Date,
    mediaIds?: string[]
  ): Promise<TwitterScheduledTweet> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    if (scheduledAt <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const scheduledTweet: TwitterScheduledTweet = {
      id: this.generateId(),
      text,
      scheduledAt,
      mediaIds,
      status: 'pending',
    };

    this.scheduledTweets.push(scheduledTweet);
    this.statistics.tweetsScheduled++;
    this.emit('tweetScheduled', scheduledTweet);

    return scheduledTweet;
  }

  cancelScheduledTweet(id: string): void {
    const index = this.scheduledTweets.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.scheduledTweets[index].status = 'cancelled';
    }
  }

  getScheduledTweets(): TwitterScheduledTweet[] {
    return [...this.scheduledTweets].filter((t) => t.status === 'pending');
  }

  private async simulateSendTweet(
    text: string,
    mediaIds?: string[],
    replyToId?: string
  ): Promise<TwitterTweet> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tweet: TwitterTweet = {
          id: this.generateId(),
          text,
          authorId: this.currentUser?.id || '',
          authorName: this.currentUser?.name || '',
          authorUsername: this.currentUser?.username || '',
          createdAt: new Date(),
          publicMetrics: {
            retweetCount: 0,
            replyCount: 0,
            likeCount: 0,
            quoteCount: 0,
            bookmarkCount: 0,
            impressionCount: 0,
          },
          inReplyToTweetId: replyToId,
          attachments: mediaIds?.map((id) => ({
            mediaKey: id,
            type: TwitterMediaType.IMAGE,
            url: '',
          })),
        };
        resolve(tweet);
      }, 100);
    });
  }

  // ============ Stream Notification ============

  async sendStreamStartNotification(streamData: {
    title: string;
    game: string;
    platform: string;
    link: string;
    thumbnailUrl?: string;
  }): Promise<TwitterTweet> {
    const settings = this.config.streamSettings;

    if (!settings.autoTweetOnStart) {
      throw new Error('Stream start notifications are disabled');
    }

    const text = this.buildStreamTweet(settings.tweetTemplate, streamData);

    // In real implementation, would upload thumbnail and get media ID
    const mediaIds = settings.includeThumbnail && streamData.thumbnailUrl
      ? [this.generateId()]
      : undefined;

    const tweet = await this.sendTweet(text, mediaIds);

    this.emit('streamStarted');
    return tweet;
  }

  async sendStreamEndNotification(streamData: {
    duration: number;
    peakViewers: number;
    newFollowers: number;
  }): Promise<TwitterTweet> {
    const settings = this.config.streamSettings;

    if (!settings.autoTweetOnEnd) {
      throw new Error('Stream end notifications are disabled');
    }

    const text = `🎬 Stream ended!\n\n` +
      `⏱️ Duration: ${Math.floor(streamData.duration / 60)} minutes\n` +
      `👥 Peak viewers: ${streamData.peakViewers}\n` +
      `❤️ New followers: ${streamData.newFollowers}\n\n` +
      `Thanks for watching! 🙏`;

    const tweet = await this.sendTweet(text);
    this.emit('streamEnded');
    return tweet;
  }

  private buildStreamTweet(
    template: string,
    data: { title: string; game: string; platform: string; link: string }
  ): string {
    let text = template
      .replace('{title}', data.title)
      .replace('{game}', data.game)
      .replace('{platform}', data.platform)
      .replace('{link}', data.link);

    // Add hashtags
    const hashtags = this.config.streamSettings.hashtags;
    if (hashtags.length > 0) {
      text += '\n\n' + hashtags.map((tag) => `#${tag}`).join(' ');
    }

    // Add mentions
    const mentions = this.config.streamSettings.mentionAccounts;
    if (mentions.length > 0) {
      text += '\n\n' + mentions.map((account) => `@${account}`).join(' ');
    }

    return text;
  }

  // ============ Notification Management ============

  async sendNotification(
    type: TwitterNotificationType,
    data: Record<string, unknown>
  ): Promise<TwitterNotificationEvent> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    const notification = this.config.notifications.find(
      (n) => n.enabled && n.type === type
    );

    if (!notification) {
      throw new Error(`No enabled notification found for type: ${type}`);
    }

    // Check cooldown
    if (this.isNotificationOnCooldown(notification.id)) {
      throw new Error('Notification is on cooldown');
    }

    const event: TwitterNotificationEvent = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      success: false,
      data,
    };

    try {
      const text = this.buildNotificationText(notification, data);
      const tweet = await this.sendTweet(text);

      event.tweetId = tweet.id;
      event.success = true;

      // Set cooldown
      if (notification.cooldown > 0) {
        this.notificationCooldowns.set(notification.id, new Date());
      }

      this.emit('notificationSent', event);
    } catch (error) {
      event.error = error instanceof Error ? error.message : 'Failed to send notification';
      this.statistics.errorsCount++;
    }

    return event;
  }

  addNotification(notification: TwitterNotificationConfig): void {
    this.config.notifications.push(notification);
    this.saveToStorage();
  }

  updateNotification(id: string, updates: Partial<TwitterNotificationConfig>): void {
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

  private buildNotificationText(
    notification: TwitterNotificationConfig,
    data: Record<string, unknown>
  ): string {
    return notification.template.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in data) {
        return String(data[key]);
      }
      return match;
    });
  }

  // ============ Engagement Management ============

  async likeTweet(tweetId: string): Promise<void> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    this.checkRateLimit('likes');
    // Simulate liking tweet
    await this.simulateApiCall();
    this.statistics.likesReceived++;
  }

  async retweet(tweetId: string): Promise<void> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    this.checkRateLimit('retweets');
    await this.simulateApiCall();
    this.statistics.retweetsReceived++;
  }

  async replyToTweet(tweetId: string, text: string): Promise<TwitterTweet> {
    return this.sendTweet(text, undefined, tweetId);
  }

  updateEngagementConfig(updates: Partial<TwitterEngagementConfig>): void {
    this.config.engagement = { ...this.config.engagement, ...updates };
    this.saveToStorage();
  }

  // ============ User Management ============

  async getUser(userId: string): Promise<TwitterUser> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    // Return mock user data
    return {
      id: userId,
      name: 'User',
      username: 'user',
      verified: false,
      publicMetrics: {
        followersCount: 100,
        followingCount: 50,
        tweetCount: 200,
        listedCount: 5,
      },
      createdAt: new Date('2020-01-01'),
      protected: false,
    };
  }

  async getFollowers(userId?: string): Promise<TwitterUser[]> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    // Return mock followers
    return [
      {
        id: '1',
        name: 'Follower One',
        username: 'follower1',
        verified: false,
        publicMetrics: {
          followersCount: 100,
          followingCount: 50,
          tweetCount: 200,
          listedCount: 5,
        },
        createdAt: new Date('2020-01-01'),
        protected: false,
      },
      {
        id: '2',
        name: 'Follower Two',
        username: 'follower2',
        verified: false,
        publicMetrics: {
          followersCount: 200,
          followingCount: 100,
          tweetCount: 300,
          listedCount: 10,
        },
        createdAt: new Date('2021-01-01'),
        protected: false,
      },
    ];
  }

  async getMentions(sinceId?: string): Promise<TwitterTweet[]> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    // Return mock mentions
    return [
      {
        id: this.generateId(),
        text: `@${this.currentUser?.username || 'streamer'} Great stream today!`,
        authorId: '1',
        authorName: 'Follower One',
        authorUsername: 'follower1',
        createdAt: new Date(),
        publicMetrics: {
          retweetCount: 0,
          replyCount: 0,
          likeCount: 5,
          quoteCount: 0,
          bookmarkCount: 0,
          impressionCount: 100,
        },
      },
    ];
  }

  // ============ Spaces ============

  async createSpace(title: string, scheduledStart?: Date): Promise<TwitterSpace> {
    if (this.connectionState.status !== TwitterConnectionStatus.CONNECTED) {
      throw new Error('Not connected to Twitter/X');
    }

    const space: TwitterSpace = {
      id: this.generateId(),
      state: scheduledStart ? 'not_started' : 'live',
      title,
      creatorId: this.currentUser?.id || '',
      creatorUsername: this.currentUser?.username || '',
      scheduledStart,
      startedAt: scheduledStart ? undefined : new Date(),
      participantCount: 0,
      isTicketed: false,
    };

    this.statistics.spacesHosted++;
    return space;
  }

  // ============ State & Statistics ============

  getConnectionState(): TwitterConnectionState {
    return { ...this.connectionState };
  }

  getStatistics(): TwitterStatistics {
    return { ...this.statistics };
  }

  getCurrentUser(): TwitterUser | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  private updateConnectionStatus(
    status: TwitterConnectionStatus,
    updates: Partial<TwitterConnectionState> = {}
  ): void {
    this.connectionState = {
      ...this.connectionState,
      status,
      ...updates,
    };
    this.emit('connectionStateChanged', this.connectionState);
  }

  private getDefaultStatistics(): TwitterStatistics {
    return {
      tweetsSent: 0,
      tweetsScheduled: 0,
      likesReceived: 0,
      retweetsReceived: 0,
      repliesReceived: 0,
      quotesReceived: 0,
      newFollowers: 0,
      mentions: 0,
      spacesHosted: 0,
      errorsCount: 0,
      uptime: 0,
      totalImpressions: 0,
      engagementRate: 0,
    };
  }

  private startStatisticsTracking(): void {
    this.statisticsInterval = setInterval(() => {
      if (this.startTime) {
        this.statistics.uptime = Math.floor(
          (Date.now() - this.startTime.getTime()) / 1000
        );
        this.emit('statisticsUpdated', this.statistics);
      }
    }, 1000);
  }

  // ============ Rate Limiting ============

  private checkRateLimit(endpoint: string): void {
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
  }

  // ============ Storage ============

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save Twitter/X config:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...DEFAULT_TWITTER_X_CONFIG,
          ...parsed,
          notifications: parsed.notifications || [],
        };
      }
    } catch (error) {
      console.error('Failed to load Twitter/X config:', error);
    }
  }

  // ============ Cleanup ============

  destroy(): void {
    this.clearTimers();
    this.notificationCooldowns.clear();
    this.scheduledTweets = [];
    TwitterXService.instance = null;
  }
}

export default TwitterXService;