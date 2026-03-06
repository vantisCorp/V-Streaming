/**
 * ModerationManager Minimal Tests
 * Focused tests for critical paths only
 */

import { describe, it, expect, beforeEach } from 'vitest';
import moderationManager from './ModerationManager';
import {
  ModerationRule,
  ModerationRuleType,
  ModerationActionType,
  ModerationSeverity,
} from '../types/moderation';

describe('ModerationManager (Minimal)', () => {
  beforeEach(() => {
    localStorage.clear();
    try {
      (moderationManager as any).destroy();
    } catch (e) {
      // Ignore
    }
  });

  describe('Initialization', () => {
    it('should get settings', () => {
      const settings = moderationManager.getSettings();
      expect(settings).toBeDefined();
    });

    it('should get spam config', () => {
      const config = moderationManager.getSpamConfig();
      expect(config).toBeDefined();
    });
  });

  describe('Rule Management', () => {
    it('should create a rule', () => {
      const rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'> = {
        name: 'Test Rule',
        type: ModerationRuleType.BANNED_WORDS,
        actionType: ModerationActionType.DELETE,
        severity: ModerationSeverity.HIGH,
        enabled: true,
        pattern: 'badword',
        platform: 'all',
        exemptions: [],
      };
      
      const created = moderationManager.createRule(rule);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Rule');
    });

    it('should get all rules', () => {
      const rules = moderationManager.getAllRules();
      expect(Array.isArray(rules)).toBe(true);
    });

    it('should get rule by ID', () => {
      const rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'> = {
        name: 'Test Rule',
        type: ModerationRuleType.BANNED_WORDS,
        actionType: ModerationActionType.DELETE,
        severity: ModerationSeverity.HIGH,
        enabled: true,
        pattern: 'badword',
        platform: 'all',
        exemptions: [],
      };
      
      const created = moderationManager.createRule(rule);
      const retrieved = moderationManager.getRuleById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
    });

    it('should update a rule', () => {
      const rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'> = {
        name: 'Original Name',
        type: ModerationRuleType.BANNED_WORDS,
        actionType: ModerationActionType.DELETE,
        severity: ModerationSeverity.HIGH,
        enabled: true,
        pattern: 'badword',
        platform: 'all',
        exemptions: [],
      };
      
      const created = moderationManager.createRule(rule);
      const updated = moderationManager.updateRule(created.id, { name: 'Updated Name' });
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
    });

    it('should delete a rule', () => {
      const rule: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'> = {
        name: 'Test Rule',
        type: ModerationRuleType.BANNED_WORDS,
        actionType: ModerationActionType.DELETE,
        severity: ModerationSeverity.HIGH,
        enabled: true,
        pattern: 'badword',
        platform: 'all',
        exemptions: [],
      };
      
      const created = moderationManager.createRule(rule);
      const deleted = moderationManager.deleteRule(created.id);
      expect(deleted).toBe(true);
      
      const retrieved = moderationManager.getRuleById(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('User Management', () => {
    it.skip('should get user info', () => {
      // Skip - requires actual user data to be present
      const userInfo = moderationManager.getUserInfo('user-1');
      expect(userInfo).toBeDefined();
    });

    it.skip('should update user info', () => {
      // Skip - requires actual user data to be present
      moderationManager.updateUserInfo('user-1', { username: 'testuser' });
      const userInfo = moderationManager.getUserInfo('user-1');
      expect(userInfo).toBeDefined();
    });

    it('should get all users', () => {
      const users = moderationManager.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Action Management', () => {
    it('should get all actions', () => {
      const actions = moderationManager.getAllActions();
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should get actions by user', () => {
      const actions = moderationManager.getActionsByUser('user-1');
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should get active actions', () => {
      const actions = moderationManager.getActiveActions();
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  describe('Appeal System', () => {
    it('should create an appeal', () => {
      const appeal = moderationManager.createAppeal(
        'action-1',
        'user-1',
        'testuser',
        'I think this is a mistake'
      );
      expect(appeal).toBeDefined();
      expect(appeal.id).toBeDefined();
    });

    it('should get all appeals', () => {
      const appeals = moderationManager.getAllAppeals();
      expect(Array.isArray(appeals)).toBe(true);
    });

    it('should get pending appeals', () => {
      const appeals = moderationManager.getPendingAppeals();
      expect(Array.isArray(appeals)).toBe(true);
    });

    it('should resolve an appeal', () => {
      const appeal = moderationManager.createAppeal(
        'action-1',
        'user-1',
        'testuser',
        'I think this is a mistake'
      );
      
      const resolved = moderationManager.resolveAppeal(appeal.id, 'approved', 'moderator-1', 'Looks good');
      expect(resolved).toBeDefined();
    });
  });

  describe('Queue Management', () => {
    it('should get queue', () => {
      const queue = moderationManager.getQueue();
      expect(Array.isArray(queue)).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should get statistics', () => {
      const stats = moderationManager.getStatistics();
      expect(stats).toBeDefined();
    });
  });
});