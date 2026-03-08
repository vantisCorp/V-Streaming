import EventEmitter from 'eventemitter3';
import {
  AIConfig,
  StreamHighlight,
  HighlightDetectionConfig,
  HighlightStatistics,
  HighlightCompilation,
  HighlightServiceStatus,
  HighlightType,
  DEFAULT_AI_CONFIG,
  DEFAULT_HIGHLIGHT_DETECTION_CONFIG,
} from '../types/ai';

// ============ Event Types ============

interface HighlightCompilationEvents {
  'status-changed': (status: HighlightServiceStatus) => void;
  'highlight-detected': (highlight: StreamHighlight) => void;
  'compilation-progress': (progress: number) => void;
  'compilation-complete': (compilation: HighlightCompilation) => void;
  'error': (error: Error) => void;
  'statistics-updated': (stats: HighlightStatistics) => void;
}

// ============ Highlight Compilation Service ============

/**
 * Highlight Compilation Service
 * 
 * Automatically detects and compiles stream highlights based on
 * chat activity, viewer engagement, and AI analysis.
 */
export class HighlightCompilationService extends EventEmitter<HighlightCompilationEvents> {
  private static instance: HighlightCompilationService | null = null;
  
  private config: AIConfig;
  private highlightConfig: HighlightDetectionConfig;
  private status: HighlightServiceStatus = HighlightServiceStatus.IDLE;
  private statistics: HighlightStatistics;
  private highlights: StreamHighlight[] = [];
  private compilations: HighlightCompilation[] = [];
  private storageKey = 'v-streaming-ai-highlight-config';
  private statsKey = 'v-streaming-ai-highlight-stats';
  private detectionInterval: ReturnType<typeof setInterval> | null = null;
  
  private constructor() {
    super();
    this.config = this.loadConfig();
    this.highlightConfig = this.loadHighlightConfig();
    this.statistics = this.loadStatistics();
  }
  
  static getInstance(): HighlightCompilationService {
    if (!HighlightCompilationService.instance) {
      HighlightCompilationService.instance = new HighlightCompilationService();
    }
    return HighlightCompilationService.instance;
  }
  
