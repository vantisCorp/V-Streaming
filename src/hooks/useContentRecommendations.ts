import { useState, useEffect, useCallback, useRef } from 'react';
import { AIContentRecommendationService } from '../services/AIContentRecommendationService';
import {
  AIConfig,
  ContentRecommendationConfig,
  ContentRecommendation,
  ContentRecommendationStats,
  ContentAnalysis,
  RecommendationServiceStatus,
  AIServiceProvider,
} from '../types/ai';

interface UseContentRecommendationsReturn {
  // State
  config: AIConfig;
  recommendationConfig: ContentRecommendationConfig;
  status: RecommendationServiceStatus;
  statistics: ContentRecommendationStats;
  recommendations: ContentRecommendation[];
  analysisHistory: ContentAnalysis[];
  
  // Actions
  updateConfig: (config: Partial<AIConfig>) => void;
  updateRecommendationConfig: (config: Partial<ContentRecommendationConfig>) => void;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  performAnalysis: () => Promise<ContentAnalysis | null>;
  applyRecommendation: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  clearRecommendations: () => void;
  resetStatistics: () => void;
  
  // Computed
  isReady: boolean;
  isAnalyzing: boolean;
}

export function useContentRecommendations(): UseContentRecommendationsReturn {
  const serviceRef = useRef<AIContentRecommendationService | null>(null);
  
  const [config, setConfig] = useState<AIConfig>({
    provider: AIServiceProvider.OPENAI,
    apiKey: '',
    enabled: true,
    debug: false,
  });
  
  const [recommendationConfig, setRecommendationConfig] = useState<ContentRecommendationConfig>({
    enabled: true,
    analysisInterval: 300000,
    minConfidence: 0.7,
    maxRecommendations: 10,
    categories: [],
    autoSuggest: true,
  });
  
  const [status, setStatus] = useState<RecommendationServiceStatus>(RecommendationServiceStatus.IDLE);
  const [statistics, setStatistics] = useState<ContentRecommendationStats>({
    totalAnalyses: 0,
    recommendationsGenerated: 0,
    recommendationsApplied: 0,
    averageEngagement: 0,
    topCategories: {},
    lastAnalysis: null,
  });
  
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<ContentAnalysis[]>([]);
  
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = AIContentRecommendationService.getInstance();
    }
    
    const service = serviceRef.current;
    
    const handleStatusChange = (newStatus: RecommendationServiceStatus) => setStatus(newStatus);
    const handleStatisticsUpdate = (stats: ContentRecommendationStats) => setStatistics(stats);
    const handleRecommendation = (rec: ContentRecommendation) => {
      setRecommendations(prev => [rec, ...prev].slice(0, 20));
    };
    const handleAnalysis = (analysis: ContentAnalysis) => {
      setAnalysisHistory(prev => [analysis, ...prev].slice(0, 20));
    };
    
    service.on('status-changed', handleStatusChange);
    service.on('statistics-updated', handleStatisticsUpdate);
    service.on('recommendation-available', handleRecommendation);
    service.on('analysis-complete', handleAnalysis);
    
    setConfig(service.getConfig());
    setRecommendationConfig(service.getRecommendationConfig());
    setStatus(service.getStatus());
    setStatistics(service.getStatistics());
    setRecommendations(service.getRecommendations());
    setAnalysisHistory(service.getAnalysisHistory());
    
    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('statistics-updated', handleStatisticsUpdate);
      service.off('recommendation-available', handleRecommendation);
      service.off('analysis-complete', handleAnalysis);
    };
  }, []);
  
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(updates);
      setConfig(prev => ({ ...prev, ...updates }));
    }
  }, []);
  
  const updateRecommendationConfig = useCallback((updates: Partial<ContentRecommendationConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateRecommendationConfig(updates);
      setRecommendationConfig(prev => ({ ...prev, ...updates }));
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
  
  const performAnalysis = useCallback(async (): Promise<ContentAnalysis | null> => {
    if (serviceRef.current) {
      return await serviceRef.current.performAnalysis();
    }
    return null;
  }, []);
  
  const applyRecommendation = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.applyRecommendation(id);
      setRecommendations(prev => prev.filter(r => r.id !== id));
    }
  }, []);
  
  const dismissRecommendation = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.dismissRecommendation(id);
      setRecommendations(prev => prev.filter(r => r.id !== id));
    }
  }, []);
  
  const clearRecommendations = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearRecommendations();
      setRecommendations([]);
    }
  }, []);
  
  const resetStatistics = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.resetStatistics();
    }
  }, []);
  
  const isReady = status === RecommendationServiceStatus.READY;
  const isAnalyzing = status === RecommendationServiceStatus.ANALYZING;
  
  return {
    config,
    recommendationConfig,
    status,
    statistics,
    recommendations,
    analysisHistory,
    updateConfig,
    updateRecommendationConfig,
    initialize,
    shutdown,
    performAnalysis,
    applyRecommendation,
    dismissRecommendation,
    clearRecommendations,
    resetStatistics,
    isReady,
    isAnalyzing,
  };
}

export default useContentRecommendations;