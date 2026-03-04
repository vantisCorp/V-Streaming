/**
 * Stream Scheduler Settings Component
 * UI component for managing stream schedules and settings
 */

import React, { useState, useCallback } from 'react';
import { useStreamScheduler } from '../hooks/useStreamScheduler';
import { useTranslation } from 'react-i18next';
import { CreateScheduleOptions, UpdateScheduleOptions, RecurringPattern, ScheduleFrequency, DayOfWeek, NotificationType, NotificationTiming } from '../types/streamScheduler';
import './StreamSchedulerSettings.css';

interface StreamSchedulerSettingsProps {
  onClose: () => void;
}

export const StreamSchedulerSettings: React.FC<StreamSchedulerSettingsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    schedules,
    stats,
    history,
    getUpcomingSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    activateSchedule,
    deactivateSchedule,
    startSchedule,
    updateConfig,
    isConfigured,
    hasActiveSchedules,
  } = useStreamScheduler();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedules' | 'history' | 'settings'>('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateScheduleOptions>({
    name: '',
    description: '',
    startTime: new Date(),
    duration: 60,
    pattern: undefined,
    sceneId: undefined,
    platform: undefined,
    notification: {
      enabled: true,
      type: 'desktop',
      timing: ['15min', '1hour', '1day'],
    },
    preStreamActions: [],
    postStreamActions: [],
  });

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Create schedule
  const handleCreateSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await createSchedule(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        startTime: new Date(),
        duration: 60,
        pattern: undefined,
        sceneId: undefined,
        platform: undefined,
        notification: {
          enabled: true,
          type: 'desktop',
          timing: ['15min', '1hour', '1day'],
        },
        preStreamActions: [],
        postStreamActions: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  }, [formData, createSchedule]);

  // Delete schedule
  const handleDeleteSchedule = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSchedule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  }, [deleteSchedule]);

  // Activate schedule
  const handleActivateSchedule = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await activateSchedule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate schedule');
    } finally {
      setLoading(false);
    }
  }, [activateSchedule]);

  // Deactivate schedule
  const handleDeactivateSchedule = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await deactivateSchedule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate schedule');
    } finally {
      setLoading(false);
    }
  }, [deactivateSchedule]);

  // Start schedule manually
  const handleStartSchedule = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await startSchedule(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start schedule');
    } finally {
      setLoading(false);
    }
  }, [startSchedule]);

  // Update config
  const handleUpdateConfig = useCallback((field: string, value: any) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="stream-scheduler-modal">
      <div className="stream-scheduler-modal-content">
        {/* Header */}
        <div className="stream-scheduler-header">
          <h2>
            <span>📅</span>
            {t('streamScheduler.title')}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="stream-scheduler-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            {t('streamScheduler.dashboard')}
          </button>
          <button
            className={activeTab === 'schedules' ? 'active' : ''}
            onClick={() => setActiveTab('schedules')}
          >
            {t('streamScheduler.schedules')}
          </button>
          <button
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            {t('streamScheduler.history')}
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            {t('streamScheduler.settings')}
          </button>
        </div>

        {/* Content */}
        <div className="stream-scheduler-content">
          {error && (
            <div style={{ color: '#ef4444', padding: '12px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="stream-scheduler-section active">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalSchedules}</div>
                  <div className="stat-label">{t('streamScheduler.totalSchedules')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.activeSchedules}</div>
                  <div className="stat-label">{t('streamScheduler.activeSchedules')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.upcomingSchedules}</div>
                  <div className="stat-label">{t('streamScheduler.upcomingSchedules')}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{Math.round(stats.successRate)}%</div>
                  <div className="stat-label">{t('streamScheduler.successRate')}</div>
                </div>
              </div>

              <h3>{t('streamScheduler.upcomingStreams')}</h3>
              <div className="schedule-list">
                {getUpcomingSchedules(5).length > 0 ? (
                  getUpcomingSchedules(5).map(schedule => (
                    <div key={schedule.id} className={`schedule-card ${schedule.status}`}>
                      <div className="schedule-card-info">
                        <div className="schedule-card-header">
                          <span className="schedule-card-name">{schedule.name}</span>
                          <span className={`schedule-card-status ${schedule.status}`}>
                            {t(`streamScheduler.status.${schedule.status}`)}
                          </span>
                        </div>
                        <div className="schedule-card-details">
                          <span>📅 {formatDate(schedule.startTime)}</span>
                          <span>⏱️ {formatDuration(schedule.duration)}</span>
                        </div>
                      </div>
                      <div className="schedule-card-actions">
                        <button
                          className="primary"
                          onClick={() => handleStartSchedule(schedule.id)}
                          disabled={loading}
                        >
                          {t('streamScheduler.startNow')}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <h3>{t('streamScheduler.noUpcomingStreams')}</h3>
                    <p>{t('streamScheduler.createScheduleHint')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedules Tab */}
          {activeTab === 'schedules' && (
            <div className="stream-scheduler-section active">
              {!showCreateForm ? (
                <>
                  <button
                    className="create-schedule-button"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <span>➕</span>
                    {t('streamScheduler.createSchedule')}
                  </button>

                  <div style={{ marginTop: '20px' }} className="schedule-list">
                    {schedules.length > 0 ? (
                      schedules.map(schedule => (
                        <div key={schedule.id} className={`schedule-card ${schedule.status}`}>
                          <div className="schedule-card-info">
                            <div className="schedule-card-header">
                              <span className="schedule-card-name">{schedule.name}</span>
                              <span className={`schedule-card-status ${schedule.status}`}>
                                {t(`streamScheduler.status.${schedule.status}`)}
                              </span>
                            </div>
                            <div className="schedule-card-details">
                              <span>📅 {formatDate(schedule.startTime)}</span>
                              <span>⏱️ {formatDuration(schedule.duration)}</span>
                              {schedule.pattern && <span>🔄 {t(`streamScheduler.frequency.${schedule.pattern.frequency}`)}</span>}
                            </div>
                          </div>
                          <div className="schedule-card-actions">
                            {schedule.status === 'active' ? (
                              <button
                                className="secondary"
                                onClick={() => handleDeactivateSchedule(schedule.id)}
                                disabled={loading}
                              >
                                {t('streamScheduler.pause')}
                              </button>
                            ) : (
                              <button
                                className="primary"
                                onClick={() => handleActivateSchedule(schedule.id)}
                                disabled={loading}
                              >
                                {t('streamScheduler.activate')}
                              </button>
                            )}
                            <button
                              className="primary"
                              onClick={() => handleStartSchedule(schedule.id)}
                              disabled={loading}
                            >
                              {t('streamScheduler.startNow')}
                            </button>
                            <button
                              className="danger"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              disabled={loading}
                            >
                              {t('streamScheduler.delete')}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <h3>{t('streamScheduler.noSchedules')}</h3>
                        <p>{t('streamScheduler.createScheduleHint')}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="schedule-form">
                  <h3>{t('streamScheduler.createNewSchedule')}</h3>
                  <div className="form-group">
                    <label>{t('streamScheduler.scheduleName')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t('streamScheduler.scheduleNamePlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('streamScheduler.description')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder={t('streamScheduler.descriptionPlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('streamScheduler.startTime')}</label>
                    <input
                      type="datetime-local"
                      value={formData.startTime.toISOString().slice(0, 16)}
                      onChange={(e) => handleInputChange('startTime', new Date(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('streamScheduler.durationMinutes')}</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                      min="1"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      className="secondary"
                      onClick={() => setShowCreateForm(false)}
                      disabled={loading}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="primary"
                      onClick={handleCreateSchedule}
                      disabled={loading || !formData.name}
                    >
                      {t('common.create')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="stream-scheduler-section active">
              <div className="history-list">
                {history.length > 0 ? (
                  history.map(item => (
                    <div key={item.id} className={`history-item ${item.status}`}>
                      <div className="history-item-info">
                        <div className="history-item-name">{item.scheduleName}</div>
                        <div className="history-item-meta">
                          {t('streamScheduler.scheduled')}: {formatDate(item.scheduledStartTime)}
                        </div>
                      </div>
                      <span className="history-item-status">
                        {t(`streamScheduler.status.${item.status}`)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <h3>{t('streamScheduler.noHistory')}</h3>
                    <p>{t('streamScheduler.historyHint')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="stream-scheduler-section active">
              <div className="settings-section">
                <div className="setting-group">
                  <h3>{t('streamScheduler.generalSettings')}</h3>
                  <div className="setting-row">
                    <label>{t('streamScheduler.enabled')}</label>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleUpdateConfig('enabled', e.target.checked)}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('streamScheduler.autoStart')}</label>
                    <input
                      type="checkbox"
                      checked={config.autoStart}
                      onChange={(e) => handleUpdateConfig('autoStart', e.target.checked)}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('streamScheduler.timezone')}</label>
                    <select
                      value={config.timezone}
                      onChange={(e) => handleUpdateConfig('timezone', e.target.value)}
                    >
                      <option value="UTC">{t('streamScheduler.utc')}</option>
                      <option value="America/New_York">{t('streamScheduler.est')}</option>
                      <option value="America/Los_Angeles">{t('streamScheduler.pst')}</option>
                      <option value="Europe/London">{t('streamScheduler.gmt')}</option>
                      <option value="Europe/Paris">{t('streamScheduler.cet')}</option>
                      <option value="Asia/Tokyo">{t('streamScheduler.jst')}</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>{t('streamScheduler.notificationSettings')}</h3>
                  <div className="setting-row">
                    <label>{t('streamScheduler.notificationsEnabled')}</label>
                    <input
                      type="checkbox"
                      checked={config.notifications.enabled}
                      onChange={(e) => handleUpdateConfig('notifications', { ...config.notifications, enabled: e.target.checked })}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('streamScheduler.notificationType')}</label>
                    <select
                      value={config.notifications.defaultType}
                      onChange={(e) => handleUpdateConfig('notifications', { ...config.notifications, defaultType: e.target.value as NotificationType })}
                    >
                      <option value="none">{t('streamScheduler.notificationTypes.none')}</option>
                      <option value="desktop">{t('streamScheduler.notificationTypes.desktop')}</option>
                      <option value="email">{t('streamScheduler.notificationTypes.email')}</option>
                      <option value="push">{t('streamScheduler.notificationTypes.push')}</option>
                      <option value="all">{t('streamScheduler.notificationTypes.all')}</option>
                    </select>
                  </div>
                </div>

                <div className="setting-group">
                  <h3>{t('streamScheduler.conflictDetection')}</h3>
                  <div className="setting-row">
                    <label>{t('streamScheduler.detectConflicts')}</label>
                    <input
                      type="checkbox"
                      checked={config.conflicts.detectionEnabled}
                      onChange={(e) => handleUpdateConfig('conflicts', { ...config.conflicts, detectionEnabled: e.target.checked })}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('streamScheduler.preventOverlapping')}</label>
                    <input
                      type="checkbox"
                      checked={config.conflicts.preventOverlapping}
                      onChange={(e) => handleUpdateConfig('conflicts', { ...config.conflicts, preventOverlapping: e.target.checked })}
                    />
                  </div>
                  <div className="setting-row">
                    <label>{t('streamScheduler.minimumGapMinutes')}</label>
                    <input
                      type="number"
                      value={config.conflicts.minimumGapMinutes}
                      onChange={(e) => handleUpdateConfig('conflicts', { ...config.conflicts, minimumGapMinutes: parseInt(e.target.value) || 15 })}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};