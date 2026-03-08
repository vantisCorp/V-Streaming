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
// ============ Expression Editor Types ============

/**
 * Expression layer for blending multiple expressions
 */
export interface ExpressionLayer {
  /** Layer ID */
  id: string;
  /** Layer name */
  name: string;
  /** Blend shapes in this layer */
  blendShapes: Map<BlendShapeBinding, number>;
  /** Layer opacity (0-1) */
  opacity: number;
  /** Layer blend mode */
  blendMode: ExpressionBlendMode;
  /** Is layer visible */
  visible: boolean;
  /** Is layer locked */
  locked: boolean;
}

/**
 * Expression blend modes
 */
export enum ExpressionBlendMode {
  NORMAL = 'normal',
  ADD = 'add',
  MULTIPLY = 'multiply',
  OVERRIDE = 'override',
}

/**
 * Expression keyframe for animations
 */
export interface ExpressionKeyframe {
  /** Keyframe ID */
  id: string;
  /** Time in milliseconds */
  time: number;
  /** Blend shape values */
  values: Map<BlendShapeBinding, number>;
  /** Easing function */
  easing: EasingFunction;
}

/**
 * Easing functions for keyframe interpolation
 */
export enum EasingFunction {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  BACK = 'back',
}

/**
 * Expression animation
 */
export interface ExpressionAnimation {
  /** Animation ID */
  id: string;
  /** Animation name */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Keyframes */
  keyframes: ExpressionKeyframe[];
  /** Loop animation */
  loop: boolean;
  /** Loop count (-1 for infinite) */
  loopCount: number;
}

/**
 * Custom expression definition
 */
export interface CustomExpression {
  /** Expression ID */
  id: string;
  /** Expression name */
  name: string;
  /** Expression category */
  category: ExpressionCategory;
  /** Description */
  description: string;
  /** Preview image (base64) */
  previewImage: string | null;
  /** Blend shape values */
  blendShapes: Map<BlendShapeBinding, number>;
  /** Expression layers */
  layers: ExpressionLayer[];
  /** Associated animation */
  animation: ExpressionAnimation | null;
  /** Hotkey to trigger */
  hotkey: string | null;
  /** Tags for search */
  tags: string[];
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
  /** Is default expression */
  isDefault: boolean;
  /** Is favorite */
  isFavorite: boolean;
}

/**
 * Expression editor tool
 */
export enum ExpressionEditorTool {
  SELECT = 'select',
  MOVE = 'move',
  SCALE = 'scale',
  ROTATE = 'rotate',
  BRUSH = 'brush',
  ERASER = 'eraser',
  EYEDROPPER = 'eyedropper',
}

/**
 * Expression editor configuration
 */
export interface ExpressionEditorConfig {
  /** Grid enabled */
  gridEnabled: boolean;
  /** Grid size */
  gridSize: number;
  /** Snap to grid */
  snapToGrid: boolean;
  /** Show symmetry guides */
  symmetryGuides: boolean;
  /** Auto-save enabled */
  autoSave: boolean;
  /** Auto-save interval in seconds */
  autoSaveInterval: number;
  /** Undo history size */
  undoHistorySize: number;
  /** Default expression category */
  defaultCategory: ExpressionCategory;
  /** Preview FPS */
  previewFPS: number;
}

/**
 * Expression editor state
 */
