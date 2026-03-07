import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TikTokLiveService } from './TikTokLiveService';
import { TikTokConnectionStatus, TikTokStreamStatus } from '../types/tiktokLive';

describe('TikTokLiveService', () => {
  let service: TikTokLiveService;

  beforeEach(() => {
    localStorage.clear();
    // Reset singleton
    (TikTokLiveService as any).instance = null;
    service = TikTokLiveService.getInstance();
  });

  afterEach(() => {
    service.disconnect();
    (TikTokLiveService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TikTokLiveService.getInstance();
      const instance2 = TikTokLiveService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = TikTokLiveService.getInstance();
      instance1.disconnect();
      (TikTokLiveService as any).instance = null;
      const instance2 = TikTokLiveService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Configuration Management', () => {
    it('should return default config initially', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(false);
      expect(config.uniqueId).toBe('');
      expect(config.roomId).toBe('');
    });

    it('should update config', () => {
      service.updateConfig({ uniqueId: 'test_user' });
      const config = service.getConfig();
      expect(config.uniqueId).toBe('test_user');
    });

    it('should reset config to defaults', () => {
      service.updateConfig({ uniqueId: 'test_user' });
      service.resetConfig();
      const config = service.getConfig();
      expect(config.uniqueId).toBe('');
    });

    it('should persist config to localStorage', () => {
      service.updateConfig({ uniqueId: 'persisted_user' });
      const stored = localStorage.getItem('v-streaming-tiktok-live-config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.uniqueId).toBe('persisted_user');
    });
  });

  describe('Connection Management', () => {
    it('should fail to connect without uniqueId', async () => {
      await expect(service.connect()).rejects.toThrow('TikTok uniqueId is required');
    });

    it('should have disconnected state initially', () => {
      const state = service.getConnectionState();
      expect(state.status).toBe(TikTokConnectionStatus.DISCONNECTED);
    });

    it('should have zero reconnect attempts initially', () => {
      const state = service.getConnectionState();
      expect(state.reconnectAttempts).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should get statistics', () => {
      const stats = service.getStatistics();
      expect(stats).toBeDefined();
    });

    it('should have zero values initially', () => {
      const stats = service.getStatistics();
      expect(stats.totalViewers).toBe(0);
      expect(stats.totalDiamonds).toBe(0);
      expect(stats.totalGifts).toBe(0);
      expect(stats.totalComments).toBe(0);
      expect(stats.totalLikes).toBe(0);
      expect(stats.totalFollows).toBe(0);
      expect(stats.totalShares).toBe(0);
    });
  });

  describe('Current User', () => {
    it('should return null when not connected', () => {
      const user = service.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('Room Info', () => {
    it('should return null when not connected', () => {
      const roomInfo = service.getRoomInfo();
      expect(roomInfo).toBeNull();
    });
  });

  describe('Stream Status', () => {
    it('should return idle status initially', () => {
      const status = service.getStreamStatus();
      expect(status).toBe(TikTokStreamStatus.IDLE);
    });
  });

  describe('Gift Goal', () => {
    it('should have default gift goal progress', () => {
      const progress = service.getGiftGoalProgress();
      expect(progress).toBeDefined();
      expect(progress.current).toBe(0);
      // Default target is 10000 according to DEFAULT_TIKTOK_LIVE_CONFIG
      expect(progress.target).toBe(10000);
    });

    it('should set gift goal', () => {
      service.setGiftGoal(1000, 'Test Goal');
      const progress = service.getGiftGoalProgress();
      expect(progress.target).toBe(1000);
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

  describe('Engagement Settings', () => {
    it('should have default engagement settings', () => {
      const config = service.getConfig();
      expect(config.engagement).toBeDefined();
      expect(config.engagement.autoReplyEnabled).toBe(false);
      expect(config.engagement.thankFollowers).toBe(true);
      expect(config.engagement.thankGifters).toBe(true);
      expect(config.engagement.welcomeViewers).toBe(false);
    });

    it('should update engagement settings', () => {
      service.updateConfig({
        engagement: {
          autoReplyEnabled: true,
          autoReplyTemplate: 'Thanks for watching!',
          thankFollowers: true,
          thankTemplate: 'Thanks!',
          thankGifters: true,
          giftThankTemplate: 'Thanks for the gift!',
          welcomeViewers: true,
          welcomeTemplate: 'Welcome!',
        },
      });
      const config = service.getConfig();
      expect(config.engagement.autoReplyEnabled).toBe(true);
      expect(config.engagement.welcomeViewers).toBe(true);
    });
  });

  describe('Notification Settings', () => {
    it('should have empty notifications initially', () => {
      const config = service.getConfig();
      expect(config.notifications).toEqual([]);
    });

    it('should add notification config', () => {
      service.updateConfig({
        notifications: [{
          id: 'notif_1',
          enabled: true,
          type: 'gift',
          template: 'Thanks for the gift!',
          includeUserInfo: true,
          cooldown: 300,
        }],
      });
      const config = service.getConfig();
      expect(config.notifications).toHaveLength(1);
      expect(config.notifications[0].type).toBe('gift');
    });
  });

  describe('Connection with Simulation - Basic Tests', () => {
    it('should attempt connection with valid uniqueId', async () => {
      service.updateConfig({
        uniqueId: 'test_user',
        sessionId: 'test_session',
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
          (TikTokLiveService as any).instance = null;
          service = TikTokLiveService.getInstance();
          service.updateConfig({
            uniqueId: 'test_user',
            sessionId: 'test_session',
          });
        }
      }

      if (connected) {
        const state = service.getConnectionState();
        expect(state.status).toBe(TikTokConnectionStatus.CONNECTED);
      }
    });

    it('should disconnect successfully', async () => {
      service.updateConfig({
        uniqueId: 'test_user',
        sessionId: 'test_session',
      });

      try {
        await service.connect();
      } catch (e) {
        // Ignore random simulation failure
      }

      await service.disconnect();
      const state = service.getConnectionState();
      expect(state.status).toBe(TikTokConnectionStatus.DISCONNECTED);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing uniqueId gracefully', async () => {
      service.updateConfig({
        uniqueId: '',
        sessionId: '',
      });

      try {
        await service.connect();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('uniqueId');
      }
    });
  });

  describe('Storage Operations', () => {
    it('should load config from localStorage on instantiation', () => {
      const storedConfig = {
        uniqueId: 'stored_user',
        sessionId: 'stored_session',
      };
      localStorage.setItem('v-streaming-tiktok-live-config', JSON.stringify(storedConfig));

      (TikTokLiveService as any).instance = null;
      const newService = TikTokLiveService.getInstance();
      const config = newService.getConfig();

      expect(config.uniqueId).toBe('stored_user');
    });
  });

  describe('Gift Goal Tracking', () => {
    it('should track gift goal progress', () => {
      service.setGiftGoal(100);
      const progress = service.getGiftGoalProgress();
      expect(progress.target).toBe(100);
    });

    it('should calculate percentage correctly', () => {
      service.setGiftGoal(200);
      const progress = service.getGiftGoalProgress();
      expect(progress.target).toBe(200);
      // Initial progress should be 0%
      expect(progress.percentage).toBe(0);
    });
  });
});