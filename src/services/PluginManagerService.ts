import EventEmitter from 'eventemitter3';
import {
  Plugin,
  PluginManifest,
  PluginConfig,
  PluginState,
  PluginStatus,
  PluginType,
  PluginHookType,
  PluginPermission,
  PluginContext,
  PluginInstance,
  PluginHookEvent,
  PluginHookResult,
  PluginStatistics,
  PluginManagerConfig,
  PluginInstallResult,
  PluginUpdateInfo,
  PluginSettingSchema,
  DEFAULT_PLUGIN_MANAGER_CONFIG,
  DEFAULT_PLUGIN_CONFIG,
} from '../types/plugin';

// ============ Event Types ============

interface PluginManagerEvents {
  pluginInstalled: (plugin: Plugin) => void;
  pluginUninstalled: (pluginId: string) => void;
  pluginEnabled: (plugin: Plugin) => void;
  pluginDisabled: (plugin: Plugin) => void;
  pluginError: (pluginId: string, error: Error) => void;
  pluginUpdated: (plugin: Plugin) => void;
  statusChanged: (pluginId: string, status: PluginStatus) => void;
  statisticsUpdated: (stats: PluginStatistics) => void;
}

// ============ Plugin Manager Service ============

/**
 * Plugin Manager Service
 * 
 * Manages the plugin lifecycle, loading, enabling/disabling plugins,
 * handling hooks, and providing a secure sandbox for plugin execution.
 */
export class PluginManagerService extends EventEmitter<PluginManagerEvents> {
  private static instance: PluginManagerService | null = null;
  
  private config: PluginManagerConfig;
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<PluginHookType, Map<string, number>> = new Map();
  private statistics: PluginStatistics;
  private storageKey = 'v-streaming-plugin-manager-config';
  
  private constructor() {
    super();
    this.config = this.loadConfig();
    this.statistics = this.initializeStatistics();
    this.initializeHooks();
  }
  
  static getInstance(): PluginManagerService {
    if (!PluginManagerService.instance) {
      PluginManagerService.instance = new PluginManagerService();
    }
    return PluginManagerService.instance;
  }
  
  // ============ Configuration Management ============
  
