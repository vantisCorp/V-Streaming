import EventEmitter from 'eventemitter3';
import {
  TrackingProvider,
  TrackingStatus,
  TrackingQuality,
  TrackingConfig,
  FaceTrackingData,
  BodyTrackingData,
  HandTrackingData,
  BlendShapeBinding,
  Vector3,
  Quaternion,
  DEFAULT_TRACKING_CONFIG,
} from '../types/vtuber';

// ============ Event Types ============

interface TrackingEvents {
  'status-changed': (status: TrackingStatus) => void;
  'face-tracking': (data: FaceTrackingData) => void;
  'body-tracking': (data: BodyTrackingData) => void;
  'hand-tracking': (data: HandTrackingData) => void;
  'error': (error: Error) => void;
}

/**
 * TrackingService
 * 
 * Service for face and body tracking integration.
 * Supports multiple tracking providers including MediaPipe, WebRTC, and VMC protocol.
 */
export class TrackingService extends EventEmitter<TrackingEvents> {
  private static instance: TrackingService | null = null;
  
  private config: TrackingConfig = { ...DEFAULT_TRACKING_CONFIG };
  private status: TrackingStatus = TrackingStatus.IDLE;
  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private lastFaceData: FaceTrackingData | null = null;
  private lastBodyData: BodyTrackingData | null = null;
  private lastHandData: Map<'left' | 'right', HandTrackingData> = new Map();
  private trackingStartTime: number = 0;
  private frameCount: number = 0;
  private averageFPS: number = 0;

  private constructor() {
    super();
    this.loadPersistedConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  // ============ Lifecycle ============

  /**
   * Initialize tracking
   */
  public async initialize(config?: Partial<TrackingConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.status = TrackingStatus.INITIALIZING;
    this.emit('status-changed', this.status);

    try {
      // Initialize based on provider
      await this.initializeProvider();
      
      this.status = TrackingStatus.TRACKING;
      this.trackingStartTime = Date.now();
      this.frameCount = 0;
      this.emit('status-changed', this.status);
      
      // Start tracking loop
      this.startTrackingLoop();
      
      this.persistConfig();
    } catch (error) {
      this.status = TrackingStatus.ERROR;
      this.emit('status-changed', this.status);
      this.emit('error', error instanceof Error ? error : new Error('Failed to initialize tracking'));
      throw error;
    }
  }

  /**
   * Stop tracking
   */
  public stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    this.status = TrackingStatus.IDLE;
    this.emit('status-changed', this.status);
  }

  /**
   * Pause tracking
   */
  public pauseTracking(): void {
    if (this.status === TrackingStatus.TRACKING) {
      this.status = TrackingStatus.PAUSED;
      this.emit('status-changed', this.status);
    }
  }

  /**
   * Resume tracking
   */
  public resumeTracking(): void {
    if (this.status === TrackingStatus.PAUSED) {
      this.status = TrackingStatus.TRACKING;
      this.emit('status-changed', this.status);
    }
  }

  // ============ Configuration ============

