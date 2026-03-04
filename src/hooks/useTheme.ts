import { useState, useEffect, useCallback } from 'react';
import { themeManager } from '../services/ThemeManager';
import { ThemeConfig, ThemeSettings, ThemePreset } from '../types/theme';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(themeManager.getCurrentTheme());
  const [settings, setSettings] = useState<ThemeSettings>(themeManager.getSettings());
  const [allThemes, setAllThemes] = useState<ThemeConfig[]>(themeManager.getAllThemes());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to theme changes
  useEffect(() => {
    const handleThemeChanged = (theme: ThemeConfig) => {
      setCurrentTheme(theme);
      setAllThemes(themeManager.getAllThemes());
    };

    const handleSettingsChanged = (settings: ThemeSettings) => {
      setSettings(settings);
    };

    const handleThemeCreated = (theme: ThemeConfig) => {
      setAllThemes(themeManager.getAllThemes());
    };

    const handleThemeUpdated = (theme: ThemeConfig) => {
      setAllThemes(themeManager.getAllThemes());
      if (theme.id === currentTheme.id) {
        setCurrentTheme(theme);
      }
    };

    const handleThemeDeleted = (themeId: string) => {
      setAllThemes(themeManager.getAllThemes());
      if (themeId === currentTheme.id) {
        setCurrentTheme(themeManager.getCurrentTheme());
      }
    };

    themeManager.on('themeChanged', handleThemeChanged);
    themeManager.on('settingsChanged', handleSettingsChanged);
    themeManager.on('themeCreated', handleThemeCreated);
    themeManager.on('themeUpdated', handleThemeUpdated);
    themeManager.on('themeDeleted', handleThemeDeleted);

    return () => {
      themeManager.off('themeChanged', handleThemeChanged);
      themeManager.off('settingsChanged', handleSettingsChanged);
      themeManager.off('themeCreated', handleThemeCreated);
      themeManager.off('themeUpdated', handleThemeUpdated);
      themeManager.off('themeDeleted', handleThemeDeleted);
    };
  }, [currentTheme.id]);

  // Set current theme
  const setTheme = useCallback(async (themeId: string) => {
    setLoading(true);
    setError(null);
    try {
      await themeManager.setTheme(themeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new custom theme
  const createTheme = useCallback(async (theme: Omit<ThemeConfig, 'id' | 'isBuiltIn' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const newTheme = await themeManager.createTheme(theme);
      return newTheme;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing theme
  const updateTheme = useCallback(async (themeId: string, updates: Partial<ThemeConfig>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await themeManager.updateTheme(themeId, updates);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete custom theme
  const deleteTheme = useCallback(async (themeId: string) => {
    setLoading(true);
    setError(null);
    try {
      await themeManager.deleteTheme(themeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Duplicate theme
  const duplicateTheme = useCallback(async (themeId: string, newName: string) => {
    setLoading(true);
    setError(null);
    try {
      const duplicated = await themeManager.duplicateTheme(themeId, newName);
      return duplicated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<ThemeSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await themeManager.updateSettings(updates);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle auto-switch
  const toggleAutoSwitch = useCallback(async (enabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await themeManager.toggleAutoSwitch(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle auto-switch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set dark mode
  const setDarkMode = useCallback(async (enabled: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await themeManager.setDarkMode(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set dark mode');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export theme
  const exportTheme = useCallback((themeId: string): string => {
    try {
      return themeManager.exportTheme(themeId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export theme';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Import theme
  const importTheme = useCallback(async (themeJson: string) => {
    setLoading(true);
    setError(null);
    try {
      const imported = await themeManager.importTheme(themeJson);
      return imported;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import theme');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to default
  const resetToDefault = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await themeManager.resetToDefault();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset to default');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get theme by ID
  const getThemeById = useCallback((themeId: string) => {
    return themeManager.getThemeById(themeId);
  }, []);

  // Get built-in themes
  const getBuiltinThemes = useCallback(() => {
    return themeManager.getBuiltinThemes();
  }, []);

  // Get custom themes
  const getCustomThemes = useCallback(() => {
    return themeManager.getCustomThemes();
  }, []);

  // Get statistics
  const getStatistics = useCallback(() => {
    return themeManager.getStatistics();
  }, []);

  return {
    // State
    currentTheme,
    settings,
    allThemes,
    loading,
    error,

    // Theme operations
    setTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    duplicateTheme,
    getThemeById,
    getBuiltinThemes,
    getCustomThemes,

    // Settings operations
    updateSettings,
    toggleAutoSwitch,
    setDarkMode,

    // Import/Export
    exportTheme,
    importTheme,

    // Utilities
    resetToDefault,
    getStatistics,
    clearError: () => setError(null),
  };
}