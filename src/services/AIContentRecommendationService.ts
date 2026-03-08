import EventEmitter from 'eventemitter3';
import {
  AIConfig,
  ContentRecommendation,
  ContentRecommendationConfig,
  ContentRecommendationStats,
  ContentAnalysis,
  PeakMoment,
  RecommendationType,
  RecommendationServiceStatus,
  EngagementContext,
  DEFAULT_AI_CONFIG,
  DEFAULT_CONTENT_RECOMMENDATION_CONFIG,
} from '../types/ai';

// ============ Event Types ============

interface ContentRecommendationEvents {
  'status-changed': (status: RecommendationServiceStatus) => void;
  'analysis-complete': (analysis: ContentAnalysis) => void;
  'recommendation-available': (recommendation: ContentRecommendation) => void;
  'error': (error: Error) => void;
  'statistics-updated': (stats: ContentRecommendationStats) => void;
}

// ============ AI Content Recommendation Service ============

/**
 * AI Content Recommendation Service
 * 
 * Provides AI-powered content recommendations for streamers including
 * content ideas, scheduling suggestions, and engagement tips.
 */
export class AIContentRecommendationService extends EventEmitter<ContentRecommendationEvents> {
  private static instance: AIContentRecommendationService | null = null;
  
  private config: AIConfig;
  private recommendationConfig: ContentRecommendationConfig;
  private status: RecommendationServiceStatus = RecommendationServiceStatus.IDLE;
  private statistics: ContentRecommendationStats;
  private recommendations: ContentRecommendation[] = [];
  private analysisHistory: ContentAnalysis[] = [];
  private storageKey = 'v-streaming-ai-content-recommendation-config';
  private statsKey = 'v-streaming-ai-content-recommendation-stats';
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  
  private constructor() {
    super();
    this.config = this.loadConfig();
    this.recommendationConfig = this.loadRecommendationConfig();
    this.statistics = this.loadStatistics();
  }
  
  static getInstance(): AIContentRecommendationService {
    if (!AIContentRecommendationService.instance) {
      AIContentRecommendationService.instance = new AIContentRecommendationService();
    }
    return AIContentRecommendationService.instance;
  }
  
  // ============ Configuration Management ============
  
