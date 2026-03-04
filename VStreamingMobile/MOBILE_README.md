# V-Streaming Mobile Companion App

The official mobile companion app for V-Streaming, allowing you to control your stream from your smartphone or tablet.

## Features

### Phase 1: MVP (Current)
- ✅ Connection to desktop app via WebSocket
- ✅ Stream controls (start/stop)
- ✅ Scene switching
- ✅ Audio level controls
- ✅ Real-time chat monitoring
- ✅ Connection status management

### Phase 2: Core Features (Planned)
- [ ] Enhanced chat management
- [ ] Push notifications
- [ ] Secure authentication
- [ ] Stream analytics dashboard

### Phase 3: Advanced Features (Planned)
- [ ] VTuber model controls
- [ ] Custom layouts
- [ ] Advanced analytics
- [ ] Multi-platform support

## Technology Stack

- **React Native 0.76.5** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **Socket.io Client** - Real-time communication
- **React Navigation** - Navigation and routing
- **React Native Paper** - Material Design components

## Project Structure

```
VStreamingMobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── ConnectionScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ScenesScreen.tsx
│   │   ├── AudioScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/         # Business logic services
│   │   └── WebSocketService.ts
│   ├── hooks/            # Custom React hooks
│   │   └── useWebSocket.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── theme/            # App theming
│   │   └── index.ts
│   └── constants/        # App constants
├── android/              # Android native code
├── ios/                  # iOS native code
└── App.tsx              # Main app component
```

## Getting Started

### Prerequisites

- Node.js >= 22.11.0 (or downgrade to compatible version)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Navigate to the mobile app directory:
```bash
cd VStreamingMobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS only, install pods:
```bash
cd ios && pod install && cd ..
```

### Running the App

#### iOS
```bash
npx react-native run-ios
```

#### Android
```bash
npx react-native run-android
```

## Connecting to Desktop App

1. Open V-Streaming on your desktop
2. Go to **Settings → Remote Control**
3. Enable the mobile companion feature
4. Note the displayed IP address and port
5. Open the mobile app
6. Enter the IP address and port
7. Tap **Connect**

## Usage

### Dashboard
- View stream status (live/offline)
- Monitor viewer count, duration, FPS
- Start/stop stream with one tap
- View platform-specific statistics

### Scenes
- Browse all available scenes
- Switch between scenes instantly
- See active scene highlighted
- Preview scene thumbnails

### Audio Mixer
- Control volume for each audio track
- Mute/unmute tracks
- Monitor real-time audio levels
- Adjust levels with precision slider

### Chat
- View live chat messages
- Send messages directly from mobile
- See username colors and badges
- Message timestamps

### Settings
- View connection status
- Configure auto-reconnect
- Toggle notifications
- Disconnect from desktop app

## Architecture

### WebSocket Service

The `WebSocketService` class handles all communication with the desktop app:

```typescript
// Connect to desktop app
await websocketService.connect('192.168.1.100', 8080);

// Stream controls
websocketService.startStream();
websocketService.stopStream();

// Scene controls
websocketService.switchScene('scene-id');

// Audio controls
websocketService.setVolume('track-id', 0.8);
websocketService.toggleMute('track-id');
```

### Custom Hook

The `useWebSocket` hook provides a React-friendly interface:

```typescript
const {
  connectionStatus,
  streamStatus,
  scenes,
  audioTracks,
  startStream,
  switchScene,
  setVolume,
} = useWebSocket();
```

## WebSocket Events

### Client → Desktop

| Event | Payload | Description |
|-------|---------|-------------|
| `stream:start` | - | Start streaming |
| `stream:stop` | - | Stop streaming |
| `scene:switch` | `{ sceneId }` | Switch to scene |
| `scene:get` | - | Get scene list |
| `audio:volume` | `{ trackId, volume }` | Set volume |
| `audio:mute` | `{ trackId }` | Toggle mute |
| `audio:get` | - | Get audio tracks |
| `chat:send` | `{ message }` | Send chat message |
| `vtuber:expression` | `{ expression }` | Set VTuber expression |
| `vtuber:toggle_tracking` | - | Toggle face tracking |

### Desktop → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `stream:status` | `StreamStatus` | Stream status update |
| `stream:started` | - | Stream started |
| `stream:stopped` | - | Stream stopped |
| `scene:list` | `Scene[]` | Scene list |
| `scene:changed` | `Scene` | Scene changed |
| `audio:tracks` | `AudioTrack[]` | Audio tracks |
| `audio:meter` | `{ trackId, meter }` | Audio level meter |
| `chat:message` | `ChatMessage` | Chat message |
| `notification` | `Notification` | Notification |
| `analytics:update` | `AnalyticsData` | Analytics update |
| `vtuber:model` | `VTuberModel` | VTuber model update |

## Styling

The app uses a custom theme system with:

- **Dark mode by default**
- **Custom color palette**
- **Consistent spacing**
- **Typography scale**

All styles are centralized in `src/theme/index.ts`.

## Build Configuration

### Android

- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34

### iOS

- **Minimum iOS**: 13.0
- **Target iOS**: Latest

## Development

### Adding New Features

1. Create TypeScript interfaces in `src/types/index.ts`
2. Add WebSocket events in `WebSocketService.ts`
3. Update the custom hook in `useWebSocket.ts`
4. Create or update screen components
5. Update navigation in `App.tsx`

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Use functional components with hooks
- Keep components small and focused
- Document complex logic

## Troubleshooting

### Connection Issues

- Ensure desktop app is running
- Check firewall settings
- Verify IP address and port
- Both devices on same network

### Build Issues

- Clear cache: `npm start -- --reset-cache`
- Clean build: `cd android && ./gradlew clean && cd ..`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### iOS Build Issues

- Update CocoaPods: `sudo gem install cocoapods`
- Clean pods: `cd ios && pod deintegrate && pod install`
- Check Xcode version compatibility

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Same as V-Streaming main project.

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/V-Streaming/issues
- Documentation: https://github.com/yourusername/V-Streaming/wiki

## Roadmap

See the main project [ROADMAP.md](../ROADMAP.md) for upcoming features.