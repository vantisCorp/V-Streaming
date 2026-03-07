import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDiscordBot } from '../hooks/useDiscordBot';
import {
  DiscordConnectionStatus,
  DiscordNotificationType,
  DiscordNotificationConfig,
  DiscordCommandConfig,
  DiscordPresenceConfig,
  DiscordGuild,
  DiscordChannel,
  DiscordRole,
  DiscordEmbedColor,
  DiscordActivityType,
  DEFAULT_DISCORD_NOTIFICATION,
  DEFAULT_DISCORD_COMMAND,
} from '../types/discordBot';
import './DiscordIntegration.css';

type TabType = 'connection' | 'notifications' | 'commands' | 'presence' | 'settings';

interface DiscordIntegrationProps {
  onClose?: () => void;
}

const NOTIFICATION_TYPES = [
  { value: DiscordNotificationType.STREAM_START, label: 'Stream Start' },
  { value: DiscordNotificationType.STREAM_END, label: 'Stream End' },
  { value: DiscordNotificationType.NEW_FOLLOWER, label: 'New Follower' },
  { value: DiscordNotificationType.NEW_SUBSCRIBER, label: 'New Subscriber' },
  { value: DiscordNotificationType.DONATION, label: 'Donation' },
  { value: DiscordNotificationType.RAID, label: 'Raid' },
  { value: DiscordNotificationType.HOST, label: 'Host' },
  { value: DiscordNotificationType.CHEER, label: 'Cheer' },
  { value: DiscordNotificationType.MILESTONE, label: 'Milestone' },
  { value: DiscordNotificationType.CUSTOM, label: 'Custom' },
];

const EMBED_COLORS = [
  { value: DiscordEmbedColor.DEFAULT, label: 'Default' },
  { value: DiscordEmbedColor.AQUA, label: 'Aqua' },
  { value: DiscordEmbedColor.GREEN, label: 'Green' },
  { value: DiscordEmbedColor.BLUE, label: 'Blue' },
  { value: DiscordEmbedColor.PURPLE, label: 'Purple' },
  { value: DiscordEmbedColor.GOLD, label: 'Gold' },
  { value: DiscordEmbedColor.ORANGE, label: 'Orange' },
  { value: DiscordEmbedColor.RED, label: 'Red' },
];

