/**
 * Cloud Rendering Types for V-Streaming
 * Supports AWS, Google Cloud, and Azure for remote rendering
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum CloudProvider {
  AWS = 'aws',
  GOOGLE_CLOUD = 'gcp',
  AZURE = 'azure',
  CUSTOM = 'custom'
}

export enum RenderJobStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RenderQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  CUSTOM = 'custom'
}

export enum RenderCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP9 = 'vp9',
  AV1 = 'av1'
}

export enum CloudInstanceType {
  // General purpose
  CPU_SMALL = 'cpu-small',
  CPU_MEDIUM = 'cpu-medium',
  CPU_LARGE = 'cpu-large',
  // GPU optimized
  GPU_SMALL = 'gpu-small',
  GPU_MEDIUM = 'gpu-medium',
  GPU_LARGE = 'gpu-large'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Cloud provider credentials
 */
export interface CloudCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  projectId?: string;
  subscriptionId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * Cloud rendering configuration
 */
export interface CloudRenderingConfig {
  enabled: boolean;
  provider: CloudProvider;
  credentials: CloudCredentials;
  region: string;
  instanceType: CloudInstanceType;
  autoScale: boolean;
  minInstances: number;
  maxInstances: number;
  idleTimeout: number;
  costLimit: number;
  preferredCodec: RenderCodec;
  defaultQuality: RenderQuality;
  defaultInstanceType: CloudInstanceType;
  apiKey: string;
  apiSecret: string;
}

/**
 * Render job configuration
 */
export interface RenderJobConfig {
  name: string;
  sourceUrl: string;
  outputFormat: string;
  codec: RenderCodec;
  quality: RenderQuality;
  resolution: string;
  frameRate: number;
  bitrate: number;
  keyframeInterval: number;
  audioCodec: string;
  audioBitrate: number;
  customParameters?: Record<string, unknown>;
}

/**
 * Render job
 */
export interface RenderJob {
  id: string;
  config: RenderJobConfig;
  status: RenderJobStatus;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  outputUrl?: string;
  error?: string;
  instanceId?: string;
  estimatedCost?: number;
}

/**
 * Cloud instance
 */
export interface CloudInstance {
  id: string;
  type: CloudInstanceType;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  region: string;
  startedAt: Date;
  stoppedAt?: Date;
  hourlyRate: number;
  currentJobId?: string;
}

/**
 * Cloud rendering statistics
 */
export interface CloudRenderingStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRenderTime: number;
  totalCost: number;
  averageRenderTime: number;
}

/**
 * Cloud pricing information
 */
export interface CloudPricing {
  provider: CloudProvider;
  instanceType: CloudInstanceType;
  hourlyRate: number;
  description: string;
}

/**
 * Render queue item
 */
export interface RenderQueueItem {
  id: string;
  jobConfig: RenderJobConfig;
  priority: number;
  addedAt: Date;
  startedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Cloud rendering event types
 */
export type CloudRenderingEvent = 
  | 'connected'
  | 'disconnected'
  | 'configChanged'
  | 'instanceStarted'
  | 'instanceReady'
  | 'instanceStopping'
  | 'instanceStopped'
  | 'jobCreated'
  | 'jobStarted'
  | 'jobProgress'
  | 'jobCompleted'
  | 'jobFailed'
  | 'jobCancelled'
  | 'queueUpdated'
  | 'error';

/**
 * Cloud rendering event callback
 */
export type CloudRenderingEventCallback = (data: unknown) => void;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_CLOUD_RENDERING_CONFIG: CloudRenderingConfig = {
  enabled: false,
  provider: CloudProvider.AWS,
  credentials: {},
  region: 'us-east-1',
  instanceType: CloudInstanceType.GPU_SMALL,
  autoScale: false,
  minInstances: 1,
  maxInstances: 5,
  idleTimeout: 30,
  costLimit: 100,
  preferredCodec: RenderCodec.H264,
  defaultQuality: RenderQuality.HIGH,
  defaultInstanceType: CloudInstanceType.GPU_SMALL,
  apiKey: '',
  apiSecret: ''
};

export const DEFAULT_RENDER_JOB_CONFIG: RenderJobConfig = {
  name: 'Untitled Render Job',
  sourceUrl: '',
  outputFormat: 'mp4',
  codec: RenderCodec.H264,
  quality: RenderQuality.HIGH,
  resolution: '1920x1080',
  frameRate: 30,
  bitrate: 8000,
  keyframeInterval: 2,
  audioCodec: 'aac',
  audioBitrate: 192
};
