import EventEmitter from 'eventemitter3';
import {
  AIConfig,
  TranslationConfig,
  TranslationResult,
  TranslationRequest,
  TranslationStatistics,
  TranslationState,
  TranslationServiceStatus,
  SourceLanguage,
  TranslationMode,
  TranslationQuality,
  AIServiceProvider,
  DEFAULT_AI_CONFIG,
  DEFAULT_TRANSLATION_CONFIG,
} from '../types/ai';

// ============ Event Types ============

interface AITranslationEvents {
  'status-changed': (status: TranslationServiceStatus) => void;
  'translation-complete': (result: TranslationResult) => void;
  'translation-error': (error: Error) => void;
  'statistics-updated': (stats: TranslationStatistics) => void;
  'cache-cleared': () => void;
}

// ============ Translation Cache Entry ============

interface CacheEntry {
  result: TranslationResult;
  timestamp: number;
  hits: number;
}

// ============ AI Translation Service ============

/**
 * AI Translation Service
 * 
 * Provides real-time translation capabilities for chat messages,
 * stream titles, and other text content using various AI providers.
 */
export class AITranslationService extends EventEmitter<AITranslationEvents> {
  private static instance: AITranslationService | null = null;
  
  private config: AIConfig;
  private translationConfig: TranslationConfig;
  private state: TranslationState;
  private statistics: TranslationStatistics;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: TranslationRequest[] = [];
  private isProcessing: boolean = false;
  private storageKey = 'v-streaming-ai-translation-config';
  private statsKey = 'v-streaming-ai-translation-stats';
  
  private constructor() {
    super();
    this.config = this.loadConfig();
    this.translationConfig = this.loadTranslationConfig();
    this.state = this.initializeState();
    this.statistics = this.loadStatistics();
  }
  
  static getInstance(): AITranslationService {
    if (!AITranslationService.instance) {
      AITranslationService.instance = new AITranslationService();
    }
    return AITranslationService.instance;
  }
  
