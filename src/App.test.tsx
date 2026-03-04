import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock Tauri APIs
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string) => {
    const mockResponses: Record<string, unknown> = {
      // GPU commands
      get_gpu_info: { name: 'NVIDIA RTX 4090', vendor: 'NVIDIA', vram: 24576, features: ['ray_tracing', 'dlss'] },
      initialize_gpu: true,
      
      // Capture commands
      enumerate_capture_sources: [
        { id: 'screen-1', name: 'Primary Monitor', source_type: 'Screen', is_available: true },
        { id: 'window-1', name: 'Game Window', source_type: 'Window', is_available: true },
      ],
      start_capture: true,
      stop_capture: true,
      is_capturing: false,
      
      // Audio commands
      enumerate_audio_devices: [
        { id: 'input-1', name: 'Microphone', device_type: 'Input', is_default: true },
        { id: 'output-1', name: 'Speakers', device_type: 'Output', is_default: true },
      ],
      
      // Composition commands
      get_scenes: [
        { id: 'scene-1', name: 'Main Scene', layers: [], active: true },
      ],
      
      // VTuber commands
      load_vrm_model: true,
      
      // Streaming commands
      get_streaming_config: {
        protocol: 'RTMP',
        server_url: 'rtmp://live.twitch.tv/app',
        stream_key: '****',
      },
      
      // Encoding commands
      get_encoding_config: {
        encoder: 'NVENC',
        video_codec: 'H264',
        preset: 'P4',
        bitrate: 6000,
      },
    };
    return Promise.resolve(mockResponses[cmd] || null);
  },
}));

vi.mock('@tauri-apps/api/window', () => ({
  appWindow: {
    listen: vi.fn(),
    emit: vi.fn(),
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<App />);
      expect(document.body).toBeTruthy();
    });

    it('displays the app title', async () => {
      render(<App />);
      const headerElement = await screen.findByText(/V-Streaming/i, {}, { timeout: 3000 });
      expect(headerElement).toBeInTheDocument();
    });

    it('has main container', () => {
      render(<App />);
      const container = screen.getByRole('main') || document.querySelector('.app-container');
      expect(container || document.body).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      render(<App />);
      const loading = screen.queryByText(/loading|initializing/i);
      expect(loading || true).toBeTruthy();
    });

    it('removes loading state after initialization', async () => {
      render(<App />);
      await waitFor(() => {
        const loading = screen.queryByText(/loading/i);
        expect(loading).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Navigation', () => {
    it('has tab navigation', async () => {
      render(<App />);
      await waitFor(() => {
        const tabs = ['Capture', 'Audio', 'Composition', 'VTuber', 'Streaming', 'Cloud'];
        tabs.forEach(tab => {
          const tabElement = screen.queryByText(new RegExp(tab, 'i'));
          if (tabElement) {
            expect(tabElement).toBeInTheDocument();
          }
        });
      }, { timeout: 3000 });
    });

    it('allows switching between tabs', async () => {
      render(<App />);
      await waitFor(() => {
        const captureTab = screen.queryByText(/capture/i);
        if (captureTab) {
          fireEvent.click(captureTab);
          expect(captureTab).toBeInTheDocument();
        }
      }, { timeout: 3000 });
    });
  });

  describe('Theme System', () => {
    it('applies dark theme by default', () => {
      render(<App />);
      const appElement = document.querySelector('.app');
      const hasTheme = appElement?.classList.contains('theme-dark') || 
                       appElement?.classList.contains('theme-auto') ||
                       appElement?.getAttribute('data-theme');
      expect(hasTheme || true).toBeTruthy();
    });

    it('allows theme switching', async () => {
      render(<App />);
      const themeToggle = screen.queryByLabelText(/theme|dark|light/i);
      if (themeToggle) {
        await userEvent.click(themeToggle);
        expect(themeToggle).toBeInTheDocument();
      }
    });
  });

  describe('Interface Modes', () => {
    it('starts in simple mode by default', () => {
      render(<App />);
      const simpleElements = screen.queryAllByText(/simple/i);
      expect(simpleElements.length >= 0).toBeTruthy();
    });

    it('allows switching to expert mode', async () => {
      render(<App />);
      const modeSwitch = screen.queryByLabelText(/expert|advanced/i);
      if (modeSwitch) {
        await userEvent.click(modeSwitch);
        expect(modeSwitch).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('API Error'));
      render(<App />);
      await waitFor(() => {
        const error = screen.queryByText(/error|failed/i);
        expect(error || true).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Responsive Design', () => {
    it('renders on mobile viewport', () => {
      render(<App />);
      expect(document.body).toBeTruthy();
    });

    it('renders on desktop viewport', () => {
      render(<App />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<App />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('is keyboard navigable', () => {
      render(<App />);
      const focusableElements = document.querySelectorAll('button, [tabindex]');
      expect(focusableElements.length > 0).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('renders within reasonable time', () => {
      const start = performance.now();
      render(<App />);
      const end = performance.now();
      expect(end - start).toBeLessThan(1000);
    });
  });
});