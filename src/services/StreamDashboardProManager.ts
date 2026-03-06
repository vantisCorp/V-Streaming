import { EventEmitter } from 'eventemitter3';
import {
  IStreamDashboardProManager,
  StreamDashboardProEvents,
  DashboardWidget,
  DashboardLayout,
  StreamDashboardProSettings,
  StreamEvent,
  EventStats,
  StreamGoal,
  ChatMessage,
  ChatSettings,
  AlertConfig,
  StreamSessionStats,
  StreamDashboardStats,
  QuickAction,
  StreamDashboardProStorage,
  DEFAULT_STREAM_DASHBOARD_SETTINGS,
  DEFAULT_DASHBOARD_LAYOUT,
  DEFAULT_CHAT_SETTINGS,
  DashboardWidgetType,
  StreamEventType,
  StreamGoalType,
  QuickActionType,
  ChatFilter
} from '../types/streamDashboardPro';

// ============================================================================
// MANAGER CLASS
// ============================================================================

export class StreamDashboardProManager extends EventEmitter<StreamDashboardProEvents>
  implements IStreamDashboardProManager {
  
  // ==========================================================================
  // PRIVATE FIELDS
  // ==========================================================================
  
  private settings: StreamDashboardProSettings;
  private layouts: DashboardLayout[];
  private widgets: DashboardWidget[];
  private goals: StreamGoal[];
  private alertConfigs: AlertConfig[];
  private quickActions: QuickAction[];
  private chatSettings: ChatSettings;
  private sessions: StreamSessionStats[];
  private events: StreamEvent[];
  private chatMessages: ChatMessage[];
  
  private currentSession: StreamSessionStats | null;
  private currentSessionId: string | null;
  private viewerCount: number;
  private chatRate: number;
  
  private refreshInterval: ReturnType<typeof setInterval> | null;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  private constructor() {
    super();
    
    this.settings = { ...DEFAULT_STREAM_DASHBOARD_SETTINGS };
    this.layouts = [DEFAULT_DASHBOARD_LAYOUT];
    this.widgets = [];
    this.goals = [];
    this.alertConfigs = [];
    this.quickActions = [];
    this.chatSettings = { ...DEFAULT_CHAT_SETTINGS };
    this.sessions = [];
    this.events = [];
    this.chatMessages = [];
    
    this.currentSession = null;
    this.currentSessionId = null;
    this.viewerCount = 0;
    this.chatRate = 0;
    
    this.refreshInterval = null;
    
    this.loadFromStorage();
    this.initializeDefaultWidgets();
    this.initializeDefaultQuickActions();
    this.startAutoRefresh();
  }
  
  // ==========================================================================
  // SINGLETON INSTANCE
  // ==========================================================================
  
  private static instance: StreamDashboardProManager | null = null;
  
  public static getInstance(): StreamDashboardProManager {
    if (!StreamDashboardProManager.instance) {
      StreamDashboardProManager.instance = new StreamDashboardProManager();
    }
    return StreamDashboardProManager.instance;
  }
  
  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  
  private initializeDefaultWidgets(): void {
    if (this.widgets.length === 0) {
      const defaultWidgets: Omit<DashboardWidget, 'id'>[] = [
        {
          type: DashboardWidgetType.VIEWER_COUNT,
          title: 'Viewers',
          enabled: true,
          position: { x: 0, y: 0 },
          size: { width: 2, height: 1 },
          config: {}
        },
        {
          type: DashboardWidgetType.STREAM_UPTIME,
          title: 'Stream Uptime',
          enabled: true,
          position: { x: 0, y: 1 },
          size: { width: 2, height: 1 },
          config: {}
        },
        {
          type: DashboardWidgetType.CHAT_ACTIVITY,
          title: 'Chat Activity',
          enabled: true,
          position: { x: 2, y: 0 },
          size: { width: 2, height: 2 },
          config: {}
        },
        {
          type: DashboardWidgetType.NEW_FOLLOWERS,
          title: 'New Followers',
          enabled: true,
          position: { x: 0, y: 2 },
          size: { width: 2, height: 1 },
          config: {}
        },
        {
          type: DashboardWidgetType.NEW_SUBSCRIBERS,
          title: 'New Subscribers',
          enabled: true,
          position: { x: 2, y: 2 },
          size: { width: 2, height: 1 },
          config: {}
        },
        {
          type: DashboardWidgetType.GOAL_PROGRESS,
          title: 'Goal Progress',
          enabled: true,
          position: { x: 4, y: 0 },
          size: { width: 2, height: 3 },
          config: {}
        },
        {
          type: DashboardWidgetType.RECENT_EVENTS,
          title: 'Recent Events',
          enabled: true,
          position: { x: 4, y: 3 },
          size: { width: 4, height: 2 },
          config: {}
        },
        {
          type: DashboardWidgetType.QUICK_ACTIONS,
          title: 'Quick Actions',
          enabled: true,
          position: { x: 0, y: 3 },
          size: { width: 4, height: 1 },
          config: {}
        }
      ];
      
      defaultWidgets.forEach(widget => this.addWidget(widget));
    }
  }
  
  private initializeDefaultQuickActions(): void {
    if (this.quickActions.length === 0) {
      const defaultActions: Omit<QuickAction, 'id'>[] = [
        {
          name: 'Start Stream',
          icon: '🎬',
          action: QuickActionType.START_STREAM,
          config: {}
        },
        {
          name: 'Stop Stream',
          icon: '⏹️',
          action: QuickActionType.STOP_STREAM,
          config: {}
        },
        {
          name: 'Start Recording',
          icon: '🔴',
          action: QuickActionType.START_RECORDING,
          config: {}
        },
        {
          name: 'Stop Recording',
          icon: '⏹️',
          action: QuickActionType.STOP_RECORDING,
          config: {}
        },
        {
          name: 'Mute Chat',
          icon: '🔇',
          action: QuickActionType.MUTE_CHAT,
          config: {}
        },
        {
          name: 'Unmute Chat',
          icon: '🔊',
          action: QuickActionType.UNMUTE_CHAT,
          config: {}
        }
      ];
      
      defaultActions.forEach(action => this.addQuickAction(action));
    }
  }
  
  // ==========================================================================
  // DASHBOARD MANAGEMENT
  // ==========================================================================
  
  public getDashboardLayout(): DashboardLayout {
    return this.layouts.find(l => l.id === this.settings.activeLayout) || this.layouts[0];
  }
  
  public setDashboardLayout(layout: DashboardLayout): void {
    const index = this.layouts.findIndex(l => l.id === layout.id);
    if (index !== -1) {
      this.layouts[index] = { ...layout, updatedAt: Date.now() };
    } else {
      this.layouts.push(layout);
    }
    this.settings.activeLayout = layout.id;
    this.emit('dashboard-updated', layout);
    this.saveToStorage();
  }
  
  public createLayout(name: string): DashboardLayout {
    const layout: DashboardLayout = {
      id: `layout_${Date.now()}`,
      name,
      widgets: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.layouts.push(layout);
    this.saveToStorage();
    return layout;
  }
  
  public deleteLayout(layoutId: string): void {
    this.layouts = this.layouts.filter(l => l.id !== layoutId);
    if (this.settings.activeLayout === layoutId) {
      this.settings.activeLayout = this.layouts[0]?.id || 'default';
    }
    this.saveToStorage();
  }
  
  // ==========================================================================
  // WIDGET MANAGEMENT
  // ==========================================================================
  
  public getWidgets(): DashboardWidget[] {
    return this.widgets;
  }
  
  public addWidget(widget: Omit<DashboardWidget, 'id'>): string {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.widgets.push(newWidget);
    this.emit('widget-added', newWidget);
    this.saveToStorage();
    return newWidget.id;
  }
  
  public removeWidget(widgetId: string): void {
    this.widgets = this.widgets.filter(w => w.id !== widgetId);
    this.emit('widget-removed', widgetId);
    this.saveToStorage();
  }
  
  public updateWidget(widgetId: string, updates: Partial<DashboardWidget>): void {
    const index = this.widgets.findIndex(w => w.id === widgetId);
    if (index !== -1) {
      this.widgets[index] = { ...this.widgets[index], ...updates };
      this.saveToStorage();
    }
  }
  
  public moveWidget(widgetId: string, position: { x: number; y: number }): void {
    this.updateWidget(widgetId, { position });
  }
  
  public resizeWidget(widgetId: string, size: { width: number; height: number }): void {
    this.updateWidget(widgetId, { size });
  }
  
  // ==========================================================================
  // STREAM EVENTS
  // ==========================================================================
  
  public addEvent(event: Omit<StreamEvent, 'id' | 'timestamp'>): void {
    const newEvent: StreamEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    this.events.unshift(newEvent);
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
    
    // Update current session stats
    if (this.currentSession) {
      switch (event.type) {
        case StreamEventType.FOLLOW:
          this.currentSession.newFollowers++;
          break;
        case StreamEventType.SUBSCRIPTION:
          this.currentSession.newSubscribers++;
          break;
        case StreamEventType.GIFT_SUB:
          this.currentSession.giftSubs += event.amount || 1;
          break;
        case StreamEventType.DONATION:
          this.currentSession.totalDonations += event.amount || 0;
          this.currentSession.donationCount++;
          break;
        case StreamEventType.CHEER:
          this.currentSession.totalCheerBits += event.amount || 0;
          this.currentSession.cheerCount++;
          break;
        case StreamEventType.RAID:
          this.currentSession.raidCount++;
          this.currentSession.raidViewers += event.amount || 0;
          break;
        case StreamEventType.HOST:
          this.currentSession.hostCount++;
          this.currentSession.hostViewers += event.amount || 0;
          break;
      }
      this.updateViewerStats();
    }
    
    this.emit('event-received', newEvent);
    this.checkGoals();
    this.triggerAlert(newEvent);
    this.saveToStorage();
  }
  
  public getEvents(limit: number = 100): StreamEvent[] {
    return this.events.slice(0, limit);
  }
  
  public getEventStats(): EventStats {
    const stats: EventStats = {
      total: this.events.length,
      followers: this.events.filter(e => e.type === StreamEventType.FOLLOW).length,
      subscribers: this.events.filter(e => e.type === StreamEventType.SUBSCRIPTION).length,
      donations: this.events.filter(e => e.type === StreamEventType.DONATION).length,
      donationAmount: this.events
        .filter(e => e.type === StreamEventType.DONATION)
        .reduce((sum, e) => sum + (e.amount || 0), 0),
      cheers: this.events.filter(e => e.type === StreamEventType.CHEER).length,
      cheerAmount: this.events
        .filter(e => e.type === StreamEventType.CHEER)
        .reduce((sum, e) => sum + (e.amount || 0), 0),
      raids: this.events.filter(e => e.type === StreamEventType.RAID).length,
      raidViewers: this.events
        .filter(e => e.type === StreamEventType.RAID)
        .reduce((sum, e) => sum + (e.amount || 0), 0),
      hosts: this.events.filter(e => e.type === StreamEventType.HOST).length,
      hostViewers: this.events
        .filter(e => e.type === StreamEventType.HOST)
        .reduce((sum, e) => sum + (e.amount || 0), 0),
      giftSubs: this.events
        .filter(e => e.type === StreamEventType.GIFT_SUB)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    };
    return stats;
  }
  
  public clearEvents(): void {
    this.events = [];
    this.saveToStorage();
  }
  
  // ==========================================================================
  // GOALS
  // ==========================================================================
  
  public getGoals(): StreamGoal[] {
    return this.goals;
  }
  
  public addGoal(goal: Omit<StreamGoal, 'id' | 'progress'>): string {
    const newGoal: StreamGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      progress: 0
    };
    this.goals.push(newGoal);
    this.saveToStorage();
    return newGoal.id;
  }
  
  public updateGoal(goalId: string, updates: Partial<StreamGoal>): void {
    const index = this.goals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      this.goals[index] = { ...this.goals[index], ...updates };
      this.saveToStorage();
    }
  }
  
  public removeGoal(goalId: string): void {
    this.goals = this.goals.filter(g => g.id !== goalId);
    this.saveToStorage();
  }
  
  public checkGoals(): void {
    this.goals.forEach(goal => {
      if (!goal.enabled) return;
      
      let current = 0;
      
      switch (goal.type) {
        case StreamGoalType.FOLLOWERS:
          current = this.getEventStats().followers;
          break;
        case StreamGoalType.SUBSCRIBERS:
          current = this.getEventStats().subscribers;
          break;
        case StreamGoalType.DONATIONS:
          current = this.getEventStats().donationAmount;
          break;
        case StreamGoalType.CHEERS:
          current = this.getEventStats().cheerAmount;
          break;
        case StreamGoalType.BITS:
          current = this.getEventStats().cheerAmount;
          break;
        case StreamGoalType.VIEWERS:
          current = this.viewerCount;
          break;
        case StreamGoalType.DURATION:
          if (this.currentSession) {
            current = this.currentSession.duration;
          }
          break;
      }
      
      const newProgress = Math.min((current / goal.target) * 100, 100);
      const oldProgress = goal.progress;
      
      this.updateGoal(goal.id, { 
        current,
        progress: newProgress 
      });
      
      this.emit('goal-progress', this.goals.find(g => g.id === goal.id)!);
      
      if (newProgress >= 100 && oldProgress < 100) {
        this.emit('goal-reached', this.goals.find(g => g.id === goal.id)!);
      }
    });
  }
  
  // ==========================================================================
  // CHAT
  // ==========================================================================
  
  public getChatMessages(limit: number = 100): ChatMessage[] {
    return this.chatMessages.slice(-limit);
  }
  
  public addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    const newMessage: ChatMessage = {
      ...message,
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    this.chatMessages.push(newMessage);
    if (this.chatMessages.length > 1000) {
      this.chatMessages = this.chatMessages.slice(-1000);
    }
    
    if (this.currentSession) {
      this.currentSession.chatMessages++;
    }
    
    this.emit('chat-message', newMessage);
    this.saveToStorage();
  }
  
  public deleteChatMessage(messageId: string): void {
    const index = this.chatMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      this.chatMessages[index].isDeleted = true;
      this.saveToStorage();
    }
  }
  
  public clearChat(): void {
    this.chatMessages = [];
    this.saveToStorage();
  }
  
  public getChatSettings(): ChatSettings {
    return { ...this.chatSettings };
  }
  
  public updateChatSettings(settings: Partial<ChatSettings>): void {
    this.chatSettings = { ...this.chatSettings, ...settings };
    this.saveToStorage();
  }
  
  // ==========================================================================
  // ALERTS
  // ==========================================================================
  
  public getAlertConfigs(): AlertConfig[] {
    return this.alertConfigs;
  }
  
  public addAlertConfig(config: Omit<AlertConfig, 'id'>): string {
    const newConfig: AlertConfig = {
      ...config,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.alertConfigs.push(newConfig);
    this.saveToStorage();
    return newConfig.id;
  }
  
  public updateAlertConfig(configId: string, updates: Partial<AlertConfig>): void {
    const index = this.alertConfigs.findIndex(a => a.id === configId);
    if (index !== -1) {
      this.alertConfigs[index] = { ...this.alertConfigs[index], ...updates };
      this.saveToStorage();
    }
  }
  
  public removeAlertConfig(configId: string): void {
    this.alertConfigs = this.alertConfigs.filter(a => a.id !== configId);
    this.saveToStorage();
  }
  
  public triggerAlert(event: StreamEvent): void {
    const alertConfig = this.alertConfigs.find(a => a.eventType === event.type && a.enabled);
    if (alertConfig && this.settings.soundEnabled) {
      this.emit('alert-triggered', alertConfig);
    }
  }
  
  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  
  public getStats(): StreamDashboardStats {
    return {
      currentSession: this.currentSession,
      recentSessions: this.sessions.slice(-10),
      eventStats: this.getEventStats(),
      goals: this.goals,
      viewerCount: this.viewerCount,
      chatRate: this.chatRate
    };
  }
  
  public updateViewerCount(count: number): void {
    this.viewerCount = count;
    
    if (this.currentSession) {
      if (count > this.currentSession.viewerPeak) {
        this.currentSession.viewerPeak = count;
      }
      this.updateViewerStats();
    }
    
    this.emit('stats-updated', this.getStats());
  }
  
  public updateChatRate(rate: number): void {
    this.chatRate = rate;
  }
  
  private updateViewerStats(): void {
    if (!this.currentSession) return;
    
    const average = this.currentSession.viewerAverage || this.viewerCount;
    const count = this.currentSession.chatMessages || 0;
    const newAverage = (average * count + this.viewerCount) / (count + 1);
    
    this.currentSession.viewerAverage = newAverage;
    this.currentSession.uniqueChatters = this.chatMessages.length;
  }
  
  public startStreamSession(platform: string): string {
    const sessionId = `session_${Date.now()}`;
    
    this.currentSessionId = sessionId;
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      duration: 0,
      platform,
      viewerPeak: 0,
      viewerAverage: 0,
      newFollowers: 0,
      newSubscribers: 0,
      giftSubs: 0,
      totalDonations: 0,
      donationCount: 0,
      totalCheerBits: 0,
      cheerCount: 0,
      raidCount: 0,
      raidViewers: 0,
      hostCount: 0,
      hostViewers: 0,
      chatMessages: 0,
      uniqueChatters: 0
    };
    
    this.emit('stats-updated', this.getStats());
    return sessionId;
  }
  
  public endStreamSession(): StreamSessionStats {
    if (!this.currentSession) {
      throw new Error('No active stream session');
    }
    
    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    
    const session = { ...this.currentSession };
    this.sessions.push(session);
    
    if (this.sessions.length > 100) {
      this.sessions = this.sessions.slice(-100);
    }
    
    this.currentSession = null;
    this.currentSessionId = null;
    
    this.saveToStorage();
    this.emit('stats-updated', this.getStats());
    
    return session;
  }
  
  public getStreamSessions(limit: number = 20): StreamSessionStats[] {
    return this.sessions.slice(-limit);
  }
  
  // ==========================================================================
  // QUICK ACTIONS
  // ==========================================================================
  
  public getQuickActions(): QuickAction[] {
    return this.quickActions;
  }
  
  public addQuickAction(action: Omit<QuickAction, 'id'>): string {
    const newAction: QuickAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    this.quickActions.push(newAction);
    this.saveToStorage();
    return newAction.id;
  }
  
  public removeQuickAction(actionId: string): void {
    this.quickActions = this.quickActions.filter(a => a.id !== actionId);
    this.saveToStorage();
  }
  
  public executeQuickAction(actionId: string): void {
    const action = this.quickActions.find(a => a.id === actionId);
    if (!action) {
      throw new Error('Quick action not found');
    }
    
    // Emit action event - the app should handle the actual execution
    this.emit('quick-action-executed', action);
  }
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  public getSettings(): StreamDashboardProSettings {
    return { ...this.settings };
  }
  
  public updateSettings(settings: Partial<StreamDashboardProSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveToStorage();
    
    if (settings.autoRefresh !== undefined) {
      if (settings.autoRefresh) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }
  }
  
  public resetSettings(): void {
    this.settings = { ...DEFAULT_STREAM_DASHBOARD_SETTINGS };
    this.saveToStorage();
  }
  
  // ==========================================================================
  // AUTO REFRESH
  // ==========================================================================
  
  private startAutoRefresh(): void {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }
    
    if (this.settings.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        if (this.currentSession) {
          this.currentSession.duration = Date.now() - this.currentSession.startTime;
        }
        this.emit('stats-updated', this.getStats());
        this.checkGoals();
      }, this.settings.refreshInterval);
    }
  }
  
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================
  
  public saveToStorage(): void {
    const storage: StreamDashboardProStorage = {
      settings: this.settings,
      layouts: this.layouts,
      widgets: this.widgets,
      goals: this.goals,
      alertConfigs: this.alertConfigs,
      quickActions: this.quickActions,
      chatSettings: this.chatSettings,
      sessions: this.sessions,
      events: this.events
    };
    
    try {
      localStorage.setItem('streamDashboardPro', JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save Stream Dashboard Pro data:', error);
    }
  }
  
  public loadFromStorage(): void {
    try {
      const data = localStorage.getItem('streamDashboardPro');
      if (data) {
        const storage: StreamDashboardProStorage = JSON.parse(data);
        
        this.settings = storage.settings || { ...DEFAULT_STREAM_DASHBOARD_SETTINGS };
        this.layouts = storage.layouts || [DEFAULT_DASHBOARD_LAYOUT];
        this.widgets = storage.widgets || [];
        this.goals = storage.goals || [];
        this.alertConfigs = storage.alertConfigs || [];
        this.quickActions = storage.quickActions || [];
        this.chatSettings = storage.chatSettings || { ...DEFAULT_CHAT_SETTINGS };
        this.sessions = storage.sessions || [];
        this.events = storage.events || [];
      }
    } catch (error) {
      console.error('Failed to load Stream Dashboard Pro data:', error);
    }
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  public destroy(): void {
    this.stopAutoRefresh();
    this.removeAllListeners();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

let managerInstance: StreamDashboardProManager | null = null;

export function getStreamDashboardProManager(): StreamDashboardProManager {
  if (!managerInstance) {
    managerInstance = StreamDashboardProManager.getInstance();
  }
  return managerInstance;
}