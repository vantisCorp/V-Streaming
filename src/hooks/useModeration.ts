import { useState, useEffect, useCallback } from 'react';
import { moderationManager } from '../services/ModerationManager';
import {
  ChatMessage,
  ModerationRule,
  ModerationActionRecord,
  ModerationAppeal,
  ModerationLogEntry,
  ModerationStatistics,
  ChatUserInfo,
  ModerationQueueEntry,
  ModerationSettings,
  SpamDetectionConfig,
  TrustLevelConfig,
  ModerationActionType,
  TrustLevel
} from '../types/moderation';

export const useModeration = () => {
  const [rules, setRules] = useState<ModerationRule[]>(moderationManager.getAllRules());
  const [actions, setActions] = useState<ModerationActionRecord[]>(moderationManager.getAllActions());
  const [appeals, setAppeals] = useState<ModerationAppeal[]>(moderationManager.getAllAppeals());
  const [logs, setLogs] = useState<ModerationLogEntry[]>([]);
  const [statistics, setStatistics] = useState<ModerationStatistics>(moderationManager.getStatistics());
  const [users, setUsers] = useState<ChatUserInfo[]>(moderationManager.getAllUsers());
  const [queue, setQueue] = useState<ModerationQueueEntry[]>(moderationManager.getQueue());
  const [settings, setSettings] = useState<ModerationSettings>(moderationManager.getSettings());

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Set up event listeners
    const handleRuleAdded = () => {
      setRules([...moderationManager.getAllRules()]);
    };

    const handleRuleUpdated = () => {
      setRules([...moderationManager.getAllRules()]);
    };

    const handleRuleDeleted = () => {
      setRules([...moderationManager.getAllRules()]);
    };

    const handleActionExecuted = (action: ModerationActionRecord) => {
      setActions(prev => [action, ...prev]);
      setStatistics(moderationManager.getStatistics());
    };

    const handleAppealCreated = (appeal: ModerationAppeal) => {
      setAppeals(prev => [appeal, ...prev]);
    };

    const handleAppealResolved = (appeal: ModerationAppeal) => {
      setAppeals(prev => prev.map(a => a.id === appeal.id ? appeal : a));
    };

    const handleStatisticsUpdated = () => {
      setStatistics(moderationManager.getStatistics());
    };

    const handleQueueUpdated = () => {
      setQueue([...moderationManager.getQueue()]);
    };

    const handleUserInfoUpdated = () => {
      setUsers([...moderationManager.getAllUsers()]);
    };

    const handleSettingsChanged = () => {
      setSettings({ ...moderationManager.getSettings() });
    };

    moderationManager.on('ruleAdded', handleRuleAdded);
    moderationManager.on('ruleUpdated', handleRuleUpdated);
    moderationManager.on('ruleDeleted', handleRuleDeleted);
    moderationManager.on('actionExecuted', handleActionExecuted);
    moderationManager.on('appealCreated', handleAppealCreated);
    moderationManager.on('appealResolved', handleAppealResolved);
    moderationManager.on('statisticsUpdated', handleStatisticsUpdated);
    moderationManager.on('queueUpdated', handleQueueUpdated);
    moderationManager.on('userInfoUpdated', handleUserInfoUpdated);
    moderationManager.on('settingsChanged', handleSettingsChanged);

    // Cleanup
    return () => {
      moderationManager.off('ruleAdded', handleRuleAdded);
      moderationManager.off('ruleUpdated', handleRuleUpdated);
      moderationManager.off('ruleDeleted', handleRuleDeleted);
      moderationManager.off('actionExecuted', handleActionExecuted);
      moderationManager.off('appealCreated', handleAppealCreated);
      moderationManager.off('appealResolved', handleAppealResolved);
      moderationManager.off('statisticsUpdated', handleStatisticsUpdated);
      moderationManager.off('queueUpdated', handleQueueUpdated);
      moderationManager.off('userInfoUpdated', handleUserInfoUpdated);
      moderationManager.off('settingsChanged', handleSettingsChanged);
    };
  }, []);

  const loadInitialData = useCallback(() => {
    setRules(moderationManager.getAllRules());
    setActions(moderationManager.getAllActions());
    setAppeals(moderationManager.getAllAppeals());
    setStatistics(moderationManager.getStatistics());
    setUsers(moderationManager.getAllUsers());
    setQueue(moderationManager.getQueue());
    setSettings(moderationManager.getSettings());
  }, []);

  const processMessage = useCallback((message: ChatMessage) => {
    return moderationManager.processMessage(message);
  }, []);

  const createRule = useCallback((rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>) => {
    return moderationManager.createRule(rule);
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<ModerationRule>) => {
    return moderationManager.updateRule(ruleId, updates);
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    return moderationManager.deleteRule(ruleId);
  }, []);

  const getActiveActions = useCallback(() => {
    return moderationManager.getActiveActions();
  }, []);

  const resolveAppeal = useCallback((appealId: string, status: 'approved' | 'rejected', reviewedBy: string, response?: string) => {
    return moderationManager.resolveAppeal(appealId, status, reviewedBy, response);
  }, []);

  const getUserInfo = useCallback((userId: string) => {
    return moderationManager.getUserInfo(userId);
  }, []);

  const getActionsByUser = useCallback((userId: string) => {
    return moderationManager.getActionsByUser(userId);
  }, []);

  const updateSettings = useCallback((updates: Partial<ModerationSettings>) => {
    moderationManager.updateSettings(updates);
  }, []);

  const getQueue = useCallback(() => {
    return moderationManager.getQueue();
  }, []);

  const resolveQueueEntry = useCallback((queueId: string, resolvedBy: string, resolution: string) => {
    moderationManager.resolveQueueEntry(queueId, resolvedBy, resolution);
  }, []);

  const dismissQueueEntry = useCallback((queueId: string, resolvedBy: string) => {
    moderationManager.dismissQueueEntry(queueId, resolvedBy);
  }, []);

  return {
    // State
    rules,
    actions,
    appeals,
    logs,
    statistics,
    users,
    queue,
    settings,

    // Message Processing
    processMessage,

    // Rules
    createRule,
    updateRule,
    deleteRule,

    // Actions
    getActiveActions,
    getActionsByUser,

    // Appeals
    resolveAppeal,

    // Users
    getUserInfo,

    // Settings
    updateSettings,

    // Queue
    getQueue,
    resolveQueueEntry,
    dismissQueueEntry,

    // Utilities
    loadInitialData
  };
};