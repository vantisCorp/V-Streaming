import React, { useEffect } from 'react';
import hotkeyManager from '../services/HotkeyManager';

export const GlobalKeyboardListener: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hotkeyManager.isEnabled()) return;

      // Don't trigger hotkeys when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push('ctrl');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');
      if (e.metaKey) modifiers.push('meta');

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      const action = hotkeyManager.handleKeyPress(key, modifiers);
      if (action) {
        e.preventDefault();
        e.stopPropagation();

        // Execute the action based on type
        executeAction(action.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const executeAction = async (actionId: string) => {
    const { invoke } = await import('@tauri-apps/api/core');

    try {
      switch (actionId) {
        case 'stream.start':
          await invoke('start_stream');
          break;
        case 'stream.stop':
          await invoke('stop_stream');
          break;
        case 'stream.toggle':
          await invoke('toggle_stream');
          break;
        case 'stream.quick_start':
          await invoke('quick_start_stream');
          break;
        case 'audio.mute_all':
          await invoke('mute_all_audio');
          break;
        case 'audio.unmute_all':
          await invoke('unmute_all_audio');
          break;
        case 'audio.volume_up':
          await invoke('adjust_master_volume', { delta: 5 });
          break;
        case 'audio.volume_down':
          await invoke('adjust_master_volume', { delta: -5 });
          break;
        case 'capture.screenshot':
          await invoke('take_screenshot');
          break;
        case 'capture.record_start':
          await invoke('start_recording');
          break;
        case 'capture.record_stop':
          await invoke('stop_recording');
          break;
        case 'capture.clip':
          await invoke('create_clip');
          break;
        case 'vtuber.toggle_tracking':
          await invoke('toggle_face_tracking');
          break;
        case 'vtuber.reset_pose':
          await invoke('reset_vtuber_pose');
          break;
        case 'vtuber.expression_neutral':
        case 'vtuber.expression_1':
        case 'vtuber.expression_2':
        case 'vtuber.expression_3':
        case 'vtuber.expression_4':
        case 'vtuber.expression_5':
          const expressionIndex = parseInt(actionId.split('_').pop() || '0');
          await invoke('set_vtuber_expression', { expression: expressionIndex });
          break;
        case 'scene.switch_next':
          await invoke('switch_scene_next');
          break;
        case 'scene.switch_prev':
          await invoke('switch_scene_prev');
          break;
        case 'scene.preview':
          await invoke('toggle_scene_preview');
          break;
        case 'scene.studio_mode':
          await invoke('toggle_studio_mode');
          break;
        // Scene hotkeys (scene.1 to scene.9)
        case actionId.match(/^scene\.\d+$/) ? actionId : '':
          const sceneIndex = parseInt(actionId.split('.')[1]) - 1;
          await invoke('switch_scene_by_index', { index: sceneIndex });
          break;
        case 'chat.toggle':
          await invoke('toggle_chat_panel');
          break;
        case 'chat.clear':
          await invoke('clear_chat');
          break;
        default:
          console.log(`No handler for action: ${actionId}`);
      }
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
    }
  };

  return null;
};

export default GlobalKeyboardListener;