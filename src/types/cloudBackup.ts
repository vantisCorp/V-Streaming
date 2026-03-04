/**
 * Cloud Backup Types for V-Streaming
 * Comprehensive backup and sync system for settings and configurations
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Cloud provider types
 */
export type CloudProvider = 
  | 'google_drive'
  | 'dropbox'
  | 'onedrive'
  | 'icloud'
  | 'aws_s3'
  | 'custom';

/**
 * Backup status
 */
export type BackupStatus = 
  | 'idle'
  | 'syncing'
  | 'uploading'
  | 'downloading'
  | 'error'
  | 'paused';

/**
 * Sync status
 */
export type SyncStatus = 
  | 'synced'
  | 'pending'
  | 'conflict'
  | 'offline';

/**
 * Backup item type
 */
export type BackupItemType = 
  | 'settings'
  | 'scenes'
  | 'hotkeys'
  | 'audio'
  | 'encoding'
  | 'streaming'
  | 'vtuber'
  | 'plugins'
  | 'automation'
  | 'all';

// ============================================================================
// BACKUP ITEM
// ============================================================================

/**
 * Individual backup item
 */
export interface BackupItem {
  id: string;
  type: BackupItemType;
  name: string;
  path: string;
  size: number;              // Size in bytes
  checksum: string;          // MD5 or SHA256 checksum
  lastModified: Date;
  included: boolean;         // Whether to include in backup
}

/**
 * Backup item collection
 */
export interface BackupItemCollection {
  items: BackupItem[];
  totalSize: number;
  lastUpdated: Date;
}

// ============================================================================
// BACKUP CONFIGURATION
// ============================================================================

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
  provider: CloudProvider;
  enabled: boolean;
  authenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId?: string;
  userEmail?: string;
  rootFolder?: string;       // Root folder for backups
  quota?: StorageQuota;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number;
  total: number;
  available: number;
}

/**
 * Backup schedule configuration
 */
export interface BackupSchedule {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_change';
  time?: string;             // HH:MM format for daily/weekly
  dayOfWeek?: number;        // 0-6 for weekly (Sunday-Saturday)
  dayOfMonth?: number;       // 1-31 for monthly
  retentionCount: number;    // Number of backups to keep
  includeItems: BackupItemType[];
}

/**
 * Complete backup configuration
 */
export interface BackupConfig {
  enabled: boolean;
  provider: CloudProviderConfig;
  schedule: BackupSchedule;
  encryption: EncryptionConfig;
  compression: boolean;
  includeUserData: boolean;
  includeCache: boolean;
  autoRestore: boolean;      // Auto-restore on new device
  conflictResolution: 'local' | 'remote' | 'manual' | 'merge';
  notifyOnSync: boolean;
  notifyOnError: boolean;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC';
  keyDerivation: 'PBKDF2' | 'Argon2';
  iterations: number;
  salt?: string;
}

// ============================================================================
// BACKUP MANIFEST
// ============================================================================

/**
 * Backup manifest (stored with each backup)
 */
export interface BackupManifest {
  id: string;
  version: string;           // App version when backup was created
  createdAt: Date;
  checksum: string;          // Checksum of entire backup
  size: number;              // Total backup size
  items: BackupManifestItem[];
  metadata: BackupMetadata;
  encryption: boolean;
  compressed: boolean;
}

/**
 * Item in the backup manifest
 */
export interface BackupManifestItem {
  id: string;
  type: BackupItemType;
  name: string;
  path: string;
  checksum: string;
  size: number;
  modifiedAt: Date;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  deviceName: string;
  deviceId: string;
  platform: string;
  appVersion: string;
  userId?: string;
  notes?: string;
  tags: string[];
}

// ============================================================================
// SYNC TYPES
// ============================================================================

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string;
  itemType: BackupItemType;
  itemName: string;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  detectedAt: Date;
  resolution?: ConflictResolution;
}

/**
 * Conflict version details
 */
export interface ConflictVersion {
  checksum: string;
  modifiedAt: Date;
  size: number;
  deviceId: string;
  preview?: string;          // Preview of the content
}

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  action: 'keep_local' | 'keep_remote' | 'merge' | 'skip';
  resolvedAt: Date;
  resolvedBy: 'user' | 'auto';
}

/**
 * Sync state
 */
export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: Date;
  lastSuccessfulSyncAt?: Date;
  pendingChanges: number;
  conflicts: SyncConflict[];
  syncProgress?: SyncProgress;
}

/**
 * Sync progress
 */
export interface SyncProgress {
  total: number;
  completed: number;
  current: string;           // Current item being synced
  percentage: number;
  speed: number;             // Bytes per second
  estimatedTimeRemaining: number; // Seconds
}

// ============================================================================
// BACKUP HISTORY
// ============================================================================

/**
 * Backup history entry
 */
export interface BackupHistoryEntry {
  id: string;
  manifest: BackupManifest;
  status: 'completed' | 'partial' | 'failed';
  duration: number;          // Duration in milliseconds
  size: number;
  uploadedAt: Date;
  error?: string;
}

/**
 * Backup history
 */
export interface BackupHistory {
  entries: BackupHistoryEntry[];
  totalSize: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

// ============================================================================
// RESTORE TYPES
// ============================================================================

/**
 * Restore options
 */
export interface RestoreOptions {
  backupId: string;
  items: BackupItemType[];
  overwriteExisting: boolean;
  mergeSettings: boolean;
  validateBeforeRestore: boolean;
  createBackupBeforeRestore: boolean;
}

/**
 * Restore result
 */
export interface RestoreResult {
  success: boolean;
  backupId: string;
  restoredItems: string[];
  skippedItems: string[];
  errors: string[];
  warnings: string[];
  restoredAt: Date;
  duration: number;
}

// ============================================================================
// CLOUD BACKUP STATE
// ============================================================================

/**
 * Complete cloud backup state
 */
export interface CloudBackupState {
  config: BackupConfig;
  status: BackupStatus;
  syncState: SyncState;
  items: BackupItemCollection;
  history: BackupHistory;
  providers: CloudProviderConfig[];
}

/**
 * Default backup configuration
 */
export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  enabled: false,
  provider: {
    provider: 'google_drive',
    enabled: false,
    authenticated: false,
    rootFolder: '/V-Streaming/Backups',
  },
  schedule: {
    enabled: false,
    frequency: 'daily',
    time: '02:00',
    retentionCount: 10,
    includeItems: ['all'],
  },
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    iterations: 100000,
  },
  compression: true,
  includeUserData: true,
  includeCache: false,
  autoRestore: false,
  conflictResolution: 'manual',
  notifyOnSync: true,
  notifyOnError: true,
};