// ============ AI Feature Types ============

/**
 * Translation Service Status
 */
export enum TranslationServiceStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  READY = 'ready',
  TRANSLATING = 'translating',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
}

/**
 * Supported source languages for translation
 */
export enum SourceLanguage {
  AUTO = 'auto',
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  RUSSIAN = 'ru',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  ARABIC = 'ar',
  HINDI = 'hi',
  POLISH = 'pl',
  DUTCH = 'nl',
  TURKISH = 'tr',
  VIETNAMESE = 'vi',
  THAI = 'th',
  INDONESIAN = 'id',
}

/**
 * Translation mode
 */
export enum TranslationMode {
  REAL_TIME = 'real-time',
  BATCH = 'batch',
  ON_DEMAND = 'on-demand',
  MANUAL = 'manual',
}

/**
 * Translation quality level
 */
export enum TranslationQuality {
  FAST = 'fast',
  BASIC = 'basic',
  BALANCED = 'balanced',
  STANDARD = 'standard',
  HIGH = 'high',
  PREMIUM = 'premium',
}

/**
 * AI Service Provider
 */
export enum AIServiceProvider {
  OPENAI = 'openai',
  DEEPL = 'deepl',
  GOOGLE = 'google',
  AZURE = 'azure',
  LOCAL = 'local',
  CUSTOM = 'custom',
}

/**
 * Recommendation Type
 */
export enum RecommendationType {
  CONTENT = 'content',
  SCHEDULE = 'schedule',
  ENGAGEMENT = 'engagement',
  TECHNICAL = 'technical',
}

/**
 * Highlight Type
 */
export enum HighlightType {
  FUNNY = 'funny',
  SKILL = 'skill',
  EMOTIONAL = 'emotional',
  EPIC = 'epic',
  EDUCATIONAL = 'educational',
}

/**
 * Engagement Suggestion Type
 */
export enum EngagementSuggestionType {
  CHAT = 'chat',
  POLL = 'poll',
  RAID = 'raid',
  SHOUTOUT = 'shoutout',
  INTERACTION = 'interaction',
}

// ============ Configuration Interfaces ============

/**
 * AI Configuration
 */
export interface AIConfig {
  provider: AIServiceProvider;
  apiKey: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
  debug: boolean;
}

/**
 * Translation Configuration
 */
export interface TranslationConfig {
  sourceLanguage: SourceLanguage;
  targetLanguage: SourceLanguage;
  mode: TranslationMode;
  quality: TranslationQuality;
  enabled: boolean;
  autoDetect: boolean;
  cacheTranslations: boolean;
  showOriginal: boolean;
  profanityFilter: boolean;
  cacheTTL: number;
  maxRetries: number;
  timeout: number;
}

/**
 * Translation Result
 */
export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: SourceLanguage;
  targetLanguage: SourceLanguage;
  provider: AIServiceProvider;
  quality?: TranslationQuality;
  timestamp: number;
  processingTime?: number;
  cached: boolean;
  confidence?: number;
}

/**
 * Translation Request
 */
export interface TranslationRequest {
  text: string;
  sourceLanguage?: SourceLanguage;
  targetLanguage: SourceLanguage;
  quality?: TranslationQuality;
  priority?: 'high' | 'normal' | 'low';
  context?: string;
}

/**
 * Translation Statistics
 */
export interface TranslationStatistics {
  totalTranslations: number;
  translationsByLanguage: Record<string, number>;
  averageLatency: number;
  cacheHitRate: number;
  errorRate: number;
  totalCharacters: number;
  lastUpdated: number;
}

/**
 * Translation State
 */
export interface TranslationState {
  status: TranslationServiceStatus;
  isTranslating: boolean;
  recentTranslations: TranslationResult[];
  error?: string | null;
  lastTranslationTime?: number | null;
}

// ============ Default Configurations ============

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: AIServiceProvider.OPENAI,
  apiKey: '',
  endpoint: undefined,
  model: 'gpt-4',
  enabled: true,
  debug: false,
};

export const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
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

// ============ Additional Types for Future Features ============

/**
 * Content Recommendation
 */
export interface ContentRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: RecommendationAction[];
  timestamp: number;
}

/**
 * Recommendation Action
 */
export interface RecommendationAction {
  label: string;
  type: 'button' | 'link' | 'api';
  data?: Record<string, unknown>;
}

/**
 * Stream Highlight
 */
export interface StreamHighlight {
  id: string;
  type: HighlightType;
  timestamp: number;
  duration: number;
  thumbnail?: string;
  description: string;
  score: number;
  tags: string[];
}

/**
 * Engagement Suggestion
 */
export interface EngagementSuggestion {
  id: string;
  type: EngagementSuggestionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  bestTime?: number;
  context?: Record<string, unknown>;
}

/**
 * AI Service Event Types
 */
export interface AIServiceEvents {
  'status-changed': (status: TranslationServiceStatus) => void;
  'translation-complete': (result: TranslationResult) => void;
  'translation-error': (error: Error) => void;
  'statistics-updated': (stats: TranslationStatistics) => void;
  'cache-cleared': () => void;
  'recommendation-available': (recommendation: ContentRecommendation) => void;
  'highlight-detected': (highlight: StreamHighlight) => void;
  'engagement-suggestion': (suggestion: EngagementSuggestion) => void;
}

