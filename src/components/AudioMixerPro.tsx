/**
 * V-Streaming Audio Mixer Pro Component
 * Advanced audio mixing interface with effects and visualization
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioMixerPro } from '../hooks/useAudioMixerPro';
import type {
  AudioTrack,
  AudioFilter,
  VisualizationMode,
  AudioFilterType,
} from '../types/audioMixerPro';
import {
  audioFilterDisplayNames,
  visualizationModeDisplayNames,
} from '../types/audioMixerPro';
import './AudioMixerPro.css';

interface AudioMixerProProps {
  onClose?: () => void;
}

export const AudioMixerPro: React.FC<AudioMixerProProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const audio = useAudioMixerPro();

  const [activeTab, setActiveTab] = useState<'mixer' | 'effects' | 'settings' | 'scenes'>('mixer');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('vu_meter' as VisualizationMode);

  const selectedTrack = selectedTrackId 
    ? audio.tracks.find(t => t.id === selectedTrackId)
    : null;

  const formatDb = (db: number): string => {
    if (db <= -120) return '-∞';
    return `${db.toFixed(1)} dB`;
  };

  const getMeterHeight = (db: number): number => {
    const min = -60;
    const max = 0;
    const clamped = Math.max(min, Math.min(max, db));
    return ((clamped - min) / (max - min)) * 100;
  };

  const getMeterColor = (db: number): string => {
    if (db > -6) return '#e74c3c';
    if (db > -12) return '#f39c12';
    if (db > -24) return '#f1c40f';
    return '#2ecc71';
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    audio.updateTrack(trackId, { volume });
  };

  const handlePanChange = (trackId: string, pan: number) => {
    audio.updateTrack(trackId, { pan });
  };

  const handleMuteToggle = (trackId: string) => {
    const track = audio.tracks.find(t => t.id === trackId);
    if (track) {
      audio.updateTrack(trackId, { mute: !track.mute });
    }
  };

  const handleSoloToggle = (trackId: string) => {
    const track = audio.tracks.find(t => t.id === trackId);
    if (track) {
      audio.updateTrack(trackId, { solo: !track.solo });
    }
  };

  const handleAddFilter = (trackId: string, filterType: AudioFilterType) => {
    const filterSettings: any = {};
    
    // Add default settings based on filter type
    if (filterType === 'compressor') {
      Object.assign(filterSettings, {
        threshold: -24,
        ratio: 4,
        attack: 5,
        release: 100,
        knee: 6,
        makeupGain: 0,
      });
    } else if (filterType === 'reverb') {
      Object.assign(filterSettings, {
        roomSize: 0.5,
        damping: 0.5,
        wetLevel: 0.3,
        dryLevel: 0.7,
        width: 1,
        preDelay: 10,
        decay: 2,
      });
    } else if (filterType === 'eq_10band') {
      Object.assign(filterSettings, {
        bands: Array(10).fill(null).map(() => ({
          frequency: 0,
          gain: 0,
          q: 1.4,
          type: 'peaking',
        })),
      });
    }

    audio.addFilter(trackId, {
      type: filterType,
      enabled: true,
      order: 0,
      settings: filterSettings,
      wetDry: 1,
    });
  };

  return (
    <div className="audio-mixer-pro">
      <div className="amp-header">
        <div>
          <h2>{t('amp.title')}</h2>
          <p className="amp-subtitle">{t('amp.subtitle')}</p>
        </div>
        <div className="amp-stats">
          <div className="amp-stat">
            <span className="amp-stat-label">{t('amp.cpu')}</span>
            <span className="amp-stat-value">{audio.stats.cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="amp-stat">
            <span className="amp-stat-label">{t('amp.dsp')}</span>
            <span className="amp-stat-value">{audio.stats.dspLoad.toFixed(1)}%</span>
          </div>
          <div className="amp-stat">
            <span className="amp-stat-label">{t('amp.latency')}</span>
            <span className="amp-stat-value">{audio.stats.totalLatency} ms</span>
          </div>
        </div>
      </div>

      <div className="amp-tabs">
        <button
          className={`amp-tab ${activeTab === 'mixer' ? 'active' : ''}`}
          onClick={() => setActiveTab('mixer')}
        >
          {t('amp.tabs.mixer')}
        </button>
        <button
          className={`amp-tab ${activeTab === 'effects' ? 'active' : ''}`}
          onClick={() => setActiveTab('effects')}
        >
          {t('amp.tabs.effects')}
        </button>
        <button
          className={`amp-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('amp.tabs.settings')}
        </button>
        <button
          className={`amp-tab ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenes')}
        >
          {t('amp.tabs.scenes')}
        </button>
      </div>

      <div className="amp-tab-content">
        {/* Mixer Tab */}
        {activeTab === 'mixer' && (
          <div className="amp-mixer">
            <div className="amp-tracks-container">
              {audio.tracks.map(track => (
                <div
                  key={track.id}
                  className={`amp-track ${selectedTrackId === track.id ? 'selected' : ''} ${track.mute ? 'muted' : ''} ${track.solo ? 'soloed' : ''}`}
                  onClick={() => setSelectedTrackId(track.id)}
                  style={{ '--track-color': track.color } as any}
                >
                  {/* Track Header */}
                  <div className="amp-track-header">
                    <input
                      type="text"
                      className="amp-track-name"
                      value={track.name}
                      onChange={(e) => audio.updateTrack(track.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="amp-track-controls">
                      <button
                        className={`amp-control-btn ${track.mute ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleMuteToggle(track.id); }}
                        title={t('amp.mute')}
                      >
                        M
                      </button>
                      <button
                        className={`amp-control-btn ${track.solo ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSoloToggle(track.id); }}
                        title={t('amp.solo')}
                      >
                        S
                      </button>
                      {track.type !== 'master' && (
                        <button
                          className="amp-control-btn delete"
                          onClick={(e) => { e.stopPropagation(); audio.removeTrack(track.id); }}
                          title={t('amp.remove')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Volume Fader */}
                  <div className="amp-fader-section">
                    <div className="amp-fader-label">{t('amp.volume')}</div>
                    <div className="amp-fader-container">
                      <input
                        type="range"
                        className="amp-fader"
                        min={0}
                        max={1.5}
                        step={0.01}
                        value={track.volume}
                        onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="amp-volume-display">
                      {formatDb(20 * Math.log10(track.volume))}
                    </div>
                  </div>

                  {/* Pan Control */}
                  <div className="amp-pan-section">
                    <div className="amp-pan-label">{t('amp.pan')}</div>
                    <div className="amp-pan-container">
                      <input
                        type="range"
                        className="amp-pan-slider"
                        min={-1}
                        max={1}
                        step={0.01}
                        value={track.pan}
                        onChange={(e) => handlePanChange(track.id, parseFloat(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="amp-pan-display">
                      {track.pan === 0 ? 'C' : track.pan < 0 ? `L ${Math.abs(track.pan * 100).toFixed(0)}%` : `R ${Math.abs(track.pan * 100).toFixed(0)}%`}
                    </div>
                  </div>

                  {/* Level Meters */}
                  <div className="amp-meters">
                    <div className="amp-meter">
                      <div
                        className="amp-meter-fill"
                        style={{
                          height: `${getMeterHeight(track.peakL)}%`,
                          backgroundColor: getMeterColor(track.peakL),
                        }}
                      />
                      <div className="amp-meter-marker -6">-6</div>
                      <div className="amp-meter-marker -18">-18</div>
                      <div className="amp-meter-marker -36">-36</div>
                      <div className="amp-meter-marker -60">-60</div>
                      {track.clipping && <div className="amp-clip-indicator">!</div>}
                    </div>
                    <div className="amp-meter">
                      <div
                        className="amp-meter-fill"
                        style={{
                          height: `${getMeterHeight(track.peakR)}%`,
                          backgroundColor: getMeterColor(track.peakR),
                        }}
                      />
                      <div className="amp-meter-marker -6">-6</div>
                      <div className="amp-meter-marker -18">-18</div>
                      <div className="amp-meter-marker -36">-36</div>
                      <div className="amp-meter-marker -60">-60</div>
                      {track.clipping && <div className="amp-clip-indicator">!</div>}
                    </div>
                  </div>

                  {/* Track Type Badge */}
                  <div className="amp-track-type">
                    {track.type === 'master' && t('amp.master')}
                    {track.type === 'input' && t('amp.input')}
                    {track.type === 'media' && t('amp.media')}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Track Button */}
            <button
              className="amp-add-track-btn"
              onClick={() => audio.addTrack({
                name: `Track ${audio.tracks.length}`,
                type: 'input',
                volume: 1.0,
                pan: 0,
                mute: false,
                solo: false,
                peakL: -120,
                peakR: -120,
                rmsL: -120,
                rmsR: -120,
                clipping: false,
                filters: [],
                outputId: 'master',
                sends: [],
                monitoring: false,
                monitoringType: 'off',
                color: '#9b59b6',
              })}
            >
              + {t('amp.addTrack')}
            </button>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && selectedTrack && (
          <div className="amp-effects">
            <div className="amp-effects-header">
              <h3>{t('amp.effectsFor')}: {selectedTrack.name}</h3>
              <select
                className="amp-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddFilter(selectedTrack.id, e.target.value as AudioFilterType);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">{t('amp.addFilter')}...</option>
                {(Object.keys(audioFilterDisplayNames) as AudioFilterType[]).map(type => (
                  <option key={type} value={type}>{audioFilterDisplayNames[type]}</option>
                ))}
              </select>
            </div>

            <div className="amp-effects-chain">
              {selectedTrack.filters.length === 0 && (
                <div className="amp-empty-state">
                  <p>{t('amp.noEffects')}</p>
                </div>
              )}
              
              {selectedTrack.filters.map((filter, index) => (
                <div key={filter.id} className="amp-effect-item">
                  <div className="amp-effect-header">
                    <div className="amp-effect-name">
                      <button
                        className={`amp-effect-toggle ${filter.enabled ? 'active' : ''}`}
                        onClick={() => audio.updateFilter(selectedTrack.id, filter.id, { enabled: !filter.enabled })}
                      >
                        {filter.enabled ? '●' : '○'}
                      </button>
                      {audioFilterDisplayNames[filter.type]}
                    </div>
                    <div className="amp-effect-controls">
                      <input
                        type="range"
                        className="amp-effect-wet-dry"
                        min={0}
                        max={1}
                        step={0.01}
                        value={filter.wetDry}
                        onChange={(e) => audio.updateFilter(selectedTrack.id, filter.id, { wetDry: parseFloat(e.target.value) })}
                        title={t('amp.wetDry')}
                      />
                      <button
                        className="amp-effect-remove"
                        onClick={() => audio.removeFilter(selectedTrack.id, filter.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {/* Filter-specific controls would go here */}
                  <div className="amp-effect-settings">
                    <p className="amp-effect-placeholder">
                      {t('amp.effectSettings', { type: audioFilterDisplayNames[filter.type] })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="amp-settings">
            <div className="amp-section">
              <h3 className="amp-section-title">{t('amp.audioSettings')}</h3>
              
              <div className="amp-row">
                <div className="amp-col">
                  <label className="amp-label">{t('amp.sampleRate')}</label>
                  <select
                    className="amp-select"
                    value={audio.settings.sampleRate}
                    onChange={(e) => audio.updateSettings({ sampleRate: parseInt(e.target.value) as any })}
                  >
                    <option value={44100}>44.1 kHz</option>
                    <option value={48000}>48 kHz</option>
                    <option value={96000}>96 kHz</option>
                    <option value={192000}>192 kHz</option>
                  </select>
                </div>
                <div className="amp-col">
                  <label className="amp-label">{t('amp.bitDepth')}</label>
                  <select
                    className="amp-select"
                    value={audio.settings.bitDepth}
                    onChange={(e) => audio.updateSettings({ bitDepth: parseInt(e.target.value) as any })}
                  >
                    <option value={16}>16 bit</option>
                    <option value={24}>24 bit</option>
                    <option value={32}>32 bit</option>
                    <option value={64}>64 bit</option>
                  </select>
                </div>
              </div>

              <div className="amp-row">
                <div className="amp-col">
                  <label className="amp-label">{t('amp.bufferSize')}</label>
                  <select
                    className="amp-select"
                    value={audio.settings.bufferLength}
                    onChange={(e) => audio.updateSettings({ bufferLength: parseInt(e.target.value) })}
                  >
                    <option value={128}>128 samples</option>
                    <option value={256}>256 samples</option>
                    <option value={512}>512 samples</option>
                    <option value={1024}>1024 samples</option>
                  </select>
                </div>
                <div className="amp-col">
                  <label className="amp-label">{t('amp.processingQuality')}</label>
                  <select
                    className="amp-select"
                    value={audio.settings.processingQuality}
                    onChange={(e) => audio.updateSettings({ processingQuality: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="amp-section">
              <h3 className="amp-section-title">{t('amp.visualization')}</h3>
              
              <div className="amp-row">
                <div className="amp-col">
                  <label className="amp-label">{t('amp.visualizationMode')}</label>
                  <select
                    className="amp-select"
                    value={visualizationMode}
                    onChange={(e) => setVisualizationMode(e.target.value as VisualizationMode)}
                  >
                    {(Object.keys(visualizationModeDisplayNames) as VisualizationMode[]).map(mode => (
                      <option key={mode} value={mode}>{visualizationModeDisplayNames[mode]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenes Tab */}
        {activeTab === 'scenes' && (
          <div className="amp-scenes">
            <div className="amp-scenes-header">
              <h3>{t('amp.scenes')}</h3>
              <button
                className="amp-button amp-button-primary"
                onClick={() => {
                  const scene = audio.saveScene(`Scene ${audio.scenes.length + 1}`);
                  console.log('Scene saved:', scene);
                }}
              >
                + {t('amp.saveScene')}
              </button>
            </div>

            <div className="amp-scenes-list">
              {audio.scenes.length === 0 && (
                <div className="amp-empty-state">
                  <p>{t('amp.noScenes')}</p>
                </div>
              )}
              
              {audio.scenes.map(scene => (
                <div key={scene.id} className="amp-scene-item">
                  <div className="amp-scene-info">
                    <h4>{scene.name}</h4>
                    {scene.description && <p>{scene.description}</p>}
                    <span className="amp-scene-date">
                      {new Date(scene.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="amp-scene-actions">
                    <button
                      className="amp-button amp-button-secondary"
                      onClick={() => audio.loadScene(scene.id)}
                    >
                      {t('amp.load')}
                    </button>
                    <button
                      className="amp-button amp-button-danger"
                      onClick={() => audio.deleteScene(scene.id)}
                    >
                      {t('amp.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {onClose && (
        <button className="amp-close-button" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};