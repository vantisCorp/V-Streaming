/**
 * Scene Switcher Pro - Advanced Scene Management
 * Type definitions for professional scene switching with transitions and automation
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Scene transition types
 */
export enum TransitionType {
  NONE = 'none',
  FADE = 'fade',
  CUT = 'cut',
  SLIDE_LEFT = 'slide_left',
  SLIDE_RIGHT = 'slide_right',
  SLIDE_UP = 'slide_up',
  SLIDE_DOWN = 'slide_down',
  ZOOM = 'zoom',
  WIPE = 'wipe',
  STINGER = 'stinger',
  SWIPE = 'swipe',
  BLUR = 'blur',
  DISSOLVE = 'dissolve',
}

/**
 * Transition easing functions
 */
export enum TransitionEasing {
  LINEAR = 'linear',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
}

/**
 * Scene item types
 */
export enum SceneItemType {
  SOURCE = 'source',
  GROUP = 'group',
  AUDIO = 'audio',
  MEDIA = 'media',
  CAMERA = 'camera',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  BROWSER = 'browser',
  COLOR = 'color',
}

/**
 * Scene visibility state
 */
export enum SceneVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  LOCKED = 'locked',
}

/**
 * Scene hotkey trigger type
 */
export enum HotkeyTrigger {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  JOYSTICK = 'joystick',
  MIDI = 'midi',
  STREAM_DECK = 'stream_deck',
}

/**
 * Scene automation trigger type
 */
export enum AutomationTrigger {
  MANUAL = 'manual',
  TIMER = 'timer',
  CONDITION = 'condition',
  WEBSOCKET = 'websocket',
  CHAT_COMMAND = 'chat_command',
  DONATION = 'donation',
  FOLLOW = 'follow',
  SUBSCRIBER = 'subscriber',
  RAID = 'raid',
}

/**
 * Scene item blend mode
 */
