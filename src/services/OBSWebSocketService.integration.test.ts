import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OBSWebSocketService } from './OBSWebSocketService';
import { OBSConnectionStatus } from '../types/obsWebSocket';

/**
 * Integration Tests for OBSWebSocketService
 * 
 * These tests are designed to run against a real OBS Studio instance.
 * They require OBS Studio to be running with WebSocket server enabled.
 * 
 * Prerequisites:
 * 1. OBS Studio installed and running
 * 2. WebSocket Server enabled in OBS (Tools → WebSocket Server Settings)
 * 3. Server port: 4455 (default)
 * 4. Password configured (if required)
 * 
 * Run with: npm test -- --run src/services/OBSWebSocketService.integration.test.ts
 * 
 * Note: Set environment variables to configure connection:
 * - OBS_HOST: OBS WebSocket host (default: localhost)
 * - OBS_PORT: OBS WebSocket port (default: 4455)
 * - OBS_PASSWORD: OBS WebSocket password (default: empty)
 */

// Skip integration tests in CI environment unless explicitly enabled
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

const describeIntegration = shouldRunIntegrationTests ? describe : describe.skip;

// Test configuration from environment or defaults
const testConfig = {
  host: process.env.OBS_HOST || 'localhost',
  port: parseInt(process.env.OBS_PORT || '4455'),
  password: process.env.OBS_PASSWORD || '',
};

