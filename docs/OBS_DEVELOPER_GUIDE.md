# OBS WebSocket Integration - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Layer](#service-layer)
3. [Type Definitions](#type-definitions)
4. [React Hooks](#react-hooks)
5. [UI Components](#ui-components)
6. [Events](#events)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [API Reference](#api-reference)

---

## Architecture Overview

The OBS WebSocket Integration follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│                 (OBSIntegration.tsx)                     │
├─────────────────────────────────────────────────────────┤
│                    React Hooks                           │
│                (useOBSWebSocket.ts)                      │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│              (OBSWebSocketService.ts)                    │
├─────────────────────────────────────────────────────────┤
│                    Type Definitions                      │
│                 (obsWebSocket.ts)                        │
├─────────────────────────────────────────────────────────┤
│                  External Library                        │
│                 (obs-websocket-js)                       │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Singleton Pattern**: `OBSWebSocketService` uses singleton to maintain a single connection
2. **Event-Driven Architecture**: Uses EventEmitter3 for loose coupling
3. **Type Safety**: Full TypeScript support with comprehensive interfaces
4. **React Integration**: Custom hook for React state management

---

## Service Layer

### OBSWebSocketService

The core service class that manages OBS WebSocket connections.

#### Location
`src/services/OBSWebSocketService.ts`

#### Key Features
- Singleton pattern for single connection management
- EventEmitter3 for event-driven architecture
- Auto-reconnect functionality
- Comprehensive error handling

#### Methods

##### Connection Management

```typescript
// Get singleton instance
static getInstance(): OBSWebSocketService

// Connect to OBS
async connect(config: OBSConnectionConfig): Promise<void>

// Disconnect from OBS
async disconnect(): Promise<void>

// Check connection status
isConnected(): boolean

// Get current connection status
getConnectionStatus(): OBSConnectionStatus
```

##### Scene Management

```typescript
// Get all scenes
async getScenes(): Promise<OBSScene[]>

// Get current scene name
async getCurrentScene(): Promise<string>

// Switch to a different scene
async switchScene(sceneName: string): Promise<void>

// Get items in a scene
async getSceneItems(sceneName: string): Promise<OBSSceneItem[]>
```

##### Stream Control

```typescript
// Start streaming
async startStreaming(): Promise<void>

// Stop streaming
async stopStreaming(): Promise<void>

// Get stream status
async getStreamStatus(): Promise<OBSStreamStatus>

// Toggle stream (start/stop based on current state)
async toggleStream(): Promise<void>
```

##### Recording Control

```typescript
// Start recording
async startRecording(): Promise<void>

// Stop recording
async stopRecording(): Promise<void>

// Get recording status
async getRecordStatus(): Promise<OBSRecordStatus>

// Toggle recording
async toggleRecording(): Promise<void>

// Pause recording
async pauseRecording(): Promise<void>
```

##### Audio Management

```typescript
// Get all audio inputs
async getInputs(): Promise<OBSInput[]>

// Set input mute state
async setInputMute(inputName: string, muted: boolean): Promise<void>

// Toggle input mute
async toggleInputMute(inputName: string): Promise<boolean>

// Set input volume (0-100)
async setInputVolume(inputName: string, volume: number): Promise<void>

// Get input volume (0-100)
async getInputVolume(inputName: string): Promise<number>
```

##### Transition Management

```typescript
// Get all transitions
async getTransitions(): Promise<OBSTransition[]>

// Get current transition
async getCurrentTransition(): Promise<OBSTransition>

// Set current transition
async setCurrentTransition(transitionName: string): Promise<void>

// Set transition duration (ms)
async setTransitionDuration(duration: number): Promise<void>

// Trigger transition
async triggerTransition(): Promise<void>
```

---

## Type Definitions

### Location
`src/types/obsWebSocket.ts`

### Core Types

#### OBSConnectionConfig

```typescript
interface OBSConnectionConfig {
  address: string;           // WebSocket server address
  port: number;              // WebSocket server port
  password?: string;         // Authentication password
  autoReconnect?: boolean;   // Enable auto-reconnect
  reconnectInterval?: number; // Reconnect interval in ms
  eventSubscriptions?: number; // OBS event subscription flags
}
```

#### OBSConnectionStatus

```typescript
enum OBSConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}
```

#### OBSScene

```typescript
interface OBSScene {
  sceneName: string;
  sceneIndex: number;
}
```

#### OBSSceneItem

```typescript
interface OBSSceneItem {
  sourceName: string;
  sceneItemId: number;
  sceneItemIndex?: number;
}
```

#### OBSStreamStatus

```typescript
interface OBSStreamStatus {
  outputActive: boolean;
  outputDuration: number;
  outputBytes: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
  outputCongestion: number;
}
```

#### OBSRecordStatus

```typescript
interface OBSRecordStatus {
  outputActive: boolean;
  outputDuration: number;
  outputBytes: number;
  outputPath: string;
}
```

#### OBSInput

```typescript
interface OBSInput {
  inputName: string;
  inputKind: string;
  inputUuid?: string;
}
```

#### OBSTransition

```typescript
interface OBSTransition {
  transitionName: string;
  transitionKind?: string;
  transitionDuration?: number;
  transitionUuid?: string;
}
```

### Event Types

```typescript
interface IOBSWebSocketEvents {
  'connection-status-changed': (status: OBSConnectionStatus) => void;
  'scene-changed': (sceneName: string) => void;
  'stream-started': () => void;
  'stream-stopped': () => void;
  'recording-started': () => void;
  'recording-stopped': () => void;
  'recording-paused': () => void;
  'recording-resumed': () => void;
  'exit-started': () => void;
  'vendor-event': (data: any) => void;
  'input-volume-meters': (inputs: any[]) => void;
  'input-active-state-changed': (data: any) => void;
  'input-show-state-changed': (data: any) => void;
}
```

---

## React Hooks

### useOBSWebSocket

Custom hook for integrating OBS WebSocket with React components.

#### Location
`src/hooks/useOBSWebSocket.ts`

#### Usage

```typescript
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';

function MyComponent() {
  const {
    isConnected,
    connectionStatus,
    scenes,
    currentScene,
    streamStatus,
    recordStatus,
    inputs,
    transitions,
    connect,
    disconnect,
    switchScene,
    startStreaming,
    stopStreaming,
    startRecording,
    stopRecording,
    setInputVolume,
    toggleInputMute,
  } = useOBSWebSocket();

  // Use the hook values and methods...
}
```

#### Return Values

| Value | Type | Description |
|-------|------|-------------|
| `isConnected` | `boolean` | Connection state |
| `connectionStatus` | `OBSConnectionStatus` | Detailed status |
| `scenes` | `OBSScene[]` | Available scenes |
| `currentScene` | `string \| null` | Current scene name |
| `streamStatus` | `OBSStreamStatus \| null` | Stream status |
| `recordStatus` | `OBSRecordStatus \| null` | Recording status |
| `inputs` | `OBSInput[]` | Audio inputs |
| `transitions` | `OBSTransition[]` | Available transitions |

#### Methods

| Method | Description |
|--------|-------------|
| `connect(config)` | Connect to OBS |
| `disconnect()` | Disconnect from OBS |
| `switchScene(name)` | Switch to scene |
| `startStreaming()` | Start streaming |
| `stopStreaming()` | Stop streaming |
| `toggleStream()` | Toggle stream |
| `startRecording()` | Start recording |
| `stopRecording()` | Stop recording |
| `toggleRecording()` | Toggle recording |
| `pauseRecording()` | Pause recording |
| `setInputVolume(name, vol)` | Set input volume |
| `toggleInputMute(name)` | Toggle input mute |

---

## UI Components

### OBSIntegration

Main component for OBS integration UI.

#### Location
`src/components/OBSIntegration.tsx`

#### Props

```typescript
interface OBSIntegrationProps {
  onClose?: () => void;  // Callback when panel is closed
}
```

#### Usage

```typescript
import OBSIntegration from '../components/OBSIntegration';

function App() {
  const [showOBS, setShowOBS] = useState(false);

  return (
    <>
      <button onClick={() => setShowOBS(true)}>OBS</button>
      {showOBS && <OBSIntegration onClose={() => setShowOBS(false)} />}
    </>
  );
}
```

#### Tabs

1. **Connection Tab** - Configure and manage OBS connection
2. **Scenes Tab** - View and switch between scenes
3. **Stream Tab** - Control streaming and view statistics
4. **Recording Tab** - Control recording
5. **Audio Tab** - Manage audio inputs
6. **Transitions Tab** - Manage transitions

---

## Events

### Subscribing to Events

```typescript
const service = OBSWebSocketService.getInstance();

// Connection status changes
service.on('connection-status-changed', (status) => {
  console.log('Connection status:', status);
});

// Scene changes
service.on('scene-changed', (sceneName) => {
  console.log('Scene changed to:', sceneName);
});

// Stream events
service.on('stream-started', () => {
  console.log('Stream started');
});

service.on('stream-stopped', () => {
  console.log('Stream stopped');
});

// Recording events
service.on('recording-started', () => {
  console.log('Recording started');
});

service.on('recording-stopped', () => {
  console.log('Recording stopped');
});
```

### Event List

| Event | Payload | Description |
|-------|---------|-------------|
| `connection-status-changed` | `OBSConnectionStatus` | Connection status changed |
| `scene-changed` | `string` | Scene was changed |
| `stream-started` | - | Stream started |
| `stream-stopped` | - | Stream stopped |
| `recording-started` | - | Recording started |
| `recording-stopped` | - | Recording stopped |
| `recording-paused` | - | Recording paused |
| `recording-resumed` | - | Recording resumed |
| `exit-started` | - | OBS is closing |
| `vendor-event` | `any` | Custom vendor event |
| `input-volume-meters` | `any[]` | Audio level updates |

---

## Error Handling

### Error Types

```typescript
// Connection errors
try {
  await service.connect(config);
} catch (error) {
  // Error types:
  // - Connection refused
  // - Authentication failed
  // - Timeout
  // - Already connected
}

// Operation errors
try {
  await service.switchScene('NonExistent');
} catch (error) {
  // Error types:
  // - Not connected to OBS
  // - Scene not found
  // - OBS internal error
}
```

### Best Practices

1. **Always check connection before operations**:
   ```typescript
   if (!service.isConnected()) {
     throw new Error('Not connected to OBS');
   }
   ```

2. **Handle errors gracefully**:
   ```typescript
   try {
     await service.startStreaming();
   } catch (error) {
     console.error('Failed to start streaming:', error);
     // Show user-friendly error message
   }
   ```

3. **Listen for disconnection events**:
   ```typescript
   service.on('connection-status-changed', (status) => {
     if (status === OBSConnectionStatus.DISCONNECTED) {
       // Handle unexpected disconnection
     }
   });
   ```

---

## Testing

### Unit Tests

Located at `src/services/OBSWebSocketService.test.ts`

```bash
# Run unit tests
npm test -- --run src/services/OBSWebSocketService.test.ts
```

### Integration Tests

Located at `src/services/OBSWebSocketService.integration.test.ts`

```bash
# Run integration tests (requires running OBS)
RUN_INTEGRATION_TESTS=true npm test -- --run src/services/OBSWebSocketService.integration.test.ts
```

### Mock Example

```typescript
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
    EventSubscription: { All: 0, None: 1 },
  };
});
```

---

## API Reference

### OBS WebSocket Protocol

This integration uses OBS WebSocket 5.x protocol. Key API calls:

| Method | OBS API Call |
|--------|--------------|
| `getScenes()` | `GetSceneList` |
| `getCurrentScene()` | `GetCurrentProgramScene` |
| `switchScene()` | `SetCurrentProgramScene` |
| `startStreaming()` | `StartStream` |
| `stopStreaming()` | `StopStream` |
| `getStreamStatus()` | `GetStreamStatus` |
| `startRecording()` | `StartRecord` |
| `stopRecording()` | `StopRecord` |
| `getRecordStatus()` | `GetRecordStatus` |
| `pauseRecording()` | `PauseRecord` |
| `getInputs()` | `GetInputList` |
| `setInputMute()` | `SetInputMute` |
| `toggleInputMute()` | `ToggleInputMute` |
| `setInputVolume()` | `SetInputVolume` |
| `getInputVolume()` | `GetInputVolume` |
| `getTransitions()` | `GetTransitionList` |
| `getCurrentTransition()` | `GetCurrentSceneTransition` |
| `setCurrentTransition()` | `SetCurrentSceneTransition` |
| `setTransitionDuration()` | `SetCurrentSceneTransitionDuration` |
| `triggerTransition()` | `TriggerStudioModeTransition` |

### Volume Handling

Volume is handled using `inputVolumeMul` (0.0-1.0 scale):

```typescript
// Set volume (convert 0-100 to 0.0-1.0)
await this.obs.call('SetInputVolume', {
  inputName,
  inputVolumeMul: volume / 100,
});

// Get volume (convert 0.0-1.0 to 0-100)
const response = await this.obs.call('GetInputVolume', { inputName });
return Math.round(response.inputVolumeMul * 100);
```

---

## Extending the Integration

### Adding New Features

1. **Add type definitions** in `src/types/obsWebSocket.ts`
2. **Implement service methods** in `src/services/OBSWebSocketService.ts`
3. **Add hook methods** in `src/hooks/useOBSWebSocket.ts`
4. **Update UI** in `src/components/OBSIntegration.tsx`
5. **Add tests** in test files

### Example: Adding Source Control

```typescript
// 1. Add types
interface OBSSource {
  sourceName: string;
  sourceType: string;
  sourceSettings: any;
}

// 2. Add service method
async getSourceSettings(sourceName: string): Promise<any> {
  if (!this.obs || !this.isConnected()) {
    throw new Error('Not connected to OBS');
  }
  const response = await this.obs.call('GetInputSettings', { inputName: sourceName });
  return response.inputSettings;
}

// 3. Add to hook
const getSourceSettings = useCallback(async (sourceName: string) => {
  return service.getSourceSettings(sourceName);
}, []);

// 4. Update UI with new functionality
```

---

## Troubleshooting Development Issues

### Common Issues

1. **Type errors**: Ensure all types are properly defined in `obsWebSocket.ts`
2. **Connection issues**: Check WebSocket server is enabled in OBS
3. **Event not firing**: Verify event subscription in `setupInternalEventListeners`
4. **State not updating**: Check hook dependencies and event listeners

### Debug Mode

Enable debug logging in the service:

```typescript
// Add console.log statements in service methods
console.log(`[OBS] Connecting to ${config.address}:${config.port}`);
console.log(`[OBS] Scene changed: ${sceneName}`);
```

---

## Resources

- [OBS WebSocket Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [obs-websocket-js Library](https://github.com/obs-websocket-community-projects/obs-websocket-js)
- [EventEmitter3 Documentation](https://github.com/primus/eventemitter3)