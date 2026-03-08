import { useState, useEffect, useCallback } from 'react';
import { PluginManagerService } from '../services/PluginManagerService';
import {
  Plugin,
  PluginManifest,
  PluginConfig,
  PluginStatistics,
  PluginStatus,
  PluginType,
  PluginManagerConfig,
  PluginInstallResult,
  PluginSettingSchema,
} from '../types/plugin';

/**
 * React hook for Plugin Manager state management
 */
export function usePluginManager() {
  const service = PluginManagerService.getInstance();
  
  // State
  const [config, setConfig] = useState<PluginManagerConfig>(service.getConfig());
  const [plugins, setPlugins] = useState<Plugin[]>(service.getAllPlugins());
  const [statistics, setStatistics] = useState<PluginStatistics>(service.getStatistics());
  
  // ============ Event Listeners ============
  
  useEffect(() => {
    const handlePluginInstalled = () => {
      setPlugins(service.getAllPlugins());
    };
    
    const handlePluginUninstalled = () => {
      setPlugins(service.getAllPlugins());
    };
    
    const handlePluginEnabled = () => {
      setPlugins(service.getAllPlugins());
    };
    
    const handlePluginDisabled = () => {
      setPlugins(service.getAllPlugins());
    };
    
    const handlePluginUpdated = () => {
      setPlugins(service.getAllPlugins());
    };
    
    const handleStatisticsUpdated = (stats: PluginStatistics) => {
      setStatistics(stats);
    };
    
    service.on('pluginInstalled', handlePluginInstalled);
    service.on('pluginUninstalled', handlePluginUninstalled);
    service.on('pluginEnabled', handlePluginEnabled);
    service.on('pluginDisabled', handlePluginDisabled);
    service.on('pluginUpdated', handlePluginUpdated);
    service.on('statisticsUpdated', handleStatisticsUpdated);
    
    return () => {
      service.off('pluginInstalled', handlePluginInstalled);
      service.off('pluginUninstalled', handlePluginUninstalled);
      service.off('pluginEnabled', handlePluginEnabled);
      service.off('pluginDisabled', handlePluginDisabled);
      service.off('pluginUpdated', handlePluginUpdated);
      service.off('statisticsUpdated', handleStatisticsUpdated);
    };
  }, [service]);
  
  // ============ Configuration ============
  
  const updateConfig = useCallback((updates: Partial<PluginManagerConfig>) => {
    service.updateConfig(updates);
    setConfig(service.getConfig());
  }, [service]);
  
  const resetConfig = useCallback(() => {
    service.resetConfig();
    setConfig(service.getConfig());
  }, [service]);
  
  // ============ Plugin Registration ============
  
  const registerPlugin = useCallback((manifest: PluginManifest, instance?: any): PluginInstallResult => {
    const result = service.registerPlugin(manifest, instance);
    setPlugins(service.getAllPlugins());
    return result;
  }, [service]);
  
  const unregisterPlugin = useCallback((pluginId: string): boolean => {
    const result = service.unregisterPlugin(pluginId);
    setPlugins(service.getAllPlugins());
    return result;
  }, [service]);
  
  // ============ Plugin Lifecycle ============
  
  const enablePlugin = useCallback(async (pluginId: string): Promise<void> => {
    await service.enablePlugin(pluginId);
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  const disablePlugin = useCallback(async (pluginId: string): Promise<void> => {
    await service.disablePlugin(pluginId);
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  const loadPlugin = useCallback(async (pluginId: string): Promise<void> => {
    await service.loadPlugin(pluginId);
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  const unloadPlugin = useCallback(async (pluginId: string): Promise<void> => {
    await service.unloadPlugin(pluginId);
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  // ============ Plugin Configuration ============
  
  const getPluginConfig = useCallback((pluginId: string): PluginConfig | null => {
    return service.getPluginConfig(pluginId);
  }, [service]);
  
  const updatePluginSettings = useCallback(async (
    pluginId: string,
    settings: Record<string, unknown>
  ): Promise<void> => {
    await service.updatePluginSettings(pluginId, settings);
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  const getPluginSettingsSchema = useCallback((pluginId: string): PluginSettingSchema[] | null => {
    return service.getPluginSettingsSchema(pluginId);
  }, [service]);
  
  const setPluginAutoStart = useCallback((pluginId: string, autoStart: boolean) => {
    const plugin = service.getPlugin(pluginId);
    if (plugin) {
      plugin.config.autoStart = autoStart;
      plugin.config.lastUpdated = Date.now();
      setPlugins(service.getAllPlugins());
    }
  }, [service]);
  
  // ============ Plugin Queries ============
  
  const getPlugin = useCallback((pluginId: string): Plugin | undefined => {
    return service.getPlugin(pluginId);
  }, [service]);
  
  const getPluginsByType = useCallback((type: PluginType): Plugin[] => {
    return service.getPluginsByType(type);
  }, [service]);
  
  const getPluginsByStatus = useCallback((status: PluginStatus): Plugin[] => {
    return service.getPluginsByStatus(status);
  }, [service]);
  
  const getEnabledPlugins = useCallback((): Plugin[] => {
    return service.getEnabledPlugins();
  }, [service]);
  
  const getRunningPlugins = useCallback((): Plugin[] => {
    return service.getRunningPlugins();
  }, [service]);
  
  // ============ Statistics ============
  
  const getStatistics = useCallback((): PluginStatistics => {
    return service.getStatistics();
  }, [service]);
  
  // ============ Auto-load ============
  
  const autoLoadPlugins = useCallback(async (): Promise<void> => {
    await service.autoLoadPlugins();
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  const unloadAll = useCallback(async (): Promise<void> => {
    await service.unloadAll();
    setPlugins(service.getAllPlugins());
  }, [service]);
  
  return {
    // State
    config,
    plugins,
    statistics,
    
    // Configuration
    updateConfig,
    resetConfig,
    
    // Registration
    registerPlugin,
    unregisterPlugin,
    
    // Lifecycle
    enablePlugin,
    disablePlugin,
    loadPlugin,
    unloadPlugin,
    
    // Plugin Configuration
    getPluginConfig,
    updatePluginSettings,
    getPluginSettingsSchema,
    setPluginAutoStart,
    
    // Queries
    getPlugin,
    getPluginsByType,
    getPluginsByStatus,
    getEnabledPlugins,
    getRunningPlugins,
    
    // Statistics
    getStatistics,
    
    // Auto-load
    autoLoadPlugins,
    unloadAll,
  };
}