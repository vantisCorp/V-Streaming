/**
 * CloudBackupSettings - UI for managing cloud backup and sync
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCloudBackup } from '../hooks/useCloudBackup';
import {
  CloudProvider,
  BackupItem,
  BackupHistoryEntry,
} from '../types/cloudBackup';

import './CloudBackupSettings.css';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ProviderCardProps {
  provider: CloudProvider;
  name: string;
  icon: string;
  authenticated: boolean;
  onAuthenticate: () => void;
  onDisconnect: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  name,
  icon,
  authenticated,
  onAuthenticate,
  onDisconnect,
}) => {
  return (
    <div className={`provider-card ${authenticated ? 'authenticated' : ''}`}>
      <div className="provider-icon">{icon}</div>
      <div className="provider-info">
        <h4>{name}</h4>
        <span className={`status ${authenticated ? 'connected' : 'disconnected'}`}>
          {authenticated ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      <button
        className={`btn ${authenticated ? 'btn-danger' : 'btn-primary'}`}
        onClick={authenticated ? onDisconnect : onAuthenticate}
      >
        {authenticated ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};

interface BackupItemRowProps {
  item: BackupItem;
  onToggle: (itemId: string) => void;
}

const BackupItemRow: React.FC<BackupItemRowProps> = ({ item, onToggle }) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="backup-item-row">
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={item.included}
          onChange={() => onToggle(item.id)}
        />
        <span className="item-name">{item.name}</span>
      </label>
      <span className="item-size">{formatSize(item.size)}</span>
    </div>
  );
};

interface BackupHistoryItemProps {
  entry: BackupHistoryEntry;
  onRestore: (backupId: string) => void;
  onDelete: (backupId: string) => void;
}

const BackupHistoryItem: React.FC<BackupHistoryItemProps> = ({ entry, onRestore, onDelete }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className={`backup-history-item ${entry.status}`}>
      <div className="history-item-header">
        <span className="status-icon">{getStatusIcon(entry.status)}</span>
        <span className="backup-id">{entry.id}</span>
        <span className="backup-date">{formatDate(entry.uploadedAt)}</span>
      </div>
      <div className="history-item-details">
        <span>{formatSize(entry.size)} • {entry.manifest.items.length} items</span>
        <span>Duration: {entry.duration}ms</span>
      </div>
      {entry.error && (
        <div className="history-item-error">{entry.error}</div>
      )}
      <div className="history-item-actions">
        {entry.status === 'completed' && (
          <button
            className="btn btn-small btn-primary"
            onClick={() => onRestore(entry.id)}
          >
            Restore
          </button>
        )}
        <button
          className="btn btn-small btn-danger"
          onClick={() => onDelete(entry.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CloudBackupSettingsProps {
  onClose?: () => void;
}

export const CloudBackupSettings: React.FC<CloudBackupSettingsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    state,
    status,
    syncProgress,
    config,
    items,
    history,
    providers,
    updateConfig,
    authenticateProvider,
    disconnectProvider,
    selectProvider,
    getProviders,
    getBackupItems,
    toggleBackupItem,
    selectAllItems,
    deselectAllItems,
    createBackup,
    restoreBackup,
    deleteBackup,
    getBackupHistory,
    sync,
    pauseAutoSync,
    resumeAutoSync,
    isConfigured,
  } = useCloudBackup();

  const [activeTab, setActiveTab] = React.useState<'providers' | 'items' | 'history' | 'settings'>('providers');

  const handleAuthenticateProvider = async (provider: CloudProvider) => {
    await authenticateProvider(provider);
    selectProvider(provider);
  };

  const handleDisconnectProvider = async (provider: CloudProvider) => {
    await disconnectProvider(provider);
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to restore this backup? This may overwrite your current settings.')) {
      try {
        const result = await restoreBackup({
          backupId,
          items: [],
          overwriteExisting: true,
          mergeSettings: false,
          validateBeforeRestore: true,
          createBackupBeforeRestore: true,
        });

        if (result.success) {
          alert('Backup restored successfully!');
        } else {
          alert(`Restore failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Restore failed. Check console for details.');
      }
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      await deleteBackup(backupId);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="cloud-backup-settings">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('cloudBackup.title', 'Cloud Backup')}</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>

          <div className="modal-body">
            {/* Status Bar */}
            <div className="backup-status-bar">
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className={`status-value ${isConfigured() ? 'connected' : 'disconnected'}`}>
                  {isConfigured() ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {isConfigured() && (
                <>
                  <div className="status-item">
                    <span className="status-label">Backup Status:</span>
                    <span className="status-value">{status}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Total Size:</span>
                    <span className="status-value">{formatSize(items.totalSize)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'providers' ? 'active' : ''}`}
                onClick={() => setActiveTab('providers')}
              >
                Providers
              </button>
              <button
                className={`tab ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                Backup Items
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
              <button
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>

            {/* Content Area */}
            <div className="tab-content">
              {/* Providers Tab */}
              {activeTab === 'providers' && (
                <div className="providers-list">
                  <div className="providers-grid">
                    {providers.map(provider => (
                      <ProviderCard
                        key={provider.provider}
                        provider={provider.provider}
                        name={provider.provider.replace('_', ' ').toUpperCase()}
                        icon="☁️"
                        authenticated={provider.authenticated}
                        onAuthenticate={() => handleAuthenticateProvider(provider.provider)}
                        onDisconnect={() => handleDisconnectProvider(provider.provider)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Backup Items Tab */}
              {activeTab === 'items' && (
                <div className="backup-items-list">
                  <div className="items-header">
                    <div className="header-title">
                      <h3>Select Items to Backup</h3>
                      <span className="total-size">Total: {formatSize(items.totalSize)}</span>
                    </div>
                    <div className="header-actions">
                      <button className="btn btn-small" onClick={selectAllItems}>
                        Select All
                      </button>
                      <button className="btn btn-small" onClick={deselectAllItems}>
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="items-list">
                    {items.items.map(item => (
                      <BackupItemRow
                        key={item.id}
                        item={item}
                        onToggle={toggleBackupItem}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="backup-history-list">
                  {history.entries.length === 0 ? (
                    <div className="empty-state">
                      <p>No backup history</p>
                      <p>Create your first backup to get started</p>
                    </div>
                  ) : (
                    history.entries.map(entry => (
                      <BackupHistoryItem
                        key={entry.id}
                        entry={entry}
                        onRestore={handleRestoreBackup}
                        onDelete={handleDeleteBackup}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="settings-content">
                  <div className="setting-group">
                    <h3>Backup Schedule</h3>
                    <div className="setting-item">
                      <label>Enable Auto Backup</label>
                      <input
                        type="checkbox"
                        checked={config.schedule.enabled}
                        onChange={(e) => updateConfig({
                          schedule: { ...config.schedule, enabled: e.target.checked }
                        })}
                      />
                    </div>
                    <div className="setting-item">
                      <label>Frequency</label>
                      <select
                        value={config.schedule.frequency}
                        onChange={(e) => updateConfig({
                          schedule: { ...config.schedule, frequency: e.target.value as any }
                        })}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="on_change">On Change</option>
                      </select>
                    </div>
                  </div>

                  <div className="setting-group">
                    <h3>Encryption</h3>
                    <div className="setting-item">
                      <label>Enable Encryption</label>
                      <input
                        type="checkbox"
                        checked={config.encryption.enabled}
                        onChange={(e) => updateConfig({
                          encryption: { ...config.encryption, enabled: e.target.checked }
                        })}
                      />
                    </div>
                  </div>

                  <div className="setting-group">
                    <h3>Options</h3>
                    <div className="setting-item">
                      <label>Compress Backup</label>
                      <input
                        type="checkbox"
                        checked={config.compression}
                        onChange={(e) => updateConfig({ compression: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {isConfigured() && activeTab !== 'providers' && (
              <div className="modal-footer">
                {status === 'uploading' && syncProgress && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${syncProgress.percentage}%` }}
                    />
                    <span className="progress-text">
                      {syncProgress.current} ({syncProgress.completed}/{syncProgress.total}) - {syncProgress.percentage}%
                    </span>
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={handleCreateBackup}
                  disabled={status === 'uploading' || status === 'downloading'}
                >
                  {status === 'uploading' ? 'Creating Backup...' : 'Create Backup'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={sync}
                  disabled={status === 'uploading' || status === 'downloading'}
                >
                  Sync Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};