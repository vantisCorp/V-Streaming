import React, { useState, useEffect } from 'react';
import { useMultiPlatform } from '../hooks/useMultiPlatform';
import { StreamPlatformConfig, StreamingPlatform, PLATFORM_PRESETS } from '../types/multiPlatform';
import { useTranslation } from 'react-i18next';

interface MultiPlatformSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MultiPlatformSettings: React.FC<MultiPlatformSettingsProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    analytics,
    streamingStatus,
    getPlatforms,
    getPlatformPresets,
    addPlatform,
    updatePlatform,
    removePlatform,
    startStream,
    stopStream,
    startAllStreams,
    stopAllStreams,
    updateSyncSettings,
    updateChatIntegrationSettings,
    updateHealthMonitoringSettings,
    loading,
    error,
    clearError,
  } = useMultiPlatform();

  const [activeTab, setActiveTab] = useState<'platforms' | 'sync' | 'chat' | 'analytics'>('platforms');
  const [editingPlatform, setEditingPlatform] = useState<StreamPlatformConfig | null>(null);
  const [showAddPlatform, setShowAddPlatform] = useState(false);

  // Form state for new/editing platform
  const [platformForm, setPlatformForm] = useState<Partial<StreamPlatformConfig>>({
    platform: 'twitch',
    enabled: true,
    name: '',
    rtmpUrl: '',
    streamKey: '',
    quality: '1080p60',
    bitrate: 6000,
    fps: 60,
    latency: 'normal',
  });

  if (!isOpen) return null;

  const platforms = getPlatforms();
  const presets = getPlatformPresets();
  const activeStreamCount = Object.values(streamingStatus).filter(s => s.active).length;

  const handlePlatformSelect = (preset: typeof presets[0]) => {
    setPlatformForm({
      ...platformForm,
      platform: preset.platform,
      rtmpUrl: preset.rtmpUrl,
      quality: preset.defaultQuality,
      bitrate: preset.defaultBitrate,
      fps: preset.defaultFps,
      name: preset.name,
    });
  };

  const handleSavePlatform = () => {
    if (!platformForm.name || !platformForm.streamKey) {
      alert('Name and stream key are required');
      return;
    }

    if (editingPlatform) {
      updatePlatform(editingPlatform.name, platformForm as any);
      setEditingPlatform(null);
    } else {
      addPlatform(platformForm as any);
    }

    setPlatformForm({
      platform: 'twitch',
      enabled: true,
      name: '',
      rtmpUrl: '',
      streamKey: '',
      quality: '1080p60',
      bitrate: 6000,
      fps: 60,
      latency: 'normal',
    });
    setShowAddPlatform(false);
  };

  const handleEditPlatform = (platform: StreamPlatformConfig) => {
    setEditingPlatform(platform);
    setPlatformForm({ ...platform });
    setShowAddPlatform(true);
  };

  const handleDeletePlatform = (platformId: string) => {
    if (confirm('Are you sure you want to remove this platform?')) {
      removePlatform(platformId);
    }
  };

  const handleStartStream = async (platformId: string) => {
    try {
      await startStream(platformId);
    } catch (err) {
      console.error('Failed to start stream:', err);
    }
  };

  const handleStopStream = async (platformId: string) => {
    try {
      await stopStream(platformId);
    } catch (err) {
      console.error('Failed to stop stream:', err);
    }
  };

  const handleStartAll = async () => {
    try {
      await startAllStreams();
    } catch (err) {
      console.error('Failed to start all streams:', err);
    }
  };

  const handleStopAll = async () => {
    try {
      await stopAllStreams();
    } catch (err) {
      console.error('Failed to stop all streams:', err);
    }
  };

  const getPlatformIcon = (platform: StreamingPlatform) => {
    const preset = presets.find(p => p.platform === platform);
    return preset?.icon || '📺';
  };

  const getPlatformColor = (platform: StreamingPlatform) => {
    const preset = presets.find(p => p.platform === platform);
    return preset?.color || '#666666';
  };

  return (
    <div className="modal-overlay multiplatform-modal">
      <div className="modal-content multiplatform-content">
        <div className="modal-header">
          <h2>{t('multiPlatform.title')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Error display */}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError}>×</button>
            </div>
          )}

          {/* Status bar */}
          <div className="status-bar">
            <div className="status-item">
              <span className="status-label">Active Streams:</span>
              <span className="status-value">{activeStreamCount}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Configured Platforms:</span>
              <span className="status-value">{platforms.length}</span>
            </div>
            <div className="status-actions">
              <button
                onClick={handleStartAll}
                className="start-all-button"
                disabled={activeStreamCount > 0 || loading}
              >
                Start All
              </button>
              <button
                onClick={handleStopAll}
                className="stop-all-button"
                disabled={activeStreamCount === 0 || loading}
              >
                Stop All
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'platforms' ? 'active' : ''}`}
              onClick={() => setActiveTab('platforms')}
            >
              {t('multiPlatform.tabs.platforms')}
            </button>
            <button
              className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
              onClick={() => setActiveTab('sync')}
            >
              {t('multiPlatform.tabs.sync')}
            </button>
            <button
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              {t('multiPlatform.tabs.chat')}
            </button>
            <button
              className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              {t('multiPlatform.tabs.analytics')}
            </button>
          </div>

          {/* Platforms Tab */}
          {activeTab === 'platforms' && (
            <div className="tab-content platforms-tab">
              <div className="platforms-list">
                {platforms.map(platform => {
                  const status = streamingStatus[platform.name];
                  return (
                    <div key={platform.name} className="platform-card">
                      <div className="platform-header">
                        <div className="platform-info">
                          <span className="platform-icon" style={{ color: getPlatformColor(platform.platform) }}>
                            {getPlatformIcon(platform.platform)}
                          </span>
                          <div>
                            <h4>{platform.name}</h4>
                            <span className={`status-badge ${status?.active ? 'active' : 'inactive'}`}>
                              {status?.active ? '● Streaming' : '○ Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="platform-actions">
                          {status?.active ? (
                            <button
                              onClick={() => handleStopStream(platform.name)}
                              className="stop-button"
                              disabled={loading}
                            >
                              ■
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartStream(platform.name)}
                              className="start-button"
                              disabled={loading || !platform.enabled}
                            >
                              ▶
                            </button>
                          )}
                          <button onClick={() => handleEditPlatform(platform)} className="edit-button">
                            ✏️
                          </button>
                          <button onClick={() => handleDeletePlatform(platform.name)} className="delete-button">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="platform-details">
                        <div className="detail-item">
                          <span>Quality:</span>
                          <span>{platform.quality}</span>
                        </div>
                        <div className="detail-item">
                          <span>Bitrate:</span>
                          <span>{platform.bitrate} kbps</span>
                        </div>
                        <div className="detail-item">
                          <span>FPS:</span>
                          <span>{platform.fps}</span>
                        </div>
                        {status?.active && (
                          <>
                            <div className="detail-item">
                              <span>Current Bitrate:</span>
                              <span>{status.health.bitrate} kbps</span>
                            </div>
                            <div className="detail-item">
                              <span>Dropped Frames:</span>
                              <span>{status.health.droppedFrames}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setEditingPlatform(null);
                  setPlatformForm({
                    platform: 'twitch',
                    enabled: true,
                    name: '',
                    rtmpUrl: '',
                    streamKey: '',
                    quality: '1080p60',
                    bitrate: 6000,
                    fps: 60,
                    latency: 'normal',
                  });
                  setShowAddPlatform(true);
                }}
                className="add-platform-button"
              >
                + Add Platform
              </button>
            </div>
          )}

          {/* Sync Settings Tab */}
          {activeTab === 'sync' && (
            <div className="tab-content sync-tab">
              <div className="setting-group">
                <h3>{t('multiPlatform.sync.title')}</h3>
                {Object.entries(config.syncSettings).map(([key, value]) => (
                  <div key={key} className="setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={(e) => updateSyncSettings({ [key]: e.target.checked })}
                      />
                      {t(`multiPlatform.sync.${key}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Integration Tab */}
          {activeTab === 'chat' && (
            <div className="tab-content chat-tab">
              <div className="setting-group">
                <h3>{t('multiPlatform.chat.title')}</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.chatIntegration.enabled}
                      onChange={(e) => updateChatIntegrationSettings({ enabled: e.target.checked })}
                    />
                    {t('multiPlatform.chat.enabled')}
                  </label>
                </div>
                <div className="setting-item">
                  <label>Max Messages/Second:</label>
                  <input
                    type="number"
                    value={config.chatIntegration.maxMessagesPerSecond}
                    onChange={(e) => updateChatIntegrationSettings({ maxMessagesPerSecond: parseInt(e.target.value) })}
                    min="10"
                    max="500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="tab-content analytics-tab">
              <div className="analytics-summary">
                <div className="metric-card">
                  <span className="metric-label">Total Viewers</span>
                  <span className="metric-value">{analytics.totalViewers}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Peak Viewers</span>
                  <span className="metric-value">{analytics.peakTotalViewers}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Total Messages</span>
                  <span className="metric-value">{analytics.aggregatedMetrics.totalMessages}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">New Followers</span>
                  <span className="metric-value">{analytics.aggregatedMetrics.newFollowers}</span>
                </div>
              </div>

              <div className="platform-analytics">
                <h3>Platform Analytics</h3>
                {analytics.platformAnalytics.map(platform => (
                  <div key={platform.platform} className="platform-analytics-card">
                    <div className="platform-analytics-header">
                      <span className="platform-icon" style={{ color: getPlatformColor(platform.platform) }}>
                        {getPlatformIcon(platform.platform)}
                      </span>
                      <span className="platform-name">{platform.platform}</span>
                    </div>
                    <div className="platform-analytics-details">
                      <div className="analytics-detail">
                        <span>Viewers:</span>
                        <span>{platform.viewerCount}</span>
                      </div>
                      <div className="analytics-detail">
                        <span>Peak:</span>
                        <span>{platform.peakViewers}</span>
                      </div>
                      <div className="analytics-detail">
                        <span>Messages:</span>
                        <span>{platform.totalMessages}</span>
                      </div>
                      <div className="analytics-detail">
                        <span>New Followers:</span>
                        <span>{platform.newFollowers}</span>
                      </div>
                      <div className="analytics-detail">
                        <span>Duration:</span>
                        <span>{Math.floor(platform.duration / 60)}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Platform Modal */}
        {showAddPlatform && (
          <div className="modal-overlay platform-form-overlay">
            <div className="modal-content platform-form-content">
              <div className="modal-header">
                <h2>{editingPlatform ? 'Edit Platform' : 'Add Platform'}</h2>
                <button className="close-button" onClick={() => setShowAddPlatform(false)}>×</button>
              </div>
              <div className="modal-body">
                {!editingPlatform && (
                  <div className="form-group">
                    <label>Select Platform:</label>
                    <div className="platform-presets">
                      {presets.map(preset => (
                        <button
                          key={preset.id}
                          className={`preset-button ${platformForm.platform === preset.platform ? 'active' : ''}`}
                          onClick={() => handlePlatformSelect(preset)}
                          style={{ borderColor: platformForm.platform === preset.platform ? preset.color : undefined }}
                        >
                          <span className="preset-icon">{preset.icon}</span>
                          <span className="preset-name">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={platformForm.name || ''}
                    onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                    placeholder="e.g., My Twitch Channel"
                  />
                </div>

                <div className="form-group">
                  <label>Stream Key:</label>
                  <input
                    type="password"
                    value={platformForm.streamKey || ''}
                    onChange={(e) => setPlatformForm({ ...platformForm, streamKey: e.target.value })}
                    placeholder="Enter stream key"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quality:</label>
                    <select
                      value={platformForm.quality || '1080p60'}
                      onChange={(e) => setPlatformForm({ ...platformForm, quality: e.target.value as any })}
                    >
                      <option value="source">Source</option>
                      <option value="1080p60">1080p60</option>
                      <option value="1080p30">1080p30</option>
                      <option value="720p60">720p60</option>
                      <option value="720p30">720p30</option>
                      <option value="480p30">480p30</option>
                      <option value="360p30">360p30</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Bitrate (kbps):</label>
                    <input
                      type="number"
                      value={platformForm.bitrate || 6000}
                      onChange={(e) => setPlatformForm({ ...platformForm, bitrate: parseInt(e.target.value) })}
                      min="500"
                      max="20000"
                    />
                  </div>

                  <div className="form-group">
                    <label>FPS:</label>
                    <select
                      value={platformForm.fps || 60}
                      onChange={(e) => setPlatformForm({ ...platformForm, fps: parseInt(e.target.value) })}
                    >
                      <option value={60}>60</option>
                      <option value={30}>30</option>
                      <option value={24}>24</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button onClick={() => setShowAddPlatform(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button onClick={handleSavePlatform} className="save-button">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiPlatformSettings;