import React, { useState, useEffect, useCallback } from 'react';
import { useAITranslation } from '../hooks/useAITranslation';
import {
  SourceLanguage,
  TranslationServiceStatus,
  TranslationMode,
  TranslationQuality,
  AIServiceProvider,
} from '../types/ai';
import './AITranslation.css';

interface AITranslationProps {
  onClose?: () => void;
}

const LANGUAGE_NAMES: Record<string, string> = {
  [SourceLanguage.AUTO]: 'Auto-detect',
  [SourceLanguage.ENGLISH]: 'English',
  [SourceLanguage.SPANISH]: 'Spanish',
  [SourceLanguage.FRENCH]: 'French',
  [SourceLanguage.GERMAN]: 'German',
  [SourceLanguage.ITALIAN]: 'Italian',
  [SourceLanguage.PORTUGUESE]: 'Portuguese',
  [SourceLanguage.RUSSIAN]: 'Russian',
  [SourceLanguage.JAPANESE]: 'Japanese',
  [SourceLanguage.KOREAN]: 'Korean',
  [SourceLanguage.CHINESE_SIMPLIFIED]: 'Chinese (Simplified)',
  [SourceLanguage.CHINESE_TRADITIONAL]: 'Chinese (Traditional)',
  [SourceLanguage.ARABIC]: 'Arabic',
  [SourceLanguage.HINDI]: 'Hindi',
  [SourceLanguage.POLISH]: 'Polish',
  [SourceLanguage.DUTCH]: 'Dutch',
  [SourceLanguage.TURKISH]: 'Turkish',
  [SourceLanguage.VIETNAMESE]: 'Vietnamese',
  [SourceLanguage.THAI]: 'Thai',
  [SourceLanguage.INDONESIAN]: 'Indonesian',
};

const PROVIDER_NAMES: Record<string, string> = {
  [AIServiceProvider.OPENAI]: 'OpenAI',
  [AIServiceProvider.DEEPL]: 'DeepL',
  [AIServiceProvider.GOOGLE]: 'Google Translate',
  [AIServiceProvider.AZURE]: 'Azure Translator',
  [AIServiceProvider.LOCAL]: 'Local Model',
  [AIServiceProvider.CUSTOM]: 'Custom API',
};

type TabType = 'translate' | 'languages' | 'settings' | 'statistics';