export const DiscordIntegration: React.FC<DiscordIntegrationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    connectionState,
    statistics,
    connect,
    disconnect,
    updateConfig,
    addNotification,
    updateNotification,
    removeNotification,
    addCommand,
    updateCommand,
    removeCommand,
    updatePresence,
    getGuilds,
    getChannels,
    getRoles,
  } = useDiscordBot();

  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [botToken, setBotToken] = useState(config.botToken);
  const [clientId, setClientId] = useState(config.clientId);
  const [prefix, setPrefix] = useState(config.prefix);

  // Load guilds when connected
  useEffect(() => {
    if (connectionState.status === DiscordConnectionStatus.CONNECTED) {
      loadGuildData();
    }
  }, [connectionState.status]);

  const loadGuildData = async () => {
    setLoading(true);
    try {
      const guildList = await getGuilds();
      setGuilds(guildList);

      if (guildList.length > 0) {
        const [channelList, roleList] = await Promise.all([
          getChannels(guildList[0].id),
          getRoles(guildList[0].id),
        ]);
        setChannels(channelList);
        setRoles(roleList);
      }
    } catch (error) {
      console.error('Failed to load guild data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      updateConfig({ botToken, clientId, prefix });
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

  const getConnectionStatusClass = () => {
    switch (connectionState.status) {
      case DiscordConnectionStatus.CONNECTED:
        return 'status-connected';
      case DiscordConnectionStatus.CONNECTING:
      case DiscordConnectionStatus.RECONNECTING:
        return 'status-connecting';
      case DiscordConnectionStatus.ERROR:
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

  // ============ Notification Management ============

  const [newNotification, setNewNotification] = useState<Partial<DiscordNotificationConfig>>({
    ...DEFAULT_DISCORD_NOTIFICATION,
    type: DiscordNotificationType.STREAM_START,
    template: '🎬 {streamer} is now live! Playing: {game}',
  });

  const handleAddNotification = () => {
    if (!newNotification.type || !newNotification.channelId) return;

    addNotification({
      id: `notif-${Date.now()}`,
      ...DEFAULT_DISCORD_NOTIFICATION,
      ...newNotification,
    } as DiscordNotificationConfig);

    setNewNotification({
      ...DEFAULT_DISCORD_NOTIFICATION,
      type: DiscordNotificationType.STREAM_START,
      template: '🎬 {streamer} is now live! Playing: {game}',
    });
  };

  // ============ Command Management ============

  const [newCommand, setNewCommand] = useState<Partial<DiscordCommandConfig>>({
    ...DEFAULT_DISCORD_COMMAND,
    name: '',
    description: '',
    response: '',
  });

  const handleAddCommand = () => {
    if (!newCommand.name || !newCommand.response) return;

    addCommand({
      id: `cmd-${Date.now()}`,
      ...DEFAULT_DISCORD_COMMAND,
      ...newCommand,
    } as DiscordCommandConfig);

    setNewCommand({
      ...DEFAULT_DISCORD_COMMAND,
      name: '',
      description: '',
      response: '',
    });
  };

  // ============ Presence Settings ============

  const handlePresenceUpdate = (updates: Partial<DiscordPresenceConfig>) => {
    updatePresence({
      ...config.presence,
      ...updates,
    });
  };

  // ============ Render Tabs ============

  const renderTabs = () => (
    <div className="discord-tabs">
      <button
        className={`discord-tab ${activeTab === 'connection' ? 'active' : ''}`}
        onClick={() => setActiveTab('connection')}
      >
        🔌 {t('discord.tabs.connection', 'Connection')}
      </button>
      <button
        className={`discord-tab ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
        disabled={connectionState.status !== DiscordConnectionStatus.CONNECTED}
      >
        🔔 {t('discord.tabs.notifications', 'Notifications')}
      </button>
      <button
        className={`discord-tab ${activeTab === 'commands' ? 'active' : ''}`}
        onClick={() => setActiveTab('commands')}
        disabled={connectionState.status !== DiscordConnectionStatus.CONNECTED}
      >
        ⚡ {t('discord.tabs.commands', 'Commands')}
      </button>
      <button
        className={`discord-tab ${activeTab === 'presence' ? 'active' : ''}`}
        onClick={() => setActiveTab('presence')}
        disabled={connectionState.status !== DiscordConnectionStatus.CONNECTED}
      >
        🎮 {t('discord.tabs.presence', 'Presence')}
      </button>
      <button
        className={`discord-tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        ⚙️ {t('discord.tabs.settings', 'Settings')}
      </button>
    </div>
  );

  // ============ Render Connection Tab ============

  const renderConnectionTab = () => (
    <div className="discord-tab-content">
      <div className="discord-card">
        <h3>{t('discord.connection.title', 'Connection Settings')}</h3>

        <div className="discord-form-group">
          <label>{t('discord.connection.botToken', 'Bot Token')}</label>
          <input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={t('discord.connection.botTokenPlaceholder', 'Enter your Discord bot token')}
            disabled={connectionState.status === DiscordConnectionStatus.CONNECTED}
          />
        </div>

        <div className="discord-form-group">
          <label>{t('discord.connection.clientId', 'Client ID')}</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={t('discord.connection.clientIdPlaceholder', 'Enter your Discord application client ID')}
            disabled={connectionState.status === DiscordConnectionStatus.CONNECTED}
          />
        </div>

        <div className="discord-form-group">
          <label>{t('discord.connection.prefix', 'Command Prefix')}</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="!"
            maxLength={5}
          />
        </div>

        <div className="discord-connection-status">
          <div className={`status-indicator ${getConnectionStatusClass()}`}></div>
          <span>
            {t(`discord.status.${connectionState.status}`, connectionState.status)}
            {connectionState.botName && ` - ${connectionState.botName}`}
          </span>
        </div>

        {connectionState.error && (
          <div className="discord-error-message">
            {connectionState.error}
          </div>
        )}

        <div className="discord-button-group">
          {connectionState.status !== DiscordConnectionStatus.CONNECTED ? (
            <button
              className="discord-btn discord-btn-primary"
              onClick={handleConnect}
              disabled={loading || !botToken}
            >
              {loading ? t('discord.connection.connecting', 'Connecting...') : t('discord.connection.connect', 'Connect')}
            </button>
          ) : (
            <button
              className="discord-btn discord-btn-danger"
              onClick={handleDisconnect}
            >
              {t('discord.connection.disconnect', 'Disconnect')}
            </button>
          )}
        </div>
      </div>

      {connectionState.status === DiscordConnectionStatus.CONNECTED && (
        <div className="discord-card">
          <h3>{t('discord.statistics.title', 'Statistics')}</h3>
          <div className="discord-stats-grid">
            <div className="discord-stat">
              <span className="stat-value">{statistics.messagesSent}</span>
              <span className="stat-label">{t('discord.statistics.messagesSent', 'Messages Sent')}</span>
            </div>
            <div className="discord-stat">
              <span className="stat-value">{statistics.commandsExecuted}</span>
              <span className="stat-label">{t('discord.statistics.commandsExecuted', 'Commands Executed')}</span>
            </div>
            <div className="discord-stat">
              <span className="stat-value">{statistics.notificationsSent}</span>
              <span className="stat-label">{t('discord.statistics.notificationsSent', 'Notifications Sent')}</span>
            </div>
            <div className="discord-stat">
              <span className="stat-value">{formatUptime(statistics.uptime)}</span>
              <span className="stat-label">{t('discord.statistics.uptime', 'Uptime')}</span>
            </div>
            <div className="discord-stat">
              <span className="stat-value">{statistics.serversConnected}</span>
              <span className="stat-label">{t('discord.statistics.servers', 'Servers')}</span>
            </div>
            <div className="discord-stat">
              <span className="stat-value">{connectionState.latency}ms</span>
              <span className="stat-label">{t('discord.statistics.latency', 'Latency')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============ Render Notifications Tab ============

  const renderNotificationsTab = () => (
    <div className="discord-tab-content">
      <div className="discord-card">
        <h3>{t('discord.notifications.addTitle', 'Add Notification')}</h3>

        <div className="discord-form-row">
          <div className="discord-form-group">
            <label>{t('discord.notifications.type', 'Type')}</label>
            <select
              value={newNotification.type}
              onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as DiscordNotificationType })}
            >
              {NOTIFICATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="discord-form-group">
            <label>{t('discord.notifications.channel', 'Channel')}</label>
            <select
              value={newNotification.channelId || ''}
              onChange={(e) => setNewNotification({ ...newNotification, channelId: e.target.value })}
            >
              <option value="">{t('discord.notifications.selectChannel', 'Select channel')}</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="discord-form-group">
          <label>{t('discord.notifications.template', 'Message Template')}</label>
          <textarea
            value={newNotification.template}
            onChange={(e) => setNewNotification({ ...newNotification, template: e.target.value })}
            placeholder={t('discord.notifications.templatePlaceholder', 'Enter message template with {placeholders}')}
            rows={3}
          />
        </div>

        <div className="discord-form-row">
          <div className="discord-form-group">
            <label>{t('discord.notifications.embedColor', 'Embed Color')}</label>
            <select
              value={newNotification.embedColor}
              onChange={(e) => setNewNotification({ ...newNotification, embedColor: parseInt(e.target.value) })}
            >
              {EMBED_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          <div className="discord-form-group">
            <label>{t('discord.notifications.cooldown', 'Cooldown (seconds)')}</label>
            <input
              type="number"
              value={newNotification.cooldown || 0}
              onChange={(e) => setNewNotification({ ...newNotification, cooldown: parseInt(e.target.value) || 0 })}
              min={0}
              max={3600}
            />
          </div>
        </div>

        <div className="discord-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={newNotification.embedEnabled}
              onChange={(e) => setNewNotification({ ...newNotification, embedEnabled: e.target.checked })}
            />
            {t('discord.notifications.useEmbed', 'Use Embed')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={newNotification.mentionEveryone}
              onChange={(e) => setNewNotification({ ...newNotification, mentionEveryone: e.target.checked })}
            />
            {t('discord.notifications.mentionEveryone', 'Mention @everyone')}
          </label>
        </div>

        <button className="discord-btn discord-btn-primary" onClick={handleAddNotification}>
          {t('discord.notifications.addButton', 'Add Notification')}
        </button>
      </div>

      <div className="discord-card">
        <h3>{t('discord.notifications.listTitle', 'Active Notifications')}</h3>
        {config.notifications.length === 0 ? (
          <p className="discord-empty-message">{t('discord.notifications.noNotifications', 'No notifications configured')}</p>
        ) : (
          <div className="discord-list">
            {config.notifications.map((notification) => (
              <div key={notification.id} className="discord-list-item">
                <div className="list-item-header">
                  <span className="list-item-title">
                    {NOTIFICATION_TYPES.find((t) => t.value === notification.type)?.label || notification.type}
                  </span>
                  <div className="list-item-actions">
                    <button
                      className="discord-btn-icon discord-btn-toggle"
                      onClick={() => updateNotification(notification.id, { enabled: !notification.enabled })}
                      title={notification.enabled ? 'Disable' : 'Enable'}
                    >
                      {notification.enabled ? '✓' : '✗'}
                    </button>
                    <button
                      className="discord-btn-icon discord-btn-delete"
                      onClick={() => removeNotification(notification.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="list-item-details">
                  <span>#{channels.find((c) => c.id === notification.channelId)?.name || notification.channelId}</span>
                  <span>{notification.template.substring(0, 50)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============ Render Commands Tab ============

  const renderCommandsTab = () => (
    <div className="discord-tab-content">
      <div className="discord-card">
        <h3>{t('discord.commands.addTitle', 'Add Command')}</h3>

        <div className="discord-form-row">
          <div className="discord-form-group">
            <label>{t('discord.commands.name', 'Command Name')}</label>
            <input
              type="text"
              value={newCommand.name}
              onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
              placeholder="example"
            />
          </div>

          <div className="discord-form-group">
            <label>{t('discord.commands.cooldown', 'Cooldown (seconds)')}</label>
            <input
              type="number"
              value={newCommand.cooldown || 3}
              onChange={(e) => setNewCommand({ ...newCommand, cooldown: parseInt(e.target.value) || 3 })}
              min={0}
              max={300}
            />
          </div>
        </div>

        <div className="discord-form-group">
          <label>{t('discord.commands.description', 'Description')}</label>
          <input
            type="text"
            value={newCommand.description}
            onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
            placeholder={t('discord.commands.descriptionPlaceholder', 'What does this command do?')}
          />
        </div>

        <div className="discord-form-group">
          <label>{t('discord.commands.response', 'Response')}</label>
          <textarea
            value={newCommand.response}
            onChange={(e) => setNewCommand({ ...newCommand, response: e.target.value })}
            placeholder={t('discord.commands.responsePlaceholder', 'Bot response. Use {user}, {args}, etc.')}
            rows={3}
          />
        </div>

        <div className="discord-form-group">
          <label>{t('discord.commands.aliases', 'Aliases (comma-separated)')}</label>
          <input
            type="text"
            value={newCommand.aliases?.join(', ') || ''}
            onChange={(e) => setNewCommand({ ...newCommand, aliases: e.target.value.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean) })}
            placeholder="alias1, alias2, alias3"
          />
        </div>

        <button className="discord-btn discord-btn-primary" onClick={handleAddCommand}>
          {t('discord.commands.addButton', 'Add Command')}
        </button>
      </div>

      <div className="discord-card">
        <h3>{t('discord.commands.listTitle', 'Active Commands')}</h3>
        {config.commands.length === 0 ? (
          <p className="discord-empty-message">{t('discord.commands.noCommands', 'No commands configured')}</p>
        ) : (
          <div className="discord-list">
            {config.commands.map((command) => (
              <div key={command.id} className="discord-list-item">
                <div className="list-item-header">
                  <span className="list-item-title">
                    {config.prefix}{command.name}
                  </span>
                  <div className="list-item-actions">
                    <button
                      className="discord-btn-icon discord-btn-toggle"
                      onClick={() => updateCommand(command.id, { enabled: !command.enabled })}
                      title={command.enabled ? 'Disable' : 'Enable'}
                    >
                      {command.enabled ? '✓' : '✗'}
                    </button>
                    <button
                      className="discord-btn-icon discord-btn-delete"
                      onClick={() => removeCommand(command.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="list-item-details">
                  <span>{command.description || 'No description'}</span>
                  <span className="command-response">{command.response}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============ Render Presence Tab ============

  const renderPresenceTab = () => (
    <div className="discord-tab-content">
      <div className="discord-card">
        <h3>{t('discord.presence.title', 'Bot Presence')}</h3>

        <div className="discord-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.presence.enabled}
              onChange={(e) => handlePresenceUpdate({ enabled: e.target.checked })}
            />
            {t('discord.presence.enablePresence', 'Enable Custom Presence')}
          </label>
        </div>

        <div className="discord-form-group">
          <label>{t('discord.presence.status', 'Status')}</label>
          <select
            value={config.presence.status}
            onChange={(e) => handlePresenceUpdate({ status: e.target.value as 'online' | 'idle' | 'dnd' | 'invisible' })}
          >
            <option value="online">🟢 Online</option>
            <option value="idle">🟡 Idle</option>
            <option value="dnd">🔴 Do Not Disturb</option>
            <option value="invisible">⚫ Invisible</option>
          </select>
        </div>

        <div className="discord-form-group">
          <label>{t('discord.presence.activityType', 'Activity Type')}</label>
          <select
            value={config.presence.activityType}
            onChange={(e) => handlePresenceUpdate({ activityType: e.target.value as DiscordActivityType })}
          >
            <option value={DiscordActivityType.PLAYING}>🎮 Playing</option>
            <option value={DiscordActivityType.STREAMING}>📺 Streaming</option>
            <option value={DiscordActivityType.LISTENING}>🎵 Listening to</option>
            <option value={DiscordActivityType.WATCHING}>👀 Watching</option>
            <option value={DiscordActivityType.COMPETING}>🏆 Competing in</option>
          </select>
        </div>

        <div className="discord-form-group">
          <label>{t('discord.presence.activityName', 'Activity Name')}</label>
          <input
            type="text"
            value={config.presence.activityName}
            onChange={(e) => handlePresenceUpdate({ activityName: e.target.value })}
            placeholder={t('discord.presence.activityNamePlaceholder', 'e.g., Live Stream')}
          />
        </div>

        {config.presence.activityType === DiscordActivityType.STREAMING && (
          <div className="discord-form-group">
            <label>{t('discord.presence.streamUrl', 'Stream URL')}</label>
            <input
              type="text"
              value={config.presence.activityUrl || ''}
              onChange={(e) => handlePresenceUpdate({ activityUrl: e.target.value })}
              placeholder="https://twitch.tv/username"
            />
          </div>
        )}

        <div className="discord-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.presence.streamStatus}
              onChange={(e) => handlePresenceUpdate({ streamStatus: e.target.checked })}
            />
            {t('discord.presence.streamStatus', 'Auto-update with Stream Status')}
          </label>
        </div>
      </div>
    </div>
  );

  // ============ Render Settings Tab ============

  const renderSettingsTab = () => (
    <div className="discord-tab-content">
      <div className="discord-card">
        <h3>{t('discord.settings.title', 'Bot Settings')}</h3>

        <div className="discord-form-group">
          <label>{t('discord.settings.reconnectInterval', 'Reconnect Interval (ms)')}</label>
          <input
            type="number"
            value={config.reconnectInterval}
            onChange={(e) => updateConfig({ reconnectInterval: parseInt(e.target.value) || 5000 })}
            min={1000}
            max={60000}
          />
        </div>

        <div className="discord-form-group">
          <label>{t('discord.settings.maxReconnectAttempts', 'Max Reconnect Attempts')}</label>
          <input
            type="number"
            value={config.maxReconnectAttempts}
            onChange={(e) => updateConfig({ maxReconnectAttempts: parseInt(e.target.value) || 5 })}
            min={1}
            max={20}
          />
        </div>

        <div className="discord-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={config.autoConnect}
              onChange={(e) => updateConfig({ autoConnect: e.target.checked })}
            />
            {t('discord.settings.autoConnect', 'Auto-connect on startup')}
          </label>
        </div>

        <div className="discord-settings-section">
          <h4>{t('discord.settings.embedSettings', 'Default Embed Settings')}</h4>

          <div className="discord-form-group">
            <label>{t('discord.settings.defaultColor', 'Default Embed Color')}</label>
            <select
              value={config.embedSettings.defaultColor}
              onChange={(e) => updateConfig({
                embedSettings: { ...config.embedSettings, defaultColor: parseInt(e.target.value) }
              })}
            >
              {EMBED_COLORS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          <div className="discord-form-group">
            <label>{t('discord.settings.footerText', 'Footer Text')}</label>
            <input
              type="text"
              value={config.embedSettings.footerText}
              onChange={(e) => updateConfig({
                embedSettings: { ...config.embedSettings, footerText: e.target.value }
              })}
              placeholder="V-Streaming Bot"
            />
          </div>

          <div className="discord-checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.embedSettings.showTimestamp}
                onChange={(e) => updateConfig({
                  embedSettings: { ...config.embedSettings, showTimestamp: e.target.checked }
                })}
              />
              {t('discord.settings.showTimestamp', 'Show Timestamp')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={config.embedSettings.showFooter}
                onChange={(e) => updateConfig({
                  embedSettings: { ...config.embedSettings, showFooter: e.target.checked }
                })}
              />
              {t('discord.settings.showFooter', 'Show Footer')}
            </label>
          </div>
        </div>

        <div className="discord-danger-zone">
          <h4>{t('discord.settings.dangerZone', 'Danger Zone')}</h4>
          <button
            className="discord-btn discord-btn-danger"
            onClick={() => {
              if (window.confirm(t('discord.settings.resetConfirm', 'Are you sure you want to reset all settings?'))) {
                updateConfig({
                  notifications: [],
                  commands: [],
                });
              }
            }}
          >
            {t('discord.settings.resetAll', 'Reset All Notifications & Commands')}
          </button>
        </div>
      </div>
    </div>
  );

  // ============ Main Render ============

  return (
    <div className="discord-integration">
      <div className="discord-header">
        <h2>🤖 {t('discord.title', 'Discord Bot Integration')}</h2>
        <p>{t('discord.description', 'Connect your Discord bot to manage notifications, commands, and presence.')}</p>
        {onClose && (
          <button className="discord-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      {renderTabs()}

      <div className="discord-content">
        {activeTab === 'connection' && renderConnectionTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'commands' && renderCommandsTab()}
        {activeTab === 'presence' && renderPresenceTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default DiscordIntegration;