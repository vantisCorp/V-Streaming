# OBS WebSocket Integration - Developer Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Type Definitions](#type-definitions)
6. [Event System](#event-system)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### Design Principles

The OBS WebSocket Integration follows these design principles:

1. **Singleton Pattern**: Single instance of OBSWebSocketService
2. **Event-Driven Architecture**: Uses EventEmitter3 for reactive updates
3. **Type Safety**: Full TypeScript implementation
4. **Separation of Concerns**: Clear separation between service, hook, and UI
5. **Reactive State**: React hooks for state management

### Technology Stack

- **obs-websocket-js**: Library for OBS WebSocket communication
- **EventEmitter3**: Event-driven architecture
- **React Hooks**: State management
- **TypeScript**: Type safety
- **LocalStorage**: Persistent configuration

---

## Project Structure

```
V-Streaming/
├── src/
│   ├── types/
│   │   └── obsWebSocket.ts          # Type definitions
│   ├── services/
│   │   └── OBSWebSocketService.ts   # Main service class
│   ├── hooks/
│   │   └── useOBSWebSocket.ts       # React hook
│   ├── components/
│   │   ├── OBSIntegration.tsx      # Main UI component
│   │   └── OBSIntegration.css      # Styling
│   └── i18n/
│       └── locales/
│           ├── en.json             # English translations
│           └── pl.json             # Polish translations
└── docs/
    ├── OBS_INTEGRATION_GUIDE.md    # User guide
    └── OBS_INTEGRATION_DEV_GUIDE.md # Developer guide (this file)
```

---

## Core Components

### 1. OBSWebSocketService

**Location**: `src/services/OBSWebSocketService.ts`

**Purpose**: Main service class for OBS WebSocket communication

**Key Features**:
- Singleton pattern
- Connection management with auto-reconnect
- Event emission for state changes
- Full OBS control API

**Usage**:

```typescript
import { OBSWebSocketService } from '../services/OBSWebSocketService';

// Get singleton instance
const obsService = OBSWebSocketService.getInstance();

// Connect to OBS
await obsService.connect({
  address: '127.0.0.1',
  port: 4455,
  password: 'your-password',
  autoReconnect: true,
  reconnectInterval: 5000,
  eventSubscriptions: 0
});

// Listen to events
obsService.on('scene-changed', (sceneName) => {
  console.log('Scene changed to:', sceneName);
});

// Switch scene
await obsService.switchScene('My Scene');

// Disconnect
await obsService.disconnect();
```

---

### 2. useOBSWebSocket Hook

**Location**: `src/hooks/useOBSWebSocket.ts`

**Purpose**: React hook for OBS WebSocket integration

**Key Features**:
- State management for all OBS features
- Event listener registration
- Automatic cleanup

**Usage**:

```typescript
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';

function MyComponent() {
  const obs = useOBSWebSocket();

  const handleConnect = async () => {
    await obs.connect({
      address: '127.0.0.1',
      port: 4455,
      password: 'password',
      autoReconnect: true,
      reconnectInterval: 5000,
      eventSubscriptions: 0
    });
  };

  const handleSwitchScene = async () => {
    await obs.switchScene('Scene 2');
  };

  return (
    <div>
      <button onClick={handleConnect}>Connect</button>
      <button onClick={handleSwitchScene}>Switch Scene</button>
      <p>Status: {obs.connectionStatus}</p>
      <p>Current Scene: {obs.currentScene}</p>
    </div>
  );
}
```

---

### 3. OBSIntegration Component

**Location**: `src/components/OBSIntegration.tsx`

**Purpose**: Main UI component with 6 tabs

**Key Features**:
- Connection management UI
- Scene selector
- Stream control
- Recording control
- Audio management
- Transition control

**Props**:

```typescript
interface OBSIntegrationProps {
  onClose?: () => void; // Optional close handler
}
```

**Usage**:

```typescript
import { OBSIntegration } from '../components/OBSIntegration';

function App() {
  const [showOBS, setShowOBS] = useState(false);

  return (
    <>
      <button onClick={() => setShowOBS(true)}>
        Open OBS Integration
      </button>
      {showOBS && (
        <OBSIntegration onClose={() => setShowOBS(false)} />
      )}
    </>
  );
}
```

---

## API Reference

### Connection Management

#### `connect(config: OBSConnectionConfig): Promise<void>`

Connects to OBS WebSocket server.

**Parameters**:
- `config`: Connection configuration
  - `address`: IP address or hostname
  - `port`: WebSocket port (default: 4455)
  - `password`: Authentication password
  - `autoReconnect`: Enable auto-reconnect
  - `reconnectInterval`: Reconnect interval in ms
  - `eventSubscriptions`: Event subscription bitmask

**Example**:
```typescript
await obsService.connect({
  address: '127.0.0.1',
  port: 4455,
  password: 'password',
  autoReconnect: true,
  reconnectInterval: 5000,
  eventSubscriptions: 0
});
```

#### `disconnect(): Promise<void>`

Disconnects from OBS WebSocket server.

**Example**:
```typescript
await obsService.disconnect();
```

#### `isConnected(): boolean`

Returns true if connected to OBS.

#### `getConnectionStatus(): OBSConnectionStatus`

Returns current connection status.

---

### Scene Management

#### `getScenes(): Promise<OBSScene[]>`

Returns list of all scenes.

**Example**:
```typescript
const scenes = await obsService.getScenes();
console.log(scenes); // [{ sceneName: 'Scene 1', sceneIndex: 0 }, ...]
```

#### `getCurrentScene(): Promise<string>`

Returns current scene name.

#### `switchScene(sceneName: string): Promise<void>`

Switches to the specified scene.

**Example**:
```typescript
await obsService.switchScene('Gaming Scene');
```

#### `getSceneItems(sceneName: string): Promise<OBSSceneItem[]>`

Returns items in the specified scene.

---

### Stream Control

#### `startStreaming(): Promise<void>`

Starts streaming.

#### `stopStreaming(): Promise<void>`

Stops streaming.

#### `getStreamStatus(): Promise<OBSStreamStatus>`

Returns current stream status.

**Example**:
```typescript
const status = await obsService.getStreamStatus();
console.log(status.outputActive); // true/false
console.log(status.outputDuration); // duration in seconds
```

#### `toggleStream(): Promise<void>`

Toggles streaming (start/stop).

---

### Recording Control

#### `startRecording(): Promise<void>`

Starts recording.

#### `stopRecording(): Promise<void>`

Stops recording.

#### `getRecordStatus(): Promise<OBSRecordStatus>`

Returns current recording status.

#### `toggleRecording(): Promise<void>`

Toggles recording (start/stop).

#### `pauseRecording(): Promise<void>`

Pauses recording.

---

### Audio Management

#### `getInputs(): Promise<OBSInput[]>`

Returns list of all audio inputs.

**Example**:
```typescript
const inputs = await obsService.getInputs();
inputs.forEach(input => {
  console.log(input.inputName, input.inputMuted);
});
```

#### `setInputMute(inputName: string, muted: boolean): Promise<void>`

Mutes/unmutes an audio input.

**Example**:
```typescript
await obsService.setInputMute('Desktop Audio', true);
```

#### `toggleInputMute(inputName: string): Promise<boolean>`

Toggles mute state, returns new state.

#### `setInputVolume(inputName: string, volume: number): Promise<void>`

Sets input volume (0-100).

**Example**:
```typescript
await obsService.setInputVolume('Mic/Aux', 75);
```

#### `getInputVolume(inputName: string): Promise<number>`

Returns input volume (0-100).

---

### Transition Management

#### `getTransitions(): Promise<OBSTransition[]>`

Returns list of all transitions.

#### `getCurrentTransition(): Promise<OBSTransition>`

Returns current transition.

#### `setCurrentTransition(transitionName: string): Promise<void>`

Sets current transition.

#### `setTransitionDuration(duration: number): Promise<void>`

Sets transition duration in ms.

#### `triggerTransition(): Promise<void>`

Triggers the current transition.

---

## Type Definitions

### OBSConnectionStatus

```typescript
enum OBSConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}
```

### OBSConnectionConfig

```typescript
interface OBSConnectionConfig {
  address: string;
  port: number;
  password: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  eventSubscriptions: number;
}
```

### OBSScene

```typescript
interface OBSScene {
  sceneIndex: number;
  sceneName: string;
}
```

### OBSStreamStatus

```typescript
interface OBSStreamStatus {
  outputActive: boolean;
  outputCode?: string;
  outputReconnecting?: boolean;
  outputDuration: number;
  outputCongestion: number;
  outputBytes: number;
  outputSkippedFrames: number;
  outputTotalFrames: number;
  outputTimecode: string;
}
```

### OBSRecordStatus

```typescript
interface OBSRecordStatus {
  outputActive: boolean;
  outputPaused: boolean;
  outputCode?: string;
  outputDuration: number;
  outputBytes: number;
  outputTimecode: string;
}
```

### OBSInput

```typescript
interface OBSInput {
  inputName: string;
  inputUuid?: string;
  inputKind?: string;
  inputUnversionedKind?: string;
  inputSettings?: any;
  inputMuted: boolean;
}
```

---

## Event System

### Available Events

The service emits the following events:

#### Connection Events

- `connection-status-changed`: Emitted when connection status changes
  ```typescript
  obsService.on('connection-status-changed', (status: OBSConnectionStatus) => {
    console.log('Status:', status);
  });
  ```

- `connection-opened`: Emitted when connection is established
  ```typescript
  obsService.on('connection-opened', () => {
    console.log('Connected!');
  });
  ```

- `connection-closed`: Emitted when connection is closed
  ```typescript
  obsService.on('connection-closed', (error?: any) => {
    console.log('Closed:', error);
  });
  ```

- `connection-error`: Emitted when connection error occurs
  ```typescript
  obsService.on('connection-error', (error: any) => {
    console.error('Error:', error);
  });
  ```

#### Scene Events

- `scene-changed`: Emitted when current scene changes
  ```typescript
  obsService.on('scene-changed', (sceneName: string) => {
    console.log('Scene changed to:', sceneName);
  });
  ```

#### Stream Events

- `stream-started`: Emitted when streaming starts
  ```typescript
  obsService.on('stream-started', () => {
    console.log('Stream started!');
  });
  ```

- `stream-stopped`: Emitted when streaming stops
  ```typescript
  obsService.on('stream-stopped', () => {
    console.log('Stream stopped');
  });
  ```

#### Recording Events

- `recording-started`: Emitted when recording starts
- `recording-stopped`: Emitted when recording stops
- `recording-paused`: Emitted when recording is paused
- `recording-resumed`: Emitted when recording is resumed

#### Audio Events

- `input-volume-meters`: Emitted when audio levels update
  ```typescript
  obsService.on('input-volume-meters', (meters: OBSVolumeMeter[]) => {
    meters.forEach(meter => {
      console.log(meter.inputName, meter.inputLevelsMul);
    });
  });
  ```

- `input-active-state-changed`: Emitted when input active state changes
- `input-show-state-changed`: Emitted when input visibility changes

---

## Usage Examples

### Example 1: Basic Connection

```typescript
import { OBSWebSocketService } from './services/OBSWebSocketService';

async function basicExample() {
  const obs = OBSWebSocketService.getInstance();

  // Connect
  await obs.connect({
    address: '127.0.0.1',
    port: 4455,
    password: 'password',
    autoReconnect: true,
    reconnectInterval: 5000,
    eventSubscriptions: 0
  });

  console.log('Connected:', obs.isConnected());

  // Disconnect
  await obs.disconnect();
}
```

### Example 2: Scene Automation

```typescript
async function sceneAutomation() {
  const obs = OBSWebSocketService.getInstance();

  // Listen to scene changes
  obs.on('scene-changed', (sceneName) => {
    console.log('Scene changed to:', sceneName);

    // Perform actions based on scene
    if (sceneName === 'Gaming') {
      // Enable game-specific settings
    } else if (sceneName === 'Just Chatting') {
      // Enable chat-specific settings
    }
  });

  // Get all scenes
  const scenes = await obs.getScenes();
  console.log('Available scenes:', scenes);

  // Switch to a specific scene
  await obs.switchScene('Gaming');
}
```

### Example 3: Stream Monitoring

```typescript
async function streamMonitoring() {
  const obs = OBSWebSocketService.getInstance();

  // Monitor stream status
  const checkStatus = async () => {
    const status = await obs.getStreamStatus();
    console.log('Streaming:', status.outputActive);
    console.log('Duration:', status.outputDuration);
    console.log('Congestion:', status.outputCongestion);
    console.log('Dropped Frames:', status.outputSkippedFrames);
  };

  // Listen to stream events
  obs.on('stream-started', () => {
    console.log('Stream started!');
    // Start monitoring interval
    setInterval(checkStatus, 5000);
  });

  obs.on('stream-stopped', () => {
    console.log('Stream stopped');
  });
}
```

### Example 4: Audio Control

```typescript
async function audioControl() {
  const obs = OBSWebSocketService.getInstance();

  // Get all audio inputs
  const inputs = await obs.getInputs();
  inputs.forEach(input => {
    console.log(`${input.inputName}: ${input.inputMuted ? 'Muted' : 'Unmuted'}`);
  });

  // Mute desktop audio
  await obs.setInputMute('Desktop Audio', true);

  // Set microphone volume to 75%
  await obs.setInputVolume('Mic/Aux', 75);

  // Listen to audio level updates
  obs.on('input-volume-meters', (meters) => {
    meters.forEach(meter => {
      const level = meter.inputLevelsMul?.[0] || 0;
      console.log(`${meter.inputName}: ${(level * 100).toFixed(0)}%`);
    });
  });
}
```

### Example 5: React Component Integration

```typescript
import React, { useEffect } from 'react';
import { useOBSWebSocket } from '../hooks/useOBSWebSocket';

function SceneSwitcher() {
  const obs = useOBSWebSocket();

  useEffect(() => {
    // Auto-connect on mount
    obs.connect({
      address: '127.0.0.1',
      port: 4455,
      password: 'password',
      autoReconnect: true,
      reconnectInterval: 5000,
      eventSubscriptions: 0
    });
  }, []);

  return (
    <div>
      <h2>Scene Switcher</h2>
      <p>Status: {obs.connectionStatus}</p>
      <p>Current Scene: {obs.currentScene}</p>
      
      {obs.scenes.map(scene => (
        <button
          key={scene.sceneName}
          onClick={() => obs.switchScene(scene.sceneName)}
          disabled={scene.sceneName === obs.currentScene}
        >
          {scene.sceneName}
        </button>
      ))}
    </div>
  );
}
```

---

## Testing

### Unit Tests

Example unit test for OBSWebSocketService:

```typescript
import { OBSWebSocketService } from '../services/OBSWebSocketService';

describe('OBSWebSocketService', () => {
  let service: OBSWebSocketService;

  beforeEach(() => {
    service = OBSWebSocketService.getInstance();
  });

  afterEach(() => {
    service.disconnect();
  });

  test('should connect to OBS', async () => {
    await service.connect({
      address: '127.0.0.1',
      port: 4455,
      password: 'password',
      autoReconnect: false,
      reconnectInterval: 5000,
      eventSubscriptions: 0
    });

    expect(service.isConnected()).toBe(true);
  });

  test('should switch scenes', async () => {
    await service.connect({
      address: '127.0.0.1',
      port: 4455,
      password: 'password',
      autoReconnect: false,
      reconnectInterval: 5000,
      eventSubscriptions: 0
    });

    await service.switchScene('Test Scene');
    const currentScene = await service.getCurrentScene();
    expect(currentScene).toBe('Test Scene');
  });
});
```

### Integration Tests

Example integration test with React:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OBSIntegration } from '../components/OBSIntegration';

