/**
 * V-Streaming Hardware Encoding Manager
 * Supports NVENC (NVIDIA), AMF (AMD), and QuickSync (Intel) encoders
 */

import { EventEmitter } from 'eventemitter3';
import type {
  EncoderCapability,
  EncoderConfig,
  EncoderStatistics,
  EncoderPerformanceMetrics,
  EncoderError,
  PresetConfig,
  ResolutionPreset,
  FrameratePreset,
  EncoderEventType,
  EncoderEvents,
  IEncoderManager,
  EncoderEventEmitter,
} from '../types/encoding';
import {
  EncoderBackend,
  CodecType,
  EncoderPreset,
  RateControlMode,
  H264Profile,
  HEVCProfile,
  EncoderStatus,
  defaultEncoderConfig,
} from '../types/encoding';

export class EncoderManager extends EventEmitter<EncoderEvents> implements IEncoderManager {
  private static instance: EncoderManager;

  private currentBackend: EncoderBackend = EncoderBackend.NVENC;
  private currentCodec: CodecType = CodecType.H264;
  private config: EncoderConfig;
  private status: EncoderStatus = EncoderStatus.IDLE;
  private statistics: EncoderStatistics;
  private performanceMetrics: EncoderPerformanceMetrics;
  private availableBackends: Map<EncoderBackend, EncoderCapability>;
  private presetConfigs: PresetConfig[];
  private resolutionPresets: ResolutionPreset[];
  private frameratePresets: FrameratePreset[];
  private errorHistory: EncoderError[] = [];
  private statisticsHistory: EncoderStatistics[] = [];
  private statsUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private runningStartTime: number = 0;
  private encodeTimeSamples: number[] = [];

  // Default resolution presets
  private readonly defaultResolutionPresets: ResolutionPreset[] = [
    {
      width: 1920,
      height: 1080,
      name: '1080p',
      recommendedBitrates: {
        min: 3000,
        recommended: 6000,
        max: 9000,
      },
    },
    {
      width: 1280,
      height: 720,
      name: '720p',
      recommendedBitrates: {
        min: 1500,
        recommended: 3000,
        max: 4500,
      },
    },
    {
      width: 3840,
      height: 2160,
      name: '4K',
      recommendedBitrates: {
        min: 10000,
        recommended: 20000,
        max: 45000,
      },
    },
  ];

  // Default framerate presets
  private readonly defaultFrameratePresets: FrameratePreset[] = [
    {
      fps: 30,
      name: '30 FPS',
      recommendedBitrates: {
        min: 2000,
        recommended: 4000,
        max: 6000,
      },
    },
    {
      fps: 60,
      name: '60 FPS',
      recommendedBitrates: {
        min: 4000,
        recommended: 6000,
        max: 12000,
      },
    },
  ];

  // Default preset configurations
  private readonly defaultPresets: PresetConfig[] = [
    {
      id: 'ultra_fast',
      name: 'Ultra Fast',
      description: 'Maximum performance, lower quality',
      config: {
        preset: EncoderPreset.P1,
        multipass: 'disabled',
        lookahead: 0,
        bFrames: 0,
        adaptiveQuantization: false,
        psychoVisualTuning: false,
      },
      recommendedFor: ['Low-end hardware', 'High motion content'],
      icon: '⚡',
    },
    {
      id: 'fast',
      name: 'Fast',
      description: 'Good performance, decent quality',
      config: {
        preset: EncoderPreset.P3,
        multipass: 'disabled',
        lookahead: 5,
        bFrames: 0,
        adaptiveQuantization: true,
        psychoVisualTuning: false,
      },
      recommendedFor: ['Mid-range hardware', 'Gaming'],
      icon: '🏃',
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good balance of performance and quality',
      config: {
        preset: EncoderPreset.P6,
        multipass: 'quarter',
        lookahead: 10,
        bFrames: 0,
        adaptiveQuantization: true,
        psychoVisualTuning: false,
      },
      recommendedFor: ['General streaming', 'Most use cases'],
      icon: '⚖️',
    },
    {
      id: 'quality',
      name: 'Quality',
      description: 'Higher quality, lower performance',
      config: {
        preset: EncoderPreset.P7,
        multipass: 'quarter',
        lookahead: 15,
        bFrames: 2,
        adaptiveQuantization: true,
        psychoVisualTuning: true,
      },
      recommendedFor: ['High-end hardware', 'Professional streaming'],
      icon: '✨',
    },
    {
      id: 'max_quality',
      name: 'Max Quality',
      description: 'Maximum quality, lowest performance',
      config: {
        preset: EncoderPreset.P9,
        multipass: 'full',
        lookahead: 20,
        bFrames: 4,
        adaptiveQuantization: true,
        psychoVisualTuning: true,
        temporalAQ: true,
        spatialAQ: 20,
      },
      recommendedFor: ['VOD recording', 'High-end hardware'],
      icon: '🎬',
    },
  ];