export interface ExpressionEditorState {
  /** Current expression being edited */
  currentExpression: CustomExpression | null;
  /** Selected tool */
  selectedTool: ExpressionEditorTool;
  /** Selected layer ID */
  selectedLayerId: string | null;
  /** Selected keyframe ID */
  selectedKeyframeId: string | null;
  /** Zoom level */
  zoom: number;
  /** Pan offset X */
  panX: number;
  /** Pan offset Y */
  panY: number;
  /** Is playing animation */
  isPlaying: boolean;
  /** Current animation time */
  currentTime: number;
  /** Undo stack */
  undoStack: ExpressionEditorAction[];
  /** Redo stack */
  redoStack: ExpressionEditorAction[];
  /** Has unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Expression editor action for undo/redo
 */
export interface ExpressionEditorAction {
  /** Action ID */
  id: string;
  /** Action type */
  type: ExpressionEditorActionType;
  /** Action description */
  description: string;
  /** Previous state */
  previousState: unknown;
  /** New state */
  newState: unknown;
  /** Timestamp */
  timestamp: number;
}

/**
 * Expression editor action types
 */
export enum ExpressionEditorActionType {
  ADD_LAYER = 'addLayer',
  REMOVE_LAYER = 'removeLayer',
  MODIFY_LAYER = 'modifyLayer',
  REORDER_LAYERS = 'reorderLayers',
  ADD_KEYFRAME = 'addKeyframe',
  REMOVE_KEYFRAME = 'removeKeyframe',
  MODIFY_KEYFRAME = 'modifyKeyframe',
  MODIFY_BLEND_SHAPE = 'modifyBlendShape',
  MODIFY_EXPRESSION = 'modifyExpression',
}

/**
 * Expression preset for quick start
 */
export interface ExpressionPreset {
  /** Preset ID */
  id: string;
  /** Preset name */
  name: string;
  /** Category */
  category: ExpressionCategory;
  /** Preview image */
  previewImage: string;
  /** Blend shape values */
  blendShapes: Map<BlendShapeBinding, number>;
}

// ============ Expression Editor Defaults ============

export const DEFAULT_EXPRESSION_EDITOR_CONFIG: ExpressionEditorConfig = {
  gridEnabled: true,
  gridSize: 10,
  snapToGrid: true,
  symmetryGuides: true,
  autoSave: true,
  autoSaveInterval: 30,
  undoHistorySize: 50,
  defaultCategory: ExpressionCategory.CUSTOM,
  previewFPS: 30,
};

export const DEFAULT_EXPRESSION_EDITOR_STATE: ExpressionEditorState = {
  currentExpression: null,
  selectedTool: ExpressionEditorTool.SELECT,
  selectedLayerId: null,
  selectedKeyframeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isPlaying: false,
  currentTime: 0,
  undoStack: [],
  redoStack: [],
  hasUnsavedChanges: false,
};

export const EXPRESSION_PRESETS: ExpressionPreset[] = [
  {
    id: 'preset-neutral',
    name: 'Neutral',
    category: ExpressionCategory.NEUTRAL,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.MOUTH_OPEN, 0],
      [BlendShapeBinding.MOUTH_SMILE, 0],
      [BlendShapeBinding.EYE_BLINK_LEFT, 0],
      [BlendShapeBinding.EYE_BLINK_RIGHT, 0],
    ]),
  },
  {
    id: 'preset-happy',
    name: 'Happy',
    category: ExpressionCategory.HAPPY,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.MOUTH_SMILE, 0.8],
      [BlendShapeBinding.EYE_BLINK_LEFT, 0.3],
      [BlendShapeBinding.EYE_BLINK_RIGHT, 0.3],
    ]),
  },
  {
    id: 'preset-sad',
    name: 'Sad',
    category: ExpressionCategory.SAD,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.BROW_DOWN_LEFT, 0.5],
      [BlendShapeBinding.BROW_DOWN_RIGHT, 0.5],
      [BlendShapeBinding.MOUTH_SMILE, -0.3],
    ]),
  },
  {
    id: 'preset-angry',
    name: 'Angry',
    category: ExpressionCategory.ANGRY,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.BROW_DOWN_LEFT, 0.8],
      [BlendShapeBinding.BROW_DOWN_RIGHT, 0.8],
      [BlendShapeBinding.EYE_WIDE_LEFT, 0.3],
      [BlendShapeBinding.EYE_WIDE_RIGHT, 0.3],
    ]),
  },
  {
    id: 'preset-surprised',
    name: 'Surprised',
    category: ExpressionCategory.SURPRISED,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.EYE_WIDE_LEFT, 0.8],
      [BlendShapeBinding.EYE_WIDE_RIGHT, 0.8],
      [BlendShapeBinding.MOUTH_OPEN, 0.6],
      [BlendShapeBinding.BROW_UP_LEFT, 0.7],
      [BlendShapeBinding.BROW_UP_RIGHT, 0.7],
    ]),
  },
  {
    id: 'preset-wink',
    name: 'Wink',
    category: ExpressionCategory.CUSTOM,
    previewImage: '',
    blendShapes: new Map([
      [BlendShapeBinding.EYE_BLINK_LEFT, 1],
      [BlendShapeBinding.EYE_BLINK_RIGHT, 0],
      [BlendShapeBinding.MOUTH_SMILE, 0.5],
    ]),
  },
];

// ============ Marketplace Types ============

/**
 * Marketplace item type
 */
export enum MarketplaceItemType {
  EXPRESSION = 'expression',
  AVATAR = 'avatar',
  ANIMATION = 'animation',
  BACKGROUND = 'background',
  PROP = 'prop',
  PLUGIN = 'plugin',
}

/**
 * Marketplace item status
 */
export enum MarketplaceItemStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REMOVED = 'removed',
}

/**
 * Marketplace category
 */
export enum MarketplaceCategory {
  FREE = 'free',
  PAID = 'paid',
  PREMIUM = 'premium',
  COMMUNITY = 'community',
  OFFICIAL = 'official',
}

/**
 * Marketplace item author
 */
