/**
 * V-Streaming Replay Buffer Controls Component
 * Dedicated controls for OBS replay buffer functionality
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import './ReplayBufferControls.css';

interface ReplayBufferControlsProps {
  onClose?: () => void;
}

export const ReplayBufferControls: React.FC<ReplayBufferControlsProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    isConnected,
    replayBufferStatus,
    startReplayBuffer,
    stopReplayBuffer,
    saveReplayBuffer,
  } = useOBSWebSocket();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startReplayBuffer();
    } catch (error) {
      console.error('Failed to start replay buffer:', error);
    }
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopReplayBuffer();
    } catch (error) {
      console.error('Failed to stop replay buffer:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveReplayBuffer();
      setLastSaveTime(new Date());
      setSaveCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to save replay buffer:', error);
    }
    setTimeout(() => setSaving(false), 1000);
  };

  if (!isConnected) {
    return (
      <div className="replay-buffer-controls">
        <div className="rbc-warning">
          <span className="rbc-warning-icon">⚠️</span>
          {t('obs.connectRequired', 'Connect to OBS to control replay buffer')}
        </div>
      </div>
    );
  }

  const isActive = replayBufferStatus?.outputActive;
  const duration = replayBufferStatus?.outputDuration || 0;
  const durationSeconds = Math.floor(duration / 1000);
  const durationFormatted = `${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="replay-buffer-controls">
      <div className="rbc-header">
        <div>
          <h2>{t('rbc.title', 'Replay Buffer')}</h2>
          <p className="rbc-subtitle">{t('rbc.subtitle', 'Capture and save recent gameplay moments')}</p>
        </div>
        {onClose && (
          <button className="rbc-close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {loading && <div className="rbc-loading-bar" />}

      <div className="rbc-stats">
        <div className="rbc-stat-card">
          <span className="rbc-stat-label">{t('rbc.status', 'Status')}</span>
          <div className="rbc-status-content">
            <span className={`rbc-status-dot ${isActive ? 'active' : ''}`}></span>
            <span className={`rbc-status-text ${isActive ? 'active' : ''}`}>
              {isActive ? t('rbc.recording', 'Recording') : t('rbc.stopped', 'Stopped')}
            </span>
          </div>
        </div>

        <div className="rbc-stat-card">
          <span className="rbc-stat-label">{t('rbc.bufferDuration', 'Buffer Duration')}</span>
          <span className="rbc-stat-value large">{durationFormatted}</span>
        </div>

        <div className="rbc-stat-card">
          <span className="rbc-stat-label">{t('rbc.savedReplays', 'Saved Replays')}</span>
          <span className="rbc-stat-value">{saveCount}</span>
        </div>
      </div>

      <div className="rbc-controls">
        {!isActive ? (
          <button
            className="rbc-btn primary large"
            onClick={handleStart}
            disabled={loading}
          >
            <span className="rbc-btn-icon">📼</span>
            {t('rbc.startBuffer', 'Start Replay Buffer')}
          </button>
        ) : (
          <div className="rbc-active-controls">
            <button
              className="rbc-btn danger"
              onClick={handleStop}
              disabled={loading}
            >
              <span className="rbc-btn-icon">⏹️</span>
              {t('common.stop', 'Stop')}
            </button>
            <button
              className="rbc-btn success large"
              onClick={handleSave}
              disabled={saving}
            >
              <span className="rbc-btn-icon">{saving ? '⏳' : '💾'}</span>
              {saving ? t('rbc.saving', 'Saving...') : t('rbc.saveReplay', 'Save Replay')}
            </button>
          </div>
        )}
      </div>

      {lastSaveTime && (
        <div className="rbc-last-save">
          <span className="rbc-last-save-icon">✅</span>
          {t('rbc.lastSaved', 'Last replay saved at')} {lastSaveTime.toLocaleTimeString()}
        </div>
      )}

      <div className="rbc-tips">
        <h4>{t('rbc.tips', 'Tips')}</h4>
        <ul>
          <li>{t('rbc.tip1', 'Replay buffer continuously records your gameplay in memory')}</li>
          <li>{t('rbc.tip2', 'Press "Save Replay" to keep the last few moments')}</li>
          <li>{t('rbc.tip3', 'Configure duration and format in OBS settings')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReplayBufferControls;