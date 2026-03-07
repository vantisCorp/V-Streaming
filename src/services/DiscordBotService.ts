import EventEmitter from 'eventemitter3';
import {
  DiscordBotConfig,
  DiscordConnectionState,
  DiscordConnectionStatus,
  DiscordNotificationConfig,
  DiscordNotificationType,
  DiscordCommandConfig,
  DiscordPresenceConfig,
  DiscordMessage,
  DiscordGuild,
  DiscordChannel,
  DiscordRole,
  DiscordNotificationEvent,
  DiscordCommandExecution,
  DiscordBotStatistics,
  DiscordEmbed,
  DiscordEmbedColor,
  DiscordActivityType,
  DEFAULT_DISCORD_BOT_CONFIG,
} from '../types/discordBot';

// ============ Event Types ============

interface DiscordBotEvents {
  connectionStateChanged: (state: DiscordConnectionState) => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
  messageReceived: (message: DiscordMessage) => void;
  messageSent: (channelId: string, messageId: string) => void;
  notificationSent: (event: DiscordNotificationEvent) => void;
  commandExecuted: (execution: DiscordCommandExecution) => void;
  guildJoined: (guild: DiscordGuild) => void;
  guildLeft: (guildId: string) => void;
  presenceUpdated: (presence: DiscordPresenceConfig) => void;
  statisticsUpdated: (stats: DiscordBotStatistics) => void;
}

/**
 * Discord Bot Service
 * Manages Discord bot connection, commands, and notifications
 */
export class DiscordBotService extends EventEmitter<DiscordBotEvents> {
  private static instance: DiscordBotService | null = null;
  private config: DiscordBotConfig;
  private connectionState: DiscordConnectionState;
  private statistics: DiscordBotStatistics;
  private storageKey = 'v-streaming-discord-bot-config';
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private statisticsInterval: ReturnType<typeof setInterval> | null = null;
  private notificationCooldowns: Map<string, Date> = new Map();
  private commandCooldowns: Map<string, Map<string, Date>> = new Map();
  private startTime: Date | null = null;

  private constructor() {
    super();
    this.config = { ...DEFAULT_DISCORD_BOT_CONFIG };
    this.connectionState = {
      status: DiscordConnectionStatus.DISCONNECTED,
      reconnectAttempts: 0,
      latency: 0,
    };
    this.statistics = this.getDefaultStatistics();
    this.loadFromStorage();
  }

  static getInstance(): DiscordBotService {
    if (!DiscordBotService.instance) {
      DiscordBotService.instance = new DiscordBotService();
    }
    return DiscordBotService.instance;
  }

  // ============ Connection Management ============

