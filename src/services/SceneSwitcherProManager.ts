/**
 * Scene Switcher Pro - Professional Scene Management Service
 * Manages scenes, transitions, hotkeys, and automation
 */

import EventEmitter from 'eventemitter3';
import {
  Scene,
  SceneItem,
  SceneGroup,
  SceneTransition,
  SceneHotkey,
  SceneAutomationRule,
  SceneStats,
  SceneSwitcherSettings,
  SceneSwitcherState,
  SceneVisibility,
  TransitionType,
  BlendMode,
  SceneItemType,
  AutomationTrigger,
  DEFAULT_SCENE,
  DEFAULT_TRANSITION,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  BUILTIN_TRANSITIONS,
  isSceneVisible,
  canEditScene,
  canEditItem,
  isTransitionValid,
} from '../types/sceneSwitcherPro';

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface SceneSwitcherEvents {
  'scene-added': (scene: Scene) => void;
  'scene-updated': (scene: Scene) => void;
  'scene-removed': (sceneId: string) => void;
  'scene-switched': (fromSceneId: string | null, toSceneId: string) => void;
  'scene-previewed': (sceneId: string) => void;
  'item-added': (sceneId: string, item: SceneItem) => void;
  'item-updated': (sceneId: string, item: SceneItem) => void;
  'item-removed': (sceneId: string, itemId: string) => void;
  'item-toggled': (sceneId: string, itemId: string, visible: boolean) => void;
  'transition-started': () => void;
  'transition-completed': () => void;
  'settings-changed': (settings: SceneSwitcherSettings) => void;
  'hotkey-added': (hotkey: SceneHotkey) => void;
  'hotkey-removed': (sceneId: string) => void;
  'automation-added': (rule: SceneAutomationRule) => void;
  'automation-removed': (ruleId: string) => void;
  'automation-triggered': (rule: SceneAutomationRule) => void;
}

export interface ISceneSwitcherProManager {
  // Scene management
  createScene(name: string, description?: string): Scene;
  updateScene(scene: Scene): void;
  removeScene(sceneId: string): void;
  duplicateScene(sceneId: string): Scene;
  getScene(sceneId: string): Scene | undefined;
  getScenes(): Scene[];
  
  // Scene switching
  switchScene(sceneId: string): Promise<void>;
  previewScene(sceneId: string): void;
  
  // Item management
  addItem(sceneId: string, item: SceneItem): void;
  updateItem(sceneId: string, item: SceneItem): void;
  removeItem(sceneId: string, itemId: string): void;
  toggleItem(sceneId: string, itemId: string): void;
  duplicateItem(sceneId: string, itemId: string): SceneItem;
  moveItem(sceneId: string, itemId: string, newPosition: { x: number; y: number }): void;
  resizeItem(sceneId: string, itemId: string, newSize: { width: number; height: number }): void;
  
  // Group management
  createGroup(sceneId: string, name: string): SceneGroup;
  addItemToGroup(sceneId: string, groupId: string, itemId: string): void;
  removeItemFromGroup(sceneId: string, groupId: string, itemId: string): void;
  
  // Transition management
  setTransition(sceneId: string, transition: SceneTransition): void;
  getTransition(sceneId: string): SceneTransition | undefined;
  getDefaultTransition(): SceneTransition;
  setDefaultTransition(transition: SceneTransition): void;
  
  // Hotkey management
  setHotkey(hotkey: SceneHotkey): void;
  getHotkey(sceneId: string): SceneHotkey | undefined;
  removeHotkey(sceneId: string): void;
  getHotkeys(): SceneHotkey[];
  
  // Automation
  addAutomationRule(rule: SceneAutomationRule): void;
  updateAutomationRule(rule: SceneAutomationRule): void;
  removeAutomationRule(ruleId: string): void;
  getAutomationRules(): SceneAutomationRule[];
  
  // Settings
  getSettings(): SceneSwitcherSettings;
  updateSettings(updates: Partial<SceneSwitcherSettings>): void;
  resetSettings(): void;
  
  // State
  getState(): SceneSwitcherState;
  getCurrentScene(): Scene | null;
  getPreviewScene(): Scene | null;
  getStats(): SceneStats;
  
  // Utility
  generateItemId(): string;
  generateSceneId(): string;
}

// ============================================================================
// SCENE SWITCHER MANAGER IMPLEMENTATION
// ============================================================================

export class SceneSwitcherProManager extends EventEmitter<SceneSwitcherEvents>
  implements ISceneSwitcherProManager {
  
  private scenes: Scene[] = [];
  private currentScene: Scene | null = null;
  private previewedScene: Scene | null = null;
  private transitions: Map<string, SceneTransition> = new Map();
  private hotkeys: SceneHotkey[] = [];
  private automationRules: SceneAutomationRule[] = [];
  private settings: SceneSwitcherSettings;
  private stats: SceneStats;
  private isTransitioning: boolean = false;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    super();
    
    // Load settings from localStorage or use defaults
    this.settings = this.loadSettings();
    this.stats = { ...DEFAULT_STATS };
    
    // Load scenes from localStorage
    this.loadScenes();
    
    // Initialize built-in transitions
    this.initializeBuiltInTransitions();
    
    // Start auto-save if enabled
    if (this.settings.autoSave) {
      this.startAutoSave();
    }
    
    // Update stats
    this.updateStats();
  }
  
  // ==========================================================================
  // SCENE MANAGEMENT
  // ==========================================================================
  
  createScene(name: string, description?: string): Scene {
    const scene: Scene = {
      ...DEFAULT_SCENE,
      id: this.generateSceneId(),
      name,
      description,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    
    this.scenes.push(scene);
    this.saveScenes();
    this.updateStats();
    
    this.emit('scene-added', scene);
    
    return scene;
  }
  
  updateScene(scene: Scene): Scene {
    if (!canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    const index = this.scenes.findIndex(s => s.id === scene.id);
    if (index === -1) {
      throw new Error('Scene not found');
    }
    
    scene.modifiedAt = new Date();
    this.scenes[index] = scene;
    this.saveScenes();
    
    this.emit('scene-updated', scene);
    
    return scene;
  }
  
  removeScene(sceneId: string): void {
    const scene = this.getScene(sceneId);
    if (scene && !canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    const index = this.scenes.findIndex(s => s.id === sceneId);
    if (index === -1) {
      throw new Error('Scene not found');
    }
    
    // Remove from hotkeys
    this.hotkeys = this.hotkeys.filter(h => h.sceneId !== sceneId);
    this.transitions.delete(sceneId);
    
    this.scenes.splice(index, 1);
    this.saveScenes();
    this.updateStats();
    
    this.emit('scene-removed', sceneId);
  }
  
  duplicateScene(sceneId: string): Scene {
    const originalScene = this.getScene(sceneId);
    if (!originalScene) {
      throw new Error('Scene not found');
    }
    
    const duplicatedScene: Scene = {
      ...originalScene,
      id: this.generateSceneId(),
      name: `${originalScene.name} (Copy)`,
      items: originalScene.items.map(item => ({
        ...item,
        id: this.generateItemId(),
      })),
      groups: originalScene.groups.map(group => ({
        ...group,
        id: this.generateSceneId(),
        items: group.items.map(item => ({
          ...item,
          id: this.generateItemId(),
        })),
      })),
      active: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };
    
    this.scenes.push(duplicatedScene);
    this.saveScenes();
    this.updateStats();
    
    this.emit('scene-added', duplicatedScene);
    
    return duplicatedScene;
  }
  
  getScene(sceneId: string): Scene | undefined {
    return this.scenes.find(s => s.id === sceneId);
  }
  
  getScenes(): Scene[] {
    return [...this.scenes];
  }
  
  // ==========================================================================
  // SCENE SWITCHING
  // ==========================================================================
  
  async switchScene(sceneId: string): Promise<void> {
    if (this.isTransitioning) {
      return;
    }
    
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const previousSceneId = this.currentScene?.id || null;
    
    // Get transition
    const transition = this.getTransition(sceneId) || this.settings.defaultTransition;
    
    // Start transition
    this.isTransitioning = true;
    this.emit('transition-started');
    
    // Simulate transition delay
    if (transition.duration > 0) {
      await this.delay(transition.duration);
    }
    
    // Update active scenes
    if (this.currentScene) {
      this.currentScene.active = false;
    }
    scene.active = true;
    this.currentScene = scene;
    
    // Update stats
    this.stats.lastSwitchTime = new Date();
    this.stats.transitionCount++;
    this.stats.activeSceneId = sceneId;
    
    // Save and emit
    this.saveScenes();
    this.emit('scene-switched', previousSceneId, sceneId);
    this.emit('transition-completed');
    
    this.isTransitioning = false;
  }
  
  previewScene(sceneId: string): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    this.previewedScene = scene;
    this.emit('scene-previewed', sceneId);
  }
  
  // ==========================================================================
  // ITEM MANAGEMENT
  // ==========================================================================
  
  addItem(sceneId: string, item: SceneItem): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    if (!canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    item.id = this.generateItemId();
    scene.items.push(item);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    this.updateStats();
    
    this.emit('item-added', sceneId, item);
  }
  
  updateItem(sceneId: string, item: SceneItem): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    if (!canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    if (!canEditItem(item)) {
      throw new Error('Item is locked');
    }
    
    const index = scene.items.findIndex(i => i.id === item.id);
    if (index === -1) {
      throw new Error('Item not found');
    }
    
    scene.items[index] = item;
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    
    this.emit('item-updated', sceneId, item);
  }
  
  removeItem(sceneId: string, itemId: string): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    if (!canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (item && !canEditItem(item)) {
      throw new Error('Item is locked');
    }
    
    scene.items = scene.items.filter(i => i.id !== itemId);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    this.updateStats();
    
    this.emit('item-removed', sceneId, itemId);
  }
  
  toggleItem(sceneId: string, itemId: string): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    if (!canEditItem(item)) {
      throw new Error('Item is locked');
    }
    
    item.visibility = isSceneVisible(item) 
      ? SceneVisibility.HIDDEN 
      : SceneVisibility.VISIBLE;
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    this.updateStats();
    
    this.emit('item-toggled', sceneId, itemId, isSceneVisible(item));
  }
  
  duplicateItem(sceneId: string, itemId: string): SceneItem {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    const duplicatedItem: SceneItem = {
      ...item,
      id: this.generateItemId(),
      name: `${item.name} (Copy)`,
      position: {
        x: item.position.x + 20,
        y: item.position.y + 20,
      },
    };
    
    scene.items.push(duplicatedItem);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    this.updateStats();
    
    this.emit('item-added', sceneId, duplicatedItem);
    
    return duplicatedItem;
  }
  
  moveItem(sceneId: string, itemId: string, newPosition: { x: number; y: number }): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    if (!canEditItem(item)) {
      throw new Error('Item is locked');
    }
    
    item.position = newPosition;
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    
    this.emit('item-updated', sceneId, item);
  }
  
  resizeItem(sceneId: string, itemId: string, newSize: { width: number; height: number }): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    if (!canEditItem(item)) {
      throw new Error('Item is locked');
    }
    
    item.size = newSize;
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    
    this.emit('item-updated', sceneId, item);
  }
  
  // ==========================================================================
  // GROUP MANAGEMENT
  // ==========================================================================
  
  createGroup(sceneId: string, name: string): SceneGroup {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    if (!canEditScene(scene)) {
      throw new Error('Scene is locked');
    }
    
    const group: SceneGroup = {
      id: this.generateSceneId(),
      name,
      items: [],
      collapsed: false,
    };
    
    scene.groups.push(group);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
    
    return group;
  }
  
  addItemToGroup(sceneId: string, groupId: string, itemId: string): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const group = scene.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    const item = scene.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    group.items.push(item);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
  }
  
  removeItemFromGroup(sceneId: string, groupId: string, itemId: string): void {
    const scene = this.getScene(sceneId);
    if (!scene) {
      throw new Error('Scene not found');
    }
    
    const group = scene.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }
    
    group.items = group.items.filter(i => i.id !== itemId);
    scene.modifiedAt = new Date();
    
    this.saveScenes();
  }
  
  // ==========================================================================
  // TRANSITION MANAGEMENT
  // ==========================================================================
  
  setTransition(sceneId: string, transition: SceneTransition): void {
    if (!isTransitionValid(transition)) {
      throw new Error('Invalid transition');
    }
    
    this.transitions.set(sceneId, transition);
    this.saveScenes();
  }
  
  getTransition(sceneId: string): SceneTransition | undefined {
    return this.transitions.get(sceneId);
  }
  
  getDefaultTransition(): SceneTransition {
    return this.settings.defaultTransition;
  }
  
  setDefaultTransition(transition: SceneTransition): void {
    if (!isTransitionValid(transition)) {
      throw new Error('Invalid transition');
    }
    
    this.settings.defaultTransition = transition;
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }
  
  // ==========================================================================
  // HOTKEY MANAGEMENT
  // ==========================================================================
  
  setHotkey(hotkey: SceneHotkey): void {
    const existingIndex = this.hotkeys.findIndex(h => h.sceneId === hotkey.sceneId);
    if (existingIndex !== -1) {
      this.hotkeys[existingIndex] = hotkey;
    } else {
      this.hotkeys.push(hotkey);
    }
    
    this.saveSettings();
    this.emit('hotkey-added', hotkey);
  }
  
  getHotkey(sceneId: string): SceneHotkey | undefined {
    return this.hotkeys.find(h => h.sceneId === sceneId);
  }
  
  removeHotkey(sceneId: string): void {
    this.hotkeys = this.hotkeys.filter(h => h.sceneId !== sceneId);
    this.saveSettings();
    this.emit('hotkey-removed', sceneId);
  }
  
  getHotkeys(): SceneHotkey[] {
    return [...this.hotkeys];
  }
  
  // ==========================================================================
  // AUTOMATION
  // ==========================================================================
  
  addAutomationRule(rule: SceneAutomationRule): void {
    this.automationRules.push(rule);
    this.saveSettings();
    this.emit('automation-added', rule);
  }
  
  updateAutomationRule(rule: SceneAutomationRule): void {
    const index = this.automationRules.findIndex(r => r.id === rule.id);
    if (index === -1) {
      throw new Error('Rule not found');
    }
    
    this.automationRules[index] = rule;
    this.saveSettings();
  }
  
  removeAutomationRule(ruleId: string): void {
    this.automationRules = this.automationRules.filter(r => r.id !== ruleId);
    this.saveSettings();
    this.emit('automation-removed', ruleId);
  }
  
  getAutomationRules(): SceneAutomationRule[] {
    return [...this.automationRules];
  }
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  getSettings(): SceneSwitcherSettings {
    return { ...this.settings };
  }
  
  updateSettings(updates: Partial<SceneSwitcherSettings>): void {
    this.settings = { ...this.settings, ...updates };
    
    // Restart auto-save if settings changed
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.settings.autoSave) {
      this.startAutoSave();
    }
    
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }
  
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }
  
  // ==========================================================================
  // STATE
  // ==========================================================================
  
  getState(): SceneSwitcherState {
    return {
      currentScene: this.currentScene,
      previewedScene: this.previewedScene,
      scenes: this.getScenes(),
      transitions: new Map(this.transitions),
      hotkeys: this.getHotkeys(),
      automationRules: this.getAutomationRules(),
      settings: this.getSettings(),
      stats: this.getStats(),
    };
  }
  
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }
  
  getPreviewScene(): Scene | null {
    return this.previewedScene;
  }
  
  getStats(): SceneStats {
    return { ...this.stats };
  }
  
  // ==========================================================================
  // UTILITY
  // ==========================================================================
  
  generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSceneId(): string {
    return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  private loadSettings(): SceneSwitcherSettings {
    try {
      const stored = localStorage.getItem('scene-switcher-pro-settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }
  
  private saveSettings(): void {
    try {
      localStorage.setItem('scene-switcher-pro-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  private loadScenes(): void {
    try {
      const stored = localStorage.getItem('scene-switcher-pro-scenes');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.scenes = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          modifiedAt: new Date(s.modifiedAt),
        }));
        
        // Set current scene
        const activeScene = this.scenes.find(s => s.active);
        if (activeScene) {
          this.currentScene = activeScene;
          this.stats.activeSceneId = activeScene.id;
        }
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
    }
  }
  
  private saveScenes(): void {
    try {
      localStorage.setItem('scene-switcher-pro-scenes', JSON.stringify(this.scenes));
    } catch (error) {
      console.error('Failed to save scenes:', error);
    }
  }
  
  private initializeBuiltInTransitions(): void {
    Object.entries(BUILTIN_TRANSITIONS).forEach(([name, transition]) => {
      // Transitions are already in the service, just for reference
    });
  }
  
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveScenes();
      this.saveSettings();
    }, this.settings.autoSaveInterval * 1000);
  }
  
  private updateStats(): void {
    this.stats.totalScenes = this.scenes.length;
    this.stats.totalItems = this.scenes.reduce((sum, scene) => sum + scene.items.length, 0);
    this.stats.visibleItems = this.scenes.reduce((sum, scene) => 
      sum + scene.items.filter(item => isSceneVisible(item)).length, 0
    );
    this.stats.activeItems = this.currentScene?.items.filter(item => isSceneVisible(item)).length || 0;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let sceneSwitcherProManagerInstance: SceneSwitcherProManager | null = null;

export function getSceneSwitcherProManager(): SceneSwitcherProManager {
  if (!sceneSwitcherProManagerInstance) {
    sceneSwitcherProManagerInstance = new SceneSwitcherProManager();
  }
  return sceneSwitcherProManagerInstance;
}