/**
 * Hardware Acceleration Service
 * Manages GPU detection, hardware encoding/decoding, and performance monitoring
 */

import {
  GPUVendor,
  HardwareEncoder,
  HardwareDecoder,
  EncoderPreset,
  RateControlMode,
  MultiPassMode,
  GPUDevice,
  EncoderCapabilities,
  HardwareEncoderSettings,
  HardwareDecoderSettings,
  HardwareAccelerationConfig,
  HardwareAccelerationStatus,
  GPUStatistics,
  EncodingSession,
  BenchmarkResult,
  HardwareAccelerationEvent,
  DEFAULT_HARDWARE_ACCELERATION_CONFIG,
  DEFAULT_HARDWARE_ENCODER_SETTINGS
} from '../types/hardwareAcceleration';

// ============================================================================
// EVENT EMITTER
// ============================================================================

type EventCallback = (data: unknown) => void;

class EventEmitter {
  private listeners: Map<HardwareAccelerationEvent, Set<EventCallback>> = new Map();

  on(event: HardwareAccelerationEvent, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: HardwareAccelerationEvent, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: HardwareAccelerationEvent, data?: unknown): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// ============================================================================
// HARDWARE ACCELERATION SERVICE
// ============================================================================

export class HardwareAccelerationService extends EventEmitter {
  private config: HardwareAccelerationConfig;
  private status: HardwareAccelerationStatus;
  private sessions: Map<string, EncodingSession> = new Map();
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private gpuStats: Map<string, GPUStatistics> = new Map();

  constructor() {
    super();
    this.config = { ...DEFAULT_HARDWARE_ACCELERATION_CONFIG };
    this.status = {
      isAvailable: false,
      isInitialized: false,
      activeGPU: null,
      activeEncoder: null,
      activeDecoder: null,
      availableGPUs: [],
      availableEncoders: [],
      errors: [],
      warnings: []
    };
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    try {
      // Detect available GPUs
      await this.detectGPUs();
      
      // Check encoder availability
      await this.checkEncoderAvailability();
      
      // Initialize if GPUs are found
      if (this.status.availableGPUs.length > 0) {
        this.status.isAvailable = true;
        
        // Auto-select GPU if configured
        if (this.config.autoSelectGPU) {
          this.selectBestGPU();
        }
        
        // Start stats monitoring
        this.startStatsMonitoring();
        
        this.status.isInitialized = true;
        this.emit('initialized', { status: this.status });
      } else {
        this.status.warnings.push('No compatible GPUs detected');
        this.emit('warning', { message: 'No compatible GPUs detected' });
      }
    } catch (error) {
      this.status.errors.push(error instanceof Error ? error.message : 'Initialization failed');
      this.emit('error', { error });
    }
  }

  async shutdown(): Promise<void> {
    // Stop all encoding sessions
    for (const sessionId of this.sessions.keys()) {
      await this.stopEncodingSession(sessionId);
    }
    
    // Stop stats monitoring
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    this.status.isInitialized = false;
    this.emit('shutdown', {});
  }

  // ==========================================================================
  // GPU DETECTION & MANAGEMENT
  // ==========================================================================

  private async detectGPUs(): Promise<void> {
    // Simulated GPU detection - in real implementation would use system APIs
    const simulatedGPUs: GPUDevice[] = [
      {
        id: 'gpu-0',
        vendor: GPUVendor.NVIDIA,
        name: 'NVIDIA GeForce RTX 4080',
        driverVersion: '560.70',
        driverDate: '2026-01-15',
        memory: 16384,
        memoryUsed: 2048,
        memoryFree: 14336,
        temperature: 45,
        utilization: 5,
        encoder: [
          HardwareEncoder.NVENC_H264,
          HardwareEncoder.NVENC_HEVC,
          HardwareEncoder.NVENC_AV1
        ],
        decoder: [HardwareDecoder.NVIDIA],
        isPrimary: true,
        pciId: '10de:2704'
      },
      {
        id: 'gpu-1',
        vendor: GPUVendor.NVIDIA,
        name: 'NVIDIA GeForce RTX 3060',
        driverVersion: '560.70',
        driverDate: '2026-01-15',
        memory: 12288,
        memoryUsed: 1024,
        memoryFree: 11264,
        temperature: 40,
        utilization: 2,
        encoder: [
          HardwareEncoder.NVENC_H264,
          HardwareEncoder.NVENC_HEVC
        ],
        decoder: [HardwareDecoder.NVIDIA],
        isPrimary: false,
        pciId: '10de:2503'
      }
    ];

    this.status.availableGPUs = simulatedGPUs;
    this.emit('gpuDetected', { gpus: simulatedGPUs });
  }

