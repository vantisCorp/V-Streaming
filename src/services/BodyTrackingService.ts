import EventEmitter from 'eventemitter3';
import {
  BodyTrackingMode,
  BodyTrackingConfig,
  BodyTrackingCalibration,
  BodyTrackingStatistics,
  BodyTrackingState,
  BodyLandmark,
  FullBodyPose,
  IKTarget,
  IKSolveResult,
  IKSolveMethod,
  Vector3,
  Quaternion,
  DEFAULT_BODY_TRACKING_CONFIG,
  DEFAULT_BODY_TRACKING_STATISTICS,
  DEFAULT_BODY_TRACKING_STATE,
  TrackingStatus,
} from '../types/vtuber';

// ============ Event Types ============

interface BodyTrackingEvents {
  'status-changed': (status: TrackingStatus) => void;
  'pose-updated': (pose: FullBodyPose) => void;
  'ik-solved': (results: Map<string, IKSolveResult>) => void;
  'calibration-complete': (calibration: BodyTrackingCalibration) => void;
  'error': (error: Error) => void;
}

/**
 * BodyTrackingService
 * 
 * Service for full body tracking with IK solving.
 * Supports MediaPipe Pose for body landmark detection.
 */
export class BodyTrackingService extends EventEmitter<BodyTrackingEvents> {
  private static instance: BodyTrackingService | null = null;

  private config: BodyTrackingConfig = { ...DEFAULT_BODY_TRACKING_CONFIG };
  private state: BodyTrackingState = { ...DEFAULT_BODY_TRACKING_STATE };
  private status: TrackingStatus = TrackingStatus.IDLE;
  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private trackingStartTime: number = 0;
  private frameCount: number = 0;

  private constructor() {
    super();
    this.loadPersistedState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BodyTrackingService {
    if (!BodyTrackingService.instance) {
      BodyTrackingService.instance = new BodyTrackingService();
    }
    return BodyTrackingService.instance;
  }

  // ============ Lifecycle ============

  /**
   * Start body tracking
   */
  public async startTracking(config?: Partial<BodyTrackingConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.status = TrackingStatus.INITIALIZING;
    this.emit('status-changed', this.status);

    try {
      // Initialize tracking provider (simulated MediaPipe Pose)
      await this.initializeProvider();

      this.status = TrackingStatus.TRACKING;
      this.trackingStartTime = Date.now();
      this.frameCount = 0;
      this.emit('status-changed', this.status);

      // Start tracking loop
      this.startTrackingLoop();

      this.persistState();
    } catch (error) {
      this.status = TrackingStatus.ERROR;
      this.emit('status-changed', this.status);
      this.emit('error', error instanceof Error ? error : new Error('Failed to start body tracking'));
      throw error;
    }
  }

  /**
   * Stop body tracking
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
   * Pause body tracking
   */
  public pauseTracking(): void {
    if (this.status === TrackingStatus.TRACKING) {
      this.status = TrackingStatus.PAUSED;
      this.emit('status-changed', this.status);
    }
  }

  /**
   * Resume body tracking
   */
  public resumeTracking(): void {
    if (this.status === TrackingStatus.PAUSED) {
      this.status = TrackingStatus.TRACKING;
      this.emit('status-changed', this.status);
    }
  }

  // ============ Configuration ============

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<BodyTrackingConfig>): void {
    this.config = { ...this.config, ...config };
    this.persistState();
  }

  /**
   * Get current configuration
   */
  public getConfig(): BodyTrackingConfig {
    return { ...this.config };
  }

  /**
   * Get current status
   */
  public getStatus(): TrackingStatus {
    return this.status;
  }

  /**
   * Get current state
   */
  public getState(): BodyTrackingState {
    return { ...this.state };
  }

  // ============ Calibration ============

