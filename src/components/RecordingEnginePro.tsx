/**
 * Recording Engine Pro Component
 * Professional recording interface with multiple tabs and controls
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecordingEnginePro } from '../hooks/useRecordingEnginePro';
import {
  RecordingMode,
  RecordingFormat,
  RecordingQuality,
  VideoCodec,
  AudioCodec,
  AudioRecordingMode,
  RecordingCategory,
  SplitMode,
  ReplayBufferStatus,
} from '../types/recordingEnginePro';
import './RecordingEnginePro.css';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface RecordingControlProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isRecording: boolean;
  isPaused: boolean;
  canRecord: boolean;
  canPause: boolean;
  canResume: boolean;
  canStop: boolean;
  stats: any;
}

const RecordingControls: React.FC<RecordingControlProps> = ({
  onStart,
  onPause,
  onResume,
  onStop,
  isRecording,
  isPaused,
  canRecord,
  canPause,
  canResume,
  canStop,
  stats,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="recording-controls">
      <div className="recording-status-indicator">
        {isRecording && (
          <div className="rec-dot recording"></div>
        )}
        <span className="recording-timer">
          {stats.formatDuration(stats.duration)}
        </span>
      </div>
      
      <div className="control-buttons">
        {!isRecording || (isRecording && !isPaused) ? (
          <button
            className="btn btn-record"
            onClick={onStart}
            disabled={!canRecord}
          >
            <span className="btn-icon">●</span>
            {t('recordingEnginePro.record')}
          </button>
        ) : null}
        
        {canPause && (
          <button
            className="btn btn-pause"
            onClick={onPause}
            disabled={!canPause}
          >
            <span className="btn-icon">⏸</span>
            {t('recordingEnginePro.pause')}
          </button>
        )}
        
        {canResume && (
          <button
            className="btn btn-resume"
            onClick={onResume}
          >
            <span className="btn-icon">▶</span>
            {t('recordingEnginePro.resume')}
          </button>
        )}
        
        {canStop && (
          <button
            className="btn btn-stop"
            onClick={onStop}
          >
            <span className="btn-icon">■</span>
            {t('recordingEnginePro.stop')}
          </button>
        )}
      </div>
      
      <div className="recording-info">
        <div className="info-item">
          <span className="info-label">{t('recordingEnginePro.fileSize')}:</span>
          <span className="info-value">{stats.formatFileSize(stats.fileSize)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">{t('recordingEnginePro.bitrate')}:</span>
          <span className="info-value">{stats.bitrate} kbps</span>
        </div>
        <div className="info-item">
          <span className="info-label">{t('recordingEnginePro.fps')}:</span>
          <span className="info-value">{stats.frameRate.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface RecordingEngineProProps {
  onClose?: () => void;
}

const RecordingEnginePro: React.FC<RecordingEngineProProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    currentSession,
    stats,
    settings,
    presets,
    recordings,
    diskInfo,
    replayBufferStatus,
    replayBufferConfig,
    
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    
    startReplayBuffer,
    stopReplayBuffer,
    saveReplayBuffer,
    
    setConfiguration,
    
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    
    updateSettings,
    
    deleteRecording,
    
    setReplayBufferConfig,
    
    calculateEstimatedSize,
    formatFileSize,
    formatDuration,
    
    isRecording,
    isPaused,
    canRecord,
    canPause,
    canResume,
    canStop,
  } = useRecordingEnginePro();
  
  const [activeTab, setActiveTab] = useState('recording');
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  
  // ==========================================================================
  // TABS
  // ==========================================================================
  
  const tabs = [
    { id: 'recording', label: t('recordingEnginePro.tabs.recording'), icon: '●' },
    { id: 'presets', label: t('recordingEnginePro.tabs.presets'), icon: '⚙' },
    { id: 'replay', label: t('recordingEnginePro.tabs.replay'), icon: '↺' },
    { id: 'recordings', label: t('recordingEnginePro.tabs.recordings'), icon: '📁' },
  ];
  
  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  
  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const handleSaveReplay = async () => {
    try {
      await saveReplayBuffer();
    } catch (error) {
      console.error('Failed to save replay:', error);
    }
  };
  
  const handleApplyPreset = (presetId: string) => {
    applyPreset(presetId);
  };
  
  const handleDeleteRecording = (recordingId: string) => {
    if (window.confirm(t('recordingEnginePro.confirmDelete'))) {
      deleteRecording(recordingId);
    }
  };
  
  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  return (
    <div className="recording-engine-pro">
      <div className="recording-header">
        <h2>{t('recordingEnginePro.title')}</h2>
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="recording-tabs">
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
      
      <div className="recording-content">
        {activeTab === 'recording' && (
          <div className="tab-content recording-tab">
            <RecordingControls
              onStart={handleStartRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
              isRecording={isRecording}
              isPaused={isPaused}
              canRecord={canRecord}
              canPause={canPause}
              canResume={canResume}
              canStop={canStop}
              stats={{ ...stats, formatDuration, formatFileSize }}
            />
            
            <div className="recording-sections">
              {/* Video Settings */}
              <div className="section">
                <h3>{t('recordingEnginePro.videoSettings')}</h3>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.format')}</label>
                  <select
                    value={config.file.format}
                    onChange={(e) => setConfiguration({
                      ...config,
                      file: { ...config.file, format: e.target.value as RecordingFormat }
                    })}
                  >
                    {Object.values(RecordingFormat).map(format => (
                      <option key={format} value={format}>{format.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.quality')}</label>
                  <select
                    value={config.video.quality}
                    onChange={(e) => setConfiguration({
                      ...config,
                      video: { ...config.video, quality: e.target.value as RecordingQuality }
                    })}
                  >
                    {Object.values(RecordingQuality).map(quality => (
                      <option key={quality} value={quality}>
                        {t(`recordingEnginePro.quality.${quality}`)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.codec')}</label>
                  <select
                    value={config.video.codec}
                    onChange={(e) => setConfiguration({
                      ...config,
                      video: { ...config.video, codec: e.target.value as VideoCodec }
                    })}
                  >
                    {Object.values(VideoCodec).map(codec => (
                      <option key={codec} value={codec}>{codec}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.bitrate')} (kbps)</label>
                  <input
                    type="number"
                    min="1000"
                    max="50000"
                    step="500"
                    value={config.video.bitrate}
                    onChange={(e) => setConfiguration({
                      ...config,
                      video: { ...config.video, bitrate: parseInt(e.target.value) }
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.resolution')}</label>
                  <div className="resolution-inputs">
                    <input
                      type="number"
                      value={config.video.resolution.width}
                      onChange={(e) => setConfiguration({
                        ...config,
                        video: {
                          ...config.video,
                          resolution: { ...config.video.resolution, width: parseInt(e.target.value) }
                        }
                      })}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      value={config.video.resolution.height}
                      onChange={(e) => setConfiguration({
                        ...config,
                        video: {
                          ...config.video,
                          resolution: { ...config.video.resolution, height: parseInt(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.frameRate')}</label>
                  <input
                    type="number"
                    min="15"
                    max="144"
                    step="1"
                    value={config.video.resolution.frameRate}
                    onChange={(e) => setConfiguration({
                      ...config,
                      video: {
                        ...config.video,
                        resolution: { ...config.video.resolution, frameRate: parseInt(e.target.value) }
                      }
                    })}
                  />
                </div>
              </div>
              
              {/* Audio Settings */}
              <div className="section">
                <h3>{t('recordingEnginePro.audioSettings')}</h3>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.audioCodec')}</label>
                  <select
                    value={config.audio.codec}
                    onChange={(e) => setConfiguration({
                      ...config,
                      audio: { ...config.audio, codec: e.target.value as AudioCodec }
                    })}
                  >
                    {Object.values(AudioCodec).map(codec => (
                      <option key={codec} value={codec}>{codec}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.audioBitrate')} (kbps)</label>
                  <input
                    type="number"
                    min="64"
                    max="320"
                    step="32"
                    value={config.audio.bitrate}
                    onChange={(e) => setConfiguration({
                      ...config,
                      audio: { ...config.audio, bitrate: parseInt(e.target.value) }
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.audioMode')}</label>
                  <select
                    value={config.audio.mode}
                    onChange={(e) => setConfiguration({
                      ...config,
                      audio: { ...config.audio, mode: e.target.value as AudioRecordingMode }
                    })}
                  >
                    {Object.values(AudioRecordingMode).map(mode => (
                      <option key={mode} value={mode}>
                        {t(`recordingEnginePro.audioMode.${mode}`)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.audio.normalizeAudio}
                      onChange={(e) => setConfiguration({
                        ...config,
                        audio: { ...config.audio, normalizeAudio: e.target.checked }
                      })}
                    />
                    {t('recordingEnginePro.normalizeAudio')}
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.audio.noiseReduction}
                      onChange={(e) => setConfiguration({
                        ...config,
                        audio: { ...config.audio, noiseReduction: e.target.checked }
                      })}
                    />
                    {t('recordingEnginePro.noiseReduction')}
                  </label>
                </div>
              </div>
              
              {/* File Settings */}
              <div className="section">
                <h3>{t('recordingEnginePro.fileSettings')}</h3>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.directory')}</label>
                  <input
                    type="text"
                    value={config.file.directory}
                    onChange={(e) => setConfiguration({
                      ...config,
                      file: { ...config.file, directory: e.target.value }
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.category')}</label>
                  <select
                    value={config.file.category}
                    onChange={(e) => setConfiguration({
                      ...config,
                      file: { ...config.file, category: e.target.value as RecordingCategory }
                    })}
                  >
                    {Object.values(RecordingCategory).map(category => (
                      <option key={category} value={category}>
                        {t(`recordingEnginePro.category.${category}`)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.file.autoCompress}
                      onChange={(e) => setConfiguration({
                        ...config,
                        file: { ...config.file, autoCompress: e.target.checked }
                      })}
                    />
                    {t('recordingEnginePro.autoCompress')}
                  </label>
                </div>
              </div>
            </div>
            
            {/* Disk Info */}
            <div className="disk-info">
              <h4>{t('recordingEnginePro.diskInfo')}</h4>
              <div className="disk-usage-bar">
                <div
                  className="disk-usage-fill"
                  style={{ width: `${(diskInfo.usedSpace / diskInfo.totalSpace) * 100}%` }}
                ></div>
              </div>
              <div className="disk-stats">
                <span>{t('recordingEnginePro.freeSpace')}: {formatFileSize(diskInfo.freeSpace)}</span>
                <span>{t('recordingEnginePro.estimatedTime')}: {formatDuration(diskInfo.estimatedRecordTime)}</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'presets' && (
          <div className="tab-content presets-tab">
            <div className="presets-grid">
              {presets.map(preset => (
                <div key={preset.id} className="preset-card">
                  <h4>{preset.name}</h4>
                  <p className="preset-description">{preset.description}</p>
                  <div className="preset-info">
                    <span>{t('recordingEnginePro.quality')}: {t(`recordingEnginePro.quality.${preset.config.video.quality}`)}</span>
                    <span>{preset.config.video.bitrate} kbps</span>
                  </div>
                  <div className="preset-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleApplyPreset(preset.id)}
                    >
                      {t('recordingEnginePro.apply')}
                    </button>
                    {!preset.isBuiltIn && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm(t('recordingEnginePro.confirmDeletePreset'))) {
                            deletePreset(preset.id);
                          }
                        }}
                      >
                        {t('recordingEnginePro.delete')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'replay' && (
          <div className="tab-content replay-tab">
            <div className="replay-buffer-control">
              <h3>{t('recordingEnginePro.replayBuffer')}</h3>
              
              <div className="replay-status">
                <div className={`status-indicator ${replayBufferStatus}`}>
                  {t(`recordingEnginePro.replayStatus.${replayBufferStatus}`)}
                </div>
              </div>
              
              <div className="replay-controls">
                <button
                  className={`btn ${replayBufferStatus === ReplayBufferStatus.BUFFERING ? 'btn-danger' : ''}`}
                  onClick={replayBufferStatus === ReplayBufferStatus.BUFFERING ? stopReplayBuffer : startReplayBuffer}
                >
                  {replayBufferStatus === ReplayBufferStatus.BUFFERING
                    ? t('recordingEnginePro.stopBuffer')
                    : t('recordingEnginePro.startBuffer')}
                </button>
                
                <button
                  className="btn"
                  onClick={handleSaveReplay}
                  disabled={replayBufferStatus !== ReplayBufferStatus.BUFFERING}
                >
                  {t('recordingEnginePro.saveReplay')}
                </button>
              </div>
              
              <div className="replay-settings">
                <div className="form-group">
                  <label>{t('recordingEnginePro.bufferDuration')} (s)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={replayBufferConfig.duration}
                    onChange={(e) => setReplayBufferConfig({
                      ...replayBufferConfig,
                      duration: parseInt(e.target.value)
                    })}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('recordingEnginePro.bufferQuality')}</label>
                  <select
                    value={replayBufferConfig.quality}
                    onChange={(e) => setReplayBufferConfig({
                      ...replayBufferConfig,
                      quality: e.target.value as RecordingQuality
                    })}
                  >
                    {Object.values(RecordingQuality).map(quality => (
                      <option key={quality} value={quality}>
                        {t(`recordingEnginePro.quality.${quality}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'recordings' && (
          <div className="tab-content recordings-tab">
            <div className="recordings-list">
              {recordings.length === 0 ? (
                <div className="empty-state">
                  <p>{t('recordingEnginePro.noRecordings')}</p>
                </div>
              ) : (
                recordings.map(recording => (
                  <div key={recording.id} className="recording-item">
                    <div className="recording-thumbnail"></div>
                    <div className="recording-details">
                      <h4>{recording.filename}</h4>
                      <div className="recording-meta">
                        <span>{formatDuration(recording.duration)}</span>
                        <span>{formatFileSize(recording.fileSize)}</span>
                        <span>{recording.resolution.width}×{recording.resolution.height}</span>
                      </div>
                      <div className="recording-codecs">
                        <span>{recording.videoCodec}</span>
                        <span>{recording.audioCodec}</span>
                      </div>
                    </div>
                    <div className="recording-actions">
                      <button className="btn btn-sm">
                        {t('recordingEnginePro.play')}
                      </button>
                      <button className="btn btn-sm">
                        {t('recordingEnginePro.openFolder')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        {t('recordingEnginePro.delete')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingEnginePro;