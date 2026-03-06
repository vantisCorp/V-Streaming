import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStreamDashboardPro } from '../hooks/useStreamDashboardPro';
import {
  StreamDashboardProSettings,
  StreamEvent,
  StreamGoal,
  ChatMessage,
  AlertConfig,
  QuickAction,
  StreamSessionStats,
  DashboardWidget,
  DashboardWidgetType,
  StreamEventType,
  StreamGoalType,
  QuickActionType,
  AlertStyle,
  ChatMessageRole,
  ChatFilterType
} from '../types/streamDashboardPro';
import './StreamDashboardPro.css';

// ============================================================================
// TYPES
// ============================================================================

interface StreamDashboardProProps {
  onClose: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StreamDashboardPro: React.FC<StreamDashboardProProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    dashboardLayout,
    widgets,
    settings,
    stats,
    events,
    goals,
    chatMessages,
    alertConfigs,
    quickActions,
    
    setDashboardLayout,
    createLayout,
    deleteLayout,
    
    addWidget,
    removeWidget,
    updateWidget,
    
    addEvent,
    getEvents,
    clearEvents,
    
    getGoals,
    addGoal,
    updateGoal,
    removeGoal,
    
    getChatMessages,
    deleteChatMessage,
    clearChat,
    getChatSettings,
    updateChatSettings,
    
    getAlertConfigs,
    addAlertConfig,
    updateAlertConfig,
    removeAlertConfig,
    
    getStats,
    updateViewerCount,
    startStreamSession,
    endStreamSession,
    getStreamSessions,
    
    getQuickActions,
    addQuickAction,
    removeQuickAction,
    executeQuickAction,
    
