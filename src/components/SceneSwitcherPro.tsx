/**
 * Scene Switcher Pro Component
 * Professional scene management with multiple tabs and controls
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSceneSwitcherPro } from '../hooks/useSceneSwitcherPro';
import {
  TransitionType,
  TransitionEasing,
  SceneItemType,
  BlendMode,
} from '../types/sceneSwitcherPro';
import './SceneSwitcherPro.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SceneSwitcherProProps {
  onClose?: () => void;
}

const SceneSwitcherPro: React.FC<SceneSwitcherProProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    scenes,
    currentScene,
    previewedScene,
    settings,
    stats,
    hotkeys,
    automationRules,
    
    createScene,
    updateScene,
    removeScene,
    duplicateScene,
    
    switchScene,
    previewScene: previewSceneFn,
    
    addItem,
    updateItem,
    removeItem,
    toggleItem,
    duplicateItem,
    
    setTransition,
    getTransition,
    getDefaultTransition,
    setDefaultTransition,
    
    setHotkey,
    getHotkey,
    removeHotkey,
    
    addAutomationRule,
    updateAutomationRule,
    removeAutomationRule,
    
    updateSettings,
    
    isTransitioning,
    canEditCurrentScene,
  } = useSceneSwitcherPro();
  
  const [activeTab, setActiveTab] = useState('scenes');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [showCreateSceneDialog, setShowCreateSceneDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDescription, setNewSceneDescription] = useState('');
  
  // ==========================================================================
  // TABS
  // ==========================================================================
  
  const tabs = [
    { id: 'scenes', label: t('sceneSwitcherPro.tabs.scenes'), icon: '🎬' },
    { id: 'transitions', label: t('sceneSwitcherPro.tabs.transitions'), icon: '⚡' },
    { id: 'hotkeys', label: t('sceneSwitcherPro.tabs.hotkeys'), icon: '⌨️' },
    { id: 'automation', label: t('sceneSwitcherPro.tabs.automation'), icon: '🤖' },
    { id: 'settings', label: t('sceneSwitcherPro.tabs.settings'), icon: '⚙️' },
  ];
  
  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  
  const handleCreateScene = () => {
    if (newSceneName.trim()) {
      const scene = createScene(newSceneName, newSceneDescription || undefined);
      setSelectedSceneId(scene.id);
      setNewSceneName('');
      setNewSceneDescription('');
      setShowCreateSceneDialog(false);
    }
  };
  
  const handleSwitchScene = async (sceneId: string) => {
    try {
      await switchScene(sceneId);
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  };
  
  const handlePreviewScene = (sceneId: string) => {
    previewSceneFn(sceneId);
  };
  
  const handleRemoveScene = (sceneId: string) => {
    if (window.confirm(t('sceneSwitcherPro.confirmDeleteScene'))) {
      removeScene(sceneId);
      if (selectedSceneId === sceneId) {
        setSelectedSceneId(null);
      }
    }
  };
  
  const handleDuplicateScene = (sceneId: string) => {
    duplicateScene(sceneId);
  };
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  const selectedScene = selectedSceneId ? scenes.find(s => s.id === selectedSceneId) : null;
  
  return (
    <div className="scene-switcher-pro">
      <div className="scene-header">
        <h2>{t('sceneSwitcherPro.title')}</h2>
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="scene-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="scene-content">
        {activeTab === 'scenes' && (
          <div className="tab-content scenes-tab">
            <div className="scenes-toolbar">
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateSceneDialog(true)}
              >
                {t('sceneSwitcherPro.addScene')}
              </button>
              
              <div className="stats-info">
                <span>{t('sceneSwitcherPro.totalScenes')}: {stats.totalScenes}</span>
                <span>{t('sceneSwitcherPro.totalItems')}: {stats.totalItems}</span>
              </div>
            </div>
            
            <div className="scenes-layout">
              {/* Scene List */}
              <div className="scenes-list">
                {scenes.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('sceneSwitcherPro.noScenes')}</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowCreateSceneDialog(true)}
                    >
                      {t('sceneSwitcherPro.createFirstScene')}
                    </button>
                  </div>
                ) : (
                  scenes.map(scene => (
                    <div
                      key={scene.id}
                      className={`scene-card ${scene.id === currentScene?.id ? 'active' : ''} ${scene.id === previewedScene?.id ? 'preview' : ''}`}
                      onClick={() => setSelectedSceneId(scene.id)}
                      onDoubleClick={() => handleSwitchScene(scene.id)}
                    >
                      <div className="scene-thumbnail"></div>
                      <div className="scene-info">
                        <h4>{scene.name}</h4>
                        <p className="scene-description">{scene.description || ''}</p>
                        <div className="scene-meta">
                          <span>{scene.items.length} {t('sceneSwitcherPro.items')}</span>
                          {scene.id === currentScene?.id && (
                            <span className="active-badge">{t('sceneSwitcherPro.active')}</span>
                          )}
                          {scene.id === previewedScene?.id && (
                            <span className="preview-badge">{t('sceneSwitcherPro.preview')}</span>
                          )}
                        </div>
                      </div>
                      <div className="scene-actions">
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSwitchScene(scene.id);
                          }}
                          disabled={scene.id === currentScene?.id || isTransitioning}
                          title={t('sceneSwitcherPro.switchScene')}
                        >
                          📺
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewScene(scene.id);
                          }}
                          title={t('sceneSwitcherPro.previewScene')}
                        >
                          👁️
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateScene(scene.id);
                          }}
                          title={t('sceneSwitcherPro.duplicateScene')}
                        >
                          📋
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveScene(scene.id);
                          }}
                          title={t('sceneSwitcherPro.deleteScene')}
                          disabled={scene.id === currentScene?.id}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Scene Details */}
              {selectedScene && (
                <div className="scene-details">
                  <div className="details-header">
                    <h3>{selectedScene.name}</h3>
                    <div className="scene-details-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => handleSwitchScene(selectedScene.id)}
                        disabled={selectedScene.id === currentScene?.id || isTransitioning}
                      >
                        {t('sceneSwitcherPro.switchScene')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveScene(selectedScene.id)}
                        disabled={selectedScene.id === currentScene?.id}
                      >
                        {t('sceneSwitcherPro.deleteScene')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="scene-properties">
                    <div className="form-group">
                      <label>{t('sceneSwitcherPro.sceneName')}</label>
                      <input
                        type="text"
                        value={selectedScene.name}
                        onChange={(e) => {
                          selectedScene.name = e.target.value;
                          updateScene(selectedScene);
                        }}
                        disabled={selectedScene.locked}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>{t('sceneSwitcherPro.description')}</label>
                      <textarea
                        value={selectedScene.description || ''}
                        onChange={(e) => {
                          selectedScene.description = e.target.value;
                          updateScene(selectedScene);
                        }}
                        disabled={selectedScene.locked}
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedScene.locked}
                          onChange={(e) => {
                            selectedScene.locked = e.target.checked;
                            updateScene(selectedScene);
                          }}
                        />
                        {t('sceneSwitcherPro.lockScene')}
                      </label>
                    </div>
                  </div>
                  
                  {/* Scene Items */}
                  <div className="scene-items">
                    <h4>{t('sceneSwitcherPro.sceneItems')} ({selectedScene.items.length})</h4>
                    
                    {selectedScene.items.length === 0 ? (
                      <div className="empty-state">
                        <p>{t('sceneSwitcherPro.noItems')}</p>
                      </div>
                    ) : (
                      <div className="items-list">
                        {selectedScene.items.map(item => (
                          <div key={item.id} className="item-card">
                            <div className="item-icon">
                              {getItemIcon(item.type)}
                            </div>
                            <div className="item-info">
                              <h5>{item.name}</h5>
                              <div className="item-meta">
                                <span>{item.type}</span>
                                <span>{item.size.width}×{item.size.height}</span>
                              </div>
                            </div>
                            <div className="item-actions">
                              <button
                                className="btn btn-sm"
                                onClick={() => toggleItem(selectedScene.id, item.id)}
                                title={t('sceneSwitcherPro.toggleVisibility')}
                              >
                                {item.visibility === 'visible' ? '👁️' : '🙈'}
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => duplicateItem(selectedScene.id, item.id)}
                                title={t('sceneSwitcherPro.duplicateItem')}
                              >
                                📋
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => removeItem(selectedScene.id, item.id)}
                                title={t('sceneSwitcherPro.deleteItem')}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'transitions' && (
          <div className="tab-content transitions-tab">
            <div className="transitions-grid">
              {/* Default Transition */}
              <div className="transition-card default">
                <h3>{t('sceneSwitcherPro.defaultTransition')}</h3>
                <div className="transition-config">
                  <div className="form-group">
                    <label>{t('sceneSwitcherPro.transitionType')}</label>
                    <select
                      value={getDefaultTransition().type}
                      onChange={(e) => setDefaultTransition({
                        ...getDefaultTransition(),
                        type: e.target.value as TransitionType,
                      })}
                    >
                      {Object.values(TransitionType).map(type => (
                        <option key={type} value={type}>
                          {t(`sceneSwitcherPro.transitionTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>{t('sceneSwitcherPro.duration')} (ms)</label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="50"
                      value={getDefaultTransition().duration}
                      onChange={(e) => setDefaultTransition({
                        ...getDefaultTransition(),
                        duration: parseInt(e.target.value),
                      })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>{t('sceneSwitcherPro.easing')}</label>
                    <select
                      value={getDefaultTransition().easing}
                      onChange={(e) => setDefaultTransition({
                        ...getDefaultTransition(),
                        easing: e.target.value as TransitionEasing,
                      })}
                    >
                      {Object.values(TransitionEasing).map(easing => (
                        <option key={easing} value={easing}>
                          {t(`sceneSwitcherPro.easing.${easing}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Scene-specific Transitions */}
              <div className="scene-transitions">
                <h3>{t('sceneSwitcherPro.sceneTransitions')}</h3>
                {scenes.map(scene => (
                  <div key={scene.id} className="scene-transition-item">
                    <h4>{scene.name}</h4>
                    <div className="transition-config">
                      <div className="form-group">
                        <label>{t('sceneSwitcherPro.transitionType')}</label>
                        <select
                          value={getTransition(scene.id)?.type || getDefaultTransition().type}
                          onChange={(e) => setTransition(scene.id, {
                            ...getTransition(scene.id) || getDefaultTransition(),
                            type: e.target.value as TransitionType,
                          })}
                        >
                          <option value="">{t('sceneSwitcherPro.useDefault')}</option>
                          {Object.values(TransitionType).map(type => (
                            <option key={type} value={type}>
                              {t(`sceneSwitcherPro.transitionTypes.${type}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>{t('sceneSwitcherPro.duration')} (ms)</label>
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          step="50"
                          value={getTransition(scene.id)?.duration || getDefaultTransition().duration}
                          onChange={(e) => setTransition(scene.id, {
                            ...getTransition(scene.id) || getDefaultTransition(),
                            duration: parseInt(e.target.value),
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'hotkeys' && (
          <div className="tab-content hotkeys-tab">
            <div className="hotkeys-grid">
              {scenes.map(scene => (
                <div key={scene.id} className="hotkey-card">
                  <h4>{scene.name}</h4>
                  <div className="hotkey-config">
                    <div className="form-group">
                      <label>{t('sceneSwitcherPro.hotkey')}</label>
                      <input
                        type="text"
                        value={getHotkey(scene.id)?.keys.join('+') || ''}
                        placeholder="Press keys..."
                        readOnly
                        onClick={() => {
                          // Implement hotkey recording
                        }}
                      />
                    </div>
                    <button
                      className="btn btn-sm"
                      onClick={() => removeHotkey(scene.id)}
                      disabled={!getHotkey(scene.id)}
                    >
                      {t('sceneSwitcherPro.clearHotkey')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'automation' && (
          <div className="tab-content automation-tab">
            <div className="automation-rules">
              {automationRules.length === 0 ? (
                <div className="empty-state">
                  <p>{t('sceneSwitcherPro.noAutomationRules')}</p>
                  <button className="btn btn-primary">
                    {t('sceneSwitcherPro.addAutomationRule')}
                  </button>
                </div>
              ) : (
                automationRules.map(rule => (
                  <div key={rule.id} className="automation-rule-card">
                    <h4>{rule.name}</h4>
                    <p>{t(`sceneSwitcherPro.triggers.${rule.trigger}`)}</p>
                    <div className="rule-actions">
                      <button className="btn btn-sm">
                        {t('sceneSwitcherPro.edit')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeAutomationRule(rule.id)}
                      >
                        {t('sceneSwitcherPro.delete')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="tab-content settings-tab">
            <div className="settings-sections">
              <div className="settings-section">
                <h3>{t('sceneSwitcherPro.generalSettings')}</h3>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.previewEnabled}
                      onChange={(e) => updateSettings({ previewEnabled: e.target.checked })}
                    />
                    {t('sceneSwitcherPro.enablePreview')}
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.doubleClickSwitch}
                      onChange={(e) => updateSettings({ doubleClickSwitch: e.target.checked })}
                    />
                    {t('sceneSwitcherPro.doubleClickToSwitch')}
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.showItemNames}
                      onChange={(e) => updateSettings({ showItemNames: e.target.checked })}
                    />
                    {t('sceneSwitcherPro.showItemNames')}
                  </label>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>{t('sceneSwitcherPro.autoSave')}</h3>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                    />
                    {t('sceneSwitcherPro.enableAutoSave')}
                  </label>
                </div>
                
                <div className="form-group">
                  <label>{t('sceneSwitcherPro.autoSaveInterval')} (s)</label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={settings.autoSaveInterval}
                    onChange={(e) => updateSettings({ autoSaveInterval: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Scene Dialog */}
      {showCreateSceneDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateSceneDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('sceneSwitcherPro.createScene')}</h3>
            <div className="form-group">
              <label>{t('sceneSwitcherPro.sceneName')}</label>
              <input
                type="text"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder={t('sceneSwitcherPro.enterSceneName')}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>{t('sceneSwitcherPro.description')}</label>
              <textarea
                value={newSceneDescription}
                onChange={(e) => setNewSceneDescription(e.target.value)}
                placeholder={t('sceneSwitcherPro.enterDescription')}
                rows={3}
              />
            </div>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateSceneDialog(false)}
              >
                {t('sceneSwitcherPro.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateScene}
                disabled={!newSceneName.trim()}
              >
                {t('sceneSwitcherPro.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getItemIcon(type: SceneItemType): string {
  const icons: Record<SceneItemType, string> = {
    [SceneItemType.SOURCE]: '🎥',
    [SceneItemType.GROUP]: '📁',
    [SceneItemType.AUDIO]: '🔊',
    [SceneItemType.MEDIA]: '🎵',
    [SceneItemType.CAMERA]: '📸',
    [SceneItemType.TEXT]: '📝',
    [SceneItemType.IMAGE]: '🖼️',
    [SceneItemType.VIDEO]: '🎬',
    [SceneItemType.BROWSER]: '🌐',
    [SceneItemType.COLOR]: '🎨',
  };
  return icons[type] || '📦';
}

export default SceneSwitcherPro;