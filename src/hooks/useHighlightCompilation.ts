import { useState, useEffect, useCallback, useRef } from 'react';
import { HighlightCompilationService } from '../services/HighlightCompilationService';
import {
  AIConfig,
  HighlightDetectionConfig,
  StreamHighlight,
  HighlightStatistics,
  HighlightCompilation,
  HighlightServiceStatus,
  HighlightType,
  AIServiceProvider,
} from '../types/ai';

interface UseHighlightCompilationReturn {
  // State
  config: AIConfig;
  highlightConfig: HighlightDetectionConfig;
  status: HighlightServiceStatus;
  statistics: HighlightStatistics;
  highlights: StreamHighlight[];
  compilations: HighlightCompilation[];
  compilationProgress: number;
  
  // Actions
  updateConfig: (config: Partial<AIConfig>) => void;
  updateHighlightConfig: (config: Partial<HighlightDetectionConfig>) => void;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
  addManualHighlight: (highlight: Omit<StreamHighlight, 'id'>) => StreamHighlight | null;
  removeHighlight: (id: string) => void;
  getHighlightsByType: (type: HighlightType) => StreamHighlight[];
  clearHighlights: () => void;
  createCompilation: (title: string, description: string, highlightIds?: string[]) => Promise<HighlightCompilation | null>;
  deleteCompilation: (id: string) => void;
  resetStatistics: () => void;
  
  // Computed
  isReady: boolean;
  isProcessing: boolean;
}

export function useHighlightCompilation(): UseHighlightCompilationReturn {
  const serviceRef = useRef<HighlightCompilationService | null>(null);
  
  const [config, setConfig] = useState<AIConfig>({
    provider: AIServiceProvider.OPENAI,
    apiKey: '',
    enabled: true,
    debug: false,
  });
  
  const [highlightConfig, setHighlightConfig] = useState<HighlightDetectionConfig>({
    enabled: true,
    autoDetect: true,
    minDuration: 5000,
    maxDuration: 60000,
    sensitivity: 'medium',
    types: [],
    includeChat: true,
    includeAudio: true,
    includeVideo: false,
  });
  
  const [status, setStatus] = useState<HighlightServiceStatus>(HighlightServiceStatus.IDLE);
  const [statistics, setStatistics] = useState<HighlightStatistics>({
    totalHighlights: 0,
    compilationsCreated: 0,
    averageScore: 0,
    highlightsByType: {},
    totalDuration: 0,
    lastDetection: null,
  });
  
  const [highlights, setHighlights] = useState<StreamHighlight[]>([]);
  const [compilations, setCompilations] = useState<HighlightCompilation[]>([]);
  const [compilationProgress, setCompilationProgress] = useState(0);
  
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = HighlightCompilationService.getInstance();
    }
    
    const service = serviceRef.current;
    
    const handleStatusChange = (newStatus: HighlightServiceStatus) => setStatus(newStatus);
    const handleStatisticsUpdate = (stats: HighlightStatistics) => setStatistics(stats);
    const handleHighlight = (highlight: StreamHighlight) => {
      setHighlights(prev => [highlight, ...prev]);
    };
    const handleProgress = (progress: number) => setCompilationProgress(progress);
    const handleCompilation = (compilation: HighlightCompilation) => {
      setCompilations(prev => [compilation, ...prev]);
      setCompilationProgress(0);
    };
    
    service.on('status-changed', handleStatusChange);
    service.on('statistics-updated', handleStatisticsUpdate);
    service.on('highlight-detected', handleHighlight);
    service.on('compilation-progress', handleProgress);
    service.on('compilation-complete', handleCompilation);
    
    setConfig(service.getConfig());
    setHighlightConfig(service.getHighlightConfig());
    setStatus(service.getStatus());
    setStatistics(service.getStatistics());
    setHighlights(service.getHighlights());
    setCompilations(service.getCompilations());
    
    return () => {
      service.off('status-changed', handleStatusChange);
      service.off('statistics-updated', handleStatisticsUpdate);
      service.off('highlight-detected', handleHighlight);
      service.off('compilation-progress', handleProgress);
      service.off('compilation-complete', handleCompilation);
    };
  }, []);
  
  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(updates);
      setConfig(prev => ({ ...prev, ...updates }));
    }
  }, []);
  
  const updateHighlightConfig = useCallback((updates: Partial<HighlightDetectionConfig>) => {
    if (serviceRef.current) {
      serviceRef.current.updateHighlightConfig(updates);
      setHighlightConfig(prev => ({ ...prev, ...updates }));
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
  
  const addManualHighlight = useCallback((highlight: Omit<StreamHighlight, 'id'>): StreamHighlight | null => {
    if (serviceRef.current) {
      const newHighlight = serviceRef.current.addManualHighlight(highlight);
      setHighlights(prev => [newHighlight, ...prev]);
      return newHighlight;
    }
    return null;
  }, []);
  
  const removeHighlight = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.removeHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
    }
  }, []);
  
  const getHighlightsByType = useCallback((type: HighlightType): StreamHighlight[] => {
    if (serviceRef.current) {
      return serviceRef.current.getHighlightsByType(type);
    }
    return [];
  }, []);
  
  const clearHighlights = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearHighlights();
      setHighlights([]);
    }
  }, []);
  
  const createCompilation = useCallback(async (
    title: string,
    description: string,
    highlightIds?: string[]
  ): Promise<HighlightCompilation | null> => {
    if (serviceRef.current) {
      return await serviceRef.current.createCompilation(title, description, highlightIds);
    }
    return null;
  }, []);
  
  const deleteCompilation = useCallback((id: string) => {
    if (serviceRef.current) {
      serviceRef.current.deleteCompilation(id);
      setCompilations(prev => prev.filter(c => c.id !== id));
    }
  }, []);
  
  const resetStatistics = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.resetStatistics();
    }
  }, []);
  
  const isReady = status === HighlightServiceStatus.READY;
  const isProcessing = status === HighlightServiceStatus.PROCESSING || 
                       status === HighlightServiceStatus.COMPILING;
  
  return {
    config,
    highlightConfig,
    status,
    statistics,
    highlights,
    compilations,
    compilationProgress,
    updateConfig,
    updateHighlightConfig,
    initialize,
    shutdown,
    addManualHighlight,
    removeHighlight,
    getHighlightsByType,
    clearHighlights,
    createCompilation,
    deleteCompilation,
    resetStatistics,
    isReady,
    isProcessing,
  };
}

export default useHighlightCompilation;