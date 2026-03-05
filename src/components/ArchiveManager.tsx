/**
 * ArchiveManager - UI component for managing stream archives
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useArchive } from '../hooks/useArchive';
import {
  Archive,
  ArchiveStatus,
  ArchiveFormat,
  ArchiveQuality,
  ArchiveCategory,
  ArchiveSortOption,
  ArchiveSearchFilters,
  ARCHIVE_CATEGORIES,
  ARCHIVE_FORMATS,
  ARCHIVE_QUALITIES,
  ARCHIVE_SORT_OPTIONS,
} from '../types/archive';
import './ArchiveManager.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface ArchiveManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'archives' | 'recording' | 'import' | 'settings';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1073741824) {
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusColor = (status: ArchiveStatus): string => {
  switch (status) {
    case ArchiveStatus.RECORDING:
      return '#ef4444';
    case ArchiveStatus.PROCESSING:
      return '#f59e0b';
    case ArchiveStatus.COMPLETED:
      return '#22c55e';
    case ArchiveStatus.FAILED:
      return '#dc2626';
    case ArchiveStatus.UPLOADING:
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ArchiveManager: React.FC<ArchiveManagerProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    archives,
    currentRecording,
    statistics,
    isRecording,
    recordingConfig,
    storageConfig,
    autoDeleteConfig,
    startRecording,
    stopRecording,
    toggleFavorite,
    toggleProtection,
    deleteArchive,
    uploadArchive,
    downloadArchive,
    searchArchives,
    sortArchives,
    updateRecordingConfig,
    updateStorageConfig,
    updateAutoDeleteConfig,
  } = useArchive();

  const [activeTab, setActiveTab] = useState<TabType>('archives');
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ArchiveSortOption>(ArchiveSortOption.DATE_DESC);
  const [selectedArchives, setSelectedArchives] = useState<Set<string>>(new Set());

  // ============================================================================
  // FILTERED AND SORTED ARCHIVES
  // ============================================================================

  const filteredArchives = useMemo(() => {
    const filters: ArchiveSearchFilters = {};
    
    if (searchQuery) {
      filters.query = searchQuery;
    }
    
    if (selectedCategory !== 'all') {
      filters.category = selectedCategory as ArchiveCategory;
    }
    
    if (selectedStatus !== 'all') {
      filters.status = selectedStatus as ArchiveStatus;
    }

    let result = searchArchives(filters);
    result = sortArchives(result, sortBy);
    
    return result;
  }, [archives, searchQuery, selectedCategory, selectedStatus, sortBy, searchArchives, sortArchives]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartRecording = () => {
    startRecording({
      title: `Stream ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      endTime: new Date(),
      peakViewers: 0,
      avgViewers: 0,
      followers: 0,
      messages: 0,
    });
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const handleToggleProtection = (id: string) => {
    toggleProtection(id);
  };

  const handleDeleteArchive = (id: string) => {
    if (window.confirm(t('archiveManager.deleteConfirm'))) {
      deleteArchive(id);
      if (selectedArchive?.id === id) {
        setSelectedArchive(null);
      }
    }
  };

  const handleUploadArchive = async (id: string) => {
    try {
      await uploadArchive(id);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDownloadArchive = async (id: string) => {
    try {
      await downloadArchive(id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSelectArchive = (archive: Archive) => {
    setSelectedArchive(archive);
  };

  const handleSelectAll = () => {
    if (selectedArchives.size === filteredArchives.length) {
      setSelectedArchives(new Set());
    } else {
      setSelectedArchives(new Set(filteredArchives.map(a => a.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedArchives);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArchives(newSelected);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="archive-manager" onClick={onClose}>
      <div className="archive-manager-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="archive-manager-header">
          <h2 className="archive-manager-title">{t('archiveManager.title')}</h2>
          <button className="archive-manager-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="archive-manager-tabs">
          <button
            className={`archive-manager-tab ${activeTab === 'archives' ? 'active' : ''}`}
            onClick={() => setActiveTab('archives')}
          >
            {t('archiveManager.tabs.archives')}
          </button>
          <button
            className={`archive-manager-tab ${activeTab === 'recording' ? 'active' : ''}`}
            onClick={() => setActiveTab('recording')}
          >
            {t('archiveManager.tabs.recording')}
          </button>
          <button
            className={`archive-manager-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            {t('archiveManager.tabs.import')}
          </button>
          <button
            className={`archive-manager-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('archiveManager.tabs.settings')}
          </button>
        </div>

        {/* Body */}
        <div className="archive-manager-body">
          {/* Archives Tab */}
          {activeTab === 'archives' && (
            <>
              {/* Search and Filters */}
              <div className="archive-manager-controls">
                <div className="archive-manager-search">
                  <input
                    type="text"
                    placeholder={t('archiveManager.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="archive-manager-select"
                >
                  <option value="all">{t('archiveManager.allCategories')}</option>
                  {ARCHIVE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="archive-manager-select"
                >
                  <option value="all">{t('archiveManager.allStatuses')}</option>
                  {Object.values(ArchiveStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ArchiveSortOption)}
                  className="archive-manager-select"
                >
                  {ARCHIVE_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Statistics */}
              <div className="archive-manager-stats">
                <div className="stat-card">
                  <h4>{t('archiveManager.stats.totalArchives')}</h4>
                  <p>{statistics.totalArchives}</p>
                </div>
                <div className="stat-card">
                  <h4>{t('archiveManager.stats.totalSize')}</h4>
                  <p>{formatFileSize(statistics.totalSize)}</p>
                </div>
                <div className="stat-card">
                  <h4>{t('archiveManager.stats.totalDuration')}</h4>
                  <p>{formatDuration(statistics.totalDuration)}</p>
                </div>
                <div className="stat-card">
                  <h4>{t('archiveManager.stats.storageUsed')}</h4>
                  <p>{formatFileSize(statistics.storageUsed)}</p>
                </div>
              </div>

              {/* Archives Grid */}
              <div className="archive-manager-grid">
                {filteredArchives.length === 0 ? (
                  <div className="archive-manager-empty">
                    <p>{t('archiveManager.noArchives')}</p>
                  </div>
                ) : (
                  filteredArchives.map((archive) => (
                    <div
                      key={archive.id}
                      className={`archive-card ${selectedArchive?.id === archive.id ? 'selected' : ''}`}
                      onClick={() => handleSelectArchive(archive)}
                    >
                      <div className="archive-card-header">
                        <div
                          className="archive-status-badge"
                          style={{ backgroundColor: getStatusColor(archive.status) }}
                        >
                          {archive.status}
                        </div>
                        <div className="archive-card-actions">
                          <button
                            className={`action-btn favorite ${archive.isFavorite ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(archive.id);
                            }}
                          >
                            {archive.isFavorite ? '★' : '☆'}
                          </button>
                          <button
                            className={`action-btn protected ${archive.isProtected ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleProtection(archive.id);
                            }}
                          >
                            {archive.isProtected ? '🔒' : '🔓'}
                          </button>
                        </div>
                      </div>
                      <h4 className="archive-card-title">{archive.name}</h4>
                      <p className="archive-card-info">
                        {formatDate(archive.createdAt)}
                      </p>
                      <div className="archive-card-meta">
                        <span>{formatFileSize(archive.size)}</span>
                        <span>{formatDuration(archive.duration)}</span>
                      </div>
                      <div className="archive-card-tags">
                        {archive.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Recording Tab */}
          {activeTab === 'recording' && (
            <div className="archive-recording">
              <h3>{t('archiveManager.recording.title')}</h3>
              
              {/* Current Recording Status */}
              <div className="recording-status">
                <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
                  <div className="recording-dot"></div>
                  <span>{isRecording ? t('archiveManager.recording.recording') : t('archiveManager.recording.idle')}</span>
                </div>
                
                {currentRecording && (
                  <div className="current-recording-info">
                    <p><strong>{t('archiveManager.recording.duration')}:</strong> {formatDuration(currentRecording.duration)}</p>
                    <p><strong>{t('archiveManager.recording.size')}:</strong> {formatFileSize(currentRecording.size)}</p>
                    <p><strong>{t('archiveManager.recording.format')}:</strong> {currentRecording.format.toUpperCase()}</p>
                    <p><strong>{t('archiveManager.recording.quality')}:</strong> {currentRecording.quality}</p>
                  </div>
                )}

                <div className="recording-actions">
                  {isRecording ? (
                    <button className="btn btn-danger" onClick={handleStopRecording}>
                      {t('archiveManager.recording.stopRecording')}
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleStartRecording}>
                      {t('archiveManager.recording.startRecording')}
                    </button>
                  )}
                </div>
              </div>

              {/* Recording Config */}
              <div className="recording-config">
                <h4>{t('archiveManager.recording.config')}</h4>
                
                <div className="config-group">
                  <label>{t('archiveManager.recording.format')}</label>
                  <select
                    value={recordingConfig.format}
                    onChange={(e) => updateRecordingConfig({ format: e.target.value as ArchiveFormat })}
                    className="config-select"
                  >
                    {ARCHIVE_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>{format.label}</option>
                    ))}
                  </select>
                </div>

                <div className="config-group">
                  <label>{t('archiveManager.recording.quality')}</label>
                  <select
                    value={recordingConfig.quality}
                    onChange={(e) => updateRecordingConfig({ quality: e.target.value as ArchiveQuality })}
                    className="config-select"
                  >
                    {ARCHIVE_QUALITIES.map((quality) => (
                      <option key={quality.value} value={quality.value}>{quality.label}</option>
                    ))}
                  </select>
                </div>

                <div className="config-group">
                  <label>{t('archiveManager.recording.bitrate')}</label>
                  <input
                    type="number"
                    value={recordingConfig.targetBitrate || 6000}
                    onChange={(e) => updateRecordingConfig({ targetBitrate: parseInt(e.target.value) })}
                    className="config-input"
                  />
                  <span className="config-unit">kbps</span>
                </div>

                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={recordingConfig.autoRecord}
                      onChange={(e) => updateRecordingConfig({ autoRecord: e.target.checked })}
                    />
                    {t('archiveManager.recording.autoRecord')}
                  </label>
                </div>

                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={recordingConfig.includeChat}
                      onChange={(e) => updateRecordingConfig({ includeChat: e.target.checked })}
                    />
                    {t('archiveManager.recording.includeChat')}
                  </label>
                </div>

                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={recordingConfig.enableHardwareEncoding}
                      onChange={(e) => updateRecordingConfig({ enableHardwareEncoding: e.target.checked })}
                    />
                    {t('archiveManager.recording.hardwareEncoding')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="archive-import">
              <h3>{t('archiveManager.import.title')}</h3>
              <p>{t('archiveManager.import.description')}</p>
              
              <div className="import-dropzone">
                <div className="import-icon">📁</div>
                <p>{t('archiveManager.import.dropzone')}</p>
                <button className="btn btn-primary">{t('archiveManager.import.browse')}</button>
              </div>
              
              <div className="import-options">
                <h4>{t('archiveManager.import.options')}</h4>
                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={storageConfig.autoUpload}
                      onChange={(e) => updateStorageConfig({ autoUpload: e.target.checked })}
                    />
                    {t('archiveManager.import.autoUpload')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="archive-settings">
              <h3>{t('archiveManager.settings.title')}</h3>

              {/* Storage Settings */}
              <div className="settings-section">
                <h4>{t('archiveManager.settings.storage')}</h4>
                
                <div className="config-group">
                  <label>{t('archiveManager.settings.localPath')}</label>
                  <input
                    type="text"
                    value={storageConfig.localPath}
                    onChange={(e) => updateStorageConfig({ localPath: e.target.value })}
                    className="config-input"
                  />
                </div>

                <div className="config-group">
                  <label>{t('archiveManager.settings.maxStorage')}</label>
                  <input
                    type="number"
                    value={storageConfig.maxStorageGB || 500}
                    onChange={(e) => updateStorageConfig({ maxStorageGB: parseInt(e.target.value) })}
                    className="config-input"
                  />
                  <span className="config-unit">GB</span>
                </div>

                <div className="config-group">
                  <label>{t('archiveManager.settings.retentionDays')}</label>
                  <input
                    type="number"
                    value={storageConfig.retentionDays || 90}
                    onChange={(e) => updateStorageConfig({ retentionDays: parseInt(e.target.value) })}
                    className="config-input"
                  />
                  <span className="config-unit">{t('archiveManager.settings.days')}</span>
                </div>

                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={storageConfig.autoUpload}
                      onChange={(e) => updateStorageConfig({ autoUpload: e.target.checked })}
                    />
                    {t('archiveManager.settings.autoUpload')}
                  </label>
                </div>

                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={storageConfig.enableBackup}
                      onChange={(e) => updateStorageConfig({ enableBackup: e.target.checked })}
                    />
                    {t('archiveManager.settings.enableBackup')}
                  </label>
                </div>
              </div>

              {/* Auto-Delete Settings */}
              <div className="settings-section">
                <h4>{t('archiveManager.settings.autoDelete')}</h4>
                
                <div className="config-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={autoDeleteConfig.enabled}
                      onChange={(e) => updateAutoDeleteConfig({ enabled: e.target.checked })}
                    />
                    {t('archiveManager.settings.enableAutoDelete')}
                  </label>
                </div>

                {autoDeleteConfig.enabled && (
                  <>
                    <div className="config-group">
                      <label>{t('archiveManager.settings.deleteOlderThan')}</label>
                      <input
                        type="number"
                        value={autoDeleteConfig.olderThanDays}
                        onChange={(e) => updateAutoDeleteConfig({ olderThanDays: parseInt(e.target.value) })}
                        className="config-input"
                      />
                      <span className="config-unit">{t('archiveManager.settings.days')}</span>
                    </div>

                    <div className="config-group checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={autoDeleteConfig.keepFavorites}
                          onChange={(e) => updateAutoDeleteConfig({ keepFavorites: e.target.checked })}
                        />
                        {t('archiveManager.settings.keepFavorites')}
                      </label>
                    </div>

                    <div className="config-group checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={autoDeleteConfig.keepProtected}
                          onChange={(e) => updateAutoDeleteConfig({ keepProtected: e.target.checked })}
                        />
                        {t('archiveManager.settings.keepProtected')}
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Archive Detail */}
        {selectedArchive && (
          <div className="archive-detail">
            <div className="archive-detail-header">
              <h3>{selectedArchive.name}</h3>
              <button className="close-btn" onClick={() => setSelectedArchive(null)}>×</button>
            </div>
            <div className="archive-detail-content">
              <p><strong>{t('archiveManager.detail.status')}:</strong> {selectedArchive.status}</p>
              <p><strong>{t('archiveManager.detail.format')}:</strong> {selectedArchive.format.toUpperCase()}</p>
              <p><strong>{t('archiveManager.detail.quality')}:</strong> {selectedArchive.quality}</p>
              <p><strong>{t('archiveManager.detail.size')}:</strong> {formatFileSize(selectedArchive.size)}</p>
              <p><strong>{t('archiveManager.detail.duration')}:</strong> {formatDuration(selectedArchive.duration)}</p>
              <p><strong>{t('archiveManager.detail.created')}:</strong> {formatDate(selectedArchive.createdAt)}</p>
              {selectedArchive.completedAt && (
                <p><strong>{t('archiveManager.detail.completed')}:</strong> {formatDate(selectedArchive.completedAt)}</p>
              )}
              <p><strong>{t('archiveManager.detail.platform')}:</strong> {selectedArchive.platform}</p>
              <p><strong>{t('archiveManager.detail.category')}:</strong> {selectedArchive.category}</p>
              
              <div className="archive-detail-stream-info">
                <h4>{t('archiveManager.detail.streamInfo')}</h4>
                <p><strong>{t('archiveManager.detail.title')}:</strong> {selectedArchive.streamInfo.title}</p>
                <p><strong>{t('archiveManager.detail.peakViewers')}:</strong> {selectedArchive.streamInfo.peakViewers}</p>
                <p><strong>{t('archiveManager.detail.avgViewers')}:</strong> {selectedArchive.streamInfo.avgViewers}</p>
                <p><strong>{t('archiveManager.detail.followers')}:</strong> {selectedArchive.streamInfo.followers}</p>
                <p><strong>{t('archiveManager.detail.messages')}:</strong> {selectedArchive.streamInfo.messages}</p>
              </div>
            </div>
            <div className="archive-detail-actions">
              <button className="btn btn-secondary" onClick={() => handleDownloadArchive(selectedArchive.id)}>
                {t('archiveManager.detail.download')}
              </button>
              <button className="btn btn-secondary" onClick={() => handleUploadArchive(selectedArchive.id)}>
                {t('archiveManager.detail.upload')}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteArchive(selectedArchive.id)}
                disabled={selectedArchive.isProtected}
              >
                {t('archiveManager.detail.delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveManager;