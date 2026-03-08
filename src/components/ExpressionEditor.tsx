/**
 * ExpressionEditor - Custom expression editor for VTuber avatars
 * Supports blend shapes, layers, animations, and presets
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  CustomExpression,
  ExpressionCategory,
  BlendShapeBinding,
  ExpressionEditorTool,
  ExpressionBlendMode,
  EasingFunction,
  DEFAULT_EXPRESSION_EDITOR_CONFIG,
} from '../types/vtuber';
import { useExpressionEditor } from '../hooks/useExpressionEditor';
import './ExpressionEditor.css';

// Blend shape labels
const BLEND_SHAPE_LABELS: Record<BlendShapeBinding, string> = {
  [BlendShapeBinding.MOUTH_OPEN]: 'Mouth Open',
  [BlendShapeBinding.MOUTH_SMILE]: 'Smile',
  [BlendShapeBinding.EYE_BLINK_LEFT]: 'Left Eye Blink',
  [BlendShapeBinding.EYE_BLINK_RIGHT]: 'Right Eye Blink',
  [BlendShapeBinding.EYE_WIDE_LEFT]: 'Left Eye Wide',
  [BlendShapeBinding.EYE_WIDE_RIGHT]: 'Right Eye Wide',
  [BlendShapeBinding.BROW_UP_LEFT]: 'Left Brow Up',
  [BlendShapeBinding.BROW_UP_RIGHT]: 'Right Brow Up',
  [BlendShapeBinding.BROW_DOWN_LEFT]: 'Left Brow Down',
  [BlendShapeBinding.BROW_DOWN_RIGHT]: 'Right Brow Down',
  [BlendShapeBinding.CHEEK_PUFF]: 'Cheek Puff',
  [BlendShapeBinding.JAW_OPEN]: 'Jaw Open',
  [BlendShapeBinding.TONGUE_OUT]: 'Tongue Out',
  [BlendShapeBinding.CUSTOM]: 'Custom',
};

const CATEGORY_LABELS: Record<ExpressionCategory, string> = {
  [ExpressionCategory.NEUTRAL]: '😐 Neutral',
  [ExpressionCategory.HAPPY]: '😊 Happy',
  [ExpressionCategory.SAD]: '😢 Sad',
  [ExpressionCategory.ANGRY]: '😠 Angry',
  [ExpressionCategory.SURPRISED]: '😲 Surprised',
  [ExpressionCategory.RELAXED]: '😌 Relaxed',
  [ExpressionCategory.CUSTOM]: '⭐ Custom',
};

const BLEND_MODE_LABELS: Record<ExpressionBlendMode, string> = {
  [ExpressionBlendMode.NORMAL]: 'Normal',
  [ExpressionBlendMode.ADD]: 'Add',
  [ExpressionBlendMode.MULTIPLY]: 'Multiply',
  [ExpressionBlendMode.OVERRIDE]: 'Override',
};

const EASING_LABELS: Record<EasingFunction, string> = {
  [EasingFunction.LINEAR]: 'Linear',
  [EasingFunction.EASE_IN]: 'Ease In',
  [EasingFunction.EASE_OUT]: 'Ease Out',
  [EasingFunction.EASE_IN_OUT]: 'Ease In Out',
  [EasingFunction.BOUNCE]: 'Bounce',
  [EasingFunction.ELASTIC]: 'Elastic',
  [EasingFunction.BACK]: 'Back',
};

interface ExpressionEditorProps {
  onExpressionChange?: (expression: CustomExpression) => void;
  className?: string;
}

export const ExpressionEditor: React.FC<ExpressionEditorProps> = ({
  onExpressionChange,
  className = '',
}) => {
  const editor = useExpressionEditor();
  
  // Local state for new expression name
  const [newExpressionName, setNewExpressionName] = useState('');
  const [newExpressionCategory, setNewExpressionCategory] = useState(ExpressionCategory.CUSTOM);
  const [showNewExpressionModal, setShowNewExpressionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');

  // Blend shapes array
  const blendShapes = useMemo(() => {
    return Object.values(BlendShapeBinding).filter(b => b !== BlendShapeBinding.CUSTOM);
  }, []);

  // Create new expression
  const handleCreateExpression = useCallback(() => {
    if (!newExpressionName.trim()) return;
    editor.createExpression(newExpressionName.trim(), newExpressionCategory);
    setNewExpressionName('');
    setShowNewExpressionModal(false);
  }, [editor, newExpressionName, newExpressionCategory]);

  // Handle blend shape change
  const handleBlendShapeChange = useCallback((binding: BlendShapeBinding, value: number) => {
    editor.setBlendShape(binding, value);
    if (editor.currentExpression && onExpressionChange) {
      onExpressionChange(editor.currentExpression);
    }
  }, [editor, onExpressionChange]);

  // Handle save
  const handleSave = useCallback(() => {
    editor.saveExpression();
  }, [editor]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!editor.currentExpression) return;
    const data = editor.exportExpression(editor.currentExpression.id);
    if (data) {
      setExportData(data);
      setShowExportModal(true);
    }
  }, [editor]);

  // Handle apply preset
  const handleApplyPreset = useCallback((presetId: string) => {
    editor.applyPreset(presetId);
  }, [editor]);

  // Get blend shape value
  const getBlendShapeValue = useCallback((binding: BlendShapeBinding): number => {
    return editor.getBlendShape(binding);
  }, [editor]);

  // Format time
  const formatTime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  }, []);

  return (
    <div className={`expression-editor ${className}`}>
      {/* Header */}
      <div className="editor-header">
        <h2>🎨 Expression Editor</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowNewExpressionModal(true)}
          >
            + New Expression
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Expressions List */}
        <div className="expressions-panel">
          <div className="panel-header">
            <h3>Expressions</h3>
          </div>
          <div className="expressions-list">
            {editor.expressions.map(expression => (
              <div
                key={expression.id}
                className={`expression-item ${editor.currentExpression?.id === expression.id ? 'active' : ''}`}
                onClick={() => editor.loadExpression(expression.id)}
              >
                <div className="expression-icon">
                  {expression.category === ExpressionCategory.HAPPY ? '😊' :
                   expression.category === ExpressionCategory.SAD ? '😢' :
                   expression.category === ExpressionCategory.ANGRY ? '😠' :
                   expression.category === ExpressionCategory.SURPRISED ? '😲' :
                   expression.category === ExpressionCategory.RELAXED ? '😌' : '😐'}
                </div>
                <div className="expression-info">
                  <span className="expression-name">{expression.name}</span>
                  <span className="expression-category">{expression.category}</span>
                </div>
                {expression.isFavorite && <span className="favorite-star">⭐</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="main-editor">
          {editor.currentExpression ? (
            <>
              {/* Expression Info */}
              <div className="expression-info-bar">
                <input
                  type="text"
                  value={editor.currentExpression.name}
                  onChange={(e) => editor.updateExpression({ name: e.target.value })}
                  className="expression-name-input"
                  placeholder="Expression Name"
                />
                <select
                  value={editor.currentExpression.category}
                  onChange={(e) => editor.updateExpression({ category: e.target.value as ExpressionCategory })}
                  className="category-select"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  className={`btn btn-icon ${editor.currentExpression.isFavorite ? 'active' : ''}`}
                  onClick={() => editor.updateExpression({ isFavorite: !editor.currentExpression?.isFavorite })}
                  title="Toggle Favorite"
                >
                  {editor.currentExpression.isFavorite ? '⭐' : '☆'}
                </button>
              </div>

              {/* Blend Shapes */}
              <div className="blend-shapes-section">
                <h4>Blend Shapes</h4>
                <div className="blend-shapes-grid">
                  {blendShapes.map(binding => (
                    <div key={binding} className="blend-shape-control">
                      <label>{BLEND_SHAPE_LABELS[binding]}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={getBlendShapeValue(binding)}
                        onChange={(e) => handleBlendShapeChange(binding, parseFloat(e.target.value))}
                      />
                      <span className="value">{(getBlendShapeValue(binding) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className="presets-section">
                <h4>Quick Presets</h4>
                <div className="presets-grid">
                  {editor.presets.map(preset => (
                    <button
                      key={preset.id}
                      className="preset-btn"
                      onClick={() => handleApplyPreset(preset.id)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="editor-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => editor.undo()}
                  disabled={!editor.canUndo}
                >
                  ↩ Undo
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => editor.redo()}
                  disabled={!editor.canRedo}
                >
                  ↪ Redo
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={!editor.hasUnsavedChanges}
                >
                  💾 Save
                </button>
                <button className="btn btn-secondary" onClick={handleExport}>
                  📤 Export
                </button>
              </div>

              {editor.hasUnsavedChanges && (
                <div className="unsaved-indicator">
                  ⚠️ Unsaved changes
                </div>
              )}
            </>
          ) : (
            <div className="no-expression">
              <div className="placeholder-icon">🎨</div>
              <h3>No Expression Selected</h3>
              <p>Select an expression from the list or create a new one to start editing.</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowNewExpressionModal(true)}
              >
                + New Expression
              </button>
            </div>
          )}
        </div>

        {/* Layers Panel */}
        {editor.currentExpression && (
          <div className="layers-panel">
            <div className="panel-header">
              <h3>Layers</h3>
              <button
                className="btn btn-small"
                onClick={() => editor.addLayer()}
              >
                + Add
              </button>
            </div>
            <div className="layers-list">
              {editor.currentExpression.layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`layer-item ${editor.selectedLayerId === layer.id ? 'active' : ''}`}
                  onClick={() => editor.selectLayer(layer.id)}
                >
                  <div className="layer-visibility">
                    <button
                      className="btn btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        editor.updateLayer(layer.id, { visible: !layer.visible });
                      }}
                    >
                      {layer.visible ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => editor.updateLayer(layer.id, { name: e.target.value })}
                    className="layer-name-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="layer-actions">
                    <button
                      className="btn btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        editor.updateLayer(layer.id, { locked: !layer.locked });
                      }}
                    >
                      {layer.locked ? '🔒' : '🔓'}
                    </button>
                    {editor.currentExpression!.layers.length > 1 && (
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          editor.removeLayer(layer.id);
                        }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Animation Section */}
            <div className="animation-section">
              <div className="panel-header">
                <h3>Animation</h3>
                {!editor.currentExpression.animation && (
                  <button
                    className="btn btn-small"
                    onClick={() => editor.createAnimation()}
                  >
                    + Create
                  </button>
                )}
              </div>
              {editor.currentExpression.animation ? (
                <div className="animation-controls">
                  <div className="timeline">
                    <div className="timeline-bar">
                      <div
                        className="timeline-progress"
                        style={{ width: `${(editor.currentTime / editor.currentExpression.animation.duration) * 100}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={editor.currentExpression.animation.duration}
                      value={editor.currentTime}
                      onChange={(e) => editor.seekTo(parseInt(e.target.value))}
                      className="timeline-slider"
                    />
                  </div>
                  <div className="time-display">
                    {formatTime(editor.currentTime)} / {formatTime(editor.currentExpression.animation.duration)}
                  </div>
                  <div className="animation-actions">
                    <button
                      className="btn btn-icon"
                      onClick={() => editor.isPlaying ? editor.stopAnimation() : editor.playAnimation()}
                    >
                      {editor.isPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => editor.seekTo(0)}
                    >
                      ⏮
                    </button>
                    <button
                      className="btn btn-small"
                      onClick={() => {
                        const values = new Map(editor.currentExpression!.blendShapes);
                        editor.addKeyframe(editor.currentTime, values);
                      }}
                    >
                      + Keyframe
                    </button>
                  </div>
                  <div className="keyframes-list">
                    {editor.currentExpression.animation.keyframes.map(kf => (
                      <div
                        key={kf.id}
                        className={`keyframe-item ${editor.selectedKeyframeId === kf.id ? 'active' : ''}`}
                        onClick={() => editor.selectKeyframe(kf.id)}
                      >
                        <span className="keyframe-time">{formatTime(kf.time)}</span>
                        <select
                          value={kf.easing}
                          onChange={(e) => editor.updateKeyframe(kf.id, { easing: e.target.value as EasingFunction })}
                          className="easing-select"
                        >
                          {Object.entries(EASING_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-icon btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            editor.removeKeyframe(kf.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-animation">
                  <p>No animation</p>
                  <small>Create an animation to add keyframes</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Expression Modal */}
      {showNewExpressionModal && (
        <div className="modal-overlay" onClick={() => setShowNewExpressionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Expression</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newExpressionName}
                onChange={(e) => setNewExpressionName(e.target.value)}
                placeholder="Enter expression name..."
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newExpressionCategory}
                onChange={(e) => setNewExpressionCategory(e.target.value as ExpressionCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNewExpressionModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateExpression}
                disabled={!newExpressionName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Export Expression</h3>
            <div className="form-group">
              <label>JSON Data</label>
              <textarea
                value={exportData}
                readOnly
                rows={10}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(exportData);
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button className="btn btn-primary" onClick={() => setShowExportModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpressionEditor;