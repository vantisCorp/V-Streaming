import React, { useState, useCallback } from 'react';
import { useVTuberModel } from '../hooks/useVTuberModel';
import { useTracking } from '../hooks/useTracking';
import { useExpressions } from '../hooks/useExpressions';
import { useBodyTracking } from '../hooks/useBodyTracking';
import {
  ModelType,
  ModelStatus,
  TrackingStatus,
  TrackingProvider,
  TrackingQuality,
  ExpressionCategory,
  BlendShapeBinding,
  BodyTrackingMode,
  IKSolveMethod,
} from '../types/vtuber';
import { BodyTrackingPreview } from './BodyTrackingPreview';
import { ExpressionEditor } from './ExpressionEditor';
import { Marketplace } from './Marketplace';
import './VTuberStudio.css';

type TabType = 'models' | 'tracking' | 'expressions' | 'editor' | 'body' | 'marketplace' | 'settings';

/**
 * VTuberStudio Component
 * 
 * Unified dashboard for VTuber features including model management,
 * tracking configuration, and expression control.
 */
export const VTuberStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('models');
  
  // Hooks
  const model = useVTuberModel();
  const tracking = useTracking();
  const expressions = useExpressions();
  const bodyTracking = useBodyTracking();

  return (
    <div className="vtuber-studio">
      <div className="vtuber-header">
        <h2>🎭 VTuber Studio</h2>
        <div className="vtuber-status">
          <span className={`status-badge ${model.modelStatus.toLowerCase()}`}>
            {model.modelStatus}
          </span>
          <span className={`status-badge ${tracking.status.toLowerCase()}`}>
            {tracking.status}
          </span>
        </div>
      </div>

      <div className="vtuber-tabs">
        <button
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          📦 Models
        </button>
        <button
          className={`tab ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          🎯 Tracking
        </button>
        <button
          className={`tab ${activeTab === 'expressions' ? 'active' : ''}`}
          onClick={() => setActiveTab('expressions')}
        >
          😊 Expressions
        </button>
        <button
          className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          🎨 Editor
        </button>
        <button
          className={`tab ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          🏃 Body
        </button>
        <button
          className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          🛒 Marketplace
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="vtuber-content">
        {activeTab === 'models' && (
          <ModelsTab model={model} />
        )}
        {activeTab === 'tracking' && (
          <TrackingTab tracking={tracking} />
        )}
        {activeTab === 'expressions' && (
          <ExpressionsTab model={model} expressions={expressions} />
        )}
        {activeTab === 'editor' && (
          <ExpressionEditorTab />
        )}
        {activeTab === 'body' && (
          <BodyTrackingTab bodyTracking={bodyTracking} />
        )}
        {activeTab === 'marketplace' && (
          <MarketplaceTab />
        )}
        {activeTab === 'settings' && (
          <SettingsTab model={model} tracking={tracking} expressions={expressions} />
        )}
      </div>
    </div>
  );
};

// ============ Models Tab ============

interface ModelsTabProps {
  model: ReturnType<typeof useVTuberModel>;
}

