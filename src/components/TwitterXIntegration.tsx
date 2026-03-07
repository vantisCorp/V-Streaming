import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTwitterX } from '../hooks/useTwitterX';
import {
  TwitterConnectionStatus,
  TwitterNotificationType,
  TwitterNotificationConfig,
  TwitterScheduledTweet,
  DEFAULT_TWITTER_NOTIFICATION,
} from '../types/twitterX';
import './TwitterXIntegration.css';

type TabType = 'connection' | 'tweets' | 'notifications' | 'engagement' | 'settings';

interface TwitterXIntegrationProps {
  onClose?: () => void;
}

const NOTIFICATION_TYPES = [
  { value: TwitterNotificationType.STREAM_START, label: 'Stream Start' },
  { value: TwitterNotificationType.STREAM_END, label: 'Stream End' },
  { value: TwitterNotificationType.NEW_FOLLOWER, label: 'New Follower' },
  { value: TwitterNotificationType.NEW_SUBSCRIBER, label: 'New Subscriber' },
  { value: TwitterNotificationType.MENTION, label: 'Mention' },
  { value: TwitterNotificationType.QUOTE_TWEET, label: 'Quote Tweet' },
  { value: TwitterNotificationType.RETWEET, label: 'Retweet' },
  { value: TwitterNotificationType.LIKE_MILESTONE, label: 'Like Milestone' },
  { value: TwitterNotificationType.CUSTOM, label: 'Custom' },
];

const MAX_TWEET_LENGTH = 280;

