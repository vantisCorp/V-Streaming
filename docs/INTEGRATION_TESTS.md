# OBS WebSocket Integration Tests

This document describes how to run integration tests for the OBS WebSocket integration.

## Prerequisites

1. **OBS Studio** must be installed and running
2. **WebSocket Server** must be enabled in OBS
3. **Test configuration** must be set up

## Setting Up OBS Studio

1. Open OBS Studio
2. Go to **Tools** → **WebSocket Server Settings**
3. Enable the WebSocket server
4. Note the port (default: `4455`)
5. Set a password (optional, but recommended)
6. Click **Apply** and **OK**

## Running Integration Tests

### Option 1: Using npm script

```bash
RUN_INTEGRATION_TESTS=true OBS_PASSWORD=your_password npm test -- --run src/services/OBSWebSocketService.integration.test.ts
```

### Option 2: Using environment variables

Create a `.env.test` file in the project root:

```env
RUN_INTEGRATION_TESTS=true
OBS_HOST=localhost
OBS_PORT=4455
OBS_PASSWORD=your_password
```

Then run:

```bash
npm test -- --run src/services/OBSWebSocketService.integration.test.ts
```

## Test Categories

### 1. Connection Workflow Tests
- Connect to OBS instance
- Disconnect from OBS
- Connection events
- Authentication failures

### 2. Scene Management Tests
- Get list of scenes
- Get current scene
- Switch between scenes
- Get scene items

### 3. Stream Control Tests
- Get stream status
- Start/stop streaming

### 4. Recording Control Tests
- Get record status
- Start/stop recording
- Pause/resume recording

### 5. Audio Management Tests
- Get audio inputs
- Get/set input volume
- Toggle input mute

### 6. Transition Management Tests
- Get list of transitions
- Get current transition
- Set transition duration

### 7. Event Handling Tests
- Scene change events
- OBS event listeners

## Test Timeouts

Some tests have extended timeouts (10 seconds) to account for:
- Stream start/stop operations
- Recording operations
- Scene transitions

## CI/CD Integration

For CI/CD pipelines, you'll need to:
1. Install OBS Studio on the CI runner
2. Configure OBS with a test profile
3. Start OBS in headless mode
4. Run the integration tests

Example GitHub Actions workflow:

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install OBS Studio
        run: |
          sudo apt-get update
          sudo apt-get install -y obs-studio
      
      - name: Start OBS (headless)
        run: |
          obs --start-minimized &
          sleep 5
      
      - name: Run Integration Tests
        env:
          RUN_INTEGRATION_TESTS: true
          OBS_HOST: localhost
          OBS_PORT: 4455
        run: npm test -- --run src/services/OBSWebSocketService.integration.test.ts
```

## Troubleshooting

### Connection Refused
- Ensure OBS is running
- Check WebSocket server is enabled
- Verify the port number

### Authentication Failed
- Check the password is correct
- Ensure password authentication is enabled in OBS

### Tests Timeout
- Increase test timeout in vitest config
- Check OBS performance
- Ensure sufficient system resources

### Scene/Source Not Found
- Ensure OBS has at least one scene created
- Add sources to the scene for testing