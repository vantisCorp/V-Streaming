/**
 * Cloud Rendering Service
 * Manages cloud-based rendering operations with support for AWS, GCP, and Azure
 */

import {
  CloudProvider,
  RenderJobStatus,
  RenderQuality,
  RenderCodec,
  CloudInstanceType,
  CloudRenderingConfig,
  RenderJobConfig,
  RenderJob,
  CloudInstance,
  CloudRenderingStats,
  CloudPricing,
  CloudRenderingEvent,
  DEFAULT_CLOUD_RENDERING_CONFIG
} from '../types/cloudRendering';

// ============================================================================
// EVENT EMITTER (Simple implementation)
// ============================================================================

type EventCallback = (data: unknown) => void;

class EventEmitter {
  private listeners: Map<CloudRenderingEvent, Set<EventCallback>> = new Map();

  on(event: CloudRenderingEvent, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: CloudRenderingEvent, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: CloudRenderingEvent, data?: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// ============================================================================
// CLOUD RENDERING SERVICE
// ============================================================================

export class CloudRenderingService extends EventEmitter {
  private config: CloudRenderingConfig;
  private connected: boolean = false;
  private instances: Map<string, CloudInstance> = new Map();
  private jobs: Map<string, RenderJob> = new Map();
  private stats: CloudRenderingStats;

  constructor() {
    super();
    this.config = { ...DEFAULT_CLOUD_RENDERING_CONFIG };
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalRenderTime: 0,
      totalCost: 0,
      averageRenderTime: 0
    };
  }

  // ==========================================================================
  // CONFIGURATION & CONNECTION
  // ==========================================================================

  async configure(config: CloudRenderingConfig): Promise<void> {
    this.config = { ...config };
    this.emit('configChanged', this.config);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      console.warn('Already connected to cloud service');
      return;
    }

    await this.simulateLatency(500, 1500);

    this.connected = true;
    this.emit('connected', { provider: this.config.provider });

    console.log(`Connected to ${this.getProviderName()} cloud rendering service`);
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    for (const instance of this.instances.values()) {
      if (instance.status === 'running') {
        await this.stopInstance(instance.id);
      }
    }

    this.connected = false;
    this.emit('disconnected', {});

    console.log('Disconnected from cloud rendering service');
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  isConnected(): boolean {
    return this.connected;
  }

  // ==========================================================================
  // INSTANCE MANAGEMENT
  // ==========================================================================

  async startInstance(type?: CloudInstanceType): Promise<CloudInstance> {
    this.ensureConnected();

    const instanceType = type || this.config.defaultInstanceType;
    const instanceId = this.generateId('instance');

    const instance: CloudInstance = {
      id: instanceId,
      type: instanceType,
      status: 'starting',
      region: this.config.region,
      startedAt: new Date(),
      hourlyRate: this.getInstanceHourlyRate(instanceType)
    };

    this.instances.set(instanceId, instance);
    this.emit('instanceStarted', instance);

    await this.simulateLatency(2000, 5000);

    instance.status = 'running';
    this.emit('instanceReady', instance);

    return instance;
  }

  async stopInstance(instanceId: string): Promise<void> {
    this.ensureConnected();

    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    instance.status = 'stopping';
    this.emit('instanceStopping', instance);

    await this.simulateLatency(1000, 3000);

    instance.status = 'stopped';
    instance.stoppedAt = new Date();
    this.emit('instanceStopped', instance);

    this.instances.delete(instanceId);
  }

  getInstances(): CloudInstance[] {
    return Array.from(this.instances.values());
  }

  // ==========================================================================
  // JOB MANAGEMENT
  // ==========================================================================

  async createJob(jobConfig: RenderJobConfig): Promise<RenderJob> {
    this.ensureConnected();

    const jobId = this.generateId('job');
    
    const job: RenderJob = {
      id: jobId,
      config: jobConfig,
      status: RenderJobStatus.QUEUED,
      progress: 0,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    this.stats.totalJobs++;

    this.emit('jobCreated', job);

    this.processJob(job);

    return job;
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === RenderJobStatus.COMPLETED || job.status === RenderJobStatus.FAILED) {
      throw new Error(`Cannot cancel job in ${job.status} state`);
    }

    job.status = RenderJobStatus.CANCELLED;
    this.emit('jobCancelled', job);
  }

  async getJob(jobId: string): Promise<RenderJob | undefined> {
    return this.jobs.get(jobId);
  }

  getJobs(): RenderJob[] {
    return Array.from(this.jobs.values());
  }

  // ==========================================================================
  // STATISTICS & PRICING
  // ==========================================================================

  async getStats(): Promise<CloudRenderingStats> {
    return { ...this.stats };
  }

  async getPricing(provider?: CloudProvider): Promise<CloudPricing[]> {
    const targetProvider = provider || this.config.provider;

    const pricingData: CloudPricing[] = [
      {
        provider: CloudProvider.AWS,
        instanceType: CloudInstanceType.GPU_SMALL,
        hourlyRate: 0.90,
        description: 'AWS g4dn.xlarge - NVIDIA T4 GPU'
      },
      {
        provider: CloudProvider.AWS,
        instanceType: CloudInstanceType.GPU_MEDIUM,
        hourlyRate: 1.85,
        description: 'AWS g4dn.2xlarge - NVIDIA T4 GPU (2x)'
      },
      {
        provider: CloudProvider.AWS,
        instanceType: CloudInstanceType.GPU_LARGE,
        hourlyRate: 3.70,
        description: 'AWS g4dn.4xlarge - NVIDIA T4 GPU (4x)'
      },
      {
        provider: CloudProvider.GOOGLE_CLOUD,
        instanceType: CloudInstanceType.GPU_SMALL,
        hourlyRate: 0.85,
        description: 'GCP n1-standard-4 + T4 GPU'
      },
      {
        provider: CloudProvider.GOOGLE_CLOUD,
        instanceType: CloudInstanceType.GPU_MEDIUM,
        hourlyRate: 1.70,
        description: 'GCP n1-standard-8 + T4 GPU (2x)'
      },
      {
        provider: CloudProvider.AZURE,
        instanceType: CloudInstanceType.GPU_SMALL,
        hourlyRate: 0.95,
        description: 'Azure NV6s v2 - NVIDIA M60'
      },
      {
        provider: CloudProvider.AZURE,
        instanceType: CloudInstanceType.GPU_LARGE,
        hourlyRate: 3.90,
        description: 'Azure NV12s v3 - NVIDIA M60 (2x)'
      }
    ];

    return pricingData.filter(p => p.provider === targetProvider);
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to cloud service. Call connect() first.');
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getInstanceHourlyRate(type: CloudInstanceType): number {
    const rates: Record<CloudInstanceType, number> = {
      [CloudInstanceType.CPU_SMALL]: 0.10,
      [CloudInstanceType.CPU_MEDIUM]: 0.25,
      [CloudInstanceType.CPU_LARGE]: 0.50,
      [CloudInstanceType.GPU_SMALL]: 0.90,
      [CloudInstanceType.GPU_MEDIUM]: 1.85,
      [CloudInstanceType.GPU_LARGE]: 3.70
    };
    return rates[type];
  }

  private getProviderName(): string {
    const names: Record<CloudProvider, string> = {
      [CloudProvider.AWS]: 'Amazon Web Services',
      [CloudProvider.GOOGLE_CLOUD]: 'Google Cloud Platform',
      [CloudProvider.AZURE]: 'Microsoft Azure',
      [CloudProvider.CUSTOM]: 'Custom Provider'
    };
    return names[this.config.provider];
  }

  private async simulateLatency(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async processJob(job: RenderJob): Promise<void> {
    job.status = RenderJobStatus.PROCESSING;
    job.startedAt = new Date();
    this.emit('jobStarted', job);

    const totalSteps = 10;
    for (let i = 1; i <= totalSteps; i++) {
      await this.simulateLatency(500, 1500);
      
      // Check if job was cancelled from outside
      const currentJob = this.jobs.get(job.id);
      if (currentJob && currentJob.status === RenderJobStatus.CANCELLED) {
        return;
      }

      job.progress = (i / totalSteps) * 100;
      this.emit('jobProgress', { job, progress: job.progress });
    }

    job.status = RenderJobStatus.COMPLETED;
    job.completedAt = new Date();
    job.outputUrl = `https://storage.cloud/${job.id}/output.mp4`;

    this.stats.completedJobs++;
    this.stats.totalRenderTime += job.completedAt.getTime() - job.startedAt!.getTime();
    this.stats.averageRenderTime = this.stats.totalRenderTime / this.stats.completedJobs;

    this.emit('jobCompleted', job);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let serviceInstance: CloudRenderingService | null = null;

export function getCloudRenderingService(): CloudRenderingService {
  if (!serviceInstance) {
    serviceInstance = new CloudRenderingService();
  }
  return serviceInstance;
}

export default CloudRenderingService;
