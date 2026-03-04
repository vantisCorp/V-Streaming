/**
 * Stream Scheduler Type Definitions
 * Complete type system for automated streaming scheduling
 */

export type ScheduleFrequency = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type ScheduleStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export type NotificationType = 
  | 'none'
  | 'desktop'
  | 'email'
  | 'push'
  | 'all';

export type NotificationTiming = '5min' | '15min' | '30min' | '1hour' | '2hours' | '1day';

export interface ScheduleTime {
  hour: number;
  minute: number;
  second?: number;
}

export interface ScheduleDate {
  year: number;
  month: number;
  day: number;
}

export interface RecurringPattern {
  frequency: ScheduleFrequency;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
  monthOfYear?: number;
  interval?: number;
  endDate?: Date;
  occurrences?: number;
}

export interface ScheduledStream {
  id: string;
  name: string;
  description?: string;
  status: ScheduleStatus;
  startTime: Date;
  duration: number;
  endTime?: Date;
  pattern?: RecurringPattern;
  sceneId?: string;
  platform?: string;
  notification: {
    enabled: boolean;
    type: NotificationType;
    timing: NotificationTiming[];
    title?: string;
    message?: string;
  };
  preStreamActions?: string[];
  postStreamActions?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ScheduleConflict {
  streamId: string;
  conflictingStreamId: string;
  conflictType: 'overlap' | 'back-to-back' | 'insufficient-gap';
  message: string;
  severity: 'warning' | 'error';
}

export interface ScheduleValidation {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  warnings: string[];
  errors: string[];
}

export interface SchedulerConfig {
  enabled: boolean;
  autoStart: boolean;
  timezone: string;
  notifications: {
    enabled: boolean;
    defaultType: NotificationType;
    defaultTiming: NotificationTiming[];
  };
  conflicts: {
    detectionEnabled: boolean;
    preventOverlapping: boolean;
    minimumGapMinutes: number;
  };
  retention: {
    keepHistoryDays: number;
    keepCompletedSchedules: boolean;
    autoArchive: boolean;
  };
}

export interface SchedulerState {
  config: SchedulerConfig;
  schedules: ScheduledStream[];
  activeSchedule: string | null;
  history: ScheduleHistory[];
  isRunning: boolean;
  isProcessing: boolean;
}

export interface ScheduleHistory {
  id: string;
  scheduleId: string;
  scheduleName: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  status: 'started' | 'completed' | 'skipped' | 'failed';
  duration?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SchedulerEvents {
  'schedule:created': ScheduledStream;
  'schedule:updated': ScheduledStream;
  'schedule:deleted': string;
  'schedule:activated': ScheduledStream;
  'schedule:deactivated': string;
  'schedule:starting': ScheduledStream;
  'schedule:started': ScheduledStream;
  'schedule:ended': ScheduledStream;
  'schedule:skipped': { scheduleId: string; reason: string };
  'schedule:failed': { scheduleId: string; error: string };
  'notification:triggered': { scheduleId: string; timing: NotificationTiming };
  'config:updated': SchedulerConfig;
  'state:changed': SchedulerState;
  'error': { type: string; message: string; details?: any };
}

export interface CreateScheduleOptions {
  name: string;
  description?: string;
  startTime: Date;
  duration: number;
  pattern?: RecurringPattern;
  sceneId?: string;
  platform?: string;
  notification?: {
    enabled?: boolean;
    type?: NotificationType;
    timing?: NotificationTiming[];
    title?: string;
    message?: string;
  };
  preStreamActions?: string[];
  postStreamActions?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateScheduleOptions {
  name?: string;
  description?: string;
  startTime?: Date;
  duration?: number;
  pattern?: RecurringPattern;
  sceneId?: string;
  platform?: string;
  notification?: {
    enabled?: boolean;
    type?: NotificationType;
    timing?: NotificationTiming[];
    title?: string;
    message?: string;
  };
  preStreamActions?: string[];
  postStreamActions?: string[];
  metadata?: Record<string, any>;
}

export interface StartScheduleOptions {
  autoStart?: boolean;
  runPreStreamActions?: boolean;
  sceneId?: string;
}

export interface SchedulerStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  completedSchedules: number;
  upcomingSchedules: number;
  averageDuration: number;
  successRate: number;
}