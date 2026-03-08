/**
 * ExpressionEditorService - Service for creating and editing custom VTuber expressions
 * Supports blend shapes, layers, animations, and undo/redo
 */

import { EventEmitter } from 'eventemitter3';
import {
  CustomExpression,
  ExpressionLayer,
  ExpressionAnimation,
  ExpressionKeyframe,
  ExpressionEditorConfig,
  ExpressionEditorState,
  ExpressionEditorAction,
  ExpressionEditorActionType,
  ExpressionEditorTool,
  ExpressionCategory,
  BlendShapeBinding,
  ExpressionBlendMode,
  EasingFunction,
  DEFAULT_EXPRESSION_EDITOR_CONFIG,
  DEFAULT_EXPRESSION_EDITOR_STATE,
  EXPRESSION_PRESETS,
} from '../types/vtuber';

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ============ Events ============

export interface ExpressionEditorEvents {
  'expression:created': (expression: CustomExpression) => void;
  'expression:updated': (expression: CustomExpression) => void;
  'expression:deleted': (expressionId: string) => void;
  'expression:loaded': (expression: CustomExpression) => void;
  'layer:added': (layer: ExpressionLayer) => void;
  'layer:removed': (layerId: string) => void;
  'layer:updated': (layer: ExpressionLayer) => void;
  'animation:started': (animation: ExpressionAnimation) => void;
  'animation:stopped': () => void;
  'animation:frame': (time: number) => void;
  'state:changed': (state: ExpressionEditorState) => void;
  'undo': (action: ExpressionEditorAction) => void;
  'redo': (action: ExpressionEditorAction) => void;
  'save': (expression: CustomExpression) => void;
  'export': (data: string) => void;
}

// ============ Service ============

export class ExpressionEditorService extends EventEmitter<ExpressionEditorEvents> {
  private static instance: ExpressionEditorService | null = null;
  
  private config: ExpressionEditorConfig;
  private state: ExpressionEditorState;
  private expressions: Map<string, CustomExpression>;
  private animationFrameId: number | null = null;
  private animationStartTime: number = 0;

  private constructor() {
    super();
    this.config = { ...DEFAULT_EXPRESSION_EDITOR_CONFIG };
    this.state = { ...DEFAULT_EXPRESSION_EDITOR_STATE };
    this.expressions = new Map();
    this.loadDefaultExpressions();
  }

  static getInstance(): ExpressionEditorService {
    if (!ExpressionEditorService.instance) {
      ExpressionEditorService.instance = new ExpressionEditorService();
    }
    return ExpressionEditorService.instance;
  }

  // ============ Expression Management ============

  /**
   * Create a new expression
   */
  createExpression(name: string, category: ExpressionCategory = ExpressionCategory.CUSTOM): CustomExpression {
    const expression: CustomExpression = {
      id: generateUUID(),
      name,
      category,
      description: '',
      previewImage: null,
      blendShapes: new Map(),
      layers: [this.createDefaultLayer()],
      animation: null,
      hotkey: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
      isFavorite: false,
    };

    this.expressions.set(expression.id, expression);
    this.emit('expression:created', expression);
    return expression;
  }

  /**
   * Create a default layer
   */
  private createDefaultLayer(): ExpressionLayer {
    return {
      id: generateUUID(),
      name: 'Base',
      blendShapes: new Map(),
      opacity: 1,
      blendMode: ExpressionBlendMode.NORMAL,
      visible: true,
      locked: false,
    };
  }

