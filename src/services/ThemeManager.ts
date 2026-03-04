import { EventEmitter } from 'events';
import {
  ThemeConfig,
  ThemeSettings,
  ThemePreset,
  ColorPalette,
  BUILTIN_THEMES,
  DEFAULT_THEME_SETTINGS,
  DEFAULT_THEME,
} from '../types/theme';

interface ThemeEvents {
  themeChanged: (theme: ThemeConfig) => void;
  settingsChanged: (settings: ThemeSettings) => void;
  themeCreated: (theme: ThemeConfig) => void;
  themeUpdated: (theme: ThemeConfig) => void;
  themeDeleted: (themeId: string) => void;
  themeImported: (theme: ThemeConfig) => void;
  themeExported: (theme: ThemeConfig) => void;
}

export class ThemeManager extends EventEmitter {
  private currentTheme: ThemeConfig;
  private settings: ThemeSettings;
  private customThemes: ThemeConfig[];
  private storageKey = 'vstreaming_themes';
  private settingsKey = 'vstreaming_theme_settings';
  private currentThemeKey = 'vstreaming_current_theme';

  constructor() {
    super();
    this.customThemes = [];
    this.currentTheme = { ...DEFAULT_THEME };
    this.settings = { ...DEFAULT_THEME_SETTINGS };
    this.loadFromStorage();
  }

  // ============ Theme Management ============

