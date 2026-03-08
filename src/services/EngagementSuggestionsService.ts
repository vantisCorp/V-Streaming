import EventEmitter from 'eventemitter3';
import {
  AIConfig,
  EngagementSuggestion,
  EngagementConfig,
  EngagementStatistics,
  EngagementContext,
  EngagementServiceStatus,
  EngagementSuggestionType,
  DEFAULT_AI_CONFIG,
  DEFAULT_ENGAGEMENT_CONFIG,
} from '../types/ai';

// ============ Event Types ============

interface EngagementSuggestionsEvents {
  'status-changed': (status: EngagementServiceStatus) => void;
  'suggestion-available': (suggestion: EngagementSuggestion) => void;
  'suggestion-applied': (suggestion: EngagementSuggestion) => void;
  'error': (error: Error) => void;
  'statistics-updated': (stats: EngagementStatistics) => void;
}

// ============ Engagement Suggestions Service ============

/**
 * Engagement Suggestions Service
 * 
 * Provides smart audience engagement suggestions based on
 * real-time stream metrics and viewer activity.
 */
export class EngagementSuggestionsService extends EventEmitter<EngagementSuggestionsEvents> {
  private static instance: EngagementSuggestionsService | null = null;
  
  private config: AIConfig;
  private engagementConfig: EngagementConfig;
  private status: EngagementServiceStatus = EngagementServiceStatus.IDLE;
  private statistics: EngagementStatistics;
  private suggestions: EngagementSuggestion[] = [];
  private currentContext: EngagementContext | null = null;
  private storageKey = 'v-streaming-ai-engagement-config';
  private statsKey = 'v-streaming-ai-engagement-stats';
  private suggestionInterval: ReturnType<typeof setInterval> | null = null;
  private lastSuggestionTime: number = 0;
  
  private constructor() {
    super();
    this.config = this.loadConfig();
    this.engagementConfig = this.loadEngagementConfig();
    this.statistics = this.loadStatistics();
  }
  
  static getInstance(): EngagementSuggestionsService {
    if (!EngagementSuggestionsService.instance) {
      EngagementSuggestionsService.instance = new EngagementSuggestionsService();
    }
    return EngagementSuggestionsService.instance;
  }
  
