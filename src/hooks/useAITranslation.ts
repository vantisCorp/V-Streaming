import { useState, useEffect, useCallback, useRef } from 'react';
import { AITranslationService } from '../services/AITranslationService';
import {
  AIConfig,
  TranslationConfig,
  TranslationResult,
  TranslationRequest,
  TranslationStatistics,
  TranslationState,
  TranslationServiceStatus,
  SourceLanguage,
  AIServiceProvider,
  TranslationMode,
  TranslationQuality,
} from '../types/ai';

/**
 * Hook return type
 */
interface UseAITranslationReturn {
  // State
  config: AIConfig;
  translationConfig: TranslationConfig;
  state: TranslationState;
  statistics: TranslationStatistics;
  
  // Actions
  updateConfig: (config: Partial<AIConfig>) => void;
  updateTranslationConfig: (config: Partial<TranslationConfig>) => void;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  translate: (request: TranslationRequest) => Promise<TranslationResult | null>;
  translateBatch: (requests: TranslationRequest[]) => Promise<TranslationResult[]>;
  clearCache: () => void;
  resetStatistics: () => void;
  getCacheSize: () => number;
  getSupportedLanguages: () => SourceLanguage[];
  
  // Computed
  isReady: boolean;
  isTranslating: boolean;
  hasError: boolean;
}

/**
 * Custom hook for AI Translation service
 * 
 * Provides React integration for the AITranslationService singleton.
 * Manages state, lifecycle, and exposes service methods.
 */
export function useAITranslation(): UseAITranslationReturn {
  // Get service instance
  const serviceRef = useRef<AITranslationService | null>(null);
  
  // State
  const [config, setConfig] = useState<AIConfig>(() => {
    if (serviceRef.current) {
      return serviceRef.current.getConfig();
    }
    return {
      provider: AIServiceProvider.OPENAI,
      apiKey: '',
      enabled: true,
      debug: false,
    };
  });
  
  const [translationConfig, setTranslationConfig] = useState<TranslationConfig>(() => {
    if (serviceRef.current) {
      return serviceRef.current.getTranslationConfig();
    }
    return {
      sourceLanguage: SourceLanguage.AUTO,
      targetLanguage: SourceLanguage.ENGLISH,
      mode: TranslationMode.REAL_TIME,
      quality: TranslationQuality.BALANCED,
      enabled: true,
      autoDetect: true,
      cacheTranslations: true,
      showOriginal: true,
      profanityFilter: false,
      cacheTTL: 3600000,
      maxRetries: 3,
      timeout: 30000,
    };
  });
  
  const [state, setState] = useState<TranslationState>({
    status: TranslationServiceStatus.IDLE,
    isTranslating: false,
    recentTranslations: [],
    error: null,
    lastTranslationTime: null,
  });
  
  const [statistics, setStatistics] = useState<TranslationStatistics>({
    totalTranslations: 0,
    translationsByLanguage: {},
    averageLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    totalCharacters: 0,
    lastUpdated: Date.now(),
  });

  // Initialize service reference
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = AITranslationService.getInstance();
    }
    
    const service = serviceRef.current;
    
    // Subscribe to events
    const handleStatusChange = (status: TranslationServiceStatus) => {
      setState(prev => ({ ...prev, status }));
    };
    
    const handleTranslationComplete = (result: TranslationResult) => {
      setState(prev => ({
        ...prev,
        currentTranslation: result,
        lastTranslationTime: result.timestamp,
      }));
    };
    
    const handleTranslationError = (error: Error) => {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    };
    
    const handleStatisticsUpdated = (stats: TranslationStatistics) => {
      setStatistics(stats);
    };
    
    service.on('status-changed', handleStatusChange);
    service.on('translation-complete', handleTranslationComplete);
    service.on('translation-error', handleTranslationError);
    service.on('statistics-updated', handleStatisticsUpdated);
    
    // Update initial state from service
    setConfig(service.getConfig());
    setTranslationConfig(service.getTranslationConfig());
    setState(service.getState());
    setStatistics(service.getStatistics());
    
    // Cleanup
    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('translation-complete', handleTranslationComplete);
      service.off('translation-error', handleTranslationError);
      service.off('statistics-updated', handleStatisticsUpdated);
    };
  }, []);

  // Actions
  const updateConfig = useCallback((newConfig: Partial<AIConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(newConfig);
      setConfig(prev => ({ ...prev, ...newConfig }));
    }
  }, []);

  const updateTranslationConfig = useCallback((newConfig: Partial<TranslationConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateTranslationConfig(newConfig);
      setTranslationConfig(prev => ({ ...prev, ...newConfig }));
    }
  }, []);

  const initialize = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.initialize();
    }
  }, []);

  const shutdown = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.shutdown();
    }
  }, []);

  const translate = useCallback(async (request: TranslationRequest): Promise<TranslationResult | null> => {
    if (serviceRef.current) {
      return await serviceRef.current.translate(request);
    }
    return null;
  }, []);

  const translateBatch = useCallback(async (requests: TranslationRequest[]): Promise<TranslationResult[]> => {
    if (serviceRef.current) {
      return await serviceRef.current.translateBatch(requests);
    }
    return [];
  }, []);

  const clearCache = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearCache();
    }
  }, []);

  const resetStatistics = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.resetStatistics();
    }
  }, []);

  const getCacheSize = useCallback((): number => {
    if (serviceRef.current) {
      return serviceRef.current.getCacheSize();
    }
    return 0;
  }, []);

  const getSupportedLanguages = useCallback((): SourceLanguage[] => {
    if (serviceRef.current) {
      return serviceRef.current.getSupportedLanguages();
    }
    return Object.values(SourceLanguage);
  }, []);

  // Computed values
  const isReady = state.status === TranslationServiceStatus.READY;
  const isTranslating = state.isTranslating;
  const hasError = state.status === TranslationServiceStatus.ERROR;

  return {
    config,
    translationConfig,
    state,
    statistics,
    updateConfig,
    updateTranslationConfig,
    initialize,
    shutdown,
    translate,
    translateBatch,
    clearCache,
    resetStatistics,
    getCacheSize,
    getSupportedLanguages,
    isReady,
    isTranslating,
    hasError,
  };
}

export default useAITranslation;