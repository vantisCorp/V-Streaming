import { useState, useEffect, useCallback } from 'react';
import { TwitterXService } from '../services/TwitterXService';
import {
  TwitterXConfig,
  TwitterConnectionState,
  TwitterStatistics,
  TwitterNotificationConfig,
  TwitterNotificationType,
  TwitterTweet,
  TwitterUser,
  TwitterSpace,
  TwitterNotificationEvent,
  TwitterScheduledTweet,
  TwitterStreamSettings,
  TwitterEngagementConfig,
} from '../types/twitterX';

// ============ Hook Return Type ============

interface UseTwitterXReturn {
  // State
  config: TwitterXConfig;
  connectionState: TwitterConnectionState;
  statistics: TwitterStatistics;
  currentUser: TwitterUser | null;

  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Configuration
  updateConfig: (updates: Partial<TwitterXConfig>) => void;
  resetConfig: () => void;

  // Tweets
  sendTweet: (text: string, mediaIds?: string[], replyToId?: string) => Promise<TwitterTweet>;
  scheduleTweet: (text: string, scheduledAt: Date, mediaIds?: string[]) => Promise<TwitterScheduledTweet>;
  cancelScheduledTweet: (id: string) => void;
  getScheduledTweets: () => TwitterScheduledTweet[];

  // Stream Notifications
  sendStreamStartNotification: (streamData: {
    title: string;
    game: string;
    platform: string;
    link: string;
    thumbnailUrl?: string;
  }) => Promise<TwitterTweet>;
  sendStreamEndNotification: (streamData: {
    duration: number;
    peakViewers: number;
    newFollowers: number;
  }) => Promise<TwitterTweet>;

  // Notifications
  sendNotification: (type: TwitterNotificationType, data: Record<string, unknown>) => Promise<TwitterNotificationEvent>;
  addNotification: (notification: TwitterNotificationConfig) => void;
  updateNotification: (id: string, updates: Partial<TwitterNotificationConfig>) => void;
  removeNotification: (id: string) => void;

  // Engagement
  likeTweet: (tweetId: string) => Promise<void>;
  retweet: (tweetId: string) => Promise<void>;
  replyToTweet: (tweetId: string, text: string) => Promise<TwitterTweet>;
  updateEngagementConfig: (updates: Partial<TwitterEngagementConfig>) => void;

  // Stream Settings
  updateStreamSettings: (updates: Partial<TwitterStreamSettings>) => void;

  // User
  getUser: (userId: string) => Promise<TwitterUser>;
  getFollowers: (userId?: string) => Promise<TwitterUser[]>;
  getMentions: (sinceId?: string) => Promise<TwitterTweet[]>;

  // Spaces
  createSpace: (title: string, scheduledStart?: Date) => Promise<TwitterSpace>;

  // Cleanup
  destroy: () => void;
}

// ============ Hook Implementation ============