  private async checkEncoderAvailability(): Promise<void> {
    const encoders: EncoderCapabilities[] = [];

    for (const gpu of this.status.availableGPUs) {
      if (gpu.encoder) {
        for (const encoder of gpu.encoder) {
          const capabilities = this.getEncoderCapabilities(encoder, gpu);
          encoders.push(capabilities);
        }
      }
    }

    this.status.availableEncoders = encoders;
  }

  private getEncoderCapabilities(encoder: HardwareEncoder, gpu: GPUDevice): EncoderCapabilities {
    const baseCapabilities: EncoderCapabilities = {
      encoder,
      vendor: gpu.vendor,
      name: this.getEncoderName(encoder),
      supportedPresets: this.getSupportedPresets(encoder),
      supportedRateControls: this.getSupportedRateControls(encoder),
      maxResolution: '7680x4320',
      maxFrameRate: 240,
      supportsBFrames: true,
      supportsLookahead: true,
      supports10Bit: encoder !== HardwareEncoder.NVENC_H264,
      supportsAlpha: false,
      maxBitrate: 50000,
      minBitrate: 500,
      recommendedBitrate: 6000
    };

    // Vendor-specific adjustments
    if (gpu.vendor === GPUVendor.NVIDIA && gpu.memory >= 8192) {
      baseCapabilities.supportsLookahead = true;
      baseCapabilities.maxFrameRate = 360;
    }

    return baseCapabilities;
  }

  private getEncoderName(encoder: HardwareEncoder): string {
    const names: Record<HardwareEncoder, string> = {
      [HardwareEncoder.NVENC_H264]: 'NVIDIA NVENC H.264',
      [HardwareEncoder.NVENC_HEVC]: 'NVIDIA NVENC HEVC',
      [HardwareEncoder.NVENC_AV1]: 'NVIDIA NVENC AV1',
      [HardwareEncoder.AMF_H264]: 'AMD AMF H.264',
      [HardwareEncoder.AMF_HEVC]: 'AMD AMF HEVC',
      [HardwareEncoder.AMF_AV1]: 'AMD AMF AV1',
      [HardwareEncoder.QSV_H264]: 'Intel QuickSync H.264',
      [HardwareEncoder.QSV_HEVC]: 'Intel QuickSync HEVC',
      [HardwareEncoder.QSV_AV1]: 'Intel QuickSync AV1',
      [HardwareEncoder.VIDEOTOOLBOX_H264]: 'Apple VideoToolbox H.264',
      [HardwareEncoder.VIDEOTOOLBOX_HEVC]: 'Apple VideoToolbox HEVC',
      [HardwareEncoder.SOFTWARE_X264]: 'x264 (Software)',
      [HardwareEncoder.SOFTWARE_X265]: 'x265 (Software)',
      [HardwareEncoder.SOFTWARE_SVTAV1]: 'SVT-AV1 (Software)'
    };
    return names[encoder];
  }