const ModelsTab: React.FC<ModelsTabProps> = ({ model }) => {
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState<ModelType>(ModelType.VRM);
  const [newModelSource, setNewModelSource] = useState('');

  const handleLoadModel = useCallback(async () => {
    if (!newModelName || !newModelSource) return;

    try {
      await model.loadModel({
        id: `model_${Date.now()}`,
        name: newModelName,
        type: newModelType,
        source: newModelSource,
      });
      setShowLoadModal(false);
      setNewModelName('');
      setNewModelSource('');
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  }, [model, newModelName, newModelType, newModelSource]);

  return (
    <div className="models-tab">
      <div className="section-header">
        <h3>Loaded Models</h3>
        <button className="btn-primary" onClick={() => setShowLoadModal(true)}>
          + Load Model
        </button>
      </div>

      {model.models.length === 0 ? (
        <div className="empty-state">
          <p>No models loaded. Click "Load Model" to add a VTuber model.</p>
        </div>
      ) : (
        <div className="models-grid">
          {model.models.map((m) => (
            <div
              key={m.id}
              className={`model-card ${model.currentModel?.id === m.id ? 'active' : ''}`}
              onClick={() => model.switchModel(m.id)}
            >
              <div className="model-thumbnail">
                {m.thumbnail ? (
                  <img src={m.thumbnail} alt={m.name} />
                ) : (
                  <div className="model-placeholder">🎭</div>
                )}
              </div>
              <div className="model-info">
                <h4>{m.name}</h4>
                <span className="model-type">{m.type.toUpperCase()}</span>
              </div>
              {model.currentModel?.id === m.id && (
                <span className="active-badge">Active</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Load Model</h3>
            <div className="form-group">
              <label>Model Name</label>
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Enter model name"
              />
            </div>
            <div className="form-group">
              <label>Model Type</label>
              <select
                value={newModelType}
                onChange={(e) => setNewModelType(e.target.value as ModelType)}
              >
                <option value={ModelType.VRM}>VRM</option>
                <option value={ModelType.LIVE2D}>Live2D</option>
                <option value={ModelType.VRM_READY}>VRM-Ready</option>
                <option value={ModelType.CUSTOM}>Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Source URL/Path</label>
              <input
                type="text"
                value={newModelSource}
                onChange={(e) => setNewModelSource(e.target.value)}
                placeholder="Enter model file path or URL"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLoadModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleLoadModel}>
                Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Tracking Tab ============

interface TrackingTabProps {
  tracking: ReturnType<typeof useTracking>;
}

const TrackingTab: React.FC<TrackingTabProps> = ({ tracking }) => {
  const handleInitialize = useCallback(() => {
    tracking.initialize();
  }, [tracking]);

  const handleCalibrate = useCallback(() => {
    tracking.calibrate();
  }, [tracking]);

  return (
    <div className="tracking-tab">
      <div className="section-header">
        <h3>Tracking Configuration</h3>
      </div>

      <div className="tracking-controls">
        <div className="control-group">
          <label>Provider</label>
          <select
            value={tracking.config.provider}
            onChange={(e) => tracking.updateConfig({ provider: e.target.value as TrackingProvider })}
            disabled={tracking.isTracking}
          >
            <option value={TrackingProvider.MEDIAPIPE}>MediaPipe</option>
            <option value={TrackingProvider.WEBRTC}>WebRTC</option>
            <option value={TrackingProvider.FACE_API}>Face API</option>
            <option value={TrackingProvider.OPEN_SEE_FACE}>Open See Face</option>
            <option value={TrackingProvider.VMC}>VMC Protocol</option>
            <option value={TrackingProvider.CUSTOM}>Custom</option>
          </select>
        </div>

        <div className="control-group">
          <label>Quality</label>
          <select
            value={tracking.config.quality}
            onChange={(e) => tracking.updateConfig({ quality: e.target.value as TrackingQuality })}
            disabled={tracking.isTracking}
          >
            <option value={TrackingQuality.LOW}>Low (Better Performance)</option>
            <option value={TrackingQuality.MEDIUM}>Medium</option>
            <option value={TrackingQuality.HIGH}>High</option>
            <option value={TrackingQuality.ULTRA}>Ultra (Best Quality)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Smoothing: {Math.round(tracking.config.smoothing * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={tracking.config.smoothing * 100}
            onChange={(e) => tracking.updateConfig({ smoothing: parseInt(e.target.value) / 100 })}
          />
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={tracking.config.faceTrackingEnabled}
              onChange={(e) => tracking.updateConfig({ faceTrackingEnabled: e.target.checked })}
            />
            Face Tracking
          </label>
          <label>
            <input
              type="checkbox"
              checked={tracking.config.bodyTrackingEnabled}
              onChange={(e) => tracking.updateConfig({ bodyTrackingEnabled: e.target.checked })}
            />
            Body Tracking
          </label>
          <label>
            <input
              type="checkbox"
              checked={tracking.config.handTrackingEnabled}
              onChange={(e) => tracking.updateConfig({ handTrackingEnabled: e.target.checked })}
            />
            Hand Tracking
          </label>
        </div>
      </div>

      <div className="tracking-actions">
        {!tracking.isTracking ? (
          <button className="btn-primary" onClick={handleInitialize}>
            Start Tracking
          </button>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => tracking.stopTracking()}>
              Stop Tracking
            </button>
            {tracking.isPaused ? (
              <button className="btn-primary" onClick={() => tracking.resumeTracking()}>
                Resume
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => tracking.pauseTracking()}>
                Pause
              </button>
            )}
            <button className="btn-secondary" onClick={handleCalibrate}>
              Calibrate
            </button>
          </>
        )}
      </div>

      <div className="tracking-stats">
        <div className="stat-card">
          <span className="stat-label">FPS</span>
          <span className="stat-value">{tracking.stats.fps.toFixed(1)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Uptime</span>
          <span className="stat-value">{Math.floor(tracking.stats.uptime)}s</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Confidence</span>
          <span className="stat-value">
            {tracking.faceData ? `${(tracking.faceData.confidence * 100).toFixed(0)}%` : 'N/A'}
          </span>
        </div>
      </div>

      {tracking.faceData && (
        <div className="tracking-preview">
          <h4>Live Tracking Data</h4>
          <div className="blend-shape-preview">
            {Array.from(tracking.faceData.blendShapes.entries()).slice(0, 6).map(([key, value]) => (
              <div key={key} className="blend-shape-bar">
                <span className="blend-label">{key}</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${value * 100}%` }} />
                </div>
                <span className="blend-value">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Expressions Tab ============

interface ExpressionsTabProps {
  model: ReturnType<typeof useVTuberModel>;
  expressions: ReturnType<typeof useExpressions>;
}

const ExpressionsTab: React.FC<ExpressionsTabProps> = ({ model, expressions }) => {
  const handleExpressionClick = useCallback((expressionId: string) => {
    expressions.triggerExpression(expressionId);
  }, [expressions]);

  return (
    <div className="expressions-tab">
      <div className="section-header">
        <h3>Expressions</h3>
        <div className="auto-blink-toggle">
          <label>
            <input
              type="checkbox"
              checked={expressions.autoBlinkEnabled}
              onChange={(e) => expressions.enableAutoBlink(e.target.checked)}
            />
            Auto Blink
          </label>
          <button className="btn-small" onClick={() => expressions.blink()}>
            Blink Now
          </button>
        </div>
      </div>

      <div className="expressions-grid">
        {model.expressions.map((expr) => (
          <button
            key={expr.id}
            className={`expression-btn ${expressions.currentExpression?.id === expr.id ? 'active' : ''}`}
            onClick={() => handleExpressionClick(expr.id)}
          >
            <span className="expression-icon">
              {expr.category === 'happy' && '😊'}
              {expr.category === 'sad' && '😢'}
              {expr.category === 'angry' && '😠'}
              {expr.category === 'surprised' && '😮'}
              {expr.category === 'neutral' && '😐'}
              {!['happy', 'sad', 'angry', 'surprised', 'neutral'].includes(expr.category) && '🎭'}
            </span>
            <span className="expression-name">{expr.name}</span>
          </button>
        ))}
      </div>

      <div className="expression-history">
        <h4>Recent Expressions</h4>
        {expressions.history.length === 0 ? (
          <p className="empty-history">No expressions triggered yet</p>
        ) : (
          <div className="history-list">
            {expressions.history.slice(0, 10).map((expr, index) => (
              <span key={`${expr.id}-${index}`} className="history-item">
                {expr.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h4>Quick Categories</h4>
        <div className="category-buttons">
          <button onClick={() => expressions.triggerByCategory(ExpressionCategory.HAPPY)}>
            😊 Happy
          </button>
          <button onClick={() => expressions.triggerByCategory(ExpressionCategory.SAD)}>
            😢 Sad
          </button>
          <button onClick={() => expressions.triggerByCategory(ExpressionCategory.ANGRY)}>
            😠 Angry
          </button>
          <button onClick={() => expressions.triggerByCategory(ExpressionCategory.SURPRISED)}>
            😮 Surprised
          </button>
          <button onClick={() => expressions.resetToNeutral()}>
            😐 Neutral
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Settings Tab ============

interface SettingsTabProps {
  model: ReturnType<typeof useVTuberModel>;
  tracking: ReturnType<typeof useTracking>;
  expressions: ReturnType<typeof useExpressions>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ model, tracking, expressions }) => {
  const currentModel = model.currentModel;

  const handleModelConfigChange = useCallback((key: string, value: unknown) => {
    if (currentModel) {
      model.updateModelConfig(currentModel.id, { [key]: value });
    }
  }, [model, currentModel]);

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Model Settings</h3>
        {currentModel ? (
          <>
            <div className="control-group">
              <label>Scale: {currentModel.scale.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={currentModel.scale}
                onChange={(e) => handleModelConfigChange('scale', parseFloat(e.target.value))}
              />
            </div>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={currentModel.physicsEnabled}
                  onChange={(e) => handleModelConfigChange('physicsEnabled', e.target.checked)}
                />
                Enable Physics
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={currentModel.lookAtEnabled}
                  onChange={(e) => handleModelConfigChange('lookAtEnabled', e.target.checked)}
                />
                Eye Look At
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={currentModel.autoBlinkEnabled}
                  onChange={(e) => handleModelConfigChange('autoBlinkEnabled', e.target.checked)}
                />
                Auto Blink
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={currentModel.lipSyncEnabled}
                  onChange={(e) => handleModelConfigChange('lipSyncEnabled', e.target.checked)}
                />
                Lip Sync
              </label>
            </div>
            <div className="control-group">
              <label>Auto Blink Interval: {currentModel.autoBlinkInterval}ms</label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={currentModel.autoBlinkInterval}
                onChange={(e) => handleModelConfigChange('autoBlinkInterval', parseInt(e.target.value))}
              />
            </div>
          </>
        ) : (
          <p className="no-model">No model loaded</p>
        )}
      </div>

      <div className="settings-section">
        <h3>Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Models Loaded</span>
            <span className="stat-value">{model.statistics.modelsLoaded}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Expressions Triggered</span>
            <span className="stat-value">{model.statistics.expressionsTriggered}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tracking Uptime</span>
            <span className="stat-value">{Math.floor(model.statistics.trackingUptime)}s</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average FPS</span>
            <span className="stat-value">{model.statistics.averageTrackingFPS.toFixed(1)}</span>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => model.resetStatistics()}>
          Reset Statistics
        </button>
      </div>

      <div className="settings-section">
        <h3>Export / Import</h3>
        <div className="export-actions">
          <button className="btn-secondary">Export Configuration</button>
          <button className="btn-secondary">Import Configuration</button>
        </div>
      </div>
    </div>
  );
};

// ============ Expression Editor Tab ============

const ExpressionEditorTab: React.FC = () => {
  return (
    <div className="expression-editor-tab">
      <ExpressionEditor />
    </div>
  );
};

// ============ Marketplace Tab ============

const MarketplaceTab: React.FC = () => {
  return (
    <div className="marketplace-tab">
      <Marketplace />
    </div>
  );
};

// ============ Body Tracking Tab ============

interface BodyTrackingTabProps {
  bodyTracking: ReturnType<typeof useBodyTracking>;
}

const BodyTrackingTab: React.FC<BodyTrackingTabProps> = ({ bodyTracking }) => {
  const handleStartTracking = useCallback(() => {
    bodyTracking.startTracking();
  }, [bodyTracking]);

  const handleCalibrate = useCallback(() => {
    bodyTracking.calibrate('t-pose');
  }, [bodyTracking]);

  return (
    <div className="body-tracking-tab">
      <div className="section-header">
        <h3>Full Body Tracking</h3>
      </div>

      <div className="tracking-controls">
        <div className="control-group">
          <label>Tracking Mode</label>
          <select
            value={bodyTracking.config.mode}
            onChange={(e) => bodyTracking.updateConfig({ mode: e.target.value as BodyTrackingMode })}
            disabled={bodyTracking.isTracking}
          >
            <option value={BodyTrackingMode.FULL_BODY}>Full Body</option>
            <option value={BodyTrackingMode.UPPER_BODY}>Upper Body</option>
            <option value={BodyTrackingMode.HANDS_ONLY}>Hands Only</option>
            <option value={BodyTrackingMode.FACE_AND_HANDS}>Face and Hands</option>
          </select>
        </div>

        <div className="control-group">
          <label>IK Method</label>
          <select
            value={bodyTracking.config.ikMethod}
            onChange={(e) => bodyTracking.updateConfig({ ikMethod: e.target.value as IKSolveMethod })}
          >
            <option value={IKSolveMethod.FABRIK}>FABRIK</option>
            <option value={IKSolveMethod.CCD_IK}>CCD IK</option>
            <option value={IKSolveMethod.TWO_BONE}>Two Bone</option>
            <option value={IKSolveMethod.ANALYTICAL}>Analytical</option>
          </select>
        </div>

        <div className="control-group">
          <label>Smoothing: {Math.round(bodyTracking.config.smoothing * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={bodyTracking.config.smoothing * 100}
            onChange={(e) => bodyTracking.updateConfig({ smoothing: parseInt(e.target.value) / 100 })}
          />
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={bodyTracking.config.ikEnabled}
              onChange={(e) => bodyTracking.updateConfig({ ikEnabled: e.target.checked })}
            />
            Enable IK
          </label>
          <label>
            <input
              type="checkbox"
              checked={bodyTracking.config.shoulderIKEnabled}
              onChange={(e) => bodyTracking.updateConfig({ shoulderIKEnabled: e.target.checked })}
            />
            Shoulder IK
          </label>
          <label>
            <input
              type="checkbox"
              checked={bodyTracking.config.armIKEnabled}
              onChange={(e) => bodyTracking.updateConfig({ armIKEnabled: e.target.checked })}
            />
            Arm IK
          </label>
          <label>
            <input
              type="checkbox"
              checked={bodyTracking.config.legIKEnabled}
              onChange={(e) => bodyTracking.updateConfig({ legIKEnabled: e.target.checked })}
            />
            Leg IK
          </label>
        </div>
      </div>

      <div className="tracking-actions">
        {!bodyTracking.isTracking ? (
          <button className="btn-primary" onClick={handleStartTracking}>
            Start Body Tracking
          </button>
        ) : (
          <>
            <button className="btn-secondary" onClick={() => bodyTracking.stopTracking()}>
              Stop Tracking
            </button>
            {bodyTracking.isPaused ? (
              <button className="btn-primary" onClick={() => bodyTracking.resumeTracking()}>
                Resume
              </button>
            ) : (
              <button className="btn-secondary" onClick={() => bodyTracking.pauseTracking()}>
                Pause
              </button>
            )}
            <button className="btn-secondary" onClick={handleCalibrate}>
              Calibrate (T-Pose)
            </button>
          </>
        )}
      </div>

      <div className="body-tracking-content">
        <div className="preview-section">
          <h4>Body Preview</h4>
          <BodyTrackingPreview
            pose={bodyTracking.currentPose}
            width={300}
            height={450}
            showLandmarks={true}
            showSkeleton={true}
            showConfidence={true}
          />
        </div>

        <div className="stats-section">
          <h4>Tracking Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">FPS</span>
              <span className="stat-value">{bodyTracking.statistics.averageFPS.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">
                {(bodyTracking.statistics.averageConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tracking Time</span>
              <span className="stat-value">{Math.floor(bodyTracking.statistics.trackingTime)}s</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">IK Solves</span>
              <span className="stat-value">{bodyTracking.statistics.ikSolveCount}</span>
            </div>
          </div>

          {bodyTracking.isCalibrated && bodyTracking.calibration && (
            <div className="calibration-info">
              <h4>Calibration Data</h4>
              <div className="calibration-stats">
                <span>User Height: {(bodyTracking.calibration.userHeight * 100).toFixed(0)}cm</span>
                <span>Arm Span: {(bodyTracking.calibration.armSpan * 100).toFixed(0)}cm</span>
                <span>Shoulder Width: {(bodyTracking.calibration.shoulderWidth * 100).toFixed(0)}cm</span>
              </div>
            </div>
          )}

          <button className="btn-secondary" onClick={() => bodyTracking.resetStatistics()}>
            Reset Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default VTuberStudio;