  /**
   * Load expression for editing
   */
  loadExpression(expressionId: string): boolean {
    const expression = this.expressions.get(expressionId);
    if (!expression) {
      return false;
    }

    this.state.currentExpression = { ...expression };
    this.state.selectedLayerId = expression.layers[0]?.id || null;
    this.state.selectedKeyframeId = null;
    this.state.hasUnsavedChanges = false;
    this.state.undoStack = [];
    this.state.redoStack = [];

    this.emit('expression:loaded', expression);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Update current expression
   */
  updateExpression(updates: Partial<CustomExpression>): void {
    if (!this.state.currentExpression) return;

    const previousState = { ...this.state.currentExpression };
    this.state.currentExpression = {
      ...this.state.currentExpression,
      ...updates,
      updatedAt: Date.now(),
    };

    this.addAction(ExpressionEditorActionType.MODIFY_EXPRESSION, previousState, this.state.currentExpression);
    this.state.hasUnsavedChanges = true;
    this.emit('expression:updated', this.state.currentExpression);
    this.emit('state:changed', this.state);
  }

  /**
   * Save current expression
   */
  saveExpression(): boolean {
    if (!this.state.currentExpression) return false;

    this.state.currentExpression.updatedAt = Date.now();
    this.expressions.set(this.state.currentExpression.id, this.state.currentExpression);
    this.state.hasUnsavedChanges = false;

    this.emit('save', this.state.currentExpression);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Delete expression
   */
  deleteExpression(expressionId: string): boolean {
    if (!this.expressions.has(expressionId)) return false;

    this.expressions.delete(expressionId);
    
    if (this.state.currentExpression?.id === expressionId) {
      this.state.currentExpression = null;
      this.state.selectedLayerId = null;
    }

    this.emit('expression:deleted', expressionId);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Duplicate expression
   */
  duplicateExpression(expressionId: string): CustomExpression | null {
    const original = this.expressions.get(expressionId);
    if (!original) return null;

    const duplicate: CustomExpression = {
      ...original,
      id: generateUUID(),
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false,
    };

    this.expressions.set(duplicate.id, duplicate);
    this.emit('expression:created', duplicate);
    return duplicate;
  }

  // ============ Layer Management ============

  /**
   * Add a new layer
   */
  addLayer(name: string = 'New Layer'): ExpressionLayer | null {
    if (!this.state.currentExpression) return null;

    const layer: ExpressionLayer = {
      id: generateUUID(),
      name,
      blendShapes: new Map(),
      opacity: 1,
      blendMode: ExpressionBlendMode.NORMAL,
      visible: true,
      locked: false,
    };

    const previousState = [...this.state.currentExpression.layers];
    this.state.currentExpression.layers.push(layer);
    this.state.selectedLayerId = layer.id;

    this.addAction(ExpressionEditorActionType.ADD_LAYER, previousState, this.state.currentExpression.layers);
    this.state.hasUnsavedChanges = true;

    this.emit('layer:added', layer);
    this.emit('state:changed', this.state);
    return layer;
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): boolean {
    if (!this.state.currentExpression) return false;
    if (this.state.currentExpression.layers.length <= 1) return false;

    const index = this.state.currentExpression.layers.findIndex(l => l.id === layerId);
    if (index === -1) return false;

    const previousState = [...this.state.currentExpression.layers];
    const [removed] = this.state.currentExpression.layers.splice(index, 1);

    if (this.state.selectedLayerId === layerId) {
      this.state.selectedLayerId = this.state.currentExpression.layers[0]?.id || null;
    }

    this.addAction(ExpressionEditorActionType.REMOVE_LAYER, previousState, this.state.currentExpression.layers);
    this.state.hasUnsavedChanges = true;

    this.emit('layer:removed', layerId);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Update a layer
   */
  updateLayer(layerId: string, updates: Partial<ExpressionLayer>): boolean {
    if (!this.state.currentExpression) return false;

    const layer = this.state.currentExpression.layers.find(l => l.id === layerId);
    if (!layer) return false;

    const previousState = { ...layer };
    Object.assign(layer, updates);

    this.addAction(ExpressionEditorActionType.MODIFY_LAYER, previousState, layer);
    this.state.hasUnsavedChanges = true;

    this.emit('layer:updated', layer);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Reorder layers
   */
  reorderLayers(fromIndex: number, toIndex: number): boolean {
    if (!this.state.currentExpression) return false;

    const layers = this.state.currentExpression.layers;
    if (fromIndex < 0 || fromIndex >= layers.length || toIndex < 0 || toIndex >= layers.length) {
      return false;
    }

    const previousState = [...layers];
    const [removed] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, removed);

    this.addAction(ExpressionEditorActionType.REORDER_LAYERS, previousState, layers);
    this.state.hasUnsavedChanges = true;

    this.emit('state:changed', this.state);
    return true;
  }

  // ============ Blend Shape Management ============

  /**
   * Set blend shape value
   */
  setBlendShape(binding: BlendShapeBinding, value: number): void {
    if (!this.state.currentExpression) return;

    const previousState = this.state.currentExpression.blendShapes.get(binding);
    this.state.currentExpression.blendShapes.set(binding, Math.max(0, Math.min(1, value)));

    this.addAction(ExpressionEditorActionType.MODIFY_BLEND_SHAPE, { binding, value: previousState }, { binding, value });
    this.state.hasUnsavedChanges = true;

    this.emit('expression:updated', this.state.currentExpression);
    this.emit('state:changed', this.state);
  }

  /**
   * Get blend shape value
   */
  getBlendShape(binding: BlendShapeBinding): number {
    if (!this.state.currentExpression) return 0;
    return this.state.currentExpression.blendShapes.get(binding) || 0;
  }

  /**
   * Set layer blend shape value
   */
  setLayerBlendShape(layerId: string, binding: BlendShapeBinding, value: number): boolean {
    if (!this.state.currentExpression) return false;

    const layer = this.state.currentExpression.layers.find(l => l.id === layerId);
    if (!layer) return false;

    layer.blendShapes.set(binding, Math.max(0, Math.min(1, value)));
    this.state.hasUnsavedChanges = true;

    this.emit('layer:updated', layer);
    this.emit('state:changed', this.state);
    return true;
  }

  // ============ Animation Management ============

  /**
   * Create animation for expression
   */
  createAnimation(duration: number = 1000): ExpressionAnimation | null {
    if (!this.state.currentExpression) return null;

    const animation: ExpressionAnimation = {
      id: generateUUID(),
      name: 'Animation',
      duration,
      keyframes: [],
      loop: false,
      loopCount: 1,
    };

    this.state.currentExpression.animation = animation;
    this.state.hasUnsavedChanges = true;

    this.emit('state:changed', this.state);
    return animation;
  }

  /**
   * Add keyframe
   */
  addKeyframe(time: number, values: Map<BlendShapeBinding, number>): ExpressionKeyframe | null {
    if (!this.state.currentExpression?.animation) return null;

    const keyframe: ExpressionKeyframe = {
      id: generateUUID(),
      time,
      values: new Map(values),
      easing: EasingFunction.EASE_IN_OUT,
    };

    const previousState = [...this.state.currentExpression.animation.keyframes];
    this.state.currentExpression.animation.keyframes.push(keyframe);
    this.state.currentExpression.animation.keyframes.sort((a, b) => a.time - b.time);

    this.addAction(ExpressionEditorActionType.ADD_KEYFRAME, previousState, this.state.currentExpression.animation.keyframes);
    this.state.hasUnsavedChanges = true;

    this.emit('state:changed', this.state);
    return keyframe;
  }

  /**
   * Remove keyframe
   */
  removeKeyframe(keyframeId: string): boolean {
    if (!this.state.currentExpression?.animation) return false;

    const keyframes = this.state.currentExpression.animation.keyframes;
    const index = keyframes.findIndex(k => k.id === keyframeId);
    if (index === -1) return false;

    const previousState = [...keyframes];
    keyframes.splice(index, 1);

    this.addAction(ExpressionEditorActionType.REMOVE_KEYFRAME, previousState, keyframes);
    this.state.hasUnsavedChanges = true;

    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Update keyframe
   */
  updateKeyframe(keyframeId: string, updates: Partial<ExpressionKeyframe>): boolean {
    if (!this.state.currentExpression?.animation) return false;

    const keyframe = this.state.currentExpression.animation.keyframes.find(k => k.id === keyframeId);
    if (!keyframe) return false;

    const previousState = { ...keyframe };
    Object.assign(keyframe, updates);

    this.addAction(ExpressionEditorActionType.MODIFY_KEYFRAME, previousState, keyframe);
    this.state.hasUnsavedChanges = true;

    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Play animation
   */
  playAnimation(): void {
    if (!this.state.currentExpression?.animation) return;

    this.state.isPlaying = true;
    this.animationStartTime = Date.now() - this.state.currentTime;
    this.emit('animation:started', this.state.currentExpression.animation);

    const animate = () => {
      if (!this.state.isPlaying) return;

      const elapsed = Date.now() - this.animationStartTime;
      const duration = this.state.currentExpression!.animation!.duration;

      if (elapsed >= duration) {
        if (this.state.currentExpression!.animation!.loop) {
          this.animationStartTime = Date.now();
          this.state.currentTime = 0;
        } else {
          this.state.currentTime = duration;
          this.stopAnimation();
          return;
        }
      } else {
        this.state.currentTime = elapsed;
      }

      this.emit('animation:frame', this.state.currentTime);
      this.emit('state:changed', this.state);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation
   */
  stopAnimation(): void {
    this.state.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit('animation:stopped');
    this.emit('state:changed', this.state);
  }

  /**
   * Seek to time
   */
  seekTo(time: number): void {
    if (!this.state.currentExpression?.animation) return;

    const duration = this.state.currentExpression.animation.duration;
    this.state.currentTime = Math.max(0, Math.min(duration, time));
    
    if (this.state.isPlaying) {
      this.animationStartTime = Date.now() - this.state.currentTime;
    }

    this.emit('animation:frame', this.state.currentTime);
    this.emit('state:changed', this.state);
  }

  // ============ Undo/Redo ============

  /**
   * Add action to undo stack
   */
  private addAction(type: ExpressionEditorActionType, previousState: unknown, newState: unknown): void {
    const action: ExpressionEditorAction = {
      id: generateUUID(),
      type,
      description: this.getActionDescription(type),
      previousState,
      newState,
      timestamp: Date.now(),
    };

    this.state.undoStack.push(action);
    if (this.state.undoStack.length > this.config.undoHistorySize) {
      this.state.undoStack.shift();
    }
    this.state.redoStack = [];
  }

  /**
   * Get action description
   */
  private getActionDescription(type: ExpressionEditorActionType): string {
    const descriptions: Record<ExpressionEditorActionType, string> = {
      [ExpressionEditorActionType.ADD_LAYER]: 'Add layer',
      [ExpressionEditorActionType.REMOVE_LAYER]: 'Remove layer',
      [ExpressionEditorActionType.MODIFY_LAYER]: 'Modify layer',
      [ExpressionEditorActionType.REORDER_LAYERS]: 'Reorder layers',
      [ExpressionEditorActionType.ADD_KEYFRAME]: 'Add keyframe',
      [ExpressionEditorActionType.REMOVE_KEYFRAME]: 'Remove keyframe',
      [ExpressionEditorActionType.MODIFY_KEYFRAME]: 'Modify keyframe',
      [ExpressionEditorActionType.MODIFY_BLEND_SHAPE]: 'Modify blend shape',
      [ExpressionEditorActionType.MODIFY_EXPRESSION]: 'Modify expression',
    };
    return descriptions[type] || 'Unknown action';
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.state.undoStack.length === 0) return false;

    const action = this.state.undoStack.pop()!;
    this.state.redoStack.push(action);
    
    // Apply previous state
    this.applyActionState(action, true);
    
    this.emit('undo', action);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.state.redoStack.length === 0) return false;

    const action = this.state.redoStack.pop()!;
    this.state.undoStack.push(action);
    
    // Apply new state
    this.applyActionState(action, false);
    
    this.emit('redo', action);
    this.emit('state:changed', this.state);
    return true;
  }

  /**
   * Apply action state (undo or redo)
   */
  private applyActionState(action: ExpressionEditorAction, isUndo: boolean): void {
    if (!this.state.currentExpression) return;

    const state = isUndo ? action.previousState : action.newState;

    switch (action.type) {
      case ExpressionEditorActionType.MODIFY_EXPRESSION:
        Object.assign(this.state.currentExpression, state);
        break;
      case ExpressionEditorActionType.MODIFY_BLEND_SHAPE:
        const blendState = state as { binding: BlendShapeBinding; value: number };
        this.state.currentExpression.blendShapes.set(blendState.binding, blendState.value);
        break;
      case ExpressionEditorActionType.ADD_LAYER:
      case ExpressionEditorActionType.REMOVE_LAYER:
      case ExpressionEditorActionType.MODIFY_LAYER:
      case ExpressionEditorActionType.REORDER_LAYERS:
        this.state.currentExpression.layers = state as ExpressionLayer[];
        break;
      case ExpressionEditorActionType.ADD_KEYFRAME:
      case ExpressionEditorActionType.REMOVE_KEYFRAME:
      case ExpressionEditorActionType.MODIFY_KEYFRAME:
        if (this.state.currentExpression.animation) {
          this.state.currentExpression.animation.keyframes = state as ExpressionKeyframe[];
        }
        break;
    }
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.state.undoStack.length > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.state.redoStack.length > 0;
  }

  // ============ Tools ============

  /**
   * Set selected tool
   */
  setTool(tool: ExpressionEditorTool): void {
    this.state.selectedTool = tool;
    this.emit('state:changed', this.state);
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(5, zoom));
    this.emit('state:changed', this.state);
  }

  /**
   * Set pan offset
   */
  setPan(x: number, y: number): void {
    this.state.panX = x;
    this.state.panY = y;
    this.emit('state:changed', this.state);
  }

  // ============ Presets ============

  /**
   * Apply preset to expression
   */
  applyPreset(presetId: string): boolean {
    const preset = EXPRESSION_PRESETS.find(p => p.id === presetId);
    if (!preset || !this.state.currentExpression) return false;

    this.state.currentExpression.blendShapes = new Map(preset.blendShapes);
    this.state.hasUnsavedChanges = true;

    this.emit('expression:updated', this.state.currentExpression);
    this.emit('state:changed', this.state);
    return true;
  }

  // ============ Export/Import ============

  /**
   * Export expression to JSON
   */
  exportExpression(expressionId: string): string | null {
    const expression = this.expressions.get(expressionId);
    if (!expression) return null;

    const exportData = {
      ...expression,
      blendShapes: Array.from(expression.blendShapes.entries()),
      layers: expression.layers.map(layer => ({
        ...layer,
        blendShapes: Array.from(layer.blendShapes.entries()),
      })),
      animation: expression.animation ? {
        ...expression.animation,
        keyframes: expression.animation.keyframes.map(kf => ({
          ...kf,
          values: Array.from(kf.values.entries()),
        })),
      } : null,
    };

    const json = JSON.stringify(exportData, null, 2);
    this.emit('export', json);
    return json;
  }

  /**
   * Import expression from JSON
   */
  importExpression(json: string): CustomExpression | null {
    try {
      const data = JSON.parse(json);
      
      const expression: CustomExpression = {
        ...data,
        id: generateUUID(),
        blendShapes: new Map(data.blendShapes),
        layers: data.layers.map((layer: any) => ({
          ...layer,
          blendShapes: new Map(layer.blendShapes),
        })),
        animation: data.animation ? {
          ...data.animation,
          keyframes: data.animation.keyframes.map((kf: any) => ({
            ...kf,
            values: new Map(kf.values),
          })),
        } : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.expressions.set(expression.id, expression);
      this.emit('expression:created', expression);
      return expression;
    } catch (error) {
      console.error('Failed to import expression:', error);
      return null;
    }
  }

  // ============ Getters ============

  /**
   * Get all expressions
   */
  getExpressions(): CustomExpression[] {
    return Array.from(this.expressions.values());
  }

  /**
   * Get expression by ID
   */
  getExpression(id: string): CustomExpression | undefined {
    return this.expressions.get(id);
  }

  /**
   * Get current state
   */
  getState(): ExpressionEditorState {
    return { ...this.state };
  }

  /**
   * Get config
   */
  getConfig(): ExpressionEditorConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<ExpressionEditorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============ Default Expressions ============

  /**
   * Load default expressions from presets
   */
  private loadDefaultExpressions(): void {
    EXPRESSION_PRESETS.forEach(preset => {
      const expression: CustomExpression = {
        id: preset.id,
        name: preset.name,
        category: preset.category,
        description: `Default ${preset.name.toLowerCase()} expression`,
        previewImage: preset.previewImage,
        blendShapes: new Map(preset.blendShapes),
        layers: [this.createDefaultLayer()],
        animation: null,
        hotkey: null,
        tags: [preset.category],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDefault: true,
        isFavorite: false,
      };

      this.expressions.set(expression.id, expression);
    });
  }

  // ============ Cleanup ============

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopAnimation();
    this.removeAllListeners();
    this.expressions.clear();
    ExpressionEditorService.instance = null;
  }
}

export default ExpressionEditorService;