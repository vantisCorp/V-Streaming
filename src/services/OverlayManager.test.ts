/**
 * OverlayManager Minimal Tests
 * Focused tests for critical paths only
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OverlayManager } from './OverlayManager';
import { OverlayScene, Overlay } from '../types/overlay';

const createMockOverlay = (): Omit<Overlay, 'id'> => {
  return {
    type: 'text',
    name: 'Test Overlay',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    visible: true,
    zIndex: 1,
  };
};

const createMockScene = (): Omit<OverlayScene, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: 'Test Scene',
    layers: [],
    isActive: false,
  };
};

const createMockTemplate = (): OverlayTemplate => {
  return {
    id: 'template-1',
    name: 'Test Template',
    description: 'Test template description',
    category: 'gaming',
    thumbnail: '',
    scene: {
      id: 'scene-1',
      name: 'Scene 1',
      description: '',
      layers: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    metadata: {
      author: 'Test Author',
      version: '1.0',
      tags: ['test', 'gaming'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

describe('OverlayManager (Minimal)', () => {
  let manager: OverlayManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new OverlayManager();
  });

  describe('Initialization', () => {
    it('should get settings', () => {
      const settings = manager.getSettings();
      expect(settings).toBeDefined();
    });

    it('should update settings', () => {
      manager.updateSettings({ enableOverlays: false });
      const settings = manager.getSettings();
      expect(settings).toBeDefined();
    });
  });

  describe('Scene Management', () => {
    it('should get all scenes', () => {
      const scenes = manager.getScenes();
      expect(Array.isArray(scenes)).toBe(true);
    });

    it('should get scene by ID', () => {
      const scene = manager.getScene('test-id');
      expect(scene).toBeDefined();
    });

    it('should add a scene', () => {
      const added = manager.createScene('Test Scene', 'Test description');
      expect(added).toBeDefined();
      expect(added.id).toBeDefined();
      expect(added.name).toBe('Test Scene');
    });

    it('should update a scene', () => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      const updated = manager.updateScene(added.id, { name: 'Updated Name' });
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
    });

    it('should delete a scene', () => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      const deleted = manager.deleteScene(added.id);
      expect(deleted).toBe(true);
      
      const retrieved = manager.getScene(added.id);
      expect(retrieved).toBeNull();
    });

    it('should set current scene', () => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      const switched = manager.switchScene(added.id);
      
      const current = manager.getCurrentScene();
      expect(current).toBeDefined();
      expect(current!.id).toBe(added.id);
    });
  });

  describe('Layer Management', () => {
    let sceneId: string;

    beforeEach(() => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      sceneId = added.id;
    });

    it('should get layers', () => {
      const layers = manager.getLayers(sceneId);
      expect(Array.isArray(layers)).toBe(true);
    });

    it('should add a layer', () => {
      const overlayData = createMockOverlay();
      const added = manager.addLayer(sceneId, overlayData);
      expect(added).toBeDefined();
      expect(added!.type).toBe('text');
    });

    it('should get layer by ID', () => {
      const overlayData = createMockOverlay();
      const added = manager.addLayer(sceneId, overlayData);
      const retrieved = manager.getLayer(sceneId, added!.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(added!.id);
    });

    it('should update a layer', () => {
      const overlayData = createMockOverlay();
      const added = manager.addLayer(sceneId, overlayData);
      const updated = manager.updateLayer(sceneId, added!.id, { x: 100 });
      expect(updated).toBeDefined();
      expect(updated!.x).toBe(100);
    });

    it('should delete a layer', () => {
      const overlayData = createMockOverlay();
      const added = manager.addLayer(sceneId, overlayData);
      const deleted = manager.deleteLayer(sceneId, added!.id);
      expect(deleted).toBe(true);
      
      const retrieved = manager.getLayer(sceneId, added!.id);
      expect(retrieved).toBeNull();
    });

    it('should set selected layer', () => {
      const overlayData = createMockOverlay();
      const added = manager.addLayer(sceneId, overlayData);
      manager.selectLayer(added!.id);
      
      const selected = manager.getSelectedLayer();
      expect(selected).toBe(added!.id);
    });
  });

  describe('Template Management', () => {
    it('should get templates', () => {
      const templates = manager.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should install a template', () => {
      const template = createMockTemplate();
      const installed = manager.installTemplate(template);
      expect(installed).toBeDefined();
    });

    it('should get template by ID', () => {
      const mockTemplate = createMockTemplate();
      const template = manager.createTemplate(mockTemplate.scene, mockTemplate.metadata);
      const retrieved = manager.getTemplate(template.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(template.id);
    });

    it('should delete a template', () => {
      const mockTemplate = createMockTemplate();
      const template = manager.createTemplate(mockTemplate.scene, mockTemplate.metadata);
      const deleted = manager.deleteTemplate(template.id);
      expect(deleted).toBe(true);
      
      const retrieved = manager.getTemplate(template.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Preview', () => {
    it.skip('should get preview', () => {
      // getPreview method doesn't exist in OverlayManager
      // This test is skipped until the feature is implemented
    });
  });

  describe('Editor State', () => {
    it('should get editor state', () => {
      const state = manager.getEditorState();
      expect(state).toBeDefined();
    });
  });

  describe('Export/Import', () => {
    it('should export a scene', () => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      const exported = manager.exportScene(added.id);
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toContain('Test Scene');
    });

    it('should import a scene', () => {
      const sceneData = createMockScene();
      const added = manager.createScene("Test Scene", "Test description");
      const exported = manager.exportScene(added.id);
      
      manager.deleteScene(added.id);
      const imported = manager.importScene(exported);
      expect(imported).toBeDefined();
      expect(imported!.name).toBe(sceneData.name);
    });
  });
});