  private constructor() {
    super();
    this.config = this.loadConfig();
    this.availableBackends = this.detectBackends();
    this.presetConfigs = this.defaultPresets;
    this.resolutionPresets = this.defaultResolutionPresets;
    this.frameratePresets = this.defaultFrameratePresets;
    this.statistics = this.initializeStatistics();
    this.performanceMetrics = this.initializePerformanceMetrics();
  }

  public static getInstance(): EncoderManager {
    if (!EncoderManager.instance) {
      EncoderManager.instance = new EncoderManager();
    }
    return EncoderManager.instance;
  }

  private loadConfig(): EncoderConfig {
    try {
      const saved = localStorage.getItem('encoder_config');
      if (saved) {
        return { ...defaultEncoderConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load encoder config:', error);
    }
    return { ...defaultEncoderConfig };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('encoder_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save encoder config:', error);
    }
  }

  private detectBackends(): Map<EncoderBackend, EncoderCapability> {
    const backends = new Map<EncoderBackend, EncoderCapability>();

    // NVENC (NVIDIA) capabilities
    backends.set(EncoderBackend.NVENC, {
      backend: EncoderBackend.NVENC,
      name: 'NVIDIA NVENC',
      description: 'NVIDIA GPU hardware encoder with excellent quality and performance',
      available: true, // Will be detected via Tauri commands
      supportedCodecs: [CodecType.H264, CodecType.HEVC, CodecType.AV1],
      maxResolution: { width: 8192, height: 8192 },
      maxFramerate: 144,
      maxBitrate: 500000, // 500 Mbps
      features: [
        { name: 'B-frames', available: true, description: 'Bidirectional frames for better compression' },
        { name: 'Multipass', available: true, description: 'Multiple encoding passes for quality' },
        { name: 'Lookahead', available: true, description: 'Future frame analysis' },
        { name: 'Adaptive Quantization', available: true, description: 'Dynamic bitrate allocation' },
        { name: 'Psycho Visual Tuning', available: true, description: 'Human visual system optimization' },
        { name: 'Temporal AQ', available: true, description: 'Temporal adaptive quantization' },
        { name: 'Spatial AQ', available: true, description: 'Spatial adaptive quantization' },
      ],
      presets: [
        EncoderPreset.P1, EncoderPreset.P2, EncoderPreset.P3, EncoderPreset.P4, EncoderPreset.P5,
        EncoderPreset.P6, EncoderPreset.P7, EncoderPreset.P8, EncoderPreset.P9,
      ],
    });

    // AMF (AMD) capabilities
    backends.set(EncoderBackend.AMF, {
      backend: EncoderBackend.AMF,
      name: 'AMD AMF',
      description: 'AMD GPU hardware encoder with good quality and performance',
      available: true,
      supportedCodecs: [CodecType.H264, CodecType.HEVC, CodecType.AV1],
      maxResolution: { width: 8192, height: 8192 },
      maxFramerate: 120,
      maxBitrate: 400000,
      features: [
        { name: 'B-frames', available: true, description: 'Bidirectional frames' },
        { name: 'Multipass', available: true, description: 'Multiple encoding passes' },
        { name: 'Lookahead', available: true, description: 'Future frame analysis' },
        { name: 'Adaptive Quantization', available: true, description: 'Dynamic bitrate allocation' },
        { name: 'Psycho Visual Tuning', available: false, description: 'Human visual system optimization' },
      ],
      presets: [
        EncoderPreset.P1, EncoderPreset.P2, EncoderPreset.P3, EncoderPreset.P4, EncoderPreset.P5,
        EncoderPreset.P6, EncoderPreset.P7,
      ],
    });

    // QuickSync (Intel) capabilities
    backends.set(EncoderBackend.QUICKSYNC, {
      backend: EncoderBackend.QUICKSYNC,
      name: 'Intel QuickSync',
      description: 'Intel integrated graphics hardware encoder',
      available: true,
      supportedCodecs: [CodecType.H264, CodecType.HEVC, CodecType.AV1],
      maxResolution: { width: 8192, height: 8192 },
      maxFramerate: 60,
      maxBitrate: 300000,
      features: [
        { name: 'B-frames', available: true, description: 'Bidirectional frames' },
        { name: 'Multipass', available: true, description: 'Multiple encoding passes' },
        { name: 'Lookahead', available: false, description: 'Future frame analysis' },
        { name: 'Adaptive Quantization', available: true, description: 'Dynamic bitrate allocation' },
      ],
      presets: [
        EncoderPreset.P1, EncoderPreset.P2, EncoderPreset.P3, EncoderPreset.P4, EncoderPreset.P5,
      ],
    });

    // Software encoder (fallback)
    backends.set(EncoderBackend.SOFTWARE, {
      backend: EncoderBackend.SOFTWARE,
      name: 'Software (x264/x265)',
      description: 'CPU-based software encoder',
      available: true,
      supportedCodecs: [CodecType.H264, CodecType.HEVC],
      maxResolution: { width: 8192, height: 8192 },
      maxFramerate: 60,
      maxBitrate: 200000,
      features: [
        { name: 'B-frames', available: true, description: 'Bidirectional frames' },
        { name: 'Multipass', available: false, description: 'Multiple encoding passes' },
        { name: 'Lookahead', available: true, description: 'Future frame analysis' },
      ],
      presets: [
        EncoderPreset.P1, EncoderPreset.P2, EncoderPreset.P3, EncoderPreset.P4, EncoderPreset.P5,
      ],
    });

    return backends;
  }

  private initializeStatistics(): EncoderStatistics {
    return {
      status: this.status,
      fps: 0,
      bitrate: 0,
      avgBitrate: 0,
      droppedFrames: 0,
      totalFrames: 0,
      encodedFrames: 0,
      latency: 0,
      avgLatency: 0,
      cpuUsage: 0,
      gpuUsage: 0,
      memoryUsage: 0,
      qualityMetric: {
        psnr: 0,
        ssim: 0,
        vmaf: 0,
      },
      timestamp: Date.now(),
    };
  }

  private initializePerformanceMetrics(): EncoderPerformanceMetrics {
    return {
      avgEncodeTime: 0,
      maxEncodeTime: 0,
      minEncodeTime: Infinity,
      frameVariance: 0,
      droppedFrameRate: 0,
      bitrateVariance: 0,
      timestamp: Date.now(),
    };
  }

  public getAvailableBackends(): EncoderCapability[] {
    return Array.from(this.availableBackends.values()).filter(b => b.available);
  }

  public getCurrentBackend(): EncoderBackend {
    return this.currentBackend;
  }

  public async setBackend(backend: EncoderBackend): Promise<void> {
    if (this.status === EncoderStatus.ENCODING) {
      throw new Error('Cannot change backend while encoding is active');
    }

    if (!this.availableBackends.has(backend)) {
      throw new Error(`Backend ${backend} is not available`);
    }

    const backendInfo = this.availableBackends.get(backend);
    if (!backendInfo?.available) {
      throw new Error(`Backend ${backend} is not available on this system`);
    }

    if (!backendInfo.supportedCodecs.includes(this.currentCodec)) {
      // Switch to first supported codec
      this.currentCodec = backendInfo.supportedCodecs[0];
    }

    this.currentBackend = backend;
    this.config.backend = backend;
    this.saveConfig();
    this.emit('backendChanged', backend);
  }

  public getSupportedCodecs(backend: EncoderBackend): CodecType[] {
    const backendInfo = this.availableBackends.get(backend);
    return backendInfo?.supportedCodecs || [];
  }

  public getCurrentCodec(): CodecType {
    return this.currentCodec;
  }

  public async setCodec(codec: CodecType): Promise<void> {
    if (this.status === EncoderStatus.ENCODING) {
      throw new Error('Cannot change codec while encoding is active');
    }

    const backendInfo = this.availableBackends.get(this.currentBackend);
    if (!backendInfo?.supportedCodecs.includes(codec)) {
      throw new Error(`Codec ${codec} is not supported by backend ${this.currentBackend}`);
    }

    this.currentCodec = codec;
    this.config.codec = codec;
    this.saveConfig();
    this.emit('codecChanged', codec);
  }

  public getConfig(): EncoderConfig {
    return { ...this.config };
  }

  public async setConfig(config: Partial<EncoderConfig>): Promise<void> {
    // Validate configuration
    if (config.backend && config.backend !== this.currentBackend) {
      await this.setBackend(config.backend);
    }

    if (config.codec && config.codec !== this.currentCodec) {
      await this.setCodec(config.codec);
    }

    // Update config
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.emit('configChanged', this.config);
  }

  public getStatistics(): EncoderStatistics {
    return { ...this.statistics };
  }

  public getStatus(): EncoderStatus {
    return this.status;
  }

  public async start(): Promise<void> {
    if (this.status === EncoderStatus.ENCODING) {
      throw new Error('Encoder is already running');
    }

    this.setStatus(EncoderStatus.INITIALIZING);

    try {
      // Initialize encoder via Tauri command
      // await invoke('init_encoder', { config: this.config });

      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 500));

      this.setStatus(EncoderStatus.ENCODING);
      this.runningStartTime = Date.now();
      this.startStatisticsUpdates();
    } catch (error) {
      const encoderError: EncoderError = {
        type: 'initialization',
        message: 'Failed to initialize encoder',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
      this.errorHistory.push(encoderError);
      this.setStatus(EncoderStatus.ERROR);
      this.emit('error', encoderError);
      throw encoderError;
    }
  }

