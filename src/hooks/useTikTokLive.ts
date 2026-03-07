import { useState, useEffect, useCallback } from 'react';
import { TikTokLiveService } from '../services/TikTokLiveService';
import {
  TikTokLiveConfig,
  TikTokConnectionState,
  TikTokStatistics,
  TikTokNotificationConfig,
  TikTokEventType,
  TikTokUser,
  TikTokRoomInfo,
  TikTokGiftEvent,
  TikTokLikeEvent,
  TikTokFollowEvent,
  TikTokShareEvent,
  TikTokJoinEvent,
  TikTokComment,
  TikTokScheduledNotification,
  TikTokStreamSettings,
  TikTokEngagementConfig,
  TikTokStreamStatus,
} from '../types/tiktokLive';

// ============ Hook Return Type ============

interface UseTikTokLiveReturn {
  // State
  config: TikTokLiveConfig;
  connectionState: TikTokConnectionState;
  statistics: TikTokStatistics;
  currentUser: TikTokUser | null;
  roomInfo: TikTokRoomInfo | null;
  streamStatus: TikTokStreamStatus;

  // Connection
  connect: (uniqueId?: string, roomId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Configuration
  updateConfig: (updates: Partial<TikTokLiveConfig>) => void;
  resetConfig: () => void;

  // Stream Settings
  streamSettings: TikTokStreamSettings;
  updateStreamSettings: (updates: Partial<TikTokStreamSettings>) => void;

  // Engagement
  engagementConfig: TikTokEngagementConfig;
  updateEngagementConfig: (updates: Partial<TikTokEngagementConfig>) => void;
  sendComment: (text: string) => Promise<void>;
  thankGift: (giftEvent: TikTokGiftEvent) => Promise<void>;
  thankFollower: (followEvent: TikTokFollowEvent) => Promise<void>;
  welcomeViewer: (joinEvent: TikTokJoinEvent) => Promise<void>;

  // Notifications
  addNotification: (notification: TikTokNotificationConfig) => void;
  updateNotification: (id: string, updates: Partial<TikTokNotificationConfig>) => void;
  removeNotification: (id: string) => void;
  scheduleNotification: (type: TikTokEventType, message: string, scheduledFor: Date) => Promise<TikTokScheduledNotification>;
  cancelScheduledNotification: (id: string) => void;
  getScheduledNotifications: () => TikTokScheduledNotification[];

  // Gift Goals
  giftGoalProgress: { current: number; target: number; percentage: number };
  setGiftGoal: (target: number) => void;

  // Cleanup
  destroy: () => void;
}

// ============ Hook Implementation ============

export function useTikTokLive(): UseTikTokLiveReturn {
  const service = TikTokLiveService.getInstance();

  const [config, setConfig] = useState<TikTokLiveConfig>(service.getConfig());
  const [connectionState, setConnectionState] = useState<TikTokConnectionState>(service.getConnectionState());
  const [statistics, setStatistics] = useState<TikTokStatistics>(service.getStatistics());
  const [currentUser, setCurrentUser] = useState<TikTokUser | null>(service.getCurrentUser());
  const [roomInfo, setRoomInfo] = useState<TikTokRoomInfo | null>(service.getRoomInfo());
  const [streamStatus, setStreamStatus] = useState<TikTokStreamStatus>(service.getStreamStatus());
  const [giftGoalProgress, setGiftGoalProgress] = useState(service.getGiftGoalProgress());

  // ============ Event Listeners ============

  useEffect(() => {
    const handleConnectionStateChanged = (state: TikTokConnectionState) => {
      setConnectionState(state);
    };

    const handleStatisticsUpdated = (stats: TikTokStatistics) => {
      setStatistics(stats);
      setGiftGoalProgress(service.getGiftGoalProgress());
    };

    const handleConnected = (user: TikTokUser, room: TikTokRoomInfo) => {
      setCurrentUser(user);
      setRoomInfo(room);
      setStreamStatus(TikTokStreamStatus.LIVE);
    };

    const handleDisconnected = () => {
      setCurrentUser(null);
      setRoomInfo(null);
      setStreamStatus(TikTokStreamStatus.ENDED);
    };

    const handleViewerCountUpdated = (count: number) => {
      setRoomInfo((prev) => (prev ? { ...prev, viewerCount: count } : null));
    };

    service.on('connectionStateChanged', handleConnectionStateChanged);
    service.on('statisticsUpdated', handleStatisticsUpdated);
    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('viewerCountUpdated', handleViewerCountUpdated);

    return () => {
      service.off('connectionStateChanged', handleConnectionStateChanged);
      service.off('statisticsUpdated', handleStatisticsUpdated);
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('viewerCountUpdated', handleViewerCountUpdated);
    };
  }, [service]);

  // ============ Connection ============

  const connect = useCallback(
    async (uniqueId?: string, roomId?: string) => {
      await service.connect(uniqueId, roomId);
      setConfig(service.getConfig());
      setCurrentUser(service.getCurrentUser());
      setRoomInfo(service.getRoomInfo());
      setStreamStatus(service.getStreamStatus());
    },
    [service]
  );

  const disconnect = useCallback(async () => {
    await service.disconnect();
    setStreamStatus(TikTokStreamStatus.ENDED);
  }, [service]);

  const reconnect = useCallback(async () => {
    await service.reconnect();
  }, [service]);

  // ============ Configuration ============

  const updateConfig = useCallback(
    (updates: Partial<TikTokLiveConfig>) => {
      service.updateConfig(updates);
      setConfig(service.getConfig());
    },
    [service]
  );

  const resetConfig = useCallback(() => {
    service.resetConfig();
    setConfig(service.getConfig());
  }, [service]);

  // ============ Stream Settings ============

  const updateStreamSettings = useCallback(
    (updates: Partial<TikTokStreamSettings>) => {
      service.updateStreamSettings(updates);
      setConfig(service.getConfig());
    },
    [service]
  );

  // ============ Engagement ============

  const updateEngagementConfig = useCallback(
    (updates: Partial<TikTokEngagementConfig>) => {
      service.updateEngagementConfig(updates);
      setConfig(service.getConfig());
    },
    [service]
  );

  const sendComment = useCallback(
    async (text: string) => {
      await service.sendComment(text);
    },
    [service]
  );

  const thankGift = useCallback(
    async (giftEvent: TikTokGiftEvent) => {
      await service.thankGift(giftEvent);
    },
    [service]
  );

  const thankFollower = useCallback(
    async (followEvent: TikTokFollowEvent) => {
      await service.thankFollower(followEvent);
    },
    [service]
  );

  const welcomeViewer = useCallback(
    async (joinEvent: TikTokJoinEvent) => {
      await service.welcomeViewer(joinEvent);
    },
    [service]
  );

  // ============ Notifications ============

  const addNotification = useCallback(
    (notification: TikTokNotificationConfig) => {
      service.addNotification(notification);
      setConfig(service.getConfig());
    },
    [service]
  );

  const updateNotification = useCallback(
    (id: string, updates: Partial<TikTokNotificationConfig>) => {
      service.updateNotification(id, updates);
      setConfig(service.getConfig());
    },
    [service]
  );

  const removeNotification = useCallback((id: string) => {
    service.removeNotification(id);
    setConfig(service.getConfig());
  }, [service]);

  const scheduleNotification = useCallback(
    async (type: TikTokEventType, message: string, scheduledFor: Date) => {
      return service.scheduleNotification(type, message, scheduledFor);
    },
    [service]
  );

  const cancelScheduledNotification = useCallback((id: string) => {
    service.cancelScheduledNotification(id);
  }, [service]);

  const getScheduledNotifications = useCallback(() => {
    return service.getScheduledNotifications();
  }, [service]);

  // ============ Gift Goals ============

  const setGiftGoal = useCallback(
    (target: number) => {
      service.setGiftGoal(target);
      setGiftGoalProgress(service.getGiftGoalProgress());
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
    roomInfo,
    streamStatus,

    connect,
    disconnect,
    reconnect,

    updateConfig,
    resetConfig,

    streamSettings: config.streamSettings,
    updateStreamSettings,

    engagementConfig: config.engagement,
    updateEngagementConfig,
    sendComment,
    thankGift,
    thankFollower,
    welcomeViewer,

    addNotification,
    updateNotification,
    removeNotification,
    scheduleNotification,
    cancelScheduledNotification,
    getScheduledNotifications,

    giftGoalProgress,
    setGiftGoal,

    destroy,
  };
}

export default useTikTokLive;