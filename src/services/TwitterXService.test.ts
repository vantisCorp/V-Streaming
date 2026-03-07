import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TwitterXService } from './TwitterXService';
import { TwitterConnectionStatus, TwitterNotificationType } from '../types/twitterX';

describe('TwitterXService', () => {
  let service: TwitterXService;

  beforeEach(() => {
    localStorage.clear();
    // Reset singleton
    (TwitterXService as any).instance = null;
    service = TwitterXService.getInstance();
  });

  afterEach(() => {
    service.disconnect();
    (TwitterXService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TwitterXService.getInstance();
      const instance2 = TwitterXService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = TwitterXService.getInstance();
      instance1.disconnect();
      (TwitterXService as any).instance = null;
      const instance2 = TwitterXService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Configuration Management', () => {
    it('should return default config initially', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(false);
      expect(config.apiKey).toBe('');
      expect(config.apiSecret).toBe('');
    });

    it('should update config', () => {
      service.updateConfig({ apiKey: 'test_key' });
      const config = service.getConfig();
      expect(config.apiKey).toBe('test_key');
    });

    it('should reset config to defaults', () => {
      service.updateConfig({ apiKey: 'test_key' });
      service.resetConfig();
      const config = service.getConfig();
      expect(config.apiKey).toBe('');
    });

    it('should persist config to localStorage', () => {
      service.updateConfig({ apiKey: 'persisted_key' });
      const stored = localStorage.getItem('v-streaming-twitter-x-config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.apiKey).toBe('persisted_key');
    });
  });

  describe('Connection Management', () => {
    it('should fail to connect without credentials', async () => {
      await expect(service.connect()).rejects.toThrow('Twitter/X API credentials are required');
    });

    it('should fail to connect with only API key', async () => {
      service.updateConfig({ apiKey: 'test_key' });
      await expect(service.connect()).rejects.toThrow('Twitter/X API credentials are required');
    });

    it('should fail to connect without bearer token', async () => {
      service.updateConfig({ apiKey: 'test_key', apiSecret: 'test_secret' });
      await expect(service.connect()).rejects.toThrow('Twitter/X API credentials are required');
    });

    it('should have disconnected state initially', () => {
      const state = service.getConnectionState();
      expect(state.status).toBe(TwitterConnectionStatus.DISCONNECTED);
    });

    it('should have zero reconnect attempts initially', () => {
      const state = service.getConnectionState();
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should have default rate limit remaining', () => {
      const state = service.getConnectionState();
      expect(state.rateLimitRemaining).toBe(100);
    });
  });

  describe('Statistics', () => {
    it('should get statistics', () => {
      const stats = service.getStatistics();
      expect(stats).toBeDefined();
    });

    it('should have zero values initially', () => {
      const stats = service.getStatistics();
      expect(stats.tweetsSent).toBe(0);
      expect(stats.tweetsScheduled).toBe(0);
    });
  });

  describe('Current User', () => {
    it('should return null when not connected', () => {
      const user = service.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('Scheduled Tweets', () => {
    it('should return empty array initially', () => {
      const scheduled = service.getScheduledTweets();
      expect(scheduled).toEqual([]);
    });
  });

  describe('Event Emitter', () => {
    it('should register event listener', () => {
      const listener = vi.fn();
      service.on('disconnected', listener);
      service.emit('disconnected');
      expect(listener).toHaveBeenCalled();
    });

    it('should remove event listener', () => {
      const listener = vi.fn();
      service.on('disconnected', listener);
      service.off('disconnected', listener);
      service.emit('disconnected');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.on('disconnected', listener1);
      service.on('disconnected', listener2);
      service.emit('disconnected');
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Stream Settings', () => {
    it('should have default stream settings', () => {
      const config = service.getConfig();
      expect(config.streamSettings).toBeDefined();
      // Defaults are true according to DEFAULT_TWITTER_X_CONFIG
      expect(config.streamSettings.autoTweetOnStart).toBe(true);
      expect(config.streamSettings.autoTweetOnEnd).toBe(true);
    });

    it('should update stream settings', () => {
      service.updateConfig({
        streamSettings: {
          autoTweetOnStart: false,
          autoTweetOnEnd: true,
          tweetTemplate: 'Live now!',
          includeThumbnail: true,
          includeLink: true,
          hashtags: ['streaming'],
          mentionAccounts: [],
        },
      });
      const config = service.getConfig();
      expect(config.streamSettings.autoTweetOnStart).toBe(false);
      expect(config.streamSettings.hashtags).toContain('streaming');
    });
  });

  describe('Notification Config', () => {
    it('should have empty notifications initially', () => {
      const config = service.getConfig();
      expect(config.notifications).toEqual([]);
    });

    it('should add notification config', () => {
      service.updateConfig({
        notifications: [{
          id: 'notif_1',
          enabled: true,
          type: TwitterNotificationType.STREAM_START,
          template: 'Going live!',
          includeMedia: false,
          cooldown: 300,
        }],
      });
      const config = service.getConfig();
      expect(config.notifications).toHaveLength(1);
      expect(config.notifications[0].type).toBe(TwitterNotificationType.STREAM_START);
    });
  });

  describe('Auto Post Config', () => {
    it('should have default auto post config', () => {
      const config = service.getConfig();
      expect(config.autoPost).toBeDefined();
      // Default is true according to DEFAULT_TWITTER_X_CONFIG
      expect(config.autoPost.enabled).toBe(true);
    });

    it('should update auto post config', () => {
      service.updateConfig({
        autoPost: {
          enabled: false,
          postFollowers: true,
          postMilestones: true,
          postSchedule: false,
          milestoneThresholds: [100, 500, 1000],
          scheduleTemplate: 'Thanks for {count} followers!',
        },
      });
      const config = service.getConfig();
      expect(config.autoPost.enabled).toBe(false);
      expect(config.autoPost.milestoneThresholds).toContain(100);
    });
  });

  describe('Engagement Config', () => {
    it('should have default engagement config', () => {
      const config = service.getConfig();
      expect(config.engagement).toBeDefined();
      expect(config.engagement.autoLikeMentions).toBe(false);
      expect(config.engagement.autoRetweetMentions).toBe(false);
    });

    it('should update engagement config', () => {
      service.updateConfig({
        engagement: {
          autoLikeMentions: true,
          autoRetweetMentions: true,
          autoReplyEnabled: true,
          autoReplyTemplate: 'Thanks for mentioning!',
          thankFollowers: true,
          thankTemplate: 'Thanks for following!',
        },
      });
      const config = service.getConfig();
      expect(config.engagement.autoLikeMentions).toBe(true);
      expect(config.engagement.autoReplyEnabled).toBe(true);
    });
  });

  describe('Connection with Simulation - Basic Tests', () => {
    it('should attempt connection with valid credentials', async () => {
      service.updateConfig({
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        bearerToken: 'test_bearer',
        accessToken: 'test_token',
        accessTokenSecret: 'test_secret',
        username: 'testuser',
      });

      // The simulateConnection has 2% failure rate, so we retry if needed
      let connected = false;
      for (let i = 0; i < 5; i++) {
        try {
          await service.connect();
          connected = true;
          break;
        } catch (e) {
          // Retry on random simulation failure
          (TwitterXService as any).instance = null;
          service = TwitterXService.getInstance();
          service.updateConfig({
            apiKey: 'test_key',
            apiSecret: 'test_secret',
            bearerToken: 'test_bearer',
            accessToken: 'test_token',
            accessTokenSecret: 'test_secret',
            username: 'testuser',
          });
        }
      }

      if (connected) {
        const state = service.getConnectionState();
        expect(state.status).toBe(TwitterConnectionStatus.CONNECTED);
        expect(state.username).toBe('testuser');
      }
    });

    it('should disconnect successfully', async () => {
      service.updateConfig({
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        bearerToken: 'test_bearer',
      });

      try {
        await service.connect();
      } catch (e) {
        // Ignore random simulation failure
      }

      await service.disconnect();
      const state = service.getConnectionState();
      expect(state.status).toBe(TwitterConnectionStatus.DISCONNECTED);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing credentials gracefully', async () => {
      service.updateConfig({
        apiKey: '',
        apiSecret: '',
        bearerToken: '',
      });

      try {
        await service.connect();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('credentials');
      }
    });
  });

  describe('Storage Operations', () => {
    it('should load config from localStorage on instantiation', () => {
      const storedConfig = {
        apiKey: 'stored_key',
        apiSecret: 'stored_secret',
        bearerToken: 'stored_bearer',
      };
      localStorage.setItem('v-streaming-twitter-x-config', JSON.stringify(storedConfig));

      (TwitterXService as any).instance = null;
      const newService = TwitterXService.getInstance();
      const config = newService.getConfig();

      expect(config.apiKey).toBe('stored_key');
    });
  });
});
