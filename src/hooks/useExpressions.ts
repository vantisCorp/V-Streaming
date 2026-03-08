import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Expression,
  ExpressionCategory,
  ExpressionState,
} from '../types/vtuber';

import { ExpressionService } from '../services/ExpressionService';

/**
 * React hook for expression management
 */
export function useExpressions() {
  const [state, setState] = useState<ExpressionState>(() => ExpressionService.getInstance().getState());
  const [history, setHistory] = useState<Expression[]>(() => ExpressionService.getInstance().getHistory());
  const [autoBlinkEnabled, setAutoBlinkEnabled] = useState<boolean>(true);

  const serviceRef = useRef<ExpressionService>(ExpressionService.getInstance());

  // Sync state with service
  useEffect(() => {
    const service = serviceRef.current;

    const handleExpressionTriggered = (expression: Expression) => {
      setState(service.getState());
    };

    const handleExpressionEnded = (expression: Expression) => {
      setState(service.getState());
    };

    const handleTransitionStart = (from: Expression | null, to: Expression) => {
      setState(service.getState());
    };

    const handleTransitionComplete = (expression: Expression) => {
      setState(service.getState());
      setHistory(service.getHistory());
    };

    const handleAutoBlink = () => {
      // Auto blink occurred
    };

    service.on('expression-triggered', handleExpressionTriggered);
    service.on('expression-ended', handleExpressionEnded);
    service.on('transition-start', handleTransitionStart);
    service.on('transition-complete', handleTransitionComplete);
    service.on('auto-blink', handleAutoBlink);

    return () => {
      service.off('expression-triggered', handleExpressionTriggered);
      service.off('expression-ended', handleExpressionEnded);
      service.off('transition-start', handleTransitionStart);
      service.off('transition-complete', handleTransitionComplete);
      service.off('auto-blink', handleAutoBlink);
    };
  }, []);

  // Expression control
  const triggerExpression = useCallback((expressionId: string, duration?: number) => {
    serviceRef.current.triggerExpression(expressionId, duration);
  }, []);

  const triggerByCategory = useCallback((category: ExpressionCategory) => {
    serviceRef.current.triggerByCategory(category);
  }, []);

  const resetToNeutral = useCallback(() => {
    serviceRef.current.resetToNeutral();
  }, []);

  const queueExpression = useCallback((expressionId: string, duration?: number) => {
    serviceRef.current.queueExpression(expressionId, duration);
  }, []);

  const clearQueue = useCallback(() => {
    serviceRef.current.clearQueue();
  }, []);

  // Layered expressions
  const setLayeredIntensity = useCallback((expressionId: string, intensity: number) => {
    serviceRef.current.setLayeredIntensity(expressionId, intensity);
  }, []);

  const getActiveLayers = useCallback(() => {
    return serviceRef.current.getActiveLayers();
  }, []);

  // Auto blink control
  const enableAutoBlink = useCallback((enabled: boolean = true) => {
    serviceRef.current.enableAutoBlink(enabled);
    setAutoBlinkEnabled(enabled);
  }, []);

  const setAutoBlinkInterval = useCallback((intervalMs: number) => {
    serviceRef.current.setAutoBlinkInterval(intervalMs);
  }, []);

  const blink = useCallback(() => {
    serviceRef.current.blink();
  }, []);

  // State access
  const getState = useCallback(() => {
    return serviceRef.current.getState();
  }, []);

  const getHistory = useCallback(() => {
    return serviceRef.current.getHistory();
  }, []);

  const clearHistory = useCallback(() => {
    serviceRef.current.clearHistory();
    setHistory([]);
  }, []);

  return {
    // State
    state,
    history,
    currentExpression: state.current,
    previousExpression: state.previous,
    transitionProgress: state.transitionProgress,
    activeLayers: state.active,
    autoBlinkEnabled,

    // Expression control
    triggerExpression,
    triggerByCategory,
    resetToNeutral,
    queueExpression,
    clearQueue,

    // Layered expressions
    setLayeredIntensity,
    getActiveLayers,

    // Auto blink
    enableAutoBlink,
    setAutoBlinkInterval,
    blink,

    // State access
    getState,
    getHistory,
    clearHistory,
  };
}

export default useExpressions;