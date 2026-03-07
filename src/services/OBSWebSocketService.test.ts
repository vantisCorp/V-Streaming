import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OBSWebSocketService } from './OBSWebSocketService';
import { OBSConnectionStatus } from '../types/obsWebSocket';
import OBSWebSocket from 'obs-websocket-js';

// Mock obs-websocket-js
vi.mock('obs-websocket-js', () => {
  const mockObs = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    call: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  
  return {
    default: vi.fn(() => mockObs),
    EventSubscription: {
      All: 0,
      None: 1,
    },
  };
});

describe('OBSWebSocketService', () => {
  let service: OBSWebSocketService;
  let mockObs: any;

  beforeEach(() => {
    // Reset singleton
    (OBSWebSocketService as any).instance = null;
    service = OBSWebSocketService.getInstance();
    mockObs = new OBSWebSocket();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SINGLETON PATTERN
  // ==========================================================================

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OBSWebSocketService.getInstance();
      const instance2 = OBSWebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = OBSWebSocketService.getInstance();
      (OBSWebSocketService as any).instance = null;
      const instance2 = OBSWebSocketService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  describe('Connection Management', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
      autoReconnect: false,
    };

    it('should start with DISCONNECTED status', () => {
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.DISCONNECTED);
    });

    it('should return false for isConnected when disconnected', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should connect successfully with valid config', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });

      await service.connect(validConfig);

      expect(mockObs.connect).toHaveBeenCalledWith(
        'ws://localhost:4455',
        'test-password',
        expect.objectContaining({
          rpcVersion: 1,
        })
      );
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.CONNECTED);
      expect(service.isConnected()).toBe(true);
    });

    it('should throw error when already connected', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });

      await service.connect(validConfig);

      await expect(service.connect(validConfig)).rejects.toThrow(
        'Already connected or connecting'
      );
    });

    it('should handle connection failure', async () => {
      mockObs.connect.mockRejectedValue(new Error('Connection refused'));

      await expect(service.connect(validConfig)).rejects.toThrow('Connection refused');
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.ERROR);
    });

    it('should disconnect successfully', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      mockObs.disconnect.mockResolvedValue(undefined);

      await service.connect(validConfig);
      await service.disconnect();

      expect(mockObs.disconnect).toHaveBeenCalled();
      expect(service.getConnectionStatus()).toBe(OBSConnectionStatus.DISCONNECTED);
    });

    it('should emit connection-status-changed event on connect', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });

      const listener = vi.fn();
      service.on('connection-status-changed', listener);

      await service.connect(validConfig);

      expect(listener).toHaveBeenCalledWith(OBSConnectionStatus.CONNECTED);
    });

    it('should emit connection-status-changed event on disconnect', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      mockObs.disconnect.mockResolvedValue(undefined);

      const listener = vi.fn();
      service.on('connection-status-changed', listener);

      await service.connect(validConfig);
      await service.disconnect();

      expect(listener).toHaveBeenCalledWith(OBSConnectionStatus.DISCONNECTED);
    });
  });

  // ==========================================================================
  // SCENE MANAGEMENT
  // ==========================================================================

  describe('Scene Management', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should get all scenes', async () => {
      const mockScenes = [
        { sceneName: 'Scene 1', sceneIndex: 0 },
        { sceneName: 'Scene 2', sceneIndex: 1 },
      ];
      mockObs.call.mockResolvedValue({ scenes: mockScenes });

      const scenes = await service.getScenes();

      expect(mockObs.call).toHaveBeenCalledWith('GetSceneList');
      expect(scenes).toHaveLength(2);
      expect(scenes[0].sceneName).toBe('Scene 1');
      expect(scenes[1].sceneName).toBe('Scene 2');
    });

    it('should get current scene', async () => {
      mockObs.call.mockResolvedValue({ currentProgramSceneName: 'Scene 1' });

      const sceneName = await service.getCurrentScene();

      expect(mockObs.call).toHaveBeenCalledWith('GetCurrentProgramScene');
      expect(sceneName).toBe('Scene 1');
    });

    it('should switch scene', async () => {
      mockObs.call.mockResolvedValue({});

      await service.switchScene('New Scene');

      expect(mockObs.call).toHaveBeenCalledWith('SetCurrentProgramScene', {
        sceneName: 'New Scene',
      });
    });

    it('should get scene items', async () => {
      const mockItems = [
        { sourceName: 'Item 1', sceneItemId: 1 },
        { sourceName: 'Item 2', sceneItemId: 2 },
      ];
      mockObs.call.mockResolvedValue({ sceneItems: mockItems });

      const items = await service.getSceneItems('Scene 1');

      expect(mockObs.call).toHaveBeenCalledWith('GetSceneItemList', {
        sceneName: 'Scene 1',
      });
      expect(items).toHaveLength(2);
    });
  });

  // ==========================================================================
  // STREAM CONTROL
  // ==========================================================================

  describe('Stream Control', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should start streaming', async () => {
      mockObs.call.mockResolvedValue({});

      await service.startStreaming();

      expect(mockObs.call).toHaveBeenCalledWith('StartStream');
    });

    it('should stop streaming', async () => {
      mockObs.call.mockResolvedValue({});

      await service.stopStreaming();

      expect(mockObs.call).toHaveBeenCalledWith('StopStream');
    });

    it('should toggle streaming (stop when active)', async () => {
      // First call: GetStreamStatus returns active
      mockObs.call.mockResolvedValueOnce({ outputActive: true });
      // Second call: StopStream
      mockObs.call.mockResolvedValueOnce({});

      await service.toggleStream();

      expect(mockObs.call).toHaveBeenCalledWith('GetStreamStatus');
      expect(mockObs.call).toHaveBeenCalledWith('StopStream');
    });

    it('should toggle streaming (start when inactive)', async () => {
      // First call: GetStreamStatus returns inactive
      mockObs.call.mockResolvedValueOnce({ outputActive: false });
      // Second call: StartStream
      mockObs.call.mockResolvedValueOnce({});

      await service.toggleStream();

      expect(mockObs.call).toHaveBeenCalledWith('GetStreamStatus');
      expect(mockObs.call).toHaveBeenCalledWith('StartStream');
    });

    it('should get stream status', async () => {
      mockObs.call.mockResolvedValue({
        outputActive: true,
        outputDuration: 3600,
        outputBytes: 1000000,
        outputSkippedFrames: 0,
        outputTotalFrames: 108000,
        outputCongestion: 0.01,
      });

      const status = await service.getStreamStatus();

      expect(mockObs.call).toHaveBeenCalledWith('GetStreamStatus');
      expect(status.outputActive).toBe(true);
      expect(status.outputDuration).toBe(3600);
    });
  });

  // ==========================================================================
  // RECORDING CONTROL
  // ==========================================================================

  describe('Recording Control', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should start recording', async () => {
      mockObs.call.mockResolvedValue({});

      await service.startRecording();

      expect(mockObs.call).toHaveBeenCalledWith('StartRecord');
    });

    it('should stop recording', async () => {
      mockObs.call.mockResolvedValue({});

      await service.stopRecording();

      expect(mockObs.call).toHaveBeenCalledWith('StopRecord');
    });

    it('should toggle recording (stop when active)', async () => {
      // First call: GetRecordStatus returns active
      mockObs.call.mockResolvedValueOnce({ outputActive: true });
      // Second call: StopRecord
      mockObs.call.mockResolvedValueOnce({});

      await service.toggleRecording();

      expect(mockObs.call).toHaveBeenCalledWith('GetRecordStatus');
      expect(mockObs.call).toHaveBeenCalledWith('StopRecord');
    });

    it('should pause recording', async () => {
      mockObs.call.mockResolvedValue({});

      await service.pauseRecording();

      expect(mockObs.call).toHaveBeenCalledWith('PauseRecord');
    });

    it('should get record status', async () => {
      mockObs.call.mockResolvedValue({
        outputActive: true,
        outputDuration: 1800,
        outputBytes: 500000000,
        outputPath: '/path/to/recording.mp4',
      });

      const status = await service.getRecordStatus();

      expect(mockObs.call).toHaveBeenCalledWith('GetRecordStatus');
      expect(status.outputActive).toBe(true);
      expect(status.outputDuration).toBe(1800);
    });
  });

  // ==========================================================================
  // AUDIO MANAGEMENT
  // ==========================================================================

  describe('Audio Management', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should get inputs', async () => {
      const mockInputs = [
        { inputName: 'Microphone', inputKind: 'wasapi_input_capture' },
        { inputName: 'Desktop Audio', inputKind: 'wasapi_output_capture' },
      ];
      mockObs.call.mockResolvedValue({ inputs: mockInputs });

      const inputs = await service.getInputs();

      expect(mockObs.call).toHaveBeenCalledWith('GetInputList');
      expect(inputs).toHaveLength(2);
      expect(inputs[0].inputName).toBe('Microphone');
    });

    it('should set input mute', async () => {
      mockObs.call.mockResolvedValue({});

      await service.setInputMute('Microphone', true);

      expect(mockObs.call).toHaveBeenCalledWith('SetInputMute', {
        inputName: 'Microphone',
        inputMuted: true,
      });
    });

    it('should toggle input mute', async () => {
      mockObs.call.mockResolvedValue({ inputMuted: true });

      const result = await service.toggleInputMute('Microphone');

      expect(mockObs.call).toHaveBeenCalledWith('ToggleInputMute', {
        inputName: 'Microphone',
      });
      expect(result).toBe(true);
    });

    it('should set input volume', async () => {
      mockObs.call.mockResolvedValue({});

      await service.setInputVolume('Microphone', 50);

      expect(mockObs.call).toHaveBeenCalledWith('SetInputVolume', {
        inputName: 'Microphone',
        inputVolumeMul: 0.5,
      });
    });

    it('should get input volume', async () => {
      mockObs.call.mockResolvedValue({ inputVolumeMul: 0.5 });

      const volume = await service.getInputVolume('Microphone');

      expect(mockObs.call).toHaveBeenCalledWith('GetInputVolume', {
        inputName: 'Microphone',
      });
      expect(volume).toBe(50);
    });
  });

  // ==========================================================================
  // TRANSITION MANAGEMENT
  // ==========================================================================

  describe('Transition Management', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should get transitions', async () => {
      const mockTransitions = [
        { transitionName: 'Cut', transitionKind: 'cut_transition' },
        { transitionName: 'Fade', transitionKind: 'fade_transition' },
      ];
      mockObs.call.mockResolvedValue({ transitions: mockTransitions });

      const transitions = await service.getTransitions();

      expect(mockObs.call).toHaveBeenCalledWith('GetTransitionList');
      expect(transitions).toHaveLength(2);
    });

    it('should get current transition', async () => {
      mockObs.call.mockResolvedValue({
        transitionName: 'Fade',
        transitionDuration: 300,
      });

      const transition = await service.getCurrentTransition();

      expect(mockObs.call).toHaveBeenCalledWith('GetCurrentSceneTransition');
      expect(transition.transitionName).toBe('Fade');
    });

    it('should set current transition', async () => {
      mockObs.call.mockResolvedValue({});

      await service.setCurrentTransition('Cut');

      expect(mockObs.call).toHaveBeenCalledWith('SetCurrentSceneTransition', {
        transitionName: 'Cut',
      });
    });

    it('should set transition duration', async () => {
      mockObs.call.mockResolvedValue({});

      await service.setTransitionDuration(500);

      expect(mockObs.call).toHaveBeenCalledWith('SetCurrentSceneTransitionDuration', {
        transitionDuration: 500,
      });
    });

    it('should trigger transition', async () => {
      mockObs.call.mockResolvedValue({});

      await service.triggerTransition();

      expect(mockObs.call).toHaveBeenCalledWith('TriggerStudioModeTransition');
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    it('should throw error when not connected', async () => {
      await expect(service.getScenes()).rejects.toThrow();
    });

    it('should handle OBS call errors', async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      mockObs.call.mockRejectedValue(new Error('Scene not found'));

      await service.connect(validConfig);

      await expect(service.switchScene('NonExistent')).rejects.toThrow('Scene not found');
    });
  });

  // ==========================================================================
  // EVENT EMITTER
  // ==========================================================================

  describe('Event Emitter', () => {
    const validConfig = {
      address: 'localhost',
      port: 4455,
      password: 'test-password',
    };

    beforeEach(async () => {
      mockObs.connect.mockResolvedValue({
        obsWebSocketVersion: '5.0.0',
        negotiatedRpcVersion: 1,
      });
      await service.connect(validConfig);
    });

    it('should register connection opened listener', () => {
      const listener = vi.fn();
      service.onConnectionOpened(listener);
      
      // The listener is registered on the OBS WebSocket object
      expect(mockObs.on).toHaveBeenCalledWith('ConnectionOpened', listener);
    });

    it('should register connection closed listener', () => {
      const listener = vi.fn();
      service.onConnectionClosed(listener);
      
      // The listener is registered on the OBS WebSocket object
      expect(mockObs.on).toHaveBeenCalledWith('ConnectionClosed', listener);
    });

    it('should register connection error listener', () => {
      const listener = vi.fn();
      service.onConnectionError(listener);
      
      // The listener is registered on the OBS WebSocket object
      expect(mockObs.on).toHaveBeenCalledWith('ConnectionError', listener);
    });
  });
});