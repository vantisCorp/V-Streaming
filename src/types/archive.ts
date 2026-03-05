/**
 * Archive type definitions for Stream Archive Management System
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Archive format enum
 */
export enum ArchiveFormat {
  MP4 = 'mp4',
  MKV = 'mkv',
  MOV = 'mov',
  FLV = 'flv',
  WEBM = 'webm',
  TS = 'ts',
}

/**
 * Archive quality enum
 */
export enum ArchiveQuality {
  ORIGINAL = 'original',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  CUSTOM = 'custom',
}

/**
 * Archive status enum
 */
export enum ArchiveStatus {
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  UPLOADING = 'uploading',
  DELETING = 'deleting',
}

/**
 * Archive storage type enum
 */
export enum ArchiveStorageType {
  LOCAL = 'local',
  CLOUD = 'cloud',
  HYBRID = 'hybrid',
}

/**
 * Archive category enum
 */
export enum ArchiveCategory {
  GAMING = 'gaming',
  JUST_CHATTING = 'just_chatting',
  MUSIC = 'music',
  ART = 'art',
  IRL = 'irl',
  TECH = 'tech',
  SPORTS = 'sports',
  EDUCATION = 'education',
  OTHER = 'other',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Archive interface
 */
export interface Archive {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  format: ArchiveFormat;
  quality: ArchiveQuality;
  status: ArchiveStatus;
  size: number;
  duration: number;
  createdAt: Date;
  completedAt?: Date;
  platform: string;
  category: ArchiveCategory;
  tags: string[];
  isFavorite: boolean;
  isProtected: boolean;
  viewCount: number;
  downloadCount: number;
  streamInfo: {
    title: string;
    startTime: Date;
    endTime: Date;
    peakViewers: number;
    avgViewers: number;
    followers: number;
    messages: number;
  };
  recordingConfig: ArchiveRecordingConfig;
  storageConfig: ArchiveStorageConfig;
  metadata: ArchiveMetadata;
}

/**
 * Archive metadata interface
 */
export interface ArchiveMetadata {
  video: {
    codec: string;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
  };
  audio: {
    codec: string;
    sampleRate: number;
    channels: number;
    bitrate: number;
  };
  encoder?: string;
  hardwareAccelerated: boolean;
}

/**
 * Archive recording config interface
 */
export interface ArchiveRecordingConfig {
  enabled: boolean;
  format: ArchiveFormat;
  quality: ArchiveQuality;
  maxBitrate?: number;
  minBitrate?: number;
  targetBitrate?: number;
  resolution?: {
    width: number;
    height: number;
  };
  fps?: number;
  audioBitrate: number;
  audioSampleRate: number;
  audioChannels: number;
  autoRecord: boolean;
  splitByDuration?: number; // seconds
  splitBySize?: number; // megabytes
  includeChat: boolean;
  includeOverlay: boolean;
  enableHardwareEncoding: boolean;
  encoder?: string;
}

/**
 * Archive storage config interface
 */
export interface ArchiveStorageConfig {
  type: ArchiveStorageType;
  localPath: string;
  cloudProvider: string;
  cloudBucket?: string;
  autoUpload: boolean;
  uploadAfterRecording: boolean;
  compressBeforeUpload: boolean;
  deleteAfterUpload: boolean;
  maxStorageGB?: number;
  retentionDays?: number;
  enableBackup: boolean;
  backupLocation?: string;
}

/**
 * Archive auto-delete config interface
 */
export interface ArchiveAutoDeleteConfig {
  enabled: boolean;
  olderThanDays: number;
  keepFavorites: boolean;
  keepProtected: boolean;
  maxSizeGB?: number;
  minFreeSpaceGB?: number;
  deleteConfirm: boolean;
}

/**
 * Archive search filters interface
 */
export interface ArchiveSearchFilters {
  query?: string;
  status?: ArchiveStatus;
  category?: ArchiveCategory;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
  minFileSize?: number;
  maxFileSize?: number;
  platform?: string;
  isFavorite?: boolean;
  format?: ArchiveFormat;
  quality?: ArchiveQuality;
}

/**
 * Archive sort options enum
 */
export enum ArchiveSortOption {
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  SIZE_DESC = 'size_desc',
  SIZE_ASC = 'size_asc',
  DURATION_DESC = 'duration_desc',
  DURATION_ASC = 'duration_asc',
  VIEWS_DESC = 'views_desc',
  VIEWS_ASC = 'views_asc',
}

/**
 * Archive statistics interface
 */
export interface ArchiveStatistics {
  totalArchives: number;
  totalSize: number;
  totalDuration: number;
  byStatus: Record<ArchiveStatus, number>;
  byCategory: Record<ArchiveCategory, number>;
  byFormat: Record<ArchiveFormat, number>;
  byQuality: Record<ArchiveQuality, number>;
  storageUsed: number;
  storageAvailable: number;
  oldestArchive: Date;
  newestArchive: Date;
}

/**
 * Archive export options interface
 */
export interface ArchiveExportOptions {
  format: 'csv' | 'json' | 'xml';
  includeMetadata: boolean;
  includeStreamInfo: boolean;
  includeFileList: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Archive import options interface
 */
export interface ArchiveImportOptions {
  sourcePath: string;
  copyToLocal: boolean;
  uploadToCloud: boolean;
  preserveMetadata: boolean;
  overwriteExisting: boolean;
}

/**
 * Archive batch operation interface
 */
export interface ArchiveBatchOperation {
  operation: 'delete' | 'export' | 'upload' | 'download' | 'tag' | 'compress';
  archiveIds: string[];
  options?: any;
}

/**
 * Archive event type enum
 */
export enum ArchiveEventType {
  RECORDING_STARTED = 'recording_started',
  RECORDING_STOPPED = 'recording_stopped',
  RECORDING_FAILED = 'recording_failed',
  PROCESSING_STARTED = 'processing_started',
  PROCESSING_COMPLETED = 'processing_completed',
  PROCESSING_FAILED = 'processing_failed',
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',
  ARCHIVE_CREATED = 'archive_created',
  ARCHIVE_UPDATED = 'archive_updated',
  ARCHIVE_DELETED = 'archive_deleted',
  ARCHIVE_IMPORTED = 'archive_imported',
  ARCHIVE_EXPORTED = 'archive_exported',
  STORAGE_WARNING = 'storage_warning',
  STORAGE_FULL = 'storage_full',
}

/**
 * Archive event interface
 */
export interface ArchiveEvent {
  type: ArchiveEventType;
  archiveId?: string;
  timestamp: Date;
  data?: any;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default archive recording config
 */
export const DEFAULT_ARCHIVE_RECORDING_CONFIG: ArchiveRecordingConfig = {
  enabled: true,
  format: ArchiveFormat.MP4,
  quality: ArchiveQuality.HIGH,
  maxBitrate: 8000,
  minBitrate: 3000,
  targetBitrate: 6000,
  resolution: { width: 1920, height: 1080 },
  fps: 60,
  audioBitrate: 128,
  audioSampleRate: 48000,
  audioChannels: 2,
  autoRecord: true,
  splitByDuration: 7200, // 2 hours
  includeChat: true,
  includeOverlay: true,
  enableHardwareEncoding: true,
};

/**
 * Default archive storage config
 */
export const DEFAULT_ARCHIVE_STORAGE_CONFIG: ArchiveStorageConfig = {
  type: ArchiveStorageType.LOCAL,
  localPath: './archives',
  cloudProvider: 'Custom',
  autoUpload: false,
  uploadAfterRecording: false,
  compressBeforeUpload: false,
  deleteAfterUpload: false,
  maxStorageGB: 500,
  retentionDays: 90,
  enableBackup: false,
};

/**
 * Default archive auto-delete config
 */
export const DEFAULT_ARCHIVE_AUTO_DELETE_CONFIG: ArchiveAutoDeleteConfig = {
  enabled: false,
  olderThanDays: 90,
  keepFavorites: true,
  keepProtected: true,
  deleteConfirm: true,
};

/**
 * Archive categories
 */
export const ARCHIVE_CATEGORIES = [
  { value: ArchiveCategory.GAMING, label: 'Gaming' },
  { value: ArchiveCategory.JUST_CHATTING, label: 'Just Chatting' },
  { value: ArchiveCategory.MUSIC, label: 'Music' },
  { value: ArchiveCategory.ART, label: 'Art' },
  { value: ArchiveCategory.IRL, label: 'IRL' },
  { value: ArchiveCategory.TECH, label: 'Tech' },
  { value: ArchiveCategory.SPORTS, label: 'Sports' },
  { value: ArchiveCategory.EDUCATION, label: 'Education' },
  { value: ArchiveCategory.OTHER, label: 'Other' },
];

/**
 * Archive formats
 */
export const ARCHIVE_FORMATS = [
  { value: ArchiveFormat.MP4, label: 'MP4' },
  { value: ArchiveFormat.MKV, label: 'MKV' },
  { value: ArchiveFormat.MOV, label: 'MOV' },
  { value: ArchiveFormat.FLV, label: 'FLV' },
  { value: ArchiveFormat.WEBM, label: 'WebM' },
  { value: ArchiveFormat.TS, label: 'TS' },
];

/**
 * Archive qualities
 */
export const ARCHIVE_QUALITIES = [
  { value: ArchiveQuality.ORIGINAL, label: 'Original' },
  { value: ArchiveQuality.HIGH, label: 'High (1080p)' },
  { value: ArchiveQuality.MEDIUM, label: 'Medium (720p)' },
  { value: ArchiveQuality.LOW, label: 'Low (480p)' },
  { value: ArchiveQuality.CUSTOM, label: 'Custom' },
];

/**
 * Archive sort options
 */
export const ARCHIVE_SORT_OPTIONS = [
  { value: ArchiveSortOption.DATE_DESC, label: 'Date (Newest)' },
  { value: ArchiveSortOption.DATE_ASC, label: 'Date (Oldest)' },
  { value: ArchiveSortOption.NAME_ASC, label: 'Name (A-Z)' },
  { value: ArchiveSortOption.NAME_DESC, label: 'Name (Z-A)' },
  { value: ArchiveSortOption.SIZE_DESC, label: 'Size (Largest)' },
  { value: ArchiveSortOption.SIZE_ASC, label: 'Size (Smallest)' },
  { value: ArchiveSortOption.DURATION_DESC, label: 'Duration (Longest)' },
  { value: ArchiveSortOption.DURATION_ASC, label: 'Duration (Shortest)' },
  { value: ArchiveSortOption.VIEWS_DESC, label: 'Views (Most)' },
  { value: ArchiveSortOption.VIEWS_ASC, label: 'Views (Least)' },
];