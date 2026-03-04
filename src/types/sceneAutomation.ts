/**
 * Scene Automation Types for V-Streaming
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type AutomationTriggerType =
  | 'time'
  | 'event'
  | 'condition'
  | 'manual';

export interface TimeTrigger {
  type: 'time';
  time: string;
  days?: number[];
  recurring: boolean;
}

export interface EventTrigger {
  type: 'event';
  eventType: StreamEventType;
  delay?: number;
  conditions?: EventCondition[];
}

export interface ConditionTrigger {
  type: 'condition';
  conditions: AutomationCondition[];
  checkInterval?: number;
}

export interface ManualTrigger {
  type: 'manual';
  shortcut?: string;
}

export type AutomationTrigger =
  | TimeTrigger
  | EventTrigger
  | ConditionTrigger
  | ManualTrigger;

export type StreamEventType =
  | 'stream_start'
  | 'stream_end'
  | 'viewer_count_high'
  | 'viewer_count_low'
  | 'new_follower'
  | 'new_subscriber'
  | 'donation'
  | 'raid'
  | 'chat_activity_high'
  | 'chat_activity_low'
  | 'drop_frames_high'
  | 'bitrate_low'
  | 'custom';

export interface EventCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number;
}

export interface AutomationCondition {
  id: string;
  type: 'viewer_count' | 'bitrate' | 'fps' | 'cpu' | 'gpu' | 'duration' | 'chat_speed' | 'custom';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte';
  value: number;
  enabled: boolean;
}

export type TransitionType =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'wipe_left'
  | 'wipe_right'
  | 'wipe_up'
  | 'wipe_down'
  | 'slide_left'
  | 'slide_right'
  | 'zoom'
  | 'luma'
  | 'custom';

export interface SceneTransition {
  id: string;
  name: string;
  type: TransitionType;
  duration: number;
  easing?: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
  customPath?: string;
}

export interface SceneAction {
  type: 'switch' | 'preview' | 'transition' | 'source_toggle' | 'filter_toggle';
  targetSceneId?: string;
  sourceId?: string;
  filterId?: string;
  transition?: SceneTransition;
  enabled: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  trigger: AutomationTrigger;
  actions: SceneAction[];
  cooldown?: number;
  maxExecutions?: number;
  executionCount: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationGroup {
  id: string;
  name: string;
  description: string;
  rules: string[];
  enabled: boolean;
  collapsed: boolean;
}

export interface AutomatedScene {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  sources: SceneSource[];
  transitions: SceneTransition[];
  isDefault: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SceneSource {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'browser' | 'capture' | 'media' | 'audio';
  visible: boolean;
  locked: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  crop?: { left: number; top: number; right: number; bottom: number };
  rotation: number;
  opacity: number;
  filters: SourceFilter[];
}

export interface SourceFilter {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface AutomationState {
  rules: AutomationRule[];
  groups: AutomationGroup[];
  scenes: AutomatedScene[];
  transitions: SceneTransition[];
  presets: ScenePreset[];
  macros: SceneMacro[];
  executionLog: ExecutionLogEntry[];
  isPaused: boolean;
}

export interface ExecutionLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  triggerType: AutomationTriggerType;
  executionTime: number;
  success: boolean;
  error?: string;
  actions: ActionExecutionResult[];
}

export interface ActionExecutionResult {
  actionId: string;
  actionType: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface AutomationConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  defaultTransition: SceneTransition;
  defaultCooldown: number;
  enableNotifications: boolean;
  notificationSound: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  backupEnabled: boolean;
  backupInterval: number;
  maxBackups: number;
}

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  scene: AutomatedScene;
  tags: string[];
  isBuiltIn: boolean;
  downloadCount?: number;
}

export interface SceneMacro {
  id: string;
  name: string;
  description: string;
  steps: MacroStep[];
  abortOnError: boolean;
  enabled: boolean;
}

export interface MacroStep {
  id: string;
  action: SceneAction;
  delay?: number;
  condition?: AutomationCondition;
}

export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  enabled: true,
  logLevel: 'info',
  maxLogEntries: 1000,
  defaultTransition: {
    id: 'default-fade',
    name: 'Default Fade',
    type: 'fade',
    duration: 300,
    easing: 'ease_in_out',
  },
  defaultCooldown: 1000,
  enableNotifications: true,
  notificationSound: false,
  autoSave: true,
  autoSaveInterval: 60000,
  backupEnabled: true,
  backupInterval: 300000,
  maxBackups: 10,
};