  // ============ Configuration Management ============
  
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load highlight config:', error);
    }
    return { ...DEFAULT_AI_CONFIG };
  }
  
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save highlight config:', error);
    }
  }
  
  private loadHighlightConfig(): HighlightDetectionConfig {
    try {
      const stored = localStorage.getItem(`${this.storageKey}-highlight`);
      if (stored) {
        return { ...DEFAULT_HIGHLIGHT_DETECTION_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load highlight detection config:', error);
    }
    return { ...DEFAULT_HIGHLIGHT_DETECTION_CONFIG };
  }
  
  private saveHighlightConfig(): void {
    try {
      localStorage.setItem(`${this.storageKey}-highlight`, JSON.stringify(this.highlightConfig));
    } catch (error) {
      console.error('Failed to save highlight detection config:', error);
    }
  }
  
  private loadStatistics(): HighlightStatistics {
    try {
      const stored = localStorage.getItem(this.statsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load highlight statistics:', error);
    }
    return this.initializeStatistics();
  }
  
  private saveStatistics(): void {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to save highlight statistics:', error);
    }
  }
  
  private initializeStatistics(): HighlightStatistics {
    return {
      totalHighlights: 0,
      compilationsCreated: 0,
      averageScore: 0,
      highlightsByType: {},
      totalDuration: 0,
      lastDetection: null,
    };
  }
  
  getConfig(): AIConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  getHighlightConfig(): HighlightDetectionConfig {
    return { ...this.highlightConfig };
  }
  
  updateHighlightConfig(updates: Partial<HighlightDetectionConfig>): void {
    this.highlightConfig = { ...this.highlightConfig, ...updates };
    this.saveHighlightConfig();
  }
  
  // ============ Service Control ============
  
  async initialize(): Promise<void> {
    this.updateStatus(HighlightServiceStatus.SCANNING);
    
    try {
      if (!this.config.apiKey && this.config.provider !== 'local') {
        console.warn('API key not set for highlight service');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateStatus(HighlightServiceStatus.READY);
      
      if (this.highlightConfig.autoDetect) {
        this.startHighlightDetection();
      }
    } catch (error) {
      this.updateStatus(HighlightServiceStatus.ERROR);
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    this.stopHighlightDetection();
    this.updateStatus(HighlightServiceStatus.IDLE);
  }
  
  private updateStatus(status: HighlightServiceStatus): void {
    this.status = status;
    this.emit('status-changed', status);
  }
  
  getStatus(): HighlightServiceStatus {
    return this.status;
  }
  
  // ============ Highlight Detection ============
  
  private startHighlightDetection(): void {
    if (this.detectionInterval) return;
    
    // Check for highlights every 30 seconds
    this.detectionInterval = setInterval(() => {
      this.scanForHighlights().catch(console.error);
    }, 30000);
  }
  
  private stopHighlightDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }
  
  private async scanForHighlights(): Promise<void> {
    this.updateStatus(HighlightServiceStatus.SCANNING);
    
    try {
      // Simulate highlight detection based on stream metrics
      if (Math.random() > 0.7) {
        const highlight = this.detectHighlight();
        if (highlight) {
          this.addHighlight(highlight);
        }
      }
      
      this.updateStatus(HighlightServiceStatus.READY);
    } catch (error) {
      this.updateStatus(HighlightServiceStatus.ERROR);
      this.emit('error', error as Error);
    }
  }
  
  private detectHighlight(): StreamHighlight | null {
    const types = this.highlightConfig.types;
    if (types.length === 0) return null;
    
    const type = types[Math.floor(Math.random() * types.length)];
    const score = 0.6 + Math.random() * 0.4;
    
    // Check against confidence threshold
    const sensitivityThreshold = {
      low: 0.9,
      medium: 0.75,
      high: 0.6,
    };
    
    if (score < sensitivityThreshold[this.highlightConfig.sensitivity]) {
      return null;
    }
    
    const descriptions: Record<HighlightType, string[]> = {
      [HighlightType.FUNNY]: [
        'Hilarious moment with chat reactions',
        'Comedy gold moment',
        'Chat went wild with laughter',
      ],
      [HighlightType.SKILL]: [
        'Insane play demonstrated',
        'Pro-level gameplay moment',
        'Incredible skill shown',
      ],
      [HighlightType.EMOTIONAL]: [
        'Touching moment with community',
        'Heartwarming interaction',
        'Emotional community moment',
      ],
      [HighlightType.EPIC]: [
        'Epic clutch moment',
        'Unbelievable sequence',
        'Movie-quality moment',
      ],
      [HighlightType.EDUCATIONAL]: [
        'Great explanation of mechanics',
        'Helpful tips shared',
        'Informative segment',
      ],
    };
    
    const descList = descriptions[type];
    const description = descList[Math.floor(Math.random() * descList.length)];
    
    return {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      duration: this.highlightConfig.minDuration + Math.random() * (this.highlightConfig.maxDuration - this.highlightConfig.minDuration),
      description,
      score,
      tags: [type, 'auto-detected'],
    };
  }
  
  private addHighlight(highlight: StreamHighlight): void {
    this.highlights.unshift(highlight);
    
    // Keep last 100 highlights
    if (this.highlights.length > 100) {
      this.highlights.pop();
    }
    
    // Update statistics
    this.statistics.totalHighlights++;
    this.statistics.lastDetection = Date.now();
    this.statistics.totalDuration += highlight.duration;
    this.statistics.highlightsByType[highlight.type] = 
      (this.statistics.highlightsByType[highlight.type] || 0) + 1;
    
    // Recalculate average score
    const totalScore = this.highlights.reduce((sum, h) => sum + h.score, 0);
    this.statistics.averageScore = totalScore / this.highlights.length;
    
    this.saveStatistics();
    this.emit('highlight-detected', highlight);
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Manual Highlight Management ============
  
  addManualHighlight(highlight: Omit<StreamHighlight, 'id'>): StreamHighlight {
    const newHighlight: StreamHighlight = {
      ...highlight,
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tags: [...highlight.tags, 'manual'],
    };
    
    this.addHighlight(newHighlight);
    return newHighlight;
  }
  
  removeHighlight(id: string): void {
    const highlight = this.highlights.find(h => h.id === id);
    if (highlight) {
      this.statistics.totalDuration -= highlight.duration;
      this.highlights = this.highlights.filter(h => h.id !== id);
      this.saveStatistics();
      this.emit('statistics-updated', this.statistics);
    }
  }
  
  getHighlights(): StreamHighlight[] {
    return [...this.highlights];
  }
  
  getHighlightsByType(type: HighlightType): StreamHighlight[] {
    return this.highlights.filter(h => h.type === type);
  }
  
  clearHighlights(): void {
    this.highlights = [];
    this.statistics.totalDuration = 0;
    this.statistics.totalHighlights = 0;
    this.statistics.highlightsByType = {};
    this.statistics.averageScore = 0;
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Compilation ============
  
  async createCompilation(
    title: string,
    description: string,
    highlightIds?: string[]
  ): Promise<HighlightCompilation> {
    this.updateStatus(HighlightServiceStatus.COMPILING);
    
    try {
      // Select highlights for compilation
      const selectedHighlights = highlightIds
        ? this.highlights.filter(h => highlightIds.includes(h.id))
        : this.highlights.slice(0, 10);
      
      // Sort by score
      selectedHighlights.sort((a, b) => b.score - a.score);
      
      const compilation: HighlightCompilation = {
        id: `compilation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        highlights: selectedHighlights,
        totalDuration: selectedHighlights.reduce((sum, h) => sum + h.duration, 0),
        createdAt: Date.now(),
        status: 'processing',
      };
      
      this.compilations.unshift(compilation);
      
      // Simulate processing
      this.emit('compilation-progress', 0);
      
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        this.emit('compilation-progress', i * 10);
      }
      
      compilation.status = 'completed';
      compilation.outputUrl = `https://example.com/compilations/${compilation.id}.mp4`;
      
      this.statistics.compilationsCreated++;
      this.saveStatistics();
      
      this.emit('compilation-complete', compilation);
      this.emit('statistics-updated', this.statistics);
      this.updateStatus(HighlightServiceStatus.READY);
      
      return compilation;
    } catch (error) {
      this.updateStatus(HighlightServiceStatus.ERROR);
      this.emit('error', error as Error);
      throw error;
    }
  }
  
  getCompilations(): HighlightCompilation[] {
    return [...this.compilations];
  }
  
  deleteCompilation(id: string): void {
    this.compilations = this.compilations.filter(c => c.id !== id);
  }
  
  // ============ Statistics ============
  
  getStatistics(): HighlightStatistics {
    return { ...this.statistics };
  }
  
  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Utility ============
  
  isReady(): boolean {
    return this.status === HighlightServiceStatus.READY;
  }
  
  isProcessing(): boolean {
    return this.status === HighlightServiceStatus.PROCESSING || 
           this.status === HighlightServiceStatus.COMPILING;
  }
}

// Export singleton getter
export const getHighlightCompilation = (): HighlightCompilationService => 
  HighlightCompilationService.getInstance();