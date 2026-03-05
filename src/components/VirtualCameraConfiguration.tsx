/**
 * V-Streaming Virtual Camera Configuration Panel
 * Virtual camera output configuration for video conferencing applications
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualCamera } from '../hooks/useVirtualCamera';
import type {
  VirtualCameraConfig,
  SourceType,
  QualityPreset,
  ResolutionPreset,
  FrameRate,
  AspectRatio,
  OutputFormat,
} from '../types/virtualCamera';
import {
  frameRateDisplayNames,
  outputFormatDisplayNames,
  qualityPresetDisplayNames,
} from '../types/virtualCamera';
import './VirtualCameraConfiguration.css';

interface VirtualCameraConfigurationProps {
  onClose?: () => void;
}

export const VirtualCameraConfiguration: React.FC<VirtualCameraConfigurationProps> = ({ 
  onClose 
}) => {
  const { t } = useTranslation();
  const vcam = useVirtualCamera();

  const [activeTab, setActiveTab] = useState<'general' | 'advanced' | 'statistics'>('general');

  const handleStart = async () => {
    try {
      await vcam.start();
    } catch (error) {
      console.error('Failed to start virtual camera:', error);
    }
  };

  const handleStop = async () => {
    try {
      await vcam.stop();
    } catch (error) {
      console.error('Failed to stop virtual camera:', error);
    }
  };

  const handleRestart = async () => {
    try {
      await vcam.restart();
    } catch (error) {
      console.error('Failed to restart virtual camera:', error);
    }
  };

  const handleConfigChange = (updates: Partial<VirtualCameraConfig>) => {
    vcam.updateConfig(updates);
  };

  const handleQualityPresetChange = (preset: QualityPreset) => {
    vcam.updateConfig({ qualityPreset: preset });
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeClass = () => {
    switch (vcam.status) {
      case 'running':
        return 'success';
      case 'starting':
      case 'stopping':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="vcam-configuration">
      <div className="vcam-header">
        <div>
          <h2>{t('vcam.title')}</h2>
          <p className="vcam-subtitle">{t('vcam.subtitle')}</p>
        </div>
        <div className={`vcam-status-indicator ${vcam.status}`}>
          <div className="vcam-status-dot"></div>
          <span>{t(`vcam.status.${vcam.status}`)}</span>
        </div>
      </div>

      <div className="vcam-tabs">
        <button
          className={`vcam-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          {t('vcam.tabs.general')}
        </button>
        <button
          className={`vcam-tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          {t('vcam.tabs.advanced')}
        </button>
        <button
          className={`vcam-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          {t('vcam.tabs.statistics')}
        </button>
      </div>

      <div className="vcam-tab-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.deviceSettings')}</h3>
              
              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.device')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.deviceId}
                    onChange={(e) => handleConfigChange({ deviceId: e.target.value })}
                  >
                    {vcam.devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name} {device.isDefault ? `(Default)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.qualityPresets')}</h3>
              
              <div className="vcam-card-grid">
                {(Object.keys(qualityPresetDisplayNames) as QualityPreset[]).map((preset) => (
                  <div
                    key={preset}
                    className={`vcam-card ${vcam.config.qualityPreset === preset ? 'selected' : ''}`}
                    onClick={() => handleQualityPresetChange(preset)}
                  >
                    <h4 className="vcam-card-title">{qualityPresetDisplayNames[preset]}</h4>
                    <p className="vcam-card-description">
                      {t(`vcam.qualityPresets.${preset}`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.sourceSettings')}</h3>
              
              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.source')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.sourceId || ''}
                    onChange={(e) => {
                      const source = vcam.sources.find(s => s.id === e.target.value);
                      if (source) {
                        handleConfigChange({ sourceId: source.id, sourceName: source.name, sourceType: source.type });
                      }
                    }}
                  >
                    {vcam.sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="vcam-controls">
              <button
                className={`vcam-button vcam-button-primary ${vcam.isRunning ? 'vcam-button-stop' : ''}`}
                onClick={vcam.isRunning ? handleStop : handleStart}
                disabled={vcam.isStarting || vcam.isStopping}
              >
                {vcam.isRunning ? t('vcam.stop') : t('vcam.start')}
              </button>
              {vcam.isRunning && (
                <button
                  className="vcam-button vcam-button-secondary"
                  onClick={handleRestart}
                  disabled={vcam.isStopping}
                >
                  {t('vcam.restart')}
                </button>
              )}
            </div>
          </>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <>
            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.resolutionSettings')}</h3>
              
              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.resolutionPreset')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.resolution.preset}
                    onChange={(e) => handleConfigChange({ 
                      resolution: { ...vcam.config.resolution, preset: e.target.value as ResolutionPreset }
                    })}
                  >
                    <option value="1280x720">HD 720p</option>
                    <option value="1920x1080">FHD 1080p</option>
                    <option value="2560x1440">QHD 1440p</option>
                    <option value="3840x2160">UHD 4K</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.aspectRatio')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.resolution.aspectRatio}
                    onChange={(e) => handleConfigChange({ 
                      resolution: { ...vcam.config.resolution, aspectRatio: e.target.value as AspectRatio }
                    })}
                  >
                    <option value="16:9">16:9</option>
                    <option value="16:10">16:10</option>
                    <option value="4:3">4:3</option>
                    <option value="1:1">1:1</option>
                    <option value="9:16">9:16</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.frameRate')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.frameRate}
                    onChange={(e) => handleConfigChange({ frameRate: parseInt(e.target.value) as FrameRate })}
                  >
                    {(Object.keys(frameRateDisplayNames) as unknown as FrameRate[]).map((fps) => (
                      <option key={fps} value={String(fps)}>
                        {frameRateDisplayNames[fps]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.outputFormat')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.outputFormat}
                    onChange={(e) => handleConfigChange({ outputFormat: e.target.value as OutputFormat })}
                  >
                    {(Object.keys(outputFormatDisplayNames) as OutputFormat[]).map((format) => (
                      <option key={format} value={format}>
                        {outputFormatDisplayNames[format]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.bitrateSettings')}</h3>
              
              <div className="vcam-slider-container">
                <label className="vcam-label">
                  {t('vcam.bitrate')}
                  <span className="vcam-slider-value">
                    {vcam.config.bitrate} <span>kbps</span>
                  </span>
                </label>
                <input
                  type="range"
                  className="vcam-slider"
                  min="1000"
                  max="20000"
                  step="100"
                  value={vcam.config.bitrate}
                  onChange={(e) => handleConfigChange({ bitrate: parseInt(e.target.value) })}
                />
                <div className="vcam-slider-value">
                  <span>1000 kbps</span>
                  <span>20000 kbps</span>
                </div>
              </div>

              <div className="vcam-slider-container">
                <label className="vcam-label">
                  {t('vcam.keyframeInterval')}
                  <span className="vcam-slider-value">
                    {vcam.config.keyframeInterval} <span>seconds</span>
                  </span>
                </label>
                <input
                  type="range"
                  className="vcam-slider"
                  min="1"
                  max="10"
                  step="1"
                  value={vcam.config.keyframeInterval}
                  onChange={(e) => handleConfigChange({ keyframeInterval: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.advancedSettings')}</h3>
              
              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-checkbox-group">
                    <input
                      type="checkbox"
                      className="vcam-checkbox"
                      checked={vcam.config.useHardwareAcceleration}
                      onChange={(e) => handleConfigChange({ useHardwareAcceleration: e.target.checked })}
                    />
                    <span className="vcam-checkbox-label">{t('vcam.useHardwareAcceleration')}</span>
                  </label>
                </div>
                <div className="vcam-col">
                  <label className="vcam-checkbox-group">
                    <input
                      type="checkbox"
                      className="vcam-checkbox"
                      checked={vcam.config.includeAudio}
                      onChange={(e) => handleConfigChange({ includeAudio: e.target.checked })}
                    />
                    <span className="vcam-checkbox-label">{t('vcam.includeAudio')}</span>
                  </label>
                </div>
              </div>

              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-checkbox-group">
                    <input
                      type="checkbox"
                      className="vcam-checkbox"
                      checked={vcam.config.autoRestart}
                      onChange={(e) => handleConfigChange({ autoRestart: e.target.checked })}
                    />
                    <span className="vcam-checkbox-label">{t('vcam.autoRestart')}</span>
                  </label>
                </div>
                <div className="vcam-col">
                  <label className="vcam-checkbox-group">
                    <input
                      type="checkbox"
                      className="vcam-checkbox"
                      checked={vcam.config.hideFromCapture}
                      onChange={(e) => handleConfigChange({ hideFromCapture: e.target.checked })}
                    />
                    <span className="vcam-checkbox-label">{t('vcam.hideFromCapture')}</span>
                  </label>
                </div>
              </div>

              <div className="vcam-row">
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.bufferSize')}</label>
                  <input
                    type="number"
                    className="vcam-input"
                    min="1"
                    max="10"
                    value={vcam.config.bufferSize}
                    onChange={(e) => handleConfigChange({ bufferSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="vcam-col">
                  <label className="vcam-label">{t('vcam.priority')}</label>
                  <select
                    className="vcam-select"
                    value={vcam.config.priority}
                    onChange={(e) => handleConfigChange({ priority: e.target as any })}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="realtime">Realtime</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <>
            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.connectionStatistics')}</h3>
              
              <div className="vcam-stats-grid">
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.status')}</div>
                  <div className="vcam-stat-value">
                    <span className={`vcam-badge ${getStatusBadgeClass()}`}>
                      {t(`vcam.status.${vcam.status}`)}
                    </span>
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.uptime')}</div>
                  <div className="vcam-stat-value">
                    {formatUptime(vcam.stats.uptime)}
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.frameRate')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.frameRate}
                    <span className="vcam-stat-unit">FPS</span>
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.bitrate')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.currentBitrate}
                    <span className="vcam-stat-unit">kbps</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.performanceStatistics')}</h3>
              
              <div className="vcam-stats-grid">
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.cpuUsage')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.cpuUsage}
                    <span className="vcam-stat-unit">%</span>
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.gpuUsage')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.gpuUsage}
                    <span className="vcam-stat-unit">%</span>
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.memoryUsage')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.memoryUsage}
                    <span className="vcam-stat-unit">MB</span>
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.averageFrameTime')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.averageFrameTime}
                    <span className="vcam-stat-unit">ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vcam-section">
              <h3 className="vcam-section-title">{t('vcam.frameStatistics')}</h3>
              
              <div className="vcam-stats-grid">
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.framesRendered')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.framesRendered}
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.framesDropped')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.framesDropped}
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.errorCount')}</div>
                  <div className="vcam-stat-value">
                    {vcam.stats.errorCount}
                  </div>
                </div>
                <div className="vcam-stat-item">
                  <div className="vcam-stat-label">{t('vcam.lastError')}</div>
                  <div className="vcam-stat-value" style={{ fontSize: '14px' }}>
                    {vcam.stats.lastError || t('vcam.noErrors')}
                  </div>
                </div>
              </div>
            </div>

            <div className="vcam-controls">
              <button
                className="vcam-button vcam-button-secondary"
                onClick={() => vcam.resetConfig()}
              >
                {t('vcam.resetDefaults')}
              </button>
            </div>
          </>
        )}
      </div>

      {onClose && (
        <button className="vcam-close-button" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};