  /**
   * Update tracking configuration
   */
  public updateConfig(config: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...config };
    this.persistConfig();
  }

  /**
   * Get current configuration
   */
  public getConfig(): TrackingConfig {
    return { ...this.config };
  }

  /**
   * Get current status
   */
  public getStatus(): TrackingStatus {
    return this.status;
  }

  // ============ Data Access ============

  /**
   * Get latest face tracking data
   */
  public getFaceData(): FaceTrackingData | null {
    return this.lastFaceData;
  }

  /**
   * Get latest body tracking data
   */
  public getBodyData(): BodyTrackingData | null {
    return this.lastBodyData;
  }

  /**
   * Get latest hand tracking data
   */
  public getHandData(side: 'left' | 'right'): HandTrackingData | null {
    return this.lastHandData.get(side) || null;
  }

  /**
   * Get tracking statistics
   */
  public getStats(): { fps: number; uptime: number; provider: TrackingProvider } {
    return {
      fps: this.averageFPS,
      uptime: this.status === TrackingStatus.TRACKING ? (Date.now() - this.trackingStartTime) / 1000 : 0,
      provider: this.config.provider,
    };
  }

  // ============ Calibration ============

  /**
   * Calibrate tracking
   */
  public async calibrate(): Promise<void> {
    if (this.status !== TrackingStatus.TRACKING) {
      throw new Error('Tracking must be active for calibration');
    }

    // Wait for stable face data
    const samples: FaceTrackingData[] = [];
    const sampleCount = 30;

    for (let i = 0; i < sampleCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 33)); // ~30fps
      if (this.lastFaceData) {
        samples.push(this.lastFaceData);
      }
    }

    if (samples.length < sampleCount / 2) {
      throw new Error('Insufficient tracking data for calibration');
    }

    // Calculate average neutral blend shapes
    const neutralBlendShapes = new Map<BlendShapeBinding, number>();
    const blendShapeKeys = [
      BlendShapeBinding.MOUTH_OPEN,
      BlendShapeBinding.MOUTH_SMILE,
      BlendShapeBinding.EYE_BLINK_LEFT,
      BlendShapeBinding.EYE_BLINK_RIGHT,
    ];

    for (const key of blendShapeKeys) {
      const values = samples.map(s => s.blendShapes.get(key) || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      neutralBlendShapes.set(key, avg);
    }

    // Calculate average head position
    const avgPosition: Vector3 = {
      x: samples.reduce((a, s) => a + s.position.x, 0) / samples.length,
      y: samples.reduce((a, s) => a + s.position.y, 0) / samples.length,
      z: samples.reduce((a, s) => a + s.position.z, 0) / samples.length,
    };

    this.config.calibration = {
      neutralBlendShapes,
      headOffset: avgPosition,
      eyeOffset: { x: 0, y: 0, z: 0 },
      timestamp: Date.now(),
    };

    this.persistConfig();
  }

  // ============ Private Methods ============

  private async initializeProvider(): Promise<void> {
    // Simulate provider initialization
    const initDelays: Record<TrackingProvider, number> = {
      [TrackingProvider.WEBRTC]: 200,
      [TrackingProvider.MEDIAPIPE]: 500,
      [TrackingProvider.FACE_API]: 300,
      [TrackingProvider.OPEN_SEE_FACE]: 400,
      [TrackingProvider.VMC]: 100,
      [TrackingProvider.CUSTOM]: 300,
    };

    await new Promise(resolve => setTimeout(resolve, initDelays[this.config.provider] || 300));

    // In a real implementation, this would initialize the actual tracking library
    // e.g., await loadMediaPipe(); await faceDetection.initialize(); etc.
  }

  private startTrackingLoop(): void {
    const intervalMs = 1000 / this.config.frameRate;
    
    this.trackingInterval = setInterval(() => {
      if (this.status !== TrackingStatus.TRACKING) return;
      
      this.updateTracking();
    }, intervalMs);
  }

  private updateTracking(): void {
    const now = Date.now();
    
    // Simulate tracking data
    if (this.config.faceTrackingEnabled) {
      this.updateFaceTracking(now);
    }
    
    if (this.config.bodyTrackingEnabled) {
      this.updateBodyTracking(now);
    }
    
    if (this.config.handTrackingEnabled) {
      this.updateHandTracking(now);
    }

    // Update FPS
    this.frameCount++;
    const elapsed = now - this.trackingStartTime;
    if (elapsed > 1000) {
      this.averageFPS = (this.frameCount * 1000) / elapsed;
    }
  }

  private updateFaceTracking(timestamp: number): void {
    // Simulate face tracking data
    // In real implementation, this would come from the tracking library
    const t = timestamp / 1000;
    
    // Apply smoothing
    const smoothing = this.config.smoothing;
    
    const blendShapes = new Map<BlendShapeBinding, number>();
    blendShapes.set(BlendShapeBinding.MOUTH_OPEN, 0.3 + Math.sin(t * 2) * 0.2);
    blendShapes.set(BlendShapeBinding.MOUTH_SMILE, 0.5 + Math.sin(t * 1.5) * 0.3);
    blendShapes.set(BlendShapeBinding.EYE_BLINK_LEFT, Math.random() < 0.01 ? 1 : 0);
    blendShapes.set(BlendShapeBinding.EYE_BLINK_RIGHT, Math.random() < 0.01 ? 1 : 0);
    
    const faceData: FaceTrackingData = {
      position: {
        x: Math.sin(t * 0.5) * 0.1,
        y: Math.cos(t * 0.3) * 0.05,
        z: 0,
      },
      rotation: {
        x: Math.sin(t * 0.7) * 5,
        y: Math.sin(t * 0.5) * 10,
        z: Math.sin(t * 0.3) * 3,
      },
      quaternion: this.eulerToQuaternion(
        Math.sin(t * 0.7) * 5,
        Math.sin(t * 0.5) * 10,
        Math.sin(t * 0.3) * 3
      ),
      blendShapes,
      eyeLookAt: {
        x: Math.sin(t) * 0.5,
        y: Math.cos(t) * 0.3,
        z: 1,
      },
      mouthOpen: 0.3 + Math.sin(t * 2) * 0.2,
      confidence: 0.9 + Math.random() * 0.1,
      timestamp,
    };

    // Apply calibration if available
    if (this.config.calibration) {
      for (const [key, neutral] of this.config.calibration.neutralBlendShapes) {
        const current = faceData.blendShapes.get(key) || 0;
        faceData.blendShapes.set(key, Math.max(0, current - neutral));
      }
    }

    // Apply smoothing to previous data
    if (this.lastFaceData && smoothing > 0) {
      faceData.position = this.lerpVector3(this.lastFaceData.position, faceData.position, 1 - smoothing);
      faceData.rotation = this.lerpVector3(this.lastFaceData.rotation, faceData.rotation, 1 - smoothing);
    }

    this.lastFaceData = faceData;
    this.emit('face-tracking', faceData);
  }

  private updateBodyTracking(timestamp: number): void {
    const t = timestamp / 1000;
    
    const bodyData: BodyTrackingData = {
      bones: [],
      joints: new Map(),
      jointRotations: new Map(),
      confidence: 0.8 + Math.random() * 0.2,
      timestamp,
    };

    // Simulate basic body pose
    bodyData.joints.set('head', { x: 0, y: 1.6, z: 0 });
    bodyData.joints.set('neck', { x: 0, y: 1.5, z: 0 });
    bodyData.joints.set('spine', { x: 0, y: 1.2, z: 0 });
    bodyData.joints.set('hips', { x: 0, y: 1.0, z: 0 });

    this.lastBodyData = bodyData;
    this.emit('body-tracking', bodyData);
  }

  private updateHandTracking(timestamp: number): void {
    const t = timestamp / 1000;

    for (const side of ['left', 'right'] as const) {
      const multiplier = side === 'left' ? -1 : 1;
      
      const handData: HandTrackingData = {
        side,
        fingers: {
          thumb: this.generateFingerPose(t, 2),
          index: this.generateFingerPose(t + 0.1, 3),
          middle: this.generateFingerPose(t + 0.2, 3),
          ring: this.generateFingerPose(t + 0.3, 3),
          pinky: this.generateFingerPose(t + 0.4, 3),
        },
        wrist: {
          x: multiplier * 0.3,
          y: 1.2,
          z: 0.2 + Math.sin(t) * 0.1,
        },
        wristRotation: this.eulerToQuaternion(0, 0, multiplier * 15),
        confidence: 0.85 + Math.random() * 0.15,
        timestamp,
      };

      this.lastHandData.set(side, handData);
      this.emit('hand-tracking', handData);
    }
  }

  private generateFingerPose(t: number, segments: number): Vector3[] {
    const positions: Vector3[] = [];
    for (let i = 0; i < segments; i++) {
      positions.push({
        x: i * 0.02,
        y: Math.sin(t + i * 0.5) * 0.01,
        z: i * 0.02,
      });
    }
    return positions;
  }

  private eulerToQuaternion(x: number, y: number, z: number): Quaternion {
    // Convert degrees to radians
    const rx = (x * Math.PI) / 180;
    const ry = (y * Math.PI) / 180;
    const rz = (z * Math.PI) / 180;

    const c1 = Math.cos(rx / 2);
    const c2 = Math.cos(ry / 2);
    const c3 = Math.cos(rz / 2);
    const s1 = Math.sin(rx / 2);
    const s2 = Math.sin(ry / 2);
    const s3 = Math.sin(rz / 2);

    return {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3,
    };
  }

  private lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  private persistConfig(): void {
    try {
      localStorage.setItem('tracking-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to persist tracking config:', error);
    }
  }

  private loadPersistedConfig(): void {
    try {
      const persisted = localStorage.getItem('tracking-config');
      if (persisted) {
        const config = JSON.parse(persisted);
        this.config = { ...DEFAULT_TRACKING_CONFIG, ...config };
      }
    } catch (error) {
      console.error('Failed to load persisted tracking config:', error);
    }
  }

  /**
   * Cleanup and destroy instance
   */
  public destroy(): void {
    this.stopTracking();
    this.removeAllListeners();
    TrackingService.instance = null;
  }
}

export default TrackingService.getInstance();