  private loadConfig(): PluginManagerConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PLUGIN_MANAGER_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load plugin manager config:', error);
    }
    return { ...DEFAULT_PLUGIN_MANAGER_CONFIG };
  }
  
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save plugin manager config:', error);
    }
  }
  
  getConfig(): PluginManagerConfig {
    return { ...this.config };
  }
  
  updateConfig(updates: Partial<PluginManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  
  resetConfig(): void {
    this.config = { ...DEFAULT_PLUGIN_MANAGER_CONFIG };
    this.saveConfig();
  }
  
  // ============ Plugin Registration ============
  
  registerPlugin(manifest: PluginManifest, instance?: PluginInstance): PluginInstallResult {
    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Check if plugin already exists
    if (this.plugins.has(manifest.id)) {
      return { success: false, error: `Plugin ${manifest.id} is already installed` };
    }
    
    // Check max plugins limit
    if (this.plugins.size >= this.config.maxPlugins) {
      return { success: false, error: 'Maximum number of plugins reached' };
    }
    
    // Check dependencies
    const depCheck = this.checkDependencies(manifest);
    if (!depCheck.satisfied && depCheck.required) {
      return { success: false, error: `Missing required dependencies: ${depCheck.missing.join(', ')}` };
    }
    
    // Check compatibility
    if (!this.checkCompatibility(manifest)) {
      return { success: false, error: 'Plugin is not compatible with this version' };
    }
    
    // Check for incompatible plugins
    const incompatible = this.checkIncompatible(manifest);
    if (incompatible.length > 0) {
      return { success: false, error: `Incompatible with installed plugins: ${incompatible.join(', ')}` };
    }
    
    // Create plugin entry
    const plugin: Plugin = {
      manifest,
      config: {
        ...DEFAULT_PLUGIN_CONFIG,
        settings: manifest.defaultConfig || {},
        permissions: manifest.requiredPermissions,
        lastUpdated: Date.now(),
      },
      state: {
        status: PluginStatus.INSTALLED,
        hooks: [],
      },
      instance,
    };
    
    this.plugins.set(manifest.id, plugin);
    this.updateStatistics();
    
    this.emit('pluginInstalled', plugin);
    
    const warnings = depCheck.missing.length > 0 
      ? [`Missing optional dependencies: ${depCheck.missing.join(', ')}`]
      : undefined;
    
    return { success: true, pluginId: manifest.id, warnings };
  }
  
  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }
    
    // Disable if running
    if (plugin.state.status === PluginStatus.RUNNING) {
      this.disablePlugin(pluginId);
    }
    
    // Remove all hooks
    this.removePluginHooks(pluginId);
    
    // Remove from map
    this.plugins.delete(pluginId);
    this.updateStatistics();
    
    this.emit('pluginUninstalled', pluginId);
    
    return true;
  }
  
  // ============ Plugin Lifecycle ============
  
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (plugin.state.status === PluginStatus.RUNNING) {
      return; // Already running
    }
    
    try {
      this.updatePluginStatus(pluginId, PluginStatus.ENABLED);
      
      // Call onEnable lifecycle
      if (plugin.instance?.onEnable) {
        await plugin.instance.onEnable();
      }
      
      // Register hooks
      this.registerPluginHooks(plugin);
      
      // Update config
      plugin.config.enabled = true;
      plugin.config.lastUpdated = Date.now();
      
      this.updatePluginStatus(pluginId, PluginStatus.RUNNING);
      this.emit('pluginEnabled', plugin);
      
    } catch (error) {
      plugin.state.error = (error as Error).message;
      this.updatePluginStatus(pluginId, PluginStatus.ERROR);
      this.emit('pluginError', pluginId, error as Error);
      throw error;
    }
  }
  
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (plugin.state.status !== PluginStatus.RUNNING) {
      return; // Not running
    }
    
    try {
      // Call onDisable lifecycle
      if (plugin.instance?.onDisable) {
        await plugin.instance.onDisable();
      }
      
      // Remove hooks
      this.removePluginHooks(pluginId);
      
      // Update config
      plugin.config.enabled = false;
      plugin.config.lastUpdated = Date.now();
      
      this.updatePluginStatus(pluginId, PluginStatus.DISABLED);
      this.emit('pluginDisabled', plugin);
      
    } catch (error) {
      plugin.state.error = (error as Error).message;
      this.updatePluginStatus(pluginId, PluginStatus.ERROR);
      this.emit('pluginError', pluginId, error as Error);
      throw error;
    }
  }
  
  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (!plugin.instance) {
      throw new Error(`Plugin ${pluginId} has no instance to load`);
    }
    
    try {
      const context = this.createPluginContext(plugin);
      
      if (plugin.instance.onLoad) {
        await plugin.instance.onLoad(context);
      }
      
      plugin.state.loadTime = Date.now();
      this.updatePluginStatus(pluginId, PluginStatus.INSTALLED);
      
    } catch (error) {
      plugin.state.error = (error as Error).message;
      this.updatePluginStatus(pluginId, PluginStatus.ERROR);
      throw error;
    }
  }
  
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (plugin.state.status === PluginStatus.RUNNING) {
      await this.disablePlugin(pluginId);
    }
    
    if (plugin.instance?.onUnload) {
      await plugin.instance.onUnload();
    }
    
    plugin.state.loadTime = undefined;
    this.updatePluginStatus(pluginId, PluginStatus.UNINSTALLED);
  }
  
  // ============ Plugin Configuration ============
  
  getPluginConfig(pluginId: string): PluginConfig | null {
    const plugin = this.plugins.get(pluginId);
    return plugin ? { ...plugin.config } : null;
  }
  
  async updatePluginSettings(pluginId: string, settings: Record<string, unknown>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Validate settings against schema
    if (plugin.manifest.settingsSchema) {
      const validation = this.validateSettings(settings, plugin.manifest.settingsSchema);
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
      }
    }
    
    plugin.config.settings = { ...plugin.config.settings, ...settings };
    plugin.config.lastUpdated = Date.now();
    
    // Notify plugin of settings change
    if (plugin.instance?.onSettingsChange) {
      await plugin.instance.onSettingsChange(plugin.config.settings);
    }
    
    this.emit('pluginUpdated', plugin);
  }
  
  getPluginSettingsSchema(pluginId: string): PluginSettingSchema[] | null {
    const plugin = this.plugins.get(pluginId);
    return plugin?.manifest.settingsSchema || null;
  }
  
  // ============ Hook System ============
  
  private initializeHooks(): void {
    Object.values(PluginHookType).forEach(hookType => {
      this.hooks.set(hookType, new Map());
    });
  }
  
  private registerPluginHooks(plugin: Plugin): void {
    if (!plugin.manifest.provides) return;
    
    // Find hook registrations in manifest
    plugin.manifest.provides.forEach(extension => {
      if (Object.values(PluginHookType).includes(extension.id as PluginHookType)) {
        const hookType = extension.id as PluginHookType;
        const priority = 0; // Default priority
        
        this.hooks.get(hookType)?.set(plugin.manifest.id, priority);
      }
    });
  }
  
  private removePluginHooks(pluginId: string): void {
    this.hooks.forEach(hookMap => {
      hookMap.delete(pluginId);
    });
  }
  
  async executeHook(event: PluginHookEvent): Promise<PluginHookResult[]> {
    const results: PluginHookResult[] = [];
    const hookMap = this.hooks.get(event.hookType);
    
    if (!hookMap || hookMap.size === 0) {
      return results;
    }
    
    // Sort plugins by priority
    const sortedPlugins = Array.from(hookMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([pluginId]) => this.plugins.get(pluginId))
      .filter((p): p is Plugin => p !== undefined && p.state.status === PluginStatus.RUNNING);
    
    for (const plugin of sortedPlugins) {
      try {
        if (plugin.instance?.onHook) {
          const result = await plugin.instance.onHook(event);
          results.push(result);
          
          if (result.handled && result.modified) {
            event.data = result.modified;
          }
        }
      } catch (error) {
        results.push({
          handled: false,
          error: (error as Error).message,
        });
      }
    }
    
    return results;
  }
  
  // ============ Plugin Queries ============
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  getPluginsByType(type: PluginType): Plugin[] {
    return this.getAllPlugins().filter(p => p.manifest.categories.includes(type));
  }
  
  getPluginsByStatus(status: PluginStatus): Plugin[] {
    return this.getAllPlugins().filter(p => p.state.status === status);
  }
  
  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.config.enabled);
  }
  
  getRunningPlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.state.status === PluginStatus.RUNNING);
  }
  
  // ============ Statistics ============
  
  private initializeStatistics(): PluginStatistics {
    return {
      totalPlugins: 0,
      enabledPlugins: 0,
      runningPlugins: 0,
      errorPlugins: 0,
      byType: {} as Record<PluginType, number>,
      byStatus: {} as Record<PluginStatus, number>,
      totalHooks: 0,
      totalMemoryUsage: 0,
    };
  }
  
  private updateStatistics(): void {
    const plugins = this.getAllPlugins();
    
    // Count by status
    const byStatus = {} as Record<PluginStatus, number>;
    Object.values(PluginStatus).forEach(status => {
      byStatus[status] = 0;
    });
    plugins.forEach(p => {
      byStatus[p.state.status]++;
    });
    
    // Count by type
    const byType = {} as Record<PluginType, number>;
    Object.values(PluginType).forEach(type => {
      byType[type] = 0;
    });
    plugins.forEach(p => {
      p.manifest.categories.forEach(type => {
        byType[type]++;
      });
    });
    
    // Count hooks
    let totalHooks = 0;
    this.hooks.forEach(hookMap => {
      totalHooks += hookMap.size;
    });
    
    this.statistics = {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter(p => p.config.enabled).length,
      runningPlugins: plugins.filter(p => p.state.status === PluginStatus.RUNNING).length,
      errorPlugins: plugins.filter(p => p.state.status === PluginStatus.ERROR).length,
      byType,
      byStatus,
      totalHooks,
      totalMemoryUsage: 0, // Would need performance API
    };
    
    this.emit('statisticsUpdated', this.statistics);
  }
  
  getStatistics(): PluginStatistics {
    return { ...this.statistics };
  }
  
  // ============ Validation ============
  
  private validateManifest(manifest: PluginManifest): { valid: boolean; error?: string } {
    if (!manifest.id || typeof manifest.id !== 'string') {
      return { valid: false, error: 'Plugin ID is required' };
    }
    
    if (!manifest.name || typeof manifest.name !== 'string') {
      return { valid: false, error: 'Plugin name is required' };
    }
    
    if (!manifest.version || typeof manifest.version !== 'string') {
      return { valid: false, error: 'Plugin version is required' };
    }
    
    if (!manifest.author || typeof manifest.author !== 'string') {
      return { valid: false, error: 'Plugin author is required' };
    }
    
    if (!manifest.minAppVersion || typeof manifest.minAppVersion !== 'string') {
      return { valid: false, error: 'Minimum app version is required' };
    }
    
    return { valid: true };
  }
  
  private checkDependencies(manifest: PluginManifest): { 
    satisfied: boolean; 
    required: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    let required = false;
    
    manifest.dependencies?.forEach(dep => {
      const installed = this.plugins.get(dep.pluginId);
      if (!installed) {
        missing.push(dep.pluginId);
        if (dep.required) {
          required = true;
        }
      }
    });
    
    return {
      satisfied: missing.length === 0,
      required,
      missing,
    };
  }
  
  private checkCompatibility(manifest: PluginManifest): boolean {
    const appVersion = '1.6.0'; // Current app version
    
    const minVersion = this.parseVersion(manifest.minAppVersion);
    const currentVersion = this.parseVersion(appVersion);
    
    if (this.compareVersions(currentVersion, minVersion) < 0) {
      return false;
    }
    
    if (manifest.maxAppVersion) {
      const maxVersion = this.parseVersion(manifest.maxAppVersion);
      if (this.compareVersions(currentVersion, maxVersion) > 0) {
        return false;
      }
    }
    
    return true;
  }
  
  private checkIncompatible(manifest: PluginManifest): string[] {
    const incompatible: string[] = [];
    
    manifest.incompatiblePlugins?.forEach(pluginId => {
      if (this.plugins.has(pluginId)) {
        incompatible.push(pluginId);
      }
    });
    
    return incompatible;
  }
  
  private validateSettings(
    settings: Record<string, unknown>,
    schema: PluginSettingSchema[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    schema.forEach(setting => {
      const value = settings[setting.key];
      
      if (setting.required && (value === undefined || value === null)) {
        errors.push(`Setting ${setting.key} is required`);
        return;
      }
      
      if (value !== undefined && setting.validation) {
        if (setting.type === 'number') {
          const numValue = value as number;
          if (setting.validation.min !== undefined && numValue < setting.validation.min) {
            errors.push(`Setting ${setting.key} must be at least ${setting.validation.min}`);
          }
          if (setting.validation.max !== undefined && numValue > setting.validation.max) {
            errors.push(`Setting ${setting.key} must be at most ${setting.validation.max}`);
          }
        }
        
        if (setting.type === 'string' && setting.validation.pattern) {
          const regex = new RegExp(setting.validation.pattern);
          if (!regex.test(value as string)) {
            errors.push(`Setting ${setting.key} does not match required pattern`);
          }
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  }
  
  // ============ Utilities ============
  
  private parseVersion(version: string): number[] {
    return version.split('.').map(v => parseInt(v, 10) || 0);
  }
  
  private compareVersions(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  }
  
  private generateId(): string {
    return `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private updatePluginStatus(pluginId: string, status: PluginStatus): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.state.status = status;
      this.updateStatistics();
      this.emit('statusChanged', pluginId, status);
    }
  }
  
  private createPluginContext(plugin: Plugin): PluginContext {
    const self = this;
    
    return {
      pluginId: plugin.manifest.id,
      manifest: plugin.manifest,
      config: plugin.config,
      
      logger: {
        debug: (message, ...args) => console.debug(`[${plugin.manifest.name}] ${message}`, ...args),
        info: (message, ...args) => console.info(`[${plugin.manifest.name}] ${message}`, ...args),
        warn: (message, ...args) => console.warn(`[${plugin.manifest.name}] ${message}`, ...args),
        error: (message, ...args) => console.error(`[${plugin.manifest.name}] ${message}`, ...args),
      },
      
      storage: {
        get: async <T>(key: string): Promise<T | null> => {
          const data = localStorage.getItem(`plugin:${plugin.manifest.id}:${key}`);
          return data ? JSON.parse(data) : null;
        },
        set: async <T>(key: string, value: T): Promise<void> => {
          localStorage.setItem(`plugin:${plugin.manifest.id}:${key}`, JSON.stringify(value));
        },
        delete: async (key: string): Promise<void> => {
          localStorage.removeItem(`plugin:${plugin.manifest.id}:${key}`);
        },
        clear: async (): Promise<void> => {
          const prefix = `plugin:${plugin.manifest.id}:`;
          Object.keys(localStorage).forEach(k => {
            if (k.startsWith(prefix)) {
              localStorage.removeItem(k);
            }
          });
        },
        keys: async (): Promise<string[]> => {
          const prefix = `plugin:${plugin.manifest.id}:`;
          return Object.keys(localStorage).filter(k => k.startsWith(prefix));
        },
      },
      
      api: {
        startStream: async (config) => {
          // Would integrate with streaming service
          console.log('API: startStream', config);
        },
        stopStream: async () => {
          console.log('API: stopStream');
        },
        getStreamStatus: async () => {
          return { isStreaming: false };
        },
        getScenes: async () => [],
        getCurrentScene: async () => null,
        switchScene: async (sceneId) => {
          console.log('API: switchScene', sceneId);
        },
        getAudioSources: async () => [],
        setVolume: async (sourceId, volume) => {
          console.log('API: setVolume', sourceId, volume);
        },
        muteSource: async (sourceId, muted) => {
          console.log('API: muteSource', sourceId, muted);
        },
        sendChatMessage: async (message) => {
          console.log('API: sendChatMessage', message);
        },
        getChatHistory: async () => [],
        showNotification: async (title, message, type = 'info') => {
          console.log('API: showNotification', title, message, type);
        },
        fetch: async (url, options) => {
          return fetch(url, options);
        },
        invokeNative: async <T>(command: string, args?: unknown): Promise<T> => {
          // Would integrate with Tauri
          throw new Error('Native invocation not available');
        },
      },
      
      events: {
        on: (event, listener) => self.on(event as any, listener as any),
        off: (event, listener) => self.off(event as any, listener as any),
        emit: (event, ...args) => self.emit(event as any, ...args as any),
      },
    };
  }
  
  // ============ Auto-load ============
  
  async autoLoadPlugins(): Promise<void> {
    if (!this.config.autoLoadPlugins) return;
    
    const plugins = this.getAllPlugins();
    
    for (const plugin of plugins) {
      if (plugin.config.autoStart && plugin.config.enabled) {
        try {
          await this.enablePlugin(plugin.manifest.id);
        } catch (error) {
          console.error(`Failed to auto-load plugin ${plugin.manifest.id}:`, error);
        }
      }
    }
  }
  
  // ============ Cleanup ============
  
  async unloadAll(): Promise<void> {
    const plugins = this.getRunningPlugins();
    
    for (const plugin of plugins) {
      try {
        await this.disablePlugin(plugin.manifest.id);
      } catch (error) {
        console.error(`Failed to unload plugin ${plugin.manifest.id}:`, error);
      }
    }
  }
}

// Export singleton getter
export const getPluginManager = (): PluginManagerService => PluginManagerService.getInstance();