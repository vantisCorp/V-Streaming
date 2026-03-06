/**
 * ArchiveManager Minimal Tests
 * Focused tests for critical paths only
 */

import { describe, it, expect, beforeEach } from 'vitest';
import archiveManager from './ArchiveManager';
import {
  Archive,
  ArchiveStatus,
  ArchiveFormat,
} from '../types/archive';

const createMockArchive = (): Omit<Archive, 'id' | 'createdAt'> => {
  const now = new Date();
  return {
    name: 'Test Stream',
    description: 'Test description',
    filePath: '/test/path.mp4',
    format: ArchiveFormat.MP4,
    quality: 'high',
    status: ArchiveStatus.COMPLETED,
    size: 1000000000,
    duration: 3600,
    createdAt: now,
    completedAt: now,
    platform: 'twitch',
    category: 'gaming',
    tags: ['test', 'gaming'],
    isFavorite: false,
    isProtected: false,
    viewCount: 0,
    downloadCount: 0,
    streamInfo: {
      title: 'Test Stream',
      startTime: now,
      endTime: now,
      peakViewers: 100,
      avgViewers: 50,
      followers: 5,
      messages: 20,
    },
    recordingConfig: {
      format: 'mp4',
      quality: 'high',
      audioBitrate: 128,
      videoBitrate: 5000,
    },
    storageConfig: {
      location: 'local',
      path: '/test/path',
      autoCleanup: false,
    },
  };
};

describe('ArchiveManager (Minimal)', () => {
  beforeEach(() => {
    localStorage.clear();
    try {
      (archiveManager as any).destroy();
    } catch (e) {
      // Ignore
    }
  });

  describe('Initialization', () => {
    it('should get all archives', () => {
      const archives = archiveManager.getAllArchives();
      expect(Array.isArray(archives)).toBe(true);
    });

    it('should get archive by ID', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const archive = archiveManager.getArchiveById(created.id);
      expect(archive).toBeDefined();
      expect(archive!.id).toBe(created.id);
    });

    it('should get statistics', () => {
      const stats = archiveManager.getStatistics();
      expect(stats).toBeDefined();
    });
  });

  describe('Archive Management', () => {
    it('should create an archive', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Stream');
    });

    it('should update an archive', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const updated = archiveManager.updateArchive(created.id, { name: 'Updated Name' });
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
    });

    it('should delete an archive', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const deleted = archiveManager.deleteArchive(created.id);
      expect(deleted).toBe(true);
      
      const retrieved = archiveManager.getArchiveById(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Recording', () => {
    it('should check if recording', () => {
      const isRecording = archiveManager.isRecording();
      expect(typeof isRecording).toBe('boolean');
    });

    it('should get current recording', () => {
      const current = archiveManager.getCurrentRecording();
      expect(current).toBeDefined();
    });
  });

  describe('Search and Sort', () => {
    it('should search archives', () => {
      const archiveData = createMockArchive();
      archiveManager.createArchive(archiveData);
      
      const results = archiveManager.searchArchives({
        query: 'Test',
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should sort archives', () => {
      const archiveData1 = createMockArchive();
      const archiveData2 = createMockArchive();
      archiveManager.createArchive(archiveData1);
      archiveManager.createArchive(archiveData2);
      
      const archives = archiveManager.getAllArchives();
      const sorted = archiveManager.sortArchives(archives, 'date-asc');
      expect(Array.isArray(sorted)).toBe(true);
    });
  });

  describe('Tag Management', () => {
    it('should add a tag', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const added = archiveManager.addTag(created.id, 'test-tag');
      expect(added).toBe(true);
    });

    it('should remove a tag', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      archiveManager.addTag(created.id, 'test-tag');
      const removed = archiveManager.removeTag(created.id, 'test-tag');
      expect(removed).toBe(true);
    });

    it('should get all tags', () => {
      const tags = archiveManager.getAllTags();
      expect(Array.isArray(tags)).toBe(true);
    });
  });

  describe('Toggle Features', () => {
    it('should toggle favorite', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const toggled = archiveManager.toggleFavorite(created.id);
      expect(typeof toggled).toBe('boolean');
    });

    it('should toggle protection', () => {
      const archiveData = createMockArchive();
      const created = archiveManager.createArchive(archiveData);
      const toggled = archiveManager.toggleProtection(created.id);
      expect(typeof toggled).toBe('boolean');
    });
  });

  describe('Configuration', () => {
    it('should get recording config', () => {
      const config = archiveManager.getRecordingConfig();
      expect(config).toBeDefined();
    });

    it('should get storage config', () => {
      const config = archiveManager.getStorageConfig();
      expect(config).toBeDefined();
    });

    it('should get auto-delete config', () => {
      const config = archiveManager.getAutoDeleteConfig();
      expect(config).toBeDefined();
    });
  });
});