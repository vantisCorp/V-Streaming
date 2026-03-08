/**
 * useExpressionEditor - React hook for expression editor functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExpressionEditorService } from '../services/ExpressionEditorService';
import {
  CustomExpression,
  ExpressionLayer,
  ExpressionAnimation,
  ExpressionKeyframe,
  ExpressionEditorConfig,
  ExpressionEditorState,
  ExpressionEditorTool,
  ExpressionCategory,
  BlendShapeBinding,
  ExpressionBlendMode,
  EasingFunction,
  EXPRESSION_PRESETS,
  DEFAULT_EXPRESSION_EDITOR_CONFIG,
} from '../types/vtuber';

export interface UseExpressionEditorReturn {
  // State
  expressions: CustomExpression[];
  currentExpression: CustomExpression | null;
  selectedTool: ExpressionEditorTool;
  selectedLayerId: string | null;
  selectedKeyframeId: string | null;
  zoom: number;
  isPlaying: boolean;
  currentTime: number;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  config: ExpressionEditorConfig;

  // Expression actions
  createExpression: (name: string, category?: ExpressionCategory) => CustomExpression | null;
  loadExpression: (expressionId: string) => boolean;
  updateExpression: (updates: Partial<CustomExpression>) => void;
  saveExpression: () => boolean;
  deleteExpression: (expressionId: string) => boolean;
  duplicateExpression: (expressionId: string) => CustomExpression | null;
  importExpression: (json: string) => CustomExpression | null;
  exportExpression: (expressionId: string) => string | null;

  // Layer actions
  addLayer: (name?: string) => ExpressionLayer | null;
  removeLayer: (layerId: string) => boolean;
  updateLayer: (layerId: string, updates: Partial<ExpressionLayer>) => boolean;
  reorderLayers: (fromIndex: number, toIndex: number) => boolean;
  selectLayer: (layerId: string | null) => void;

  // Blend shape actions
  setBlendShape: (binding: BlendShapeBinding, value: number) => void;
  getBlendShape: (binding: BlendShapeBinding) => number;
  setLayerBlendShape: (layerId: string, binding: BlendShapeBinding, value: number) => boolean;

  // Animation actions
  createAnimation: (duration?: number) => ExpressionAnimation | null;
  addKeyframe: (time: number, values: Map<BlendShapeBinding, number>) => ExpressionKeyframe | null;
  removeKeyframe: (keyframeId: string) => boolean;
  updateKeyframe: (keyframeId: string, updates: Partial<ExpressionKeyframe>) => boolean;
  playAnimation: () => void;
  stopAnimation: () => void;
  seekTo: (time: number) => void;
  selectKeyframe: (keyframeId: string | null) => void;

  // Tool actions
  setTool: (tool: ExpressionEditorTool) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;

  // Undo/Redo
  undo: () => boolean;
  redo: () => boolean;

  // Presets
  applyPreset: (presetId: string) => boolean;
  presets: typeof EXPRESSION_PRESETS;

  // Config
  updateConfig: (config: Partial<ExpressionEditorConfig>) => void;
}

export function useExpressionEditor(): UseExpressionEditorReturn {
  const serviceRef = useRef<ExpressionEditorService | null>(null);
  
  // States
  const [expressions, setExpressions] = useState<CustomExpression[]>([]);
  const [state, setState] = useState<ExpressionEditorState>({
    currentExpression: null,
    selectedTool: ExpressionEditorTool.SELECT,
    selectedLayerId: null,
    selectedKeyframeId: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    isPlaying: false,
    currentTime: 0,
    undoStack: [],
    redoStack: [],
    hasUnsavedChanges: false,
  });
  const [config, setConfig] = useState<ExpressionEditorConfig>(DEFAULT_EXPRESSION_EDITOR_CONFIG);

  // Initialize service
  useEffect(() => {
    const service = ExpressionEditorService.getInstance();
    serviceRef.current = service;

    // Set initial values
    setExpressions(service.getExpressions());
    setState(service.getState());
    setConfig(service.getConfig());

    // Event listeners
    const onExpressionCreated = (expression: CustomExpression) => {
      setExpressions(service.getExpressions());
    };

    const onExpressionDeleted = () => {
      setExpressions(service.getExpressions());
    };

    const onExpressionLoaded = (expression: CustomExpression) => {
      setState(service.getState());
    };

    const onStateChanged = (newState: ExpressionEditorState) => {
      setState({ ...newState });
    };

    service.on('expression:created', onExpressionCreated);
    service.on('expression:deleted', onExpressionDeleted);
    service.on('expression:loaded', onExpressionLoaded);
    service.on('state:changed', onStateChanged);

    return () => {
      service.off('expression:created', onExpressionCreated);
      service.off('expression:deleted', onExpressionDeleted);
      service.off('expression:loaded', onExpressionLoaded);
      service.off('state:changed', onStateChanged);
    };
  }, []);

  // Expression actions
  const createExpression = useCallback((name: string, category?: ExpressionCategory): CustomExpression | null => {
    if (!serviceRef.current) return null;
    const expression = serviceRef.current.createExpression(name, category);
    setExpressions(serviceRef.current.getExpressions());
    serviceRef.current.loadExpression(expression.id);
    return expression;
  }, []);

  const loadExpression = useCallback((expressionId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.loadExpression(expressionId);
  }, []);

  const updateExpression = useCallback((updates: Partial<CustomExpression>): void => {
    if (!serviceRef.current) return;
    serviceRef.current.updateExpression(updates);
  }, []);

  const saveExpression = useCallback((): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.saveExpression();
  }, []);

  const deleteExpression = useCallback((expressionId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.deleteExpression(expressionId);
  }, []);

  const duplicateExpression = useCallback((expressionId: string): CustomExpression | null => {
    if (!serviceRef.current) return null;
    const duplicate = serviceRef.current.duplicateExpression(expressionId);
    if (duplicate) {
      setExpressions(serviceRef.current.getExpressions());
    }
    return duplicate;
  }, []);

  const importExpression = useCallback((json: string): CustomExpression | null => {
    if (!serviceRef.current) return null;
    const expression = serviceRef.current.importExpression(json);
    if (expression) {
      setExpressions(serviceRef.current.getExpressions());
    }
    return expression;
  }, []);

  const exportExpression = useCallback((expressionId: string): string | null => {
    if (!serviceRef.current) return null;
    return serviceRef.current.exportExpression(expressionId);
  }, []);

  // Layer actions
  const addLayer = useCallback((name?: string): ExpressionLayer | null => {
    if (!serviceRef.current) return null;
    return serviceRef.current.addLayer(name);
  }, []);

  const removeLayer = useCallback((layerId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.removeLayer(layerId);
  }, []);

  const updateLayer = useCallback((layerId: string, updates: Partial<ExpressionLayer>): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.updateLayer(layerId, updates);
  }, []);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.reorderLayers(fromIndex, toIndex);
  }, []);

  const selectLayer = useCallback((layerId: string | null): void => {
    if (!serviceRef.current) return;
    serviceRef.current.getState().selectedLayerId = layerId;
    setState(serviceRef.current.getState());
  }, []);

  // Blend shape actions
  const setBlendShape = useCallback((binding: BlendShapeBinding, value: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setBlendShape(binding, value);
  }, []);

  const getBlendShape = useCallback((binding: BlendShapeBinding): number => {
    if (!serviceRef.current) return 0;
    return serviceRef.current.getBlendShape(binding);
  }, []);

  const setLayerBlendShape = useCallback((layerId: string, binding: BlendShapeBinding, value: number): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.setLayerBlendShape(layerId, binding, value);
  }, []);

  // Animation actions
  const createAnimation = useCallback((duration?: number): ExpressionAnimation | null => {
    if (!serviceRef.current) return null;
    return serviceRef.current.createAnimation(duration);
  }, []);

  const addKeyframe = useCallback((time: number, values: Map<BlendShapeBinding, number>): ExpressionKeyframe | null => {
    if (!serviceRef.current) return null;
    return serviceRef.current.addKeyframe(time, values);
  }, []);

  const removeKeyframe = useCallback((keyframeId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.removeKeyframe(keyframeId);
  }, []);

  const updateKeyframe = useCallback((keyframeId: string, updates: Partial<ExpressionKeyframe>): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.updateKeyframe(keyframeId, updates);
  }, []);

  const playAnimation = useCallback((): void => {
    if (!serviceRef.current) return;
    serviceRef.current.playAnimation();
  }, []);

  const stopAnimation = useCallback((): void => {
    if (!serviceRef.current) return;
    serviceRef.current.stopAnimation();
  }, []);

  const seekTo = useCallback((time: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.seekTo(time);
  }, []);

  const selectKeyframe = useCallback((keyframeId: string | null): void => {
    if (!serviceRef.current) return;
    serviceRef.current.getState().selectedKeyframeId = keyframeId;
    setState(serviceRef.current.getState());
  }, []);

  // Tool actions
  const setTool = useCallback((tool: ExpressionEditorTool): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setTool(tool);
  }, []);

  const setZoom = useCallback((zoom: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setZoom(zoom);
  }, []);

  const setPan = useCallback((x: number, y: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.setPan(x, y);
  }, []);

  // Undo/Redo
  const undo = useCallback((): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.undo();
  }, []);

  const redo = useCallback((): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.redo();
  }, []);

  // Presets
  const applyPreset = useCallback((presetId: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current.applyPreset(presetId);
  }, []);

  // Config
  const updateConfig = useCallback((newConfig: Partial<ExpressionEditorConfig>): void => {
    if (!serviceRef.current) return;
    serviceRef.current.updateConfig(newConfig);
    setConfig(serviceRef.current.getConfig());
  }, []);

  return {
    // State
    expressions,
    currentExpression: state.currentExpression,
    selectedTool: state.selectedTool,
    selectedLayerId: state.selectedLayerId,
    selectedKeyframeId: state.selectedKeyframeId,
    zoom: state.zoom,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    hasUnsavedChanges: state.hasUnsavedChanges,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    config,

    // Expression actions
    createExpression,
    loadExpression,
    updateExpression,
    saveExpression,
    deleteExpression,
    duplicateExpression,
    importExpression,
    exportExpression,

    // Layer actions
    addLayer,
    removeLayer,
    updateLayer,
    reorderLayers,
    selectLayer,

    // Blend shape actions
    setBlendShape,
    getBlendShape,
    setLayerBlendShape,

    // Animation actions
    createAnimation,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    playAnimation,
    stopAnimation,
    seekTo,
    selectKeyframe,

    // Tool actions
    setTool,
    setZoom,
    setPan,

    // Undo/Redo
    undo,
    redo,

    // Presets
    applyPreset,
    presets: EXPRESSION_PRESETS,

    // Config
    updateConfig,
  };
}

export default useExpressionEditor;