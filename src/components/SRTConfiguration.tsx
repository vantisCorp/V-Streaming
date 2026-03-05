/**
 * V-Streaming SRT Configuration Panel
 * Secure Reliable Transport configuration for unstable connections
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSRT } from '../hooks/useSRT';
import type { SRTConnectionMode, SRTEncryptionType } from '../types/srt';
import './SRTConfiguration.css';

interface SRTConfigurationProps {
  onClose?: () => void;
}

export const SRTConfiguration: React.FC<SRTConfigurationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const srt = useSRT();

  const [activeTab, setActiveTab] = useState<'connection' | 'advanced' | 'statistics'>('connection');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9000');

  const handleConnect = async () => {
    if (!host || !port) return;
    try {
      await srt.connect(host, parseInt(port));
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await srt.disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleConfigUpdate = async (updates: Partial<typeof srt.config>) => {
    try {
      await srt.updateConfig(updates);
    } catch (error) {
      console.error('Config update failed:', error);
    }
  };

  const handleResetDefaults = () => {
    srt.resetToDefaults();
  };

  return (
    <div className="srt-configuration">
      <div className="srt-configuration-header">
        <h2>{t('srt.title')}</h2>
        <div className="srt-status-indicator">
          <span className={`status-dot ${srt.status}`}></span>
          <span className="status-text">{t(`srt.status.${srt.status}`)}</span>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="srt-configuration-tabs">
        <button
          className={`tab-button ${activeTab === 'connection' ? 'active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          {t('srt.tabs.connection')}
        </button>
        <button
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          {t('srt.tabs.advanced')}
        </button>
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          {t('srt.tabs.statistics')}
        </button>
      </div>

      <div className="srt-configuration-content">
        {activeTab === 'connection' && (
          <div className="srt-tab-content">
            {/* Connection Mode */}
            <div className="config-section">
              <label className="config-label">{t('srt.connectionMode')}</label>
              <select
                className="config-select"
                value={srt.config.mode}
                onChange={(e) => handleConfigUpdate({ mode: e.target.value as SRTConnectionMode })}
                disabled={!srt.canChangeSettings}
              >
                {srt.supportedModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(`srt.modes.${mode}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Address */}
            <div className="config-section">
              <label className="config-label">{t('srt.hostAddress')}</label>
              <input
                type="text"
                className="config-input"
                placeholder="srt://example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                disabled={srt.isConnected}
              />
            </div>

            {/* Port */}
            <div className="config-section">
              <label className="config-label">{t('srt.port')}</label>
              <input
                type="number"
                className="config-input"
                placeholder="9000"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={srt.isConnected}
              />
            </div>

            {/* Stream ID */}
            <div className="config-section">
              <label className="config-label">{t('srt.streamId')}</label>
              <input
                type="text"
                className="config-input"
                placeholder="V-Streaming SRT"
                value={srt.config.streamID}
                onChange={(e) => handleConfigUpdate({ streamID: e.target.value })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Latency */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.latency')} ({srt.config.latency}ms)
              </label>
              <input
                type="range"
                className="config-slider"
                min="20"
                max="2000"
                step="10"
                value={srt.config.latency}
                onChange={(e) => handleConfigUpdate({ latency: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
              <div className="slider-labels">
                <span>20ms</span>
                <span>1000ms</span>
                <span>2000ms</span>
              </div>
            </div>

            {/* Encryption */}
            <div className="config-section">
              <label className="config-checkbox-label">
                <input
                  type="checkbox"
                  checked={srt.config.encryption.enabled}
                  onChange={(e) => handleConfigUpdate({
                    encryption: { ...srt.config.encryption, enabled: e.target.checked }
                  })}
                  disabled={!srt.canChangeSettings}
                />
                {t('srt.encryption')}
              </label>
            </div>

            {srt.config.encryption.enabled && (
              <div className="config-section">
                <label className="config-label">{t('srt.encryptionType')}</label>
                <select
                  className="config-select"
                  value={srt.config.encryption.type}
                  onChange={(e) => handleConfigUpdate({
                    encryption: { ...srt.config.encryption, type: e.target.value as SRTEncryptionType }
                  })}
                  disabled={!srt.canChangeSettings}
                >
                  {srt.supportedEncryptions.filter(e => e !== 'none').map((type) => (
                    <option key={type} value={type}>
                      {t(`srt.encryptionTypes.${type}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {srt.config.encryption.enabled && (
              <div className="config-section">
                <label className="config-label">{t('srt.passphrase')}</label>
                <input
                  type="password"
                  className="config-input"
                  placeholder="••••••••"
                  value={srt.config.encryption.passphrase}
                  onChange={(e) => handleConfigUpdate({
                    encryption: { ...srt.config.encryption, passphrase: e.target.value }
                  })}
                  disabled={!srt.canChangeSettings}
                />
              </div>
            )}

            {/* Adaptive Bitrate */}
            <div className="config-section">
              <label className="config-checkbox-label">
                <input
                  type="checkbox"
                  checked={srt.config.adaptiveBitrate.enabled}
                  onChange={(e) => handleConfigUpdate({
                    adaptiveBitrate: { ...srt.config.adaptiveBitrate, enabled: e.target.checked }
                  })}
                  disabled={!srt.canChangeSettings}
                />
                {t('srt.adaptiveBitrate')}
              </label>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="srt-tab-content">
            {/* Peer Latency */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.peerLatency')} ({srt.config.peerLatency}ms)
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="2000"
                step="10"
                value={srt.config.peerLatency}
                onChange={(e) => handleConfigUpdate({ peerLatency: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Maximum Bandwidth */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.maxBandwidth')} ({srt.config.maxBW === -1 ? t('srt.unlimited') : `${srt.config.maxBW} Mbps`})
              </label>
              <input
                type="range"
                className="config-slider"
                min="1"
                max="100"
                step="1"
                value={srt.config.maxBW === -1 ? 100 : srt.config.maxBW}
                onChange={(e) => handleConfigUpdate({ maxBW: parseInt(e.target.value) === 100 ? -1 : parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Packet Size */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.packetSize')} ({srt.config.pktSize} bytes)
              </label>
              <input
                type="range"
                className="config-slider"
                min="188"
                max="1456"
                step="1"
                value={srt.config.pktSize}
                onChange={(e) => handleConfigUpdate({ pktSize: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Receive Buffer Size */}
            <div className="config-section">
              <label className="config-label">{t('srt.receiveBufferSize')}</label>
              <select
                className="config-select"
                value={srt.config.rcvBufSize}
                onChange={(e) => handleConfigUpdate({ rcvBufSize: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              >
                <option value={2048 * 1024}>2 MB</option>
                <option value={4096 * 1024}>4 MB</option>
                <option value={8192 * 1024}>8 MB</option>
                <option value={16384 * 1024}>16 MB</option>
              </select>
            </div>

            {/* Send Buffer Size */}
            <div className="config-section">
              <label className="config-label">{t('srt.sendBufferSize')}</label>
              <select
                className="config-select"
                value={srt.config.sndBufSize}
                onChange={(e) => handleConfigUpdate({ sndBufSize: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              >
                <option value={2048 * 1024}>2 MB</option>
                <option value={4096 * 1024}>4 MB</option>
                <option value={8192 * 1024}>8 MB</option>
                <option value={16384 * 1024}>16 MB</option>
              </select>
            </div>

            {/* Reconnect Attempts */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.reconnectAttempts')} ({srt.config.reconnectAttempts})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="10"
                step="1"
                value={srt.config.reconnectAttempts}
                onChange={(e) => handleConfigUpdate({ reconnectAttempts: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Reconnect Delay */}
            <div className="config-section">
              <label className="config-label">
                {t('srt.reconnectDelay')} ({srt.config.reconnectDelay}s)
              </label>
              <input
                type="range"
                className="config-slider"
                min="1"
                max="30"
                step="1"
                value={srt.config.reconnectDelay}
                onChange={(e) => handleConfigUpdate({ reconnectDelay: parseInt(e.target.value) })}
                disabled={!srt.canChangeSettings}
              />
            </div>

            {/* Adaptive Bitrate Settings */}
            {srt.config.adaptiveBitrate.enabled && (
              <>
                <div className="config-section">
                  <label className="config-label">
                    {t('srt.minBitrate')} ({srt.config.adaptiveBitrate.minBitrate} Mbps)
                  </label>
                  <input
                    type="range"
                    className="config-slider"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={srt.config.adaptiveBitrate.minBitrate}
                    onChange={(e) => handleConfigUpdate({
                      adaptiveBitrate: { ...srt.config.adaptiveBitrate, minBitrate: parseFloat(e.target.value) }
                    })}
                    disabled={!srt.canChangeSettings}
                  />
                </div>

                <div className="config-section">
                  <label className="config-label">
                    {t('srt.maxBitrate')} ({srt.config.adaptiveBitrate.maxBitrate} Mbps)
                  </label>
                  <input
                    type="range"
                    className="config-slider"
                    min="5"
                    max="50"
                    step="1"
                    value={srt.config.adaptiveBitrate.maxBitrate}
                    onChange={(e) => handleConfigUpdate({
                      adaptiveBitrate: { ...srt.config.adaptiveBitrate, maxBitrate: parseInt(e.target.value) }
                    })}
                    disabled={!srt.canChangeSettings}
                  />
                </div>

                <div className="config-section">
                  <label className="config-label">
                    {t('srt.targetLoss')} ({srt.config.adaptiveBitrate.targetLoss}%)
                  </label>
                  <input
                    type="range"
                    className="config-slider"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={srt.config.adaptiveBitrate.targetLoss}
                    onChange={(e) => handleConfigUpdate({
                      adaptiveBitrate: { ...srt.config.adaptiveBitrate, targetLoss: parseFloat(e.target.value) }
                    })}
                    disabled={!srt.canChangeSettings}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="srt-tab-content">
            {/* Connection Info */}
            {srt.connectionInfo && (
              <div className="connection-info-panel">
                <h3>{t('srt.connectionInfo.title')}</h3>
                <div className="connection-info-grid">
                  <div className="info-item">
                    <span className="info-label">{t('srt.connectionInfo.remoteAddress')}</span>
                    <span className="info-value">{srt.connectionInfo.remoteAddress}:{srt.connectionInfo.remotePort}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('srt.connectionInfo.mode')}</span>
                    <span className="info-value">{t(`srt.modes.${srt.connectionInfo.mode}`)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">{t('srt.connectionInfo.uptime')}</span>
                    <span className="info-value">{Math.floor(srt.statistics.uptime / 60)}m {Math.floor(srt.statistics.uptime % 60)}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Statistics */}
            <div className="statistics-panel">
              <h3>{t('srt.realtimeStatistics')}</h3>
              <div className="statistics-grid">
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.currentBitrate')}</div>
                  <div className="stat-value">{srt.statistics.currentBitrate.toFixed(2)} Mbps</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.averageBitrate')}</div>
                  <div className="stat-value">{srt.statistics.averageBitrate.toFixed(2)} Mbps</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.latency')}</div>
                  <div className="stat-value">{srt.statistics.networkLatency.toFixed(1)} ms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.jitter')}</div>
                  <div className="stat-value">{srt.statistics.jitter.toFixed(2)} ms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.packetLoss')}</div>
                  <div className="stat-value">{srt.statistics.packetLoss.toFixed(2)}%</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.rtt')}</div>
                  <div className="stat-value">{srt.statistics.qualityMetrics.rtt.toFixed(1)} ms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.packetsSent')}</div>
                  <div className="stat-value">{srt.statistics.qualityMetrics.packetsSent.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.packetsLost')}</div>
                  <div className="stat-value">{srt.statistics.qualityMetrics.packetsLost.toLocaleString()}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.droppedFrames')}</div>
                  <div className="stat-value">{srt.statistics.droppedFrames}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">{t('srt.stats.reconnects')}</div>
                  <div className="stat-value">{srt.statistics.reconnectCount}</div>
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="quality-metrics-panel">
              <h3>{t('srt.qualityMetrics')}</h3>
              <div className="metrics-bars">
                <div className="metric-bar">
                  <div className="metric-header">
                    <span>{t('srt.stats.linkBandwidth')}</span>
                    <span>{srt.statistics.qualityMetrics.linkBandwidth.toFixed(2)} Mbps</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill bandwidth" 
                      style={{ width: `${(srt.statistics.qualityMetrics.linkBandwidth / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="metric-bar">
                  <div className="metric-header">
                    <span>{t('srt.stats.packetLoss')}</span>
                    <span>{srt.statistics.packetLoss.toFixed(2)}%</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className={`bar-fill ${srt.statistics.packetLoss > 1 ? 'warning' : 'good'}`} 
                      style={{ width: `${Math.min(srt.statistics.packetLoss * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="srt-configuration-footer">
        <button className="secondary-button" onClick={handleResetDefaults} disabled={!srt.canChangeSettings}>
          {t('srt.resetToDefaults')}
        </button>
        {srt.isConnected ? (
          <button className="danger-button" onClick={handleDisconnect}>
            {t('srt.disconnect')}
          </button>
        ) : (
          <button 
            className="primary-button" 
            onClick={handleConnect}
            disabled={!host || !port || srt.isConnecting}
          >
            {srt.isConnecting ? t('srt.connecting') : t('srt.connect')}
          </button>
        )}
      </div>

      {/* Error Display */}
      {srt.errors.length > 0 && (
        <div className="srt-errors-panel">
          <h3>{t('srt.errors')}</h3>
          <div className="errors-list">
            {srt.errors.slice(-5).map((error, index) => (
              <div key={index} className="error-item">
                <span className="error-type">{error.type}</span>
                <span className="error-message">{error.message}</span>
                <button className="clear-errors" onClick={srt.clearErrors}>
                  {t('srt.clearErrors')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};