  // ============ Configuration Management ============
  
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_AI_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load AI translation config:', error);
    }
    return { ...DEFAULT_AI_CONFIG };
  }
  
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save AI translation config:', error);
    }
  }
  
  private loadTranslationConfig(): TranslationConfig {
    try {
      const stored = localStorage.getItem(`${this.storageKey}-translation`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_TRANSLATION_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load translation config:', error);
    }
    return { ...DEFAULT_TRANSLATION_CONFIG };
  }
  
  private saveTranslationConfig(): void {
    try {
      localStorage.setItem(`${this.storageKey}-translation`, JSON.stringify(this.translationConfig));
    } catch (error) {
      console.error('Failed to save translation config:', error);
    }
  }
  
  private loadStatistics(): TranslationStatistics {
    try {
      const stored = localStorage.getItem(this.statsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load translation statistics:', error);
    }
    return this.initializeStatistics();
  }
  
  private saveStatistics(): void {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to save translation statistics:', error);
    }
  }
  
  getConfig(): AIConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  getTranslationConfig(): TranslationConfig {
    return { ...this.translationConfig };
  }
  
  updateTranslationConfig(updates: Partial<TranslationConfig>): void {
    this.translationConfig = { ...this.translationConfig, ...updates };
    this.saveTranslationConfig();
  }
  
  // ============ State Management ============
  
  private initializeState(): TranslationState {
    return {
      status: TranslationServiceStatus.IDLE,
      isTranslating: false,
      recentTranslations: [],
    };
  }
  
  private initializeStatistics(): TranslationStatistics {
    return {
      totalTranslations: 0,
      translationsByLanguage: {},
      averageLatency: 0,
      cacheHitRate: 0,
      errorRate: 0,
      totalCharacters: 0,
      lastUpdated: Date.now(),
    };
  }
  
  getState(): TranslationState {
    return { ...this.state };
  }
  
  getStatus(): TranslationServiceStatus {
    return this.state.status;
  }
  
  // ============ Service Control ============
  
  async initialize(): Promise<void> {
    this.updateStatus(TranslationServiceStatus.CONNECTING);
    
    try {
      // Validate API configuration
      if (!this.config.apiKey && this.config.provider !== AIServiceProvider.LOCAL) {
        throw new Error('API key required for translation service');
      }
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateStatus(TranslationServiceStatus.READY);
    } catch (error) {
      this.state.error = (error as Error).message;
      this.updateStatus(TranslationServiceStatus.ERROR);
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    this.updateStatus(TranslationServiceStatus.IDLE);
    this.requestQueue = [];
    this.isProcessing = false;
  }
  
  private updateStatus(status: TranslationServiceStatus): void {
    this.state.status = status;
    this.emit('status-changed', status);
  }
  
  // ============ Translation ============
  
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    // Check if translation is enabled
    if (!this.translationConfig.enabled) {
      throw new Error('Translation service is disabled');
    }
    
    // Determine source language
    const sourceLanguage = request.sourceLanguage || 
      (this.translationConfig.autoDetect ? SourceLanguage.AUTO : this.translationConfig.sourceLanguage);
    
    // Check cache first
    if (this.translationConfig.cacheTranslations) {
      const cacheKey = this.getCacheKey(request.text, sourceLanguage, request.targetLanguage);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        cached.hits++;
        this.updateStatistics(0, true);
        this.emit('translation-complete', cached.result);
        return cached.result;
      }
    }
    
    // Add to queue
    this.requestQueue.push({
      ...request,
      sourceLanguage,
      priority: request.priority || 'normal',
    });
    
    // Process queue
    this.processQueue();
    
    // Wait for result
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.state.recentTranslations.find(
          t => t.originalText === request.text && t.targetLanguage === request.targetLanguage
        );
        
        if (result) {
          resolve(result);
        } else if (this.state.error) {
          reject(new Error(this.state.error));
        } else {
          setTimeout(checkResult, 100);
        }
      };
      
      checkResult();
    });
  }
  
  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.translate(request);
        results.push(result);
      } catch (error) {
        console.error('Translation failed for batch item:', error);
      }
    }
    
    return results;
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    this.updateStatus(TranslationServiceStatus.TRANSLATING);
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      
      try {
        const startTime = Date.now();
        
        // Simulate translation (in real implementation, call AI API)
        const result = await this.performTranslation(request);
        
        const latency = Date.now() - startTime;
        this.updateStatistics(latency, false);
        
        // Add to recent translations
        this.state.recentTranslations.unshift(result);
        if (this.state.recentTranslations.length > 100) {
          this.state.recentTranslations.pop();
        }
        
        // Cache result
        if (this.translationConfig.cacheTranslations) {
          const cacheKey = this.getCacheKey(
            request.text, 
            request.sourceLanguage || SourceLanguage.AUTO, 
            request.targetLanguage
          );
          this.cache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            hits: 0,
          });
        }
        
        this.emit('translation-complete', result);
        
      } catch (error) {
        this.state.error = (error as Error).message;
        this.emit('translation-error', error as Error);
        this.updateStatistics(0, false, true);
      }
    }
    
    this.isProcessing = false;
    this.updateStatus(TranslationServiceStatus.READY);
  }
  
  private async performTranslation(request: TranslationRequest): Promise<TranslationResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate translation based on provider
    const translatedText = this.simulateTranslation(request.text, request.targetLanguage);
    
    // Detect source language if auto
    const sourceLanguage = request.sourceLanguage === SourceLanguage.AUTO
      ? this.detectLanguage(request.text)
      : request.sourceLanguage || this.translationConfig.sourceLanguage;
    
    return {
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText: request.text,
      translatedText,
      sourceLanguage,
      targetLanguage: request.targetLanguage,
      confidence: 0.85 + Math.random() * 0.14,
      provider: this.config.provider,
      timestamp: Date.now(),
      cached: false,
    };
  }
  
  private simulateTranslation(text: string, targetLang: SourceLanguage): string {
    // Simple simulation - in real implementation, call actual translation API
    const prefixes: Record<string, string> = {
      [SourceLanguage.SPANISH]: '[ES] ',
      [SourceLanguage.FRENCH]: '[FR] ',
      [SourceLanguage.GERMAN]: '[DE] ',
      [SourceLanguage.ITALIAN]: '[IT] ',
      [SourceLanguage.PORTUGUESE]: '[PT] ',
      [SourceLanguage.JAPANESE]: '[JA] ',
      [SourceLanguage.KOREAN]: '[KO] ',
      [SourceLanguage.CHINESE_SIMPLIFIED]: '[ZH-CN] ',
      [SourceLanguage.POLISH]: '[PL] ',
    };
    
    const prefix = prefixes[targetLang] || `[${targetLang}] `;
    return `${prefix}${text}`;
  }
  
  private detectLanguage(text: string): SourceLanguage {
    // Simple language detection simulation
    const patterns: [RegExp, SourceLanguage][] = [
      [/[\u4e00-\u9fff]/, SourceLanguage.CHINESE_SIMPLIFIED],
      [/[\u3040-\u309f\u30a0-\u30ff]/, SourceLanguage.JAPANESE],
      [/[\uac00-\ud7af]/, SourceLanguage.KOREAN],
      [/[àáâãäåæçèéêëìíîïñòóôõöùúûü]/i, SourceLanguage.FRENCH],
      [/[äöüß]/i, SourceLanguage.GERMAN],
      [/[ąćęłńóśźż]/i, SourceLanguage.POLISH],
    ];
    
    for (const [pattern, lang] of patterns) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    return SourceLanguage.ENGLISH;
  }
  
  // ============ Cache Management ============
  
  private getCacheKey(text: string, sourceLang: SourceLanguage, targetLang: SourceLanguage): string {
    return `${sourceLang}:${targetLang}:${text}`;
  }
  
  clearCache(): void {
    this.cache.clear();
    this.emit('cache-cleared');
  }
  
  getCacheSize(): number {
    return this.cache.size;
  }
  
  // ============ Statistics ============
  
  private updateStatistics(latency: number, cacheHit: boolean, error: boolean = false): void {
    this.statistics.totalTranslations++;
    this.statistics.totalCharacters += latency;
    this.statistics.lastUpdated = Date.now();
    
    if (cacheHit) {
      const hits = this.statistics.cacheHitRate * (this.statistics.totalTranslations - 1) + 1;
      this.statistics.cacheHitRate = hits / this.statistics.totalTranslations;
    }
    
    if (error) {
      const errors = this.statistics.errorRate * (this.statistics.totalTranslations - 1) + 1;
      this.statistics.errorRate = errors / this.statistics.totalTranslations;
    }
    
    if (latency > 0) {
      const total = this.statistics.averageLatency * (this.statistics.totalTranslations - 1) + latency;
      this.statistics.averageLatency = total / this.statistics.totalTranslations;
    }
    
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  getStatistics(): TranslationStatistics {
    return { ...this.statistics };
  }
  
  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Utility ============
  
  getSupportedLanguages(): SourceLanguage[] {
    return Object.values(SourceLanguage);
  }
  
  isReady(): boolean {
    return this.state.status === TranslationServiceStatus.READY;
  }
  
  isTranslating(): boolean {
    return this.state.isTranslating;
  }
}

// Export singleton getter
export const getAITranslation = (): AITranslationService => AITranslationService.getInstance();