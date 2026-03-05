import { useState, useEffect, useCallback } from 'react';
import { overlayManager } from '../services/OverlayManager';
import {
  Overlay,
  OverlayScene,
  OverlayTemplate,
  OverlaySettings,
  OverlayEditorState,
  OverlayType,
  WidgetType,
  WidgetConfig,
  MarketplaceFilter,
  Position,
  Size,
} from '../types/overlays';

export const useOverlay = () => {
  const [scenes, setScenes] = useState<OverlayScene[]>([]);
  const [currentScene, setCurrentScene] = useState<OverlayScene | null>(overlayManager.getCurrentScene());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(overlayManager.getSelectedLayer());
  const [settings, setSettings] = useState<OverlaySettings>(overlayManager.getSettings());
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [editorState, setEditorState] = useState<OverlayEditorState>(overlayManager.getEditorState());
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Set up event listeners
    const handleSceneCreated = (scene: OverlayScene) => {
      setScenes(prev => [...prev, scene]);
    };

    const handleSceneUpdated = (scene: OverlayScene) => {
      setScenes(prev => prev.map(s => s.id === scene.id ? scene : s));
      if (currentScene?.id === scene.id) {
        setCurrentScene(scene);
      }
    };

    const handleSceneDeleted = (sceneId: string) => {
      setScenes(prev => prev.filter(s => s.id !== sceneId));
      if (currentScene?.id === sceneId) {
        setCurrentScene(null);
      }
    };

    const handleSceneSwitched = (scene: OverlayScene | null) => {
      setCurrentScene(scene);
    };

    const handleLayerAdded = (sceneId: string, layer: Overlay) => {
      if (currentScene?.id === sceneId) {
        setCurrentScene(prev => prev ? {
          ...prev,
          layers: [...prev.layers, layer],
          updatedAt: new Date(),
        } : null);
      }
    };

    const handleLayerUpdated = (sceneId: string, layer: Overlay) => {
      if (currentScene?.id === sceneId) {
        setCurrentScene(prev => prev ? {
          ...prev,
          layers: prev.layers.map(l => l.id === layer.id ? layer : l),
          updatedAt: new Date(),
        } : null);
      }
    };

    const handleLayerDeleted = (sceneId: string, layerId: string) => {
      if (currentScene?.id === sceneId) {
        setCurrentScene(prev => prev ? {
          ...prev,
          layers: prev.layers.filter(l => l.id !== layerId),
          updatedAt: new Date(),
        } : null);
      }
    };

    const handleLayerSelected = (layerId: string | null) => {
      setSelectedLayerId(layerId);
    };

    const handleSettingsChanged = (newSettings: OverlaySettings) => {
      setSettings({ ...newSettings });
    };

    const handleTemplateInstalled = (template: OverlayTemplate) => {
      setTemplates(prev => [...prev, template]);
    };

    const handleTemplateDeleted = (templateId: string) => {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    };

    const handleUndoStateChanged = (undo: boolean, redo: boolean) => {
      setCanUndo(undo);
      setCanRedo(redo);
    };

    overlayManager.on('sceneCreated', handleSceneCreated);
    overlayManager.on('sceneUpdated', handleSceneUpdated);
    overlayManager.on('sceneDeleted', handleSceneDeleted);
    overlayManager.on('sceneSwitched', handleSceneSwitched);
    overlayManager.on('layerAdded', handleLayerAdded);
    overlayManager.on('layerUpdated', handleLayerUpdated);
    overlayManager.on('layerDeleted', handleLayerDeleted);
    overlayManager.on('layerSelected', handleLayerSelected);
    overlayManager.on('settingsChanged', handleSettingsChanged);
    overlayManager.on('templateInstalled', handleTemplateInstalled);
    overlayManager.on('templateDeleted', handleTemplateDeleted);
    overlayManager.on('undoStateChanged', handleUndoStateChanged);

    // Cleanup
    return () => {
      overlayManager.off('sceneCreated', handleSceneCreated);
      overlayManager.off('sceneUpdated', handleSceneUpdated);
      overlayManager.off('sceneDeleted', handleSceneDeleted);
      overlayManager.off('sceneSwitched', handleSceneSwitched);
      overlayManager.off('layerAdded', handleLayerAdded);
      overlayManager.off('layerUpdated', handleLayerUpdated);
      overlayManager.off('layerDeleted', handleLayerDeleted);
      overlayManager.off('layerSelected', handleLayerSelected);
      overlayManager.off('settingsChanged', handleSettingsChanged);
      overlayManager.off('templateInstalled', handleTemplateInstalled);
      overlayManager.off('templateDeleted', handleTemplateDeleted);
      overlayManager.off('undoStateChanged', handleUndoStateChanged);
    };
  }, [currentScene]);

  const loadInitialData = useCallback(() => {
    setScenes(overlayManager.getScenes());
    setCurrentScene(overlayManager.getCurrentScene());
    setTemplates(overlayManager.getTemplates());
    setEditorState(overlayManager.getEditorState());
    setCanUndo(overlayManager.canUndo());
    setCanRedo(overlayManager.canRedo());
  }, []);

  // Scene Management
  const createScene = useCallback((name: string, description: string = '') => {
    return overlayManager.createScene(name, description);
  }, []);

  const updateScene = useCallback((sceneId: string, updates: Partial<OverlayScene>) => {
    return overlayManager.updateScene(sceneId, updates);
  }, []);

  const deleteScene = useCallback((sceneId: string) => {
    return overlayManager.deleteScene(sceneId);
  }, []);

  const getScene = useCallback((sceneId: string) => {
    return overlayManager.getScene(sceneId);
  }, []);

  const switchScene = useCallback((sceneId: string) => {
    return overlayManager.switchScene(sceneId);
  }, []);

  // Layer Management
  const addLayer = useCallback((sceneId: string, layer: Omit<Overlay, 'id'>) => {
    return overlayManager.addLayer(sceneId, layer);
  }, []);

  const updateLayer = useCallback((sceneId: string, layerId: string, updates: Partial<Overlay>) => {
    return overlayManager.updateLayer(sceneId, layerId, updates);
  }, []);

  const deleteLayer = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.deleteLayer(sceneId, layerId);
  }, []);

  const getLayer = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.getLayer(sceneId, layerId);
  }, []);

  const getLayers = useCallback((sceneId: string) => {
    return overlayManager.getLayers(sceneId);
  }, []);

  // Layer Operations
  const moveLayer = useCallback((sceneId: string, layerId: string, position: Position) => {
    return overlayManager.moveLayer(sceneId, layerId, position);
  }, []);

  const resizeLayer = useCallback((sceneId: string, layerId: string, size: Size) => {
    return overlayManager.resizeLayer(sceneId, layerId, size);
  }, []);

  const setLayerVisibility = useCallback((sceneId: string, layerId: string, visible: boolean) => {
    return overlayManager.setLayerVisibility(sceneId, layerId, visible);
  }, []);

  const setLayerLock = useCallback((sceneId: string, layerId: string, locked: boolean) => {
    return overlayManager.setLayerLock(sceneId, layerId, locked);
  }, []);

  const setLayerOpacity = useCallback((sceneId: string, layerId: string, opacity: number) => {
    return overlayManager.setLayerOpacity(sceneId, layerId, opacity);
  }, []);

  const setLayerZIndex = useCallback((sceneId: string, layerId: string, zIndex: number) => {
    return overlayManager.setLayerZIndex(sceneId, layerId, zIndex);
  }, []);

  const bringToFront = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.bringToFront(sceneId, layerId);
  }, []);

  const sendToBack = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.sendToBack(sceneId, layerId);
  }, []);

  const duplicateLayer = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.duplicateLayer(sceneId, layerId);
  }, []);

  // Editor State
  const selectLayer = useCallback((layerId: string | null) => {
    overlayManager.selectLayer(layerId);
  }, []);

  const copyLayer = useCallback((sceneId: string, layerId: string) => {
    return overlayManager.copyLayer(sceneId, layerId);
  }, []);

  const pasteLayer = useCallback((sceneId: string) => {
    return overlayManager.pasteLayer(sceneId);
  }, []);

  // Undo/Redo
  const pushToHistory = useCallback((sceneId: string) => {
    overlayManager.pushToHistory(sceneId);
  }, []);

  const undo = useCallback(() => {
    return overlayManager.undo();
  }, []);

  const redo = useCallback(() => {
    return overlayManager.redo();
  }, []);

  // Grid and Ruler
  const setGridVisible = useCallback((visible: boolean) => {
    overlayManager.setGridVisible(visible);
    setEditorState(overlayManager.getEditorState());
  }, []);

  const setGridSize = useCallback((size: number) => {
    overlayManager.setGridSize(size);
    setEditorState(overlayManager.getEditorState());
  }, []);

  const setSnapToGrid = useCallback((enabled: boolean) => {
    overlayManager.setSnapToGrid(enabled);
    setEditorState(overlayManager.getEditorState());
  }, []);

  const setRulerVisible = useCallback((visible: boolean) => {
    overlayManager.setRulerVisible(visible);
    setEditorState(overlayManager.getEditorState());
  }, []);

  // Widget Data
  const fetchWidgetData = useCallback(async (widgetType: WidgetType, config: WidgetConfig) => {
    return await overlayManager.fetchWidgetData(widgetType, config);
  }, []);

  // Templates
  const createTemplate = useCallback((scene: OverlayScene, metadata: Partial<OverlayTemplate>) => {
    return overlayManager.createTemplate(scene, metadata);
  }, []);

  const installTemplate = useCallback((template: OverlayTemplate) => {
    return overlayManager.installTemplate(template);
  }, []);

  const getTemplate = useCallback((templateId: string) => {
    return overlayManager.getTemplate(templateId);
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    return overlayManager.deleteTemplate(templateId);
  }, []);

  // Marketplace
  const fetchMarketplaceTemplates = useCallback(async (filter?: MarketplaceFilter) => {
    return await overlayManager.fetchMarketplaceTemplates(filter);
  }, []);

  const getMarketplaceStats = useCallback(async () => {
    return await overlayManager.getMarketplaceStats();
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<OverlaySettings>) => {
    overlayManager.updateSettings(updates);
  }, []);

  // Export/Import
  const exportScene = useCallback((sceneId: string) => {
    return overlayManager.exportScene(sceneId);
  }, []);

  const importScene = useCallback((json: string) => {
    return overlayManager.importScene(json);
  }, []);

  return {
    // State
    scenes,
    currentScene,
    selectedLayerId,
    settings,
    templates,
    editorState,
    canUndo,
    canRedo,

    // Scene Management
    createScene,
    updateScene,
    deleteScene,
    getScene,
    switchScene,

    // Layer Management
    addLayer,
    updateLayer,
    deleteLayer,
    getLayer,
    getLayers,

    // Layer Operations
    moveLayer,
    resizeLayer,
    setLayerVisibility,
    setLayerLock,
    setLayerOpacity,
    setLayerZIndex,
    bringToFront,
    sendToBack,
    duplicateLayer,

    // Editor State
    selectLayer,
    copyLayer,
    pasteLayer,

    // Undo/Redo
    pushToHistory,
    undo,
    redo,

    // Grid and Ruler
    setGridVisible,
    setGridSize,
    setSnapToGrid,
    setRulerVisible,

    // Widget Data
    fetchWidgetData,

    // Templates
    createTemplate,
    installTemplate,
    getTemplate,
    deleteTemplate,

    // Marketplace
    fetchMarketplaceTemplates,
    getMarketplaceStats,

    // Settings
    updateSettings,

    // Export/Import
    exportScene,
    importScene,

    // Utilities
    loadInitialData,
  };
};