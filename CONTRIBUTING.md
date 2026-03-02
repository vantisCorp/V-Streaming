# Contributing to V-Streaming

Thank you for your interest in contributing to V-Streaming! We appreciate your help in making V-Streaming better.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Be considerate of different viewpoints and experiences
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or derogatory language
- Personal attacks or insults
- Public or private harassment
- Publishing others' private information
- Any other unethical or unprofessional conduct

### Reporting Issues

If you witness or experience any unacceptable behavior, please contact us at:
- Email: conduct@v-streaming.com
- Discord: DM @Moderators

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Rust**: 1.70 or later
- **Node.js**: 20 or later
- **npm**: 9 or later
- **Git**: Latest version
- **Windows 10/11** (for development)

### Development Tools

- **IDE**: VS Code with Rust and TypeScript extensions
- **Browser**: Chrome or Firefox for testing
- **Terminal**: PowerShell or Git Bash

---

## 🛠️ Development Setup

### 1. Fork the Repository

1. Go to https://github.com/vantisCorp/V-Streaming
2. Click the "Fork" button
3. Clone your fork locally

```bash
git clone https://github.com/YOUR_USERNAME/V-Streaming.git
cd V-Streaming
```

### 2. Install Rust Dependencies

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli
```

### 3. Install Node.js Dependencies

```bash
# Install frontend dependencies
npm install
```

### 4. Run Development Server

```bash
# Start development server
npm run tauri dev
```

This will:
- Start the Vite development server
- Launch the Tauri application
- Enable hot-reloading for both frontend and backend

### 5. Build for Production

```bash
# Build production version
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`

---

## 📝 Coding Standards

### Rust Code

#### Naming Conventions

- **Modules**: `snake_case` (e.g., `audio_engine`)
- **Structs**: `PascalCase` (e.g., `AudioEngine`)
- **Functions**: `snake_case` (e.g., `start_capture`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_BITRATE`)
- **Types**: `PascalCase` (e.g., `AudioConfig`)

#### Code Style

- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Use `rustfmt` for formatting
- Use `clippy` for linting

```bash
# Format code
cargo fmt

# Run linter
cargo clippy
```

#### Documentation

- Document all public functions and structs
- Use `///` for documentation comments
- Include examples where appropriate

```rust
/// Starts audio processing with the given configuration.
///
/// # Arguments
///
/// * `config` - Audio configuration settings
///
/// # Returns
///
/// Result indicating success or failure
///
/// # Examples
///
/// ```
/// let config = AudioConfig::default();
/// start_audio_processing(config)?;
/// ```
pub fn start_audio_processing(config: AudioConfig) -> Result<()> {
    // Implementation
}
```

### TypeScript/React Code

#### Naming Conventions

- **Components**: `PascalCase` (e.g., `AudioMixer`)
- **Functions**: `camelCase` (e.g., `startCapture`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_BITRATE`)
- **Types/Interfaces**: `PascalCase` (e.g., `AudioConfig`)

#### Code Style

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use ESLint for linting
- Use Prettier for formatting

```bash
# Format code
npm run format

# Run linter
npm run lint
```

#### Component Structure

```typescript
import React, { useState, useEffect } from 'react';

interface Props {
  // Props interface
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleEvent = () => {
    // Handler logic
  };

  // Render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

---

## 🔄 Submitting Changes

### 1. Create a Branch

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, well-documented code
- Follow coding standards
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build application
npm run tauri build
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve bug description"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to https://github.com/vantisCorp/V-Streaming
2. Click "Pull Requests"
3. Click "New Pull Request"
4. Select your branch
5. Fill out the PR template
6. Submit your PR

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Added/updated tests
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional information
```

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues to avoid duplicates
2. Search the documentation
3. Try the latest version

### Bug Report Template

```markdown
## Bug Description
Clear and concise description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
Add screenshots if applicable

## Environment
- OS: [e.g., Windows 11]
- V-Streaming Version: [e.g., 1.0.0]
- GPU: [e.g., NVIDIA RTX 3080]
- RAM: [e.g., 16GB]

## Additional Context
Any other context about the problem
```

### Where to Report

- **GitHub Issues**: https://github.com/vantisCorp/V-Streaming/issues
- **Discord**: #bug-reports channel
- **Email**: bugs@v-streaming.com

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description
Clear and concise description of the feature

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How should this feature work?

## Alternatives
What alternatives have you considered?

## Additional Context
Any other context or screenshots
```

### Where to Suggest

- **GitHub Issues**: https://github.com/vantisCorp/V-Streaming/issues
- **Discord**: #feature-requests channel
- **Email**: features@v-streaming.com

---

## 📚 Resources

### Documentation
- [Architecture](ARCHITECTURE.md)
- [Development Guide](DEVELOPMENT.md)
- [API Documentation](https://docs.v-streaming.com/api)

### External Resources
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🙏 Recognition

Contributors will be recognized in:
- Contributors section of README
- Release notes
- Credits in the application
- Special Discord role

---

## 📞 Contact

### Questions?
- **Discord**: #development channel
- **Email**: dev@v-streaming.com

### Security Issues?
- **Email**: security@v-streaming.com
- **PGP Key**: [Link to PGP key]

---

## 📄 License

By contributing to V-Streaming, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to V-Streaming! 🚀**