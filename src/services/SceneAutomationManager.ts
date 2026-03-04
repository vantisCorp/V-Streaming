/**
 * SceneAutomationManager - Core service for scene automation
 */

import { EventEmitter } from 'events';
import {
  AutomationRule,
  AutomationState,
  ExecutionLogEntry,
  AutomationConfig,
  AutomationGroup,
  AutomatedScene,
  DEFAULT_AUTOMATION_CONFIG,
} from '../types/sceneAutomation';

class SceneAutomationManager extends EventEmitter {
  private state: AutomationState;
  private config: AutomationConfig;

  constructor() {
    super();
    this.state = {
      rules: [],
      groups: [],
      scenes: [],
      transitions: [],
      presets: [],
      macros: [],
      executionLog: [],
      isPaused: false,
    };
    this.config = { ...DEFAULT_AUTOMATION_CONFIG };
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const savedState = localStorage.getItem('sceneAutomationState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load automation state:', error);
    }
  }

  private async saveState(): Promise<void> {
    if (this.config.autoSave) {
      try {
        localStorage.setItem('sceneAutomationState', JSON.stringify(this.state));
      } catch (error) {
        console.error('Failed to save automation state:', error);
      }
    }
  }

  getState(): AutomationState {
    return { ...this.state };
  }

  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveState();
    this.emit('config-updated', this.config);
  }

  addRule(rule: Omit<AutomationRule, 'id' | 'executionCount' | 'createdAt' | 'updatedAt'>): string {
    const id = `rule_${Date.now()}`;
    const newRule: AutomationRule = {
      ...rule,
      id,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.rules.push(newRule);
    this.saveState();
    this.emit('rule-added', newRule);
    return id;
  }

  updateRule(ruleId: string, updates: Partial<AutomationRule>): void {
    const index = this.state.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.state.rules[index] = {
      ...this.state.rules[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveState();
    this.emit('rule-updated', this.state.rules[index]);
  }

  deleteRule(ruleId: string): void {
    const index = this.state.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    this.state.rules.splice(index, 1);
    this.saveState();
    this.emit('rule-deleted', ruleId);
  }

  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.state.rules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    rule.enabled = enabled;
    rule.updatedAt = new Date();
    this.saveState();
    this.emit('rule-toggled', { ruleId, enabled });
  }

  getRule(ruleId: string): AutomationRule | undefined {
    return this.state.rules.find(r => r.id === ruleId);
  }

  getAllRules(): AutomationRule[] {
    return [...this.state.rules];
  }

  getEnabledRules(): AutomationRule[] {
    return this.state.rules.filter(r => r.enabled);
  }

  createGroup(group: Omit<AutomationGroup, 'id'>): string {
    const id = `group_${Date.now()}`;
    const newGroup: AutomationGroup = { ...group, id };
    this.state.groups.push(newGroup);
    this.saveState();
    this.emit('group-created', newGroup);
    return id;
  }

  updateGroup(groupId: string, updates: Partial<AutomationGroup>): void {
    const index = this.state.groups.findIndex(g => g.id === groupId);
    if (index === -1) {
      throw new Error(`Group ${groupId} not found`);
    }

    this.state.groups[index] = { ...this.state.groups[index], ...updates };
    this.saveState();
    this.emit('group-updated', this.state.groups[index]);
  }

  deleteGroup(groupId: string): void {
    const index = this.state.groups.findIndex(g => g.id === groupId);
    if (index === -1) {
      throw new Error(`Group ${groupId} not found`);
    }

    this.state.groups.splice(index, 1);
    this.saveState();
    this.emit('group-deleted', groupId);
  }

  toggleGroup(groupId: string, enabled: boolean): void {
    const group = this.state.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    group.enabled = enabled;
    group.rules.forEach(ruleId => {
      const rule = this.state.rules.find(r => r.id === ruleId);
      if (rule) {
        this.toggleRule(ruleId, enabled);
      }
    });

    this.saveState();
    this.emit('group-toggled', { groupId, enabled });
  }

  addScene(scene: AutomatedScene): void {
    this.state.scenes.push(scene);
    this.saveState();
    this.emit('scene-added', scene);
  }

  getScene(sceneId: string): AutomatedScene | undefined {
    return this.state.scenes.find(s => s.id === sceneId);
  }

  getAllScenes(): AutomatedScene[] {
    return [...this.state.scenes];
  }

  async executeRule(ruleId: string): Promise<void> {
    const rule = this.state.rules.find(r => r.id === ruleId);
    if (!rule || !rule.enabled) {
      return;
    }

    if (rule.lastExecuted && rule.cooldown) {
      const timeSinceLastExecution = Date.now() - rule.lastExecuted.getTime();
      if (timeSinceLastExecution < rule.cooldown) {
        return;
      }
    }

    if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
      return;
    }

    if (this.state.isPaused) {
      return;
    }

    const startTime = Date.now();
    const logEntry: ExecutionLogEntry = {
      id: `log_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date(),
      triggerType: rule.trigger.type,
      executionTime: 0,
      success: false,
      actions: [],
    };

    try {
      // Emit scene-switch-request for each action
      rule.actions.forEach(action => {
        if (!action.enabled) return;

        if (action.type === 'switch' && action.targetSceneId) {
          this.emit('scene-switch-request', {
            sceneId: action.targetSceneId,
            transition: action.transition,
          });
        }
      });

      rule.executionCount++;
      rule.lastExecuted = new Date();
      logEntry.success = true;
      logEntry.executionTime = Date.now() - startTime;

      this.addExecutionLog(logEntry);
      this.emit('rule-executed', rule);
      this.saveState();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logEntry.success = false;
      logEntry.error = errorMessage;
      logEntry.executionTime = Date.now() - startTime;

      this.addExecutionLog(logEntry);
      this.emit('rule-execution-failed', { rule, error: errorMessage });
    }
  }

  private addExecutionLog(entry: ExecutionLogEntry): void {
    this.state.executionLog.push(entry);

    if (this.state.executionLog.length > this.config.maxLogEntries) {
      this.state.executionLog = this.state.executionLog.slice(-this.config.maxLogEntries);
    }
  }

  getExecutionLog(limit?: number): ExecutionLogEntry[] {
    const log = [...this.state.executionLog].reverse();
    return limit ? log.slice(0, limit) : log;
  }

  pause(): void {
    this.state.isPaused = true;
    this.emit('automation-paused');
  }

  resume(): void {
    this.state.isPaused = false;
    this.emit('automation-resumed');
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
    this.emit(this.state.isPaused ? 'automation-paused' : 'automation-resumed');
  }

  isPausedState(): boolean {
    return this.state.isPaused;
  }

  destroy(): void {
    this.removeAllListeners();
  }
}

export const sceneAutomationManager = new SceneAutomationManager();