export const TwitterXIntegration: React.FC<TwitterXIntegrationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    connectionState,
    statistics,
    currentUser,
    connect,
    disconnect,
    updateConfig,
    sendTweet,
    scheduleTweet,
    cancelScheduledTweet,
    getScheduledTweets,
    addNotification,
    updateNotification,
    removeNotification,
    likeTweet,
    retweet,
    updateEngagementConfig,
    updateStreamSettings,
    getMentions,
  } = useTwitterX();

  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [loading, setLoading] = useState(false);
  const [scheduledTweets, setScheduledTweets] = useState<TwitterScheduledTweet[]>([]);

  // Form states
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [apiSecret, setApiSecret] = useState(config.apiSecret);
  const [bearerToken, setBearerToken] = useState(config.bearerToken);
  const [accessToken, setAccessToken] = useState(config.accessToken);
  const [accessTokenSecret, setAccessTokenSecret] = useState(config.accessTokenSecret);
  const [username, setUsername] = useState(config.username);

  // Tweet form
  const [tweetText, setTweetText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Load scheduled tweets
  useEffect(() => {
    setScheduledTweets(getScheduledTweets());
  }, [getScheduledTweets]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      updateConfig({ apiKey, apiSecret, bearerToken, accessToken, accessTokenSecret, username });
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleSendTweet = async () => {
    if (!tweetText.trim()) return;

    setLoading(true);
    try {
      if (scheduleDate && scheduleTime) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
        await scheduleTweet(tweetText, scheduledAt);
      } else {
        await sendTweet(tweetText);
      }
      setTweetText('');
      setScheduleDate('');
      setScheduleTime('');
      setScheduledTweets(getScheduledTweets());
    } catch (error) {
      console.error('Failed to send/schedule tweet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScheduledTweet = (id: string) => {
    cancelScheduledTweet(id);
    setScheduledTweets(getScheduledTweets());
  };

  const getConnectionStatusClass = () => {
    switch (connectionState.status) {
      case TwitterConnectionStatus.CONNECTED:
        return 'status-connected';
      case TwitterConnectionStatus.CONNECTING:
      case TwitterConnectionStatus.RECONNECTING:
        return 'status-connecting';
      case TwitterConnectionStatus.ERROR:
        return 'status-error';
      default:
        return 'status-disconnected';
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCharacterCountClass = () => {
    const remaining = MAX_TWEET_LENGTH - tweetText.length;
    if (remaining < 0) return 'error';
    if (remaining <= 20) return 'warning';
    return '';
  };

  // ============ Notification Management ============

  const [newNotification, setNewNotification] = useState<Partial<TwitterNotificationConfig>>({
    ...DEFAULT_TWITTER_NOTIFICATION,
    type: TwitterNotificationType.STREAM_START,
    template: '🔴 LIVE NOW! {title} - {link}',
  });

  const handleAddNotification = () => {
    if (!newNotification.type || !newNotification.template) return;

    addNotification({
      id: `notif-${Date.now()}`,
      ...DEFAULT_TWITTER_NOTIFICATION,
      ...newNotification,
    } as TwitterNotificationConfig);

    setNewNotification({
      ...DEFAULT_TWITTER_NOTIFICATION,
      type: TwitterNotificationType.STREAM_START,
      template: '🔴 LIVE NOW! {title} - {link}',
    });
  };

  // ============ Render Tabs ============

  const renderTabs = () => (
    <div className="twitter-tabs">
      <button
        className={`twitter-tab ${activeTab === 'connection' ? 'active' : ''}`}
        onClick={() => setActiveTab('connection')}
      >
        🔗 {t('twitter.tabs.connection', 'Connection')}
      </button>
      <button
        className={`twitter-tab ${activeTab === 'tweets' ? 'active' : ''}`}
        onClick={() => setActiveTab('tweets')}
        disabled={connectionState.status !== TwitterConnectionStatus.CONNECTED}
      >
        📝 {t('twitter.tabs.tweets', 'Tweets')}
      </button>
      <button
        className={`twitter-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
        disabled={connectionState.status !== TwitterConnectionStatus.CONNECTED}
      >
        🔔 {t('twitter.tabs.notifications', 'Notifications')}
      </button>
      <button
        className={`twitter-tab ${activeTab === 'engagement' ? 'active' : ''}`}
        onClick={() => setActiveTab('engagement')}
        disabled={connectionState.status !== TwitterConnectionStatus.CONNECTED}
      >
        💬 {t('twitter.tabs.engagement', 'Engagement')}
      </button>
      <button
        className={`twitter-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        ⚙️ {t('twitter.tabs.settings', 'Settings')}
      </button>
    </div>
  );

  // ============ Render Connection Tab ============

  const renderConnectionTab = () => (
    <div className="twitter-tab-content">
      <div className="twitter-card">
        <h3>{t('twitter.connection.title', 'API Credentials')}</h3>

        <div className="twitter-form-group">
          <label>{t('twitter.connection.apiKey', 'API Key')}</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('twitter.connection.apiKeyPlaceholder', 'Enter your Twitter API key')}
            disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
          />
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.connection.apiSecret', 'API Secret')}</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder={t('twitter.connection.apiSecretPlaceholder', 'Enter your Twitter API secret')}
            disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
          />
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.connection.bearerToken', 'Bearer Token')}</label>
          <input
            type="password"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder={t('twitter.connection.bearerTokenPlaceholder', 'Enter your Twitter bearer token')}
            disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
          />
        </div>

        <div className="twitter-form-row">
          <div className="twitter-form-group">
            <label>{t('twitter.connection.accessToken', 'Access Token')}</label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={t('twitter.connection.accessTokenPlaceholder', 'Access token')}
              disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
            />
          </div>

          <div className="twitter-form-group">
            <label>{t('twitter.connection.accessTokenSecret', 'Access Token Secret')}</label>
            <input
              type="password"
              value={accessTokenSecret}
              onChange={(e) => setAccessTokenSecret(e.target.value)}
              placeholder={t('twitter.connection.accessTokenSecretPlaceholder', 'Access token secret')}
              disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
            />
          </div>
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.connection.username', 'Username')}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('twitter.connection.usernamePlaceholder', 'Your Twitter username')}
            disabled={connectionState.status === TwitterConnectionStatus.CONNECTED}
          />
        </div>

        <div className="twitter-connection-status">
          <div className={`status-indicator ${getConnectionStatusClass()}`}></div>
          <span>
            {t(`twitter.status.${connectionState.status}`, connectionState.status)}
            {connectionState.username && ` - @${connectionState.username}`}
          </span>
        </div>

        {connectionState.error && (
          <div className="twitter-error-message">
            {connectionState.error}
          </div>
        )}

        <div className="twitter-button-group">
          {connectionState.status !== TwitterConnectionStatus.CONNECTED ? (
            <button
              className="twitter-btn twitter-btn-primary"
              onClick={handleConnect}
              disabled={loading || !apiKey || !apiSecret}
            >
              {loading ? t('twitter.connection.connecting', 'Connecting...') : t('twitter.connection.connect', 'Connect')}
            </button>
          ) : (
            <button
              className="twitter-btn twitter-btn-danger"
              onClick={handleDisconnect}
            >
              {t('twitter.connection.disconnect', 'Disconnect')}
            </button>
          )}
        </div>
      </div>

      {connectionState.status === TwitterConnectionStatus.CONNECTED && (
        <div className="twitter-card">
          <h3>{t('twitter.statistics.title', 'Statistics')}</h3>
          <div className="twitter-stats-grid">
            <div className="twitter-stat">
              <span className="stat-value">{formatNumber(statistics.tweetsSent)}</span>
              <span className="stat-label">{t('twitter.statistics.tweetsSent', 'Tweets Sent')}</span>
            </div>
            <div className="twitter-stat">
              <span className="stat-value">{formatNumber(statistics.likesReceived)}</span>
              <span className="stat-label">{t('twitter.statistics.likes', 'Likes')}</span>
            </div>
            <div className="twitter-stat">
              <span className="stat-value">{formatNumber(statistics.retweetsReceived)}</span>
              <span className="stat-label">{t('twitter.statistics.retweets', 'Retweets')}</span>
            </div>
            <div className="twitter-stat">
              <span className="stat-value">{formatNumber(statistics.newFollowers)}</span>
              <span className="stat-label">{t('twitter.statistics.newFollowers', 'New Followers')}</span>
            </div>
            <div className="twitter-stat">
              <span className="stat-value">{formatNumber(statistics.mentions)}</span>
              <span className="stat-label">{t('twitter.statistics.mentions', 'Mentions')}</span>
            </div>
            <div className="twitter-stat">
              <span className="stat-value">{formatUptime(statistics.uptime)}</span>
              <span className="stat-label">{t('twitter.statistics.uptime', 'Uptime')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============ Render Tweets Tab ============

  const renderTweetsTab = () => (
    <div className="twitter-tab-content">
      <div className="twitter-card">
        <h3>{t('twitter.tweets.compose', 'Compose Tweet')}</h3>

        <div className="twitter-form-group">
          <textarea
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            placeholder={t('twitter.tweets.placeholder', "What's happening?")}
            rows={4}
            maxLength={MAX_TWEET_LENGTH * 2}
          />
          <div className={`twitter-char-counter ${getCharacterCountClass()}`}>
            {MAX_TWEET_LENGTH - tweetText.length}
          </div>
        </div>

        <div className="twitter-form-row">
          <div className="twitter-form-group">
            <label>{t('twitter.tweets.scheduleDate', 'Schedule Date (optional)')}</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="twitter-form-group">
            <label>{t('twitter.tweets.scheduleTime', 'Schedule Time (optional)')}</label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>
        </div>

        <button
          className="twitter-btn twitter-btn-primary"
          onClick={handleSendTweet}
          disabled={loading || !tweetText.trim() || tweetText.length > MAX_TWEET_LENGTH}
        >
          {scheduleDate && scheduleTime
            ? t('twitter.tweets.schedule', 'Schedule Tweet')
            : t('twitter.tweets.send', 'Send Tweet')}
        </button>
      </div>

      {scheduledTweets.length > 0 && (
        <div className="twitter-card">
          <h3>{t('twitter.tweets.scheduled', 'Scheduled Tweets')}</h3>
          <div className="twitter-list">
            {scheduledTweets.map((tweet) => (
              <div key={tweet.id} className="twitter-list-item scheduled-tweet-item">
                <div className="list-item-header">
                  <span className="list-item-title">Scheduled Tweet</span>
                  <div className="list-item-actions">
                    <span className="scheduled-tweet-status pending">Pending</span>
                    <button
                      className="twitter-btn-icon twitter-btn-delete"
                      onClick={() => handleCancelScheduledTweet(tweet.id)}
                      title="Cancel"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="list-item-details">
                  <span>{tweet.text.substring(0, 100)}{tweet.text.length > 100 ? '...' : ''}</span>
                  <span className="scheduled-tweet-time">
                    {t('twitter.tweets.scheduledFor', 'Scheduled for')}: {tweet.scheduledAt.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ============ Render Notifications Tab ============

  const renderNotificationsTab = () => (
    <div className="twitter-tab-content">
      <div className="twitter-card">
        <h3>{t('twitter.notifications.addTitle', 'Add Notification')}</h3>

        <div className="twitter-form-row">
          <div className="twitter-form-group">
            <label>{t('twitter.notifications.type', 'Type')}</label>
            <select
              value={newNotification.type}
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as TwitterNotificationType })}
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="twitter-form-group">
            <label>{t('twitter.notifications.cooldown', 'Cooldown (seconds)')}</label>
            <input
              type="number"
              value={newNotification.cooldown || 0}
              onChange={(e) => setNewNotification({ ...newNotification, cooldown: parseInt(e.target.value) || 0 })}
              min={0}
              max={3600}
            />
          </div>
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.notifications.template', 'Tweet Template')}</label>
          <textarea
            value={newNotification.template}
            onChange={(e) => setNewNotification({ ...newNotification, template: e.target.value })}
            placeholder={t('twitter.notifications.templatePlaceholder', 'Enter tweet template with {placeholders}')}
            rows={3}
          />
        </div>

        <div className="twitter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={newNotification.includeMedia}
              onChange={(e) => setNewNotification({ ...newNotification, includeMedia: e.target.checked })}
            />
            {t('twitter.notifications.includeMedia', 'Include Media')}
          </label>
        </div>

        <button className="twitter-btn twitter-btn-primary" onClick={handleAddNotification}>
          {t('twitter.notifications.addButton', 'Add Notification')}
        </button>
      </div>

      <div className="twitter-card">
        <h3>{t('twitter.notifications.listTitle', 'Active Notifications')}</h3>
        {config.notifications.length === 0 ? (
          <p className="twitter-empty-message">{t('twitter.notifications.noNotifications', 'No notifications configured')}</p>
        ) : (
          <div className="twitter-list">
            {config.notifications.map((notification) => (
              <div key={notification.id} className="twitter-list-item">
                <div className="list-item-header">
                  <span className="list-item-title">
                    {NOTIFICATION_TYPES.find((t) => t.value === notification.type)?.label || notification.type}
                  </span>
                  <div className="list-item-actions">
                    <button
                      className="twitter-btn-icon twitter-btn-toggle"
                      onClick={() => updateNotification(notification.id, { enabled: !notification.enabled })}
                      title={notification.enabled ? 'Disable' : 'Enable'}
                    >
                      {notification.enabled ? '✓' : '✗'}
                    </button>
                    <button
                      className="twitter-btn-icon twitter-btn-delete"
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

  // ============ Render Engagement Tab ============

  const renderEngagementTab = () => (
    <div className="twitter-tab-content">
      <div className="twitter-card">
        <h3>{t('twitter.engagement.title', 'Auto-Engagement Settings')}</h3>

        <div className="twitter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.engagement.autoLikeMentions}
              onChange={(e) => updateEngagementConfig({ autoLikeMentions: e.target.checked })}
            />
            {t('twitter.engagement.autoLikeMentions', 'Auto-like mentions')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.engagement.autoRetweetMentions}
              onChange={(e) => updateEngagementConfig({ autoRetweetMentions: e.target.checked })}
            />
            {t('twitter.engagement.autoRetweetMentions', 'Auto-retweet mentions')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.engagement.autoReplyEnabled}
              onChange={(e) => updateEngagementConfig({ autoReplyEnabled: e.target.checked })}
            />
            {t('twitter.engagement.autoReply', 'Enable auto-reply')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.engagement.thankFollowers}
              onChange={(e) => updateEngagementConfig({ thankFollowers: e.target.checked })}
            />
            {t('twitter.engagement.thankFollowers', 'Thank new followers')}
          </label>
        </div>

        {config.engagement.autoReplyEnabled && (
          <div className="twitter-form-group">
            <label>{t('twitter.engagement.autoReplyTemplate', 'Auto-reply template')}</label>
            <textarea
              value={config.engagement.autoReplyTemplate}
              onChange={(e) => updateEngagementConfig({ autoReplyTemplate: e.target.value })}
              rows={2}
            />
          </div>
        )}

        {config.engagement.thankFollowers && (
          <div className="twitter-form-group">
            <label>{t('twitter.engagement.thankTemplate', 'Thank you template')}</label>
            <textarea
              value={config.engagement.thankTemplate}
              onChange={(e) => updateEngagementConfig({ thankTemplate: e.target.value })}
              rows={2}
            />
          </div>
        )}
      </div>

      <div className="twitter-card">
        <h3>{t('twitter.engagement.streamSettings', 'Stream Tweet Settings')}</h3>

        <div className="twitter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.streamSettings.autoTweetOnStart}
              onChange={(e) => updateStreamSettings({ autoTweetOnStart: e.target.checked })}
            />
            {t('twitter.engagement.autoTweetStart', 'Auto-tweet on stream start')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.streamSettings.autoTweetOnEnd}
              onChange={(e) => updateStreamSettings({ autoTweetOnEnd: e.target.checked })}
            />
            {t('twitter.engagement.autoTweetEnd', 'Auto-tweet on stream end')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.streamSettings.includeLink}
              onChange={(e) => updateStreamSettings({ includeLink: e.target.checked })}
            />
            {t('twitter.engagement.includeLink', 'Include stream link')}
          </label>
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.engagement.tweetTemplate', 'Tweet template')}</label>
          <textarea
            value={config.streamSettings.tweetTemplate}
            onChange={(e) => updateStreamSettings({ tweetTemplate: e.target.value })}
            rows={3}
          />
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.engagement.hashtags', 'Hashtags (comma-separated)')}</label>
          <input
            type="text"
            value={config.streamSettings.hashtags.join(', ')}
            onChange={(e) => updateStreamSettings({ hashtags: e.target.value.split(',').map((h) => h.trim()).filter(Boolean) })}
            placeholder="streaming, live, gaming"
          />
          {config.streamSettings.hashtags.length > 0 && (
            <div className="twitter-preview-tags">
              {config.streamSettings.hashtags.map((tag) => (
                <span key={tag} className="twitter-preview-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ============ Render Settings Tab ============

  const renderSettingsTab = () => (
    <div className="twitter-tab-content">
      <div className="twitter-card">
        <h3>{t('twitter.settings.title', 'Connection Settings')}</h3>

        <div className="twitter-form-row">
          <div className="twitter-form-group">
            <label>{t('twitter.settings.reconnectInterval', 'Reconnect Interval (ms)')}</label>
            <input
              type="number"
              value={config.reconnectInterval}
              onChange={(e) => updateConfig({ reconnectInterval: parseInt(e.target.value) || 5000 })}
              min={1000}
              max={60000}
            />
          </div>

          <div className="twitter-form-group">
            <label>{t('twitter.settings.maxReconnectAttempts', 'Max Reconnect Attempts')}</label>
            <input
              type="number"
              value={config.maxReconnectAttempts}
              onChange={(e) => updateConfig({ maxReconnectAttempts: parseInt(e.target.value) || 5 })}
              min={1}
              max={20}
            />
          </div>
        </div>

        <div className="twitter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.autoConnect}
              onChange={(e) => updateConfig({ autoConnect: e.target.checked })}
            />
            {t('twitter.settings.autoConnect', 'Auto-connect on startup')}
          </label>
        </div>
      </div>

      <div className="twitter-card">
        <h3>{t('twitter.settings.autoPost', 'Auto-Post Settings')}</h3>

        <div className="twitter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.autoPost.enabled}
              onChange={(e) => updateConfig({ autoPost: { ...config.autoPost, enabled: e.target.checked } })}
            />
            {t('twitter.settings.enableAutoPost', 'Enable auto-posting')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.autoPost.postFollowers}
              onChange={(e) => updateConfig({ autoPost: { ...config.autoPost, postFollowers: e.target.checked } })}
            />
            {t('twitter.settings.postFollowers', 'Post about new followers')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.autoPost.postMilestones}
              onChange={(e) => updateConfig({ autoPost: { ...config.autoPost, postMilestones: e.target.checked } })}
            />
            {t('twitter.settings.postMilestones', 'Post about milestones')}
          </label>
        </div>

        <div className="twitter-form-group">
          <label>{t('twitter.settings.milestoneThresholds', 'Milestone Thresholds (comma-separated)')}</label>
          <input
            type="text"
            value={config.autoPost.milestoneThresholds.join(', ')}
            onChange={(e) => updateConfig({
              autoPost: {
                ...config.autoPost,
                milestoneThresholds: e.target.value.split(',').map((n) => parseInt(n.trim())).filter(Boolean)
              }
            })}
            placeholder="100, 500, 1000, 5000"
          />
        </div>
      </div>

      <div className="twitter-card">
        <div className="twitter-danger-zone">
          <h4>{t('twitter.settings.dangerZone', 'Danger Zone')}</h4>
          <button
            className="twitter-btn twitter-btn-danger"
            onClick={() => {
              if (window.confirm(t('twitter.settings.resetConfirm', 'Are you sure you want to reset all settings?'))) {
                updateConfig({ notifications: [] });
              }
            }}
          >
            {t('twitter.settings.resetAll', 'Reset All Notifications')}
          </button>
        </div>
      </div>
    </div>
  );

  // ============ Main Render ============

  return (
    <div className="twitter-integration">
      <div className="twitter-header">
        <h2>🐦 {t('twitter.title', 'Twitter/X Integration')}</h2>
        <p>{t('twitter.description', 'Connect your Twitter/X account to manage tweets, notifications, and engagement.')}</p>
        {onClose && (
          <button className="twitter-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      {renderTabs()}

      <div className="twitter-content">
        {activeTab === 'connection' && renderConnectionTab()}
        {activeTab === 'tweets' && renderTweetsTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default TwitterXIntegration;