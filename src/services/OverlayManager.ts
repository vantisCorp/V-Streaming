import { EventEmitter } from 'events';
import {
  Overlay,
  OverlayScene,
  OverlayTemplate,
  OverlaySettings,
  OverlayEditorState,
  OverlayType,
  WidgetType,
  WidgetConfig,
  WidgetData,
  MarketplaceFilter,
  MarketplaceStats,
  Position,
  Size,
  DEFAULT_OVERLAY_SETTINGS,
} from '../types/overlays';

interface OverlayManagerEvents {
  sceneCreated: (scene: OverlayScene) => void;
  sceneUpdated: (scene: OverlayScene) => void;
  sceneDeleted: (sceneId: string) => void;
  sceneSwitched: (scene: OverlayScene | null) => void;
  layerAdded: (sceneId: string, layer: Overlay) => void;
  layerUpdated: (sceneId: string, layer: Overlay) => void;
  layerDeleted: (sceneId: string, layerId: string) => void;
  layerSelected: (layerId: string | null) => void;
  settingsChanged: (settings: OverlaySettings) => void;
  templateInstalled: (template: OverlayTemplate) => void;
  templateUpdated: (template: OverlayTemplate) => void;
  templateDeleted: (templateId: string) => void;
  marketplaceRefreshed: (stats: MarketplaceStats) => void;
  undoStateChanged: (canUndo: boolean, canRedo: boolean) => void;
}

export class OverlayManager extends EventEmitter {
  private scenes: Map<string, OverlayScene> = new Map();
  private currentSceneId: string | null = null;
  private settings: OverlaySettings;
  private templates: Map<string, OverlayTemplate> = new Map();
  private editorState: OverlayEditorState;
  private storageKey = 'vstreaming_overlays';
  private settingsKey = 'vstreaming_overlay_settings';
  private templatesKey = 'vstreaming_overlay_templates';
  private autoSaveInterval?: ReturnType<typeof setInterval>;
  private backupInterval?: ReturnType<typeof setInterval>;

  constructor() {
    super();
    this.settings = { ...DEFAULT_OVERLAY_SETTINGS };
    this.editorState = this.createDefaultEditorState();
    this.loadFromStorage();
    this.loadSettings();
    this.loadTemplates();
    this.startAutoSave();
  }

  private createDefaultEditorState(): OverlayEditorState {
    return {
      selectedLayerId: null,
      clipboard: null,
      history: [],
      historyIndex: -1,
      gridVisible: true,
      gridSize: 16,
      snapToGrid: true,
      rulerVisible: true,
      zoom: 1,
      pan: { x: 0, y: 0 },
    };
  }

