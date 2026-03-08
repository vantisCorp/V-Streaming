import EventEmitter from 'eventemitter3';
import {
  ModelType,
  ModelStatus,
  ModelConfig,
  VTuberState,
  VTuberStatistics,
  Expression,
  ExpressionState,
  BlendShapeBinding,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_VTUBER_STATE,
  DEFAULT_VTUBER_STATISTICS,
} from '../types/vtuber';

// ============ Event Types ============

interface VTuberModelEvents {
  'status-changed': (status: ModelStatus) => void;
  'model-loaded': (model: ModelConfig) => void;
  'model-unloaded': () => void;
  'expression-changed': (expression: Expression | null) => void;
  'blend-shapes-updated': (blendShapes: Map<BlendShapeBinding, number>) => void;
  'error': (error: Error) => void;
}

/**
 * VTuberModelService
 * 
 * Service for loading, managing, and animating 3D VTuber models.
 * Supports VRM, Live2D, and custom model formats.
 */
export class VTuberModelService extends EventEmitter<VTuberModelEvents> {
  private static instance: VTuberModelService | null = null;
  
  private state: VTuberState = { ...DEFAULT_VTUBER_STATE };
  private models: Map<string, ModelConfig> = new Map();
  private expressions: Map<string, Expression> = new Map();
  private currentBlendShapes: Map<BlendShapeBinding, number> = new Map();
  private animationFrame: number | null = null;
  private lastUpdateTime: number = Date.now();

  private constructor() {
    super();
    this.loadPersistedState();
    this.initializeDefaultExpressions();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VTuberModelService {
    if (!VTuberModelService.instance) {
      VTuberModelService.instance = new VTuberModelService();
    }
    return VTuberModelService.instance;
  }

  // ============ Model Management ============

  /**
   * Load a model from file or URL
   */
  public async loadModel(config: Partial<ModelConfig> & { id: string; name: string; type: ModelType; source: string }): Promise<ModelConfig> {
    this.state.modelStatus = ModelStatus.LOADING;
    this.emit('status-changed', ModelStatus.LOADING);

    try {
      const modelConfig: ModelConfig = {
        ...DEFAULT_MODEL_CONFIG,
        ...config,
      };

      // Simulate model loading (in real implementation, would use Three.js/GLTFLoader for VRM)
      await this.simulateModelLoading(modelConfig);

      this.models.set(modelConfig.id, modelConfig);
      this.state.currentModel = modelConfig;
      this.state.modelStatus = ModelStatus.READY;
      this.state.statistics.modelsLoaded++;
      this.state.statistics.currentModel = modelConfig.id;
      this.state.statistics.lastUpdated = Date.now();

      this.persistState();
      this.emit('status-changed', ModelStatus.READY);
      this.emit('model-loaded', modelConfig);

      return modelConfig;
    } catch (error) {
      this.state.modelStatus = ModelStatus.ERROR;
      this.emit('status-changed', ModelStatus.ERROR);
      this.emit('error', error instanceof Error ? error : new Error('Failed to load model'));
      throw error;
    }
  }

  /**
   * Unload current model
   */
  public async unloadModel(): Promise<void> {
    if (this.state.currentModel) {
      this.models.delete(this.state.currentModel.id);
      this.state.currentModel = null;
      this.state.modelStatus = ModelStatus.IDLE;
      this.state.statistics.currentModel = null;
      this.state.statistics.lastUpdated = Date.now();
      
      this.persistState();
      this.emit('status-changed', ModelStatus.IDLE);
      this.emit('model-unloaded');
    }
  }

  /**
   * Switch to a different loaded model
   */
  public async switchModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    this.state.currentModel = model;
    this.state.statistics.currentModel = model.id;
    this.state.statistics.lastUpdated = Date.now();
    
    this.persistState();
    this.emit('model-loaded', model);
  }

  /**
   * Get all loaded models
   */
  public getModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get current model
   */
  public getCurrentModel(): ModelConfig | null {
    return this.state.currentModel;
  }

  // ============ Expression Management ============

  /**
   * Set current expression
   */
  public setExpression(expressionId: string | null): void {
    if (!expressionId) {
      this.state.expressionState.previous = this.state.expressionState.current;
      this.state.expressionState.current = null;
      this.state.expressionState.transitionProgress = 0;
      this.emit('expression-changed', null);
      return;
    }

    const expression = this.expressions.get(expressionId);
    if (!expression) {
      console.warn(`Expression not found: ${expressionId}`);
      return;
    }

    this.state.expressionState.previous = this.state.expressionState.current;
    this.state.expressionState.current = expression;
    this.state.expressionState.transitionProgress = 0;
    this.state.statistics.expressionsTriggered++;
    this.state.statistics.lastUpdated = Date.now();

    this.emit('expression-changed', expression);
  }

  /**
   * Create a custom expression
   */
  public createExpression(expression: Omit<Expression, 'id'> & { id?: string }): Expression {
    const id = expression.id || `expr_${Date.now()}`;
    const newExpression: Expression = {
      ...expression,
      id,
    };

    this.expressions.set(id, newExpression);
    this.persistState();
    
    return newExpression;
  }

  /**
   * Delete an expression
   */
  public deleteExpression(expressionId: string): void {
    if (this.state.expressionState.current?.id === expressionId) {
      this.setExpression(null);
    }
    this.expressions.delete(expressionId);
    this.persistState();
  }

  /**
   * Get all expressions
   */
  public getExpressions(): Expression[] {
    return Array.from(this.expressions.values());
  }

  /**
   * Get expression by ID
   */
  public getExpression(id: string): Expression | undefined {
    return this.expressions.get(id);
  }

  // ============ Blend Shape Control ============

  /**
   * Set blend shape value
   */
  public setBlendShape(binding: BlendShapeBinding, value: number): void {
    this.currentBlendShapes.set(binding, Math.max(0, Math.min(1, value)));
    this.emit('blend-shapes-updated', this.currentBlendShapes);
  }

  /**
   * Set multiple blend shapes
   */
  public setBlendShapes(blendShapes: Partial<Record<BlendShapeBinding, number>>): void {
    for (const [binding, value] of Object.entries(blendShapes)) {
      if (value !== undefined) {
        this.currentBlendShapes.set(binding as BlendShapeBinding, Math.max(0, Math.min(1, value)));
      }
    }
    this.emit('blend-shapes-updated', this.currentBlendShapes);
  }

  /**
   * Get current blend shapes
   */
  public getBlendShapes(): Map<BlendShapeBinding, number> {
    return new Map(this.currentBlendShapes);
  }

  // ============ State Management ============

  /**
   * Get current state
   */
  public getState(): VTuberState {
    return { ...this.state };
  }

  /**
   * Get statistics
   */
  public getStatistics(): VTuberStatistics {
    return { ...this.state.statistics };
  }

  /**
   * Reset statistics
   */
  public resetStatistics(): void {
    this.state.statistics = { ...DEFAULT_VTUBER_STATISTICS };
    this.state.statistics.currentModel = this.state.currentModel?.id || null;
    this.state.statistics.lastUpdated = Date.now();
    this.persistState();
  }

  // ============ Model Configuration ============

  /**
   * Update model configuration
   */
  public updateModelConfig(modelId: string, config: Partial<ModelConfig>): void {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    Object.assign(model, config);
    this.models.set(modelId, model);

    if (this.state.currentModel?.id === modelId) {
      this.state.currentModel = model;
    }

    this.state.statistics.lastUpdated = Date.now();
    this.persistState();
  }

  // ============ Private Methods ============

  private async simulateModelLoading(config: ModelConfig): Promise<void> {
    // Simulate loading delay based on model type
    const delays: Record<ModelType, number> = {
      [ModelType.VRM]: 500,
      [ModelType.LIVE2D]: 300,
      [ModelType.VRM_READY]: 400,
      [ModelType.CUSTOM]: 600,
    };

    await new Promise(resolve => setTimeout(resolve, delays[config.type] || 500));

    // Validate model (simulation)
    if (!config.source) {
      throw new Error('Model source is required');
    }
  }