  async connect(): Promise<void> {
    if (!this.config.botToken) {
      throw new Error('Bot token is required');
    }

    if (this.connectionState.status === DiscordConnectionStatus.CONNECTED) {
      return;
    }

    this.updateConnectionStatus(DiscordConnectionStatus.CONNECTING);

    try {
      // Simulate connection process
      // In a real implementation, this would use discord.js or similar library
      await this.simulateConnection();

      this.updateConnectionStatus(DiscordConnectionStatus.CONNECTED, {
        connectedAt: new Date(),
        botName: 'V-Streaming Bot',
        reconnectAttempts: 0,
      });

      this.startTime = new Date();
      this.startStatisticsTracking();

      // Set initial presence
      if (this.config.presence.enabled) {
        await this.updatePresence(this.config.presence);
      }

      this.emit('connected');
    } catch (error) {
      this.updateConnectionStatus(DiscordConnectionStatus.ERROR, {
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      this.emit('error', error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionState.status === DiscordConnectionStatus.DISCONNECTED) {
      return;
    }

    this.clearTimers();
    this.updateConnectionStatus(DiscordConnectionStatus.DISCONNECTED);
    this.startTime = null;
    this.emit('disconnected');
  }

  async reconnect(): Promise<void> {
    await this.disconnect();

    if (this.config.autoConnect && this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.updateConnectionStatus(DiscordConnectionStatus.RECONNECTING, {
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

  // ============ Configuration Management ============

  getConfig(): DiscordBotConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DiscordBotConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  resetConfig(): void {
    this.config = {
      ...DEFAULT_DISCORD_BOT_CONFIG,
      notifications: [],
      commands: [],
    };
    this.saveToStorage();
    this.emit('connectionStateChanged', this.connectionState);
  }

  // ============ Notification Management ============

  async sendNotification(
    type: DiscordNotificationType,
    data: Record<string, unknown>
  ): Promise<DiscordNotificationEvent> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
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

    const event: DiscordNotificationEvent = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      channelId: notification.channelId,
      success: false,
      data,
    };

    try {
      const message = this.buildNotificationMessage(notification, data);
      const messageId = await this.sendMessageToChannel(notification.channelId, message);

      event.messageId = messageId;
      event.success = true;

      // Set cooldown
      if (notification.cooldown > 0) {
        this.notificationCooldowns.set(notification.id, new Date());
      }

      this.statistics.notificationsSent++;
      this.emit('notificationSent', event);
    } catch (error) {
      event.error = error instanceof Error ? error.message : 'Failed to send notification';
      this.statistics.errorsCount++;
    }

    return event;
  }

  addNotification(notification: DiscordNotificationConfig): void {
    this.config.notifications.push(notification);
    this.saveToStorage();
  }

  updateNotification(id: string, updates: Partial<DiscordNotificationConfig>): void {
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

  // ============ Command Management ============

  async executeCommand(
    commandName: string,
    userId: string,
    userName: string,
    channelId: string,
    guildId: string,
    args: string[]
  ): Promise<DiscordCommandExecution> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    const command = this.config.commands.find(
      (c) => c.enabled && (c.name === commandName || c.aliases.includes(commandName))
    );

    if (!command) {
      throw new Error(`Command not found: ${commandName}`);
    }

    // Check cooldown
    if (this.isCommandOnCooldown(command.id, userId)) {
      throw new Error('Command is on cooldown for this user');
    }

    const execution: DiscordCommandExecution = {
      id: this.generateId(),
      commandName: command.name,
      userId,
      userName,
      channelId,
      guildId,
      timestamp: new Date(),
      arguments: args,
      response: command.response,
      success: false,
    };

    try {
      let response = command.response;

      // Replace placeholders
      response = this.replacePlaceholders(response, {
        user: userName,
        args: args.join(' '),
        arg0: args[0] || '',
        arg1: args[1] || '',
        arg2: args[2] || '',
        channel: channelId,
        guild: guildId,
      });

      // Execute custom script if defined
      if (command.executeScript) {
        response = await this.executeScript(command.executeScript, { ...execution, args });
      }

      await this.sendMessageToChannel(channelId, response);

      execution.response = response;
      execution.success = true;

      // Set cooldown
      if (command.cooldown > 0) {
        this.setUserCommandCooldown(command.id, userId);
      }

      this.statistics.commandsExecuted++;
      this.emit('commandExecuted', execution);
    } catch (error) {
      execution.error = error instanceof Error ? error.message : 'Failed to execute command';
      this.statistics.errorsCount++;
    }

    return execution;
  }

  addCommand(command: DiscordCommandConfig): void {
    this.config.commands.push(command);
    this.saveToStorage();
  }

  updateCommand(id: string, updates: Partial<DiscordCommandConfig>): void {
    const index = this.config.commands.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.config.commands[index] = { ...this.config.commands[index], ...updates };
      this.saveToStorage();
    }
  }

  removeCommand(id: string): void {
    this.config.commands = this.config.commands.filter((c) => c.id !== id);
    this.saveToStorage();
  }

  // ============ Presence Management ============

  async updatePresence(presence: DiscordPresenceConfig): Promise<void> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    this.config.presence = { ...this.config.presence, ...presence };
    this.saveToStorage();
    this.emit('presenceUpdated', this.config.presence);
  }

  async setStreamingStatus(streamTitle: string, streamUrl?: string): Promise<void> {
    await this.updatePresence({
      enabled: this.config.presence.enabled,
      activityType: DiscordActivityType.STREAMING,
      activityName: streamTitle,
      activityUrl: streamUrl,
      status: 'online',
      autoUpdate: this.config.presence.autoUpdate,
      streamStatus: this.config.presence.streamStatus,
    });
  }

  // ============ Message Handling ============

  async sendMessageToChannel(channelId: string, content: string, embed?: DiscordEmbed): Promise<string> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    // Simulate sending message
    const messageId = this.generateId();

    // In a real implementation, this would use discord.js to send the message
    await this.simulateMessageSend();

    this.statistics.messagesSent++;
    this.emit('messageSent', channelId, messageId);

    return messageId;
  }

  async sendEmbedToChannel(channelId: string, embed: DiscordEmbed): Promise<string> {
    return this.sendMessageToChannel(channelId, '', embed);
  }

  private async simulateMessageSend(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 50 + Math.random() * 100);
    });
  }

  // ============ Guild & Channel Management ============

  async getGuilds(): Promise<DiscordGuild[]> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    // Return mock data for demo purposes
    return [
      {
        id: '123456789012345678',
        name: 'V-Streaming Community',
        icon: undefined,
        ownerId: '987654321098765432',
        memberCount: 1500,
        channels: await this.getChannels('123456789012345678'),
        roles: await this.getRoles('123456789012345678'),
      },
    ];
  }

  async getChannels(guildId: string): Promise<DiscordChannel[]> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    // Return mock data
    return [
      {
        id: '111111111111111111',
        guildId,
        name: 'general',
        type: 0, // TEXT
        position: 0,
        nsfw: false,
      },
      {
        id: '222222222222222222',
        guildId,
        name: 'stream-notifications',
        type: 0, // TEXT
        position: 1,
        topic: 'Stream announcements and notifications',
        nsfw: false,
      },
      {
        id: '333333333333333333',
        guildId,
        name: 'bot-commands',
        type: 0, // TEXT
        position: 2,
        topic: 'Use bot commands here',
        nsfw: false,
      },
    ];
  }

  async getRoles(guildId: string): Promise<DiscordRole[]> {
    if (this.connectionState.status !== DiscordConnectionStatus.CONNECTED) {
      throw new Error('Bot is not connected');
    }

    // Return mock data
    return [
      {
        id: '111111111111111111',
        name: '@everyone',
        color: 0,
        hoist: false,
        position: 0,
        permissions: [],
        managed: false,
        mentionable: false,
      },
      {
        id: '222222222222222222',
        name: 'Subscribers',
        color: DiscordEmbedColor.PURPLE,
        hoist: true,
        position: 1,
        permissions: [],
        managed: false,
        mentionable: true,
      },
      {
        id: '333333333333333333',
        name: 'Moderators',
        color: DiscordEmbedColor.GREEN,
        hoist: true,
        position: 2,
        permissions: [],
        managed: false,
        mentionable: true,
      },
    ];
  }

  // ============ State & Statistics ============

  getConnectionState(): DiscordConnectionState {
    return { ...this.connectionState };
  }

  getStatistics(): DiscordBotStatistics {
    return { ...this.statistics };
  }

  private updateConnectionStatus(
    status: DiscordConnectionStatus,
    updates: Partial<DiscordConnectionState> = {}
  ): void {
    this.connectionState = {
      ...this.connectionState,
      status,
      ...updates,
    };
    this.emit('connectionStateChanged', this.connectionState);
  }

  private getDefaultStatistics(): DiscordBotStatistics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      commandsExecuted: 0,
      notificationsSent: 0,
      errorsCount: 0,
      uptime: 0,
      serversConnected: 0,
      usersReached: 0,
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

  // ============ Helper Methods ============

  private buildNotificationMessage(
    notification: DiscordNotificationConfig,
    data: Record<string, unknown>
  ): string {
    let message = notification.template;

    // Replace placeholders with data
    message = this.replacePlaceholders(message, data);

    // Add mentions
    if (notification.mentionEveryone) {
      message = `@everyone ${message}`;
    }

    for (const roleId of notification.mentionRoleIds) {
      message = `<@&${roleId}> ${message}`;
    }

    return message;
  }

  private replacePlaceholders(text: string, data: Record<string, unknown>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      if (key in data) {
        return String(data[key]);
      }
      return match;
    });
  }

  private async executeScript(
    script: string,
    context: Record<string, unknown>
  ): Promise<string> {
    // In a real implementation, this would safely execute the script
    // For now, just return the original response
    return String(context.args || '');
  }

  private isNotificationOnCooldown(notificationId: string): boolean {
    const lastSent = this.notificationCooldowns.get(notificationId);
    if (!lastSent) return false;

    const notification = this.config.notifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    const elapsed = (Date.now() - lastSent.getTime()) / 1000;
    return elapsed < notification.cooldown;
  }

  private isCommandOnCooldown(commandId: string, userId: string): boolean {
    const userCooldowns = this.commandCooldowns.get(commandId);
    if (!userCooldowns) return false;

    const lastUsed = userCooldowns.get(userId);
    if (!lastUsed) return false;

    const command = this.config.commands.find((c) => c.id === commandId);
    if (!command) return false;

    const elapsed = (Date.now() - lastUsed.getTime()) / 1000;
    return elapsed < command.cooldown;
  }

  private setUserCommandCooldown(commandId: string, userId: string): void {
    if (!this.commandCooldowns.has(commandId)) {
      this.commandCooldowns.set(commandId, new Map());
    }
    this.commandCooldowns.get(commandId)!.set(userId, new Date());
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
      console.error('Failed to save Discord bot config:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...DEFAULT_DISCORD_BOT_CONFIG,
          ...parsed,
          notifications: parsed.notifications || [],
          commands: parsed.commands || [],
        };
      }
    } catch (error) {
      console.error('Failed to load Discord bot config:', error);
    }
  }

  // ============ Cleanup ============

  destroy(): void {
    this.clearTimers();
    this.notificationCooldowns.clear();
    this.commandCooldowns.clear();
    DiscordBotService.instance = null;
  }
}

export default DiscordBotService;