  public async stop(): Promise<void> {
    if (this.status === EncoderStatus.IDLE) {
      return;
    }

    this.setStatus(EncoderStatus.STOPPING);

    try {
      // Stop encoder via Tauri command
      // await invoke('stop_encoder');

      // Simulate stopping delay
      await new Promise(resolve => setTimeout(resolve, 200));

      this.stopStatisticsUpdates();
      this.runningStartTime = 0;
      this.encodeTimeSamples = [];
      this.setStatus(EncoderStatus.IDLE);
    } catch (error) {
      const encoderError: EncoderError = {
        type: 'encoding',
        message: 'Failed to stop encoder',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
      this.errorHistory.push(encoderError);
      this.setStatus(EncoderStatus.ERROR);
      this.emit('error', encoderError);
      throw encoderError;
    }
  }

  public isRunning(): boolean {
    return this.status === EncoderStatus.ENCODING;
  }

  public getCapabilities(backend: EncoderBackend): EncoderCapability | null {
    return this.availableBackends.get(backend) || null;
  }

  public resetToDefaults(): void {
    if (this.status === EncoderStatus.ENCODING) {
      throw new Error('Cannot reset defaults while encoding is active');
    }

    this.config = { ...defaultEncoderConfig };
    this.currentBackend = EncoderBackend.NVENC;
    this.currentCodec = CodecType.H264;
    this.saveConfig();
    this.emit('configChanged', this.config);
  }

  public getPresetConfigs(): PresetConfig[] {
    return [...this.presetConfigs];
  }

  public getResolutionPresets(): ResolutionPreset[] {
    return [...this.resolutionPresets];
  }

  public getFrameratePresets(): FrameratePreset[] {
    return [...this.frameratePresets];
  }

  public getRecommendedBitrate(resolution: { width: number; height: number }, fps: number): number {
    const resolutionPreset = this.resolutionPresets.find(r =>
      r.width === resolution.width && r.height === resolution.height
    );
    const frameratePreset = this.frameratePresets.find(f => f.fps === fps);

    if (resolutionPreset && frameratePreset) {
      // Average both recommendations
      const resolutionRec = resolutionPreset.recommendedBitrates.recommended;
      const framerateRec = frameratePreset.recommendedBitrates.recommended;
      return Math.round((resolutionRec + framerateRec) / 2);
    }

    return 6000; // Default recommendation
  }

  public getErrorHistory(): EncoderError[] {
    return [...this.errorHistory];
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  public getStatisticsHistory(): EncoderStatistics[] {
    return [...this.statisticsHistory];
  }

  private setStatus(status: EncoderStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statistics.status = status;
      this.emit('statusChanged', status);
    }
  }

  private startStatisticsUpdates(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }

    this.statsUpdateInterval = setInterval(() => {
      this.updateStatistics();
    }, 1000);
  }

