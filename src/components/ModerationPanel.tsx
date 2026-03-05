import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModeration } from '../hooks/useModeration';
import {
  ModerationActionType,
  ModerationRuleType,
  ModerationSeverity,
  TrustLevel
} from '../types/moderation';
import './ModerationPanel.css';

interface ModerationPanelProps {
  onClose?: () => void;
}

export const ModerationPanel: React.FC<ModerationPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const moderation = useModeration();

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'queue' | 'users' | 'actions' | 'appeals'>('overview');
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);

  useEffect(() => {
    moderation.loadInitialData();
  }, [moderation]);

  const handleCreateRule = (rule: any) => {
    moderation.createRule(rule);
    setShowNewRuleForm(false);
  };

  const statistics = moderation.statistics;

  return (
    <div className="moderation-panel">
      <div className="moderation-header">
        <h2>{t('moderation.title')}</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="moderation-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('moderation.tabs.overview')}
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          {t('moderation.tabs.rules')}
        </button>
        <button
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          {t('moderation.tabs.queue')}
          {moderation.queue.length > 0 && (
            <span className="badge">{moderation.queue.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          {t('moderation.tabs.users')}
        </button>
        <button
          className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          {t('moderation.tabs.actions')}
        </button>
        <button
          className={`tab ${activeTab === 'appeals' ? 'active' : ''}`}
          onClick={() => setActiveTab('appeals')}
        >
          {t('moderation.tabs.appeals')}
          {moderation.appeals.filter(a => a.status === 'pending').length > 0 && (
            <span className="badge danger">{moderation.appeals.filter(a => a.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="moderation-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="statistics-grid">
              <div className="stat-card">
                <h3>{t('moderation.stats.messagesProcessed')}</h3>
                <p className="stat-value">{statistics.totalActions}</p>
              </div>
              <div className="stat-card">
                <h3>{t('moderation.stats.actionsTaken')}</h3>
                <p className="stat-value">{statistics.todayActions}</p>
              </div>
              <div className="stat-card">
                <h3>{t('moderation.stats.appealsPending')}</h3>
                <p className="stat-value">{statistics.appealsPending}</p>
              </div>
              <div className="stat-card">
                <h3>{t('moderation.stats.queuePending')}</h3>
                <p className="stat-value">{moderation.queue.length}</p>
              </div>
            </div>

            <div className="recent-actions-section">
              <h3>{t('moderation.recentActions')}</h3>
              <div className="recent-actions-list">
                {moderation.actions.slice(0, 10).map(action => (
                  <div key={action.id} className="recent-action-item">
                    <span className={`action-type ${action.actionType}`}>
                      {t(`moderation.actions.${action.actionType}`)}
                    </span>
                    <span className="action-user">{action.username}</span>
                    <span className="action-reason">{action.reason}</span>
                    <span className="action-time">
                      {new Date(action.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="rules-tab">
            <div className="rules-header">
              <button
                className="btn btn-primary"
                onClick={() => setShowNewRuleForm(true)}
              >
                {t('moderation.createRule')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={moderation.loadInitialData}
              >
                {t('common.refresh')}
              </button>
            </div>

            {showNewRuleForm && <NewRuleForm onSubmit={handleCreateRule} onCancel={() => setShowNewRuleForm(false)} />}

            <div className="rules-list">
              {moderation.rules.map(rule => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-header">
                    <h4>{rule.name}</h4>
                    <div className="rule-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => moderation.updateRule(rule.id, { enabled: !rule.enabled })}
                      >
                        {rule.enabled ? t('moderation.disable') : t('moderation.enable')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => moderation.deleteRule(rule.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                  <div className="rule-details">
                    <p><strong>{t('moderation.ruleType')}:</strong> {t(`moderation.ruleTypes.${rule.type}`)}</p>
                    <p><strong>{t('moderation.severity')}:</strong> {t(`moderation.severities.${rule.severity}`)}</p>
                    {rule.patterns && rule.patterns.length > 0 && (
                      <p><strong>{t('moderation.pattern')}:</strong> {rule.patterns.join(', ')}</p>
                    )}
                  </div>
                  <div className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                    {rule.enabled ? t('moderation.enabled') : t('moderation.disabled')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="queue-tab">
            <div className="queue-header">
              <h3>{t('moderation.queue')}</h3>
            </div>

            {moderation.queue.length === 0 ? (
              <div className="empty-state">
                <p>{t('moderation.queueEmpty')}</p>
              </div>
            ) : (
              <div className="queue-list">
                {moderation.queue.map(entry => (
                  <div key={entry.id} className="queue-entry">
                    <div className="queue-entry-header">
                      <span className="queue-user">{entry.message.username}</span>
                      <span className="queue-time">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="queue-entry-content">
                      <p><strong>{t('moderation.message')}:</strong> {entry.message.content}</p>
                      {entry.flags.map((flag, index) => (
                        <span key={index} className={`flag ${flag.severity}`}>
                          {flag.reason}
                        </span>
                      ))}
                    </div>
                    <div className="queue-entry-actions">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => moderation.resolveQueueEntry(entry.id, 'current_moderator', 'approved')}
                      >
                        {t('moderation.approve')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => moderation.dismissQueueEntry(entry.id, 'current_moderator')}
                      >
                        {t('moderation.dismiss')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div className="users-list">
              {moderation.users.map(user => (
                <div key={user.userId} className="user-card">
                  <div className="user-header">
                    <h4>{user.username}</h4>
                    <span className={`trust-level ${user.trustLevel}`}>
                      {t(`moderation.trustLevels.${user.trustLevel}`)}
                    </span>
                  </div>
                  <div className="user-stats">
                    <p><strong>{t('moderation.messages')}:</strong> {user.messages}</p>
                    <p><strong>{t('moderation.warnings')}:</strong> {user.warnings}</p>
                    <p><strong>{t('moderation.timeouts')}:</strong> {user.timeouts}</p>
                    <p><strong>{t('moderation.bans')}:</strong> {user.bans}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="actions-tab">
            <div className="actions-header">
              <h3>{t('moderation.recentActions')}</h3>
            </div>

            <div className="actions-list">
              {moderation.actions.map(action => (
                <div key={action.id} className="action-item">
                  <div className="action-header">
                    <span className={`action-type ${action.actionType}`}>
                      {t(`moderation.actions.${action.actionType}`)}
                    </span>
                    <span className="action-time">
                      {new Date(action.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="action-details">
                    <p><strong>{t('moderation.user')}:</strong> {action.username}</p>
                    <p><strong>{t('moderation.moderator')}:</strong> {action.moderatorUsername}</p>
                    <p><strong>{t('moderation.reason')}:</strong> {action.reason}</p>
                    {action.duration && <p><strong>{t('moderation.duration')}:</strong> {action.duration}s</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appeals Tab */}
        {activeTab === 'appeals' && (
          <div className="appeals-tab">
            <div className="appeals-header">
              <h3>{t('moderation.appeals')}</h3>
            </div>

            {moderation.appeals.length === 0 ? (
              <div className="empty-state">
                <p>{t('moderation.noAppeals')}</p>
              </div>
            ) : (
              <div className="appeals-list">
                {moderation.appeals.map(appeal => (
                  <div key={appeal.id} className="appeal-card">
                    <div className="appeal-header">
                      <span className="appeal-user">{appeal.username}</span>
                      <span className={`appeal-status ${appeal.status}`}>
                        {t(`moderation.statuses.${appeal.status}`)}
                      </span>
                      <span className="appeal-time">
                        {new Date(appeal.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="appeal-content">
                      <p><strong>{t('moderation.reason')}:</strong> {appeal.reason}</p>
                      {appeal.response && (
                        <p><strong>{t('moderation.response')}:</strong> {appeal.response}</p>
                      )}
                    </div>
                    {appeal.status === 'pending' && (
                      <div className="appeal-actions">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => moderation.resolveAppeal(appeal.id, 'approved', 'current_moderator')}
                        >
                          {t('moderation.approve')}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => moderation.resolveAppeal(appeal.id, 'rejected', 'current_moderator')}
                        >
                          {t('moderation.reject')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface NewRuleFormProps {
  onSubmit: (rule: any) => void;
  onCancel: () => void;
}

const NewRuleForm: React.FC<NewRuleFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<ModerationRuleType>(ModerationRuleType.PROFANITY);
  const [severity, setSeverity] = useState<ModerationSeverity>(ModerationSeverity.MEDIUM);
  const [action, setAction] = useState<ModerationActionType>(ModerationActionType.TIMEOUT);
  const [duration, setDuration] = useState(600);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      severity,
      action,
      duration,
      enabled: true,
      exemptUsers: [],
      exemptRoles: [],
      warnFirst: false,
      cooldown: 0
    });
  };

  return (
    <div className="new-rule-form">
      <h3>{t('moderation.createNewRule')}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('moderation.ruleName')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>{t('moderation.ruleType')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ModerationRuleType)}
          >
            {Object.values(ModerationRuleType).map(ruleType => (
              <option key={ruleType} value={ruleType}>
                {t(`moderation.ruleTypes.${ruleType}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('moderation.severity')}</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as ModerationSeverity)}
          >
            {Object.values(ModerationSeverity).map(sev => (
              <option key={sev} value={sev}>
                {t(`moderation.severities.${sev}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('moderation.action')}</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ModerationActionType)}
          >
            {Object.values(ModerationActionType).filter(a => a === ModerationActionType.TIMEOUT || a === ModerationActionType.WARN).map(act => (
              <option key={act} value={act}>
                {t(`moderation.actions.${act}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('moderation.duration')}</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min="1"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};