import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscordBotService } from './DiscordBotService';
import {
  DiscordConnectionStatus,
  DiscordNotificationType,
  DiscordActivityType,
} from '../types/discordBot';

describe('DiscordBotService', () => {
  let service: DiscordBotService;
  let originalRandom: () => number;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset singleton
    (DiscordBotService as any).instance = null;
    service = DiscordBotService.getInstance();
    
    // Mock Math.random to always return 0 (no failures in simulateConnection, fast connection)
    // 0 > 0.02 is false, so connection will succeed
    // connectionTime = 0 * 1000 + 500 = 500ms for fast tests
    originalRandom = Math.random;
    Math.random = vi.fn(() => 0);
  });

  afterEach(() => {
    service.disconnect();
    service.destroy();
    (DiscordBotService as any).instance = null;
    
    // Restore original Math.random
    Math.random = originalRandom;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DiscordBotService.getInstance();
      const instance2 = DiscordBotService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after destroy', () => {
      const instance1 = DiscordBotService.getInstance();
      instance1.destroy();

      (DiscordBotService as any).instance = null;
      const instance2 = DiscordBotService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Configuration Management', () => {
    it('should return default config initially', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.prefix).toBe('!');
      expect(config.notifications).toEqual([]);
      expect(config.commands).toEqual([]);
    });

    it('should update config', () => {
      service.updateConfig({ prefix: '$' });
      const config = service.getConfig();
      expect(config.prefix).toBe('$');
    });

    it('should reset config to defaults', () => {
      service.updateConfig({ prefix: '$' });
      service.resetConfig();
      const config = service.getConfig();
      expect(config.prefix).toBe('!');
    });

    it('should persist config to localStorage', () => {
      service.updateConfig({ prefix: '%' });
      const stored = localStorage.getItem('v-streaming-discord-bot-config');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.prefix).toBe('%');
    });
  });

  describe('Connection Management', () => {
    it('should fail to connect without bot token', async () => {
      await expect(service.connect()).rejects.toThrow('Bot token is required');
    });

    it('should connect with valid token', async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();

      const state = service.getConnectionState();
      expect(state.status).toBe(DiscordConnectionStatus.CONNECTED);
      expect(state.connectedAt).toBeTruthy();
    });

    it('should emit connectionStateChanged event', async () => {
      const listener = vi.fn();
      service.on('connectionStateChanged', listener);

      service.updateConfig({ botToken: 'test-token' });
      await service.connect();

      expect(listener).toHaveBeenCalled();
    });

    it('should disconnect successfully', async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();

      await service.disconnect();

      const state = service.getConnectionState();
      expect(state.status).toBe(DiscordConnectionStatus.DISCONNECTED);
    });

    it('should emit disconnected event', async () => {
      const listener = vi.fn();
      service.on('disconnected', listener);

      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
      await service.disconnect();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should add notification', () => {
      service.addNotification({
        id: 'test-notif',
        enabled: true,
        type: DiscordNotificationType.STREAM_START,
        channelId: '123456789',
        template: 'Stream started!',
        embedEnabled: true,
        embedColor: 0,
        mentionEveryone: false,
        mentionRoleIds: [],
        cooldown: 0,
      });

      const config = service.getConfig();
      expect(config.notifications).toHaveLength(1);
    });

    it('should update notification', () => {
      service.addNotification({
        id: 'test-notif',
        enabled: true,
        type: DiscordNotificationType.STREAM_START,
        channelId: '123456789',
        template: 'Stream started!',
        embedEnabled: true,
        embedColor: 0,
        mentionEveryone: false,
        mentionRoleIds: [],
        cooldown: 0,
      });

      service.updateNotification('test-notif', { template: 'Updated!' });

      const config = service.getConfig();
      expect(config.notifications[0].template).toBe('Updated!');
    });

    it('should remove notification', () => {
      service.addNotification({
        id: 'test-notif',
        enabled: true,
        type: DiscordNotificationType.STREAM_START,
        channelId: '123456789',
        template: 'Stream started!',
        embedEnabled: true,
        embedColor: 0,
        mentionEveryone: false,
        mentionRoleIds: [],
        cooldown: 0,
      });

      service.removeNotification('test-notif');

      const config = service.getConfig();
      expect(config.notifications).toHaveLength(0);
    });

    it('should fail to send notification when not configured', async () => {
      // Ensure no notifications are configured
      service.updateConfig({ notifications: [] });

      await expect(
        service.sendNotification(DiscordNotificationType.STREAM_START, {})
      ).rejects.toThrow('No enabled notification found');
    });

    it('should send notification successfully', async () => {
      service.addNotification({
        id: 'test-notif',
        enabled: true,
        type: DiscordNotificationType.STREAM_START,
        channelId: '123456789',
        template: 'Stream started: {title}',
        embedEnabled: false,
        embedColor: 0,
        mentionEveryone: false,
        mentionRoleIds: [],
        cooldown: 0,
      });

      const event = await service.sendNotification(DiscordNotificationType.STREAM_START, {
        title: 'Test Stream',
      });

      expect(event.success).toBe(true);
      expect(event.messageId).toBeTruthy();
    });
  });

  describe('Command Management', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should add command', () => {
      service.addCommand({
        id: 'test-cmd',
        enabled: true,
        name: 'test',
        description: 'Test command',
        permission: 0,
        cooldown: 3,
        aliases: [],
        response: 'Test response',
        embedEnabled: false,
        embedColor: 0,
      });

      const config = service.getConfig();
      expect(config.commands).toHaveLength(1);
    });

    it('should update command', () => {
      service.addCommand({
        id: 'test-cmd',
        enabled: true,
        name: 'test',
        description: 'Test command',
        permission: 0,
        cooldown: 3,
        aliases: [],
        response: 'Test response',
        embedEnabled: false,
        embedColor: 0,
      });

      service.updateCommand('test-cmd', { response: 'Updated response' });

      const config = service.getConfig();
      expect(config.commands[0].response).toBe('Updated response');
    });

    it('should remove command', () => {
      service.addCommand({
        id: 'test-cmd',
        enabled: true,
        name: 'test',
        description: 'Test command',
        permission: 0,
        cooldown: 3,
        aliases: [],
        response: 'Test response',
        embedEnabled: false,
        embedColor: 0,
      });

      service.removeCommand('test-cmd');

      const config = service.getConfig();
      expect(config.commands).toHaveLength(0);
    });

    it('should execute command successfully', async () => {
      service.addCommand({
        id: 'exec-test-cmd',
        enabled: true,
        name: 'exectest',
        description: 'Test command',
        permission: 0,
        cooldown: 3,
        aliases: [],
        response: 'Hello {user}!',
        embedEnabled: false,
        embedColor: 0,
      });

      const execution = await service.executeCommand(
        'exectest',
        'user123',
        'TestUser',
        'channel123',
        'guild123',
        []
      );

      expect(execution.success).toBe(true);
      expect(execution.response).toBe('Hello TestUser!');
    });

    it('should fail to execute non-existent command', async () => {
      await expect(
        service.executeCommand('nonexistent', 'user123', 'TestUser', 'channel123', 'guild123', [])
      ).rejects.toThrow('Command not found');
    });

    it('should execute command with aliases', async () => {
      service.addCommand({
        id: 'test-cmd',
        enabled: true,
        name: 'test',
        description: 'Test command',
        permission: 0,
        cooldown: 3,
        aliases: ['t', 'testing'],
        response: 'Test response',
        embedEnabled: false,
        embedColor: 0,
      });

      const execution = await service.executeCommand(
        't',
        'user123',
        'TestUser',
        'channel123',
        'guild123',
        []
      );

      expect(execution.success).toBe(true);
      expect(execution.commandName).toBe('test');
    });
  });

  describe('Presence Management', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should update presence', async () => {
      await service.updatePresence({
        activityType: DiscordActivityType.PLAYING,
        activityName: 'Test Game',
      });

      const config = service.getConfig();
      expect(config.presence.activityName).toBe('Test Game');
    });

    it('should set streaming status', async () => {
      await service.setStreamingStatus('Live Stream', 'https://twitch.tv/test');

      const config = service.getConfig();
      expect(config.presence.activityType).toBe(DiscordActivityType.STREAMING);
      expect(config.presence.activityName).toBe('Live Stream');
    });

    it('should emit presenceUpdated event', async () => {
      const listener = vi.fn();
      service.on('presenceUpdated', listener);

      await service.updatePresence({
        activityType: DiscordActivityType.WATCHING,
        activityName: 'Test Movie',
      });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should send message to channel', async () => {
      const messageId = await service.sendMessageToChannel('channel123', 'Hello World');
      expect(messageId).toBeTruthy();
    });

    it('should emit messageSent event', async () => {
      const listener = vi.fn();
      service.on('messageSent', listener);

      await service.sendMessageToChannel('channel123', 'Hello World');

      expect(listener).toHaveBeenCalledWith('channel123', expect.any(String));
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should return initial statistics', () => {
      const stats = service.getStatistics();
      expect(stats.messagesSent).toBe(0);
      expect(stats.commandsExecuted).toBe(0);
      expect(stats.notificationsSent).toBe(0);
    });

    it('should increment messagesSent counter', async () => {
      await service.sendMessageToChannel('channel123', 'Hello');

      const stats = service.getStatistics();
      expect(stats.messagesSent).toBe(1);
    });

    it('should emit statisticsUpdated event', async () => {
      const listener = vi.fn();
      service.on('statisticsUpdated', listener);

      // Wait for the interval
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Guild & Channel Management', () => {
    beforeEach(async () => {
      service.updateConfig({ botToken: 'test-token' });
      await service.connect();
    });

    it('should return guilds', async () => {
      const guilds = await service.getGuilds();
      expect(guilds.length).toBeGreaterThan(0);
      expect(guilds[0].name).toBe('V-Streaming Community');
    });

    it('should return channels for guild', async () => {
      const channels = await service.getChannels('123456789012345678');
      expect(channels.length).toBeGreaterThan(0);
      expect(channels.find((c) => c.name === 'general')).toBeTruthy();
    });

    it('should return roles for guild', async () => {
      const roles = await service.getRoles('123456789012345678');
      expect(roles.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should fail to send notification when disconnected', async () => {
      await expect(
        service.sendNotification(DiscordNotificationType.STREAM_START, {})
      ).rejects.toThrow('Bot is not connected');
    });

    it('should fail to execute command when disconnected', async () => {
      await expect(
        service.executeCommand('test', 'user', 'User', 'channel', 'guild', [])
      ).rejects.toThrow('Bot is not connected');
    });

    it('should fail to send message when disconnected', async () => {
      await expect(
        service.sendMessageToChannel('channel123', 'Hello')
      ).rejects.toThrow('Bot is not connected');
    });

    it('should fail to get guilds when disconnected', async () => {
      await expect(service.getGuilds()).rejects.toThrow('Bot is not connected');
    });
  });
});