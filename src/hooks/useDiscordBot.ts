import { useState, useEffect, useCallback } from 'react';
import {
  DiscordBotService,
} from '../services/DiscordBotService';
import {
  DiscordBotConfig,
  DiscordConnectionState,
  DiscordBotStatistics,
  DiscordNotificationConfig,
  DiscordNotificationType,
  DiscordCommandConfig,
  DiscordPresenceConfig,
  DiscordGuild,
  DiscordChannel,
  DiscordRole,
  DiscordNotificationEvent,
  DiscordCommandExecution,
  DiscordEmbed,
} from '../types/discordBot';

// ============ Hook Return Type ============

interface UseDiscordBotReturn {
  // State
  config: DiscordBotConfig;
  connectionState: DiscordConnectionState;
  statistics: DiscordBotStatistics;

  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Configuration
  updateConfig: (updates: Partial<DiscordBotConfig>) => void;
  resetConfig: () => void;

  // Notifications
  sendNotification: (type: DiscordNotificationType, data: Record<string, unknown>) => Promise<DiscordNotificationEvent>;
  addNotification: (notification: DiscordNotificationConfig) => void;
  updateNotification: (id: string, updates: Partial<DiscordNotificationConfig>) => void;
  removeNotification: (id: string) => void;

  // Commands
  executeCommand: (
    commandName: string,
    userId: string,
    userName: string,
    channelId: string,
    guildId: string,
    args: string[]
  ) => Promise<DiscordCommandExecution>;
  addCommand: (command: DiscordCommandConfig) => void;
  updateCommand: (id: string, updates: Partial<DiscordCommandConfig>) => void;
  removeCommand: (id: string) => void;

  // Presence
  updatePresence: (presence: DiscordPresenceConfig) => Promise<void>;
  setStreamingStatus: (streamTitle: string, streamUrl?: string) => Promise<void>;

  // Messages
  sendMessageToChannel: (channelId: string, content: string, embed?: DiscordEmbed) => Promise<string>;
  sendEmbedToChannel: (channelId: string, embed: DiscordEmbed) => Promise<string>;

  // Guild & Channel
  getGuilds: () => Promise<DiscordGuild[]>;
  getChannels: (guildId: string) => Promise<DiscordChannel[]>;
  getRoles: (guildId: string) => Promise<DiscordRole[]>;

  // Cleanup
  destroy: () => void;
}

// ============ Hook Implementation ============

export function useDiscordBot(): UseDiscordBotReturn {
  const service = DiscordBotService.getInstance();

  const [config, setConfig] = useState<DiscordBotConfig>(service.getConfig());
  const [connectionState, setConnectionState] = useState<DiscordConnectionState>(service.getConnectionState());
  const [statistics, setStatistics] = useState<DiscordBotStatistics>(service.getStatistics());

  // ============ Event Listeners ============

  useEffect(() => {
    const handleConnectionStateChanged = (state: DiscordConnectionState) => {
      setConnectionState(state);
    };

    const handleStatisticsUpdated = (stats: DiscordBotStatistics) => {
      setStatistics(stats);
    };

    service.on('connectionStateChanged', handleConnectionStateChanged);
    service.on('statisticsUpdated', handleStatisticsUpdated);

    return () => {
      service.off('connectionStateChanged', handleConnectionStateChanged);
      service.off('statisticsUpdated', handleStatisticsUpdated);
    };
  }, [service]);

  // ============ Connection ============

  const connect = useCallback(async () => {
    await service.connect();
    setConfig(service.getConfig());
  }, [service]);

  const disconnect = useCallback(async () => {
    await service.disconnect();
  }, [service]);

  const reconnect = useCallback(async () => {
    await service.reconnect();
  }, [service]);

  // ============ Configuration ============

  const updateConfig = useCallback((updates: Partial<DiscordBotConfig>) => {
    service.updateConfig(updates);
    setConfig(service.getConfig());
  }, [service]);

  const resetConfig = useCallback(() => {
    service.resetConfig();
    setConfig(service.getConfig());
  }, [service]);

  // ============ Notifications ============

  const sendNotification = useCallback(
    async (type: DiscordNotificationType, data: Record<string, unknown>) => {
      return service.sendNotification(type, data);
    },
    [service]
  );

  const addNotification = useCallback((notification: DiscordNotificationConfig) => {
    service.addNotification(notification);
    setConfig(service.getConfig());
  }, [service]);

  const updateNotification = useCallback((id: string, updates: Partial<DiscordNotificationConfig>) => {
    service.updateNotification(id, updates);
    setConfig(service.getConfig());
  }, [service]);

  const removeNotification = useCallback((id: string) => {
    service.removeNotification(id);
    setConfig(service.getConfig());
  }, [service]);

  // ============ Commands ============

  const executeCommand = useCallback(
    async (
      commandName: string,
      userId: string,
      userName: string,
      channelId: string,
      guildId: string,
      args: string[]
    ) => {
      return service.executeCommand(commandName, userId, userName, channelId, guildId, args);
    },
    [service]
  );

  const addCommand = useCallback((command: DiscordCommandConfig) => {
    service.addCommand(command);
    setConfig(service.getConfig());
  }, [service]);

  const updateCommand = useCallback((id: string, updates: Partial<DiscordCommandConfig>) => {
    service.updateCommand(id, updates);
    setConfig(service.getConfig());
  }, [service]);

  const removeCommand = useCallback((id: string) => {
    service.removeCommand(id);
    setConfig(service.getConfig());
  }, [service]);

  // ============ Presence ============

  const updatePresence = useCallback(async (presence: DiscordPresenceConfig) => {
    await service.updatePresence(presence);
    setConfig(service.getConfig());
  }, [service]);

  const setStreamingStatus = useCallback(async (streamTitle: string, streamUrl?: string) => {
    await service.setStreamingStatus(streamTitle, streamUrl);
    setConfig(service.getConfig());
  }, [service]);

  // ============ Messages ============

  const sendMessageToChannel = useCallback(
    async (channelId: string, content: string, embed?: DiscordEmbed) => {
      return service.sendMessageToChannel(channelId, content, embed);
    },
    [service]
  );

  const sendEmbedToChannel = useCallback(
    async (channelId: string, embed: DiscordEmbed) => {
      return service.sendEmbedToChannel(channelId, embed);
    },
    [service]
  );

  // ============ Guild & Channel ============

  const getGuilds = useCallback(async () => {
    return service.getGuilds();
  }, [service]);

  const getChannels = useCallback(async (guildId: string) => {
    return service.getChannels(guildId);
  }, [service]);

  const getRoles = useCallback(async (guildId: string) => {
    return service.getRoles(guildId);
  }, [service]);

  // ============ Cleanup ============

  const destroy = useCallback(() => {
    service.destroy();
  }, [service]);

  return {
    config,
    connectionState,
    statistics,

    connect,
    disconnect,
    reconnect,

    updateConfig,
    resetConfig,

    sendNotification,
    addNotification,
    updateNotification,
    removeNotification,

    executeCommand,
    addCommand,
    updateCommand,
    removeCommand,

    updatePresence,
    setStreamingStatus,

    sendMessageToChannel,
    sendEmbedToChannel,

    getGuilds,
    getChannels,
    getRoles,

    destroy,
  };
}

export default useDiscordBot;