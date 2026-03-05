/**
 * V-Streaming Encoder Configuration Panel
 * Hardware encoding settings with NVENC, AMF, and QuickSync support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEncoding } from '../hooks/useEncoding';
import type {
  EncoderBackend,
  CodecType,
  EncoderPreset,
  RateControlMode,
  H264Profile,
  HEVCProfile,
  PresetConfig,
} from '../types/encoding';
import './EncoderConfiguration.css';

interface EncoderConfigurationProps {
  onClose?: () => void;
}

export const EncoderConfiguration: React.FC<EncoderConfigurationProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const encoder = useEncoding();

  const [activeTab, setActiveTab] = useState<'general' | 'advanced' | 'presets'>('general');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleBackendChange = async (backend: EncoderBackend) => {
    try {
      await encoder.setBackend(backend);
    } catch (error) {
      console.error('Failed to change backend:', error);
    }
  };

  const handleCodecChange = async (codec: CodecType) => {
    try {
      await encoder.setCodec(codec);
    } catch (error) {
      console.error('Failed to change codec:', error);
    }
  };

  const handleConfigUpdate = async (updates: Partial<typeof encoder.config>) => {
    try {
      await encoder.updateConfig(updates);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const handlePresetApply = async (preset: PresetConfig) => {
    try {
      await encoder.applyPreset(preset);
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  const handleResetDefaults = () => {
    encoder.resetToDefaults();
  };

  return (
    <div className="encoder-configuration">
      <div className="encoder-configuration-header">
        <h2>{t('encoder.title')}</h2>
        <div className="encoder-status-indicator">
          <span className={`status-dot ${encoder.status}`}></span>
          <span className="status-text">{t(`encoder.status.${encoder.status}`)}</span>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="encoder-configuration-tabs">
        <button
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          {t('encoder.tabs.general')}
        </button>
        <button
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          {t('encoder.tabs.advanced')}
        </button>
        <button
          className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          {t('encoder.tabs.presets')}
        </button>
      </div>

      <div className="encoder-configuration-content">
        {activeTab === 'general' && (
          <div className="encoder-tab-content">
            {/* Backend Selection */}
            <div className="config-section">
              <label className="config-label">{t('encoder.backend')}</label>
              <div className="backend-selector">
                {encoder.availableBackends.map((backend) => (
                  <button
                    key={backend.backend}
                    className={`backend-option ${
                      encoder.currentBackend === backend.backend ? 'active' : ''
                    }`}
                    onClick={() => handleBackendChange(backend.backend)}
                    disabled={!encoder.canChangeSettings}
                  >
                    <div className="backend-icon">
                      {backend.backend === 'nvenc' && '🟢'}
                      {backend.backend === 'amf' && '🔴'}
                      {backend.backend === 'quicksync' && '🔵'}
                      {backend.backend === 'software' && '💻'}
                    </div>
                    <div className="backend-info">
                      <div className="backend-name">{backend.name}</div>
                      <div className="backend-description">{backend.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Codec Selection */}
            <div className="config-section">
              <label className="config-label">{t('encoder.codec')}</label>
              <select
                className="config-select"
                value={encoder.currentCodec}
                onChange={(e) => handleCodecChange(e.target.value as CodecType)}
                disabled={!encoder.canChangeSettings}
              >
                {encoder.getCapabilities(encoder.currentBackend)?.supportedCodecs.map((codec) => (
                  <option key={codec} value={codec}>
                    {codec.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Selection */}
            <div className="config-section">
              <label className="config-label">{t('encoder.preset')}</label>
              <select
                className="config-select"
                value={encoder.config.preset}
                onChange={(e) => handleConfigUpdate({ preset: e.target.value as EncoderPreset })}
                disabled={!encoder.canChangeSettings}
              >
                <option value="p1">{t('encoder.presets.p1')}</option>
                <option value="p2">{t('encoder.presets.p2')}</option>
                <option value="p3">{t('encoder.presets.p3')}</option>
                <option value="p4">{t('encoder.presets.p4')}</option>
                <option value="p5">{t('encoder.presets.p5')}</option>
                <option value="p6">{t('encoder.presets.p6')}</option>
                <option value="p7">{t('encoder.presets.p7')}</option>
                <option value="p8">{t('encoder.presets.p8')}</option>
                <option value="p9">{t('encoder.presets.p9')}</option>
              </select>
            </div>

            {/* Rate Control Mode */}
            <div className="config-section">
              <label className="config-label">{t('encoder.rateControlMode')}</label>
              <select
                className="config-select"
                value={encoder.config.rateControlMode}
                onChange={(e) => handleConfigUpdate({ rateControlMode: e.target.value as RateControlMode })}
                disabled={!encoder.canChangeSettings}
              >
                <option value="cbr">{t('encoder.rateControlModes.cbr')}</option>
                <option value="vbr">{t('encoder.rateControlModes.vbr')}</option>
                <option value="cqp">{t('encoder.rateControlModes.cqp')}</option>
                <option value="vqvbr">{t('encoder.rateControlModes.vqvbr')}</option>
              </select>
            </div>

            {/* Bitrate */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.bitrate')} ({encoder.config.bitrate} kbps)
              </label>
              <input
                type="range"
                className="config-slider"
                min="1000"
                max="50000"
                step="100"
                value={encoder.config.bitrate}
                onChange={(e) => handleConfigUpdate({ bitrate: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
              <div className="bitrate-presets">
                <button onClick={() => handleConfigUpdate({ bitrate: 3000 })} disabled={!encoder.canChangeSettings}>
                  3 Mbps
                </button>
                <button onClick={() => handleConfigUpdate({ bitrate: 6000 })} disabled={!encoder.canChangeSettings}>
                  6 Mbps
                </button>
                <button onClick={() => handleConfigUpdate({ bitrate: 9000 })} disabled={!encoder.canChangeSettings}>
                  9 Mbps
                </button>
                <button onClick={() => handleConfigUpdate({ bitrate: 12000 })} disabled={!encoder.canChangeSettings}>
                  12 Mbps
                </button>
              </div>
            </div>

            {/* Keyframe Interval */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.keyframeInterval')} ({encoder.config.keyframeInterval}s)
              </label>
              <input
                type="range"
                className="config-slider"
                min="1"
                max="10"
                step="1"
                value={encoder.config.keyframeInterval}
                onChange={(e) => handleConfigUpdate({ keyframeInterval: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="encoder-tab-content">
            {/* H.264 Profile */}
            {encoder.currentCodec === 'h264' && (
              <div className="config-section">
                <label className="config-label">{t('encoder.h264Profile')}</label>
                <select
                  className="config-select"
                  value={encoder.config.profile}
                  onChange={(e) => handleConfigUpdate({ profile: e.target.value as H264Profile })}
                  disabled={!encoder.canChangeSettings}
                >
                  <option value="baseline">{t('encoder.profiles.baseline')}</option>
                  <option value="main">{t('encoder.profiles.main')}</option>
                  <option value="high">{t('encoder.profiles.high')}</option>
                  <option value="high444">{t('encoder.profiles.high444')}</option>
                </select>
              </div>
            )}

            {/* HEVC Profile */}
            {(encoder.currentCodec === 'hevc' || encoder.currentCodec === 'av1') && (
              <div className="config-section">
                <label className="config-label">{t('encoder.hevcProfile')}</label>
                <select
                  className="config-select"
                  value={encoder.config.profile}
                  onChange={(e) => handleConfigUpdate({ profile: e.target.value as HEVCProfile })}
                  disabled={!encoder.canChangeSettings}
                >
                  <option value="main">{t('encoder.profiles.main')}</option>
                  <option value="main10">{t('encoder.profiles.main10')}</option>
                  <option value="main12">{t('encoder.profiles.main12')}</option>
                </select>
              </div>
            )}

            {/* B-Frames */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.bFrames')} ({encoder.config.bFrames})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="4"
                step="1"
                value={encoder.config.bFrames}
                onChange={(e) => handleConfigUpdate({ bFrames: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>

            {/* Reference Frames */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.referenceFrames')} ({encoder.config.referenceFrames})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="16"
                step="1"
                value={encoder.config.referenceFrames}
                onChange={(e) => handleConfigUpdate({ referenceFrames: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>

            {/* Multipass */}
            <div className="config-section">
              <label className="config-label">{t('encoder.multipass')}</label>
              <select
                className="config-select"
                value={encoder.config.multipass}
                onChange={(e) => handleConfigUpdate({ multipass: e.target.value as 'disabled' | 'quarter' | 'full' })}
                disabled={!encoder.canChangeSettings}
              >
                <option value="disabled">{t('encoder.multipassModes.disabled')}</option>
                <option value="quarter">{t('encoder.multipassModes.quarter')}</option>
                <option value="full">{t('encoder.multipassModes.full')}</option>
              </select>
            </div>

            {/* Lookahead */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.lookahead')} ({encoder.config.lookahead})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="32"
                step="1"
                value={encoder.config.lookahead}
                onChange={(e) => handleConfigUpdate({ lookahead: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>

            {/* Adaptive Quantization */}
            <div className="config-section">
              <label className="config-checkbox-label">
                <input
                  type="checkbox"
                  checked={encoder.config.adaptiveQuantization}
                  onChange={(e) => handleConfigUpdate({ adaptiveQuantization: e.target.checked })}
                  disabled={!encoder.canChangeSettings}
                />
                {t('encoder.adaptiveQuantization')}
              </label>
            </div>

            {/* Psycho Visual Tuning */}
            {encoder.getCapabilities(encoder.currentBackend)?.features.find(
              f => f.name === 'Psycho Visual Tuning' && f.available
            ) && (
              <div className="config-section">
                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={encoder.config.psychoVisualTuning}
                    onChange={(e) => handleConfigUpdate({ psychoVisualTuning: e.target.checked })}
                    disabled={!encoder.canChangeSettings}
                  />
                  {t('encoder.psychoVisualTuning')}
                </label>
              </div>
            )}

            {/* Temporal AQ */}
            {encoder.getCapabilities(encoder.currentBackend)?.features.find(
              f => f.name === 'Temporal AQ' && f.available
            ) && (
              <div className="config-section">
                <label className="config-checkbox-label">
                  <input
                    type="checkbox"
                    checked={encoder.config.temporalAQ}
                    onChange={(e) => handleConfigUpdate({ temporalAQ: e.target.checked })}
                    disabled={!encoder.canChangeSettings}
                  />
                  {t('encoder.temporalAQ')}
                </label>
              </div>
            )}

            {/* Spatial AQ */}
            {encoder.getCapabilities(encoder.currentBackend)?.features.find(
              f => f.name === 'Spatial AQ' && f.available
            ) && (
              <div className="config-section">
                <label className="config-label">
                  {t('encoder.spatialAQ')} ({encoder.config.spatialAQ})
                </label>
                <input
                  type="range"
                  className="config-slider"
                  min="0"
                  max="50"
                  step="1"
                  value={encoder.config.spatialAQ}
                  onChange={(e) => handleConfigUpdate({ spatialAQ: parseInt(e.target.value) })}
                  disabled={!encoder.canChangeSettings}
                />
              </div>
            )}

            {/* Quality Control */}
            <div className="config-section">
              <label className="config-label">
                {t('encoder.minQp')} ({encoder.config.minQp})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="51"
                step="1"
                value={encoder.config.minQp}
                onChange={(e) => handleConfigUpdate({ minQp: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>

            <div className="config-section">
              <label className="config-label">
                {t('encoder.maxQp')} ({encoder.config.maxQp})
              </label>
              <input
                type="range"
                className="config-slider"
                min="0"
                max="51"
                step="1"
                value={encoder.config.maxQp}
                onChange={(e) => handleConfigUpdate({ maxQp: parseInt(e.target.value) })}
                disabled={!encoder.canChangeSettings}
              />
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="encoder-tab-content">
            <div className="presets-grid">
              {encoder.presetConfigs.map((preset) => (
                <button
                  key={preset.id}
                  className="preset-card"
                  onClick={() => handlePresetApply(preset)}
                  disabled={!encoder.canChangeSettings}
                >
                  <div className="preset-icon">{preset.icon}</div>
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-description">{preset.description}</div>
                  <div className="preset-recommendations">
                    {preset.recommendedFor.map((rec) => (
                      <span key={rec} className="preset-recommendation">
                        {rec}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="encoder-configuration-footer">
        <button className="secondary-button" onClick={handleResetDefaults} disabled={!encoder.canChangeSettings}>
          {t('encoder.resetToDefaults')}
        </button>
        {encoder.canChangeSettings && (
          <button
            className="primary-button"
            onClick={encoder.isRunning ? encoder.stopEncoding : encoder.startEncoding}
          >
            {encoder.isRunning ? t('encoder.stopEncoding') : t('encoder.startEncoding')}
          </button>
        )}
      </div>

      {/* Real-time Statistics */}
      {encoder.isRunning && (
        <div className="encoder-statistics-panel">
          <h3>{t('encoder.statistics.title')}</h3>
          <div className="statistics-grid">
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.fps')}</div>
              <div className="stat-value">{encoder.statistics.fps.toFixed(1)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.bitrate')}</div>
              <div className="stat-value">{encoder.statistics.bitrate.toFixed(0)} kbps</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.latency')}</div>
              <div className="stat-value">{encoder.statistics.latency.toFixed(1)} ms</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.cpu')}</div>
              <div className="stat-value">{encoder.statistics.cpuUsage.toFixed(1)}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.gpu')}</div>
              <div className="stat-value">{encoder.statistics.gpuUsage.toFixed(1)}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">{t('encoder.statistics.droppedFrames')}</div>
              <div className="stat-value">{encoder.statistics.droppedFrames}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};