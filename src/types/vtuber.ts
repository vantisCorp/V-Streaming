/**
 * VTuber Types - Type definitions for VTuber features
 * Supports VRM, Live2D, and custom 3D model integration
 */

// ============ Enums ============

/**
 * Supported 3D model types
 */
export enum ModelType {
  VRM = 'vrm',
  LIVE2D = 'live2d',
  VRM_READY = 'vrm-ready',
  CUSTOM = 'custom',
}

/**
 * Model loading status
 */
export enum ModelStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Tracking provider types
 */
export enum TrackingProvider {
  WEBRTC = 'webrtc',
  MEDIAPIPE = 'mediapipe',
  FACE_API = 'face-api',
  OPEN_SEE_FACE = 'open-see-face',
  VMC = 'vmc',
  CUSTOM = 'custom',
}

/**
 * Tracking status
 */
export enum TrackingStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  TRACKING = 'tracking',
  PAUSED = 'paused',
  ERROR = 'error',
}

/**
 * Expression categories for VTuber avatars
 */
export enum ExpressionCategory {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  SURPRISED = 'surprised',
  RELAXED = 'relaxed',
  CUSTOM = 'custom',
}

/**
 * Blend shape binding types
 */
export enum BlendShapeBinding {
  MOUTH_OPEN = 'mouthOpen',
  MOUTH_SMILE = 'mouthSmile',
  EYE_BLINK_LEFT = 'eyeBlinkLeft',
  EYE_BLINK_RIGHT = 'eyeBlinkRight',
  EYE_WIDE_LEFT = 'eyeWideLeft',
  EYE_WIDE_RIGHT = 'eyeWideRight',
  BROW_UP_LEFT = 'browUpLeft',
  BROW_UP_RIGHT = 'browUpRight',
  BROW_DOWN_LEFT = 'browDownLeft',
  BROW_DOWN_RIGHT = 'browDownRight',
  CHEEK_PUFF = 'cheekPuff',
  JAW_OPEN = 'jawOpen',
  TONGUE_OUT = 'tongueOut',
  CUSTOM = 'custom',
}

/**
 * Bone types for skeletal animation
 */
export enum BoneType {
  HEAD = 'head',
  NECK = 'neck',
  SPINE = 'spine',
  LEFT_SHOULDER = 'leftShoulder',
  RIGHT_SHOULDER = 'rightShoulder',
  LEFT_ARM = 'leftArm',
  RIGHT_ARM = 'rightArm',
  LEFT_HAND = 'leftHand',
  RIGHT_HAND = 'rightHand',
  LEFT_LEG = 'leftLeg',
  RIGHT_LEG = 'rightLeg',
  HIPS = 'hips',
  CUSTOM = 'custom',
}

/**
 * Tracking quality levels
 */
export enum TrackingQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

// ============ Interfaces ============

/**
 * 3D model configuration
 */
export interface ModelConfig {
  /** Unique identifier for the model */
  id: string;
  /** Model name */
  name: string;
  /** Model type (VRM, Live2D, etc.) */
  type: ModelType;
  /** Model file path or URL */
  source: string;
  /** Thumbnail image path */
  thumbnail?: string;
  /** Model scale */
  scale: number;
  /** Model position offset */
  position: Vector3;
  /** Model rotation offset */
  rotation: Vector3;
  /** Enable physics */
  physicsEnabled: boolean;
  /** Enable eye look at */
  lookAtEnabled: boolean;
  /** Enable auto blink */
  autoBlinkEnabled: boolean;
  /** Auto blink interval in milliseconds */
  autoBlinkInterval: number;
  /** Enable lip sync */
  lipSyncEnabled: boolean;
  /** Custom settings for specific model types */
  customSettings?: Record<string, unknown>;
}

/**
 * 3D Vector
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Quaternion for rotation
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Bone transform data
 */
export interface BoneTransform {
  /** Bone name or type */
  bone: BoneType | string;
  /** Position offset */
  position: Vector3;
  /** Rotation in quaternion */
  rotation: Quaternion;
  /** Scale */
  scale: Vector3;
}

/**
 * Face tracking data
 */