export function useTwitterX(): UseTwitterXReturn {
  const service = TwitterXService.getInstance();

  const [config, setConfig] = useState<TwitterXConfig>(service.getConfig());
  const [connectionState, setConnectionState] = useState<TwitterConnectionState>(service.getConnectionState());
  const [statistics, setStatistics] = useState<TwitterStatistics>(service.getStatistics());
  const [currentUser, setCurrentUser] = useState<TwitterUser | null>(service.getCurrentUser());

  // ============ Event Listeners ============

  useEffect(() => {
    const handleConnectionStateChanged = (state: TwitterConnectionState) => {
      setConnectionState(state);
    };

    const handleStatisticsUpdated = (stats: TwitterStatistics) => {
      setStatistics(stats);
    };

    const handleConnected = (user: TwitterUser) => {
      setCurrentUser(user);
    };

    const handleDisconnected = () => {
      setCurrentUser(null);
    };

    service.on('connectionStateChanged', handleConnectionStateChanged);
    service.on('statisticsUpdated', handleStatisticsUpdated);
    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);

    return () => {
      service.off('connectionStateChanged', handleConnectionStateChanged);
      service.off('statisticsUpdated', handleStatisticsUpdated);
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
    };
  }, [service]);

  // ============ Connection ============

  const connect = useCallback(async () => {
    await service.connect();
    setConfig(service.getConfig());
    setCurrentUser(service.getCurrentUser());
  }, [service]);

  const disconnect = useCallback(async () => {
    await service.disconnect();
  }, [service]);

  const reconnect = useCallback(async () => {
    await service.reconnect();
  }, [service]);

  // ============ Configuration ============

  const updateConfig = useCallback((updates: Partial<TwitterXConfig>) => {
    service.updateConfig(updates);
    setConfig(service.getConfig());
  }, [service]);

  const resetConfig = useCallback(() => {
    service.resetConfig();
    setConfig(service.getConfig());
  }, [service]);

  // ============ Tweets ============

  const sendTweet = useCallback(
    async (text: string, mediaIds?: string[], replyToId?: string) => {
      return service.sendTweet(text, mediaIds, replyToId);
    },
    [service]
  );

  const scheduleTweet = useCallback(
    async (text: string, scheduledAt: Date, mediaIds?: string[]) => {
      return service.scheduleTweet(text, scheduledAt, mediaIds);
    },
    [service]
  );

  const cancelScheduledTweet = useCallback(
    (id: string) => {
      service.cancelScheduledTweet(id);
    },
    [service]
  );

  const getScheduledTweets = useCallback(() => {
    return service.getScheduledTweets();
  }, [service]);

  // ============ Stream Notifications ============

  const sendStreamStartNotification = useCallback(
    async (streamData: {
      title: string;
      game: string;
      platform: string;
      link: string;
      thumbnailUrl?: string;
    }) => {
      return service.sendStreamStartNotification(streamData);
    },
    [service]
  );

  const sendStreamEndNotification = useCallback(
    async (streamData: {
      duration: number;
      peakViewers: number;
      newFollowers: number;
    }) => {
      return service.sendStreamEndNotification(streamData);
    },
    [service]
  );

  // ============ Notifications ============

  const sendNotification = useCallback(
    async (type: TwitterNotificationType, data: Record<string, unknown>) => {
      return service.sendNotification(type, data);
    },
    [service]
  );

  const addNotification = useCallback((notification: TwitterNotificationConfig) => {
    service.addNotification(notification);
    setConfig(service.getConfig());
  }, [service]);

  const updateNotification = useCallback((id: string, updates: Partial<TwitterNotificationConfig>) => {
    service.updateNotification(id, updates);
    setConfig(service.getConfig());
  }, [service]);

  const removeNotification = useCallback((id: string) => {
    service.removeNotification(id);
    setConfig(service.getConfig());
  }, [service]);

  // ============ Engagement ============

  const likeTweet = useCallback(
    async (tweetId: string) => {
      await service.likeTweet(tweetId);
    },
    [service]
  );

  const retweet = useCallback(
    async (tweetId: string) => {
      await service.retweet(tweetId);
    },
    [service]
  );

  const replyToTweet = useCallback(
    async (tweetId: string, text: string) => {
      return service.replyToTweet(tweetId, text);
    },
    [service]
  );

  const updateEngagementConfig = useCallback((updates: Partial<TwitterEngagementConfig>) => {
    service.updateEngagementConfig(updates);
    setConfig(service.getConfig());
  }, [service]);

  // ============ Stream Settings ============

  const updateStreamSettings = useCallback((updates: Partial<TwitterStreamSettings>) => {
    service.updateConfig({
      streamSettings: { ...config.streamSettings, ...updates },
    });
    setConfig(service.getConfig());
  }, [service, config.streamSettings]);

  // ============ User ============

  const getUser = useCallback(
    async (userId: string) => {
      return service.getUser(userId);
    },
    [service]
  );

  const getFollowers = useCallback(
    async (userId?: string) => {
      return service.getFollowers(userId);
    },
    [service]
  );

  const getMentions = useCallback(
    async (sinceId?: string) => {
      return service.getMentions(sinceId);
    },
    [service]
  );

  // ============ Spaces ============

  const createSpace = useCallback(
    async (title: string, scheduledStart?: Date) => {
      return service.createSpace(title, scheduledStart);
    },
    [service]
  );

  // ============ Cleanup ============

  const destroy = useCallback(() => {
    service.destroy();
  }, [service]);

  return {
    config,
    connectionState,
    statistics,
    currentUser,

    connect,
    disconnect,
    reconnect,

    updateConfig,
    resetConfig,

    sendTweet,
    scheduleTweet,
    cancelScheduledTweet,
    getScheduledTweets,

    sendStreamStartNotification,
    sendStreamEndNotification,

    sendNotification,
    addNotification,
    updateNotification,
    removeNotification,

    likeTweet,
    retweet,
    replyToTweet,
    updateEngagementConfig,

    updateStreamSettings,

    getUser,
    getFollowers,
    getMentions,

    createSpace,

    destroy,
  };
}

export default useTwitterX;