  private getSupportedPresets(encoder: HardwareEncoder): EncoderPreset[] {
    if (encoder.startsWith('nvenc')) {
      return [
        EncoderPreset.P1, EncoderPreset.P2, EncoderPreset.P3,
        EncoderPreset.P4, EncoderPreset.P5, EncoderPreset.P6, EncoderPreset.P7
      ];
    }
    if (encoder.startsWith('amf')) {
      return [EncoderPreset.SPEED, EncoderPreset.BALANCED, EncoderPreset.QUALITY];
    }
    if (encoder.startsWith('qsv')) {
      return [
        EncoderPreset.VERYFAST, EncoderPreset.FASTER, EncoderPreset.FAST,
        EncoderPreset.MEDIUM, EncoderPreset.SLOW, EncoderPreset.SLOWER, EncoderPreset.VERYSLOW
      ];
    }
    return [EncoderPreset.DEFAULT];
  }

  private getSupportedRateControls(encoder: HardwareEncoder): RateControlMode[] {
    if (encoder.startsWith('nvenc')) {
      return [RateControlMode.CBR, RateControlMode.VBR, RateControlMode.CQP, RateControlMode.LA_CBR, RateControlMode.LA_VBR];
    }
    if (encoder.startsWith('amf')) {
      return [RateControlMode.CBR, RateControlMode.VBR, RateControlMode.CQP, RateControlMode.ICQ];
    }
    if (encoder.startsWith('qsv')) {
      return [RateControlMode.CBR, RateControlMode.VBR, RateControlMode.CQP, RateControlMode.ICQ, RateControlMode.LA_ICQ];
    }
    return [RateControlMode.CBR, RateControlMode.VBR];
  }

  selectBestGPU(): GPUDevice | null {
    // Sort by memory and encoder support
    const sorted = [...this.status.availableGPUs].sort((a, b) => {
      // Prefer NVIDIA for streaming
      if (a.vendor === GPUVendor.NVIDIA && b.vendor !== GPUVendor.NVIDIA) return -1;
      if (b.vendor === GPUVendor.NVIDIA && a.vendor !== GPUVendor.NVIDIA) return 1;
      // Then by memory
      return b.memory - a.memory;
    });

    if (sorted.length > 0) {
      this.status.activeGPU = sorted[0];
      this.config.preferredGPU = sorted[0].id;
      return sorted[0];
    }
    return null;
  }

  setActiveGPU(gpuId: string): void {
    const gpu = this.status.availableGPUs.find(g => g.id === gpuId);
    if (gpu) {
      this.status.activeGPU = gpu;
      this.config.preferredGPU = gpuId;
      this.emit('gpuDetected', { selected: gpu });
    }
  }

  // ==========================================================================
  // ENCODER MANAGEMENT
  // ==========================================================================

  setActiveEncoder(encoder: HardwareEncoder): void {
    const capabilities = this.status.availableEncoders.find(e => e.encoder === encoder);
    if (capabilities) {
      this.status.activeEncoder = encoder;
      this.config.preferredEncoder = encoder;
      this.config.encoderSettings.encoder = encoder;
      this.emit('encoderChanged', { encoder, capabilities });
    }
  }

  updateEncoderSettings(settings: Partial<HardwareEncoderSettings>): void {
    this.config.encoderSettings = {
      ...this.config.encoderSettings,
      ...settings
    };
    this.emit('settingsChanged', { settings: this.config.encoderSettings });
  }

  getEncoderSettings(): HardwareEncoderSettings {
    return { ...this.config.encoderSettings };
  }

  // ==========================================================================
  // DECODER MANAGEMENT
  // ==========================================================================

  setActiveDecoder(decoder: HardwareDecoder): void {
    this.status.activeDecoder = decoder;
    this.config.decoderSettings.decoder = decoder;
    this.emit('decoderChanged', { decoder });
  }

  updateDecoderSettings(settings: Partial<HardwareDecoderSettings>): void {
    this.config.decoderSettings = {
      ...this.config.decoderSettings,
      ...settings
    };
    this.emit('settingsChanged', { settings: this.config.decoderSettings });
  }

  // ==========================================================================
  // ENCODING SESSIONS
  // ==========================================================================

