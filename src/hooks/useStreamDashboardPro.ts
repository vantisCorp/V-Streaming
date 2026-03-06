import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getStreamDashboardProManager } from '../services/StreamDashboardProManager';
import {
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
  QuickAction
} from '../types/streamDashboardPro';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseStreamDashboardProReturn {
  // State
  dashboardLayout: DashboardLayout;
  widgets: DashboardWidget[];
  settings: StreamDashboardProSettings;
  stats: StreamDashboardStats;
  events: StreamEvent[];
  goals: StreamGoal[];
  chatMessages: ChatMessage[];
  alertConfigs: AlertConfig[];
  quickActions: QuickAction[];
  
  // Dashboard Management
  setDashboardLayout: (layout: DashboardLayout) => void;
  createLayout: (name: string) => DashboardLayout;
  deleteLayout: (layoutId: string) => void;
  
  // Widget Management
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => string;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  moveWidget: (widgetId: string, position: { x: number; y: number }) => void;
  resizeWidget: (widgetId: string, size: { width: number; height: number }) => void;
  
  // Stream Events
  addEvent: (event: Omit<StreamEvent, 'id' | 'timestamp'>) => void;
  getEvents: (limit?: number) => StreamEvent[];
  getEventStats: () => EventStats;
  clearEvents: () => void;
  
  // Goals
  getGoals: () => StreamGoal[];
  addGoal: (goal: Omit<StreamGoal, 'id' | 'progress'>) => string;
  updateGoal: (goalId: string, updates: Partial<StreamGoal>) => void;
  removeGoal: (goalId: string) => void;
  
  // Chat
  getChatMessages: (limit?: number) => ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  deleteChatMessage: (messageId: string) => void;
  clearChat: () => void;
  getChatSettings: () => ChatSettings;
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  
  // Alerts
  getAlertConfigs: () => AlertConfig[];
  addAlertConfig: (config: Omit<AlertConfig, 'id'>) => string;
  updateAlertConfig: (configId: string, updates: Partial<AlertConfig>) => void;
  removeAlertConfig: (configId: string) => void;
  
  // Statistics
  getStats: () => StreamDashboardStats;
  updateViewerCount: (count: number) => void;
  updateChatRate: (rate: number) => void;
  startStreamSession: (platform: string) => string;
  endStreamSession: () => StreamSessionStats;
  getStreamSessions: (limit?: number) => StreamSessionStats[];
  
  // Quick Actions
  getQuickActions: () => QuickAction[];
  addQuickAction: (action: Omit<QuickAction, 'id'>) => string;
  removeQuickAction: (actionId: string) => void;
  executeQuickAction: (actionId: string) => void;
  
  // Settings
  getSettings: () => StreamDashboardProSettings;
  updateSettings: (settings: Partial<StreamDashboardProSettings>) => void;
  resetSettings: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useStreamDashboardPro(): UseStreamDashboardProReturn {
  const { t } = useTranslation();
  const manager = getStreamDashboardProManager();
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  const [dashboardLayout, setDashboardLayoutState] = useState<DashboardLayout>(manager.getDashboardLayout());
  const [widgets, setWidgets] = useState<DashboardWidget[]>(manager.getWidgets());
  const [settings, setSettingsState] = useState<StreamDashboardProSettings>(manager.getSettings());
  const [stats, setStats] = useState<StreamDashboardStats>(manager.getStats());
  const [events, setEvents] = useState<StreamEvent[]>(manager.getEvents());
  const [goals, setGoals] = useState<StreamGoal[]>(manager.getGoals());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(manager.getChatMessages());
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>(manager.getAlertConfigs());
  const [quickActions, setQuickActions] = useState<QuickAction[]>(manager.getQuickActions());
  
  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  
  useEffect(() => {
    const handleDashboardUpdated = (layout: DashboardLayout) => {
      setDashboardLayoutState(layout);
    };
    
    const handleWidgetAdded = (widget: DashboardWidget) => {
      setWidgets(manager.getWidgets());
    };
    
    const handleWidgetRemoved = () => {
      setWidgets(manager.getWidgets());
    };
    
    const handleEventReceived = (event: StreamEvent) => {
      setEvents(manager.getEvents());
    };
    
    const handleStatsUpdated = () => {
      setStats(manager.getStats());
    };
    
    const handleGoalProgress = () => {
      setGoals(manager.getGoals());
    };
    
    const handleChatMessage = () => {
      setChatMessages(manager.getChatMessages());
    };
    
    const handleAlertTriggered = () => {
      setAlertConfigs(manager.getAlertConfigs());
    };
    
    // Register all event listeners
    manager.on('dashboard-updated', handleDashboardUpdated);
    manager.on('widget-added', handleWidgetAdded);
    manager.on('widget-removed', handleWidgetRemoved);
    manager.on('event-received', handleEventReceived);
    manager.on('stats-updated', handleStatsUpdated);
    manager.on('goal-progress', handleGoalProgress);
    manager.on('chat-message', handleChatMessage);
    manager.on('alert-triggered', handleAlertTriggered);
    
    // Cleanup on unmount
    return () => {
      manager.off('dashboard-updated', handleDashboardUpdated);
      manager.off('widget-added', handleWidgetAdded);
      manager.off('widget-removed', handleWidgetRemoved);
      manager.off('event-received', handleEventReceived);
      manager.off('stats-updated', handleStatsUpdated);
      manager.off('goal-progress', handleGoalProgress);
      manager.off('chat-message', handleChatMessage);
      manager.off('alert-triggered', handleAlertTriggered);
    };
  }, [manager]);
  
  // ==========================================================================
  // DASHBOARD MANAGEMENT
  // ==========================================================================
  
  const setDashboardLayout = useCallback((layout: DashboardLayout) => {
    manager.setDashboardLayout(layout);
  }, [manager]);
  
  const createLayout = useCallback((name: string): DashboardLayout => {
    return manager.createLayout(name);
  }, [manager]);
  
  const deleteLayout = useCallback((layoutId: string) => {
    manager.deleteLayout(layoutId);
  }, [manager]);
  
  // ==========================================================================
  // WIDGET MANAGEMENT
  // ==========================================================================
  
  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id'>): string => {
    return manager.addWidget(widget);
  }, [manager]);
  
  const removeWidget = useCallback((widgetId: string) => {
    manager.removeWidget(widgetId);
  }, [manager]);
  
  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    manager.updateWidget(widgetId, updates);
  }, [manager]);
  
  const moveWidget = useCallback((widgetId: string, position: { x: number; y: number }) => {
    manager.moveWidget(widgetId, position);
  }, [manager]);
  
  const resizeWidget = useCallback((widgetId: string, size: { width: number; height: number }) => {
    manager.resizeWidget(widgetId, size);
  }, [manager]);
  
  // ==========================================================================
  // STREAM EVENTS
  // ==========================================================================
  
  const addEvent = useCallback((event: Omit<StreamEvent, 'id' | 'timestamp'>) => {
    manager.addEvent(event);
  }, [manager]);
  
  const getEvents = useCallback((limit?: number): StreamEvent[] => {
    return manager.getEvents(limit);
  }, [manager]);
  
  const getEventStats = useCallback((): EventStats => {
    return manager.getEventStats();
  }, [manager]);
  
  const clearEvents = useCallback(() => {
    manager.clearEvents();
  }, [manager]);
  
  // ==========================================================================
  // GOALS
  // ==========================================================================
  
  const getGoals = useCallback((): StreamGoal[] => {
    return manager.getGoals();
  }, [manager]);
  
  const addGoal = useCallback((goal: Omit<StreamGoal, 'id' | 'progress'>): string => {
    return manager.addGoal(goal);
  }, [manager]);
  
  const updateGoal = useCallback((goalId: string, updates: Partial<StreamGoal>) => {
    manager.updateGoal(goalId, updates);
  }, [manager]);
  
  const removeGoal = useCallback((goalId: string) => {
    manager.removeGoal(goalId);
  }, [manager]);
  
  // ==========================================================================
  // CHAT
  // ==========================================================================
  
  const getChatMessages = useCallback((limit?: number): ChatMessage[] => {
    return manager.getChatMessages(limit);
  }, [manager]);
  
  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    manager.addChatMessage(message);
  }, [manager]);
  
  const deleteChatMessage = useCallback((messageId: string) => {
    manager.deleteChatMessage(messageId);
  }, [manager]);
  
  const clearChat = useCallback(() => {
    manager.clearChat();
  }, [manager]);
  
  const getChatSettings = useCallback((): ChatSettings => {
    return manager.getChatSettings();
  }, [manager]);
  
  const updateChatSettings = useCallback((settings: Partial<ChatSettings>) => {
    manager.updateChatSettings(settings);
  }, [manager]);
  
  // ==========================================================================
  // ALERTS
  // ==========================================================================
  
  const getAlertConfigs = useCallback((): AlertConfig[] => {
    return manager.getAlertConfigs();
  }, [manager]);
  
  const addAlertConfig = useCallback((config: Omit<AlertConfig, 'id'>): string => {
    return manager.addAlertConfig(config);
  }, [manager]);
  
  const updateAlertConfig = useCallback((configId: string, updates: Partial<AlertConfig>) => {
    manager.updateAlertConfig(configId, updates);
  }, [manager]);
  
  const removeAlertConfig = useCallback((configId: string) => {
    manager.removeAlertConfig(configId);
  }, [manager]);
  
  // ==========================================================================
  // STATISTICS
  // ==========================================================================
  
  const getStats = useCallback((): StreamDashboardStats => {
    return manager.getStats();
  }, [manager]);
  
  const updateViewerCount = useCallback((count: number) => {
    manager.updateViewerCount(count);
  }, [manager]);
  
  const updateChatRate = useCallback((rate: number) => {
    manager.updateChatRate(rate);
  }, [manager]);
  
  const startStreamSession = useCallback((platform: string): string => {
    return manager.startStreamSession(platform);
  }, [manager]);
  
  const endStreamSession = useCallback((): StreamSessionStats => {
    return manager.endStreamSession();
  }, [manager]);
  
  const getStreamSessions = useCallback((limit?: number): StreamSessionStats[] => {
    return manager.getStreamSessions(limit);
  }, [manager]);
  
  // ==========================================================================
  // QUICK ACTIONS
  // ==========================================================================
  
  const getQuickActions = useCallback((): QuickAction[] => {
    return manager.getQuickActions();
  }, [manager]);
  
  const addQuickAction = useCallback((action: Omit<QuickAction, 'id'>): string => {
    return manager.addQuickAction(action);
  }, [manager]);
  
  const removeQuickAction = useCallback((actionId: string) => {
    manager.removeQuickAction(actionId);
  }, [manager]);
  
  const executeQuickAction = useCallback((actionId: string) => {
    manager.executeQuickAction(actionId);
  }, [manager]);
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  const getSettings = useCallback((): StreamDashboardProSettings => {
    return manager.getSettings();
  }, [manager]);
  
  const updateSettings = useCallback((settings: Partial<StreamDashboardProSettings>) => {
    manager.updateSettings(settings);
  }, [manager]);
  
  const resetSettings = useCallback(() => {
    manager.resetSettings();
  }, [manager]);
  
  // ==========================================================================
  // RETURN
  // ==========================================================================
  
  return {
    // State
    dashboardLayout,
    widgets,
    settings,
    stats,
    events,
    goals,
    chatMessages,
    alertConfigs,
    quickActions,
    
    // Dashboard Management
    setDashboardLayout,
    createLayout,
    deleteLayout,
    
    // Widget Management
    addWidget,
    removeWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    
    // Stream Events
    addEvent,
    getEvents,
    getEventStats,
    clearEvents,
    
    // Goals
    getGoals,
    addGoal,
    updateGoal,
    removeGoal,
    
    // Chat
    getChatMessages,
    addChatMessage,
    deleteChatMessage,
    clearChat,
    getChatSettings,
    updateChatSettings,
    
    // Alerts
    getAlertConfigs,
    addAlertConfig,
    updateAlertConfig,
    removeAlertConfig,
    
    // Statistics
    getStats,
    updateViewerCount,
    updateChatRate,
    startStreamSession,
    endStreamSession,
    getStreamSessions,
    
    // Quick Actions
    getQuickActions,
    addQuickAction,
    removeQuickAction,
    executeQuickAction,
    
    // Settings
    getSettings,
    updateSettings,
    resetSettings
  };
}