  /**
   * Calibrate body tracking
   */
  public async calibrate(pose: 't-pose' | 'a-pose' = 't-pose'): Promise<BodyTrackingCalibration> {
    if (this.status !== TrackingStatus.TRACKING) {
      throw new Error('Tracking must be active for calibration');
    }

    // Collect samples for calibration
    const samples: FullBodyPose[] = [];
    const sampleCount = 30;

    for (let i = 0; i < sampleCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 33));
      if (this.state.currentPose) {
        samples.push(this.state.currentPose);
      }
    }

    if (samples.length < sampleCount / 2) {
      throw new Error('Insufficient tracking data for calibration');
    }

    // Calculate average landmark positions
    const avgLandmarks = this.calculateAverageLandmarks(samples);

    // Calculate body measurements
    const shoulderWidth = this.calculateDistance(
      avgLandmarks.get(BodyLandmark.LEFT_SHOULDER)!,
      avgLandmarks.get(BodyLandmark.RIGHT_SHOULDER)!
    );

    const hipWidth = this.calculateDistance(
      avgLandmarks.get(BodyLandmark.LEFT_HIP)!,
      avgLandmarks.get(BodyLandmark.RIGHT_HIP)!
    );

    const leftArmLength =
      this.calculateDistance(avgLandmarks.get(BodyLandmark.LEFT_SHOULDER)!, avgLandmarks.get(BodyLandmark.LEFT_ELBOW)!) +
      this.calculateDistance(avgLandmarks.get(BodyLandmark.LEFT_ELBOW)!, avgLandmarks.get(BodyLandmark.LEFT_WRIST)!);

    const rightArmLength =
      this.calculateDistance(avgLandmarks.get(BodyLandmark.RIGHT_SHOULDER)!, avgLandmarks.get(BodyLandmark.RIGHT_ELBOW)!) +
      this.calculateDistance(avgLandmarks.get(BodyLandmark.RIGHT_ELBOW)!, avgLandmarks.get(BodyLandmark.RIGHT_WRIST)!);

    const armSpan = leftArmLength + rightArmLength + shoulderWidth;

    const userHeight = this.estimateUserHeight(avgLandmarks);

    const calibration: BodyTrackingCalibration = {
      tPose: pose === 't-pose' ? avgLandmarks : new Map(),
      aPose: pose === 'a-pose' ? avgLandmarks : new Map(),
      userHeight,
      armSpan,
      shoulderWidth,
      hipWidth,
      timestamp: Date.now(),
    };

    this.state.calibration = calibration;
    this.state.isCalibrated = true;
    this.persistState();
    this.emit('calibration-complete', calibration);

    return calibration;
  }

  // ============ IK Solving ============

  /**
   * Set IK target
   */
  public setIKTarget(target: IKTarget): void {
    this.state.ikTargets.set(target.joint, target);
  }

  /**
   * Clear IK target
   */
  public clearIKTarget(joint: string): void {
    this.state.ikTargets.delete(joint);
  }

  /**
   * Solve all IK targets
   */
  public solveIK(): Map<string, IKSolveResult> {
    const results = new Map<string, IKSolveResult>();

    for (const [joint, target] of this.state.ikTargets) {
      const result = this.solveIKTarget(target);
      results.set(joint, result);
    }

    this.state.ikResults = results;
    this.emit('ik-solved', results);

    return results;
  }

  // ============ Data Access ============

  /**
   * Get current pose
   */
  public getCurrentPose(): FullBodyPose | null {
    return this.state.currentPose;
  }

  /**
   * Get IK results
   */
  public getIKResults(): Map<string, IKSolveResult> {
    return new Map(this.state.ikResults);
  }

  /**
   * Get statistics
   */
  public getStatistics(): BodyTrackingStatistics {
    return { ...this.state.statistics };
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.state.statistics = { ...DEFAULT_BODY_TRACKING_STATISTICS };
    this.state.statistics.lastUpdated = Date.now();
    this.persistState();
  }

  // ============ Private Methods ============

  private async initializeProvider(): Promise<void> {
    // Simulate MediaPipe Pose initialization
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private startTrackingLoop(): void {
    const intervalMs = 1000 / 30; // 30 FPS

    this.trackingInterval = setInterval(() => {
      if (this.status !== TrackingStatus.TRACKING) return;
      this.updateTracking();
    }, intervalMs);
  }

  private updateTracking(): void {
    const timestamp = Date.now();

    // Simulate pose estimation
    const pose = this.simulatePoseEstimation(timestamp);

    // Apply smoothing
    if (this.state.currentPose && this.config.smoothing > 0) {
      this.state.previousPose = this.state.currentPose;
      this.smoothPose(pose, this.state.previousPose, this.config.smoothing);
    }

    this.state.currentPose = pose;
    this.emit('pose-updated', pose);

    // Solve IK if enabled
    if (this.config.ikEnabled) {
      this.solveIK();
    }

    // Update statistics
    this.frameCount++;
    const elapsed = timestamp - this.trackingStartTime;
    if (elapsed > 1000) {
      this.state.statistics.averageFPS = (this.frameCount * 1000) / elapsed;
    }
    this.state.statistics.trackingTime = elapsed / 1000;
    this.state.statistics.averageConfidence = pose.confidence;
    this.state.statistics.lastUpdated = timestamp;
  }

  private simulatePoseEstimation(timestamp: number): FullBodyPose {
    const t = timestamp / 1000;

    // Simulate realistic body movement
    const landmarks = new Map<BodyLandmark, Vector3>();
    const worldLandmarks = new Map<BodyLandmark, Vector3>();
    const visibility = new Map<BodyLandmark, number>();
    const presence = new Map<BodyLandmark, number>();

    // Head
    landmarks.set(BodyLandmark.NOSE, { x: 0, y: 1.6, z: 0.1 });
    landmarks.set(BodyLandmark.LEFT_EYE, { x: -0.03, y: 1.63, z: 0.12 });
    landmarks.set(BodyLandmark.RIGHT_EYE, { x: 0.03, y: 1.63, z: 0.12 });
    landmarks.set(BodyLandmark.LEFT_EAR, { x: -0.08, y: 1.62, z: 0 });
    landmarks.set(BodyLandmark.RIGHT_EAR, { x: 0.08, y: 1.62, z: 0 });

    // Shoulders - subtle movement
    const shoulderY = 1.45 + Math.sin(t * 0.5) * 0.01;
    landmarks.set(BodyLandmark.LEFT_SHOULDER, { x: -0.2, y: shoulderY, z: 0 });
    landmarks.set(BodyLandmark.RIGHT_SHOULDER, { x: 0.2, y: shoulderY, z: 0 });

    // Arms - natural arm swing
    const leftElbowAngle = Math.sin(t * 1.2) * 0.1;
    const rightElbowAngle = Math.sin(t * 1.2 + Math.PI) * 0.1;
    landmarks.set(BodyLandmark.LEFT_ELBOW, {
      x: -0.35,
      y: 1.2 + leftElbowAngle,
      z: -0.05 + Math.sin(t * 0.8) * 0.03
    });
    landmarks.set(BodyLandmark.RIGHT_ELBOW, {
      x: 0.35,
      y: 1.2 + rightElbowAngle,
      z: -0.05 + Math.cos(t * 0.8) * 0.03
    });

    // Wrists
    landmarks.set(BodyLandmark.LEFT_WRIST, {
      x: -0.3,
      y: 0.95 + Math.sin(t * 1.5) * 0.05,
      z: -0.1 + Math.sin(t * 0.6) * 0.05
    });
    landmarks.set(BodyLandmark.RIGHT_WRIST, {
      x: 0.3,
      y: 0.95 + Math.cos(t * 1.5) * 0.05,
      z: -0.1 + Math.cos(t * 0.6) * 0.05
    });

    // Hands
    landmarks.set(BodyLandmark.LEFT_THUMB, { x: -0.28, y: 0.9, z: -0.08 });
    landmarks.set(BodyLandmark.LEFT_INDEX, { x: -0.26, y: 0.85, z: -0.12 });
    landmarks.set(BodyLandmark.LEFT_PINKY, { x: -0.32, y: 0.88, z: -0.1 });
    landmarks.set(BodyLandmark.RIGHT_THUMB, { x: 0.28, y: 0.9, z: -0.08 });
    landmarks.set(BodyLandmark.RIGHT_INDEX, { x: 0.26, y: 0.85, z: -0.12 });
    landmarks.set(BodyLandmark.RIGHT_PINKY, { x: 0.32, y: 0.88, z: -0.1 });

    // Hips
    landmarks.set(BodyLandmark.LEFT_HIP, { x: -0.1, y: 0.95, z: 0 });
    landmarks.set(BodyLandmark.RIGHT_HIP, { x: 0.1, y: 0.95, z: 0 });

    // Legs - subtle movement
    landmarks.set(BodyLandmark.LEFT_KNEE, {
      x: -0.1,
      y: 0.5 + Math.sin(t * 0.4) * 0.02,
      z: 0.02
    });
    landmarks.set(BodyLandmark.RIGHT_KNEE, {
      x: 0.1,
      y: 0.5 + Math.sin(t * 0.4 + Math.PI) * 0.02,
      z: 0.02
    });

    // Feet
    landmarks.set(BodyLandmark.LEFT_ANKLE, { x: -0.1, y: 0.1, z: 0.05 });
    landmarks.set(BodyLandmark.RIGHT_ANKLE, { x: 0.1, y: 0.1, z: 0.05 });
    landmarks.set(BodyLandmark.LEFT_HEEL, { x: -0.1, y: 0.05, z: -0.02 });
    landmarks.set(BodyLandmark.RIGHT_HEEL, { x: 0.1, y: 0.05, z: -0.02 });
    landmarks.set(BodyLandmark.LEFT_FOOT_INDEX, { x: -0.1, y: 0.02, z: 0.12 });
    landmarks.set(BodyLandmark.RIGHT_FOOT_INDEX, { x: 0.1, y: 0.02, z: 0.12 });

    // Set visibility and presence for all landmarks
    for (const landmark of Object.values(BodyLandmark)) {
      if (!isNaN(Number(landmark))) {
        visibility.set(Number(landmark), 0.9 + Math.random() * 0.1);
        presence.set(Number(landmark), 0.95 + Math.random() * 0.05);
        worldLandmarks.set(Number(landmark), landmarks.get(Number(landmark)) || { x: 0, y: 0, z: 0 });
      }
    }

    // Calculate segment normals
    const segmentNormals = this.calculateSegmentNormals(landmarks);

    return {
      landmarks,
      worldLandmarks,
      visibility,
      presence,
      segmentNormals,
      confidence: 0.85 + Math.random() * 0.15,
      timestamp,
    };
  }

  private calculateSegmentNormals(landmarks: Map<BodyLandmark, Vector3>): Map<string, Vector3> {
    const normals = new Map<string, Vector3>();

    // Calculate normal for each body segment
    const segments = [
      ['left_arm', BodyLandmark.LEFT_SHOULDER, BodyLandmark.LEFT_ELBOW],
      ['right_arm', BodyLandmark.RIGHT_SHOULDER, BodyLandmark.RIGHT_ELBOW],
      ['left_forearm', BodyLandmark.LEFT_ELBOW, BodyLandmark.LEFT_WRIST],
      ['right_forearm', BodyLandmark.RIGHT_ELBOW, BodyLandmark.RIGHT_WRIST],
      ['spine', BodyLandmark.LEFT_HIP, BodyLandmark.LEFT_SHOULDER],
      ['left_thigh', BodyLandmark.LEFT_HIP, BodyLandmark.LEFT_KNEE],
      ['right_thigh', BodyLandmark.RIGHT_HIP, BodyLandmark.RIGHT_KNEE],
      ['left_calf', BodyLandmark.LEFT_KNEE, BodyLandmark.LEFT_ANKLE],
      ['right_calf', BodyLandmark.RIGHT_KNEE, BodyLandmark.RIGHT_ANKLE],
    ];

    for (const [name, start, end] of segments) {
      const startVec = landmarks.get(start as BodyLandmark);
      const endVec = landmarks.get(end as BodyLandmark);
      if (startVec && endVec) {
        const normal = this.normalizeVector({
          x: endVec.x - startVec.x,
          y: endVec.y - startVec.y,
          z: endVec.z - startVec.z,
        });
        normals.set(name as string, normal);
      }
    }

    return normals;
  }

  private smoothPose(current: FullBodyPose, previous: FullBodyPose, factor: number): void {
    for (const [landmark, pos] of current.landmarks) {
      const prevPos = previous.landmarks.get(landmark);
      if (prevPos) {
        pos.x = prevPos.x + (pos.x - prevPos.x) * (1 - factor);
        pos.y = prevPos.y + (pos.y - prevPos.y) * (1 - factor);
        pos.z = prevPos.z + (pos.z - prevPos.z) * (1 - factor);
      }
    }
  }

  private solveIKTarget(target: IKTarget): IKSolveResult {
    const startTime = performance.now();

    // Simulate IK solving based on method
    let iterations = 0;
    let success = true;

    switch (this.config.ikMethod) {
      case IKSolveMethod.FABRIK:
        iterations = this.solveFABRIK(target);
        break;
      case IKSolveMethod.CCD_IK:
        iterations = this.solveCCD(target);
        break;
      case IKSolveMethod.TWO_BONE:
        iterations = this.solveTwoBone(target);
        break;
      default:
        iterations = this.solveAnalytical(target);
    }

    const solveTime = performance.now() - startTime;
    this.state.statistics.ikSolveCount++;
    this.state.statistics.averageIKSolveTime =
      (this.state.statistics.averageIKSolveTime * (this.state.statistics.ikSolveCount - 1) + solveTime) /
      this.state.statistics.ikSolveCount;

    // Generate joint rotations (simulated)
    const jointRotations = new Map<string, Quaternion>();
    jointRotations.set(target.joint, { x: 0, y: 0, z: 0, w: 1 });

    return {
      jointRotations,
      endEffectorPosition: target.position,
      success,
      iterations,
    };
  }

  private solveFABRIK(target: IKTarget): number {
    // Simulated FABRIK solver
    return Math.floor(Math.random() * 5) + 3;
  }

  private solveCCD(target: IKTarget): number {
    // Simulated CCD solver
    return Math.floor(Math.random() * 10) + 5;
  }

  private solveTwoBone(target: IKTarget): number {
    // Two-bone IK is analytical
    return 1;
  }

  private solveAnalytical(target: IKTarget): number {
    // Analytical solution
    return 1;
  }

  private calculateAverageLandmarks(samples: FullBodyPose[]): Map<BodyLandmark, Vector3> {
    const avgLandmarks = new Map<BodyLandmark, Vector3>();
    const landmarkValues = Object.values(BodyLandmark).filter(v => !isNaN(Number(v))) as BodyLandmark[];

    for (const landmark of landmarkValues) {
      const positions = samples
        .map(s => s.landmarks.get(landmark))
        .filter((p): p is Vector3 => p !== undefined);

      if (positions.length > 0) {
        avgLandmarks.set(landmark, {
          x: positions.reduce((a, p) => a + p.x, 0) / positions.length,
          y: positions.reduce((a, p) => a + p.y, 0) / positions.length,
          z: positions.reduce((a, p) => a + p.z, 0) / positions.length,
        });
      }
    }

    return avgLandmarks;
  }

  private calculateDistance(a: Vector3, b: Vector3): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2));
  }

  private estimateUserHeight(landmarks: Map<BodyLandmark, Vector3>): number {
    const nose = landmarks.get(BodyLandmark.NOSE);
    const leftAnkle = landmarks.get(BodyLandmark.LEFT_ANKLE);
    const rightAnkle = landmarks.get(BodyLandmark.RIGHT_ANKLE);

    if (nose && leftAnkle && rightAnkle) {
      const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
      return nose.y - avgAnkleY;
    }

    return 1.7; // Default height
  }

  private normalizeVector(v: Vector3): Vector3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length,
    };
  }

  private persistState(): void {
    try {
      localStorage.setItem('body-tracking-config', JSON.stringify(this.config));
      localStorage.setItem('body-tracking-calibration', JSON.stringify(this.state.calibration));
    } catch (error) {
      console.error('Failed to persist body tracking state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const config = localStorage.getItem('body-tracking-config');
      if (config) {
        this.config = { ...DEFAULT_BODY_TRACKING_CONFIG, ...JSON.parse(config) };
      }

      const calibration = localStorage.getItem('body-tracking-calibration');
      if (calibration) {
        this.state.calibration = JSON.parse(calibration);
        this.state.isCalibrated = true;
      }
    } catch (error) {
      console.error('Failed to load persisted body tracking state:', error);
    }
  }

  /**
   * Cleanup and destroy instance
   */
  public destroy(): void {
    this.stopTracking();
    this.removeAllListeners();
    BodyTrackingService.instance = null;
  }
}

export default BodyTrackingService.getInstance();