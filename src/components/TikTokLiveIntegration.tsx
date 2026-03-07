import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTikTokLive } from '../hooks/useTikTokLive';
import {
  TikTokConnectionStatus,
  TikTokEventType,
  TikTokNotificationConfig,
  TikTokGiftEvent,
  TikTokFollowEvent,
  TikTokJoinEvent,
} from '../types/tiktokLive';
import './TikTokLiveIntegration.css';

type TabType = 'connection' | 'live' | 'engagement' | 'notifications' | 'settings';

interface TikTokLiveIntegrationProps {
  onClose?: () => void;
}

const EVENT_TYPES = [
  { value: TikTokEventType.GIFT, label: 'Gift' },
  { value: TikTokEventType.FOLLOW, label: 'Follow' },
  { value: TikTokEventType.LIKE, label: 'Like' },
  { value: TikTokEventType.SHARE, label: 'Share' },
  { value: TikTokEventType.COMMENT, label: 'Comment' },
  { value: TikTokEventType.JOIN, label: 'Join' },
];

export const TikTokLiveIntegration: React.FC<TikTokLiveIntegrationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    connectionState,
    statistics,
    currentUser,
    roomInfo,
    streamStatus,
    connect,
    disconnect,
    updateConfig,
    streamSettings,
    updateStreamSettings,
    engagementConfig,
    updateEngagementConfig,
    addNotification,
    updateNotification,
    removeNotification,
    giftGoalProgress,
    setGiftGoal,
  } = useTikTokLive();

  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [loading, setLoading] = useState(false);

  // Form states
  const [uniqueId, setUniqueId] = useState(config.uniqueId);
  const [roomId, setRoomId] = useState(config.roomId);
  const [username, setUsername] = useState(config.username);

  // Gift goal form
  const [giftGoalInput, setGiftGoalInput] = useState(streamSettings.giftGoalTarget.toString());

  // Live feed
  const [recentEvents, setRecentEvents] = useState<Array<{ type: string; data: unknown; time: Date }>>([]);

  // Notification form
  const [newNotification, setNewNotification] = useState<Partial<TikTokNotificationConfig>>({
    enabled: true,
    type: TikTokEventType.GIFT,
    template: 'Thank you {username} for the {giftName}!',
    includeMedia: false,
    cooldown: 30,
  });

  // Update gift goal input when stream settings change
  useEffect(() => {
    setGiftGoalInput(streamSettings.giftGoalTarget.toString());
  }, [streamSettings.giftGoalTarget]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      updateConfig({ uniqueId, roomId, username });
      await connect(uniqueId, roomId);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleSetGiftGoal = () => {
    const target = parseInt(giftGoalInput, 10);
    if (!isNaN(target) && target >= 0) {
      setGiftGoal(target);
    }
  };

  const handleAddNotification = () => {
    if (!newNotification.type || !newNotification.template) return;

    addNotification({
      id: `notif-${Date.now()}`,
      enabled: true,
      type: newNotification.type,
      template: newNotification.template,
      includeMedia: newNotification.includeMedia || false,
      cooldown: newNotification.cooldown || 0,
    });

    setNewNotification({
      enabled: true,
      type: TikTokEventType.GIFT,
      template: 'Thank you {username} for the {giftName}!',
      includeMedia: false,
      cooldown: 30,
    });
  };

  const getConnectionStatusClass = () => {
    switch (connectionState.status) {
      case TikTokConnectionStatus.CONNECTED:
        return 'status-connected';
      case TikTokConnectionStatus.CONNECTING:
      case TikTokConnectionStatus.RECONNECTING:
        return 'status-connecting';
      case TikTokConnectionStatus.ERROR:
        return 'status-error';
      default:
        return 'status-disconnected';
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // ============ Render Tabs ============

  const renderTabs = () => (
    <div className="tiktok-tabs">
      <button
        className={`tiktok-tab ${activeTab === 'connection' ? 'active' : ''}`}
        onClick={() => setActiveTab('connection')}
      >
        🔗 {t('tiktok.tabs.connection', 'Connection')}
      </button>
      <button
        className={`tiktok-tab ${activeTab === 'live' ? 'active' : ''}`}
        onClick={() => setActiveTab('live')}
        disabled={connectionState.status !== TikTokConnectionStatus.CONNECTED}
      >
        📹 {t('tiktok.tabs.live', 'Live')}
      </button>
      <button
        className={`tiktok-tab ${activeTab === 'engagement' ? 'active' : ''}`}
        onClick={() => setActiveTab('engagement')}
        disabled={connectionState.status !== TikTokConnectionStatus.CONNECTED}
      >
        💬 {t('tiktok.tabs.engagement', 'Engagement')}
      </button>
      <button
        className={`tiktok-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
        disabled={connectionState.status !== TikTokConnectionStatus.CONNECTED}
      >
        🔔 {t('tiktok.tabs.notifications', 'Notifications')}
      </button>
      <button
        className={`tiktok-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        ⚙️ {t('tiktok.tabs.settings', 'Settings')}
      </button>
    </div>
  );

  // ============ Render Connection Tab ============

  const renderConnectionTab = () => (
    <div className="tiktok-tab-content">
      <div className="tiktok-card">
        <h3>{t('tiktok.connection.title', 'Connect to TikTok Live')}</h3>

        <div className="tiktok-form-group">
          <label>{t('tiktok.connection.uniqueId', 'TikTok Username (uniqueId)')}</label>
          <input
            type="text"
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
            placeholder={t('tiktok.connection.uniqueIdPlaceholder', 'Enter TikTok username without @')}
            disabled={connectionState.status === TikTokConnectionStatus.CONNECTED}
          />
        </div>

        <div className="tiktok-form-group">
          <label>{t('tiktok.connection.roomId', 'Room ID (optional)')}</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder={t('tiktok.connection.roomIdPlaceholder', 'Leave empty to auto-detect')}
            disabled={connectionState.status === TikTokConnectionStatus.CONNECTED}
          />
        </div>

        <div className="tiktok-form-group">
          <label>{t('tiktok.connection.displayName', 'Display Name')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('tiktok.connection.displayNamePlaceholder', 'Your display name')}
            disabled={connectionState.status === TikTokConnectionStatus.CONNECTED}
          />
        </div>

        <div className="tiktok-connection-status">
          <div className={`status-indicator ${getConnectionStatusClass()}`}></div>
          <span>
            {t(`tiktok.status.${connectionState.status}`, connectionState.status)}
            {connectionState.username && ` - @${connectionState.username}`}
          </span>
        </div>

        {connectionState.error && (
          <div className="tiktok-error-message">
            {connectionState.error}
          </div>
        )}

        <div className="tiktok-button-group">
          {connectionState.status !== TikTokConnectionStatus.CONNECTED ? (
            <button
              className="tiktok-btn tiktok-btn-primary"
              onClick={handleConnect}
              disabled={loading || !uniqueId}
            >
              {loading ? t('tiktok.connection.connecting', 'Connecting...') : t('tiktok.connection.connect', 'Connect')}
            </button>
          ) : (
            <button
              className="tiktok-btn tiktok-btn-danger"
              onClick={handleDisconnect}
            >
              {t('tiktok.connection.disconnect', 'Disconnect')}
            </button>
          )}
        </div>
      </div>

      {connectionState.status === TikTokConnectionStatus.CONNECTED && (
        <div className="tiktok-card">
          <h3>{t('tiktok.statistics.title', 'Live Statistics')}</h3>
          <div className="tiktok-stats-grid">
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(roomInfo?.viewerCount || 0)}</span>
              <span className="stat-label">{t('tiktok.statistics.viewers', 'Viewers')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.peakViewers)}</span>
              <span className="stat-label">{t('tiktok.statistics.peakViewers', 'Peak')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.totalLikes)}</span>
              <span className="stat-label">{t('tiktok.statistics.likes', 'Likes')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.totalDiamonds)}</span>
              <span className="stat-label">{t('tiktok.statistics.diamonds', 'Diamonds')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.totalGifts)}</span>
              <span className="stat-label">{t('tiktok.statistics.gifts', 'Gifts')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.newFollowers)}</span>
              <span className="stat-label">{t('tiktok.statistics.newFollowers', 'New Followers')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatNumber(statistics.totalComments)}</span>
              <span className="stat-label">{t('tiktok.statistics.comments', 'Comments')}</span>
            </div>
            <div className="tiktok-stat">
              <span className="stat-value">{formatDuration(statistics.streamDuration)}</span>
              <span className="stat-label">{t('tiktok.statistics.duration', 'Duration')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============ Render Live Tab ============

  const renderLiveTab = () => (
    <div className="tiktok-tab-content">
      <div className="tiktok-card">
        <h3>{t('tiktok.live.giftGoal', 'Gift Goal')}</h3>
        
        <div className="gift-goal-progress">
          <div className="gift-goal-bar">
            <div 
              className="gift-goal-fill" 
              style={{ width: `${Math.min(100, giftGoalProgress.percentage)}%` }}
            ></div>
          </div>
          <div className="gift-goal-stats">
            <span className="gift-goal-current">
              {formatNumber(giftGoalProgress.current)} 💎
            </span>
            <span className="gift-goal-target">
              / {formatNumber(giftGoalProgress.target)} 💎
            </span>
          </div>
        </div>

        <div className="tiktok-form-row">
          <div className="tiktok-form-group">
            <label>{t('tiktok.live.setGoal', 'Set Goal (diamonds)')}</label>
            <input
              type="number"
              value={giftGoalInput}
              onChange={(e) => setGiftGoalInput(e.target.value)}
              placeholder="10000"
              min="0"
            />
          </div>
          <div className="tiktok-form-group">
            <label>&nbsp;</label>
            <button
              className="tiktok-btn tiktok-btn-primary"
              onClick={handleSetGiftGoal}
            >
              {t('tiktok.live.updateGoal', 'Update Goal')}
            </button>
          </div>
        </div>

        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={streamSettings.giftGoalEnabled}
              onChange={(e) => updateStreamSettings({ giftGoalEnabled: e.target.checked })}
            />
            {t('tiktok.live.enableGiftGoal', 'Enable Gift Goal Display')}
          </label>
        </div>
      </div>

      <div className="tiktok-card">
        <h3>{t('tiktok.live.streamInfo', 'Stream Info')}</h3>
        
        {roomInfo && (
          <div className="stream-info">
            <div className="stream-info-row">
              <span className="stream-info-label">{t('tiktok.live.roomId', 'Room ID')}:</span>
              <span className="stream-info-value">{roomInfo.roomId}</span>
            </div>
            <div className="stream-info-row">
              <span className="stream-info-label">{t('tiktok.live.title', 'Title')}:</span>
              <span className="stream-info-value">{roomInfo.title}</span>
            </div>
            <div className="stream-info-row">
              <span className="stream-info-label">{t('tiktok.live.viewers', 'Viewers')}:</span>
              <span className="stream-info-value">{roomInfo.viewerCount}</span>
            </div>
            <div className="stream-info-row">
              <span className="stream-info-label">{t('tiktok.live.likes', 'Likes')}:</span>
              <span className="stream-info-value">{formatNumber(roomInfo.likeCount)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="tiktok-card">
        <h3>{t('tiktok.live.displaySettings', 'Display Settings')}</h3>
        
        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={streamSettings.showViewerCount}
              onChange={(e) => updateStreamSettings({ showViewerCount: e.target.checked })}
            />
            {t('tiktok.live.showViewerCount', 'Show Viewer Count')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={streamSettings.showGiftNotifications}
              onChange={(e) => updateStreamSettings({ showGiftNotifications: e.target.checked })}
            />
            {t('tiktok.live.showGiftNotifications', 'Show Gift Notifications')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={streamSettings.showFollowerNotifications}
              onChange={(e) => updateStreamSettings({ showFollowerNotifications: e.target.checked })}
            />
            {t('tiktok.live.showFollowerNotifications', 'Show Follower Notifications')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={streamSettings.chatDisplayEnabled}
              onChange={(e) => updateStreamSettings({ chatDisplayEnabled: e.target.checked })}
            />
            {t('tiktok.live.enableChatDisplay', 'Enable Chat Display')}
          </label>
        </div>
      </div>
    </div>
  );

  // ============ Render Engagement Tab ============

  const renderEngagementTab = () => (
    <div className="tiktok-tab-content">
      <div className="tiktok-card">
        <h3>{t('tiktok.engagement.title', 'Auto-Engagement Settings')}</h3>

        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={engagementConfig.autoReplyEnabled}
              onChange={(e) => updateEngagementConfig({ autoReplyEnabled: e.target.checked })}
            />
            {t('tiktok.engagement.autoReply', 'Enable Auto-Reply')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={engagementConfig.thankFollowers}
              onChange={(e) => updateEngagementConfig({ thankFollowers: e.target.checked })}
            />
            {t('tiktok.engagement.thankFollowers', 'Thank New Followers')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={engagementConfig.thankGifters}
              onChange={(e) => updateEngagementConfig({ thankGifters: e.target.checked })}
            />
            {t('tiktok.engagement.thankGifters', 'Thank Gifters')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={engagementConfig.welcomeViewers}
              onChange={(e) => updateEngagementConfig({ welcomeViewers: e.target.checked })}
            />
            {t('tiktok.engagement.welcomeViewers', 'Welcome New Viewers')}
          </label>
        </div>
      </div>

      <div className="tiktok-card">
        <h3>{t('tiktok.engagement.templates', 'Response Templates')}</h3>

        {engagementConfig.autoReplyEnabled && (
          <div className="tiktok-form-group">
            <label>{t('tiktok.engagement.autoReplyTemplate', 'Auto-Reply Template')}</label>
            <textarea
              value={engagementConfig.autoReplyTemplate}
              onChange={(e) => updateEngagementConfig({ autoReplyTemplate: e.target.value })}
              rows={2}
              placeholder="Thanks for watching!"
            />
          </div>
        )}

        {engagementConfig.thankFollowers && (
          <div className="tiktok-form-group">
            <label>{t('tiktok.engagement.thankTemplate', 'Thank Follower Template')}</label>
            <textarea
              value={engagementConfig.thankTemplate}
              onChange={(e) => updateEngagementConfig({ thankTemplate: e.target.value })}
              rows={2}
              placeholder="Thanks for following {username}!"
            />
            <span className="tiktok-hint">Use {`{username}`} for the follower's name</span>
          </div>
        )}

        {engagementConfig.thankGifters && (
          <div className="tiktok-form-group">
            <label>{t('tiktok.engagement.giftThankTemplate', 'Thank Gifter Template')}</label>
            <textarea
              value={engagementConfig.giftThankTemplate}
              onChange={(e) => updateEngagementConfig({ giftThankTemplate: e.target.value })}
              rows={2}
              placeholder="Thank you {username} for the {giftName}!"
            />
            <span className="tiktok-hint">Use {`{username}`} and {`{giftName}`} placeholders</span>
          </div>
        )}

        {engagementConfig.welcomeViewers && (
          <div className="tiktok-form-group">
            <label>{t('tiktok.engagement.welcomeTemplate', 'Welcome Template')}</label>
            <textarea
              value={engagementConfig.welcomeTemplate}
              onChange={(e) => updateEngagementConfig({ welcomeTemplate: e.target.value })}
              rows={2}
              placeholder="Welcome {username}!"
            />
            <span className="tiktok-hint">Use {`{username}`} for the viewer's name</span>
          </div>
        )}
      </div>
    </div>
  );

  // ============ Render Notifications Tab ============

  const renderNotificationsTab = () => (
    <div className="tiktok-tab-content">
      <div className="tiktok-card">
        <h3>{t('tiktok.notifications.addTitle', 'Add Notification')}</h3>

        <div className="tiktok-form-row">
          <div className="tiktok-form-group">
            <label>{t('tiktok.notifications.type', 'Event Type')}</label>
            <select
              value={newNotification.type}
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as TikTokEventType })}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="tiktok-form-group">
            <label>{t('tiktok.notifications.cooldown', 'Cooldown (seconds)')}</label>
            <input
              type="number"
              value={newNotification.cooldown || 0}
              onChange={(e) => setNewNotification({ ...newNotification, cooldown: parseInt(e.target.value) || 0 })}
              min={0}
              max={3600}
            />
          </div>
        </div>

        <div className="tiktok-form-group">
          <label>{t('tiktok.notifications.template', 'Message Template')}</label>
          <textarea
            value={newNotification.template}
            onChange={(e) => setNewNotification({ ...newNotification, template: e.target.value })}
            placeholder={t('tiktok.notifications.templatePlaceholder', 'Enter message template with {placeholders}')}
            rows={3}
          />
        </div>

        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={newNotification.includeMedia}
              onChange={(e) => setNewNotification({ ...newNotification, includeMedia: e.target.checked })}
            />
            {t('tiktok.notifications.includeMedia', 'Include Media')}
          </label>
        </div>

        <button className="tiktok-btn tiktok-btn-primary" onClick={handleAddNotification}>
          {t('tiktok.notifications.addButton', 'Add Notification')}
        </button>
      </div>

      <div className="tiktok-card">
        <h3>{t('tiktok.notifications.listTitle', 'Active Notifications')}</h3>
        {config.notifications.length === 0 ? (
          <p className="tiktok-empty-message">{t('tiktok.notifications.noNotifications', 'No notifications configured')}</p>
        ) : (
          <div className="tiktok-list">
            {config.notifications.map((notification) => (
              <div key={notification.id} className="tiktok-list-item">
                <div className="list-item-header">
                  <span className="list-item-title">
                    {EVENT_TYPES.find((t) => t.value === notification.type)?.label || notification.type}
                  </span>
                  <div className="list-item-actions">
                    <button
                      className="tiktok-btn-icon tiktok-btn-toggle"
                      onClick={() => updateNotification(notification.id, { enabled: !notification.enabled })}
                      title={notification.enabled ? 'Disable' : 'Enable'}
                    >
                      {notification.enabled ? '✓' : '✗'}
                    </button>
                    <button
                      className="tiktok-btn-icon tiktok-btn-delete"
                      onClick={() => removeNotification(notification.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="list-item-details">
                  <span>{notification.template.substring(0, 50)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============ Render Settings Tab ============

  const renderSettingsTab = () => (
    <div className="tiktok-tab-content">
      <div className="tiktok-card">
        <h3>{t('tiktok.settings.connection', 'Connection Settings')}</h3>

        <div className="tiktok-form-row">
          <div className="tiktok-form-group">
            <label>{t('tiktok.settings.reconnectInterval', 'Reconnect Interval (ms)')}</label>
            <input
              type="number"
              value={config.reconnectInterval}
              onChange={(e) => updateConfig({ reconnectInterval: parseInt(e.target.value) || 5000 })}
              min={1000}
              max={60000}
            />
          </div>

          <div className="tiktok-form-group">
            <label>{t('tiktok.settings.maxReconnectAttempts', 'Max Reconnect Attempts')}</label>
            <input
              type="number"
              value={config.maxReconnectAttempts}
              onChange={(e) => updateConfig({ maxReconnectAttempts: parseInt(e.target.value) || 5 })}
              min={1}
              max={20}
            />
          </div>
        </div>

        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.autoConnect}
              onChange={(e) => updateConfig({ autoConnect: e.target.checked })}
            />
            {t('tiktok.settings.autoConnect', 'Auto-connect on startup')}
          </label>
        </div>
      </div>

      <div className="tiktok-card">
        <h3>{t('tiktok.settings.streamAnnouncements', 'Stream Announcements')}</h3>

        <div className="tiktok-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={streamSettings.autoAnnounceStreamStart}
              onChange={(e) => updateStreamSettings({ autoAnnounceStreamStart: e.target.checked })}
            />
            {t('tiktok.settings.announceStart', 'Announce Stream Start')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={streamSettings.autoAnnounceStreamEnd}
              onChange={(e) => updateStreamSettings({ autoAnnounceStreamEnd: e.target.checked })}
            />
            {t('tiktok.settings.announceEnd', 'Announce Stream End')}
          </label>
        </div>

        <div className="tiktok-form-group">
          <label>{t('tiktok.settings.announcementTemplate', 'Announcement Template')}</label>
          <textarea
            value={streamSettings.announcementTemplate}
            onChange={(e) => updateStreamSettings({ announcementTemplate: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="tiktok-card">
        <div className="tiktok-danger-zone">
          <h4>{t('tiktok.settings.dangerZone', 'Danger Zone')}</h4>
          <button
            className="tiktok-btn tiktok-btn-danger"
            onClick={() => {
              if (window.confirm(t('tiktok.settings.resetConfirm', 'Are you sure you want to reset all settings?'))) {
                updateConfig({ notifications: [] });
              }
            }}
          >
            {t('tiktok.settings.resetAll', 'Reset All Notifications')}
          </button>
        </div>
      </div>
    </div>
  );

  // ============ Main Render ============

  return (
    <div className="tiktok-integration">
      <div className="tiktok-header">
        <h2>🎵 {t('tiktok.title', 'TikTok Live Integration')}</h2>
        <p>{t('tiktok.description', 'Connect to TikTok Live to engage with your audience, track gifts, and manage interactions.')}</p>
        {onClose && (
          <button className="tiktok-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      {renderTabs()}

      <div className="tiktok-content">
        {activeTab === 'connection' && renderConnectionTab()}
        {activeTab === 'live' && renderLiveTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default TikTokLiveIntegration;