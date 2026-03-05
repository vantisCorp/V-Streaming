/**
 * Theme Type Definitions
 * Complete type system for customizable themes with multiple presets
 */

export type ThemePreset = 
  | 'light'
  | 'dark'
  | 'cyberpunk'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'neon'
  | 'minimal'
  | 'custom';

export type ThemeCategory = 
  | 'light'
  | 'dark'
  | 'colorful'
  | 'minimal'
  | 'high-contrast'
  | 'custom';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeFonts {
  primary: string;
  secondary: string;
  baseSize: number;
}

export interface ThemeBorderRadius {
  small: number;
  medium: number;
  large: number;
}

export interface ThemeShadows {
  small: string;
  medium: string;
  large: string;
}

export interface ThemeAnimations {
  fast: number;
  base: number;
  slow: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description?: string;
  preset: ThemePreset;
  category: ThemeCategory;
  colors: ColorPalette;
  fonts: ThemeFonts;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
  isDefault: boolean;
  isBuiltIn: boolean;
  thumbnail?: string;
  author?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeSettings {
  currentTheme: string;
  autoSwitch: boolean;
  autoSwitchTheme: boolean;
  darkMode: boolean;
  dayTheme: string;
  nightTheme: string;
  showPreview: boolean;
}

export interface ThemeManagerState {
  settings: ThemeSettings;
  activeTheme: ThemeConfig;
  availableThemes: ThemeConfig[];
  isInitialized: boolean;
}

export interface ThemeManagerEvents {
  'theme:changed': ThemeConfig;
  'theme:created': ThemeConfig;
  'theme:updated': ThemeConfig;
  'theme:deleted': string;
  'theme:imported': ThemeConfig;
  'theme:exported': string;
  'settings:updated': ThemeSettings;
  'state:changed': ThemeManagerState;
  'error': { type: string; message: string; details?: any };
}

export interface CreateThemeOptions {
  name: string;
  description?: string;
  preset: ThemePreset;
  category?: ThemeCategory;
  colors?: Partial<ColorPalette>;
  thumbnail?: string;
  author?: string;
  tags?: string[];
}

export interface UpdateThemeOptions {
  name?: string;
  description?: string;
  colors?: Partial<ColorPalette>;
  thumbnail?: string;
  tags?: string[];
}

export interface ImportThemeOptions {
  file: File;
  overwrite?: boolean;
}

export interface ThemePreview {
  theme: ThemeConfig;
  applied: boolean;
}

// Default theme settings
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  currentTheme: 'theme-light',
  autoSwitch: false,
  autoSwitchTheme: true,
  darkMode: false,
  dayTheme: 'theme-light',
  nightTheme: 'theme-dark',
  showPreview: false,
};

