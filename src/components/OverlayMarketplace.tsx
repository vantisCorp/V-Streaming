import React, { useState, useEffect, useMemo } from 'react';
import { useOverlay } from '../hooks/useOverlay';
import { useTranslation } from 'react-i18next';
import {
  OverlayTemplate,
  MarketplaceFilter,
  OVERLAY_CATEGORIES,
} from '../types/overlays';
import './OverlayMarketplace.css';

type TabType = 'marketplace' | 'installed' | 'create' | 'settings';

interface OverlayMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const OverlayMarketplace: React.FC<OverlayMarketplaceProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    templates,
    currentScene,
    createScene,
    installTemplate,
    deleteTemplate,
    fetchMarketplaceTemplates,
    getMarketplaceStats,
    updateSettings,
    settings,
  } = useOverlay();

  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'downloads'>('popular');
  const [filteredTemplates, setFilteredTemplates] = useState<OverlayTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OverlayTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalDownloads: 0,
    totalAuthors: 0,
    totalCategories: 0,
  });
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Gaming');
  const [newTemplateTags, setNewTemplateTags] = useState('');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory, sortBy]);

  const loadMarketplaceData = async () => {
    const marketplaceStats = await getMarketplaceStats();
    setStats(marketplaceStats);
    const allTemplates = await fetchMarketplaceTemplates();
    setFilteredTemplates(allTemplates);
  };

  const filterTemplates = async () => {
    const filter: MarketplaceFilter = {
      searchQuery,
      category: selectedCategory || undefined,
      sortBy,
    };
    const filtered = await fetchMarketplaceTemplates(filter);
    setFilteredTemplates(filtered);
  };

  const handleInstallTemplate = (template: OverlayTemplate) => {
    installTemplate(template);
    onClose();
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
  };

  const handleCreateTemplate = () => {
    if (!currentScene || !newTemplateName.trim()) return;
    // Template creation would be handled by the manager
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateTags('');
  };

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const renderMarketplaceTab = () => (
    <div className="marketplace-tab">
      <div className="marketplace-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('overlays.marketplace.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t('overlays.marketplace.allCategories')}</option>
            {OVERLAY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="popular">{t('overlays.marketplace.sort.popular')}</option>
            <option value="newest">{t('overlays.marketplace.sort.newest')}</option>
            <option value="rating">{t('overlays.marketplace.sort.rating')}</option>
            <option value="downloads">{t('overlays.marketplace.sort.downloads')}</option>
          </select>
        </div>
      </div>

      <div className="marketplace-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalTemplates}</span>
          <span className="stat-label">{t('overlays.marketplace.stats.templates')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatDownloads(stats.totalDownloads)}</span>
          <span className="stat-label">{t('overlays.marketplace.stats.downloads')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalAuthors}</span>
          <span className="stat-label">{t('overlays.marketplace.stats.authors')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalCategories}</span>
          <span className="stat-label">{t('overlays.marketplace.stats.categories')}</span>
        </div>
      </div>

      <div className="templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <p>{t('overlays.marketplace.noTemplates')}</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-preview">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} />
                ) : (
                  <div className="preview-placeholder">
                    <span>🎨</span>
                  </div>
                )}
                <div className="template-overlay">
                  <button
                    className="btn-preview"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreview(true);
                    }}
                  >
                    {t('overlays.marketplace.preview')}
                  </button>
                </div>
              </div>
              <div className="template-info">
                <h4>{template.name}</h4>
                <p className="template-author">{t('overlays.marketplace.by', { author: template.author })}</p>
                <div className="template-meta">
                  <div className="template-rating">
                    {renderStars(template.rating)}
                    <span className="rating-value">{template.rating.toFixed(1)}</span>
                  </div>
                  <span className="template-downloads">
                    {formatDownloads(template.downloads)} {t('overlays.marketplace.downloads')}
                  </span>
                </div>
                <div className="template-tags">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="template-actions">
                <button
                  className="btn-install"
                  onClick={() => handleInstallTemplate(template)}
                >
                  {t('overlays.marketplace.install')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showPreview && selectedTemplate && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedTemplate.name}</h3>
              <button className="btn-close" onClick={() => setShowPreview(false)}>
                ✕
              </button>
            </div>
            <div className="preview-content">
              <div className="preview-image">
                {selectedTemplate.preview ? (
                  <img src={selectedTemplate.preview} alt={selectedTemplate.name} />
                ) : (
                  <div className="preview-placeholder large">
                    <span>🎨</span>
                    <p>{t('overlays.marketplace.noPreview')}</p>
                  </div>
                )}
              </div>
              <div className="preview-details">
                <p className="description">{selectedTemplate.description}</p>
                <div className="details-grid">
                  <div className="detail">
                    <span className="label">{t('overlays.marketplace.details.author')}</span>
                    <span className="value">{selectedTemplate.author}</span>
                  </div>
                  <div className="detail">
                    <span className="label">{t('overlays.marketplace.details.version')}</span>
                    <span className="value">{selectedTemplate.version}</span>
                  </div>
                  <div className="detail">
                    <span className="label">{t('overlays.marketplace.details.category')}</span>
                    <span className="value">{selectedTemplate.category}</span>
                  </div>
                  <div className="detail">
                    <span className="label">{t('overlays.marketplace.details.rating')}</span>
                    <span className="value">{renderStars(selectedTemplate.rating)}</span>
                  </div>
                  <div className="detail">
                    <span className="label">{t('overlays.marketplace.details.downloads')}</span>
                    <span className="value">{formatDownloads(selectedTemplate.downloads)}</span>
                  </div>
                </div>
                <div className="preview-tags">
                  {selectedTemplate.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="preview-actions">
              <button
                className="btn-install"
                onClick={() => {
                  handleInstallTemplate(selectedTemplate);
                  setShowPreview(false);
                }}
              >
                {t('overlays.marketplace.installTemplate')}
              </button>
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInstalledTab = () => (
    <div className="installed-tab">
      <h3>{t('overlays.installed.title')}</h3>
      {templates.length === 0 ? (
        <div className="empty-state">
          <p>{t('overlays.installed.noInstalled')}</p>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('marketplace')}
          >
            {t('overlays.installed.browseMarketplace')}
          </button>
        </div>
      ) : (
        <div className="templates-list">
          {templates.map((template) => (
            <div key={template.id} className="installed-item">
              <div className="installed-preview">
                {template.thumbnail ? (
                  <img src={template.thumbnail} alt={template.name} />
                ) : (
                  <div className="preview-placeholder">
                    <span>🎨</span>
                  </div>
                )}
              </div>
              <div className="installed-info">
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div className="installed-meta">
                  <span className="category">{template.category}</span>
                  <span className="version">v{template.version}</span>
                </div>
              </div>
              <div className="installed-actions">
                <button
                  className="btn-primary"
                  onClick={() => handleInstallTemplate(template)}
                >
                  {t('overlays.installed.useTemplate')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  {t('overlays.installed.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="create-tab">
      <h3>{t('overlays.create.title')}</h3>
      {!currentScene ? (
        <div className="empty-state">
          <p>{t('overlays.create.noScene')}</p>
          <p>{t('overlays.create.selectSceneFirst')}</p>
        </div>
      ) : (
        <div className="create-form">
          <div className="form-group">
            <label>{t('overlays.create.name')}</label>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder={t('overlays.create.namePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label>{t('overlays.create.description')}</label>
            <textarea
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
              placeholder={t('overlays.create.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>{t('overlays.create.category')}</label>
            <select
              value={newTemplateCategory}
              onChange={(e) => setNewTemplateCategory(e.target.value)}
            >
              {OVERLAY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('overlays.create.tags')}</label>
            <input
              type="text"
              value={newTemplateTags}
              onChange={(e) => setNewTemplateTags(e.target.value)}
              placeholder={t('overlays.create.tagsPlaceholder')}
            />
            <span className="hint">{t('overlays.create.tagsHint')}</span>
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
            >
              {t('overlays.create.createTemplate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="settings-tab">
      <h3>{t('overlays.settings.title')}</h3>
      <div className="settings-section">
        <h4>{t('overlays.settings.general')}</h4>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enableOverlays}
              onChange={(e) => updateSettings({ enableOverlays: e.target.checked })}
            />
            {t('overlays.settings.enableOverlays')}
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
            />
            {t('overlays.settings.autoSave')}
          </label>
        </div>
        <div className="setting-item">
          <label>{t('overlays.settings.saveInterval')}</label>
          <input
            type="number"
            value={settings.saveInterval / 1000}
            onChange={(e) => updateSettings({ saveInterval: Number(e.target.value) * 1000 })}
            min={1}
            max={300}
          />
          <span className="hint">{t('overlays.settings.seconds')}</span>
        </div>
      </div>

      <div className="settings-section">
        <h4>{t('overlays.settings.backup')}</h4>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
            />
            {t('overlays.settings.autoBackup')}
          </label>
        </div>
        <div className="setting-item">
          <label>{t('overlays.settings.maxBackups')}</label>
          <input
            type="number"
            value={settings.maxBackups}
            onChange={(e) => updateSettings({ maxBackups: Number(e.target.value) })}
            min={1}
            max={50}
          />
        </div>
      </div>

      <div className="settings-section">
        <h4>{t('overlays.settings.preview')}</h4>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enablePreview}
              onChange={(e) => updateSettings({ enablePreview: e.target.checked })}
            />
            {t('overlays.settings.enablePreview')}
          </label>
        </div>
        <div className="setting-item">
          <label>{t('overlays.settings.previewQuality')}</label>
          <select
            value={settings.previewQuality}
            onChange={(e) => updateSettings({ previewQuality: e.target.value as 'low' | 'medium' | 'high' })}
          >
            <option value="low">{t('overlays.settings.quality.low')}</option>
            <option value="medium">{t('overlays.settings.quality.medium')}</option>
            <option value="high">{t('overlays.settings.quality.high')}</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h4>{t('overlays.settings.effects')}</h4>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enableEffects}
              onChange={(e) => updateSettings({ enableEffects: e.target.checked })}
            />
            {t('overlays.settings.enableEffects')}
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enableAnimations}
              onChange={(e) => updateSettings({ enableAnimations: e.target.checked })}
            />
            {t('overlays.settings.enableAnimations')}
          </label>
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="overlay-marketplace-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('overlays.title')}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            {t('overlays.tabs.marketplace')}
          </button>
          <button
            className={`tab ${activeTab === 'installed' ? 'active' : ''}`}
            onClick={() => setActiveTab('installed')}
          >
            {t('overlays.tabs.installed')}
          </button>
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            {t('overlays.tabs.create')}
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('overlays.tabs.settings')}
          </button>
        </div>
        <div className="modal-content">
          {activeTab === 'marketplace' && renderMarketplaceTab()}
          {activeTab === 'installed' && renderInstalledTab()}
          {activeTab === 'create' && renderCreateTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  );
};

export default OverlayMarketplace;