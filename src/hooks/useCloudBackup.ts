/**
 * React hook for cloud backup functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { cloudBackupManager } from '../services/CloudBackupManager';
import {
  BackupConfig,
  BackupStatus,
  BackupItem,
  BackupManifest,
  BackupHistory,
  SyncState,
  SyncConflict,
  SyncProgress,
  CloudProvider,
  CloudProviderConfig,
  RestoreOptions,
  RestoreResult,
  CloudBackupState,
} from '../types/cloudBackup';

export interface UseCloudBackupOptions {
  autoSubscribe?: boolean;
}

export const useCloudBackup = (options: UseCloudBackupOptions = {}) => {
  const { autoSubscribe = true } = options;

  const [state, setState] = useState<CloudBackupState>(cloudBackupManager.getState());
  const [status, setStatus] = useState<BackupStatus>(cloudBackupManager.getStatus());
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  const refresh = useCallback(() => {
    setState(cloudBackupManager.getState());
    setStatus(cloudBackupManager.getStatus());
  }, []);

  useEffect(() => {
    if (!autoSubscribe) return;

    const handleStateChange = () => refresh();
    const handleStatusChange = (newStatus: BackupStatus) => setStatus(newStatus);
    const handleProgress = (progress: SyncProgress) => setSyncProgress(progress);

    cloudBackupManager.on('state-loaded', handleStateChange);
    cloudBackupManager.on('config-updated', handleStateChange);
    cloudBackupManager.on('items-updated', handleStateChange);
    cloudBackupManager.on('status-changed', handleStatusChange);
    cloudBackupManager.on('backup-progress', handleProgress);
    cloudBackupManager.on('backup-completed', handleStateChange);
    cloudBackupManager.on('backup-failed', handleStateChange);
    cloudBackupManager.on('restore-completed', handleStateChange);
    cloudBackupManager.on('sync-completed', handleStateChange);

    return () => {
      cloudBackupManager.off('state-loaded', handleStateChange);
      cloudBackupManager.off('config-updated', handleStateChange);
      cloudBackupManager.off('items-updated', handleStateChange);
      cloudBackupManager.off('status-changed', handleStatusChange);
      cloudBackupManager.off('backup-progress', handleProgress);
      cloudBackupManager.off('backup-completed', handleStateChange);
      cloudBackupManager.off('backup-failed', handleStateChange);
      cloudBackupManager.off('restore-completed', handleStateChange);
      cloudBackupManager.off('sync-completed', handleStateChange);
    };
  }, [autoSubscribe, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Configuration
  const updateConfig = useCallback((config: Partial<BackupConfig>) => {
    cloudBackupManager.updateConfig(config);
  }, []);

  // Provider management
  const authenticateProvider = useCallback(async (provider: CloudProvider) => {
    return cloudBackupManager.authenticateProvider(provider);
  }, []);

  const disconnectProvider = useCallback(async (provider: CloudProvider) => {
    return cloudBackupManager.disconnectProvider(provider);
  }, []);

  const selectProvider = useCallback((provider: CloudProvider) => {
    cloudBackupManager.selectProvider(provider);
  }, []);

  const getProviders = useCallback(() => {
    return cloudBackupManager.getProviders();
  }, []);

  // Backup items
  const getBackupItems = useCallback(() => {
    return cloudBackupManager.getBackupItems();
  }, []);

  const toggleBackupItem = useCallback((itemId: string) => {
    cloudBackupManager.toggleBackupItem(itemId);
  }, []);

  const selectAllItems = useCallback(() => {
    cloudBackupManager.selectAllItems();
  }, []);

  const deselectAllItems = useCallback(() => {
    cloudBackupManager.deselectAllItems();
  }, []);

  // Backup operations
  const createBackup = useCallback(async (items?: string[]) => {
    return cloudBackupManager.createBackup(items as any);
  }, []);

  const restoreBackup = useCallback(async (options: RestoreOptions) => {
    return cloudBackupManager.restoreBackup(options);
  }, []);

  const deleteBackup = useCallback(async (backupId: string) => {
    return cloudBackupManager.deleteBackup(backupId);
  }, []);

  const getBackupHistory = useCallback(() => {
    return cloudBackupManager.getBackupHistory();
  }, []);

  // Sync operations
  const sync = useCallback(async () => {
    return cloudBackupManager.sync();
  }, []);

  const getSyncState = useCallback(() => {
    return cloudBackupManager.getSyncState();
  }, []);

  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    cloudBackupManager.resolveConflict(conflictId, resolution);
  }, []);

  const pauseAutoSync = useCallback(() => {
    cloudBackupManager.pauseAutoSync();
  }, []);

  const resumeAutoSync = useCallback(() => {
    cloudBackupManager.resumeAutoSync();
  }, []);

  // Helpers
  const isConfigured = useCallback(() => {
    return cloudBackupManager.isConfigured();
  }, []);

  return {
    // State
    state,
    status,
    syncProgress,
    config: state.config,
    syncState: state.syncState,
    items: state.items,
    history: state.history,
    providers: state.providers,

    // Configuration
    updateConfig,

    // Provider management
    authenticateProvider,
    disconnectProvider,
    selectProvider,
    getProviders,

    // Backup items
    getBackupItems,
    toggleBackupItem,
    selectAllItems,
    deselectAllItems,

    // Backup operations
    createBackup,
    restoreBackup,
    deleteBackup,
    getBackupHistory,

    // Sync operations
    sync,
    getSyncState,
    resolveConflict,
    pauseAutoSync,
    resumeAutoSync,

    // Helpers
    isConfigured,
    refresh,
  };
};