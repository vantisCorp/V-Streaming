import React, { useState, useEffect } from 'react';
import { useAITranslation } from '../hooks/useAITranslation';
import { useContentRecommendations } from '../hooks/useContentRecommendations';
import { useHighlightCompilation } from '../hooks/useHighlightCompilation';
import { useEngagementSuggestions } from '../hooks/useEngagementSuggestions';
import {
  RecommendationType,
  HighlightType,
  EngagementSuggestionType,
  SourceLanguage,
} from '../types/ai';
import './AIFeatures.css';

interface AIFeaturesProps {
  onClose?: () => void;
}

type TabType = 'translation' | 'recommendations' | 'highlights' | 'engagement';

const RECOMMENDATION_TYPE_NAMES: Record<string, string> = {
  [RecommendationType.CONTENT]: 'Content',
  [RecommendationType.SCHEDULE]: 'Schedule',
  [RecommendationType.ENGAGEMENT]: 'Engagement',
  [RecommendationType.TECHNICAL]: 'Technical',
};

const HIGHLIGHT_TYPE_NAMES: Record<string, string> = {
  [HighlightType.FUNNY]: 'Funny',
  [HighlightType.SKILL]: 'Skill',
  [HighlightType.EMOTIONAL]: 'Emotional',
  [HighlightType.EPIC]: 'Epic',
  [HighlightType.EDUCATIONAL]: 'Educational',
};

const ENGAGEMENT_TYPE_NAMES: Record<string, string> = {
  [EngagementSuggestionType.CHAT]: 'Chat',
  [EngagementSuggestionType.POLL]: 'Poll',
  [EngagementSuggestionType.RAID]: 'Raid',
  [EngagementSuggestionType.SHOUTOUT]: 'Shoutout',
  [EngagementSuggestionType.INTERACTION]: 'Interaction',
};

