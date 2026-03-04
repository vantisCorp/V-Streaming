/**
 * React hook for scene automation functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { sceneAutomationManager } from '../services/SceneAutomationManager';
import {
  AutomationRule,
  AutomationState,
  ExecutionLogEntry,
  AutomationConfig,
  AutomationGroup,
  AutomatedScene,
} from '../types/sceneAutomation';

export interface UseSceneAutomationOptions {
  autoSubscribe?: boolean;
}

export const useSceneAutomation = (options: UseSceneAutomationOptions = {}) => {
  const { autoSubscribe = true } = options;

  const [state, setState] = useState<AutomationState>(sceneAutomationManager.getState());
  const [config, setConfig] = useState<AutomationConfig>(sceneAutomationManager.getConfig());
  const [isPaused, setIsPaused] = useState(sceneAutomationManager.isPausedState());

  const refresh = useCallback(() => {
    setState(sceneAutomationManager.getState());
    setConfig(sceneAutomationManager.getConfig());
    setIsPaused(sceneAutomationManager.isPausedState());
  }, []);

  useEffect(() => {
    if (!autoSubscribe) return;

    const handleStateChange = () => refresh();
    const handleConfigUpdate = () => setConfig(sceneAutomationManager.getConfig());
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);

    sceneAutomationManager.on('rule-added', handleStateChange);
    sceneAutomationManager.on('rule-updated', handleStateChange);
    sceneAutomationManager.on('rule-deleted', handleStateChange);
    sceneAutomationManager.on('rule-toggled', handleStateChange);
    sceneAutomationManager.on('rule-executed', handleStateChange);
    sceneAutomationManager.on('rule-execution-failed', handleStateChange);
    sceneAutomationManager.on('group-created', handleStateChange);
    sceneAutomationManager.on('group-updated', handleStateChange);
    sceneAutomationManager.on('group-deleted', handleStateChange);
    sceneAutomationManager.on('group-toggled', handleStateChange);
    sceneAutomationManager.on('scene-added', handleStateChange);
    sceneAutomationManager.on('action-executed', handleStateChange);
    sceneAutomationManager.on('config-updated', handleConfigUpdate);
    sceneAutomationManager.on('automation-paused', handlePause);
    sceneAutomationManager.on('automation-resumed', handleResume);

    return () => {
      sceneAutomationManager.off('rule-added', handleStateChange);
      sceneAutomationManager.off('rule-updated', handleStateChange);
      sceneAutomationManager.off('rule-deleted', handleStateChange);
      sceneAutomationManager.off('rule-toggled', handleStateChange);
      sceneAutomationManager.off('rule-executed', handleStateChange);
      sceneAutomationManager.off('rule-execution-failed', handleStateChange);
      sceneAutomationManager.off('group-created', handleStateChange);
      sceneAutomationManager.off('group-updated', handleStateChange);
      sceneAutomationManager.off('group-deleted', handleStateChange);
      sceneAutomationManager.off('group-toggled', handleStateChange);
      sceneAutomationManager.off('scene-added', handleStateChange);
      sceneAutomationManager.off('action-executed', handleStateChange);
      sceneAutomationManager.off('config-updated', handleConfigUpdate);
      sceneAutomationManager.off('automation-paused', handlePause);
      sceneAutomationManager.off('automation-resumed', handleResume);
    };
  }, [autoSubscribe, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRule = useCallback((
    rule: Omit<AutomationRule, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>
  ) => {
    return sceneAutomationManager.addRule(rule);
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<AutomationRule>) => {
    sceneAutomationManager.updateRule(ruleId, updates);
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    sceneAutomationManager.deleteRule(ruleId);
  }, []);

  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    sceneAutomationManager.toggleRule(ruleId, enabled);
  }, []);

  const getRule = useCallback((ruleId: string) => {
    return sceneAutomationManager.getRule(ruleId);
  }, []);

  const getAllRules = useCallback(() => {
    return sceneAutomationManager.getAllRules();
  }, []);

  const getEnabledRules = useCallback(() => {
    return sceneAutomationManager.getEnabledRules();
  }, []);

  const createGroup = useCallback((group: Omit<AutomationGroup, 'id'>) => {
    return sceneAutomationManager.createGroup(group);
  }, []);

  const updateGroup = useCallback((groupId: string, updates: Partial<AutomationGroup>) => {
    sceneAutomationManager.updateGroup(groupId, updates);
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    sceneAutomationManager.deleteGroup(groupId);
  }, []);

  const toggleGroup = useCallback((groupId: string, enabled: boolean) => {
    sceneAutomationManager.toggleGroup(groupId, enabled);
  }, []);

  const addScene = useCallback((scene: AutomatedScene) => {
    sceneAutomationManager.addScene(scene);
  }, []);

  const getScene = useCallback((sceneId: string) => {
    return sceneAutomationManager.getScene(sceneId);
  }, []);

  const getAllScenes = useCallback(() => {
    return sceneAutomationManager.getAllScenes();
  }, []);

  const executeRule = useCallback((ruleId: string) => {
    sceneAutomationManager.executeRule(ruleId);
  }, []);

  const getExecutionLog = useCallback((limit?: number) => {
    return sceneAutomationManager.getExecutionLog(limit);
  }, []);

  const clearExecutionLog = useCallback(() => {
    refresh();
  }, [refresh]);

  const updateConfig = useCallback((newConfig: Partial<AutomationConfig>) => {
    sceneAutomationManager.updateConfig(newConfig);
  }, []);

  const pause = useCallback(() => {
    sceneAutomationManager.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    sceneAutomationManager.resume();
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    sceneAutomationManager.togglePause();
    setIsPaused(!isPaused);
  }, [isPaused]);

  return {
    state,
    config,
    isPaused,
    executionLog: state.executionLog,
    rules: state.rules,
    groups: state.groups,
    scenes: state.scenes,
    transitions: state.transitions,
    presets: state.presets,
    macros: state.macros,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    getRule,
    getAllRules,
    getEnabledRules,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    addScene,
    getScene,
    getAllScenes,
    executeRule,
    getExecutionLog,
    clearExecutionLog,
    updateConfig,
    pause,
    resume,
    togglePause,
    refresh,
  };
};