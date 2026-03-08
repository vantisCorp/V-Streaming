/**
 * Unit tests for PluginManagerService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PluginManagerService } from '../services/PluginManagerService';
import {
  PluginManifest,
  PluginStatus,
  PluginType,
  PluginHookType,
  PluginPermission,
  PluginAPIAccess,
  PluginInstance,
} from '../types/plugin';

function createTestManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test Author',
    license: 'MIT',
    keywords: ['test'],
    categories: [PluginType.UTILITY],
    minAppVersion: '1.0.0',
    requiredPermissions: [PluginPermission.READ],
    requiredAPIAccess: PluginAPIAccess.BASIC,
    hasSettings: false,
    ...overrides,
  };
}

function createTestInstance(): PluginInstance {
  return {
    onLoad: vi.fn().mockResolvedValue(undefined),
    onUnload: vi.fn().mockResolvedValue(undefined),
    onEnable: vi.fn().mockResolvedValue(undefined),
    onDisable: vi.fn().mockResolvedValue(undefined),
  };
}

describe('PluginManagerService', () => {
  let service: PluginManagerService;

  beforeEach(() => {
    // @ts-ignore
    PluginManagerService.instance = null;
    service = PluginManagerService.getInstance();
    localStorage.clear();
    const plugins = service.getAllPlugins();
    plugins.forEach(p => service.unregisterPlugin(p.manifest.id));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      expect(PluginManagerService.getInstance()).toBe(PluginManagerService.getInstance());
    });
  });

  describe('Configuration Management', () => {
    it('should get default config', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxPlugins).toBe(50);
    });

    it('should update config', () => {
      service.updateConfig({ maxPlugins: 100 });
      expect(service.getConfig().maxPlugins).toBe(100);
    });

    it('should reset config', () => {
      service.updateConfig({ maxPlugins: 100 });
      service.resetConfig();
      expect(service.getConfig().maxPlugins).toBe(50);
    });
  });

  describe('Plugin Registration', () => {
    it('should register a valid plugin', () => {
      const result = service.registerPlugin(createTestManifest());
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
    });

    it('should fail duplicate registration', () => {
      service.registerPlugin(createTestManifest());
      const result = service.registerPlugin(createTestManifest());
      expect(result.success).toBe(false);
    });

    it('should fail with missing ID', () => {
      const result = service.registerPlugin(createTestManifest({ id: '' }));
      expect(result.success).toBe(false);
    });

    it('should fail with missing name', () => {
      const result = service.registerPlugin(createTestManifest({ name: '' }));
      expect(result.success).toBe(false);
    });
  });

  describe('Plugin Queries', () => {
    it('should get plugin by ID', () => {
      service.registerPlugin(createTestManifest());
      expect(service.getPlugin('test-plugin')).toBeDefined();
    });

    it('should return undefined for non-existent', () => {
      expect(service.getPlugin('non-existent')).toBeUndefined();
    });

    it('should get all plugins', () => {
      service.registerPlugin(createTestManifest({ id: 'p1' }));
      service.registerPlugin(createTestManifest({ id: 'p2' }));
      expect(service.getAllPlugins().length).toBe(2);
    });

    it('should get plugins by type', () => {
      service.registerPlugin(createTestManifest({ categories: [PluginType.ANALYTICS] }));
      const plugins = service.getPluginsByType(PluginType.ANALYTICS);
      expect(plugins.length).toBe(1);
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should enable a plugin', async () => {
      const instance = createTestInstance();
      service.registerPlugin(createTestManifest(), instance);
      await service.enablePlugin('test-plugin');
      expect(service.getPlugin('test-plugin')?.state.status).toBe(PluginStatus.RUNNING);
    });

    it('should disable a plugin', async () => {
      const instance = createTestInstance();
      service.registerPlugin(createTestManifest(), instance);
      await service.enablePlugin('test-plugin');
      await service.disablePlugin('test-plugin');
      expect(service.getPlugin('test-plugin')?.state.status).toBe(PluginStatus.DISABLED);
    });

    it('should throw for non-existent plugin', async () => {
      await expect(service.enablePlugin('non-existent')).rejects.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should return statistics', () => {
      service.registerPlugin(createTestManifest());
      const stats = service.getStatistics();
      expect(stats.totalPlugins).toBe(1);
    });
  });

  describe('Events', () => {
    it('should emit pluginInstalled event', () => {
      const listener = vi.fn();
      service.on('pluginInstalled', listener);
      service.registerPlugin(createTestManifest());
      expect(listener).toHaveBeenCalled();
    });

    it('should emit pluginUninstalled event', () => {
      service.registerPlugin(createTestManifest());
      const listener = vi.fn();
      service.on('pluginUninstalled', listener);
      service.unregisterPlugin('test-plugin');
      expect(listener).toHaveBeenCalled();
    });
  });
});