describe('OBSIntegration Component', () => {
  test('should render connection tab by default', () => {
    render(<OBSIntegration />);
    expect(screen.getByText(/connection/i)).toBeInTheDocument();
  });

  test('should connect to OBS when connect button is clicked', async () => {
    render(<OBSIntegration />);
    
    const connectButton = screen.getByText(/connect/i);
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });
  });
});
```

---

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public methods
- Use meaningful variable and function names

### Adding New Features

1. **Add type definitions** to `src/types/obsWebSocket.ts`
2. **Implement service methods** in `src/services/OBSWebSocketService.ts`
3. **Add hook methods** in `src/hooks/useOBSWebSocket.ts`
4. **Add UI components** in `src/components/OBSIntegration.tsx`
5. **Add translations** to `src/i18n/locales/en.json` and `pl.json`
6. **Add tests** for new functionality
7. **Update documentation**

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript compilation successful
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Translations added
- [ ] Breaking changes documented

---

## Future Enhancements

### Planned Features

1. **Advanced Scene Management**
   - Scene collections
   - Scene item manipulation
   - Scene previews

2. **Enhanced Audio Control**
   - Audio routing
   - Audio filters
   - Audio monitoring

3. **Stream Configuration**
   - Stream key management
   - Stream settings
   - Multi-platform streaming

4. **Recording Management**
   - Recording settings
   - Recording format options
   - Replay buffer

5. **Source Management**
   - Source creation/deletion
   - Source settings
   - Source filters

6. **Browser Source Control**
   - URL management
   - Reload control
   - Size/position

7. **Text Sources**
   - Text update
   - Font settings
   - Color management

8. **Advanced Transitions**
   - Custom transitions
   - Stinger transitions
   - Transition effects

9. **Hotkey Support**
   - OBS hotkey triggering
   - Custom hotkey binding
   - Hotkey macros

10. **Analytics Integration**
    - Stream statistics
    - Performance metrics
    - Historical data

### Performance Optimizations

1. Debounce rapid state changes
2. Optimize event subscriptions
3. Reduce unnecessary re-renders
4. Cache API responses
5. Implement request batching

### Security Enhancements

1. Password encryption in localStorage
2. Token-based authentication
3. Connection whitelist
4. Rate limiting
5. Audit logging

---

## Resources

### Official Documentation

- [OBS WebSocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [obs-websocket-js](https://github.com/obsproject/obs-websocket-js)
- [OBS Studio](https://obsproject.com/)

### Community

- [V-Streaming GitHub](https://github.com/vantisCorp/V-Streaming)
- [OBS Project Forums](https://forum.obsproject.com/)

---

**Last Updated**: 2024
**Version**: 1.2.0