    updateSettings,
    resetSettings
  } = useStreamDashboardPro();
  
  // ==========================================================================
  // LOCAL STATE
  // ==========================================================================
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'goals' | 'chat' | 'alerts' | 'settings'>('dashboard');
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<StreamGoal | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertConfig | null>(null);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  
  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  
  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };
  
  const getEventTypeIcon = (type: StreamEventType): string => {
    const icons: Record<StreamEventType, string> = {
      [StreamEventType.FOLLOW]: '❤️',
      [StreamEventType.SUBSCRIPTION]: '⭐',
      [StreamEventType.DONATION]: '💰',
      [StreamEventType.RAID]: '🚀',
      [StreamEventType.HOST]: '🏠',
      [StreamEventType.CHEER]: '🎉',
      [StreamEventType.GIFT_SUB]: '🎁',
      [StreamEventType.COMMUNITY_GIFT]: '🎁',
      [StreamEventType.NEW_CHAT]: '💬',
      [StreamEventType.NEW_VIEWER]: '👁️',
      [StreamEventType.MILESTONE]: '🏆',
      [StreamEventType.CUSTOM]: '✨'
    };
    return icons[type] || '✨';
  };
  
  const getWidgetIcon = (type: DashboardWidgetType): string => {
    const icons: Record<DashboardWidgetType, string> = {
      [DashboardWidgetType.VIEWER_COUNT]: '👥',
      [DashboardWidgetType.CHAT_ACTIVITY]: '💬',
      [DashboardWidgetType.NEW_FOLLOWERS]: '❤️',
      [DashboardWidgetType.NEW_SUBSCRIBERS]: '⭐',
      [DashboardWidgetType.DONATIONS]: '💰',
      [DashboardWidgetType.STREAM_UPTIME]: '⏱️',
      [DashboardWidgetType.BITRATE]: '📊',
      [DashboardWidgetType.FPS]: '🎮',
      [DashboardWidgetType.GOAL_PROGRESS]: '🎯',
      [DashboardWidgetType.RAID_HOST]: '🚀',
      [DashboardWidgetType.TOP_CLIPS]: '📹',
      [DashboardWidgetType.RECENT_EVENTS]: '📋',
      [DashboardWidgetType.CHAT_PREVIEW]: '💬',
      [DashboardWidgetType.QUICK_ACTIONS]: '⚡'
    };
    return icons[type] || '📊';
  };
  
  const getGoalTypeIcon = (type: StreamGoalType): string => {
    const icons: Record<StreamGoalType, string> = {
      [StreamGoalType.FOLLOWERS]: '❤️',
      [StreamGoalType.SUBSCRIBERS]: '⭐',
      [StreamGoalType.DONATIONS]: '💰',
      [StreamGoalType.CHEERS]: '🎉',
      [StreamGoalType.BITS]: '💎',
      [StreamGoalType.VIEWERS]: '👥',
      [StreamGoalType.DURATION]: '⏱️'
    };
    return icons[type] || '🎯';
  };
  
  // ==========================================================================
  // RENDER FUNCTIONS
  // ==========================================================================
  
  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.enabled) return null;
    
    switch (widget.type) {
      case DashboardWidgetType.VIEWER_COUNT:
        return (
          <div key={widget.id} className="widget viewer-count-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <span className="viewer-count">{formatNumber(stats.viewerCount)}</span>
              <span className="viewer-label">Viewers</span>
            </div>
          </div>
        );
      
      case DashboardWidgetType.STREAM_UPTIME:
        return (
          <div key={widget.id} className="widget uptime-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <span className="uptime-value">
                {stats.currentSession ? formatDuration(stats.currentSession.duration) : '00:00:00'}
              </span>
              <span className="uptime-label">Uptime</span>
            </div>
          </div>
        );
      
      case DashboardWidgetType.NEW_FOLLOWERS:
        return (
          <div key={widget.id} className="widget followers-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <span className="followers-count">
                {stats.currentSession ? formatNumber(stats.currentSession.newFollowers) : '0'}
              </span>
              <span className="followers-label">New Followers</span>
            </div>
          </div>
        );
      
      case DashboardWidgetType.NEW_SUBSCRIBERS:
        return (
          <div key={widget.id} className="widget subscribers-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <span className="subscribers-count">
                {stats.currentSession ? formatNumber(stats.currentSession.newSubscribers) : '0'}
              </span>
              <span className="subscribers-label">New Subs</span>
            </div>
          </div>
        );
      
      case DashboardWidgetType.GOAL_PROGRESS:
        return (
          <div key={widget.id} className="widget goals-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              {goals.filter(g => g.enabled).slice(0, 3).map(goal => (
                <div key={goal.id} className="goal-item">
                  <div className="goal-info">
                    <span className="goal-icon">{getGoalTypeIcon(goal.type)}</span>
                    <span className="goal-title">{goal.title}</span>
                  </div>
                  <div className="goal-progress-bar">
                    <div 
                      className="goal-progress-fill" 
                      style={{ width: `${goal.progress}%` }}
                    />
                    <span className="goal-percent">{Math.round(goal.progress)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case DashboardWidgetType.RECENT_EVENTS:
        return (
          <div key={widget.id} className="widget events-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <div className="events-list">
                {events.slice(0, 5).map(event => (
                  <div key={event.id} className="event-item">
                    <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                    <span className="event-username">{event.username}</span>
                    {event.amount && (
                      <span className="event-amount">
                        {event.type === StreamEventType.DONATION 
                          ? formatCurrency(event.amount, event.currency)
                          : formatNumber(event.amount)
                        }
                      </span>
                    )}
                    <span className="event-time">
                      {Math.floor((Date.now() - event.timestamp) / 1000)}s ago
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case DashboardWidgetType.QUICK_ACTIONS:
        return (
          <div key={widget.id} className="widget quick-actions-widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <div className="quick-actions-grid">
                {quickActions.slice(0, 6).map(action => (
                  <button
                    key={action.id}
                    className="quick-action-btn"
                    onClick={() => executeQuickAction(action.id)}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-name">{action.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div key={widget.id} className="widget">
            <div className="widget-header">
              <span className="widget-icon">{getWidgetIcon(widget.type)}</span>
              <span className="widget-title">{widget.title}</span>
            </div>
            <div className="widget-content">
              <p className="widget-placeholder">Widget content</p>
            </div>
          </div>
        );
    }
  };
  
  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  
  return (
    <div className="stream-dashboard-pro">
      {/* Header */}
      <div className="sdp-header">
        <div className="sdp-header-left">
          <h2>{t('streamDashboardPro.title')}</h2>
          <p>{t('streamDashboardPro.subtitle')}</p>
        </div>
        <div className="sdp-header-right">
          <button className="sdp-close-btn" onClick={onClose}>×</button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="sdp-tabs">
        <button
          className={`sdp-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 {t('streamDashboardPro.tabs.dashboard')}
        </button>
        <button
          className={`sdp-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📋 {t('streamDashboardPro.tabs.events')}
        </button>
        <button
          className={`sdp-tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 {t('streamDashboardPro.tabs.goals')}
        </button>
        <button
          className={`sdp-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 {t('streamDashboardPro.tabs.chat')}
        </button>
        <button
          className={`sdp-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 {t('streamDashboardPro.tabs.alerts')}
        </button>
        <button
          className={`sdp-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ {t('streamDashboardPro.tabs.settings')}
        </button>
      </div>
      
      {/* Content */}
      <div className="sdp-content">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="sdp-tab-content dashboard-tab">
            <div className="dashboard-controls">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (stats.currentSession) {
                    endStreamSession();
                  } else {
                    startStreamSession('Twitch');
                  }
                }}
              >
                {stats.currentSession ? '⏹️ Stop Stream' : '🎬 Start Stream'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditingLayout(!isEditingLayout)}
              >
                {isEditingLayout ? '✓ Done Editing' : '✏️ Edit Layout'}
              </button>
            </div>
            
            <div className="widgets-grid">
              {widgets
                .filter(w => w.enabled)
                .sort((a, b) => {
                  const posA = a.position.y * 10 + a.position.x;
                  const posB = b.position.y * 10 + b.position.x;
                  return posA - posB;
                })
                .map(widget => renderWidget(widget))
              }
            </div>
          </div>
        )}
        
        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="sdp-tab-content events-tab">
            <div className="events-controls">
              <button className="btn btn-danger" onClick={clearEvents}>
                🗑️ {t('streamDashboardPro.events.clear')}
              </button>
            </div>
            
            <div className="events-list-full">
              {events.length === 0 ? (
                <p className="no-events">{t('streamDashboardPro.events.noEvents')}</p>
              ) : (
                events.map(event => (
                  <div key={event.id} className="event-card">
                    <span className="event-icon">{getEventTypeIcon(event.type)}</span>
                    <div className="event-details">
                      <span className="event-username">{event.username}</span>
                      {event.amount && (
                        <span className="event-amount">
                          {event.type === StreamEventType.DONATION 
                            ? formatCurrency(event.amount, event.currency)
                            : formatNumber(event.amount)
                          }
                        </span>
                      )}
                      {event.message && (
                        <p className="event-message">{event.message}</p>
                      )}
                    </div>
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="sdp-tab-content goals-tab">
            <div className="goals-controls">
              <button className="btn btn-primary" onClick={() => setSelectedGoal({} as StreamGoal)}>
                ➕ {t('streamDashboardPro.goals.addGoal')}
              </button>
            </div>
            
            <div className="goals-list">
              {goals.length === 0 ? (
                <p className="no-goals">{t('streamDashboardPro.goals.noGoals')}</p>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <span className="goal-icon">{getGoalTypeIcon(goal.type)}</span>
                      <h4 className="goal-title">{goal.title}</h4>
                      <div className="goal-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedGoal(goal)}>
                          ✏️
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => removeGoal(goal.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="goal-stats">
                      <span className="goal-current">{formatNumber(goal.current)}</span>
                      <span className="goal-divider">/</span>
                      <span className="goal-target">{formatNumber(goal.target)}</span>
                    </div>
                    <div className="goal-progress-bar">
                      <div 
                        className="goal-progress-fill" 
                        style={{ width: `${goal.progress}%` }}
                      />
                      <span className="goal-percent">{Math.round(goal.progress)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="sdp-tab-content chat-tab">
            <div className="chat-controls">
              <button className="btn btn-danger" onClick={clearChat}>
                🗑️ {t('streamDashboardPro.chat.clear')}
              </button>
            </div>
            
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <p className="no-messages">{t('streamDashboardPro.chat.noMessages')}</p>
              ) : (
                chatMessages.slice(-100).map(message => (
                  <div key={message.id} className={`chat-message ${message.isDeleted ? 'deleted' : ''} ${message.role !== ChatMessageRole.VIEWER ? 'special' : ''}`}>
                    <span className="chat-username" style={{ color: message.color }}>
                      {message.displayName}:
                    </span>
                    <span className="chat-text">{message.message}</span>
                    {message.role !== ChatMessageRole.VIEWER && (
                      <span className="chat-badge">{message.role}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="sdp-tab-content alerts-tab">
            <div className="alerts-controls">
              <button className="btn btn-primary" onClick={() => setSelectedAlert({} as AlertConfig)}>
                ➕ {t('streamDashboardPro.alerts.addAlert')}
              </button>
            </div>
            
            <div className="alerts-list">
              {alertConfigs.length === 0 ? (
                <p className="no-alerts">{t('streamDashboardPro.alerts.noAlerts')}</p>
              ) : (
                alertConfigs.map(alert => (
                  <div key={alert.id} className="alert-card">
                    <div className="alert-header">
                      <span className="alert-event-type">{getEventTypeIcon(alert.eventType)} {alert.eventType}</span>
                      <div className="alert-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedAlert(alert)}>
                          ✏️
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => removeAlertConfig(alert.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="alert-info">
                      <span className="alert-style">{alert.style}</span>
                      <span className="alert-enabled">{alert.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="sdp-tab-content settings-tab">
            <div className="settings-section">
              <h3>{t('streamDashboardPro.settings.general')}</h3>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.autoRefresh')}</label>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
                />
              </div>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.refreshInterval')}</label>
                <input
                  type="number"
                  value={settings.refreshInterval / 1000}
                  onChange={(e) => updateSettings({ refreshInterval: Number(e.target.value) * 1000 })}
                />
                <span className="setting-suffix">seconds</span>
              </div>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.showNotifications')}</label>
                <input
                  type="checkbox"
                  checked={settings.showNotifications}
                  onChange={(e) => updateSettings({ showNotifications: e.target.checked })}
                />
              </div>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.soundEnabled')}</label>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                />
              </div>
            </div>
            
            <div className="settings-section">
              <h3>{t('streamDashboardPro.settings.display')}</h3>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.compactMode')}</label>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                />
              </div>
              <div className="setting-item">
                <label>{t('streamDashboardPro.settings.darkMode')}</label>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                />
              </div>
            </div>
            
            <div className="settings-actions">
              <button className="btn btn-danger" onClick={resetSettings}>
                🔄 {t('streamDashboardPro.settings.reset')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamDashboardPro;