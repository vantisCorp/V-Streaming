import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePluginManager } from '../hooks/usePluginManager';
import {
  Plugin,
  PluginStatus,
  PluginType,
  PluginManifest,
  PluginSettingSchema,
} from '../types/plugin';
import './PluginManager.css';

interface PluginManagerProps {
  onClose: () => void;
}

type TabType = 'installed' | 'available' | 'settings' | 'statistics';

const PluginManager: React.FC<PluginManagerProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const {
    plugins,
    statistics,
    config,
    enablePlugin,
    disablePlugin,
    unregisterPlugin,
    updatePluginSettings,
    getPluginSettingsSchema,
    updateConfig,
  } = usePluginManager();
  
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PluginType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PluginStatus | 'all'>('all');
  const [editingSettings, setEditingSettings] = useState<Record<string, unknown>>({});
  
  // Filter plugins
  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.manifest.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || plugin.manifest.categories.includes(filterType);
    const matchesStatus = filterStatus === 'all' || plugin.state.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Handle plugin toggle
  const handleTogglePlugin = async (plugin: Plugin) => {
    try {
      if (plugin.state.status === PluginStatus.RUNNING) {
        await disablePlugin(plugin.manifest.id);
      } else {
        await enablePlugin(plugin.manifest.id);
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };
  
  // Handle plugin removal
  const handleRemovePlugin = async (pluginId: string) => {
    if (window.confirm(t('plugin.confirmRemove'))) {
      unregisterPlugin(pluginId);
      setSelectedPlugin(null);
    }
  };
  
  // Handle settings edit
  const handleOpenSettings = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setEditingSettings({ ...plugin.config.settings });
  };
  
  const handleSaveSettings = async () => {
    if (selectedPlugin) {
      await updatePluginSettings(selectedPlugin.manifest.id, editingSettings);
      setSelectedPlugin(null);
      setEditingSettings({});
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: PluginStatus): string => {
    switch (status) {
      case PluginStatus.RUNNING:
        return 'status-running';
      case PluginStatus.ENABLED:
        return 'status-enabled';
      case PluginStatus.ERROR:
        return 'status-error';
      case PluginStatus.DISABLED:
        return 'status-disabled';
      default:
        return 'status-installed';
    }
  };
  
  // Get type icon
  const getTypeIcon = (types: PluginType[]): string => {
    const icons: Record<PluginType, string> = {
      [PluginType.STREAMING_PLATFORM]: '📺',
      [PluginType.OVERLAY]: '🎨',
      [PluginType.WIDGET]: '🧩',
      [PluginType.ENCODER]: '⚙️',
      [PluginType.AUDIO_PROCESSOR]: '🎵',
      [PluginType.VIDEO_FILTER]: '🎬',
      [PluginType.CHATBOT]: '🤖',
      [PluginType.ANALYTICS]: '📊',
      [PluginType.MODERATION]: '🛡️',
      [PluginType.NOTIFICATION]: '🔔',
      [PluginType.INTEGRATION]: '🔗',
      [PluginType.THEME]: '🎭',
      [PluginType.UTILITY]: '🔧',
      [PluginType.CUSTOM]: '📦',
    };
    return icons[types[0]] || '📦';
  };
  
  // Render settings input based on schema
  const renderSettingInput = (schema: PluginSettingSchema, value: unknown) => {
    switch (schema.type) {
      case 'string':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: e.target.value })}
            placeholder={schema.description}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || 0}
            onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: Number(e.target.value) })}
            min={schema.validation?.min}
            max={schema.validation?.max}
          />
        );
      case 'boolean':
        return (
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        );
      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: e.target.value })}
          >
            {schema.options?.map(opt => (
              <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>
        );
      case 'color':
        return (
          <input
            type="color"
            value={(value as string) || '#000000'}
            onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: e.target.value })}
          />
        );
      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => setEditingSettings({ ...editingSettings, [schema.key]: e.target.value })}
          />
        );
    }
  };
  
  // Render tabs
  const renderTabs = () => (
    <div className="plugin-tabs">
      <button
        className={`tab-btn ${activeTab === 'installed' ? 'active' : ''}`}
        onClick={() => setActiveTab('installed')}
      >
        {t('plugin.tabs.installed')} ({plugins.length})
      </button>
      <button
        className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
        onClick={() => setActiveTab('available')}
      >
        {t('plugin.tabs.available')}
      </button>
      <button
        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        {t('plugin.tabs.settings')}
      </button>
      <button
        className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
        onClick={() => setActiveTab('statistics')}
      >
        {t('plugin.tabs.statistics')}
      </button>
    </div>
  );
  
  // Render plugin card
  const renderPluginCard = (plugin: Plugin) => (
    <div key={plugin.manifest.id} className="plugin-card">
      <div className="plugin-header">
        <div className="plugin-icon">{getTypeIcon(plugin.manifest.categories)}</div>
        <div className="plugin-info">
          <h3 className="plugin-name">{plugin.manifest.name}</h3>
          <p className="plugin-author">{t('plugin.by')} {plugin.manifest.author}</p>
        </div>
        <div className={`plugin-status ${getStatusBadgeClass(plugin.state.status)}`}>
          {t(`plugin.status.${plugin.state.status}`)}
        </div>
      </div>
      
      <p className="plugin-description">{plugin.manifest.description}</p>
      
      <div className="plugin-meta">
        <span className="plugin-version">v{plugin.manifest.version}</span>
        <span className="plugin-type">
          {plugin.manifest.categories.map(c => t(`plugin.types.${c}`)).join(', ')}
        </span>
      </div>
      
      <div className="plugin-actions">
        <button
          className={`btn ${plugin.state.status === PluginStatus.RUNNING ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => handleTogglePlugin(plugin)}
        >
          {plugin.state.status === PluginStatus.RUNNING 
            ? t('plugin.disable') 
            : t('plugin.enable')}
        </button>
        
        {plugin.manifest.hasSettings && (
          <button
            className="btn btn-secondary"
            onClick={() => handleOpenSettings(plugin)}
          >
            {t('plugin.settings')}
          </button>
        )}
        
        <button
          className="btn btn-danger"
          onClick={() => handleRemovePlugin(plugin.manifest.id)}
        >
          {t('plugin.remove')}
        </button>
      </div>
    </div>
  );
  
  // Render installed plugins
  const renderInstalledPlugins = () => (
    <div className="plugin-list">
      <div className="plugin-filters">
        <input
          type="text"
          className="search-input"
          placeholder={t('plugin.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PluginType | 'all')}
        >
          <option value="all">{t('plugin.allTypes')}</option>
          {Object.values(PluginType).map(type => (
            <option key={type} value={type}>{t(`plugin.types.${type}`)}</option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PluginStatus | 'all')}
        >
          <option value="all">{t('plugin.allStatuses')}</option>
          {Object.values(PluginStatus).map(status => (
            <option key={status} value={status}>{t(`plugin.status.${status}`)}</option>
          ))}
        </select>
      </div>
      
      <div className="plugin-grid">
        {filteredPlugins.length > 0 ? (
          filteredPlugins.map(renderPluginCard)
        ) : (
          <div className="no-plugins">
            <p>{t('plugin.noPlugins')}</p>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render available plugins (marketplace placeholder)
  const renderAvailablePlugins = () => (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h3>{t('plugin.marketplace.title')}</h3>
        <p>{t('plugin.marketplace.description')}</p>
      </div>
      
      <div className="marketplace-coming-soon">
        <span className="icon">🛒</span>
        <h4>{t('plugin.marketplace.comingSoon')}</h4>
        <p>{t('plugin.marketplace.comingSoonDescription')}</p>
      </div>
    </div>
  );
  
  // Render settings
  const renderSettings = () => (
    <div className="plugin-settings-tab">
      <h3>{t('plugin.managerSettings')}</h3>
      
      <div className="settings-group">
        <label className="setting-item">
          <span>{t('plugin.settings.autoLoadPlugins')}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.autoLoadPlugins}
              onChange={(e) => updateConfig({ autoLoadPlugins: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </label>
        
        <label className="setting-item">
          <span>{t('plugin.settings.allowRemotePlugins')}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.allowRemotePlugins}
              onChange={(e) => updateConfig({ allowRemotePlugins: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </label>
        
        <label className="setting-item">
          <span>{t('plugin.settings.sandboxEnabled')}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.sandboxEnabled}
              onChange={(e) => updateConfig({ sandboxEnabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </label>
        
        <label className="setting-item">
          <span>{t('plugin.settings.maxPlugins')}</span>
          <input
            type="number"
            value={config.maxPlugins}
            onChange={(e) => updateConfig({ maxPlugins: Number(e.target.value) })}
            min={1}
            max={100}
          />
        </label>
      </div>
    </div>
  );
  
  // Render statistics
  const renderStatistics = () => (
    <div className="plugin-statistics">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>{t('plugin.stats.totalPlugins')}</h4>
          <span className="stat-value">{statistics.totalPlugins}</span>
        </div>
        
        <div className="stat-card">
          <h4>{t('plugin.stats.enabledPlugins')}</h4>
          <span className="stat-value">{statistics.enabledPlugins}</span>
        </div>
        
        <div className="stat-card">
          <h4>{t('plugin.stats.runningPlugins')}</h4>
          <span className="stat-value">{statistics.runningPlugins}</span>
        </div>
        
        <div className="stat-card">
          <h4>{t('plugin.stats.errorPlugins')}</h4>
          <span className="stat-value">{statistics.errorPlugins}</span>
        </div>
        
        <div className="stat-card">
          <h4>{t('plugin.stats.totalHooks')}</h4>
          <span className="stat-value">{statistics.totalHooks}</span>
        </div>
      </div>
      
      <div className="stats-chart">
        <h4>{t('plugin.stats.byType')}</h4>
        <div className="chart-bars">
          {Object.entries(statistics.byType)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <div key={type} className="chart-bar">
                <span className="bar-label">{t(`plugin.types.${type}`)}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${(count / statistics.totalPlugins) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-value">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
  
  // Render settings modal
  const renderSettingsModal = () => {
    if (!selectedPlugin) return null;
    
    const settingsSchema = getPluginSettingsSchema(selectedPlugin.manifest.id);
    
    return (
      <div className="modal-overlay" onClick={() => setSelectedPlugin(null)}>
        <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{selectedPlugin.manifest.name} - {t('plugin.settings')}</h3>
            <button className="close-btn" onClick={() => setSelectedPlugin(null)}>×</button>
          </div>
          
          <div className="modal-body">
            {settingsSchema && settingsSchema.length > 0 ? (
              <div className="settings-form">
                {settingsSchema.map(schema => (
                  <div key={schema.key} className="form-group">
                    <label>{schema.label}</label>
                    {schema.description && (
                      <p className="field-description">{schema.description}</p>
                    )}
                    {renderSettingInput(schema, editingSettings[schema.key])}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-settings">{t('plugin.noSettings')}</p>
            )}
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedPlugin(null)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSaveSettings}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="plugin-manager">
      <div className="plugin-manager-header">
        <h2>{t('plugin.title')}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      {renderTabs()}
      
      <div className="plugin-manager-content">
        {activeTab === 'installed' && renderInstalledPlugins()}
        {activeTab === 'available' && renderAvailablePlugins()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'statistics' && renderStatistics()}
      </div>
      
      {renderSettingsModal()}
    </div>
  );
};

export default PluginManager;