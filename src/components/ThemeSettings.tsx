import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeConfig, ThemePreset, ColorPalette } from '../types/theme';
import { useTranslation } from 'react-i18next';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    currentTheme,
    settings,
    allThemes,
    getBuiltinThemes,
    getCustomThemes,
    setTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    duplicateTheme,
    updateSettings,
    exportTheme,
    importTheme,
    resetToDefault,
    loading,
    error,
    clearError,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'themes' | 'create' | 'settings' | 'import-export'>('themes');
  const [selectedThemeId, setSelectedThemeId] = useState(currentTheme.id);
  const [previewMode, setPreviewMode] = useState(false);
  const [importJson, setImportJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for creating/editing theme
  const [themeForm, setThemeForm] = useState<Partial<ThemeConfig>>({
    name: '',
    description: '',
    preset: 'custom' as ThemePreset,
    category: 'custom',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceVariant: '#334155',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
    },
    shadows: {
      small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      large: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
    animations: {
      fast: 150,
      base: 300,
      slow: 500,
    },
  });

  // Clear error when component unmounts or tab changes
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Update selected theme when current theme changes
  useEffect(() => {
    setSelectedThemeId(currentTheme.id);
  }, [currentTheme.id]);

  if (!isOpen) return null;

  const builtinThemes = getBuiltinThemes();
  const customThemes = getCustomThemes();

  const handleThemeSelect = async (themeId: string) => {
    try {
      await setTheme(themeId);
      setSelectedThemeId(themeId);
    } catch (err) {
      console.error('Failed to select theme:', err);
    }
  };

  const handleCreateTheme = async () => {
    if (!themeForm.name) {
      alert(t('theme.errors.nameRequired'));
      return;
    }

    try {
      await createTheme(themeForm as any);
      setActiveTab('themes');
      setThemeForm({
        name: '',
        description: '',
        preset: 'custom',
        category: 'custom',
        colors: themeForm.colors,
        fonts: themeForm.fonts,
        borderRadius: themeForm.borderRadius,
        shadows: themeForm.shadows,
        animations: themeForm.animations,
      });
    } catch (err) {
      console.error('Failed to create theme:', err);
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm(t('theme.confirmDelete'))) return;

    try {
      await deleteTheme(themeId);
    } catch (err) {
      console.error('Failed to delete theme:', err);
    }
  };

  const handleDuplicateTheme = async (themeId: string) => {
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme) return;

    const newName = `${theme.name} (Copy)`;
    try {
      await duplicateTheme(themeId, newName);
    } catch (err) {
      console.error('Failed to duplicate theme:', err);
    }
  };

  const handleExportTheme = (themeId: string) => {
    try {
      const exported = exportTheme(themeId);
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theme-${themeId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export theme:', err);
    }
  };

  const handleImportFromText = async () => {
    try {
      await importTheme(importJson);
      setImportJson('');
      setActiveTab('themes');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to import theme');
    }
  };

  const handleImportFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importTheme(content);
        setActiveTab('themes');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to import theme');
      }
    };
    reader.readAsText(file);
  };

  const handleColorChange = (colorKey: keyof ColorPalette, value: string) => {
    setThemeForm({
      ...themeForm,
      colors: {
        ...themeForm.colors!,
        [colorKey]: value,
      },
    });
  };

  const handleResetToDefault = async () => {
    if (!confirm(t('theme.confirmReset'))) return;

    try {
      await resetToDefault();
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const renderThemeCard = (theme: ThemeConfig) => {
    const isSelected = theme.id === selectedThemeId;
    const isBuiltIn = theme.isBuiltIn;

    return (
      <div
        key={theme.id}
        className={`theme-card ${isSelected ? 'active' : ''}`}
        onClick={() => handleThemeSelect(theme.id)}
      >
        <div className="theme-preview">
          <div className="theme-colors">
            <div className="color-swatch" style={{ background: theme.colors.primary }} />
            <div className="color-swatch" style={{ background: theme.colors.secondary }} />
            <div className="color-swatch" style={{ background: theme.colors.accent }} />
            <div className="color-swatch" style={{ background: theme.colors.background }} />
          </div>
        </div>
        <div className="theme-info">
          <h4>{theme.name}</h4>
          <p>{theme.description}</p>
          {isBuiltIn && <span className="builtin-badge">{t('theme.builtin')}</span>}
        </div>
        {!isBuiltIn && (
          <div className="theme-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateTheme(theme.id);
              }}
              title={t('theme.duplicate')}
            >
              📋
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTheme(theme.id);
              }}
              title={t('theme.delete')}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay theme-settings-modal">
      <div className="modal-content theme-settings-content">
        <div className="modal-header">
          <h2>{t('theme.title')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Error display */}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError}>×</button>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'themes' ? 'active' : ''}`}
              onClick={() => setActiveTab('themes')}
            >
              {t('theme.tabs.themes')}
            </button>
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              {t('theme.tabs.create')}
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              {t('theme.tabs.settings')}
            </button>
            <button
              className={`tab ${activeTab === 'import-export' ? 'active' : ''}`}
              onClick={() => setActiveTab('import-export')}
            >
              {t('theme.tabs.importExport')}
            </button>
          </div>

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="tab-content themes-tab">
              <div className="themes-section">
                <h3>{t('theme.builtinThemes')}</h3>
                <div className="themes-grid">
                  {builtinThemes.map(renderThemeCard)}
                </div>
              </div>

              {customThemes.length > 0 && (
                <div className="themes-section">
                  <h3>{t('theme.customThemes')}</h3>
                  <div className="themes-grid">
                    {customThemes.map(renderThemeCard)}
                  </div>
                </div>
              )}

              <div className="theme-actions-bar">
                <button onClick={handleResetToDefault} className="secondary-button">
                  {t('theme.resetDefault')}
                </button>
                <button onClick={() => setActiveTab('create')} className="primary-button">
                  {t('theme.createNew')}
                </button>
              </div>
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="tab-content create-tab">
              <div className="form-group">
                <label>{t('theme.name')}</label>
                <input
                  type="text"
                  value={themeForm.name || ''}
                  onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                  placeholder={t('theme.namePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label>{t('theme.description')}</label>
                <textarea
                  value={themeForm.description || ''}
                  onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                  placeholder={t('theme.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>{t('theme.colors')}</label>
                <div className="color-palette-grid">
                  {Object.entries(themeForm.colors || {}).map(([key, value]) => (
                    <div key={key} className="color-input-group">
                      <label>{key}</label>
                      <input
                        type="color"
                        value={value as string}
                        onChange={(e) => handleColorChange(key as keyof ColorPalette, e.target.value)}
                      />
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleColorChange(key as keyof ColorPalette, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>{t('theme.fonts')}</label>
                <div className="font-inputs">
                  <div>
                    <label>{t('theme.primaryFont')}</label>
                    <input
                      type="text"
                      value={themeForm.fonts?.primary || ''}
                      onChange={(e) => setThemeForm({
                        ...themeForm,
                        fonts: { ...themeForm.fonts!, primary: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label>{t('theme.baseFontSize')}</label>
                    <input
                      type="number"
                      value={themeForm.fonts?.baseSize || 16}
                      onChange={(e) => setThemeForm({
                        ...themeForm,
                        fonts: { ...themeForm.fonts!, baseSize: parseInt(e.target.value) }
                      })}
                      min="12"
                      max="24"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button onClick={() => setActiveTab('themes')} className="secondary-button">
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateTheme}
                  className="primary-button"
                  disabled={loading || !themeForm.name}
                >
                  {loading ? t('common.saving') : t('theme.create')}
                </button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content settings-tab">
              <div className="setting-item">
                <div className="setting-info">
                  <label>{t('theme.autoSwitch')}</label>
                  <p className="setting-description">{t('theme.autoSwitchDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSwitch}
                  onChange={(e) => updateSettings({ autoSwitch: e.target.checked })}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>{t('theme.darkMode')}</label>
                  <p className="setting-description">{t('theme.darkModeDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>{t('theme.dayTheme')}</label>
                  <p className="setting-description">{t('theme.dayThemeDescription')}</p>
                </div>
                <select
                  value={settings.dayTheme}
                  onChange={(e) => updateSettings({ dayTheme: e.target.value })}
                >
                  {allThemes.filter(t => t.category === 'light').map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>{t('theme.nightTheme')}</label>
                  <p className="setting-description">{t('theme.nightThemeDescription')}</p>
                </div>
                <select
                  value={settings.nightTheme}
                  onChange={(e) => updateSettings({ nightTheme: e.target.value })}
                >
                  {allThemes.filter(t => t.category === 'dark').map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>{t('theme.showPreview')}</label>
                  <p className="setting-description">{t('theme.showPreviewDescription')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPreview}
                  onChange={(e) => updateSettings({ showPreview: e.target.checked })}
                />
              </div>
            </div>
          )}

          {/* Import/Export Tab */}
          {activeTab === 'import-export' && (
            <div className="tab-content import-export-tab">
              <div className="section">
                <h3>{t('theme.exportTheme')}</h3>
                <div className="theme-selector">
                  <select
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                  >
                    {allThemes.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleExportTheme(selectedThemeId)}
                    className="primary-button"
                  >
                    {t('theme.export')}
                  </button>
                </div>
              </div>

              <div className="section">
                <h3>{t('theme.importTheme')}</h3>
                
                <div className="import-methods">
                  <div className="import-method">
                    <label>{t('theme.importFromFile')}</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleImportFromFile}
                    />
                  </div>

                  <div className="import-method">
                    <label>{t('theme.importFromText')}</label>
                    <textarea
                      value={importJson}
                      onChange={(e) => setImportJson(e.target.value)}
                      placeholder={t('theme.pasteJson')}
                      rows={10}
                    />
                    <button
                      onClick={handleImportFromText}
                      className="primary-button"
                      disabled={!importJson.trim() || loading}
                    >
                      {loading ? t('common.importing') : t('theme.import')}
                    </button>
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

export default ThemeSettings;