export enum BlendMode {
  NORMAL = 'normal',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color_dodge',
  COLOR_BURN = 'color_burn',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion',
  HSL_COLOR = 'hsl_color',
  HSL_HUE = 'hsl_hue',
  HSL_SATURATION = 'hsl_saturation',
  HSL_LUMINOSITY = 'hsl_luminosity',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Scene item configuration
 */
export interface SceneItem {
  id: string;
  name: string;
  type: SceneItemType;
  sourceId: string;
  visibility: SceneVisibility;
  locked: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  crop: { left: number; right: number; top: number; bottom: number };
  transform: { scaleX: number; scaleY: number };
  filters: SceneFilter[];
  zIndex: number;
}

/**
 * Scene filter
 */
export interface SceneFilter {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

/**
 * Scene group
 */
export interface SceneGroup {
  id: string;
  name: string;
  items: SceneItem[];
  collapsed: boolean;
}

/**
 * Scene configuration
 */
export interface Scene {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  items: SceneItem[];
  groups: SceneGroup[];
  active: boolean;
  locked: boolean;
  hotkey?: string;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Scene transition configuration
 */
export interface SceneTransition {
  type: TransitionType;
  duration: number; // in milliseconds
  easing: TransitionEasing;
  stingerPath?: string; // for stinger transitions
  stingerDuration?: number; // in milliseconds
  inverted: boolean;
}

/**
 * Scene hotkey configuration
 */
export interface SceneHotkey {
  sceneId: string;
  trigger: HotkeyTrigger;
  keys: string[];
  modifiers: { ctrl: boolean; alt: boolean; shift: boolean };
  action: 'switch' | 'preview' | 'both';
  enabled: boolean;
}

/**
 * Scene automation rule
 */
export interface SceneAutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  cooldown: number; // in milliseconds
}

/**
 * Automation condition
 */
export interface AutomationCondition {
  type: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

/**
 * Automation action
 */
export interface AutomationAction {
  type: 'switch_scene' | 'toggle_item' | 'start_recording' | 'stop_recording' | 'start_streaming' | 'stop_streaming';
  targetId?: string;
  parameters: Record<string, any>;
}

/**
 * Scene collection
 */
export interface SceneCollection {
  id: string;
  name: string;
  description?: string;
  scenes: Scene[];
  transitions: Map<string, SceneTransition>;
  hotkeys: SceneHotkey[];
  automationRules: SceneAutomationRule[];
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Scene statistics
 */
export interface SceneStats {
  totalScenes: number;
  activeSceneId: string | null;
  totalItems: number;
  visibleItems: number;
  activeItems: number;
  transitionCount: number;
  lastSwitchTime: Date | null;
}

/**
 * Scene switcher settings
 */
export interface SceneSwitcherSettings {
  defaultTransition: SceneTransition;
  previewEnabled: boolean;
  doubleClickSwitch: boolean;
  rightClickContext: boolean;
  showItemNames: boolean;
  showItemIcons: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  enableHotkeys: boolean;
  enableAutomation: boolean;
  notifications: {
    onSceneSwitch: boolean;
    onTransitionStart: boolean;
    onTransitionEnd: boolean;
  };
}

/**
 * Scene switcher state
 */
export interface SceneSwitcherState {
  currentScene: Scene | null;
  previewedScene: Scene | null;
  scenes: Scene[];
  transitions: Map<string, SceneTransition>;
  hotkeys: SceneHotkey[];
  automationRules: SceneAutomationRule[];
  settings: SceneSwitcherSettings;
  stats: SceneStats;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_SCENE_ITEM: SceneItem = {
  id: '',
  name: '',
  type: SceneItemType.SOURCE,
  sourceId: '',
  visibility: SceneVisibility.VISIBLE,
  locked: false,
  position: { x: 0, y: 0 },
  size: { width: 1920, height: 1080 },
  rotation: 0,
  opacity: 1,
  blendMode: BlendMode.NORMAL,
  crop: { left: 0, right: 0, top: 0, bottom: 0 },
  transform: { scaleX: 1, scaleY: 1 },
  filters: [],
  zIndex: 0,
};

export const DEFAULT_SCENE: Scene = {
  id: '',
  name: '',
  items: [],
  groups: [],
  active: false,
  locked: false,
  createdAt: new Date(),
  modifiedAt: new Date(),
};

export const DEFAULT_TRANSITION: SceneTransition = {
  type: TransitionType.FADE,
  duration: 500,
  easing: TransitionEasing.EASE_IN_OUT,
  inverted: false,
};

export const DEFAULT_HOTKEY: SceneHotkey = {
  sceneId: '',
  trigger: HotkeyTrigger.KEYBOARD,
  keys: [],
  modifiers: { ctrl: false, alt: false, shift: false },
  action: 'switch',
  enabled: true,
};

export const DEFAULT_AUTOMATION_RULE: SceneAutomationRule = {
  id: '',
  name: '',
  trigger: AutomationTrigger.MANUAL,
  conditions: [],
  actions: [],
  enabled: false,
  cooldown: 1000,
};

export const DEFAULT_SETTINGS: SceneSwitcherSettings = {
  defaultTransition: DEFAULT_TRANSITION,
  previewEnabled: true,
  doubleClickSwitch: true,
  rightClickContext: true,
  showItemNames: true,
  showItemIcons: true,
  autoSave: true,
  autoSaveInterval: 60,
  enableHotkeys: true,
  enableAutomation: true,
  notifications: {
    onSceneSwitch: true,
    onTransitionStart: false,
    onTransitionEnd: false,
  },
};

export const DEFAULT_STATS: SceneStats = {
  totalScenes: 0,
  activeSceneId: null,
  totalItems: 0,
  visibleItems: 0,
  activeItems: 0,
  transitionCount: 0,
  lastSwitchTime: null,
};

// ============================================================================
// BUILT-IN TRANSITIONS
// ============================================================================

export const BUILTIN_TRANSITIONS: Record<string, SceneTransition> = {
  none: {
    type: TransitionType.NONE,
    duration: 0,
    easing: TransitionEasing.LINEAR,
    inverted: false,
  },
  fade_fast: {
    type: TransitionType.FADE,
    duration: 250,
    easing: TransitionEasing.LINEAR,
    inverted: false,
  },
  fade_normal: {
    type: TransitionType.FADE,
    duration: 500,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: false,
  },
  fade_slow: {
    type: TransitionType.FADE,
    duration: 1000,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: false,
  },
  cut: {
    type: TransitionType.CUT,
    duration: 0,
    easing: TransitionEasing.LINEAR,
    inverted: false,
  },
  slide_left: {
    type: TransitionType.SLIDE_LEFT,
    duration: 500,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: false,
  },
  slide_right: {
    type: TransitionType.SLIDE_RIGHT,
    duration: 500,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: false,
  },
  zoom_in: {
    type: TransitionType.ZOOM,
    duration: 500,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: false,
  },
  zoom_out: {
    type: TransitionType.ZOOM,
    duration: 500,
    easing: TransitionEasing.EASE_IN_OUT,
    inverted: true,
  },
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSceneVisible(item: SceneItem): boolean {
  return item.visibility === SceneVisibility.VISIBLE;
}

export function isSceneLocked(item: SceneItem): boolean {
  return item.locked || item.visibility === SceneVisibility.LOCKED;
}

export function canEditScene(scene: Scene): boolean {
  return !scene.locked;
}

export function canEditItem(item: SceneItem): boolean {
  return !isSceneLocked(item);
}

export function isTransitionValid(transition: SceneTransition): boolean {
  return transition.duration >= 0;
}

export function isHotkeyValid(hotkey: SceneHotkey): boolean {
  return hotkey.keys.length > 0;
}