  async startEncodingSession(): Promise<EncodingSession | null> {
    if (!this.status.activeGPU || !this.status.activeEncoder) {
      return null;
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: EncodingSession = {
      id: sessionId,
      encoder: this.status.activeEncoder,
      startedAt: new Date(),
      framesEncoded: 0,
      bytesEncoded: 0,
      averageFPS: 0,
      currentBitrate: this.config.encoderSettings.bitrate,
      droppedFrames: 0,
      latency: 0
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async stopEncodingSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
    }
  }

  getActiveSessions(): EncodingSession[] {
    return Array.from(this.sessions.values());
  }

  // ==========================================================================
  // STATISTICS & MONITORING
  // ==========================================================================

  private startStatsMonitoring(): void {
    this.statsInterval = setInterval(() => {
      this.updateGPUStats();
    }, 1000);
  }

  private async updateGPUStats(): Promise<void> {
    for (const gpu of this.status.availableGPUs) {
      // Simulated stats update
      const stats: GPUStatistics = {
        gpuId: gpu.id,
        timestamp: new Date(),
        utilization: Math.random() * 100,
        encoderUtilization: this.sessions.size > 0 ? Math.random() * 100 : 0,
        decoderUtilization: 0,
        memoryUsed: gpu.memoryUsed || 0 + Math.random() * 1000,
        memoryFree: gpu.memoryFree || 0 - Math.random() * 1000,
        memoryTotal: gpu.memory,
        temperature: (gpu.temperature || 45) + Math.random() * 10 - 5,
        powerDraw: 150 + Math.random() * 100,
        powerLimit: 320,
        fanSpeed: 40 + Math.random() * 30,
        clockCore: 2000 + Math.random() * 500,
        clockMemory: 21000 + Math.random() * 1000
      };

      this.gpuStats.set(gpu.id, stats);
    }

    this.emit('statsUpdated', { stats: Array.from(this.gpuStats.values()) });
  }

  getGPUStats(gpuId?: string): GPUStatistics | GPUStatistics[] | null {
    if (gpuId) {
      return this.gpuStats.get(gpuId) || null;
    }
    return Array.from(this.gpuStats.values());
  }

  // ==========================================================================
  // BENCHMARKING
  // ==========================================================================

  async runBenchmark(
    gpuId: string,
    encoder: HardwareEncoder,
    preset: EncoderPreset,
    resolution: string = '1920x1080',
    frameRate: number = 60,
    duration: number = 30
  ): Promise<BenchmarkResult> {
    const gpu = this.status.availableGPUs.find(g => g.id === gpuId);
    if (!gpu) {
      throw new Error(`GPU ${gpuId} not found`);
    }

    // Simulated benchmark
    await new Promise(resolve => setTimeout(resolve, duration * 1000));

    const result: BenchmarkResult = {
      id: `benchmark-${Date.now()}`,
      gpuId,
      encoder,
      preset,
      resolution,
      frameRate,
      bitrate: 6000,
      averageFPS: frameRate * (0.95 + Math.random() * 0.05),
      averageLatency: 5 + Math.random() * 10,
      cpuUsage: 5 + Math.random() * 10,
      gpuUsage: 60 + Math.random() * 30,
      powerConsumption: 150 + Math.random() * 100,
      qualityScore: 90 + Math.random() * 10,
      timestamp: new Date()
    };

    this.emit('benchmarkComplete', { result });
    return result;
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  updateConfig(config: Partial<HardwareAccelerationConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    this.emit('settingsChanged', { config: this.config });
  }

  getConfig(): HardwareAccelerationConfig {
    return { ...this.config };
  }

  getStatus(): HardwareAccelerationStatus {
    return { ...this.status };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let serviceInstance: HardwareAccelerationService | null = null;

export function getHardwareAccelerationService(): HardwareAccelerationService {
  if (!serviceInstance) {
    serviceInstance = new HardwareAccelerationService();
  }
  return serviceInstance;
}

export default HardwareAccelerationService;
