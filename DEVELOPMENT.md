# V-Streaming Development Guide

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **Rust** 1.70 or higher
- **npm** or **yarn**
- **Git**

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vantisCorp/V-Streaming.git
cd V-Streaming
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Run Tauri in development mode:
```bash
npm run tauri dev
```

## Project Structure

```
V-Streaming/
├── src/                      # React frontend
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # React entry point
│   ├── App.css              # App styles
│   └── styles.css           # Global styles
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── main.rs          # Tauri entry point
│   │   ├── lib.rs           # Library exports
│   │   ├── capture.rs       # Capture engine
│   │   ├── composition.rs   # Composition engine
│   │   ├── audio.rs         # Audio engine
│   │   ├── encoding.rs      # Encoding engine
│   │   ├── streaming.rs     # Streaming engine
│   │   ├── plugin.rs        # Plugin system
│   │   └── gpu.rs           # GPU context
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── README.md                # Project README
├── ARCHITECTURE.md          # Architecture documentation
└── DEVELOPMENT.md           # This file
```

## Development Workflow

### Frontend Development (React + TypeScript)

The frontend is built with React and TypeScript using Vite as the build tool.

#### Adding a New Component

1. Create a new component file in `src/`:
```typescript
// src/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};
```

2. Import and use it in your app:
```typescript
import { MyComponent } from './MyComponent';

function App() {
  return <MyComponent title="Hello World" />;
}
```

#### Calling Tauri Commands

Use the `invoke` function from `@tauri-apps/api/core`:

```typescript
import { invoke } from '@tauri-apps/api/core';

async function startCapture() {
  try {
    await invoke('start_capture', { 
      source: { 
        DirectX: { window_name: "Game" } 
      } 
    });
  } catch (error) {
    console.error('Failed to start capture:', error);
  }
}
```

### Backend Development (Rust)

The backend is built with Rust and uses Tauri for IPC communication.

#### Adding a New Tauri Command

1. Define the command in `src-tauri/src/main.rs`:

```rust
#[tauri::command]
fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Received: {}", param))
}
```

2. Register the command in the invoke_handler:

```rust
.invoke_handler(tauri::generate_handler![
    greet,
    my_command,  // Add your command here
])
```

3. Call it from the frontend:

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('my_command', { param: 'Hello' });
```

#### Adding a New Module

1. Create a new file in `src-tauri/src/`:
```rust
// src-tauri/src/mymodule.rs

pub struct MyModule {
    // Module state
}

impl MyModule {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            // Initialize state
        })
    }

    pub fn do_something(&self) -> Result<(), String> {
        // Implementation
        Ok(())
    }
}
```

2. Add it to `lib.rs`:
```rust
pub mod mymodule;

pub use mymodule::MyModule;
```

3. Use it in `main.rs`:
```rust
mod mymodule;

// In main function
let my_module = mymodule::MyModule::new()?;
```

## Architecture Overview

### Modular Design

The backend is organized into independent modules:

- **Capture Engine**: Handles video/audio capture from various sources
- **Composition Engine**: Manages video composition and effects
- **Audio Engine**: Processes and mixes audio streams
- **Encoding Engine**: Encodes video/audio for streaming
- **Streaming Engine**: Sends streams to platforms
- **Plugin System**: Manages third-party plugins
- **GPU Context**: Manages GPU operations

### Thread Safety

All engines use `Arc<Mutex<T>>` for thread-safe state management:

```rust
use std::sync::{Arc, Mutex};

pub struct MyEngine {
    state: Arc<Mutex<EngineState>>,
}
```

### Error Handling

Use `Result<T, String>` for Tauri commands:

```rust
#[tauri::command]
fn my_command() -> Result<(), String> {
    // Return Ok(()) on success
    // Return Err("Error message".to_string()) on failure
}
```

## Testing

### Frontend Testing

```bash
# Run tests (if configured)
npm test
```

### Backend Testing

```bash
# Run Rust tests
cd src-tauri
cargo test
```

## Building

### Development Build

```bash
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Debugging

### Frontend Debugging

1. Open browser DevTools (F12)
2. Use React DevTools for component inspection
3. Check console for errors

### Backend Debugging

1. Check the terminal where `npm run tauri dev` is running
2. Use `println!` or `eprintln!` for logging
3. Use `dbg!` macro for quick debugging

## Performance Optimization

### Frontend

- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load components with React.lazy
- Use useMemo and useCallback for expensive computations

### Backend

- Use zero-copy operations where possible
- Minimize allocations in hot paths
- Use efficient data structures
- Profile with cargo-flamegraph

## Contributing

### Code Style

- **Rust**: Follow rustfmt and clippy recommendations
- **TypeScript**: Follow ESLint and Prettier configurations
- **Comments**: Document public APIs with rustdoc and JSDoc

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests
chore: maintenance tasks
```

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Troubleshooting

### Common Issues

**Issue**: Tauri dev server won't start
- **Solution**: Make sure port 1420 is not in use

**Issue**: Rust compilation errors
- **Solution**: Run `cargo clean` and try again

**Issue**: Frontend not updating
- **Solution**: Clear browser cache and restart dev server

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

For issues and questions:
- Open an issue on GitHub
- Join our Discord server
- Check existing documentation

---

Happy coding! 🚀