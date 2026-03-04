/**
 * Audio Mixer Settings Component
 * UI component for managing audio mixer with VST plugin support
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAudioMixer } from '../hooks/useAudioMixer';
import { useTranslation } from 'react-i18next';
import { CreateSourceOptions, CreateBusOptions, LoadVSTPluginOptions, AudioSourceType, AudioFilter, AudioFilterType } from '../types/audioMixer';
import './AudioMixerSettings.css';

interface AudioMixerSettingsProps {
  onClose: () => void;
}

export const AudioMixerSettings: React.FC<AudioMixerSettingsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    state,
    config,
    sources,
    buses,
    vstPlugins,
    presets,
    stats,
    activePreset,
    updateConfig,
    createSource,
    deleteSource,
    setSourceVolume,
    setSourceMuted,
    setSourceSolo,
    createBus,
    deleteBus,
    setBusVolume,
    loadPlugin,
    unloadPlugin,
    setPluginBypass,
    savePreset,
    loadPreset,
    deletePreset,
    getMeteringLevels,
    hasSources,
    hasPlugins,
  } = useAudioMixer({ autoRefresh: true, refreshInterval: 100 });

  const [activeTab, setActiveTab] = useState<'mixer' | 'plugins' | 'presets' | 'settings'>('mixer');
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddBus, setShowAddBus] = useState(false);
  const [showAddPlugin, setShowAddPlugin] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [sourceForm, setSourceForm] = useState<CreateSourceOptions>({
    name: '',
    type: 'microphone',
    channelType: 'stereo',
  });

  const [busForm, setBusForm] = useState<CreateBusOptions>({
    name: '',
    type: 'aux',
  });

  const [pluginForm, setPluginForm] = useState<LoadVSTPluginOptions>({
    path: '',
    name: '',
    type: 'effect',
  });

  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
  });

  // Handle volume change
  const handleVolumeChange = useCallback((id: string, isBus: boolean, volume: number) => {
    const vol = volume / 100;
    if (isBus) {
      setBusVolume(id, vol);
    } else {
      setSourceVolume(id, vol);
    }
  }, [setSourceVolume, setBusVolume]);

  // Create source
  const handleCreateSource = useCallback(async () => {
    if (!sourceForm.name) {
      setError('Source name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createSource(sourceForm);
      setShowAddSource(false);
      setSourceForm({ name: '', type: 'microphone', channelType: 'stereo' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source');
    } finally {
      setLoading(false);
    }
  }, [sourceForm, createSource]);

  // Delete source
  const handleDeleteSource = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSource(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete source');
    } finally {
      setLoading(false);
    }
  }, [deleteSource]);

  // Create bus
  const handleCreateBus = useCallback(async () => {
    if (!busForm.name) {
      setError('Bus name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createBus(busForm);
      setShowAddBus(false);
      setBusForm({ name: '', type: 'aux' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bus');
    } finally {
      setLoading(false);
    }
  }, [busForm, createBus]);

  // Delete bus
  const handleDeleteBus = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this bus?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteBus(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bus');
    } finally {
      setLoading(false);
    }
  }, [deleteBus]);

  // Load plugin
  const handleLoadPlugin = useCallback(async () => {
    if (!pluginForm.path) {
      setError('Plugin path is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadPlugin(pluginForm);
      setShowAddPlugin(false);
      setPluginForm({ path: '', name: '', type: 'effect' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugin');
    } finally {
      setLoading(false);
    }
  }, [pluginForm, loadPlugin]);

  // Save preset
  const handleSavePreset = useCallback(async () => {
    if (!presetForm.name) {
      setError('Preset name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await savePreset(presetForm.name, presetForm.description);
      setShowSavePreset(false);
      setPresetForm({ name: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setLoading(false);
    }
  }, [presetForm, savePreset]);

  // Load preset
  const handleLoadPreset = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await loadPreset(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preset');
    } finally {
      setLoading(false);
    }
  }, [loadPreset]);

  // Delete preset
  const handleDeletePreset = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deletePreset(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete preset');
    } finally {
      setLoading(false);
    }
  }, [deletePreset]);

  // Format volume for display
  const formatVolume = (volume: number): string => {
    return Math.round(volume * 100).toString();
  };

  // Format meters
  const formatMeter = (level: number): number => {
    return Math.min(100, Math.max(0, level * 100));
  };

  return (
    <div className="audio-mixer-modal">
      <div className="audio-mixer-modal-content">
        {/* Header */}
        <div className="audio-mixer-header">
          <h2>
            <span>🎛️</span>
            {t('audioMixer.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="audio-mixer-tabs">
          <button
            className={activeTab === 'mixer' ? 'active' : ''}
            onClick={() => setActiveTab('mixer')}
          >
            {t('audioMixer.mixer')}
          </button>
          <button
            className={activeTab === 'plugins' ? 'active' : ''}
            onClick={() => setActiveTab('plugins')}
          >
            {t('audioMixer.plugins')}
          </button>
          <button
            className={activeTab === 'presets' ? 'active' : ''}
            onClick={() => setActiveTab('presets')}
          >
            {t('audioMixer.presets')}
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            {t('audioMixer.settings')}
          </button>
        </div>

        {/* Content */}
        <div className="audio-mixer-content">
          {error && (
            <div style={{ color: '#ef4444', padding: '12px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {/* Mixer Tab */}
          {activeTab === 'mixer' && (
            <div className="audio-mixer-section active">
              <div className="audio-mixer-toolbar">
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value">{stats.totalSources}</div>
                    <div className="stat-label">{t('audioMixer.sources')}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{stats.totalBuses}</div>
                    <div className="stat-label">{t('audioMixer.buses')}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{Math.round(stats.cpuUsage)}%</div>
                    <div className="stat-label">{t('audioMixer.cpu')}</div>
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => setShowAddSource(true)}
                    disabled={loading}
                  >
                    <span>➕</span>
                    {t('audioMixer.addSource')}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setShowAddBus(true)}
                    disabled={loading}
                  >
                    <span>➕</span>
                    {t('audioMixer.addBus')}
                  </button>
                </div>
              </div>

              <div className="mixer-grid">
                {/* Sources */}
                {sources.map(source => {
                  const levels = getMeteringLevels(source.id) || { peak: 0, rms: 0 };
                  return (
                    <div key={source.id} className={`channel-strip ${source.type === 'master' as any ? 'master' : ''}`}>
                      <div className="channel-strip-header">
                        <div className="name">{source.name}</div>
                        <div className="type">{source.type}</div>
                        <div className="actions">
                          <button onClick={() => handleDeleteSource(source.id)} title={t('audioMixer.delete')}>
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="meter">
                        <div className="meter-bar" style={{ height: `${formatMeter(levels.peak)}%` }} />
                        <div className="meter-label">Peak</div>
                        <div className="meter-db">{formatMeter(levels.peak)}%</div>
                      </div>

                      <div className="volume-control">
                        <label>{t('audioMixer.volume')}</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formatVolume(source.volume)}
                          onChange={(e) => handleVolumeChange(source.id, false, parseFloat(e.target.value))}
                          disabled={loading}
                        />
                      </div>

                      <div className="channel-controls">
                        <button
                          className={`muted ${source.muted ? 'active' : ''}`}
                          onClick={() => setSourceMuted(source.id, !source.muted)}
                          disabled={loading}
                        >
                          {t('audioMixer.mute')}
                        </button>
                        <button
                          className={`solo ${source.solo ? 'active' : ''}`}
                          onClick={() => setSourceSolo(source.id, !source.solo)}
                          disabled={loading}
                        >
                          {t('audioMixer.solo')}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Buses */}
                {buses.map(bus => {
                  const levels = getMeteringLevels(bus.id) || { peak: 0, rms: 0 };
                  return (
                    <div key={bus.id} className={`channel-strip ${bus.type === 'master' ? 'master' : ''}`}>
                      <div className="channel-strip-header">
                        <div className="name">{bus.name}</div>
                        <div className="type">{bus.type}</div>
                        <div className="actions">
                          {bus.type !== 'master' && (
                            <button onClick={() => handleDeleteBus(bus.id)} title={t('audioMixer.delete')}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="meter">
                        <div className="meter-bar" style={{ height: `${formatMeter(levels.peak)}%` }} />
                        <div className="meter-label">Peak</div>
                        <div className="meter-db">{formatMeter(levels.peak)}%</div>
                      </div>

                      <div className="volume-control">
                        <label>{t('audioMixer.volume')}</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formatVolume(bus.volume)}
                          onChange={(e) => handleVolumeChange(bus.id, true, parseFloat(e.target.value))}
                          disabled={loading}
                        />
                      </div>

                      <div className="channel-controls">
                        <button
                          className={`muted ${bus.muted ? 'active' : ''}`}
                          onClick={() => {
                            const updatedBus = buses.find(b => b.id === bus.id);
                            if (updatedBus) {
                              setBusVolume(bus.id, updatedBus.muted ? 1 : 0);
                            }
                          }}
                          disabled={loading}
                        >
                          {t('audioMixer.mute')}
                        </button>
                        <button
                          className={`solo ${bus.solo ? 'active' : ''}`}
                          onClick={() => {
                            const updatedBus = buses.find(b => b.id === bus.id);
                            if (updatedBus) {
                              // Toggle solo (simplified)
                            }
                          }}
                          disabled={loading}
                        >
                          {t('audioMixer.solo')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!hasSources() && !showAddSource && (
                <div className="empty-state">
                  <h3>{t('audioMixer.noSources')}</h3>
                  <p>{t('audioMixer.addSourceHint')}</p>
                </div>
              )}
            </div>
          )}

          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <div className="audio-mixer-section active">
              <div className="audio-mixer-toolbar">
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value">{stats.totalPlugins}</div>
                    <div className="stat-label">{t('audioMixer.plugins')}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">{stats.activePlugins}</div>
                    <div className="stat-label">{t('audioMixer.active')}</div>
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => setShowAddPlugin(true)}
                    disabled={loading}
                  >
                    <span>➕</span>
                    {t('audioMixer.loadPlugin')}
                  </button>
                </div>
              </div>

              <div className="plugin-list">
                {vstPlugins.map(plugin => (
                  <div key={plugin.id} className="plugin-item">
                    <div className="plugin-item-info">
                      <div className="plugin-item-name">{plugin.name}</div>
                      <div className="plugin-item-type">{plugin.type} - {plugin.vendor}</div>
                    </div>
                    <div className={`plugin-item-status ${plugin.status}`}>
                      {plugin.status}
                    </div>
                    <div className="plugin-item-actions">
                      {plugin.status === 'loaded' && (
                        <button
                          className="bypass"
                          onClick={() => setPluginBypass(plugin.id, !plugin.bypassed)}
                          disabled={loading}
                        >
                          {plugin.bypassed ? t('audioMixer.unbypass') : t('audioMixer.bypass')}
                        </button>
                      )}
                      <button
                        className="delete"
                        onClick={() => unloadPlugin(plugin.id)}
                        disabled={loading}
                      >
                        {t('audioMixer.unload')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!hasPlugins() && !showAddPlugin && (
                <div className="empty-state">
                  <h3>{t('audioMixer.noPlugins')}</h3>
                  <p>{t('audioMixer.loadPluginHint')}</p>
                </div>
              )}
            </div>
          )}

          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="audio-mixer-section active">
              <div className="audio-mixer-toolbar">
                <div className="stats">
                  <div className="stat">
                    <div className="stat-value">{presets.length}</div>
                    <div className="stat-label">{t('audioMixer.presets')}</div>
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => setShowSavePreset(true)}
                    disabled={loading}
                  >
                    <span>💾</span>
                    {t('audioMixer.savePreset')}
                  </button>
                </div>
              </div>

              <div className="preset-list">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className={`preset-card ${activePreset === preset.id ? 'active' : ''}`}
                    onClick={() => handleLoadPreset(preset.id)}
                  >
                    <div className="preset-card-header">
                      <div className="preset-card-name">{preset.name}</div>
                      {preset.isDefault && <div className="preset-card-badge">{t('audioMixer.default')}</div>}
                    </div>
                    <div className="preset-card-description">{preset.description}</div>
                    <div className="preset-card-meta">
                      <span>{t('audioMixer.sources')}: {preset.sources.length}</span>
                      <span>{t('audioMixer.plugins')}: {preset.vstPlugins.length}</span>
                    </div>
                    {!preset.isDefault && (
                      <button
                        className="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
                        }}
                        disabled={loading}
                      >
                        {t('audioMixer.delete')}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {presets.length === 0 && !showSavePreset && (
                <div className="empty-state">
                  <h3>{t('audioMixer.noPresets')}</h3>
                  <p>{t('audioMixer.savePresetHint')}</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="audio-mixer-section active">
              <div className="settings-section">
                <div className="setting-group">
                  <h3>{t('audioMixer.audioSettings')}</h3>
                  <div className="setting-row">
                    <label>{t('audioMixer.sampleRate')}</label>
                    <select
                      value={config.sampleRate}
                      onChange={(e) => updateConfig({ sampleRate: parseInt(e.target.value) })}
                    >
                      <option value="44100">44.1 kHz</option>
                      <option value="48000">48 kHz</option>
                      <option value="96000">96 kHz</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <label>{t('audioMixer.bufferSize')}</label>
                    <select
                      value={config.bufferSize}
                      onChange={(e) => updateConfig({ bufferSize: parseInt(e.target.value) })}
                    >
                      <option value="128">128 samples</option>
                      <option value="256">256 samples</option>
                      <option value="512">512 samples</option>
                      <option value="1024">1024 samples</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>{t('audioMixer.monitoring')}</h3>
                  <div className="setting-row">
                    <label>{t('audioMixer.monitoringEnabled')}</label>
                    <input
                      type="checkbox"
                      checked={config.monitoringEnabled}
                      onChange={(e) => updateConfig({ monitoringEnabled: e.target.checked })}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('audioMixer.autoRouting')}</label>
                    <input
                      type="checkbox"
                      checked={config.autoRouting}
                      onChange={(e) => updateConfig({ autoRouting: e.target.checked })}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('audioMixer.syncWithStream')}</label>
                    <input
                      type="checkbox"
                      checked={config.syncWithStream}
                      onChange={(e) => updateConfig({ syncWithStream: e.target.checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Source Form */}
        {showAddSource && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}>
            <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
              <h3 style={{ color: '#fff', margin: '0 0 20px 0' }}>{t('audioMixer.addSource')}</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.sourceName')}</label>
                <input
                  type="text"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                  placeholder={t('audioMixer.sourceNamePlaceholder')}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.sourceType')}</label>
                <select
                  value={sourceForm.type}
                  onChange={(e) => setSourceForm({ ...sourceForm, type: e.target.value as AudioSourceType })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="microphone">{t('audioMixer.sourceTypes.microphone')}</option>
                  <option value="desktop">{t('audioMixer.sourceTypes.desktop')}</option>
                  <option value="music">{t('audioMixer.sourceTypes.music')}</option>
                  <option value="media">{t('audioMixer.sourceTypes.media')}</option>
                  <option value="game">{t('audioMixer.sourceTypes.game')}</option>
                  <option value="browser">{t('audioMixer.sourceTypes.browser')}</option>
                  <option value="custom">{t('audioMixer.sourceTypes.custom')}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAddSource(false)}
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateSource}
                  disabled={loading || !sourceForm.name}
                  style={{ flex: 1, padding: '12px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Bus Form */}
        {showAddBus && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}>
            <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
              <h3 style={{ color: '#fff', margin: '0 0 20px 0' }}>{t('audioMixer.addBus')}</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.busName')}</label>
                <input
                  type="text"
                  value={busForm.name}
                  onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                  placeholder={t('audioMixer.busNamePlaceholder')}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.busType')}</label>
                <select
                  value={busForm.type}
                  onChange={(e) => setBusForm({ ...busForm, type: e.target.value as any })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="aux">{t('audioMixer.busTypes.aux')}</option>
                  <option value="monitor">{t('audioMixer.busTypes.monitor')}</option>
                  <option value="record">{t('audioMixer.busTypes.record')}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAddBus(false)}
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateBus}
                  disabled={loading || !busForm.name}
                  style={{ flex: 1, padding: '12px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Plugin Form */}
        {showAddPlugin && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}>
            <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
              <h3 style={{ color: '#fff', margin: '0 0 20px 0' }}>{t('audioMixer.loadPlugin')}</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.pluginPath')}</label>
                <input
                  type="text"
                  value={pluginForm.path}
                  onChange={(e) => setPluginForm({ ...pluginForm, path: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                  placeholder={t('audioMixer.pluginPathPlaceholder')}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.pluginName')}</label>
                <input
                  type="text"
                  value={pluginForm.name}
                  onChange={(e) => setPluginForm({ ...pluginForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                  placeholder={t('audioMixer.pluginNamePlaceholder')}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAddPlugin(false)}
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleLoadPlugin}
                  disabled={loading || !pluginForm.path}
                  style={{ flex: 1, padding: '12px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('audioMixer.load')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Preset Form */}
        {showSavePreset && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}>
            <div style={{ background: '#1a1a2e', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
              <h3 style={{ color: '#fff', margin: '0 0 20px 0' }}>{t('audioMixer.savePreset')}</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.presetName')}</label>
                <input
                  type="text"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                  placeholder={t('audioMixer.presetNamePlaceholder')}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>{t('audioMixer.description')}</label>
                <textarea
                  value={presetForm.description}
                  onChange={(e) => setPresetForm({ ...presetForm, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#16162e', border: '1px solid #333', borderRadius: '6px', color: '#fff', minHeight: '80px' }}
                  placeholder={t('audioMixer.descriptionPlaceholder')}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowSavePreset(false)}
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={loading || !presetForm.name}
                  style={{ flex: 1, padding: '12px', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('audioMixer.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};