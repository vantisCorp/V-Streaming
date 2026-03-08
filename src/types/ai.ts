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