  /**
   * Get the current active theme
   */
  getCurrentTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  /**
   * Set the current theme
   */
  async setTheme(themeId: string): Promise<void> {
    const theme = this.getThemeById(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    this.currentTheme = { ...theme };
    this.saveCurrentTheme();
    this.applyThemeToDOM(theme);
    this.emit('themeChanged', this.currentTheme);
  }

  /**
   * Get all available themes (builtin + custom)
   */
  getAllThemes(): ThemeConfig[] {
    return [...BUILTIN_THEMES, ...this.customThemes];
  }

  /**
   * Get theme by ID
   */
  getThemeById(themeId: string): ThemeConfig | undefined {
    return this.getAllThemes().find(t => t.id === themeId);
  }

  /**
   * Get built-in themes only
   */
  getBuiltinThemes(): ThemeConfig[] {
    return [...BUILTIN_THEMES];
  }

  /**
   * Get custom themes only
   */
  getCustomThemes(): ThemeConfig[] {
    return [...this.customThemes];
  }

  /**
   * Create a new custom theme
   */
  async createTheme(theme: Omit<ThemeConfig, 'id' | 'isBuiltIn' | 'createdAt'>): Promise<ThemeConfig> {
    const newTheme: ThemeConfig = {
      ...theme,
      id: `theme-custom-${Date.now()}`,
      isBuiltIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customThemes.push(newTheme);
    this.saveThemes();

    this.emit('themeCreated', newTheme);
    return newTheme;
  }

  /**
   * Update an existing custom theme
   */
  async updateTheme(themeId: string, updates: Partial<ThemeConfig>): Promise<ThemeConfig> {
    const themeIndex = this.customThemes.findIndex(t => t.id === themeId);
    if (themeIndex === -1) {
      throw new Error(`Custom theme ${themeId} not found`);
    }

    this.customThemes[themeIndex] = {
      ...this.customThemes[themeIndex],
      ...updates,
      id: themeId, // Preserve ID
      isBuiltIn: false, // Ensure it stays as custom
      updatedAt: new Date(),
    };

    this.saveThemes();

    // If updating current theme, apply changes
    if (this.currentTheme.id === themeId) {
      this.currentTheme = { ...this.customThemes[themeIndex] };
      this.applyThemeToDOM(this.currentTheme);
    }

    this.emit('themeUpdated', this.customThemes[themeIndex]);
    return this.customThemes[themeIndex];
  }

  /**
   * Delete a custom theme
   */
  async deleteTheme(themeId: string): Promise<void> {
    const themeIndex = this.customThemes.findIndex(t => t.id === themeId);
    if (themeIndex === -1) {
      throw new Error(`Custom theme ${themeId} not found`);
    }

    this.customThemes.splice(themeIndex, 1);
    this.saveThemes();

    // If deleted theme was current, switch to default
    if (this.currentTheme.id === themeId) {
      await this.setTheme(DEFAULT_THEME.id);
    }

    this.emit('themeDeleted', themeId);
  }

  /**
   * Duplicate a theme (creates a new custom theme based on existing)
   */
  async duplicateTheme(themeId: string, newName: string): Promise<ThemeConfig> {
    const sourceTheme = this.getThemeById(themeId);
    if (!sourceTheme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    const duplicatedTheme = await this.createTheme({
      ...sourceTheme,
      name: newName,
      description: `Duplicated from ${sourceTheme.name}`,
      preset: 'custom',
      category: 'custom' as any,
    });

    return duplicatedTheme;
  }

  // ============ Theme Settings ============

  /**
   * Get theme settings
   */
  getSettings(): ThemeSettings {
    return { ...this.settings };
  }

  /**
   * Update theme settings
   */
  async updateSettings(updates: Partial<ThemeSettings>): Promise<ThemeSettings> {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    this.saveSettings();

    // Re-apply theme if auto-switch enabled
    if (this.settings.autoSwitch) {
      this.applyAutoSwitch();
    }

    this.emit('settingsChanged', this.settings);
    return this.settings;
  }

  /**
   * Toggle auto-switch based on time
   */
  async toggleAutoSwitch(enabled: boolean): Promise<void> {
    await this.updateSettings({ autoSwitch: enabled });
  }

  /**
   * Set dark mode preference
   */
  async setDarkMode(enabled: boolean): Promise<void> {
    await this.updateSettings({ darkMode: enabled });
    
    // Auto-switch theme based on preference
    if (this.settings.autoSwitchTheme) {
      const targetTheme = enabled 
        ? this.getAllThemes().find(t => t.preset === 'dark' && t.category === 'dark')
        : this.getAllThemes().find(t => t.preset === 'light' && t.category === 'light');
      
      if (targetTheme) {
        await this.setTheme(targetTheme.id);
      }
    }
  }

  /**
   * Apply automatic theme switching based on time
   */
  private applyAutoSwitch(): void {
    if (!this.settings.autoSwitch) return;

    const now = new Date();
    const hours = now.getHours();
    const isDaytime = hours >= 6 && hours < 18;

    const targetPreset = isDaytime ? this.settings.dayTheme : this.settings.nightTheme;
    const targetTheme = this.getThemeById(targetPreset);
    
    if (targetTheme && targetTheme.id !== this.currentTheme.id) {
      this.setTheme(targetTheme.id);
    }
  }

  // ============ Theme Import/Export ============

  /**
   * Export a theme to JSON
   */
  exportTheme(themeId: string): string {
    const theme = this.getThemeById(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    const exportData = {
      version: '1.0',
      theme: {
        name: theme.name,
        description: theme.description,
        preset: theme.preset,
        category: theme.category,
        colors: theme.colors,
        fonts: theme.fonts,
        borderRadius: theme.borderRadius,
        shadows: theme.shadows,
        animations: theme.animations,
      },
    };

    this.emit('themeExported', theme);
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import a theme from JSON
   */
  async importTheme(themeJson: string): Promise<ThemeConfig> {
    try {
      const importData = JSON.parse(themeJson);
      
      if (!importData.version || !importData.theme) {
        throw new Error('Invalid theme file format');
      }

      const importedTheme = await this.createTheme({
        ...importData.theme,
        preset: 'custom',
        category: 'custom',
      });

      this.emit('themeImported', importedTheme);
      return importedTheme;
    } catch (error) {
      throw new Error(`Failed to import theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============ DOM Application ============

  /**
   * Apply theme colors to CSS variables
   */
  private applyThemeToDOM(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // Apply colors
    const colors = theme.colors;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-surface-variant', colors.surfaceVariant);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    
    // Apply fonts
    root.style.setProperty('--theme-font-family', theme.fonts.primary);
    root.style.setProperty('--theme-font-family-secondary', theme.fonts.secondary);
    root.style.setProperty('--theme-font-size-base', `${theme.fonts.baseSize}px`);
    
    // Apply border radius
    root.style.setProperty('--theme-border-radius', `${theme.borderRadius.small}px`);
    root.style.setProperty('--theme-border-radius-medium', `${theme.borderRadius.medium}px`);
    root.style.setProperty('--theme-border-radius-large', `${theme.borderRadius.large}px`);
    
    // Apply shadows
    root.style.setProperty('--theme-shadow-sm', theme.shadows.small);
    root.style.setProperty('--theme-shadow-md', theme.shadows.medium);
    root.style.setProperty('--theme-shadow-lg', theme.shadows.large);
    
    // Apply animations
    root.style.setProperty('--theme-transition-fast', `${theme.animations.fast}ms`);
    root.style.setProperty('--theme-transition-base', `${theme.animations.base}ms`);
    root.style.setProperty('--theme-transition-slow', `${theme.animations.slow}ms`);
    
    // Set data attribute for theme mode
    document.documentElement.setAttribute('data-theme', theme.category);
    if (theme.category === 'dark') {
      document.documentElement.setAttribute('data-theme-mode', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme-mode', 'light');
    }
  }

  // ============ Storage ============

  /**
   * Save custom themes to localStorage
   */
  private saveThemes(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.customThemes));
    } catch (error) {
      console.error('Failed to save themes:', error);
    }
  }

  /**
   * Save current theme to localStorage
   */
  private saveCurrentTheme(): void {
    try {
      localStorage.setItem(this.currentThemeKey, this.currentTheme.id);
    } catch (error) {
      console.error('Failed to save current theme:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Load themes and settings from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load custom themes
      const savedThemes = localStorage.getItem(this.storageKey);
      if (savedThemes) {
        this.customThemes = JSON.parse(savedThemes);
      }

      // Load settings
      const savedSettings = localStorage.getItem(this.settingsKey);
      if (savedSettings) {
        this.settings = { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(savedSettings) };
      }

      // Load current theme
      const savedCurrentTheme = localStorage.getItem(this.currentThemeKey);
      if (savedCurrentTheme) {
        const savedTheme = this.getThemeById(savedCurrentTheme);
        if (savedTheme) {
          this.currentTheme = { ...savedTheme };
        }
      }

      // Apply current theme to DOM
      this.applyThemeToDOM(this.currentTheme);
    } catch (error) {
      console.error('Failed to load themes from storage:', error);
    }
  }

  /**
   * Reset to default theme
   */
  async resetToDefault(): Promise<void> {
    this.customThemes = [];
    this.settings = { ...DEFAULT_THEME_SETTINGS };
    await this.setTheme(DEFAULT_THEME.id);
    this.saveThemes();
    this.saveSettings();
  }

  /**
   * Get theme statistics
   */
  getStatistics(): { total: number; builtin: number; custom: number; current: string } {
    return {
      total: this.getAllThemes().length,
      builtin: BUILTIN_THEMES.length,
      custom: this.customThemes.length,
      current: this.currentTheme.id,
    };
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();