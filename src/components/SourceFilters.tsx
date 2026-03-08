/**
 * V-Streaming Source Filters Component
 * Manage audio/video filters for OBS sources
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import './SourceFilters.css';

interface SourceFiltersProps {
  onClose?: () => void;
}

const COMMON_FILTER_KINDS: Record<string, string> = {
  'color_filter': 'Color Correction',
  'color_key_filter': 'Color Key',
  'crop_filter': 'Crop/Pad',
  'gpu_delay_filter': 'Render Delay',
  'luma_key_filter': 'Luma Key',
  'mask_filter': 'Image Mask/Blend',
  'noise_gate_filter': 'Noise Gate',
  'noise_suppression_filter': 'Noise Suppression',
  'scale_filter': 'Scaling/Aspect Ratio',
  'scroll_filter': 'Scroll',
  'sharpness_filter': 'Sharpen',
  'chroma_key_filter': 'Chroma Key',
  'compressor_filter': 'Compressor',
  'limiter_filter': 'Limiter',
  'expander_filter': 'Expander',
  'gain_filter': 'Gain',
  'vst_filter': 'VST Plugin',
};

export const SourceFilters: React.FC<SourceFiltersProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    isConnected,
    sources,
    getSources,
    getSourceFilters,
    createSourceFilter,
    removeSourceFilter,
    setSourceFilterEnabled,
    setSourceFilterSettings,
  } = useOBSWebSocket();

  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [filters, setFilters] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterKind, setNewFilterKind] = useState('');
  const [editingFilter, setEditingFilter] = useState<any>(null);
  const [filterSettings, setFilterSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isConnected && !sources.length) {
      loadSources();
    }
  }, [isConnected]);

  useEffect(() => {
    if (selectedSource) {
      loadFilters();
    }
  }, [selectedSource]);

  const loadSources = async () => {
    setLoading(true);
    try {
      await getSources();
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
    setLoading(false);
  };

  const loadFilters = async () => {
    if (!selectedSource) return;
    setLoading(true);
    try {
      const result = await getSourceFilters(selectedSource);
      setFilters(result || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
      setFilters([]);
    }
    setLoading(false);
  };

  const handleAddFilter = async () => {
    if (!selectedSource || !newFilterName || !newFilterKind) return;
    setLoading(true);
    try {
      await createSourceFilter(selectedSource, newFilterName, newFilterKind, filterSettings);
      setShowAddDialog(false);
      setNewFilterName('');
      setNewFilterKind('');
      setFilterSettings({});
      await loadFilters();
    } catch (error) {
      console.error('Failed to add filter:', error);
    }
    setLoading(false);
  };

  const handleRemoveFilter = async (filterName: string) => {
    if (!selectedSource) return;
    setLoading(true);
    try {
      await removeSourceFilter(selectedSource, filterName);
      await loadFilters();
    } catch (error) {
      console.error('Failed to remove filter:', error);
    }
    setLoading(false);
  };

  const handleToggleFilter = async (filterName: string, enabled: boolean) => {
    if (!selectedSource) return;
    setLoading(true);
    try {
      await setSourceFilterEnabled(selectedSource, filterName, enabled);
      await loadFilters();
    } catch (error) {
      console.error('Failed to toggle filter:', error);
    }
    setLoading(false);
  };

  const handleEditFilter = (filter: any) => {
    setEditingFilter(filter);
    setFilterSettings(filter.filterSettings || {});
    setShowEditDialog(true);
  };

  const handleSaveFilterSettings = async () => {
    if (!selectedSource || !editingFilter) return;
    setLoading(true);
    try {
      await setSourceFilterSettings(selectedSource, editingFilter.filterName, filterSettings);
      setShowEditDialog(false);
      setEditingFilter(null);
      setFilterSettings({});
      await loadFilters();
    } catch (error) {
      console.error('Failed to save filter settings:', error);
    }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="source-filters">
        <div className="sf-warning">
          <span className="sf-warning-icon">⚠️</span>
          {t('obs.connectRequired', 'Connect to OBS to manage filters')}
        </div>
      </div>
    );
  }

  return (
    <div className="source-filters">
      <div className="sf-header">
        <div>
          <h2>{t('sf.title', 'Source Filters')}</h2>
          <p className="sf-subtitle">{t('sf.subtitle', 'Manage audio and video filters for sources')}</p>
        </div>
        <div className="sf-header-actions">
          <button className="sf-refresh-btn" onClick={loadFilters} disabled={!selectedSource || loading}>
            🔄 {t('common.refresh', 'Refresh')}
          </button>
          {onClose && (
            <button className="sf-close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      <div className="sf-source-selector">
        <label>{t('sf.selectSource', 'Select Source')}</label>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="">{t('sf.chooseSource', 'Choose a source...')}</option>
          {sources.map((source: any) => (
            <option key={source.sourceName} value={source.sourceName}>
              {source.sourceName} ({source.inputKind || 'scene'})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="sf-loading-bar" />}

      {selectedSource && (
        <>
          <div className="sf-actions">
            <button
              className="sf-btn primary"
              onClick={() => setShowAddDialog(true)}
              disabled={loading}
            >
              + {t('sf.addFilter', 'Add Filter')}
            </button>
          </div>

          {filters.length === 0 ? (
            <div className="sf-empty">
              <span className="sf-empty-icon">🔇</span>
              <p>{t('sf.noFilters', 'No filters applied to this source')}</p>
            </div>
          ) : (
            <div className="sf-filters-list">
              {filters.map((filter: any) => (
                <div
                  key={filter.filterName}
                  className={`sf-filter-item ${!filter.filterEnabled ? 'disabled' : ''}`}
                >
                  <div className="sf-filter-info">
                    <div className="sf-filter-header">
                      <span className="sf-filter-name">{filter.filterName}</span>
                      <span className="sf-filter-kind">{COMMON_FILTER_KINDS[filter.filterKind] || filter.filterKind}</span>
                    </div>
                    {!filter.filterEnabled && (
                      <span className="sf-disabled-badge">{t('sf.disabled', 'Disabled')}</span>
                    )}
                  </div>
                  <div className="sf-filter-actions">
                    <button
                      className={`sf-icon-btn ${filter.filterEnabled ? 'active' : ''}`}
                      onClick={() => handleToggleFilter(filter.filterName, !filter.filterEnabled)}
                      title={filter.filterEnabled ? t('sf.disable', 'Disable') : t('sf.enable', 'Enable')}
                    >
                      {filter.filterEnabled ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button
                      className="sf-icon-btn"
                      onClick={() => handleEditFilter(filter)}
                      title={t('sf.edit', 'Edit')}
                    >
                      ✏️
                    </button>
                    <button
                      className="sf-icon-btn danger"
                      onClick={() => handleRemoveFilter(filter.filterName)}
                      title={t('sf.remove', 'Remove')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Filter Dialog */}
      {showAddDialog && (
        <div className="sf-dialog-overlay">
          <div className="sf-dialog">
            <div className="sf-dialog-header">
              <h3>{t('sf.addFilter', 'Add Filter')}</h3>
              <button className="sf-dialog-close" onClick={() => setShowAddDialog(false)}>✕</button>
            </div>
            <div className="sf-dialog-content">
              <div className="sf-field">
                <label>{t('sf.filterName', 'Filter Name')}</label>
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder={t('sf.filterNamePlaceholder', 'Enter filter name')}
                />
              </div>
              <div className="sf-field">
                <label>{t('sf.filterType', 'Filter Type')}</label>
                <select
                  value={newFilterKind}
                  onChange={(e) => setNewFilterKind(e.target.value)}
                >
                  <option value="">{t('sf.selectType', 'Select type...')}</option>
                  {Object.entries(COMMON_FILTER_KINDS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sf-dialog-actions">
              <button className="sf-btn" onClick={() => setShowAddDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="sf-btn primary"
                onClick={handleAddFilter}
                disabled={!newFilterName || !newFilterKind || loading}
              >
                {t('sf.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Filter Dialog */}
      {showEditDialog && editingFilter && (
        <div className="sf-dialog-overlay">
          <div className="sf-dialog sf-dialog-large">
            <div className="sf-dialog-header">
              <h3>{t('sf.editFilter', 'Edit Filter')}: {editingFilter.filterName}</h3>
              <button className="sf-dialog-close" onClick={() => setShowEditDialog(false)}>✕</button>
            </div>
            <div className="sf-dialog-content">
              <p className="sf-dialog-hint">{t('sf.jsonHint', 'Filter settings are displayed as JSON. Edit the values below.')}</p>
              <textarea
                className="sf-json-input"
                value={JSON.stringify(filterSettings, null, 2)}
                onChange={(e) => {
                  try {
                    setFilterSettings(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, keep the text for editing
                  }
                }}
              />
            </div>
            <div className="sf-dialog-actions">
              <button className="sf-btn" onClick={() => setShowEditDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="sf-btn primary"
                onClick={handleSaveFilterSettings}
                disabled={loading}
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceFilters;