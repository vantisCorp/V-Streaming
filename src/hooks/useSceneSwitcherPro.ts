/**
 * React Hook for Scene Switcher Pro
 * Provides easy access to scene management functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scene,
  SceneItem,
  SceneTransition,
  SceneHotkey,
  SceneAutomationRule,
  SceneStats,
  SceneSwitcherSettings,
  TransitionType,
  BlendMode,
  SceneItemType,
} from '../types/sceneSwitcherPro';
import {
  getSceneSwitcherProManager,
  SceneSwitcherProManager,
  SceneSwitcherEvents,
} from '../services/SceneSwitcherProManager';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseSceneSwitcherProReturn {
  // State
  scenes: Scene[];
  currentScene: Scene | null;
  previewedScene: Scene | null;
  settings: SceneSwitcherSettings;
  stats: SceneStats;
  hotkeys: SceneHotkey[];
  automationRules: SceneAutomationRule[];
  
  // Scene management
  createScene: (name: string, description?: string) => Scene;
  updateScene: (scene: Scene) => void;
  removeScene: (sceneId: string) => void;
  duplicateScene: (sceneId: string) => Scene;
  
  // Scene switching
  switchScene: (sceneId: string) => Promise<void>;
  previewScene: (sceneId: string) => void;
  
  // Item management
  addItem: (sceneId: string, item: SceneItem) => void;
  updateItem: (sceneId: string, item: SceneItem) => void;
  removeItem: (sceneId: string, itemId: string) => void;
  toggleItem: (sceneId: string, itemId: string) => void;
  duplicateItem: (sceneId: string, itemId: string) => SceneItem;
  moveItem: (sceneId: string, itemId: string, position: { x: number; y: number }) => void;
  resizeItem: (sceneId: string, itemId: string, size: { width: number; height: number }) => void;
  
  // Transition management
  setTransition: (sceneId: string, transition: SceneTransition) => void;
  getTransition: (sceneId: string) => SceneTransition | undefined;
  getDefaultTransition: () => SceneTransition;
  setDefaultTransition: (transition: SceneTransition) => void;
  
  // Hotkey management
  setHotkey: (hotkey: SceneHotkey) => void;
  getHotkey: (sceneId: string) => SceneHotkey | undefined;
  removeHotkey: (sceneId: string) => void;
  
  // Automation
  addAutomationRule: (rule: SceneAutomationRule) => void;
  updateAutomationRule: (rule: SceneAutomationRule) => void;
  removeAutomationRule: (ruleId: string) => void;
  
  // Settings
  updateSettings: (updates: Partial<SceneSwitcherSettings>) => void;
  resetSettings: () => void;
  
  // State helpers
  isTransitioning: boolean;
  canEditCurrentScene: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSceneSwitcherPro(): UseSceneSwitcherProReturn {
  const { t } = useTranslation();
  const manager = getSceneSwitcherProManager();
  
  // State
  const [scenes, setScenes] = useState<Scene[]>(manager.getScenes());
  const [currentScene, setCurrentScene] = useState<Scene | null>(manager.getCurrentScene());
  const [previewedScene, setPreviewedScene] = useState<Scene | null>(manager.getPreviewScene());
  const [settings, setSettings] = useState<SceneSwitcherSettings>(manager.getSettings());
  const [stats, setStats] = useState<SceneStats>(manager.getStats());
  const [hotkeys, setHotkeys] = useState<SceneHotkey[]>(manager.getHotkeys());
  const [automationRules, setAutomationRules] = useState<SceneAutomationRule[]>(manager.getAutomationRules());
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  
  useEffect(() => {
    const handleSceneAdded = (scene: Scene) => {
      setScenes(manager.getScenes());
      setStats(manager.getStats());
    };
    
    const handleSceneUpdated = (scene: Scene) => {
      setScenes(manager.getScenes());
      if (scene.id === currentScene?.id) {
        setCurrentScene(scene);
      }
    };
    
    const handleSceneRemoved = (sceneId: string) => {
      setScenes(manager.getScenes());
      setStats(manager.getStats());
      if (currentScene?.id === sceneId) {
        setCurrentScene(null);
      }
    };
    
    const handleSceneSwitched = (fromSceneId: string | null, toSceneId: string) => {
      setCurrentScene(manager.getCurrentScene());
      setStats(manager.getStats());
      setIsTransitioning(false);
    };
    
    const handleScenePreviewed = (sceneId: string) => {
      setPreviewedScene(manager.getPreviewScene());
    };
    
    const handleItemAdded = (sceneId: string, item: SceneItem) => {
      setScenes(manager.getScenes());
      setStats(manager.getStats());
    };
    
    const handleItemUpdated = (sceneId: string, item: SceneItem) => {
      setScenes(manager.getScenes());
    };
    
    const handleItemRemoved = (sceneId: string, itemId: string) => {
      setScenes(manager.getScenes());
      setStats(manager.getStats());
    };
    
    const handleItemToggled = (sceneId: string, itemId: string, visible: boolean) => {
      setScenes(manager.getScenes());
      setStats(manager.getStats());
    };
    
    const handleTransitionStarted = () => {
      setIsTransitioning(true);
    };
    
    const handleTransitionCompleted = () => {
      setIsTransitioning(false);
    };
    
    const handleSettingsChanged = (newSettings: SceneSwitcherSettings) => {
      setSettings(newSettings);
    };
    
    const handleHotkeyAdded = (hotkey: SceneHotkey) => {
      setHotkeys(manager.getHotkeys());
    };
    
    const handleHotkeyRemoved = (sceneId: string) => {
      setHotkeys(manager.getHotkeys());
    };
    
    const handleAutomationAdded = (rule: SceneAutomationRule) => {
      setAutomationRules(manager.getAutomationRules());
    };
    
    const handleAutomationRemoved = (ruleId: string) => {
      setAutomationRules(manager.getAutomationRules());
    };
    
    const handleAutomationTriggered = (rule: SceneAutomationRule) => {
      // Handle automation triggers
    };
    
    // Register all event listeners
    manager.on('scene-added', handleSceneAdded);
    manager.on('scene-updated', handleSceneUpdated);
    manager.on('scene-removed', handleSceneRemoved);
    manager.on('scene-switched', handleSceneSwitched);
    manager.on('scene-previewed', handleScenePreviewed);
    manager.on('item-added', handleItemAdded);
    manager.on('item-updated', handleItemUpdated);
    manager.on('item-removed', handleItemRemoved);
    manager.on('item-toggled', handleItemToggled);
    manager.on('transition-started', handleTransitionStarted);
    manager.on('transition-completed', handleTransitionCompleted);
    manager.on('settings-changed', handleSettingsChanged);
    manager.on('hotkey-added', handleHotkeyAdded);
    manager.on('hotkey-removed', handleHotkeyRemoved);
    manager.on('automation-added', handleAutomationAdded);
    manager.on('automation-removed', handleAutomationRemoved);
    manager.on('automation-triggered', handleAutomationTriggered);
    
    // Cleanup
    return () => {
      manager.off('scene-added', handleSceneAdded);
      manager.off('scene-updated', handleSceneUpdated);
      manager.off('scene-removed', handleSceneRemoved);
      manager.off('scene-switched', handleSceneSwitched);
      manager.off('scene-previewed', handleScenePreviewed);
      manager.off('item-added', handleItemAdded);
      manager.off('item-updated', handleItemUpdated);
      manager.off('item-removed', handleItemRemoved);
      manager.off('item-toggled', handleItemToggled);
      manager.off('transition-started', handleTransitionStarted);
      manager.off('transition-completed', handleTransitionCompleted);
      manager.off('settings-changed', handleSettingsChanged);
      manager.off('hotkey-added', handleHotkeyAdded);
      manager.off('hotkey-removed', handleHotkeyRemoved);
      manager.off('automation-added', handleAutomationAdded);
      manager.off('automation-removed', handleAutomationRemoved);
      manager.off('automation-triggered', handleAutomationTriggered);
    };
  }, [manager, currentScene]);
  
  // ==========================================================================
  // SCENE MANAGEMENT
  // ==========================================================================
  
  const createScene = useCallback((name: string, description?: string) => {
    const scene = manager.createScene(name, description);
    return scene;
  }, [manager]);
  
  const updateScene = useCallback((scene: Scene) => {
    manager.updateScene(scene);
  }, [manager]);
  
  const removeScene = useCallback((sceneId: string) => {
    manager.removeScene(sceneId);
  }, [manager]);
  
  const duplicateScene = useCallback((sceneId: string) => {
    const scene = manager.duplicateScene(sceneId);
    return scene;
  }, [manager]);
  
  // ==========================================================================
  // SCENE SWITCHING
  // ==========================================================================
  
  const switchScene = useCallback(async (sceneId: string) => {
    setIsTransitioning(true);
    await manager.switchScene(sceneId);
  }, [manager]);
  
  const previewScene = useCallback((sceneId: string) => {
    manager.previewScene(sceneId);
  }, [manager]);
  
  // ==========================================================================
  // ITEM MANAGEMENT
  // ==========================================================================
  
  const addItem = useCallback((sceneId: string, item: SceneItem) => {
    manager.addItem(sceneId, item);
  }, [manager]);
  
  const updateItem = useCallback((sceneId: string, item: SceneItem) => {
    manager.updateItem(sceneId, item);
  }, [manager]);
  
  const removeItem = useCallback((sceneId: string, itemId: string) => {
    manager.removeItem(sceneId, itemId);
  }, [manager]);
  
  const toggleItem = useCallback((sceneId: string, itemId: string) => {
    manager.toggleItem(sceneId, itemId);
  }, [manager]);
  
  const duplicateItem = useCallback((sceneId: string, itemId: string) => {
    const item = manager.duplicateItem(sceneId, itemId);
    return item;
  }, [manager]);
  
  const moveItem = useCallback((sceneId: string, itemId: string, position: { x: number; y: number }) => {
    manager.moveItem(sceneId, itemId, position);
  }, [manager]);
  
  const resizeItem = useCallback((sceneId: string, itemId: string, size: { width: number; height: number }) => {
    manager.resizeItem(sceneId, itemId, size);
  }, [manager]);
  
  // ==========================================================================
  // TRANSITION MANAGEMENT
  // ==========================================================================
  
  const setTransition = useCallback((sceneId: string, transition: SceneTransition) => {
    manager.setTransition(sceneId, transition);
  }, [manager]);
  
  const getTransition = useCallback((sceneId: string) => {
    return manager.getTransition(sceneId);
  }, [manager]);
  
  const getDefaultTransition = useCallback(() => {
    return manager.getDefaultTransition();
  }, [manager]);
  
  const setDefaultTransition = useCallback((transition: SceneTransition) => {
    manager.setDefaultTransition(transition);
  }, [manager]);
  
  // ==========================================================================
  // HOTKEY MANAGEMENT
  // ==========================================================================
  
  const setHotkey = useCallback((hotkey: SceneHotkey) => {
    manager.setHotkey(hotkey);
  }, [manager]);
  
  const getHotkey = useCallback((sceneId: string) => {
    return manager.getHotkey(sceneId);
  }, [manager]);
  
  const removeHotkey = useCallback((sceneId: string) => {
    manager.removeHotkey(sceneId);
  }, [manager]);
  
  // ==========================================================================
  // AUTOMATION
  // ==========================================================================
  
  const addAutomationRule = useCallback((rule: SceneAutomationRule) => {
    manager.addAutomationRule(rule);
  }, [manager]);
  
  const updateAutomationRule = useCallback((rule: SceneAutomationRule) => {
    manager.updateAutomationRule(rule);
  }, [manager]);
  
  const removeAutomationRule = useCallback((ruleId: string) => {
    manager.removeAutomationRule(ruleId);
  }, [manager]);
  
  // ==========================================================================
  // SETTINGS
  // ==========================================================================
  
  const updateSettings = useCallback((updates: Partial<SceneSwitcherSettings>) => {
    manager.updateSettings(updates);
  }, [manager]);
  
  const resetSettings = useCallback(() => {
    manager.resetSettings();
    setSettings(manager.getSettings());
  }, [manager]);
  
  // ==========================================================================
  // STATE HELPERS
  // ==========================================================================
  
  const canEditCurrentScene = currentScene ? !currentScene.locked : false;
  
  return {
    // State
    scenes,
    currentScene,
    previewedScene,
    settings,
    stats,
    hotkeys,
    automationRules,
    
    // Scene management
    createScene,
    updateScene,
    removeScene,
    duplicateScene,
    
    // Scene switching
    switchScene,
    previewScene,
    
    // Item management
    addItem,
    updateItem,
    removeItem,
    toggleItem,
    duplicateItem,
    moveItem,
    resizeItem,
    
    // Transition management
    setTransition,
    getTransition,
    getDefaultTransition,
    setDefaultTransition,
    
    // Hotkey management
    setHotkey,
    getHotkey,
    removeHotkey,
    
    // Automation
    addAutomationRule,
    updateAutomationRule,
    removeAutomationRule,
    
    // Settings
    updateSettings,
    resetSettings,
    
    // State helpers
    isTransitioning,
    canEditCurrentScene,
  };
}