  private stopStatisticsUpdates(): void {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
  }

  private updateStatistics(): void {
    // Simulate encoder statistics
    // In production, this would come from Tauri commands
    const now = Date.now();
    const elapsed = (now - this.runningStartTime) / 1000;

    this.statistics.fps = this.config.rateControlMode === 'cbr' ? 60 : 58 + Math.random() * 2;
    this.statistics.bitrate = this.config.bitrate + (Math.random() - 0.5) * 100;
    this.statistics.avgBitrate = this.statistics.avgBitrate === 0
      ? this.statistics.bitrate
      : (this.statistics.avgBitrate * 0.9 + this.statistics.bitrate * 0.1);
    this.statistics.totalFrames = Math.round(this.statistics.fps * elapsed);
    this.statistics.encodedFrames = this.statistics.totalFrames - this.statistics.droppedFrames;
    this.statistics.latency = 5 + Math.random() * 3;
    this.statistics.avgLatency = this.statistics.avgLatency === 0
      ? this.statistics.latency
      : (this.statistics.avgLatency * 0.95 + this.statistics.latency * 0.05);
    this.statistics.cpuUsage = 5 + Math.random() * 10;
    this.statistics.gpuUsage = 15 + Math.random() * 20;
    this.statistics.memoryUsage = 200 + Math.random() * 50;
    this.statistics.timestamp = now;

    // Update performance metrics
    this.performanceMetrics.avgEncodeTime = this.statistics.avgLatency;
    this.performanceMetrics.maxEncodeTime = Math.max(
      this.performanceMetrics.maxEncodeTime,
      this.statistics.latency
    );
    this.performanceMetrics.minEncodeTime = Math.min(
      this.performanceMetrics.minEncodeTime,
      this.statistics.latency
    );
    this.performanceMetrics.timestamp = now;

    // Keep history
    this.statisticsHistory.push({ ...this.statistics });
    if (this.statisticsHistory.length > 1000) {
      this.statisticsHistory.shift();
    }

    this.emit('statisticsUpdated', this.statistics);
  }
}

// Export singleton instance
export const encoderManager = EncoderManager.getInstance();