  // ============ Configuration Management ============
  
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load engagement config:', error);
    }
    return { ...DEFAULT_AI_CONFIG };
  }
  
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save engagement config:', error);
    }
  }
  
  private loadEngagementConfig(): EngagementConfig {
    try {
      const stored = localStorage.getItem(`${this.storageKey}-engagement`);
      if (stored) {
        return { ...DEFAULT_ENGAGEMENT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load engagement suggestion config:', error);
    }
    return { ...DEFAULT_ENGAGEMENT_CONFIG };
  }
  
  private saveEngagementConfig(): void {
    try {
      localStorage.setItem(`${this.storageKey}-engagement`, JSON.stringify(this.engagementConfig));
    } catch (error) {
      console.error('Failed to save engagement suggestion config:', error);
    }
  }
  
  private loadStatistics(): EngagementStatistics {
    try {
      const stored = localStorage.getItem(this.statsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load engagement statistics:', error);
    }
    return this.initializeStatistics();
  }
  
  private saveStatistics(): void {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to save engagement statistics:', error);
    }
  }
  
  private initializeStatistics(): EngagementStatistics {
    return {
      totalSuggestions: 0,
      suggestionsApplied: 0,
      averageResponseTime: 0,
      suggestionsByType: {},
      successRate: 0,
      lastSuggestion: null,
    };
  }
  
  getConfig(): AIConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  getEngagementConfig(): EngagementConfig {
    return { ...this.engagementConfig };
  }
  
  updateEngagementConfig(updates: Partial<EngagementConfig>): void {
    this.engagementConfig = { ...this.engagementConfig, ...updates };
    this.saveEngagementConfig();
  }
  
  // ============ Service Control ============
  
  async initialize(): Promise<void> {
    this.updateStatus(EngagementServiceStatus.MONITORING);
    
    try {
      if (!this.config.apiKey && this.config.provider !== 'local') {
        console.warn('API key not set for engagement service');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateStatus(EngagementServiceStatus.READY);
      
      if (this.engagementConfig.autoSuggest) {
        this.startSuggestionMonitoring();
      }
    } catch (error) {
      this.updateStatus(EngagementServiceStatus.ERROR);
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    this.stopSuggestionMonitoring();
    this.updateStatus(EngagementServiceStatus.IDLE);
  }
  
  private updateStatus(status: EngagementServiceStatus): void {
    this.status = status;
    this.emit('status-changed', status);
  }
  
  getStatus(): EngagementServiceStatus {
    return this.status;
  }
  
  // ============ Context Monitoring ============
  
  private startSuggestionMonitoring(): void {
    if (this.suggestionInterval) return;
    
    // Check for engagement opportunities every 30 seconds
    this.suggestionInterval = setInterval(() => {
      this.analyzeContext().catch(console.error);
    }, 30000);
  }
  
  private stopSuggestionMonitoring(): void {
    if (this.suggestionInterval) {
      clearInterval(this.suggestionInterval);
      this.suggestionInterval = null;
    }
  }
  
  updateContext(context: Partial<EngagementContext>): void {
    this.currentContext = {
      viewerCount: 0,
      chatActivity: 0,
      recentFollows: 0,
      recentSubs: 0,
      recentDonations: 0,
      streamDuration: 0,
      ...this.currentContext,
      ...context,
    };
  }
  
  private async analyzeContext(): Promise<void> {
    if (!this.currentContext) return;
    
    // Check if enough time has passed since last suggestion
    const now = Date.now();
    if (now - this.lastSuggestionTime < this.engagementConfig.minInterval) {
      return;
    }
    
    this.updateStatus(EngagementServiceStatus.ANALYZING);
    
    try {
      const suggestion = this.generateSuggestion();
      
      if (suggestion) {
        this.addSuggestion(suggestion);
        this.lastSuggestionTime = now;
      }
      
      this.updateStatus(EngagementServiceStatus.READY);
    } catch (error) {
      this.updateStatus(EngagementServiceStatus.ERROR);
      this.emit('error', error as Error);
    }
  }
  
  private generateSuggestion(): EngagementSuggestion | null {
    if (!this.currentContext) return null;
    
    const ctx = this.currentContext;
    const types = this.engagementConfig.suggestionTypes;
    
    // Generate suggestions based on context
    const possibleSuggestions: Array<{ type: EngagementSuggestionType; title: string; description: string; priority: 'low' | 'medium' | 'high'; condition: boolean }> = [
      {
        type: EngagementSuggestionType.CHAT,
        title: 'Engage with Chat',
        description: 'Chat activity is low. Ask a question or start a discussion to boost engagement.',
        priority: 'high',
        condition: ctx.chatActivity < this.engagementConfig.chatThreshold,
      },
      {
        type: EngagementSuggestionType.POLL,
        title: 'Create a Poll',
        description: 'Viewer count is growing. Run a poll to let them participate in content decisions.',
        priority: 'medium',
        condition: ctx.viewerCount > this.engagementConfig.viewerThreshold && ctx.streamDuration > 600000,
      },
      {
        type: EngagementSuggestionType.RAID,
        title: 'Consider Raiding',
        description: 'Stream is ending soon. Consider raiding another streamer to share the love!',
        priority: 'low',
        condition: ctx.streamDuration > 7200000 && ctx.viewerCount > 10,
      },
      {
        type: EngagementSuggestionType.SHOUTOUT,
        title: 'Shout Out New Followers',
        description: `You've had ${ctx.recentFollows} recent follows! Consider giving them a shoutout.`,
        priority: 'medium',
        condition: ctx.recentFollows >= 3,
      },
      {
        type: EngagementSuggestionType.INTERACTION,
        title: 'Interactive Segment',
        description: 'Time for an interactive segment! Play a game with chat or do a Q&A.',
        priority: 'medium',
        condition: ctx.streamDuration > 1800000 && ctx.chatActivity > this.engagementConfig.chatThreshold,
      },
    ];
    
    // Filter by enabled types and conditions
    const validSuggestions = possibleSuggestions.filter(
      s => types.includes(s.type) && s.condition
    );
    
    if (validSuggestions.length === 0) return null;
    
    // Pick highest priority suggestion
    const sorted = validSuggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    const selected = sorted[0];
    
    return {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: selected.type,
      title: selected.title,
      description: selected.description,
      priority: selected.priority,
      bestTime: Date.now(),
      context: { ...this.currentContext },
    };
  }
  
  private addSuggestion(suggestion: EngagementSuggestion): void {
    this.suggestions.unshift(suggestion);
    
    // Keep last 20 suggestions
    if (this.suggestions.length > 20) {
      this.suggestions.pop();
    }
    
    this.statistics.totalSuggestions++;
    this.statistics.lastSuggestion = Date.now();
    this.statistics.suggestionsByType[suggestion.type] = 
      (this.statistics.suggestionsByType[suggestion.type] || 0) + 1;
    
    this.saveStatistics();
    this.emit('suggestion-available', suggestion);
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Suggestion Management ============
  
  getSuggestions(): EngagementSuggestion[] {
    return [...this.suggestions];
  }
  
  applySuggestion(id: string): void {
    const suggestion = this.suggestions.find(s => s.id === id);
    if (suggestion) {
      this.statistics.suggestionsApplied++;
      
      // Calculate success rate
      this.statistics.successRate = 
        this.statistics.suggestionsApplied / this.statistics.totalSuggestions;
      
      this.suggestions = this.suggestions.filter(s => s.id !== id);
      this.saveStatistics();
      
      this.emit('suggestion-applied', suggestion);
      this.emit('statistics-updated', this.statistics);
    }
  }
  
  dismissSuggestion(id: string): void {
    this.suggestions = this.suggestions.filter(s => s.id !== id);
  }
  
  clearSuggestions(): void {
    this.suggestions = [];
  }
  
  // ============ Manual Trigger ============
  
  async requestSuggestion(): Promise<EngagementSuggestion | null> {
    this.updateStatus(EngagementServiceStatus.ANALYZING);
    
    try {
      // If no context, create a simulated one
      if (!this.currentContext) {
        this.currentContext = {
          viewerCount: 50 + Math.floor(Math.random() * 200),
          chatActivity: 10 + Math.floor(Math.random() * 50),
          recentFollows: Math.floor(Math.random() * 10),
          recentSubs: Math.floor(Math.random() * 3),
          recentDonations: Math.floor(Math.random() * 5),
          streamDuration: 1800000 + Math.random() * 7200000,
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const suggestion = this.generateSuggestion();
      
      if (suggestion) {
        this.addSuggestion(suggestion);
      }
      
      this.updateStatus(EngagementServiceStatus.READY);
      return suggestion;
    } catch (error) {
      this.updateStatus(EngagementServiceStatus.ERROR);
      this.emit('error', error as Error);
      throw error;
    }
  }
  
  // ============ Statistics ============
  
  getStatistics(): EngagementStatistics {
    return { ...this.statistics };
  }
  
  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Utility ============
  
  isReady(): boolean {
    return this.status === EngagementServiceStatus.READY;
  }
  
  getContext(): EngagementContext | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }
}

// Export singleton getter
export const getEngagementSuggestions = (): EngagementSuggestionsService => 
  EngagementSuggestionsService.getInstance();