export const AITranslation: React.FC<AITranslationProps> = ({ onClose }) => {
  const {
    config,
    translationConfig,
    state,
    statistics,
    updateConfig,
    updateTranslationConfig,
    initialize,
    shutdown,
    translate,
    clearCache,
    getCacheSize,
    resetStatistics,
    getSupportedLanguages,
    isReady,
  } = useAITranslation();

  const [activeTab, setActiveTab] = useState<TabType>('translate');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<SourceLanguage>(SourceLanguage.AUTO);
  const [targetLang, setTargetLang] = useState<SourceLanguage>(SourceLanguage.ENGLISH);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initialize().catch(console.error);
    return () => {
      shutdown().catch(console.error);
    };
  }, [initialize, shutdown]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    setError(null);
    
    try {
      const result = await translate({
        text: inputText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      if (result) {
        setTranslatedText(result.translatedText);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, sourceLang, targetLang, translate]);

  const handleClear = useCallback(() => {
    setInputText('');
    setTranslatedText('');
    setError(null);
  }, []);

  const getStatusBadgeClass = (status: TranslationServiceStatus) => {
    switch (status) {
      case TranslationServiceStatus.READY:
        return 'status-badge ready';
      case TranslationServiceStatus.TRANSLATING:
        return 'status-badge translating';
      case TranslationServiceStatus.ERROR:
        return 'status-badge error';
      default:
        return 'status-badge idle';
    }
  };

  const renderTranslateTab = () => (
    <div className="translate-tab">
      <div className="language-selectors">
        <div className="language-selector">
          <label>Source Language</label>
          <select 
            value={sourceLang} 
            onChange={(e) => setSourceLang(e.target.value as SourceLanguage)}
          >
            {getSupportedLanguages().map(lang => (
              <option key={lang} value={lang}>
                {LANGUAGE_NAMES[lang] || lang}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="swap-languages-btn"
          onClick={() => {
            if (sourceLang !== SourceLanguage.AUTO) {
              const temp = sourceLang;
              setSourceLang(targetLang);
              setTargetLang(temp);
            }
          }}
          disabled={sourceLang === SourceLanguage.AUTO}
        >
          ⇄
        </button>
        
        <div className="language-selector">
          <label>Target Language</label>
          <select 
            value={targetLang} 
            onChange={(e) => setTargetLang(e.target.value as SourceLanguage)}
          >
            {getSupportedLanguages()
              .filter(lang => lang !== SourceLanguage.AUTO)
              .map(lang => (
                <option key={lang} value={lang}>
                  {LANGUAGE_NAMES[lang] || lang}
                </option>
              ))}
          </select>
        </div>
      </div>
      
      <div className="translation-area">
        <div className="input-section">
          <textarea
            placeholder="Enter text to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />
          <div className="char-count">{inputText.length} characters</div>
        </div>
        
        <div className="translation-actions">
          <button 
            className="translate-btn"
            onClick={handleTranslate}
            disabled={!inputText.trim() || isTranslating || !isReady}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </button>
          <button className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
        
        <div className="output-section">
          <textarea
            placeholder="Translation will appear here..."
            value={translatedText}
            readOnly
            rows={6}
          />
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
      
      <div className="recent-translations">
        <h4>Recent Translations</h4>
        {state.recentTranslations.length === 0 ? (
          <p className="no-data">No recent translations</p>
        ) : (
          <div className="translations-list">
            {state.recentTranslations.slice(0, 5).map((t, i) => (
              <div key={i} className="translation-item">
                <div className="translation-original">{t.originalText}</div>
                <div className="translation-result">{t.translatedText}</div>
                <div className="translation-meta">
                  {LANGUAGE_NAMES[t.sourceLanguage]} → {LANGUAGE_NAMES[t.targetLanguage]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLanguagesTab = () => (
    <div className="languages-tab">
      <h4>Supported Languages</h4>
      <div className="languages-grid">
        {getSupportedLanguages()
          .filter(lang => lang !== SourceLanguage.AUTO)
          .map(lang => (
            <div key={lang} className="language-card">
              <span className="language-code">{lang.toUpperCase()}</span>
              <span className="language-name">{LANGUAGE_NAMES[lang] || lang}</span>
            </div>
          ))}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="settings-tab">
      <div className="settings-section">
        <h4>Service Configuration</h4>
        
        <div className="setting-item">
          <label>Translation Provider</label>
          <select 
            value={config.provider}
            onChange={(e) => updateConfig({ provider: e.target.value as AIServiceProvider })}
          >
            {Object.values(AIServiceProvider).map(provider => (
              <option key={provider} value={provider}>
                {PROVIDER_NAMES[provider] || provider}
              </option>
            ))}
          </select>
        </div>
        
        <div className="setting-item">
          <label>API Key</label>
          <input 
            type="password"
            placeholder="Enter API key..."
            value={config.apiKey || ''}
            onChange={(e) => updateConfig({ apiKey: e.target.value })}
          />
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Translation Settings</h4>
        
        <div className="setting-item">
          <label>Translation Mode</label>
          <select 
            value={translationConfig.mode}
            onChange={(e) => updateTranslationConfig({ mode: e.target.value as TranslationMode })}
          >
            <option value={TranslationMode.REAL_TIME}>Real-time</option>
            <option value={TranslationMode.ON_DEMAND}>On-demand</option>
            <option value={TranslationMode.BATCH}>Batch</option>
          </select>
        </div>
        
        <div className="setting-item">
          <label>Quality Level</label>
          <select 
            value={translationConfig.quality}
            onChange={(e) => updateTranslationConfig({ quality: e.target.value as TranslationQuality })}
          >
            <option value={TranslationQuality.BASIC}>Basic (Fast)</option>
            <option value={TranslationQuality.STANDARD}>Standard</option>
            <option value={TranslationQuality.PREMIUM}>Premium (Best)</option>
          </select>
        </div>
        
        <div className="setting-item checkbox">
          <input 
            type="checkbox"
            checked={translationConfig.autoDetect}
            onChange={(e) => updateTranslationConfig({ autoDetect: e.target.checked })}
          />
          <label>Auto-detect source language</label>
        </div>
        
        <div className="setting-item checkbox">
          <input 
            type="checkbox"
            checked={translationConfig.showOriginal}
            onChange={(e) => updateTranslationConfig({ showOriginal: e.target.checked })}
          />
          <label>Show original text</label>
        </div>
        
        <div className="setting-item checkbox">
          <input 
            type="checkbox"
            checked={translationConfig.cacheTranslations}
            onChange={(e) => updateTranslationConfig({ cacheTranslations: e.target.checked })}
          />
          <label>Cache translations</label>
        </div>
        
        <div className="setting-item checkbox">
          <input 
            type="checkbox"
            checked={translationConfig.profanityFilter}
            onChange={(e) => updateTranslationConfig({ profanityFilter: e.target.checked })}
          />
          <label>Profanity filter</label>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Cache Management</h4>
        <div className="cache-info">
          <span>Cached translations: {getCacheSize()}</span>
          <button className="clear-cache-btn" onClick={clearCache}>
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="statistics-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{statistics.totalTranslations}</span>
          <span className="stat-label">Total Translations</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-value">{statistics.totalCharacters.toLocaleString()}</span>
          <span className="stat-label">Characters Translated</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-value">{statistics.averageLatency.toFixed(0)}ms</span>
          <span className="stat-label">Average Latency</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-value">{(statistics.cacheHitRate * 100).toFixed(1)}%</span>
          <span className="stat-label">Cache Hit Rate</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-value">{(statistics.errorRate * 100).toFixed(1)}%</span>
          <span className="stat-label">Error Rate</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-value">{getCacheSize()}</span>
          <span className="stat-label">Cached Items</span>
        </div>
      </div>
      
      <div className="stats-languages">
        <h4>Translations by Language</h4>
        {Object.keys(statistics.translationsByLanguage).length === 0 ? (
          <p className="no-data">No translation data yet</p>
        ) : (
          <div className="language-stats">
            {Object.entries(statistics.translationsByLanguage).map(([lang, count]) => (
              <div key={lang} className="language-stat">
                <span className="lang-name">{LANGUAGE_NAMES[lang] || lang}</span>
                <div className="lang-bar">
                  <div 
                    className="lang-bar-fill"
                    style={{ 
                      width: `${(count / statistics.totalTranslations) * 100}%` 
                    }}
                  />
                </div>
                <span className="lang-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button className="reset-stats-btn" onClick={resetStatistics}>
        Reset Statistics
      </button>
    </div>
  );

  return (
    <div className="ai-translation-container">
      <div className="ai-translation-header">
        <h2>🌐 AI Translation</h2>
        <div className="header-info">
          <span className={getStatusBadgeClass(state.status)}>
            {state.status}
          </span>
          <span className="provider-info">
            {PROVIDER_NAMES[config.provider] || config.provider}
          </span>
        </div>
      </div>
      
      <div className="ai-translation-tabs">
        <button 
          className={`tab-btn ${activeTab === 'translate' ? 'active' : ''}`}
          onClick={() => setActiveTab('translate')}
        >
          Translate
        </button>
        <button 
          className={`tab-btn ${activeTab === 'languages' ? 'active' : ''}`}
          onClick={() => setActiveTab('languages')}
        >
          Languages
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </div>
      
      <div className="ai-translation-content">
        {activeTab === 'translate' && renderTranslateTab()}
        {activeTab === 'languages' && renderLanguagesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'statistics' && renderStatisticsTab()}
      </div>
    </div>
  );
};

export default AITranslation;