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

// ============ Full Body Tracking Types ============

/**
 * Body tracking mode
 */
export enum BodyTrackingMode {
  FULL_BODY = 'full_body',
  UPPER_BODY = 'upper_body',
  HANDS_ONLY = 'hands_only',
  FACE_AND_HANDS = 'face_and_hands',
  CUSTOM = 'custom',
}

/**
 * IK solve method
 */
export enum IKSolveMethod {
  TWO_BONE = 'two_bone',
  FABRIK = 'fabrik',
  CCD_IK = 'ccd_ik',
  ANALYTICAL = 'analytical',
}

/**
 * Body landmark indices (MediaPipe Pose)
 */
export enum BodyLandmark {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

/**
 * Full body pose data
 */
export interface FullBodyPose {
  /** 3D positions of all body landmarks */
  landmarks: Map<BodyLandmark, Vector3>;
  /** World coordinates (in meters) */
  worldLandmarks: Map<BodyLandmark, Vector3>;
  /** Visibility of each landmark (0-1) */
  visibility: Map<BodyLandmark, number>;
  /** Presence confidence (0-1) */
  presence: Map<BodyLandmark, number>;
  /** Segment normal vectors */
  segmentNormals: Map<string, Vector3>;
  /** Overall pose confidence */
  confidence: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * IK target for a limb
 */
export interface IKTarget {
  /** Target joint name */
  joint: string;
  /** Target position */
  position: Vector3;
  /** Target rotation (optional) */
  rotation?: Quaternion;
  /** Weight for blending (0-1) */
  weight: number;
  /** Chain length (number of bones) */
  chainLength: number;
  /** Tolerance for convergence */
  tolerance: number;
  /** Max iterations */
  maxIterations: number;
}

/**
 * IK solve result
 */
export interface IKSolveResult {
  /** Solved joint rotations */
  jointRotations: Map<string, Quaternion>;
  /** End effector position */
  endEffectorPosition: Vector3;
  /** Whether solve was successful */
  success: boolean;
  /** Number of iterations used */
  iterations: number;
}

/**
 * Body tracking configuration
 */
export interface BodyTrackingConfig {
  /** Tracking mode */
  mode: BodyTrackingMode;
  /** Enable IK solving */
  ikEnabled: boolean;
  /** IK solve method */
  ikMethod: IKSolveMethod;
  /** Enable shoulder IK */
  shoulderIKEnabled: boolean;
  /** Enable arm IK */
  armIKEnabled: boolean;
  /** Enable leg IK */
  legIKEnabled: boolean;
  /** Enable spine IK */
  spineIKEnabled: boolean;
  /** Smoothing for body movement */
  smoothing: number;
  /** Prediction for movement */
  prediction: number;
  /** Model height calibration */
  modelHeight: number;
  /** Arm length ratio */
  armLengthRatio: number;
  /** Leg length ratio */
  legLengthRatio: number;
  /** Enable foot planting */
  footPlantingEnabled: boolean;
  /** Ground level (Y coordinate) */
  groundLevel: number;
}

/**
 * Body tracking calibration data
 */
export interface BodyTrackingCalibration {
  /** T-pose calibration data */
  tPose: Map<BodyLandmark, Vector3>;
  /** A-pose calibration data */
  aPose: Map<BodyLandmark, Vector3>;
  /** User height */
  userHeight: number;
  /** Arm span */
  armSpan: number;
  /** Shoulder width */
  shoulderWidth: number;
  /** Hip width */
  hipWidth: number;
  /** Calibration timestamp */
  timestamp: number;
}

/**
 * Body tracking statistics
 */
export interface BodyTrackingStatistics {
  /** Total tracking time in seconds */
  trackingTime: number;
  /** Average FPS */
  averageFPS: number;
  /** Average confidence */
  averageConfidence: number;
  /** IK solve count */
  ikSolveCount: number;
  /** Average IK solve time in ms */
  averageIKSolveTime: number;
  /** Landmark detection rate */
  landmarkDetectionRate: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Body tracking state
 */
export interface BodyTrackingState {
  /** Current pose */
  currentPose: FullBodyPose | null;
  /** Previous pose (for smoothing) */
  previousPose: FullBodyPose | null;
  /** IK targets */
  ikTargets: Map<string, IKTarget>;
  /** IK solve results */
  ikResults: Map<string, IKSolveResult>;
  /** Calibration data */
  calibration: BodyTrackingCalibration | null;
  /** Is calibrated */
  isCalibrated: boolean;
  /** Statistics */
  statistics: BodyTrackingStatistics;
}

// ============ Full Body Tracking Defaults ============

export const DEFAULT_BODY_TRACKING_CONFIG: BodyTrackingConfig = {
  mode: BodyTrackingMode.UPPER_BODY,
  ikEnabled: true,
  ikMethod: IKSolveMethod.FABRIK,
  shoulderIKEnabled: true,
  armIKEnabled: true,
  legIKEnabled: false,
  spineIKEnabled: true,
  smoothing: 0.5,
  prediction: 0.3,
  modelHeight: 1.6,
  armLengthRatio: 0.45,
  legLengthRatio: 0.53,
  footPlantingEnabled: false,
  groundLevel: 0,
};

export const DEFAULT_BODY_TRACKING_STATISTICS: BodyTrackingStatistics = {
  trackingTime: 0,
  averageFPS: 0,
  averageConfidence: 0,
  ikSolveCount: 0,
  averageIKSolveTime: 0,
  landmarkDetectionRate: 0,
  lastUpdated: Date.now(),
};

export const DEFAULT_BODY_TRACKING_STATE: BodyTrackingState = {
  currentPose: null,
  previousPose: null,
  ikTargets: new Map(),
  ikResults: new Map(),
  calibration: null,
  isCalibrated: false,
  statistics: DEFAULT_BODY_TRACKING_STATISTICS,
};