  private initializeDefaultExpressions(): void {
    // Neutral expression
    this.expressions.set('neutral', {
      id: 'neutral',
      name: 'Neutral',
      category: 'neutral' as any,
      blendShapes: new Map([
        [BlendShapeBinding.MOUTH_OPEN, 0],
        [BlendShapeBinding.EYE_BLINK_LEFT, 0],
        [BlendShapeBinding.EYE_BLINK_RIGHT, 0],
      ]),
      duration: 200,
      loop: false,
      intensity: 1,
    });

    // Happy expression
    this.expressions.set('happy', {
      id: 'happy',
      name: 'Happy',
      category: 'happy' as any,
      blendShapes: new Map([
        [BlendShapeBinding.MOUTH_SMILE, 0.8],
        [BlendShapeBinding.EYE_WIDE_LEFT, 0.2],
        [BlendShapeBinding.EYE_WIDE_RIGHT, 0.2],
      ]),
      duration: 300,
      loop: false,
      intensity: 1,
    });

    // Sad expression
    this.expressions.set('sad', {
      id: 'sad',
      name: 'Sad',
      category: 'sad' as any,
      blendShapes: new Map([
        [BlendShapeBinding.BROW_DOWN_LEFT, 0.5],
        [BlendShapeBinding.BROW_DOWN_RIGHT, 0.5],
        [BlendShapeBinding.MOUTH_SMILE, 0],
      ]),
      duration: 400,
      loop: false,
      intensity: 1,
    });

    // Surprised expression
    this.expressions.set('surprised', {
      id: 'surprised',
      name: 'Surprised',
      category: 'surprised' as any,
      blendShapes: new Map([
        [BlendShapeBinding.EYE_WIDE_LEFT, 0.9],
        [BlendShapeBinding.EYE_WIDE_RIGHT, 0.9],
        [BlendShapeBinding.MOUTH_OPEN, 0.7],
        [BlendShapeBinding.BROW_UP_LEFT, 0.8],
        [BlendShapeBinding.BROW_UP_RIGHT, 0.8],
      ]),
      duration: 200,
      loop: false,
      intensity: 1,
    });

    // Angry expression
    this.expressions.set('angry', {
      id: 'angry',
      name: 'Angry',
      category: 'angry' as any,
      blendShapes: new Map([
        [BlendShapeBinding.BROW_DOWN_LEFT, 0.8],
        [BlendShapeBinding.BROW_DOWN_RIGHT, 0.8],
        [BlendShapeBinding.EYE_WIDE_LEFT, 0.3],
        [BlendShapeBinding.EYE_WIDE_RIGHT, 0.3],
      ]),
      duration: 250,
      loop: false,
      intensity: 1,
    });

    // Blink expression
    this.expressions.set('blink', {
      id: 'blink',
      name: 'Blink',
      category: 'neutral' as any,
      blendShapes: new Map([
        [BlendShapeBinding.EYE_BLINK_LEFT, 1],
        [BlendShapeBinding.EYE_BLINK_RIGHT, 1],
      ]),
      duration: 100,
      loop: false,
      intensity: 1,
    });
  }

  private persistState(): void {
    try {
      const stateToPersist = {
        models: Array.from(this.models.entries()),
        expressions: Array.from(this.expressions.entries()).map(([id, expr]) => [
          id,
          {
            ...expr,
            blendShapes: Array.from(expr.blendShapes.entries()),
          },
        ]),
        statistics: this.state.statistics,
        currentModelId: this.state.currentModel?.id || null,
      };
      localStorage.setItem('vtuber-state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist VTuber state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const persisted = localStorage.getItem('vtuber-state');
      if (persisted) {
        const state = JSON.parse(persisted);
        
        if (state.models) {
          this.models = new Map(state.models);
        }
        
        if (state.expressions) {
          this.expressions = new Map(
            state.expressions.map(([id, expr]: [string, any]) => [
              id,
              {
                ...expr,
                blendShapes: new Map(expr.blendShapes),
              },
            ])
          );
        }
        
        if (state.statistics) {
          this.state.statistics = state.statistics;
        }
        
        if (state.currentModelId) {
          this.state.currentModel = this.models.get(state.currentModelId) || null;
          if (this.state.currentModel) {
            this.state.modelStatus = ModelStatus.READY;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persisted VTuber state:', error);
    }
  }

  /**
   * Cleanup and destroy instance
   */
  public destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.removeAllListeners();
    VTuberModelService.instance = null;
  }
}

export default VTuberModelService.getInstance();