// ============ Content Recommendation Types ============

/**
 * Content Recommendation Service Status
 */
export enum RecommendationServiceStatus {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Content Analysis Result
 */
export interface ContentAnalysis {
  id: string;
  timestamp: number;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: number;
  peakMoments: PeakMoment[];
  suggestions: ContentRecommendation[];
}

/**
 * Peak Moment in Stream
 */
export interface PeakMoment {
  timestamp: number;
  duration: number;
  type: 'chat_spike' | 'viewer_peak' | 'donation' | 'follow_bomb' | 'hype';
  intensity: number;
  description: string;
}

/**
 * Content Recommendation Config
 */
export interface ContentRecommendationConfig {
  enabled: boolean;
  analysisInterval: number;
  minConfidence: number;
  maxRecommendations: number;
  categories: RecommendationType[];
  autoSuggest: boolean;
}

/**
 * Content Recommendation Statistics
 */
export interface ContentRecommendationStats {
  totalAnalyses: number;
  recommendationsGenerated: number;
  recommendationsApplied: number;
  averageEngagement: number;
  topCategories: Record<string, number>;
  lastAnalysis: number | null;
}

// ============ Highlight Compilation Types ============

/**
 * Highlight Service Status
 */
export enum HighlightServiceStatus {
  IDLE = 'idle',
  SCANNING = 'scanning',
  PROCESSING = 'processing',
  COMPILING = 'compiling',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Highlight Detection Config
 */
export interface HighlightDetectionConfig {
  enabled: boolean;
  autoDetect: boolean;
  minDuration: number;
  maxDuration: number;
  sensitivity: 'low' | 'medium' | 'high';
  types: HighlightType[];
  includeChat: boolean;
  includeAudio: boolean;
  includeVideo: boolean;
}

/**
 * Highlight Compilation
 */
export interface HighlightCompilation {
  id: string;
  title: string;
  description: string;
  highlights: StreamHighlight[];
  totalDuration: number;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnail?: string;
  outputUrl?: string;
}

/**
 * Highlight Statistics
 */
export interface HighlightStatistics {
  totalHighlights: number;
  compilationsCreated: number;
  averageScore: number;
  highlightsByType: Record<string, number>;
  totalDuration: number;
  lastDetection: number | null;
}

// ============ Engagement Suggestion Types ============

/**
 * Engagement Service Status
 */
export enum EngagementServiceStatus {
  IDLE = 'idle',
  MONITORING = 'monitoring',
  ANALYZING = 'analyzing',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Engagement Context
 */
export interface EngagementContext {
  viewerCount: number;
  chatActivity: number;
  recentFollows: number;
  recentSubs: number;
  recentDonations: number;
  streamDuration: number;
  currentGame?: string;
  currentTitle?: string;
}

/**
 * Engagement Config
 */
export interface EngagementConfig {
  enabled: boolean;
  autoSuggest: boolean;
  minInterval: number;
  suggestionTypes: EngagementSuggestionType[];
  chatThreshold: number;
  viewerThreshold: number;
}

/**
 * Engagement Statistics
 */
export interface EngagementStatistics {
  totalSuggestions: number;
  suggestionsApplied: number;
  averageResponseTime: number;
  suggestionsByType: Record<string, number>;
  successRate: number;
  lastSuggestion: number | null;
}

// ============ Default Configurations for Extended Features ============

export const DEFAULT_CONTENT_RECOMMENDATION_CONFIG: ContentRecommendationConfig = {
  enabled: true,
  analysisInterval: 300000, // 5 minutes
  minConfidence: 0.7,
  maxRecommendations: 10,
  categories: [
    RecommendationType.CONTENT,
    RecommendationType.SCHEDULE,
    RecommendationType.ENGAGEMENT,
    RecommendationType.TECHNICAL,
  ],
  autoSuggest: true,
};

export const DEFAULT_HIGHLIGHT_DETECTION_CONFIG: HighlightDetectionConfig = {
  enabled: true,
  autoDetect: true,
  minDuration: 5000, // 5 seconds
  maxDuration: 60000, // 60 seconds
  sensitivity: 'medium',
  types: [
    HighlightType.FUNNY,
    HighlightType.SKILL,
    HighlightType.EMOTIONAL,
    HighlightType.EPIC,
    HighlightType.EDUCATIONAL,
  ],
  includeChat: true,
  includeAudio: true,
  includeVideo: false,
};

export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  enabled: true,
  autoSuggest: true,
  minInterval: 180000, // 3 minutes
  suggestionTypes: [
    EngagementSuggestionType.CHAT,
    EngagementSuggestionType.POLL,
    EngagementSuggestionType.RAID,
    EngagementSuggestionType.SHOUTOUT,
    EngagementSuggestionType.INTERACTION,
  ],
  chatThreshold: 10,
  viewerThreshold: 50,
};