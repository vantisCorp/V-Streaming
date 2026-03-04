/**
 * SceneAutomationSettings - UI for managing scene automation
 */

import React, { useState as useReactState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSceneAutomation } from '../hooks/useSceneAutomation';
import { AutomationRule, AutomationGroup } from '../types/sceneAutomation';

import './SceneAutomationSettings.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SceneAutomationSettingsProps {
  onClose?: () => void;
}

export const SceneAutomationSettings: React.FC<SceneAutomationSettingsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    isPaused,
    rules,
    groups,
    togglePause,
    addRule,
    deleteRule,
    toggleRule,
    executeRule,
    createGroup,
    deleteGroup,
    toggleGroup,
    clearExecutionLog,
  } = useSceneAutomation();

  const handleCreateRule = () => {
    const newRule = {
      name: 'New Rule',
      description: 'Describe your automation rule',
      enabled: true,
      priority: 50,
      trigger: { type: 'manual' as const },
      actions: [],
    };

    addRule(newRule);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteRule(ruleId);
    }
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    toggleRule(ruleId, enabled);
  };

  const handleExecuteRule = (ruleId: string) => {
    executeRule(ruleId);
  };

  return (
    <div className="scene-automation-settings">
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{t('automation.title', 'Scene Automation')}</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>

          <div className="modal-body">
            {/* Status Bar */}
            <div className="automation-status-bar">
              <div className="status-item">
                <span className="status-label">Status:</span>
                <span className={`status-value ${isPaused ? 'paused' : 'active'}`}>
                  {isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Rules:</span>
                <span className="status-value">{rules.filter(r => r.enabled).length}/{rules.length}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Groups:</span>
                <span className="status-value">{groups.length}</span>
              </div>
              <button
                className={`pause-btn ${isPaused ? 'paused' : ''}`}
                onClick={togglePause}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className="tab active">Rules</button>
              <button className="tab">Groups</button>
              <button className="tab">Logs</button>
              <button className="tab">Settings</button>
            </div>

            {/* Content Area */}
            <div className="tab-content">
              <div className="rules-list">
                <button className="add-btn" onClick={handleCreateRule}>
                  + Add Rule
                </button>
                {rules.map(rule => (
                  <div key={rule.id} className={`automation-rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="rule-header">
                      <div className="rule-title">
                        <h4>{rule.name}</h4>
                      </div>
                      <div className="rule-controls">
                        <button
                          className={`toggle-btn ${rule.enabled ? 'on' : 'off'}`}
                          onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                        >
                          {rule.enabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          className="execute-btn"
                          onClick={() => handleExecuteRule(rule.id)}
                        >
                          ▶
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="rule-body">
                      <p className="rule-description">{rule.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};