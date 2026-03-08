/**
 * V-Streaming Scene Collection Manager Component
 * Manage OBS scene collections
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';
import './SceneCollectionManager.css';

interface SceneCollectionManagerProps {
  onClose?: () => void;
}

export const SceneCollectionManager: React.FC<SceneCollectionManagerProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    isConnected,
    sceneCollections,
    currentSceneCollection,
    getSceneCollections,
    setCurrentSceneCollection,
    createSceneCollection,
  } = useOBSWebSocket();

  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadCollections();
    }
  }, [isConnected]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      await getSceneCollections();
    } catch (error) {
      console.error('Failed to load scene collections:', error);
    }
    setLoading(false);
  };

  const handleSwitchCollection = async (collectionName: string) => {
    if (collectionName === currentSceneCollection) return;
    setLoading(true);
    try {
      await setCurrentSceneCollection(collectionName);
    } catch (error) {
      console.error('Failed to switch collection:', error);
    }
    setLoading(false);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    setLoading(true);
    try {
      await createSceneCollection(newCollectionName.trim());
      setShowCreateDialog(false);
      setNewCollectionName('');
      await loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="scene-collection-manager">
        <div className="scm-warning">
          <span className="scm-warning-icon">⚠️</span>
          {t('obs.connectRequired', 'Connect to OBS to manage scene collections')}
        </div>
      </div>
    );
  }

  return (
    <div className="scene-collection-manager">
      <div className="scm-header">
        <div>
          <h2>{t('scm.title', 'Scene Collections')}</h2>
          <p className="scm-subtitle">{t('scm.subtitle', 'Switch between different scene setups')}</p>
        </div>
        <div className="scm-header-actions">
          <button className="scm-refresh-btn" onClick={loadCollections} disabled={loading}>
            🔄 {t('common.refresh', 'Refresh')}
          </button>
          <button
            className="scm-create-btn"
            onClick={() => setShowCreateDialog(true)}
            disabled={loading}
          >
            + {t('scm.new', 'New')}
          </button>
          {onClose && (
            <button className="scm-close-btn" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      {loading && <div className="scm-loading-bar" />}

      <div className="scm-collections">
        {sceneCollections.length === 0 ? (
          <div className="scm-empty">
            <span className="scm-empty-icon">📁</span>
            <p>{t('scm.noCollections', 'No scene collections found')}</p>
          </div>
        ) : (
          sceneCollections.map((collection: any) => {
            const name = collection.collectionName || collection;
            const isCurrent = name === currentSceneCollection || collection.current;
            return (
              <div
                key={name}
                className={`scm-collection-item ${isCurrent ? 'current' : ''}`}
              >
                <div className="scm-collection-info">
                  <span className="scm-collection-icon">📁</span>
                  <div className="scm-collection-details">
                    <span className="scm-collection-name">{name}</span>
                    {isCurrent && (
                      <span className="scm-current-badge">{t('scm.active', 'Active')}</span>
                    )}
                  </div>
                </div>
                <div className="scm-collection-actions">
                  {isCurrent ? (
                    <span className="scm-active-indicator">✓</span>
                  ) : (
                    <button
                      className="scm-btn"
                      onClick={() => handleSwitchCollection(name)}
                      disabled={loading}
                    >
                      {t('scm.switch', 'Switch')}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Collection Dialog */}
      {showCreateDialog && (
        <div className="scm-dialog-overlay">
          <div className="scm-dialog">
            <div className="scm-dialog-header">
              <h3>{t('scm.createCollection', 'Create New Collection')}</h3>
              <button className="scm-dialog-close" onClick={() => setShowCreateDialog(false)}>✕</button>
            </div>
            <div className="scm-dialog-content">
              <div className="scm-field">
                <label>{t('scm.collectionName', 'Collection Name')}</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder={t('scm.namePlaceholder', 'Enter collection name')}
                />
              </div>
            </div>
            <div className="scm-dialog-actions">
              <button className="scm-btn" onClick={() => setShowCreateDialog(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="scm-btn primary"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || loading}
              >
                {t('scm.create', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneCollectionManager;