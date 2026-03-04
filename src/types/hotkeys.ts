export interface HotkeyAction {
  id: string;
  name: string;
  description: string;
  category: HotkeyCategory;
  defaultBinding: KeyBinding;
  currentBinding: KeyBinding;
}

export type HotkeyCategory = 
  | 'stream'
  | 'scenes'
  | 'audio'
  | 'capture'
  | 'vtuber'
  | 'chat'
  | 'general';

export interface KeyBinding {
  key: string;
  modifiers: Modifier[];
}

export type Modifier = 'ctrl' | 'alt' | 'shift' | 'meta';

export interface HotkeyConfig {
  actions: HotkeyAction[];
  enabled: boolean;
}

export const HOTKEY_ACTIONS: Omit<HotkeyAction, 'currentBinding'>[] = [
  // Stream controls
  {
    id: 'stream.start',
    name: 'Start Stream',
    description: 'Start streaming to configured platforms',
    category: 'stream',
    defaultBinding: { key: 'F1', modifiers: [] },
  },
  {
    id: 'stream.stop',
    name: 'Stop Stream',
    description: 'Stop the current stream',
    category: 'stream',
    defaultBinding: { key: 'F2', modifiers: [] },
  },
  {
    id: 'stream.toggle',
    name: 'Toggle Stream',
    description: 'Toggle stream on/off',
    category: 'stream',
    defaultBinding: { key: 'F1', modifiers: ['ctrl'] },
  },
  {
    id: 'stream.quick_start',
    name: 'Quick Start Stream',
    description: 'Start stream with last used settings',
    category: 'stream',
    defaultBinding: { key: 'F3', modifiers: [] },
  },

  // Scene controls
  {
    id: 'scene.switch_next',
    name: 'Next Scene',
    description: 'Switch to the next scene',
    category: 'scenes',
    defaultBinding: { key: 'Tab', modifiers: ['ctrl'] },
  },
  {
    id: 'scene.switch_prev',
    name: 'Previous Scene',
    description: 'Switch to the previous scene',
    category: 'scenes',
    defaultBinding: { key: 'Tab', modifiers: ['ctrl', 'shift'] },
  },
  {
    id: 'scene.preview',
    name: 'Preview Scene',
    description: 'Preview scene without going live',
    category: 'scenes',
    defaultBinding: { key: 'P', modifiers: ['ctrl'] },
  },
  {
    id: 'scene.studio_mode',
    name: 'Toggle Studio Mode',
    description: 'Toggle studio mode on/off',
    category: 'scenes',
    defaultBinding: { key: 'S', modifiers: ['ctrl'] },
  },

  // Scene hotkeys (1-9 for quick switching)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `scene.${i + 1}`,
    name: `Switch to Scene ${i + 1}`,
    description: `Switch to scene ${i + 1}`,
    category: 'scenes' as HotkeyCategory,
    defaultBinding: { key: `${i + 1}`, modifiers: ['ctrl'] as Modifier[] },
  })),

  // Audio controls
  {
    id: 'audio.mute_all',
    name: 'Mute All Audio',
    description: 'Mute all audio sources',
    category: 'audio',
    defaultBinding: { key: 'M', modifiers: ['ctrl'] },
  },
  {
    id: 'audio.unmute_all',
    name: 'Unmute All Audio',
    description: 'Unmute all audio sources',
    category: 'audio',
    defaultBinding: { key: 'M', modifiers: ['ctrl', 'shift'] },
  },
  {
    id: 'audio.deafen',
    name: 'Deafen',
    description: 'Mute and deafen all audio',
    category: 'audio',
    defaultBinding: { key: 'D', modifiers: ['ctrl'] },
  },
  {
    id: 'audio.volume_up',
    name: 'Volume Up',
    description: 'Increase master volume',
    category: 'audio',
    defaultBinding: { key: 'ArrowUp', modifiers: ['ctrl', 'alt'] },
  },
  {
    id: 'audio.volume_down',
    name: 'Volume Down',
    description: 'Decrease master volume',
    category: 'audio',
    defaultBinding: { key: 'ArrowDown', modifiers: ['ctrl', 'alt'] },
  },

  // Capture controls
  {
    id: 'capture.screenshot',
    name: 'Screenshot',
    description: 'Take a screenshot',
    category: 'capture',
    defaultBinding: { key: 'F11', modifiers: [] },
  },
  {
    id: 'capture.record_start',
    name: 'Start Recording',
    description: 'Start recording',
    category: 'capture',
    defaultBinding: { key: 'F12', modifiers: [] },
  },
  {
    id: 'capture.record_stop',
    name: 'Stop Recording',
    description: 'Stop recording',
    category: 'capture',
    defaultBinding: { key: 'F12', modifiers: ['shift'] },
  },
  {
    id: 'capture.clip',
    name: 'Create Clip',
    description: 'Create a clip of the last X seconds',
    category: 'capture',
    defaultBinding: { key: 'C', modifiers: ['ctrl'] },
  },

  // VTuber controls
  {
    id: 'vtuber.toggle_tracking',
    name: 'Toggle Face Tracking',
    description: 'Toggle face tracking on/off',
    category: 'vtuber',
    defaultBinding: { key: 'T', modifiers: ['ctrl'] },
  },
  {
    id: 'vtuber.reset_pose',
    name: 'Reset Pose',
    description: 'Reset VTuber model to default pose',
    category: 'vtuber',
    defaultBinding: { key: 'R', modifiers: ['ctrl'] },
  },
  {
    id: 'vtuber.expression_neutral',
    name: 'Neutral Expression',
    description: 'Set neutral expression',
    category: 'vtuber',
    defaultBinding: { key: '0', modifiers: ['alt'] },
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `vtuber.expression_${i + 1}`,
    name: `Expression ${i + 1}`,
    description: `Set VTuber expression ${i + 1}`,
    category: 'vtuber' as HotkeyCategory,
    defaultBinding: { key: `${i + 1}`, modifiers: ['alt'] as Modifier[] },
  })),

  // Chat controls
  {
    id: 'chat.toggle',
    name: 'Toggle Chat',
    description: 'Show/hide chat panel',
    category: 'chat',
    defaultBinding: { key: 'H', modifiers: ['ctrl'] },
  },
  {
    id: 'chat.clear',
    name: 'Clear Chat',
    description: 'Clear chat messages',
    category: 'chat',
    defaultBinding: { key: 'Delete', modifiers: ['ctrl'] },
  },

  // General
  {
    id: 'general.settings',
    name: 'Open Settings',
    description: 'Open settings panel',
    category: 'general',
    defaultBinding: { key: ',', modifiers: ['ctrl'] },
  },
  {
    id: 'general.fullscreen',
    name: 'Toggle Fullscreen',
    description: 'Toggle fullscreen mode',
    category: 'general',
    defaultBinding: { key: 'F', modifiers: ['ctrl'] },
  },
  {
    id: 'general.help',
    name: 'Help',
    description: 'Show help overlay',
    category: 'general',
    defaultBinding: { key: 'F1', modifiers: ['ctrl'] },
  },
];

export const getCategoryLabel = (category: HotkeyCategory): string => {
  const labels: Record<HotkeyCategory, string> = {
    stream: 'Stream Controls',
    scenes: 'Scene Management',
    audio: 'Audio Controls',
    capture: 'Capture & Recording',
    vtuber: 'VTuber',
    chat: 'Chat',
    general: 'General',
  };
  return labels[category];
};

export const getCategoryIcon = (category: HotkeyCategory): string => {
  const icons: Record<HotkeyCategory, string> = {
    stream: '🎥',
    scenes: '🎬',
    audio: '🔊',
    capture: '📷',
    vtuber: '🎭',
    chat: '💬',
    general: '⚙️',
  };
  return icons[category];
};