export const AIFeatures: React.FC<AIFeaturesProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('translation');
  
  // Translation hook
  const translation = useAITranslation();
  
  // Content recommendations hook
  const recommendations = useContentRecommendations();
  
  // Highlight compilation hook
  const highlights = useHighlightCompilation();
  
  // Engagement suggestions hook
  const engagement = useEngagementSuggestions();
  
  // Translation state
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Initialize services
  useEffect(() => {
    translation.initialize().catch(console.error);
    recommendations.initialize().catch(console.error);
    highlights.initialize().catch(console.error);
    engagement.initialize().catch(console.error);
    
    return () => {
      translation.shutdown().catch(console.error);
      recommendations.shutdown().catch(console.error);
      highlights.shutdown().catch(console.error);
      engagement.shutdown().catch(console.error);
    };
  }, []);
  
  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setIsTranslating(true);
    try {
      const result = await translation.translate({
        text: inputText,
        targetLanguage: SourceLanguage.ENGLISH,
      });
      if (result) {
        setTranslatedText(result.translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  const renderTranslationTab = () => (
    <div className="ai-tab-content">
      <div className="translation-section">
        <h3>🌐 Real-time Translation</h3>
        <div className="translation-status">
          Status: <span className={`status ${translation.state.status}`}>{translation.state.status}</span>
        </div>
        
        <div className="translation-input">
          <textarea
            placeholder="Enter text to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
          />
          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={!inputText.trim() || isTranslating}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </button>
        </div>
        
        {translatedText && (
          <div className="translation-result">
            <h4>Translation:</h4>
            <p>{translatedText}</p>
          </div>
        )}
        
        <div className="translation-stats">
          <h4>Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{translation.statistics.totalTranslations}</span>
              <span className="stat-label">Total Translations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{(translation.statistics.cacheHitRate * 100).toFixed(1)}%</span>
              <span className="stat-label">Cache Hit Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderRecommendationsTab = () => (
    <div className="ai-tab-content">
      <div className="recommendations-section">
        <h3>💡 Content Recommendations</h3>
        <div className="section-header">
          <button
            className="action-btn"
            onClick={() => recommendations.performAnalysis()}
            disabled={recommendations.isAnalyzing}
          >
            {recommendations.isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
        
        <div className="recommendations-list">
          {recommendations.recommendations.length === 0 ? (
            <p className="no-data">No recommendations yet. Run an analysis to get suggestions.</p>
          ) : (
            recommendations.recommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card">
                <div className="rec-header">
                  <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                  <span className="rec-type">{RECOMMENDATION_TYPE_NAMES[rec.type]}</span>
                </div>
                <h4>{rec.title}</h4>
                <p>{rec.description}</p>
                <div className="rec-actions">
                  <button onClick={() => recommendations.applyRecommendation(rec.id)}>
                    Apply
                  </button>
                  <button onClick={() => recommendations.dismissRecommendation(rec.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="stats-section">
          <h4>Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{recommendations.statistics.totalAnalyses}</span>
              <span className="stat-label">Analyses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{recommendations.statistics.recommendationsApplied}</span>
              <span className="stat-label">Applied</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderHighlightsTab = () => (
    <div className="ai-tab-content">
      <div className="highlights-section">
        <h3>🎬 Highlight Compilation</h3>
        
        {highlights.compilationProgress > 0 && highlights.compilationProgress < 100 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${highlights.compilationProgress}%` }} />
            <span>{highlights.compilationProgress}%</span>
          </div>
        )}
        
        <div className="highlights-stats">
          <div className="stat-item">
            <span className="stat-value">{highlights.statistics.totalHighlights}</span>
            <span className="stat-label">Detected Highlights</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{highlights.statistics.compilationsCreated}</span>
            <span className="stat-label">Compilations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{(highlights.statistics.averageScore * 100).toFixed(0)}%</span>
            <span className="stat-label">Avg Score</span>
          </div>
        </div>
        
        <div className="highlights-list">
          <h4>Recent Highlights</h4>
          {highlights.highlights.length === 0 ? (
            <p className="no-data">No highlights detected yet.</p>
          ) : (
            highlights.highlights.slice(0, 10).map((h) => (
              <div key={h.id} className="highlight-card">
                <div className="highlight-type-badge">{HIGHLIGHT_TYPE_NAMES[h.type]}</div>
                <div className="highlight-info">
                  <p>{h.description}</p>
                  <div className="highlight-meta">
                    <span>Score: {(h.score * 100).toFixed(0)}%</span>
                    <span>Duration: {(h.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="highlights-actions">
          <button
            className="action-btn primary"
            onClick={() => highlights.createCompilation(
              'Best Moments',
              'Auto-generated compilation of best moments'
            )}
            disabled={highlights.highlights.length === 0 || highlights.isProcessing}
          >
            Create Compilation
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderEngagementTab = () => (
    <div className="ai-tab-content">
      <div className="engagement-section">
        <h3>📊 Engagement Suggestions</h3>
        
        <div className="engagement-context">
          <h4>Current Context</h4>
          {engagement.context ? (
            <div className="context-grid">
              <div className="context-item">
                <span className="context-value">{engagement.context.viewerCount}</span>
                <span className="context-label">Viewers</span>
              </div>
              <div className="context-item">
                <span className="context-value">{engagement.context.chatActivity}</span>
                <span className="context-label">Chat Activity</span>
              </div>
              <div className="context-item">
                <span className="context-value">{engagement.context.recentFollows}</span>
                <span className="context-label">Recent Follows</span>
              </div>
            </div>
          ) : (
            <p className="no-data">No context data available.</p>
          )}
        </div>
        
        <div className="suggestions-list">
          <div className="section-header">
            <h4>Suggestions</h4>
            <button
              className="action-btn"
              onClick={() => engagement.requestSuggestion()}
              disabled={engagement.isAnalyzing}
            >
              Get Suggestion
            </button>
          </div>
          
          {engagement.suggestions.length === 0 ? (
            <p className="no-data">No suggestions available.</p>
          ) : (
            engagement.suggestions.map((s) => (
              <div key={s.id} className="suggestion-card">
                <div className="suggestion-header">
                  <span className={`priority-badge ${s.priority}`}>{s.priority}</span>
                  <span className="suggestion-type">{ENGAGEMENT_TYPE_NAMES[s.type]}</span>
                </div>
                <h4>{s.title}</h4>
                <p>{s.description}</p>
                <div className="suggestion-actions">
                  <button onClick={() => engagement.applySuggestion(s.id)}>
                    Done
                  </button>
                  <button onClick={() => engagement.dismissSuggestion(s.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="stats-section">
          <h4>Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{engagement.statistics.totalSuggestions}</span>
              <span className="stat-label">Total Suggestions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{(engagement.statistics.successRate * 100).toFixed(0)}%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="ai-features-container">
      <div className="ai-features-header">
        <h2>🤖 AI Features</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="ai-features-tabs">
        <button
          className={`tab-btn ${activeTab === 'translation' ? 'active' : ''}`}
          onClick={() => setActiveTab('translation')}
        >
          🌐 Translation
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 Recommendations
        </button>
        <button
          className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
          onClick={() => setActiveTab('highlights')}
        >
          🎬 Highlights
        </button>
        <button
          className={`tab-btn ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          📊 Engagement
        </button>
      </div>
      
      <div className="ai-features-content">
        {activeTab === 'translation' && renderTranslationTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
        {activeTab === 'highlights' && renderHighlightsTab()}
        {activeTab === 'engagement' && renderEngagementTab()}
      </div>
    </div>
  );
};

export default AIFeatures;