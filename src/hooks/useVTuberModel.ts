import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ModelType,
  ModelStatus,
  ModelConfig,
  VTuberState,
  VTuberStatistics,
  Expression,
  BlendShapeBinding,
} from '../types/vtuber';

// Import actual service
import { VTuberModelService as ModelService } from '../services/VTuberModelService';

/**
 * React hook for VTuber model management
 */
export function useVTuberModel() {
  const [state, setState] = useState<VTuberState>(() => ModelService.getInstance().getState());
  const [models, setModels] = useState<ModelConfig[]>(() => ModelService.getInstance().getModels());
  const [expressions, setExpressions] = useState<Expression[]>(() => ModelService.getInstance().getExpressions());
  const serviceRef = useRef<ModelService>(ModelService.getInstance());

  // Sync state with service
  useEffect(() => {
    const service = serviceRef.current;

    const handleStatusChange = (status: ModelStatus) => {
      setState(prev => ({ ...prev, modelStatus: status }));
    };

    const handleModelLoaded = (model: ModelConfig) => {
      setState(prev => ({
        ...prev,
        currentModel: model,
        modelStatus: ModelStatus.READY,
      }));
      setModels(service.getModels());
    };

    const handleModelUnloaded = () => {
      setState(prev => ({
        ...prev,
        currentModel: null,
        modelStatus: ModelStatus.IDLE,
      }));
    };

    const handleExpressionChanged = (expression: Expression | null) => {
      setState(prev => ({
        ...prev,
        expressionState: {
          ...prev.expressionState,
          current: expression,
        },
      }));
    };

    const handleBlendShapesUpdated = () => {
      // Blend shapes updated, could trigger re-render if needed
    };

    const handleError = (error: Error) => {
      console.error('VTuber Model Error:', error);
      setState(prev => ({ ...prev, modelStatus: ModelStatus.ERROR }));
    };

    service.on('status-changed', handleStatusChange);
    service.on('model-loaded', handleModelLoaded);
    service.on('model-unloaded', handleModelUnloaded);
    service.on('expression-changed', handleExpressionChanged);
    service.on('blend-shapes-updated', handleBlendShapesUpdated);
    service.on('error', handleError);

    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('model-loaded', handleModelLoaded);
      service.off('model-unloaded', handleModelUnloaded);
      service.off('expression-changed', handleExpressionChanged);
      service.off('blend-shapes-updated', handleBlendShapesUpdated);
      service.off('error', handleError);
    };
  }, []);

  // Model operations
  const loadModel = useCallback(async (config: Partial<ModelConfig> & { id: string; name: string; type: ModelType; source: string }) => {
    return serviceRef.current.loadModel(config);
  }, []);

  const unloadModel = useCallback(async () => {
    await serviceRef.current.unloadModel();
  }, []);

  const switchModel = useCallback(async (modelId: string) => {
    await serviceRef.current.switchModel(modelId);
  }, []);

  const updateModelConfig = useCallback((modelId: string, config: Partial<ModelConfig>) => {
    serviceRef.current.updateModelConfig(modelId, config);
    setModels(serviceRef.current.getModels());
  }, []);

  // Expression operations
  const setExpression = useCallback((expressionId: string | null) => {
    serviceRef.current.setExpression(expressionId);
  }, []);

  const createExpression = useCallback((expression: Omit<Expression, 'id'> & { id?: string }) => {
    const newExpr = serviceRef.current.createExpression(expression);
    setExpressions(serviceRef.current.getExpressions());
    return newExpr;
  }, []);

  const deleteExpression = useCallback((expressionId: string) => {
    serviceRef.current.deleteExpression(expressionId);
    setExpressions(serviceRef.current.getExpressions());
  }, []);

  // Blend shape operations
  const setBlendShape = useCallback((binding: BlendShapeBinding, value: number) => {
    serviceRef.current.setBlendShape(binding, value);
  }, []);

  const setBlendShapes = useCallback((blendShapes: Partial<Record<BlendShapeBinding, number>>) => {
    serviceRef.current.setBlendShapes(blendShapes);
  }, []);

  // Statistics
  const getStatistics = useCallback(() => {
    return serviceRef.current.getStatistics();
  }, []);

  const resetStatistics = useCallback(() => {
    serviceRef.current.resetStatistics();
    setState(serviceRef.current.getState());
  }, []);

  return {
    // State
    state,
    models,
    expressions,
    currentModel: state.currentModel,
    modelStatus: state.modelStatus,
    statistics: state.statistics,

    // Model operations
    loadModel,
    unloadModel,
    switchModel,
    updateModelConfig,

    // Expression operations
    setExpression,
    createExpression,
    deleteExpression,
    getExpression: useCallback((id: string) => serviceRef.current.getExpression(id), []),

    // Blend shape operations
    setBlendShape,
    setBlendShapes,
    getBlendShapes: useCallback(() => serviceRef.current.getBlendShapes(), []),

    // Statistics
    getStatistics,
    resetStatistics,
  };
}

export default useVTuberModel;