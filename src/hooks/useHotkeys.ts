import { useEffect, useCallback } from 'react';
import hotkeyManager from '../services/HotkeyManager';
import { HotkeyAction, Modifier } from '../types/hotkeys';

interface UseHotkeysOptions {
  onHotkey?: (action: HotkeyAction) => void;
  enabled?: boolean;
}

export const useHotkeys = (options: UseHotkeysOptions = {}) => {
  const { onHotkey, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleHotkey = (action: HotkeyAction) => {
      onHotkey?.(action);
    };

    hotkeyManager.on('hotkey_triggered', handleHotkey);

    return () => {
      hotkeyManager.off('hotkey_triggered', handleHotkey);
    };
  }, [onHotkey, enabled]);

  const getAction = useCallback((id: string) => {
    return hotkeyManager.getActionById(id);
  }, []);

  const updateBinding = useCallback(async (actionId: string, binding: { key: string; modifiers: Modifier[] }) => {
    return hotkeyManager.updateBinding(actionId, binding);
  }, []);

  const resetBinding = useCallback(async (actionId: string) => {
    return hotkeyManager.resetBinding(actionId);
  }, []);

  const resetAllBindings = useCallback(async () => {
    return hotkeyManager.resetAllBindings();
  }, []);

  const exportConfig = useCallback(() => {
    return hotkeyManager.exportConfig();
  }, []);

  const importConfig = useCallback(async (configString: string) => {
    return hotkeyManager.importConfig(configString);
  }, []);

  return {
    getAction,
    updateBinding,
    resetBinding,
    resetAllBindings,
    exportConfig,
    importConfig,
    isEnabled: hotkeyManager.isEnabled(),
  };
};

export default useHotkeys;