export interface FaceTrackingData {
  /** Head position */
  position: Vector3;
  /** Head rotation in Euler angles */
  rotation: Vector3;
  /** Head rotation in quaternion */
  quaternion: Quaternion;
  /** Blend shape weights (0-1) */
  blendShapes: Map<BlendShapeBinding, number>;
  /** Eye look at direction */
  eyeLookAt: Vector3;
  /** Mouth open amount (0-1) */
  mouthOpen: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Body tracking data
 */
export interface BodyTrackingData {
  /** Bone transforms */
  bones: BoneTransform[];
  /** Joint positions */
  joints: Map<string, Vector3>;
  /** Joint rotations */
  jointRotations: Map<string, Quaternion>;
  /** Confidence score (0-1) */
  confidence: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Hand tracking data
 */
export interface HandTrackingData {
  /** Hand side */
  side: 'left' | 'right';
  /** Finger bones */
  fingers: {
    thumb: Vector3[];
    index: Vector3[];
    middle: Vector3[];
    ring: Vector3[];
    pinky: Vector3[];
  };
  /** Wrist position */
  wrist: Vector3;
  /** Wrist rotation */
  wristRotation: Quaternion;
  /** Confidence score (0-1) */
  confidence: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Expression definition
 */
export interface Expression {
  /** Unique identifier */
  id: string;
  /** Expression name */
  name: string;
  /** Expression category */
  category: ExpressionCategory;
  /** Blend shape weights */
  blendShapes: Map<BlendShapeBinding, number>;
  /** Duration for transition (ms) */
  duration: number;
  /** Is expression looping */
  loop: boolean;
  /** Expression intensity (0-1) */
  intensity: number;
  /** Hotkey to trigger */
  hotkey?: string;
  /** Custom icon */
  icon?: string;
}

/**
 * Expression state
 */
export interface ExpressionState {
  /** Current expression */
  current: Expression | null;
  /** Previous expression */
  previous: Expression | null;
  /** Transition progress (0-1) */
  transitionProgress: number;
  /** Active expressions (for layering) */
  active: Map<string, number>;
}

/**
 * Tracking configuration
 */
export interface TrackingConfig {
  /** Tracking provider */
  provider: TrackingProvider;
  /** Tracking quality */
  quality: TrackingQuality;
  /** Enable face tracking */
  faceTrackingEnabled: boolean;
  /** Enable body tracking */
  bodyTrackingEnabled: boolean;
  /** Enable hand tracking */
  handTrackingEnabled: boolean;
  /** Camera device ID */
  cameraDeviceId?: string;
  /** Frame rate for tracking */
  frameRate: number;
  /** Smoothing factor (0-1) */
  smoothing: number;
  /** Prediction factor (0-1) */
  prediction: number;
  /** Calibration data */
  calibration?: CalibrationData;
}

/**
 * Calibration data for tracking
 */
export interface CalibrationData {
  /** Neutral face blend shapes */
  neutralBlendShapes: Map<BlendShapeBinding, number>;
  /** Head offset */
  headOffset: Vector3;
  /** Eye offset */
  eyeOffset: Vector3;
  /** Calibration timestamp */
  timestamp: number;
}

/**
 * VTuber model statistics
 */
export interface VTuberStatistics {
  /** Total models loaded */
  modelsLoaded: number;
  /** Current model */
  currentModel: string | null;
  /** Tracking uptime in seconds */
  trackingUptime: number;
  /** Expressions triggered count */
  expressionsTriggered: number;
  /** Average tracking FPS */
  averageTrackingFPS: number;
  /** Tracking accuracy percentage */
  trackingAccuracy: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * VTuber service state
 */
export interface VTuberState {
  /** Model status */
  modelStatus: ModelStatus;
  /** Tracking status */
  trackingStatus: TrackingStatus;
  /** Current model */
  currentModel: ModelConfig | null;
  /** Expression state */
  expressionState: ExpressionState;
  /** Statistics */
  statistics: VTuberStatistics;
}

// ============ Default Values ============

export const DEFAULT_MODEL_CONFIG: Omit<ModelConfig, 'id' | 'name' | 'type' | 'source'> = {
  scale: 1.0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  physicsEnabled: true,
  lookAtEnabled: true,
  autoBlinkEnabled: true,
  autoBlinkInterval: 3000,
  lipSyncEnabled: true,
};

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  provider: TrackingProvider.MEDIAPIPE,
  quality: TrackingQuality.MEDIUM,
  faceTrackingEnabled: true,
  bodyTrackingEnabled: false,
  handTrackingEnabled: false,
  frameRate: 30,
  smoothing: 0.5,
  prediction: 0.5,
};

export const DEFAULT_VTUBER_STATISTICS: VTuberStatistics = {
  modelsLoaded: 0,
  currentModel: null,
  trackingUptime: 0,
  expressionsTriggered: 0,
  averageTrackingFPS: 0,
  trackingAccuracy: 0,
  lastUpdated: Date.now(),
};

export const DEFAULT_VTUBER_STATE: VTuberState = {
  modelStatus: ModelStatus.IDLE,
  trackingStatus: TrackingStatus.IDLE,
  currentModel: null,
  expressionState: {
    current: null,
    previous: null,
    transitionProgress: 0,
    active: new Map(),
  },
  statistics: DEFAULT_VTUBER_STATISTICS,
};