  private generateId(): string {
    return `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Scene Management
  createScene(name: string, description: string = ''): OverlayScene {
    const scene: OverlayScene = {
      id: this.generateId(),
      name,
      description,
      layers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scenes.set(scene.id, scene);
    this.saveToStorage();
    this.emit('sceneCreated', scene);
    return scene;
  }

  updateScene(sceneId: string, updates: Partial<OverlayScene>): OverlayScene | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const updatedScene = {
      ...scene,
      ...updates,
      updatedAt: new Date(),
    };

    this.scenes.set(sceneId, updatedScene);
    this.saveToStorage();
    this.emit('sceneUpdated', updatedScene);
    return updatedScene;
  }

  deleteScene(sceneId: string): boolean {
    if (!this.scenes.has(sceneId)) return false;

    this.scenes.delete(sceneId);
    if (this.currentSceneId === sceneId) {
      this.currentSceneId = null;
      this.emit('sceneSwitched', null);
    }
    this.saveToStorage();
    this.emit('sceneDeleted', sceneId);
    return true;
  }

  getScene(sceneId: string): OverlayScene | null {
    return this.scenes.get(sceneId) || null;
  }

  getScenes(): OverlayScene[] {
    return Array.from(this.scenes.values());
  }

  getCurrentScene(): OverlayScene | null {
    return this.currentSceneId ? this.scenes.get(this.currentSceneId) || null : null;
  }

  switchScene(sceneId: string): OverlayScene | null {
    if (!this.scenes.has(sceneId)) return null;

    this.currentSceneId = sceneId;
    const scene = this.scenes.get(sceneId)!;
    this.emit('sceneSwitched', scene);
    return scene;
  }

  // Layer Management
  addLayer(sceneId: string, layer: Omit<Overlay, 'id'>): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const newLayer = {
      ...layer,
      id: this.generateId(),
    } as Overlay;

    scene.layers.push(newLayer);
    scene.updatedAt = new Date();
    this.scenes.set(sceneId, scene);
    this.saveToStorage();
    this.emit('layerAdded', sceneId, newLayer);
    return newLayer;
  }

  updateLayer(sceneId: string, layerId: string, updates: Partial<Overlay>): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const layerIndex = scene.layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return null;

    const updatedLayer = {
      ...scene.layers[layerIndex],
      ...updates,
    } as Overlay;

    scene.layers[layerIndex] = updatedLayer;
    scene.updatedAt = new Date();
    this.scenes.set(sceneId, scene);
    this.saveToStorage();
    this.emit('layerUpdated', sceneId, updatedLayer);
    return updatedLayer;
  }

  deleteLayer(sceneId: string, layerId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const layerIndex = scene.layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return false;

    scene.layers.splice(layerIndex, 1);
    scene.updatedAt = new Date();
    this.scenes.set(sceneId, scene);
    this.saveToStorage();
    this.emit('layerDeleted', sceneId, layerId);
    return true;
  }

  getLayer(sceneId: string, layerId: string): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;
    return scene.layers.find(l => l.id === layerId) || null;
  }

  getLayers(sceneId: string): Overlay[] {
    const scene = this.scenes.get(sceneId);
    return scene ? [...scene.layers] : [];
  }

  // Layer Operations
  moveLayer(sceneId: string, layerId: string, position: Position): Overlay | null {
    return this.updateLayer(sceneId, layerId, { position });
  }

  resizeLayer(sceneId: string, layerId: string, size: Size): Overlay | null {
    return this.updateLayer(sceneId, layerId, { size });
  }

  setLayerVisibility(sceneId: string, layerId: string, visible: boolean): Overlay | null {
    return this.updateLayer(sceneId, layerId, { visible });
  }

  setLayerLock(sceneId: string, layerId: string, locked: boolean): Overlay | null {
    return this.updateLayer(sceneId, layerId, { locked });
  }

  setLayerOpacity(sceneId: string, layerId: string, opacity: number): Overlay | null {
    return this.updateLayer(sceneId, layerId, { opacity });
  }

  setLayerZIndex(sceneId: string, layerId: string, zIndex: number): Overlay | null {
    return this.updateLayer(sceneId, layerId, { zIndex });
  }

  bringToFront(sceneId: string, layerId: string): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const maxZIndex = Math.max(...scene.layers.map(l => l.zIndex), 0);
    return this.updateLayer(sceneId, layerId, { zIndex: maxZIndex + 1 });
  }

  sendToBack(sceneId: string, layerId: string): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const minZIndex = Math.min(...scene.layers.map(l => l.zIndex), 0);
    return this.updateLayer(sceneId, layerId, { zIndex: minZIndex - 1 });
  }

  duplicateLayer(sceneId: string, layerId: string): Overlay | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const layer = scene.layers.find(l => l.id === layerId);
    if (!layer) return null;

    const duplicatedLayer = {
      ...layer,
      id: this.generateId(),
      name: `${layer.name} (copy)`,
      position: {
        x: layer.position.x + 20,
        y: layer.position.y + 20,
      },
    } as Overlay;

    scene.layers.push(duplicatedLayer);
    scene.updatedAt = new Date();
    this.scenes.set(sceneId, scene);
    this.saveToStorage();
    this.emit('layerAdded', sceneId, duplicatedLayer);
    return duplicatedLayer;
  }

  // Editor State
  selectLayer(layerId: string | null): void {
    this.editorState.selectedLayerId = layerId;
    this.emit('layerSelected', layerId);
  }

  getSelectedLayer(): string | null {
    return this.editorState.selectedLayerId;
  }

  // Clipboard Operations
  copyLayer(sceneId: string, layerId: string): boolean {
    const layer = this.getLayer(sceneId, layerId);
    if (!layer) return false;

    this.editorState.clipboard = { ...layer };
    return true;
  }

  pasteLayer(sceneId: string): Overlay | null {
    if (!this.editorState.clipboard) return null;

    const pastedLayer = {
      ...this.editorState.clipboard,
      id: this.generateId(),
      name: `${this.editorState.clipboard.name} (pasted)`,
      position: {
        x: this.editorState.clipboard.position.x + 20,
        y: this.editorState.clipboard.position.y + 20,
      },
    } as Overlay;

    return this.addLayer(sceneId, pastedLayer);
  }

  // Undo/Redo
  pushToHistory(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) return;

    const historySnapshot = JSON.parse(JSON.stringify(scene));
    this.editorState.history = this.editorState.history.slice(0, this.editorState.historyIndex + 1);
    this.editorState.history.push(historySnapshot);
    this.editorState.historyIndex++;

    if (this.editorState.history.length > 100) {
      this.editorState.history.shift();
      this.editorState.historyIndex--;
    }

    this.emitUndoState();
  }

  undo(): OverlayScene | null {
    if (this.editorState.historyIndex <= 0) return null;

    this.editorState.historyIndex--;
    const scene = JSON.parse(JSON.stringify(this.editorState.history[this.editorState.historyIndex]));
    this.scenes.set(scene.id, scene);
    this.saveToStorage();
    this.emitUndoState();
    return scene;
  }

  redo(): OverlayScene | null {
    if (this.editorState.historyIndex >= this.editorState.history.length - 1) return null;

    this.editorState.historyIndex++;
    const scene = JSON.parse(JSON.stringify(this.editorState.history[this.editorState.historyIndex]));
    this.scenes.set(scene.id, scene);
    this.saveToStorage();
    this.emitUndoState();
    return scene;
  }

  canUndo(): boolean {
    return this.editorState.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.editorState.historyIndex < this.editorState.history.length - 1;
  }

  private emitUndoState(): void {
    this.emit('undoStateChanged', this.canUndo(), this.canRedo());
  }

  // Grid and Ruler
  setGridVisible(visible: boolean): void {
    this.editorState.gridVisible = visible;
  }

  setGridSize(size: number): void {
    this.editorState.gridSize = size;
  }

  setSnapToGrid(enabled: boolean): void {
    this.editorState.snapToGrid = enabled;
  }

  setRulerVisible(visible: boolean): void {
    this.editorState.rulerVisible = visible;
  }

  getEditorState(): OverlayEditorState {
    return { ...this.editorState };
  }

  // Widget Data
  async fetchWidgetData(widgetType: WidgetType, config: WidgetConfig): Promise<WidgetData> {
    const now = new Date();

    switch (widgetType) {
      case 'chat':
        return {
          type: widgetType,
          items: [],
          lastUpdated: now,
        };
      case 'viewercount':
        return {
          type: widgetType,
          items: [],
          total: 0,
          lastUpdated: now,
        };
      case 'subcount':
        return {
          type: widgetType,
          items: [],
          total: 0,
          lastUpdated: now,
        };
      case 'followergoal':
        return {
          type: widgetType,
          items: [],
          total: 0,
          goal: 1000,
          title: 'Follower Goal',
          lastUpdated: now,
        };
      case 'goal':
        return {
          type: widgetType,
          items: [],
          total: 0,
          goal: 100,
          title: 'Goal',
          lastUpdated: now,
        };
      case 'clock':
        return {
          type: widgetType,
          items: [],
          title: now.toLocaleTimeString(),
          lastUpdated: now,
        };
      case 'countdown':
        return {
          type: widgetType,
          items: [],
          title: '00:00:00',
          lastUpdated: now,
        };
      case 'timer':
        return {
          type: widgetType,
          items: [],
          title: '00:00:00',
          lastUpdated: now,
        };
      case 'weather':
        return {
          type: widgetType,
          items: [],
          title: 'Weather',
          subtitle: 'Clear, 22°C',
          lastUpdated: now,
        };
      case 'music':
        return {
          type: widgetType,
          items: [],
          title: 'Now Playing',
          subtitle: 'No music playing',
          lastUpdated: now,
        };
      default:
        return {
          type: widgetType,
          items: [],
          lastUpdated: now,
        };
    }
  }

  // Templates
  createTemplate(scene: OverlayScene, metadata: Partial<OverlayTemplate>): OverlayTemplate {
    const template: OverlayTemplate = {
      id: this.generateId(),
      name: scene.name,
      description: scene.description,
      category: 'Gaming',
      preview: '',
      thumbnail: '',
      author: 'Local User',
      version: '1.0.0',
      tags: [],
      scene: { ...scene, id: this.generateId() },
      dependencies: [],
      downloads: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...metadata,
    };

    this.templates.set(template.id, template);
    this.saveTemplates();
    return template;
  }

  installTemplate(template: OverlayTemplate): OverlayScene {
    const scene = this.createScene(
      template.name,
      template.description
    );

    scene.layers = JSON.parse(JSON.stringify(template.scene.layers));
    this.scenes.set(scene.id, scene);
    this.saveToStorage();
    this.emit('templateInstalled', template);
    return scene;
  }

  getTemplate(templateId: string): OverlayTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplates(): OverlayTemplate[] {
    return Array.from(this.templates.values());
  }

  deleteTemplate(templateId: string): boolean {
    if (!this.templates.has(templateId)) return false;

    this.templates.delete(templateId);
    this.saveTemplates();
    this.emit('templateDeleted', templateId);
    return true;
  }

  // Marketplace Simulation
  async fetchMarketplaceTemplates(filter?: MarketplaceFilter): Promise<OverlayTemplate[]> {
    let templates = this.getTemplates();

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        templates = templates.filter(t =>
          filter.tags!.some(tag => t.tags.includes(tag))
        );
      }
      if (filter.author) {
        templates = templates.filter(t => t.author === filter.author);
      }
      if (filter.minRating !== undefined) {
        templates = templates.filter(t => t.rating >= filter.minRating!);
      }
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filter.sortBy) {
        switch (filter.sortBy) {
          case 'popular':
            templates.sort((a, b) => b.downloads - a.downloads);
            break;
          case 'newest':
            templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;
          case 'rating':
            templates.sort((a, b) => b.rating - a.rating);
            break;
          case 'downloads':
            templates.sort((a, b) => b.downloads - a.downloads);
            break;
          case 'name':
            templates.sort((a, b) => a.name.localeCompare(b.name));
            break;
        }
      }
    }

    return templates;
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const templates = this.getTemplates();
    const sortedByDownloads = [...templates].sort((a, b) => b.downloads - a.downloads);
    const sortedByDate = [...templates].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return {
      totalTemplates: templates.length,
      totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
      totalAuthors: new Set(templates.map(t => t.author)).size,
      totalCategories: new Set(templates.map(t => t.category)).size,
      popularTemplates: sortedByDownloads.slice(0, 10),
      recentlyUpdated: sortedByDate.slice(0, 10),
    };
  }

  // Settings
  getSettings(): OverlaySettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<OverlaySettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    this.saveSettings();
    this.emit('settingsChanged', this.settings);
  }

  // Storage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.scenes = new Map(
          data.scenes?.map((s: OverlayScene) => [s.id, s]) || []
        );
        this.currentSceneId = data.currentSceneId || null;
      }
    } catch (error) {
      console.error('Failed to load overlays from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        scenes: Array.from(this.scenes.values()),
        currentSceneId: this.currentSceneId,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save overlays to storage:', error);
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.settingsKey);
      if (stored) {
        this.settings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          ...JSON.parse(stored),
        };
      }
    } catch (error) {
      console.error('Failed to load overlay settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save overlay settings:', error);
    }
  }

  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(this.templatesKey);
      if (stored) {
        const templates = JSON.parse(stored);
        this.templates = new Map(
          templates.map((t: OverlayTemplate) => [t.id, t])
        );
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem(
        this.templatesKey,
        JSON.stringify(Array.from(this.templates.values()))
      );
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  // Auto-save
  private startAutoSave(): void {
    if (this.settings.autoSave) {
      this.autoSaveInterval = setInterval(() => {
        this.saveToStorage();
      }, this.settings.saveInterval);
    }

    if (this.settings.autoBackup) {
      this.backupInterval = setInterval(() => {
        this.createBackup();
      }, this.settings.backupInterval);
    }
  }

  private createBackup(): void {
    try {
      const backupKey = `${this.storageKey}_backup_${Date.now()}`;
      const data = {
        scenes: Array.from(this.scenes.values()),
        currentSceneId: this.currentSceneId,
        timestamp: new Date(),
      };
      localStorage.setItem(backupKey, JSON.stringify(data));

      // Clean old backups
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(`${this.storageKey}_backup_`))
        .sort();

      while (backupKeys.length > this.settings.maxBackups) {
        localStorage.removeItem(backupKeys.shift()!);
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // Export/Import
  exportScene(sceneId: string): string | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    return JSON.stringify(scene, null, 2);
  }

  importScene(json: string): OverlayScene | null {
    try {
      const scene = JSON.parse(json) as OverlayScene;
      scene.id = this.generateId();
      scene.createdAt = new Date();
      scene.updatedAt = new Date();

      this.scenes.set(scene.id, scene);
      this.saveToStorage();
      this.emit('sceneCreated', scene);
      return scene;
    } catch (error) {
      console.error('Failed to import scene:', error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    this.removeAllListeners();
  }
}

export const overlayManager = new OverlayManager();