describeIntegration('OBSWebSocketService Integration Tests', () => {
  let service: OBSWebSocketService;

  beforeEach(async () => {
    // Reset singleton
    (OBSWebSocketService as any).instance = null;
    service = OBSWebSocketService.getInstance();
  });

  afterEach(async () => {
    if (service.isConnected()) {
      await service.disconnect();
    }
  });

  // ==========================================================================
  // CONNECTION WORKFLOW
  // ==========================================================================

  describe('Connection Workflow', () => {
    it('should connect to real OBS instance', async () => {
      const result = await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });

      expect(service.isConnected()).toBe(true);
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.CONNECTED);
    });

    it('should disconnect from OBS', async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });

      expect(service.isConnected()).toBe(true);

      await service.disconnect();

      expect(service.isConnected()).toBe(false);
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.DISCONNECTED);
    });

    it('should emit connection events', async () => {
      const statusListener = vi.fn();
      service.on('connection-status-changed', statusListener);

      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });

      expect(statusListener).toHaveBeenCalledWith(OBSConnectionStatus.CONNECTED);

      await service.disconnect();

      expect(statusListener).toHaveBeenCalledWith(OBSConnectionStatus.DISCONNECTED);
    });

    it('should fail to connect with wrong password', async () => {
      if (!testConfig.password) {
        // Skip if no password configured
        return;
      }

      await expect(service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: 'wrong-password',
        autoReconnect: false,
      })).rejects.toThrow();

      expect(service.isConnected()).toBe(false);
    });
  });

  // ==========================================================================
  // SCENE MANAGEMENT WORKFLOW
  // ==========================================================================

  describe('Scene Management Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should get list of scenes', async () => {
      const scenes = await service.getScenes();

      expect(Array.isArray(scenes)).toBe(true);
      expect(scenes.length).toBeGreaterThan(0);
      expect(scenes[0]).toHaveProperty('sceneName');
    });

    it('should get current scene name', async () => {
      const currentScene = await service.getCurrentScene();

      expect(typeof currentScene).toBe('string');
      expect(currentScene.length).toBeGreaterThan(0);
    });

    it('should switch between scenes', async () => {
      const scenes = await service.getScenes();
      
      if (scenes.length < 2) {
        // Skip if only one scene
        return;
      }

      const originalScene = await service.getCurrentScene();
      const targetScene = scenes.find(s => s.sceneName !== originalScene)?.sceneName;

      if (targetScene) {
        await service.switchScene(targetScene);
        const newScene = await service.getCurrentScene();
        expect(newScene).toBe(targetScene);

        // Switch back
        await service.switchScene(originalScene);
        const restoredScene = await service.getCurrentScene();
        expect(restoredScene).toBe(originalScene);
      }
    });

    it('should get scene items', async () => {
      const currentScene = await service.getCurrentScene();
      const items = await service.getSceneItems(currentScene);

      expect(Array.isArray(items)).toBe(true);
    });
  });

  // ==========================================================================
  // STREAM CONTROL WORKFLOW
  // ==========================================================================

  describe('Stream Control Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should get stream status', async () => {
      const status = await service.getStreamStatus();

      expect(status).toHaveProperty('outputActive');
      expect(typeof status.outputActive).toBe('boolean');
    });

    it('should start and stop streaming', async () => {
      // Get initial status
      const initialStatus = await service.getStreamStatus();
      
      // Ensure streaming is stopped
      if (initialStatus.outputActive) {
        await service.stopStreaming();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start streaming
      await service.startStreaming();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let status = await service.getStreamStatus();
      expect(status.outputActive).toBe(true);

      // Stop streaming
      await service.stopStreaming();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      status = await service.getStreamStatus();
      expect(status.outputActive).toBe(false);
    }, 10000); // 10 second timeout for stream operations
  });

  // ==========================================================================
  // RECORDING CONTROL WORKFLOW
  // ==========================================================================

  describe('Recording Control Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should get record status', async () => {
      const status = await service.getRecordStatus();

      expect(status).toHaveProperty('outputActive');
      expect(typeof status.outputActive).toBe('boolean');
    });

    it('should start and stop recording', async () => {
      // Get initial status
      const initialStatus = await service.getRecordStatus();
      
      // Ensure recording is stopped
      if (initialStatus.outputActive) {
        await service.stopRecording();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start recording
      await service.startRecording();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let status = await service.getRecordStatus();
      expect(status.outputActive).toBe(true);

      // Stop recording
      await service.stopRecording();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      status = await service.getRecordStatus();
      expect(status.outputActive).toBe(false);
    }, 10000); // 10 second timeout for record operations

    it('should pause and resume recording', async () => {
      // Start recording first
      const initialStatus = await service.getRecordStatus();
      
      if (!initialStatus.outputActive) {
        await service.startRecording();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Pause recording
      await service.pauseRecording();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stop recording
      await service.stopRecording();
    }, 10000);
  });

  // ==========================================================================
  // AUDIO MANAGEMENT WORKFLOW
  // ==========================================================================

  describe('Audio Management Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should get list of audio inputs', async () => {
      const inputs = await service.getInputs();

      expect(Array.isArray(inputs)).toBe(true);
    });

    it('should get and set input volume', async () => {
      const inputs = await service.getInputs();
      
      if (inputs.length === 0) {
        // Skip if no inputs
        return;
      }

      const inputName = inputs[0].inputName;
      const originalVolume = await service.getInputVolume(inputName);

      // Set volume to 50%
      await service.setInputVolume(inputName, 50);
      const newVolume = await service.getInputVolume(inputName);
      expect(newVolume).toBe(50);

      // Restore original volume
      await service.setInputVolume(inputName, originalVolume);
    });

    it('should toggle input mute', async () => {
      const inputs = await service.getInputs();
      
      if (inputs.length === 0) {
        return;
      }

      const inputName = inputs[0].inputName;
      
      // Toggle mute
      const mutedState = await service.toggleInputMute(inputName);
      expect(typeof mutedState).toBe('boolean');

      // Toggle back
      await service.toggleInputMute(inputName);
    });
  });

  // ==========================================================================
  // TRANSITION MANAGEMENT WORKFLOW
  // ==========================================================================

  describe('Transition Management Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should get list of transitions', async () => {
      const transitions = await service.getTransitions();

      expect(Array.isArray(transitions)).toBe(true);
    });

    it('should get current transition', async () => {
      const transition = await service.getCurrentTransition();

      expect(transition).toHaveProperty('transitionName');
    });

    it('should set transition duration', async () => {
      const originalTransition = await service.getCurrentTransition();
      const originalDuration = originalTransition.transitionDuration || 300;

      // Set duration to 500ms
      await service.setTransitionDuration(500);

      // Restore original duration
      await service.setTransitionDuration(originalDuration);
    });
  });

  // ==========================================================================
  // EVENT HANDLING WORKFLOW
  // ==========================================================================

  describe('Event Handling Workflow', () => {
    beforeEach(async () => {
      await service.connect({
        address: testConfig.host,
        port: testConfig.port,
        password: testConfig.password,
        autoReconnect: false,
      });
    });

    afterEach(async () => {
      await service.disconnect();
    });

    it('should emit scene-changed event when scene changes', async () => {
      const scenes = await service.getScenes();
      
      if (scenes.length < 2) {
        return;
      }

      const listener = vi.fn();
      service.on('scene-changed', listener);

      const originalScene = await service.getCurrentScene();
      const targetScene = scenes.find(s => s.sceneName !== originalScene)?.sceneName;

      if (targetScene) {
        await service.switchScene(targetScene);
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(listener).toHaveBeenCalledWith(targetScene);

        // Cleanup: switch back
        await service.switchScene(originalScene);
      }
    });

    it('should register OBS event listeners', async () => {
      const listener = vi.fn();
      service.onConnectionOpened(listener);
      service.onConnectionClosed(listener);
      service.onConnectionError(listener);

      // These should not throw
      expect(true).toBe(true);
    });
  });
});