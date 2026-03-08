/**
 * RemoteDashboard - Remote stream management dashboard
 * Enables web-based remote control of streaming features
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  RemoteConnectionStatus,
  RemoteCommand,
  RemotePermission,
  RemoteScene,
  RemoteAudioSource,
  RemoteClient,
  RemoteServerConfig,
  RemoteChatMessage,
} from '../types/remote';
import { useRemoteManagement } from '../hooks/useRemoteManagement';
import './RemoteDashboard.css';

// Permission labels
const PERMISSION_LABELS: Record<RemotePermission, string> = {
  [RemotePermission.VIEW_ONLY]: '👁️ View Only',
  [RemotePermission.MODERATOR]: '🛡️ Moderator',
  [RemotePermission.EDITOR]: '✏️ Editor',
  [RemotePermission.ADMIN]: '🔑 Admin',
  [RemotePermission.OWNER]: '👑 Owner',
};

interface RemoteDashboardProps {
  className?: string;
}

export const RemoteDashboard: React.FC<RemoteDashboardProps> = ({
  className = '',
}) => {
  const remote = useRemoteManagement();
  
  // Local state
  const [showConfig, setShowConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // Config form state
  const [configForm, setConfigForm] = useState<Partial<RemoteServerConfig>>({});

  // Status text based on connection
  const statusText = useMemo(() => {
    switch (remote.status) {
      case RemoteConnectionStatus.CONNECTED:
        return 'Connected';
      case RemoteConnectionStatus.CONNECTING:
        return 'Starting...';
      case RemoteConnectionStatus.AUTHENTICATING:
        return 'Authenticating...';
      case RemoteConnectionStatus.AUTHENTICATED:
        return 'Authenticated';
      case RemoteConnectionStatus.ERROR:
        return 'Error';
      default:
        return 'Disconnected';
    }
  }, [remote.status]);

  const statusClass = useMemo(() => {
    switch (remote.status) {
      case RemoteConnectionStatus.CONNECTED:
      case RemoteConnectionStatus.AUTHENTICATED:
        return 'remote-dashboard__status--connected';
      case RemoteConnectionStatus.CONNECTING:
      case RemoteConnectionStatus.AUTHENTICATING:
        return 'remote-dashboard__status--connecting';
      default:
        return 'remote-dashboard__status--disconnected';
    }
  }, [remote.status]);

  // Handle start server
  const handleStartServer = useCallback(async () => {
    await remote.startServer();
  }, [remote]);

  // Handle stop server
  const handleStopServer = useCallback(async () => {
    await remote.stopServer();
  }, [remote]);

  // Handle copy URL
  const handleCopyUrl = useCallback(() => {
    if (remote.serverUrl) {
      navigator.clipboard.writeText(remote.serverUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  }, [remote.serverUrl]);

  // Handle regenerate token
  const handleRegenerateToken = useCallback(() => {
    const newToken = remote.regenerateAccessToken();
    navigator.clipboard.writeText(newToken);
  }, [remote]);

  // Handle config change
  const handleConfigChange = useCallback((key: keyof RemoteServerConfig, value: unknown) => {
    setConfigForm(prev => ({ ...prev, [key]: value }));
    remote.updateConfig({ [key]: value });
  }, [remote]);

  // Handle scene switch
  const handleSceneSwitch = useCallback(async (sceneId: string) => {
    await remote.switchScene(sceneId);
  }, [remote]);

  // Handle volume change
  const handleVolumeChange = useCallback(async (sourceId: string, volume: number) => {
    await remote.setVolume(sourceId, volume);
  }, [remote]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(async (sourceId: string) => {
    await remote.toggleMute(sourceId);
  }, [remote]);

  // Handle disconnect client
  const handleDisconnectClient = useCallback((clientId: string) => {
    remote.disconnectClient(clientId);
  }, [remote]);

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`remote-dashboard ${className}`}>
      {/* Header */}
      <div className="remote-dashboard__header">
        <h2 className="remote-dashboard__title">🌐 Remote Management</h2>
        <div className={`remote-dashboard__status ${statusClass}`}>
          <span className="remote-dashboard__status-dot" />
          {statusText}
        </div>
      </div>

      {/* Error Display */}
      {remote.error && (
        <div className="remote-dashboard__error">
          <span>⚠️</span>
          {remote.error}
        </div>
      )}

      {/* Server Control Section */}
      <div className="remote-dashboard__server-control">
        {/* Connection Info Card */}
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Connection Info</h3>
          
          {remote.isServerRunning ? (
            <div className="remote-dashboard__connection-info">
              <div className="remote-dashboard__url-display">
                <span>🔗</span>
                <span style={{ flex: 1 }}>{remote.serverUrl}</span>
                <button 
                  className="remote-dashboard__copy-btn"
                  onClick={handleCopyUrl}
                >
                  {copiedUrl ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              
              {remote.serverConfig.authRequired && (
                <div className="remote-dashboard__url-display">
                  <span>🔑</span>
                  <span style={{ flex: 1 }}>Token: {remote.serverConfig.accessToken}</span>
                  <button 
                    className="remote-dashboard__copy-btn"
                    onClick={handleRegenerateToken}
                  >
                    Regenerate
                  </button>
                </div>
              )}
              
              <div className="remote-dashboard__qr-container">
                <div className="remote-dashboard__qr-code">
                  {remote.qrCode ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📱</div>
                      <div>Scan to connect</div>
                      <div style={{ fontSize: '0.625rem', marginTop: '4px', color: '#666' }}>
                        QR code ready
                      </div>
                    </div>
                  ) : (
                    'QR Code unavailable'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="remote-dashboard__empty">
              <p>Server is not running</p>
              <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                Start the server to enable remote access
              </p>
            </div>
          )}
        </div>

        {/* Control Panel Card */}
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Control Panel</h3>
          
          <div className="remote-dashboard__controls">
            {!remote.isServerRunning ? (
              <button 
                className="remote-dashboard__btn remote-dashboard__btn--primary"
                onClick={handleStartServer}
                disabled={remote.isLoading}
              >
                {remote.isLoading ? 'Starting...' : '▶️ Start Server'}
              </button>
            ) : (
              <button 
                className="remote-dashboard__btn remote-dashboard__btn--danger"
                onClick={handleStopServer}
                disabled={remote.isLoading}
              >
                ⏹️ Stop Server
              </button>
            )}
            
            <button 
              className="remote-dashboard__btn remote-dashboard__btn--secondary"
              onClick={() => setShowConfig(!showConfig)}
            >
              ⚙️ {showConfig ? 'Hide' : 'Show'} Configuration
            </button>
          </div>

          {showConfig && (
            <div className="remote-dashboard__config" style={{ marginTop: '16px' }}>
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Port</label>
                <input 
                  type="number"
                  className="remote-dashboard__config-input"
                  value={configForm.port ?? remote.serverConfig.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  disabled={remote.isServerRunning}
                />
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Max Connections</label>
                <input 
                  type="number"
                  className="remote-dashboard__config-input"
                  value={configForm.maxConnections ?? remote.serverConfig.maxConnections}
                  onChange={(e) => handleConfigChange('maxConnections', parseInt(e.target.value))}
                />
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Session Timeout (s)</label>
                <input 
                  type="number"
                  className="remote-dashboard__config-input"
                  value={configForm.sessionTimeout ?? remote.serverConfig.sessionTimeout}
                  onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Rate Limit/min</label>
                <input 
                  type="number"
                  className="remote-dashboard__config-input"
                  value={configForm.rateLimit ?? remote.serverConfig.rateLimit}
                  onChange={(e) => handleConfigChange('rateLimit', parseInt(e.target.value))}
                />
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Require Authentication</label>
                <div className="remote-dashboard__config-toggle">
                  <div 
                    className={`remote-dashboard__toggle ${(configForm.authRequired ?? remote.serverConfig.authRequired) ? 'remote-dashboard__toggle--active' : ''}`}
                    onClick={() => handleConfigChange('authRequired', !remote.serverConfig.authRequired)}
                  >
                    <div className="remote-dashboard__toggle-knob" />
                  </div>
                  <span>{(configForm.authRequired ?? remote.serverConfig.authRequired) ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Enable HTTPS</label>
                <div className="remote-dashboard__config-toggle">
                  <div 
                    className={`remote-dashboard__toggle ${(configForm.httpsEnabled ?? remote.serverConfig.httpsEnabled) ? 'remote-dashboard__toggle--active' : ''}`}
                    onClick={() => handleConfigChange('httpsEnabled', !remote.serverConfig.httpsEnabled)}
                  >
                    <div className="remote-dashboard__toggle-knob" />
                  </div>
                  <span>{(configForm.httpsEnabled ?? remote.serverConfig.httpsEnabled) ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              <div className="remote-dashboard__config-item">
                <label className="remote-dashboard__config-label">Enable CORS</label>
                <div className="remote-dashboard__config-toggle">
                  <div 
                    className={`remote-dashboard__toggle ${(configForm.corsEnabled ?? remote.serverConfig.corsEnabled) ? 'remote-dashboard__toggle--active' : ''}`}
                    onClick={() => handleConfigChange('corsEnabled', !remote.serverConfig.corsEnabled)}
                  >
                    <div className="remote-dashboard__toggle-knob" />
                  </div>
                  <span>{(configForm.corsEnabled ?? remote.serverConfig.corsEnabled) ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stream Status */}
      {remote.streamStatus && (
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Stream Status</h3>
          <div className="remote-dashboard__stream-status">
            <div className="remote-dashboard__stat">
              <div className="remote-dashboard__stat-value">
                {remote.streamStatus.isStreaming ? '🔴 LIVE' : '⚫ OFFLINE'}
              </div>
              <div className="remote-dashboard__stat-label">Status</div>
            </div>
            <div className="remote-dashboard__stat">
              <div className="remote-dashboard__stat-value">
                {remote.streamStatus.viewerCount.toLocaleString()}
              </div>
              <div className="remote-dashboard__stat-label">Viewers</div>
            </div>
            <div className="remote-dashboard__stat">
              <div className="remote-dashboard__stat-value">
                {remote.streamStatus.bitrate} kbps
              </div>
              <div className="remote-dashboard__stat-label">Bitrate</div>
            </div>
            <div className="remote-dashboard__stat">
              <div className="remote-dashboard__stat-value">
                {formatUptime(remote.streamStatus.uptime)}
              </div>
              <div className="remote-dashboard__stat-label">Uptime</div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div style={{ marginTop: '16px' }}>
            <h4 className="remote-dashboard__card-title">Quick Actions</h4>
            <div className="remote-dashboard__quick-actions">
              <button 
                className={`remote-dashboard__action-btn ${remote.streamStatus.isStreaming ? 'remote-dashboard__action-btn--active' : ''}`}
                onClick={() => remote.streamStatus?.isStreaming ? remote.stopStream() : remote.startStream()}
                disabled={!remote.isServerRunning}
              >
                {remote.streamStatus.isStreaming ? '⏹️ Stop Stream' : '▶️ Start Stream'}
              </button>
              <button 
                className="remote-dashboard__action-btn"
                onClick={() => remote.startRecording()}
                disabled={!remote.isServerRunning}
              >
                ⏺️ Start Recording
              </button>
              <button 
                className="remote-dashboard__action-btn"
                onClick={() => remote.stopRecording()}
                disabled={!remote.isServerRunning}
              >
                ⏹️ Stop Recording
              </button>
              <button 
                className="remote-dashboard__action-btn"
                onClick={() => remote.takeSnapshot()}
                disabled={!remote.isServerRunning}
              >
                📸 Snapshot
              </button>
              <button 
                className="remote-dashboard__action-btn"
                onClick={() => remote.startBreak()}
                disabled={!remote.isServerRunning}
              >
                ☕ Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenes */}
      {remote.dashboardData?.scenes && (
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Scenes</h3>
          <div className="remote-dashboard__scenes">
            {remote.dashboardData.scenes.map((scene: RemoteScene) => (
              <div 
                key={scene.id}
                className={`remote-dashboard__scene ${scene.isCurrent ? 'remote-dashboard__scene--active' : ''}`}
                onClick={() => handleSceneSwitch(scene.id)}
              >
                <div className="remote-dashboard__scene-name">{scene.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Sources */}
      {remote.dashboardData?.audioSources && (
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Audio Mixer</h3>
          <div className="remote-dashboard__audio">
            {remote.dashboardData.audioSources.map((source: RemoteAudioSource) => (
              <div key={source.id} className="remote-dashboard__audio-source">
                <div className="remote-dashboard__audio-name">{source.name}</div>
                <div className="remote-dashboard__audio-level">
                  <div 
                    className="remote-dashboard__audio-level-bar"
                    style={{ width: `${(source.level ?? 0) * 100}%` }}
                  />
                </div>
                <div className="remote-dashboard__audio-controls">
                  <input 
                    type="range"
                    className="remote-dashboard__volume-slider"
                    min="0"
                    max="1"
                    step="0.01"
                    value={source.volume}
                    onChange={(e) => handleVolumeChange(source.id, parseFloat(e.target.value))}
                  />
                  <button 
                    className={`remote-dashboard__mute-btn ${source.muted ? 'remote-dashboard__mute-btn--muted' : ''}`}
                    onClick={() => handleMuteToggle(source.id)}
                  >
                    {source.muted ? '🔇' : '🔊'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Clients */}
      {remote.isServerRunning && (
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">
            Connected Clients ({remote.clients.length})
          </h3>
          {remote.clients.length > 0 ? (
            <div className="remote-dashboard__clients">
              {remote.clients.map((client: RemoteClient) => (
                <div key={client.id} className="remote-dashboard__client">
                  <div className="remote-dashboard__client-info">
                    <div className="remote-dashboard__client-name">
                      {client.name || `Client ${client.id.slice(0, 8)}`}
                    </div>
                    <div className="remote-dashboard__client-meta">
                      {PERMISSION_LABELS[client.permission]} • 
                      Connected {new Date(client.connectedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="remote-dashboard__client-actions">
                    <button 
                      className="remote-dashboard__client-btn remote-dashboard__client-btn--danger"
                      onClick={() => handleDisconnectClient(client.id)}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="remote-dashboard__empty">
              No clients connected
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {remote.isServerRunning && (
        <div className="remote-dashboard__card">
          <h3 className="remote-dashboard__card-title">Statistics</h3>
          <div className="remote-dashboard__statistics">
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {remote.statistics.totalConnections}
              </div>
              <div className="remote-dashboard__stat-item-label">Total Connections</div>
            </div>
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {remote.clients.length}
              </div>
              <div className="remote-dashboard__stat-item-label">Active Sessions</div>
            </div>
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {remote.statistics.totalCommands}
              </div>
              <div className="remote-dashboard__stat-item-label">Commands Executed</div>
            </div>
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {remote.statistics.averageResponseTime.toFixed(0)} ms
              </div>
              <div className="remote-dashboard__stat-item-label">Avg Response Time</div>
            </div>
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {formatUptime(remote.statistics.uptime)}
              </div>
              <div className="remote-dashboard__stat-item-label">Uptime</div>
            </div>
            <div className="remote-dashboard__stat-item">
              <div className="remote-dashboard__stat-item-value">
                {remote.statistics.errorsCount}
              </div>
              <div className="remote-dashboard__stat-item-label">Errors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoteDashboard;