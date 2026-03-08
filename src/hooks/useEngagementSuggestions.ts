import { useState, useEffect, useCallback, useRef } from 'react';
import { EngagementSuggestionsService } from '../services/EngagementSuggestionsService';
import {
  AIConfig,
  EngagementConfig,
  EngagementSuggestion,
  EngagementStatistics,
  EngagementContext,
  EngagementServiceStatus,
  AIServiceProvider,
} from '../types/ai';

interface UseEngagementSuggestionsReturn {
  // State
  config: AIConfig;
  engagementConfig: EngagementConfig;
  status: EngagementServiceStatus;
  statistics: EngagementStatistics;
  suggestions: EngagementSuggestion[];
  context: EngagementContext | null;
  
  // Actions
  updateConfig: (config: Partial<AIConfig>) => void;
  updateEngagementConfig: (config: Partial<EngagementConfig>) => void;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  updateContext: (context: Partial<EngagementContext>) => void;
  requestSuggestion: () => Promise<EngagementSuggestion | null>;
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;
  resetStatistics: () => void;
  
  // Computed
  isReady: boolean;
  isAnalyzing: boolean;
}

export function useEngagementSuggestions(): UseEngagementSuggestionsReturn {
  const serviceRef = useRef<EngagementSuggestionsService | null>(null);
  
  const [config, setConfig] = useState<AIConfig>({
    provider: AIServiceProvider.OPENAI,
    apiKey: '',
    enabled: true,
    debug: false,
  });
  
  const [engagementConfig, setEngagementConfig] = useState<EngagementConfig>({
    enabled: true,
    autoSuggest: true,
    minInterval: 180000,
    suggestionTypes: [],
    chatThreshold: 10,
    viewerThreshold: 50,
  });
  
  const [status, setStatus] = useState<EngagementServiceStatus>(EngagementServiceStatus.IDLE);
  const [statistics, setStatistics] = useState<EngagementStatistics>({
    totalSuggestions: 0,
    suggestionsApplied: 0,
    averageResponseTime: 0,
    suggestionsByType: {},
    successRate: 0,
    lastSuggestion: null,
  });
  
  const [suggestions, setSuggestions] = useState<EngagementSuggestion[]>([]);
  const [context, setContext] = useState<EngagementContext | null>(null);
  
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = EngagementSuggestionsService.getInstance();
    }
    
    const service = serviceRef.current;
    
    const handleStatusChange = (newStatus: EngagementServiceStatus) => setStatus(newStatus);
    const handleStatisticsUpdate = (stats: EngagementStatistics) => setStatistics(stats);
    const handleSuggestion = (suggestion: EngagementSuggestion) => {
      setSuggestions(prev => [suggestion, ...prev].slice(0, 20));
    };
    const handleSuggestionApplied = (suggestion: EngagementSuggestion) => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    };
    
    service.on('status-changed', handleStatusChange);
    service.on('statistics-updated', handleStatisticsUpdate);
    service.on('suggestion-available', handleSuggestion);
    service.on('suggestion-applied', handleSuggestionApplied);
    
    setConfig(service.getConfig());
    setEngagementConfig(service.getEngagementConfig());
    setStatus(service.getStatus());
    setStatistics(service.getStatistics());
    setSuggestions(service.getSuggestions());
    setContext(service.getContext());
    
    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('statistics-updated', handleStatisticsUpdate);
      service.off('suggestion-available', handleSuggestion);
      service.off('suggestion-applied', handleSuggestionApplied);
    };
  }, []);
  
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(updates);
      setConfig(prev => ({ ...prev, ...updates }));
    }
  }, []);
  
  const updateEngagementConfig = useCallback((updates: Partial<EngagementConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateEngagementConfig(updates);
      setEngagementConfig(prev => ({ ...prev, ...updates }));
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
  
  const updateContext = useCallback((updates: Partial<EngagementContext>) => {
    if (serviceRef.current) {
      serviceRef.current.updateContext(updates);
      setContext(prev => prev ? { ...prev, ...updates } : null);
    }
  }, []);
  
  const requestSuggestion = useCallback(async (): Promise<EngagementSuggestion | null> => {
    if (serviceRef.current) {
      return await serviceRef.current.requestSuggestion();
    }
    return null;
  }, []);
  
  const applySuggestion = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.applySuggestion(id);
    }
  }, []);
  
  const dismissSuggestion = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.dismissSuggestion(id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
    }
  }, []);
  
  const clearSuggestions = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearSuggestions();
      setSuggestions([]);
    }
  }, []);
  
  const resetStatistics = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.resetStatistics();
    }
  }, []);
  
  const isReady = status === EngagementServiceStatus.READY;
  const isAnalyzing = status === EngagementServiceStatus.ANALYZING;
  
  return {
    config,
    engagementConfig,
    status,
    statistics,
    suggestions,
    context,
    updateConfig,
    updateEngagementConfig,
    initialize,
    shutdown,
    updateContext,
    requestSuggestion,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
    resetStatistics,
    isReady,
    isAnalyzing,
  };
}

export default useEngagementSuggestions;