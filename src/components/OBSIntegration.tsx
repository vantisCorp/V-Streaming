import React, { useState, useEffect } from 'react';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import { OBSConnectionConfig, OBSConnectionStatus } from '../types/obsWebSocket';
import './OBSIntegration.css';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface OBSIntegrationProps {
  onClose?: () => void;
}

export const OBSIntegration: React.FC<OBSIntegrationProps> = ({ onClose }) => {
  const obs = useOBSWebSocket();
  const [activeTab, setActiveTab] = useState<'connection' | 'scenes' | 'stream' | 'recording' | 'inputs' | 'transitions'>('connection');
  const [connectionConfig, setConnectionConfig] = useState<OBSConnectionConfig>({
    address: '127.0.0.1',
    port: 4455,
    password: '',
    autoReconnect: true,
    reconnectInterval: 5000,
    eventSubscriptions: 0
  });
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    // Auto-connect if credentials are saved
    const savedConfig = localStorage.getItem('obs-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as OBSConnectionConfig;
        setConnectionConfig(config);
        // Don't auto-connect, let user connect manually
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  // ==========================================================================
  // CONNECTION HANDLERS
  // ==========================================================================

  const handleConnect = async () => {
    try {
      setError(null);
      await obs.connect(connectionConfig);
      localStorage.setItem('obs-config', JSON.stringify(connectionConfig));
    } catch (error: any) {
      setError(error.message || 'Failed to connect to OBS');
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await obs.disconnect();
    } catch (error: any) {
      setError(error.message || 'Failed to disconnect from OBS');
    }
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const renderConnectionTab = () => {
    return (
      <div className="obs-integration__connection-panel">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Connection Settings</h2>
        
        <div className="obs-integration__connection-form">
          <div className="obs-integration__form-group">
            <label className="obs-integration__label">Address</label>
            <input
              type="text"
              className="obs-integration__input"
              value={connectionConfig.address}
              onChange={(e) => setConnectionConfig({ ...connectionConfig, address: e.target.value })}
              placeholder="127.0.0.1"
            />
          </div>
          
          <div className="obs-integration__form-group">
            <label className="obs-integration__label">Port</label>
            <input
              type="number"
              className="obs-integration__input"
              value={connectionConfig.port}
              onChange={(e) => setConnectionConfig({ ...connectionConfig, port: parseInt(e.target.value) })}
              placeholder="4455"
            />
          </div>
          
          <div className="obs-integration__form-group">
            <label className="obs-integration__label">Password</label>
            <input
              type="password"
              className="obs-integration__input"
              value={connectionConfig.password}
              onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
              placeholder="OBS WebSocket password"
            />
          </div>
          
          <div className="obs-integration__form-group">
            <label className="obs-integration__label">Auto Reconnect</label>
            <input
              type="checkbox"
              checked={connectionConfig.autoReconnect}
              onChange={(e) => setConnectionConfig({ ...connectionConfig, autoReconnect: e.target.checked })}
              style={{ marginTop: 8 }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {obs.isConnected ? (
            <button className="obs-integration__button obs-integration__button--danger" onClick={handleDisconnect}>
              🔌 Disconnect
            </button>
          ) : (
            <button className="obs-integration__button obs-integration__button--primary" onClick={handleConnect}>
              🔌 Connect to OBS
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderScenesTab = () => {
    if (!obs.isConnected) {
      return (
        <div className="obs-integration__loading">
          <p>Connect to OBS to view scenes</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Scene Selector</h2>
        
        <div className="obs-integration__scene-selector">
          {obs.scenes.map((scene) => (
            <div
              key={scene.sceneName}
              className={`obs-integration__scene-card ${obs.currentScene === scene.sceneName ? 'obs-integration__scene-card--active' : ''}`}
              onClick={() => obs.switchScene(scene.sceneName)}
            >
              <div className="obs-integration__scene-card-icon">🎬</div>
              <h3 className="obs-integration__scene-card-name">{scene.sceneName}</h3>
              {obs.currentScene === scene.sceneName && (
                <div className="obs-integration__scene-card-status"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStreamTab = () => {
    if (!obs.isConnected) {
      return (
        <div className="obs-integration__loading">
          <p>Connect to OBS to control streaming</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Stream Control</h2>
        
        <div style={{ marginBottom: 24 }}>
          <div className="obs-integration__status-badge obs-integration__status-badge--active">
            <span className="obs-integration__status-indicator obs-integration__status-indicator--connected"></span>
            {obs.streamStatus?.outputActive ? 'Streaming Active' : 'Streaming Inactive'}
          </div>
        </div>
        
        {obs.streamStatus && (
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>Stream Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Duration</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {Math.floor(obs.streamStatus.outputDuration / 60)}m {Math.floor(obs.streamStatus.outputDuration % 60)}s
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Congestion</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {(obs.streamStatus.outputCongestion * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Dropped Frames</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {obs.streamStatus.outputSkippedFrames} / {obs.streamStatus.outputTotalFrames}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Bitrate</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {((obs.streamStatus.outputBytes * 8) / obs.streamStatus.outputDuration / 1000).toFixed(0)} kbps
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="obs-integration__controls-grid">
          <button
            className={`obs-integration__button ${obs.streamStatus?.outputActive ? 'obs-integration__button--danger' : 'obs-integration__button--success'}`}
            onClick={obs.toggleStream}
          >
            {obs.streamStatus?.outputActive ? '⏹️ Stop Streaming' : '▶️ Start Streaming'}
          </button>
        </div>
      </div>
    );
  };

  const renderRecordingTab = () => {
    if (!obs.isConnected) {
      return (
        <div className="obs-integration__loading">
          <p>Connect to OBS to control recording</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recording Control</h2>
        
        <div style={{ marginBottom: 24 }}>
          <div className={`obs-integration__status-badge ${obs.recordStatus?.outputActive ? 'obs-integration__status-badge--active' : 'obs-integration__status-badge--inactive'}`}>
            <span className={`obs-integration__status-indicator obs-integration__status-indicator--${obs.recordStatus?.outputActive ? 'connected' : 'disconnected'}`}></span>
            {obs.recordStatus?.outputActive ? 'Recording Active' : 'Recording Inactive'}
          </div>
        </div>
        
        {obs.recordStatus && obs.recordStatus.outputActive && (
          <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>Recording Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Duration</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {Math.floor(obs.recordStatus.outputDuration / 60)}m {Math.floor(obs.recordStatus.outputDuration % 60)}s
                </p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>Size</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0 0' }}>
                  {(obs.recordStatus.outputBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="obs-integration__controls-grid">
          <button
            className={`obs-integration__button ${obs.recordStatus?.outputActive ? 'obs-integration__button--danger' : 'obs-integration__button--success'}`}
            onClick={obs.toggleRecording}
          >
            {obs.recordStatus?.outputActive ? '⏹️ Stop Recording' : '▶️ Start Recording'}
          </button>
          
          {obs.recordStatus?.outputActive && !obs.recordStatus.outputPaused && (
            <button className="obs-integration__button obs-integration__button--primary" onClick={obs.pauseRecording}>
              ⏸️ Pause Recording
            </button>
          )}
          
          {obs.recordStatus?.outputPaused && (
            <button className="obs-integration__button obs-integration__button--success" onClick={() => obs.pauseRecording()}>
              ▶️ Resume Recording
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderInputsTab = () => {
    if (!obs.isConnected) {
      return (
        <div className="obs-integration__loading">
          <p>Connect to OBS to view inputs</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Audio Sources</h2>
        
        <div className="obs-integration__input-list">
          {obs.inputs.map((input) => (
            <div key={input.inputName} className="obs-integration__input-item">
              <div className="obs-integration__input-info">
                <div className="obs-integration__input-icon">🎙️</div>
                <div>
                  <h3 className="obs-integration__input-name">{input.inputName}</h3>
                  <p className="obs-integration__input-type">{input.inputKind}</p>
                </div>
              </div>
              
              <div className="obs-integration__input-controls">
                <button
                  className="obs-integration__button"
                  onClick={() => obs.toggleInputMute(input.inputName)}
                >
                  {input.inputMuted ? '🔇 Unmute' : '🔊 Mute'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTransitionsTab = () => {
    if (!obs.isConnected) {
      return (
        <div className="obs-integration__loading">
          <p>Connect to OBS to view transitions</p>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Transitions</h2>
        
        <div className="obs-integration__transition-list">
          {obs.transitions.map((transition) => (
            <div
              key={transition.transitionName}
              className={`obs-integration__transition-item ${obs.currentTransition?.transitionName === transition.transitionName ? 'obs-integration__transition-item--active' : ''}`}
              onClick={() => obs.setCurrentTransition(transition.transitionName)}
            >
              <h3 className="obs-integration__transition-name">{transition.transitionName}</h3>
              <p className="obs-integration__transition-type">{transition.transitionKind}</p>
              {obs.currentTransition?.transitionName === transition.transitionName && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                  Duration: {obs.currentTransition.transitionDuration}ms
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button
          className="obs-integration__button obs-integration__button--primary"
          onClick={obs.triggerTransition}
          style={{ marginTop: 24 }}
        >
          🔄 Trigger Transition
        </button>
      </div>
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="obs-integration">
      <div className="obs-integration__header">
        <h1 className="obs-integration__title">
          <span className="obs-integration__title-icon">🎥</span>
          OBS Integration
        </h1>
        
        <div className="obs-integration__connection-status">
          <span className={`obs-integration__status-indicator obs-integration__status-indicator--${obs.connectionStatus === OBSConnectionStatus.CONNECTED ? 'connected' : obs.connectionStatus === OBSConnectionStatus.CONNECTING ? 'connecting' : 'disconnected'}`}></span>
          {obs.connectionStatus}
        </div>

        {onClose && (
          <button
            className="obs-integration__close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        )}
      </div>
      
      {error && (
        <div className="obs-integration__error">
          <h3 className="obs-integration__error-title">Connection Error</h3>
          <p className="obs-integration__error-message">{error}</p>
        </div>
      )}
      
      <div className="obs-integration__tabs">
        <button
          className={`obs-integration__tab ${activeTab === 'connection' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('connection')}
        >
          🔌 Connection
        </button>
        <button
          className={`obs-integration__tab ${activeTab === 'scenes' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('scenes')}
        >
          🎬 Scenes
        </button>
        <button
          className={`obs-integration__tab ${activeTab === 'stream' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('stream')}
        >
          📺 Stream
        </button>
        <button
          className={`obs-integration__tab ${activeTab === 'recording' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('recording')}
        >
          ⏺️ Recording
        </button>
        <button
          className={`obs-integration__tab ${activeTab === 'inputs' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('inputs')}
        >
          🎙️ Audio
        </button>
        <button
          className={`obs-integration__tab ${activeTab === 'transitions' ? 'obs-integration__tab--active' : ''}`}
          onClick={() => setActiveTab('transitions')}
        >
          🔄 Transitions
        </button>
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'connection' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderConnectionTab()}
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'scenes' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderScenesTab()}
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'stream' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderStreamTab()}
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'recording' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderRecordingTab()}
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'inputs' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderInputsTab()}
      </div>
      
      <div className={`obs-integration__tab-content ${activeTab === 'transitions' ? 'obs-integration__tab-content--active' : ''}`}>
        {renderTransitionsTab()}
      </div>
    </div>
  );
};

export default OBSIntegration;