  private loadConfig(): AIConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...DEFAULT_AI_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load content recommendation config:', error);
    }
    return { ...DEFAULT_AI_CONFIG };
  }
  
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save content recommendation config:', error);
    }
  }
  
  private loadRecommendationConfig(): ContentRecommendationConfig {
    try {
      const stored = localStorage.getItem(`${this.storageKey}-recommendation`);
      if (stored) {
        return { ...DEFAULT_CONTENT_RECOMMENDATION_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load recommendation config:', error);
    }
    return { ...DEFAULT_CONTENT_RECOMMENDATION_CONFIG };
  }
  
  private saveRecommendationConfig(): void {
    try {
      localStorage.setItem(`${this.storageKey}-recommendation`, JSON.stringify(this.recommendationConfig));
    } catch (error) {
      console.error('Failed to save recommendation config:', error);
    }
  }
  
  private loadStatistics(): ContentRecommendationStats {
    try {
      const stored = localStorage.getItem(this.statsKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load content recommendation statistics:', error);
    }
    return this.initializeStatistics();
  }
  
  private saveStatistics(): void {
    try {
      localStorage.setItem(this.statsKey, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to save content recommendation statistics:', error);
    }
  }
  
  private initializeStatistics(): ContentRecommendationStats {
    return {
      totalAnalyses: 0,
      recommendationsGenerated: 0,
      recommendationsApplied: 0,
      averageEngagement: 0,
      topCategories: {},
      lastAnalysis: null,
    };
  }
  
  getConfig(): AIConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<AIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  getRecommendationConfig(): ContentRecommendationConfig {
    return { ...this.recommendationConfig };
  }
  
  updateRecommendationConfig(updates: Partial<ContentRecommendationConfig>): void {
    this.recommendationConfig = { ...this.recommendationConfig, ...updates };
    this.saveRecommendationConfig();
    
    // Restart analysis if interval changed
    if (updates.analysisInterval && this.analysisInterval) {
      this.stopPeriodicAnalysis();
      this.startPeriodicAnalysis();
    }
  }
  
  // ============ Service Control ============
  
  async initialize(): Promise<void> {
    this.updateStatus(RecommendationServiceStatus.ANALYZING);
    
    try {
      if (!this.config.apiKey && this.config.provider !== 'local') {
        console.warn('API key not set for content recommendation service');
      }
      
      // Simulate initial analysis
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateStatus(RecommendationServiceStatus.READY);
      
      if (this.recommendationConfig.autoSuggest) {
        this.startPeriodicAnalysis();
      }
    } catch (error) {
      this.updateStatus(RecommendationServiceStatus.ERROR);
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    this.stopPeriodicAnalysis();
    this.updateStatus(RecommendationServiceStatus.IDLE);
  }
  
  private updateStatus(status: RecommendationServiceStatus): void {
    this.status = status;
    this.emit('status-changed', status);
  }
  
  getStatus(): RecommendationServiceStatus {
    return this.status;
  }
  
  // ============ Analysis ============
  
  private startPeriodicAnalysis(): void {
    if (this.analysisInterval) return;
    
    this.analysisInterval = setInterval(() => {
      this.performAnalysis().catch(console.error);
    }, this.recommendationConfig.analysisInterval);
  }
  
  private stopPeriodicAnalysis(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }
  
  async performAnalysis(context?: Partial<EngagementContext>): Promise<ContentAnalysis> {
    this.updateStatus(RecommendationServiceStatus.ANALYZING);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const analysis: ContentAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: Date.now(),
        topics: this.generateTopics(),
        sentiment: this.determineSentiment(),
        engagement: 0.7 + Math.random() * 0.25,
        peakMoments: this.generatePeakMoments(),
        suggestions: this.generateRecommendations(),
      };
      
      // Update statistics
      this.statistics.totalAnalyses++;
      this.statistics.lastAnalysis = Date.now();
      this.analysisHistory.unshift(analysis);
      
      if (this.analysisHistory.length > 50) {
        this.analysisHistory.pop();
      }
      
      // Add recommendations
      analysis.suggestions.forEach(rec => {
        this.addRecommendation(rec);
      });
      
      this.saveStatistics();
      this.emit('analysis-complete', analysis);
      this.emit('statistics-updated', this.statistics);
      this.updateStatus(RecommendationServiceStatus.READY);
      
      return analysis;
    } catch (error) {
      this.updateStatus(RecommendationServiceStatus.ERROR);
      this.emit('error', error as Error);
      throw error;
    }
  }
  
  private generateTopics(): string[] {
    const allTopics = [
      'Gaming', 'Music', 'Chat', 'Q&A', 'Tutorial', 'Speedrun',
      'Challenge', 'Collaboration', 'Giveaway', 'Announcement',
    ];
    
    const count = 2 + Math.floor(Math.random() * 3);
    return allTopics.sort(() => Math.random() - 0.5).slice(0, count);
  }
  
  private determineSentiment(): 'positive' | 'neutral' | 'negative' {
    const rand = Math.random();
    if (rand < 0.6) return 'positive';
    if (rand < 0.9) return 'neutral';
    return 'negative';
  }
  
  private generatePeakMoments(): PeakMoment[] {
    const moments: PeakMoment[] = [];
    const types: PeakMoment['type'][] = ['chat_spike', 'viewer_peak', 'donation', 'follow_bomb', 'hype'];
    
    const count = Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      moments.push({
        timestamp: Date.now() - Math.random() * 3600000,
        duration: 10000 + Math.random() * 50000,
        type: types[Math.floor(Math.random() * types.length)],
        intensity: 0.5 + Math.random() * 0.5,
        description: `Peak moment detected during stream`,
      });
    }
    
    return moments;
  }
  
  private generateRecommendations(): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    const types = Object.values(RecommendationType);
    
    const templates: Record<RecommendationType, { title: string; description: string }[]> = {
      [RecommendationType.CONTENT]: [
        { title: 'Try a New Game', description: 'Consider playing a trending game to attract new viewers.' },
        { title: 'Host a Q&A Session', description: 'Engage with your audience through a Q&A segment.' },
        { title: 'Collaborate', description: 'Consider collaborating with another streamer in your niche.' },
      ],
      [RecommendationType.SCHEDULE]: [
        { title: 'Optimize Stream Time', description: 'Your peak viewership is at 8 PM. Consider starting earlier.' },
        { title: 'Add Consistency', description: 'Stream on a consistent schedule to build audience habits.' },
        { title: 'Weekend Stream', description: 'Consider adding a weekend stream for more reach.' },
      ],
      [RecommendationType.ENGAGEMENT]: [
        { title: 'Run a Poll', description: 'Use polls to engage viewers in content decisions.' },
        { title: 'Chat Games', description: 'Add chat games to increase interaction.' },
        { title: 'Shout Out New Followers', description: 'Acknowledge new followers to build community.' },
      ],
      [RecommendationType.TECHNICAL]: [
        { title: 'Improve Audio Quality', description: 'Consider upgrading your microphone setup.' },
        { title: 'Add Overlays', description: 'Add alerts for follows and subscriptions.' },
        { title: 'Backup Setup', description: 'Set up a backup streaming configuration.' },
      ],
    };
    
    const count = 1 + Math.floor(Math.random() * 3);
    const selectedTypes = types.sort(() => Math.random() - 0.5).slice(0, count);
    
    selectedTypes.forEach(type => {
      const templateList = templates[type];
      const template = templateList[Math.floor(Math.random() * templateList.length)];
      
      recommendations.push({
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: template.title,
        description: template.description,
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        actionable: true,
        timestamp: Date.now(),
      });
    });
    
    return recommendations;
  }
  
  // ============ Recommendations Management ============
  
  private addRecommendation(recommendation: ContentRecommendation): void {
    // Check if similar recommendation already exists
    const exists = this.recommendations.some(
      r => r.title === recommendation.title && r.type === recommendation.type
    );
    
    if (!exists) {
      this.recommendations.unshift(recommendation);
      
      // Limit to max recommendations
      if (this.recommendations.length > this.recommendationConfig.maxRecommendations) {
        this.recommendations.pop();
      }
      
      this.statistics.recommendationsGenerated++;
      this.statistics.topCategories[recommendation.type] = 
        (this.statistics.topCategories[recommendation.type] || 0) + 1;
      
      this.emit('recommendation-available', recommendation);
    }
  }
  
  getRecommendations(): ContentRecommendation[] {
    return [...this.recommendations];
  }
  
  applyRecommendation(id: string): void {
    const recommendation = this.recommendations.find(r => r.id === id);
    if (recommendation) {
      this.statistics.recommendationsApplied++;
      this.recommendations = this.recommendations.filter(r => r.id !== id);
      this.saveStatistics();
      this.emit('statistics-updated', this.statistics);
    }
  }
  
  dismissRecommendation(id: string): void {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
  }
  
  clearRecommendations(): void {
    this.recommendations = [];
  }
  
  // ============ Statistics ============
  
  getStatistics(): ContentRecommendationStats {
    return { ...this.statistics };
  }
  
  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.saveStatistics();
    this.emit('statistics-updated', this.statistics);
  }
  
  // ============ Analysis History ============
  
  getAnalysisHistory(): ContentAnalysis[] {
    return [...this.analysisHistory];
  }
  
  // ============ Utility ============
  
  isReady(): boolean {
    return this.status === RecommendationServiceStatus.READY;
  }
}

// Export singleton getter
export const getAIContentRecommendation = (): AIContentRecommendationService => 
  AIContentRecommendationService.getInstance();