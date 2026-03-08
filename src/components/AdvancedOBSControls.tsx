/**
 * V-Streaming Advanced OBS Controls Component
 * Advanced controls for OBS including replay buffer, virtual camera, studio mode, and stats
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import './AdvancedOBSControls.css';

interface AdvancedOBSControlsProps {
  onClose?: () => void;
}

type TabType = 'quick' | 'collections' | 'profiles' | 'stats';

export const AdvancedOBSControls: React.FC<AdvancedOBSControlsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    isConnected,
    stats,
    replayBufferStatus,
    virtualCameraStatus,
    studioModeStatus,
    sceneCollections,
    profiles,
    currentSceneCollection,
    currentProfile,
    getStats,
    startReplayBuffer,
    stopReplayBuffer,
    saveReplayBuffer,
    startVirtualCamera,
    stopVirtualCamera,
    setStudioModeEnabled,
    getSceneCollections,
    getProfiles,
    setCurrentSceneCollection,
    setCurrentProfile,
  } = useOBSWebSocket();

  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [loading, setLoading] = useState(false);
  const [replaySaving, setReplaySaving] = useState(false);

  useEffect(() => {
    if (isConnected) {
      refreshData();
    }
  }, [isConnected]);

  const refreshData = async () => {
    try {
      await Promise.all([
        getStats(),
        getSceneCollections(),
        getProfiles(),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const handleReplayBufferToggle = async () => {
    setLoading(true);
    try {
      if (replayBufferStatus?.outputActive) {
        await stopReplayBuffer();
      } else {
        await startReplayBuffer();
      }
    } catch (error) {
      console.error('Failed to toggle replay buffer:', error);
    }
    setLoading(false);
  };

  const handleSaveReplay = async () => {
    setReplaySaving(true);
    try {
      await saveReplayBuffer();
    } catch (error) {
      console.error('Failed to save replay:', error);
    }
    setTimeout(() => setReplaySaving(false), 1000);
  };

  const handleVirtualCameraToggle = async () => {
    setLoading(true);
    try {
      if (virtualCameraStatus?.outputActive) {
        await stopVirtualCamera();
      } else {
        await startVirtualCamera();
      }
    } catch (error) {
      console.error('Failed to toggle virtual camera:', error);
    }
    setLoading(false);
  };

  const handleStudioModeToggle = async () => {
    setLoading(true);
    try {
      await setStudioModeEnabled(!studioModeStatus?.studioModeEnabled);
    } catch (error) {
      console.error('Failed to toggle studio mode:', error);
    }
    setLoading(false);
  };

  const handleCollectionChange = async (collectionName: string) => {
    setLoading(true);
    try {
      await setCurrentSceneCollection(collectionName);
    } catch (error) {
      console.error('Failed to change scene collection:', error);
    }
    setLoading(false);
  };

  const handleProfileChange = async (profileName: string) => {
    setLoading(true);
    try {
      await setCurrentProfile(profileName);
    } catch (error) {
      console.error('Failed to change profile:', error);
    }
    setLoading(false);
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isConnected) {
    return (
      <div className="advanced-obs-controls">
        <div className="aoc-warning">
          <span className="aoc-warning-icon">⚠️</span>
          {t('obs.connectRequired', 'Connect to OBS to access advanced controls')}
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-obs-controls">
      <div className="aoc-header">
        <div>
          <h2>{t('aoc.title', 'Advanced OBS Controls')}</h2>
          <p className="aoc-subtitle">{t('aoc.subtitle', 'Manage replay buffer, virtual camera, and more')}</p>
        </div>
        <div className="aoc-header-actions">
          <button className="aoc-refresh-btn" onClick={refreshData} disabled={loading}>
            🔄 {t('common.refresh', 'Refresh')}
          </button>
          {onClose && (
            <button className="aoc-close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      <div className="aoc-tabs">
        <button
          className={`aoc-tab ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          {t('aoc.tabs.quick', 'Quick Controls')}
        </button>
        <button
          className={`aoc-tab ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          {t('aoc.tabs.collections', 'Scene Collections')}
        </button>
        <button
          className={`aoc-tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          {t('aoc.tabs.profiles', 'Profiles')}
        </button>
        <button
          className={`aoc-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          {t('aoc.tabs.stats', 'Statistics')}
        </button>
      </div>

      {loading && <div className="aoc-loading-bar" />}

      <div className="aoc-content">
        {/* Quick Controls Tab */}
        {activeTab === 'quick' && (
          <div className="aoc-quick-controls">
            {/* Replay Buffer */}
            <div className="aoc-card">
              <div className="aoc-card-header">
                <span className="aoc-card-icon">📼</span>
                <h3>{t('aoc.replayBuffer', 'Replay Buffer')}</h3>
              </div>
              <div className="aoc-card-content">
                <div className="aoc-status-row">
                  <span className={`aoc-status-badge ${replayBufferStatus?.outputActive ? 'active' : 'inactive'}`}>
                    {replayBufferStatus?.outputActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                  </span>
                  {replayBufferStatus?.outputActive && (
                    <span className="aoc-duration">{formatDuration(replayBufferStatus.outputDuration)}</span>
                  )}
                </div>
                <div className="aoc-button-row">
                  <button
                    className={`aoc-btn ${replayBufferStatus?.outputActive ? 'danger' : 'primary'}`}
                    onClick={handleReplayBufferToggle}
                    disabled={loading}
                  >
                    {replayBufferStatus?.outputActive ? t('common.stop', 'Stop') : t('common.start', 'Start')}
                  </button>
                  {replayBufferStatus?.outputActive && (
                    <button
                      className="aoc-btn success"
                      onClick={handleSaveReplay}
                      disabled={replaySaving}
                    >
                      {replaySaving ? t('aoc.saving', 'Saving...') : t('aoc.saveReplay', 'Save Replay')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Virtual Camera */}
            <div className="aoc-card">
              <div className="aoc-card-header">
                <span className="aoc-card-icon">📷</span>
                <h3>{t('aoc.virtualCamera', 'Virtual Camera')}</h3>
              </div>
              <div className="aoc-card-content">
                <div className="aoc-status-row">
                  <span className={`aoc-status-badge ${virtualCameraStatus?.outputActive ? 'active' : 'inactive'}`}>
                    {virtualCameraStatus?.outputActive ? t('aoc.running', 'Running') : t('aoc.stopped', 'Stopped')}
                  </span>
                </div>
                <div className="aoc-button-row">
                  <button
                    className={`aoc-btn ${virtualCameraStatus?.outputActive ? 'danger' : 'primary'}`}
                    onClick={handleVirtualCameraToggle}
                    disabled={loading}
                  >
                    {virtualCameraStatus?.outputActive ? t('common.stop', 'Stop') : t('common.start', 'Start')}
                  </button>
                </div>
              </div>
            </div>

            {/* Studio Mode */}
            <div className="aoc-card">
              <div className="aoc-card-header">
                <span className="aoc-card-icon">🎬</span>
                <h3>{t('aoc.studioMode', 'Studio Mode')}</h3>
              </div>
              <div className="aoc-card-content">
                <div className="aoc-toggle-row">
                  <span className="aoc-toggle-label">
                    {studioModeStatus?.studioModeEnabled ? t('aoc.enabled', 'Enabled') : t('aoc.disabled', 'Disabled')}
                  </span>
                  <label className="aoc-switch">
                    <input
                      type="checkbox"
                      checked={studioModeStatus?.studioModeEnabled || false}
                      onChange={handleStudioModeToggle}
                      disabled={loading}
                    />
                    <span className="aoc-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scene Collections Tab */}
        {activeTab === 'collections' && (
          <div className="aoc-list-view">
            <div className="aoc-list-header">
              <h3>{t('aoc.sceneCollections', 'Scene Collections')}</h3>
            </div>
            <div className="aoc-list">
              {sceneCollections.map((collection: any) => {
                const name = collection.collectionName || collection;
                const isCurrent = name === currentSceneCollection || collection.current;
                return (
                  <div key={name} className={`aoc-list-item ${isCurrent ? 'current' : ''}`}>
                    <div className="aoc-list-item-content">
                      <span className="aoc-list-item-icon">📁</span>
                      <span className="aoc-list-item-name">{name}</span>
                      {isCurrent && <span className="aoc-current-badge">{t('aoc.current', 'Current')}</span>}
                    </div>
                    <div className="aoc-list-item-actions">
                      {isCurrent ? (
                        <span className="aoc-active-indicator">✓</span>
                      ) : (
                        <button
                          className="aoc-btn small"
                          onClick={() => handleCollectionChange(name)}
                          disabled={loading}
                        >
                          {t('aoc.switch', 'Switch')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div className="aoc-list-view">
            <div className="aoc-list-header">
              <h3>{t('aoc.profiles', 'Profiles')}</h3>
            </div>
            <div className="aoc-list">
              {profiles.map((profile: any) => {
                const name = profile.profileName || profile;
                const isCurrent = name === currentProfile || profile.current;
                return (
                  <div key={name} className={`aoc-list-item ${isCurrent ? 'current' : ''}`}>
                    <div className="aoc-list-item-content">
                      <span className="aoc-list-item-icon">⚙️</span>
                      <span className="aoc-list-item-name">{name}</span>
                      {isCurrent && <span className="aoc-current-badge">{t('aoc.current', 'Current')}</span>}
                    </div>
                    <div className="aoc-list-item-actions">
                      {isCurrent ? (
                        <span className="aoc-active-indicator">✓</span>
                      ) : (
                        <button
                          className="aoc-btn small"
                          onClick={() => handleProfileChange(name)}
                          disabled={loading}
                        >
                          {t('aoc.switch', 'Switch')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="aoc-stats-grid">
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.fps', 'FPS')}</span>
              <span className="aoc-stat-value">{stats.activeFps?.toFixed(1) || 0}</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.cpu', 'CPU Usage')}</span>
              <span className="aoc-stat-value">{stats.cpuUsage?.toFixed(1) || 0}%</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.memory', 'Memory')}</span>
              <span className="aoc-stat-value">{(stats.memoryUsage || 0).toFixed(0)} MB</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.freeDisk', 'Free Disk')}</span>
              <span className="aoc-stat-value">{(stats.freeDiskSpace || 0).toFixed(0)} MB</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.renderMissed', 'Render Missed')}</span>
              <span className="aoc-stat-value">{stats.renderMissedFrames || 0}</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.outputSkipped', 'Output Skipped')}</span>
              <span className="aoc-stat-value">{stats.outputSkippedFrames || 0}</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.avgFrameTime', 'Avg Frame Time')}</span>
              <span className="aoc-stat-value">{(stats.averageFrameTime || 0).toFixed(2)} ms</span>
            </div>
            <div className="aoc-stat-card">
              <span className="aoc-stat-label">{t('aoc.avgRenderTime', 'Avg Render Time')}</span>
              <span className="aoc-stat-value">{(stats.averageFrameRenderTime || 0).toFixed(2)} ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedOBSControls;