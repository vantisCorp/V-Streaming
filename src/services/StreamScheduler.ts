/**
 * Stream Scheduler Service
 * Manages automated streaming schedules with recurring patterns and notifications
 */

import { EventEmitter } from 'events';
import {
  SchedulerConfig,
  SchedulerState,
  ScheduledStream,
  CreateScheduleOptions,
  UpdateScheduleOptions,
  StartScheduleOptions,
  RecurringPattern,
  ScheduleValidation,
  ScheduleConflict,
  ScheduleHistory,
  SchedulerEvents,
  SchedulerStats,
  ScheduleStatus,
  NotificationTiming,
  DayOfWeek,
} from '../types/streamScheduler';

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  autoStart: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    enabled: true,
    defaultType: 'desktop',
    defaultTiming: ['15min', '1hour', '1day'],
  },
  conflicts: {
    detectionEnabled: true,
    preventOverlapping: true,
    minimumGapMinutes: 15,
  },
  retention: {
    keepHistoryDays: 30,
    keepCompletedSchedules: true,
    autoArchive: false,
  },
};

class StreamScheduler extends EventEmitter {
  private state: SchedulerState;
  private checkTimer?: ReturnType<typeof setTimeout>;
  private notificationTimers: Map<string, ReturnType<typeof setTimeout>[]> = new Map();
  private storageKey = 'stream-scheduler-state';

  constructor() {
    super();
    this.state = this.loadState();
    this.startScheduler();
  }

  // State Management
  private loadState(): SchedulerState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          schedules: parsed.schedules.map((s: any) => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : undefined,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
            lastRun: s.lastRun ? new Date(s.lastRun) : undefined,
            nextRun: s.nextRun ? new Date(s.nextRun) : undefined,
            pattern: s.pattern ? { ...s.pattern, endDate: s.pattern.endDate ? new Date(s.pattern.endDate) : undefined } : undefined,
          })),
          history: parsed.history.map((h: any) => ({
            ...h,
            scheduledStartTime: new Date(h.scheduledStartTime),
            scheduledEndTime: new Date(h.scheduledEndTime),
            actualStartTime: h.actualStartTime ? new Date(h.actualStartTime) : undefined,
            actualEndTime: h.actualEndTime ? new Date(h.actualEndTime) : undefined,
            createdAt: new Date(h.createdAt),
          })),
        };
      }
    } catch (error) {
      console.error('Failed to load scheduler state:', error);
    }
    return this.getDefaultState();
  }

  private getDefaultState(): SchedulerState {
    return {
      config: { ...DEFAULT_CONFIG },
      schedules: [],
      activeSchedule: null,
      history: [],
      isRunning: false,
      isProcessing: false,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.emit('state:changed', this.state);
    } catch (error) {
      console.error('Failed to save scheduler state:', error);
      this.emit('error', {
        type: 'storage_error',
        message: 'Failed to save scheduler state',
        details: error,
      });
    }
  }

  // Configuration
  getConfig(): SchedulerConfig {
    return { ...this.state.config };
  }

  updateConfig(updates: Partial<SchedulerConfig>): void {
    this.state.config = { ...this.state.config, ...updates };
    this.saveState();
    this.emit('config:updated', this.state.config);
    if (updates.enabled !== undefined) {
      updates.enabled ? this.startScheduler() : this.stopScheduler();
    }
  }

  // Schedule Management
  getAllSchedules(): ScheduledStream[] {
    return [...this.state.schedules];
  }

  getSchedule(id: string): ScheduledStream | undefined {
    return this.state.schedules.find(s => s.id === id);
  }

  getActiveSchedules(): ScheduledStream[] {
    return this.state.schedules.filter(s => s.status === 'active');
  }

  getUpcomingSchedules(limit: number = 10): ScheduledStream[] {
    const now = new Date();
    return this.state.schedules
      .filter(s => s.status === 'active' && s.nextRun && s.nextRun > now)
      .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
      .slice(0, limit);
  }

  async createSchedule(options: CreateScheduleOptions): Promise<ScheduledStream> {
    const id = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const schedule: ScheduledStream = {
      id,
      name: options.name,
      description: options.description,
      status: 'active',
      startTime: options.startTime,
      duration: options.duration,
      pattern: options.pattern,
      sceneId: options.sceneId,
      platform: options.platform,
      notification: {
        enabled: options.notification?.enabled ?? this.state.config.notifications.enabled,
        type: options.notification?.type ?? this.state.config.notifications.defaultType,
        timing: options.notification?.timing ?? this.state.config.notifications.defaultTiming,
        title: options.notification?.title,
        message: options.notification?.message,
      },
      preStreamActions: options.preStreamActions,
      postStreamActions: options.postStreamActions,
      metadata: options.metadata,
      createdAt: now,
      updatedAt: now,
    };

    // Calculate end time and next run
    schedule.endTime = new Date(schedule.startTime.getTime() + schedule.duration * 60000);
    schedule.nextRun = this.calculateNextRun(schedule);

    // Validate schedule
    const validation = this.validateSchedule(schedule);
    if (!validation.isValid) {
      throw new Error(`Schedule validation failed: ${validation.errors.join(', ')}`);
    }

    this.state.schedules.push(schedule);
    this.saveState();
    this.emit('schedule:created', schedule);

    return schedule;
  }

  async updateSchedule(id: string, options: UpdateScheduleOptions): Promise<ScheduledStream> {
    const schedule = this.getSchedule(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    // Clear existing notification timers for this schedule
    this.clearNotificationTimers(id);

    // Update schedule
    Object.assign(schedule, options, {
      updatedAt: new Date(),
    });

    // Recalculate end time and next run
    if (options.startTime !== undefined || options.duration !== undefined) {
      schedule.endTime = new Date(schedule.startTime.getTime() + schedule.duration * 60000);
      schedule.nextRun = this.calculateNextRun(schedule);
    }

    this.saveState();
    this.emit('schedule:updated', schedule);

    return schedule;
  }

  async deleteSchedule(id: string): Promise<void> {
    const index = this.state.schedules.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Schedule not found: ${id}`);
    }

    this.clearNotificationTimers(id);
    this.state.schedules.splice(index, 1);
    this.saveState();
    this.emit('schedule:deleted', id);
  }

  async activateSchedule(id: string): Promise<void> {
    const schedule = this.getSchedule(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.status = 'active';
    schedule.nextRun = this.calculateNextRun(schedule);
    schedule.updatedAt = new Date();
    this.saveState();
    this.emit('schedule:activated', schedule);
  }

  async deactivateSchedule(id: string): Promise<void> {
    const schedule = this.getSchedule(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    schedule.status = 'paused';
    schedule.nextRun = undefined;
    schedule.updatedAt = new Date();
    this.saveState();
    this.emit('schedule:deactivated', id);
  }

  // Schedule Execution
  async startSchedule(id: string, options: StartScheduleOptions = {}): Promise<void> {
    const schedule = this.getSchedule(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    if (this.state.activeSchedule) {
      throw new Error('Another schedule is already running');
    }

    this.emit('schedule:starting', schedule);
    this.state.activeSchedule = id;
    this.state.isProcessing = true;
    this.saveState();

    try {
      // Run pre-stream actions
      if (options.runPreStreamActions !== false) {
        await this.runPreStreamActions(schedule);
      }

      // Start stream
      if (options.autoStart !== false) {
        await this.startStream(schedule, options.sceneId);
      }

      schedule.status = 'completed';
      schedule.lastRun = new Date();
      this.emit('schedule:started', schedule);

    } catch (error) {
      schedule.status = 'error';
      this.emit('schedule:failed', {
        scheduleId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.state.activeSchedule = null;
      this.state.isProcessing = false;
      this.saveState();
    }
  }

  private async runPreStreamActions(schedule: ScheduledStream): Promise<void> {
    if (!schedule.preStreamActions || schedule.preStreamActions.length === 0) {
      return;
    }

    // Execute pre-stream actions (integration with scene automation)
    for (const action of schedule.preStreamActions) {
      try {
        // Emit action execution event
        this.emit('action:execute', { action, scheduleId: schedule.id });
      } catch (error) {
        console.error(`Failed to execute pre-stream action: ${action}`, error);
      }
    }
  }

  private async startStream(schedule: ScheduledStream, sceneId?: string): Promise<void> {
    // Emit stream start event
    this.emit('stream:start', {
      scheduleId: schedule.id,
      sceneId: sceneId || schedule.sceneId,
      platform: schedule.platform,
    });
  }

  // Schedule Validation
  validateSchedule(schedule: ScheduledStream): ScheduleValidation {
    const validation: ScheduleValidation = {
      isValid: true,
      conflicts: [],
      warnings: [],
      errors: [],
    };

    // Check for conflicts if enabled
    if (this.state.config.conflicts.detectionEnabled) {
      const conflicts = this.detectConflicts(schedule);
      validation.conflicts.push(...conflicts);

      if (conflicts.some(c => c.severity === 'error')) {
        validation.isValid = false;
        validation.errors.push('Schedule has conflicts');
      } else if (conflicts.length > 0) {
        validation.warnings.push('Schedule has potential conflicts');
      }
    }

    // Validate recurrence pattern
    if (schedule.pattern) {
      const patternErrors = this.validatePattern(schedule.pattern);
      if (patternErrors.length > 0) {
        validation.isValid = false;
        validation.errors.push(...patternErrors);
      }
    }

    return validation;
  }

  private detectConflicts(schedule: ScheduledStream): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const minGap = this.state.config.conflicts.minimumGapMinutes * 60000;

    for (const other of this.state.schedules) {
      if (other.id === schedule.id || other.status !== 'active') {
        continue;
      }

      const start1 = schedule.startTime.getTime();
      const end1 = (schedule.endTime || schedule.startTime).getTime();
      const start2 = other.startTime.getTime();
      const end2 = (other.endTime || other.startTime).getTime();

      // Check for overlap
      if (start1 < end2 && end1 > start2) {
        conflicts.push({
          streamId: schedule.id,
          conflictingStreamId: other.id,
          conflictType: 'overlap',
          message: `Schedule overlaps with "${other.name}"`,
          severity: this.state.config.conflicts.preventOverlapping ? 'error' : 'warning',
        });
      }

      // Check for insufficient gap
      const gap1 = start1 - end2;
      const gap2 = start2 - end1;
      if ((gap1 > 0 && gap1 < minGap) || (gap2 > 0 && gap2 < minGap)) {
        conflicts.push({
          streamId: schedule.id,
          conflictingStreamId: other.id,
          conflictType: 'insufficient-gap',
          message: `Schedule is too close to "${other.name}" (minimum ${this.state.config.conflicts.minimumGapMinutes} minutes required)`,
          severity: 'warning',
        });
      }
    }

    return conflicts;
  }

  private validatePattern(pattern: RecurringPattern): string[] {
    const errors: string[] = [];

    if (pattern.frequency === 'weekly' && (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)) {
      errors.push('Weekly pattern requires days of week');
    }

    if (pattern.frequency === 'monthly' && !pattern.dayOfMonth) {
      errors.push('Monthly pattern requires day of month');
    }

    if (pattern.occurrences && pattern.occurrences <= 0) {
      errors.push('Occurrences must be greater than 0');
    }

    return errors;
  }

  // Schedule Calculation
  private calculateNextRun(schedule: ScheduledStream): Date | undefined {
    if (schedule.status !== 'active' || !schedule.pattern) {
      return undefined;
    }

    const now = new Date();
    let nextRun = new Date(schedule.startTime);

    // If the start time has passed, calculate next occurrence based on pattern
    if (nextRun <= now) {
      nextRun = this.calculateNextOccurrence(schedule.startTime, schedule.pattern);
    }

    // Check if we've exceeded the pattern limits
    if (schedule.pattern.endDate && nextRun > schedule.pattern.endDate) {
      return undefined;
    }

    if (schedule.pattern.occurrences) {
      const historyCount = this.state.history.filter(h => h.scheduleId === schedule.id).length;
      if (historyCount >= schedule.pattern.occurrences) {
        return undefined;
      }
    }

    return nextRun;
  }

  private calculateNextOccurrence(baseTime: Date, pattern: RecurringPattern): Date {
    const now = new Date();
    let next = new Date(baseTime);

    while (next <= now) {
      switch (pattern.frequency) {
        case 'daily':
          next.setDate(next.getDate() + (pattern.interval || 1));
          break;
        case 'weekly':
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            next.setDate(next.getDate() + 1);
            const dayName = next.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            while (!pattern.daysOfWeek.includes(dayName as DayOfWeek)) {
              next.setDate(next.getDate() + 1);
            }
          } else {
            next.setDate(next.getDate() + 7 * (pattern.interval || 1));
          }
          break;
        case 'biweekly':
          next.setDate(next.getDate() + 14 * (pattern.interval || 1));
          break;
        case 'monthly':
          if (pattern.dayOfMonth) {
            next.setMonth(next.getMonth() + (pattern.interval || 1));
            next.setDate(pattern.dayOfMonth);
          }
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + (pattern.interval || 1));
          break;
        case 'once':
          return next; // Return the base time as is
        case 'custom':
          // Custom patterns would need additional logic
          return next;
      }
    }

    return next;
  }

  // Notification System
  private setupNotifications(schedule: ScheduledStream): void {
    if (!schedule.notification.enabled || !schedule.nextRun) {
      return;
    }

    const now = new Date();
    const nextRun = schedule.nextRun.getTime();

    schedule.notification.timing.forEach(timing => {
      const delay = this.getNotificationDelay(timing, nextRun);
      if (delay > 0) {
        const timer = setTimeout(() => {
          this.triggerNotification(schedule, timing);
        }, delay);

        if (!this.notificationTimers.has(schedule.id)) {
          this.notificationTimers.set(schedule.id, []);
        }
        this.notificationTimers.get(schedule.id)!.push(timer);
      }
    });
  }

  private getNotificationDelay(timing: NotificationTiming, nextRunTime: number): number {
    const timingDelays: Record<NotificationTiming, number> = {
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '30min': 30 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '2hours': 2 * 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000,
    };

    const now = Date.now();
    const delay = nextRunTime - timingDelays[timing] - now;

    return Math.max(0, delay);
  }

  private triggerNotification(schedule: ScheduledStream, timing: NotificationTiming): void {
    if (schedule.notification.type === 'none') {
      return;
    }

    const message = schedule.notification.message || `Stream "${schedule.name}" starting in ${timing}`;
    const title = schedule.notification.title || 'Upcoming Stream';

    // Emit notification event
    this.emit('notification:triggered', { scheduleId: schedule.id, timing });

    // Desktop notification
    if (schedule.notification.type === 'desktop' || schedule.notification.type === 'all') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    }

    // Other notification types (email, push) would need backend integration
  }

  private clearNotificationTimers(scheduleId: string): void {
    const timers = this.notificationTimers.get(scheduleId);
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.notificationTimers.delete(scheduleId);
    }
  }

  // History Management
  getHistory(limit: number = 50): ScheduleHistory[] {
    return this.state.history
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getHistoryForSchedule(scheduleId: string): ScheduleHistory[] {
    return this.state.history.filter(h => h.scheduleId === scheduleId);
  }

  private addHistoryEntry(
    schedule: ScheduledStream,
    status: 'started' | 'completed' | 'skipped' | 'failed'
  ): void {
    const history: ScheduleHistory = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      actualStartTime: status === 'started' ? new Date() : undefined,
      actualEndTime: status === 'completed' ? new Date() : undefined,
      scheduledStartTime: schedule.startTime,
      scheduledEndTime: schedule.endTime || schedule.startTime,
      status,
      createdAt: new Date(),
    };

    this.state.history.push(history);

    // Clean up old history
    const cutoffDate = new Date(Date.now() - this.state.config.retention.keepHistoryDays * 24 * 60 * 60 * 1000);
    this.state.history = this.state.history.filter(h => h.createdAt > cutoffDate);

    this.saveState();
  }

  // Scheduler Control
  private startScheduler(): void {
    if (this.state.isRunning || !this.state.config.enabled) {
      return;
    }

    this.state.isRunning = true;
    this.saveState();

    // Check for schedules every minute
    this.checkTimer = setInterval(() => {
      this.checkSchedules();
    }, 60000);

    // Initial check
    this.checkSchedules();
  }

  private stopScheduler(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }

    // Clear all notification timers
    this.notificationTimers.forEach(timers => {
      timers.forEach(timer => clearTimeout(timer));
    });
    this.notificationTimers.clear();

    this.state.isRunning = false;
    this.saveState();
  }

  private checkSchedules(): void {
    const now = new Date();

    for (const schedule of this.state.schedules) {
      if (schedule.status !== 'active' || !schedule.nextRun) {
        continue;
      }

      const timeToStart = schedule.nextRun.getTime() - now.getTime();

      // Setup notifications for upcoming schedules
      if (timeToStart > 0 && timeToStart <= 24 * 60 * 60 * 1000) {
        if (!this.notificationTimers.has(schedule.id)) {
          this.setupNotifications(schedule);
        }
      }

      // Start schedule when time comes
      if (timeToStart <= 0 && Math.abs(timeToStart) < 60000) {
        if (this.state.config.autoStart) {
          this.startSchedule(schedule.id).catch(error => {
            console.error('Failed to start schedule:', error);
          });
        }
        this.addHistoryEntry(schedule, 'started');
      }
    }
  }

  // Statistics
  getStats(): SchedulerStats {
    const active = this.state.schedules.filter(s => s.status === 'active');
    const paused = this.state.schedules.filter(s => s.status === 'paused');
    const completed = this.state.history.filter(h => h.status === 'completed');
    const now = new Date();
    const upcoming = active.filter(s => s.nextRun && s.nextRun > now);

    const durations = completed
      .filter(h => h.duration)
      .map(h => h.duration!);
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const successRate = this.state.history.length > 0
      ? (completed.length / this.state.history.length) * 100
      : 100;

    return {
      totalSchedules: this.state.schedules.length,
      activeSchedules: active.length,
      pausedSchedules: paused.length,
      completedSchedules: completed.length,
      upcomingSchedules: upcoming.length,
      averageDuration,
      successRate,
    };
  }
}

// Export singleton instance
export const streamScheduler = new StreamScheduler();