// Built-in theme presets
export const BUILTIN_THEMES: ThemeConfig[] = [
  {
    id: 'theme-light',
    name: 'Light',
    description: 'Clean and bright theme',
    preset: 'light',
    category: 'light',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceVariant: '#e9ecef',
      text: '#1a1a2e',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
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
    isDefault: true,
    isBuiltIn: true,
    tags: ['clean', 'bright'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-dark',
    name: 'Dark',
    description: 'Dark theme for comfortable viewing',
    preset: 'dark',
    category: 'dark',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#06b6d4',
      background: '#0a0a1a',
      surface: '#1a1a2e',
      surfaceVariant: '#2a2a4e',
      text: '#ffffff',
      textSecondary: '#9ca3af',
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
    isDefault: false,
    isBuiltIn: true,
    tags: ['dark', 'comfortable'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon futuristic theme',
    preset: 'cyberpunk',
    category: 'colorful',
    colors: {
      primary: '#00ff88',
      secondary: '#ff00ff',
      accent: '#00ffff',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#00ff88',
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0055',
    },
    fonts: {
      primary: 'Orbitron, system-ui, sans-serif',
      secondary: 'Roboto, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 2,
      medium: 4,
      large: 8,
    },
    shadows: {
      small: '0 0 5px rgba(0, 255, 136, 0.5)',
      medium: '0 0 10px rgba(0, 255, 136, 0.3)',
      large: '0 0 20px rgba(0, 255, 136, 0.2)',
    },
    animations: {
      fast: 100,
      base: 200,
      slow: 400,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['neon', 'futuristic', 'cyber'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-ocean',
    name: 'Ocean',
    description: 'Calm blue ocean theme',
    preset: 'ocean',
    category: 'colorful',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#14b8a6',
      background: '#0c1929',
      surface: '#1a2d42',
      surfaceVariant: '#2d4a6e',
      text: '#ffffff',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
    fonts: {
      primary: 'Segoe UI, system-ui, sans-serif',
      secondary: 'Inter, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 6,
      medium: 10,
      large: 16,
    },
    shadows: {
      small: '0 2px 4px rgba(59, 130, 246, 0.1)',
      medium: '0 4px 8px rgba(59, 130, 246, 0.15)',
      large: '0 8px 16px rgba(59, 130, 246, 0.2)',
    },
    animations: {
      fast: 200,
      base: 400,
      slow: 600,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['blue', 'calm', 'ocean'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-forest',
    name: 'Forest',
    description: 'Natural green forest theme',
    preset: 'forest',
    category: 'colorful',
    colors: {
      primary: '#22c55e',
      secondary: '#4ade80',
      accent: '#84cc16',
      background: '#0a1f0a',
      surface: '#1a2f1a',
      surfaceVariant: '#2d4a2d',
      text: '#ffffff',
      textSecondary: '#86efac',
      border: '#22c55e',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
    fonts: {
      primary: 'Nunito, system-ui, sans-serif',
      secondary: 'Open Sans, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 8,
      medium: 12,
      large: 20,
    },
    shadows: {
      small: '0 2px 4px rgba(34, 197, 94, 0.1)',
      medium: '0 4px 8px rgba(34, 197, 94, 0.15)',
      large: '0 8px 16px rgba(34, 197, 94, 0.2)',
    },
    animations: {
      fast: 180,
      base: 350,
      slow: 550,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['green', 'natural', 'forest'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-sunset',
    name: 'Sunset',
    description: 'Warm sunset colors',
    preset: 'sunset',
    category: 'colorful',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#f43f5e',
      background: '#1a0f0a',
      surface: '#2d1f1a',
      surfaceVariant: '#4d3028',
      text: '#ffffff',
      textSecondary: '#fdba74',
      border: '#f97316',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
    fonts: {
      primary: 'Poppins, system-ui, sans-serif',
      secondary: 'Lato, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 6,
      medium: 10,
      large: 16,
    },
    shadows: {
      small: '0 2px 4px rgba(249, 115, 22, 0.1)',
      medium: '0 4px 8px rgba(249, 115, 22, 0.15)',
      large: '0 8px 16px rgba(249, 115, 22, 0.2)',
    },
    animations: {
      fast: 200,
      base: 400,
      slow: 600,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['warm', 'sunset', 'orange'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-midnight',
    name: 'Midnight',
    description: 'Deep midnight blue theme',
    preset: 'midnight',
    category: 'dark',
    colors: {
      primary: '#6366f1',
      secondary: '#818cf8',
      accent: '#a78bfa',
      background: '#030712',
      surface: '#111827',
      surfaceVariant: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'system-ui, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
    },
    shadows: {
      small: '0 1px 2px rgba(99, 102, 241, 0.1)',
      medium: '0 4px 6px rgba(99, 102, 241, 0.15)',
      large: '0 10px 15px rgba(99, 102, 241, 0.2)',
    },
    animations: {
      fast: 150,
      base: 300,
      slow: 500,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['dark', 'midnight', 'blue'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-neon',
    name: 'Neon',
    description: 'Bright neon colors',
    preset: 'neon',
    category: 'colorful',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ffff00',
      background: '#000000',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#ff00ff',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff0000',
    },
    fonts: {
      primary: 'Arial Black, sans-serif',
      secondary: 'Arial, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 0,
      medium: 2,
      large: 4,
    },
    shadows: {
      small: '0 0 5px rgba(255, 0, 255, 0.5)',
      medium: '0 0 10px rgba(0, 255, 255, 0.5)',
      large: '0 0 20px rgba(255, 255, 0, 0.5)',
    },
    animations: {
      fast: 100,
      base: 200,
      slow: 400,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['neon', 'bright', 'colorful'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'theme-minimal',
    name: 'Minimal',
    description: 'Clean minimal theme',
    preset: 'minimal',
    category: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#333333',
      background: '#ffffff',
      surface: '#f5f5f5',
      surfaceVariant: '#e5e5e5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#e0e0e0',
      success: '#009900',
      warning: '#ff9900',
      error: '#cc0000',
    },
    fonts: {
      primary: 'Helvetica, Arial, sans-serif',
      secondary: 'system-ui, sans-serif',
      baseSize: 16,
    },
    borderRadius: {
      small: 0,
      medium: 0,
      large: 0,
    },
    shadows: {
      small: 'none',
      medium: 'none',
      large: 'none',
    },
    animations: {
      fast: 100,
      base: 200,
      slow: 300,
    },
    isDefault: false,
    isBuiltIn: true,
    tags: ['minimal', 'clean', 'simple'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Default theme
export const DEFAULT_THEME = BUILTIN_THEMES[0];