export interface MarketplaceAuthor {
  /** Author ID */
  id: string;
  /** Author username */
  username: string;
  /** Author display name */
  displayName: string;
  /** Author avatar URL */
  avatarUrl: string | null;
  /** Is verified author */
  isVerified: boolean;
  /** Author bio */
  bio: string | null;
  /** Follower count */
  followers: number;
  /** Total downloads */
  totalDownloads: number;
}

/**
 * Marketplace item rating
 */
export interface MarketplaceRating {
  /** Average rating (0-5) */
  average: number;
  /** Total ratings count */
  count: number;
  /** Rating distribution (1-5 stars) */
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Marketplace item review
 */
export interface MarketplaceReview {
  /** Review ID */
  id: string;
  /** Author ID */
  authorId: string;
  /** Author name */
  authorName: string;
  /** Rating (1-5) */
  rating: number;
  /** Review text */
  text: string;
  /** Created timestamp */
  createdAt: number;
  /** Helpful votes */
  helpfulVotes: number;
}

/**
 * Marketplace item
 */
export interface MarketplaceItem {
  /** Item ID */
  id: string;
  /** Item name */
  name: string;
  /** Item description */
  description: string;
  /** Item type */
  type: MarketplaceItemType;
  /** Category */
  category: MarketplaceCategory;
  /** Status */
  status: MarketplaceItemStatus;
  /** Author */
  author: MarketplaceAuthor;
  /** Preview images */
  previewImages: string[];
  /** Thumbnail URL */
  thumbnailUrl: string | null;
  /** Tags */
  tags: string[];
  /** Version */
  version: string;
  /** Download count */
  downloads: number;
  /** Rating */
  rating: MarketplaceRating;
  /** Price (0 for free) */
  price: number;
  /** Currency */
  currency: string;
  /** File size in bytes */
  fileSize: number;
  /** File URL */
  fileUrl: string | null;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
  /** Is featured */
  isFeatured: boolean;
  /** Compatible model types */
  compatibleModels: ModelType[];
  /** Reviews */
  reviews: MarketplaceReview[];
  /** Changelog */
  changelog: string[];
}

/**
 * Marketplace collection
 */
export interface MarketplaceCollection {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description */
  description: string;
  /** Author */
  author: MarketplaceAuthor;
  /** Items in collection */
  items: MarketplaceItem[];
  /** Is public */
  isPublic: boolean;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Marketplace search filters
 */
export interface MarketplaceFilters {
  /** Search query */
  query: string;
  /** Item types */
  types: MarketplaceItemType[];
  /** Categories */
  categories: MarketplaceCategory[];
  /** Price range (min, max) */
  priceRange: [number, number];
  /** Rating minimum */
  ratingMin: number;
  /** Tags */
  tags: string[];
  /** Author ID */
  authorId: string | null;
  /** Sort by */
  sortBy: MarketplaceSortBy;
  /** Sort order */
  sortOrder: 'asc' | 'desc';
  /** Compatible model type */
  compatibleWith: ModelType | null;
}

/**
 * Marketplace sort options
 */
export enum MarketplaceSortBy {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  POPULAR = 'popular',
  DOWNLOADS = 'downloads',
  RATING = 'rating',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
}

/**
 * Marketplace upload data
 */
export interface MarketplaceUpload {
  /** Item name */
  name: string;
  /** Item description */
  description: string;
  /** Item type */
  type: MarketplaceItemType;
  /** Category */
  category: MarketplaceCategory;
  /** Price */
  price: number;
  /** Tags */
  tags: string[];
  /** Preview images */
  previewImages: File[];
  /** File to upload */
  file: File | null;
  /** Compatible model types */
  compatibleModels: ModelType[];
}

/**
 * Marketplace state
 */
export interface MarketplaceState {
  /** Current items */
  items: MarketplaceItem[];
  /** Featured items */
  featured: MarketplaceItem[];
  /** User's items */
  myItems: MarketplaceItem[];
  /** User's favorites */
  favorites: string[];
  /** User's downloads */
  downloads: string[];
  /** Current filters */
  filters: MarketplaceFilters;
  /** Selected item */
  selectedItem: MarketplaceItem | null;
  /** Is loading */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Total items count */
  totalCount: number;
  /** Current page */
  currentPage: number;
  /** Items per page */
  itemsPerPage: number;
}

// ============ Marketplace Defaults ============

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceFilters = {
  query: '',
  types: [],
  categories: [],
  priceRange: [0, 1000],
  ratingMin: 0,
  tags: [],
  authorId: null,
  sortBy: MarketplaceSortBy.RELEVANCE,
  sortOrder: 'desc',
  compatibleWith: null,
};

export const DEFAULT_MARKETPLACE_STATE: MarketplaceState = {
  items: [],
  featured: [],
  myItems: [],
  favorites: [],
  downloads: [],
  filters: DEFAULT_MARKETPLACE_FILTERS,
  selectedItem: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 20,
};
