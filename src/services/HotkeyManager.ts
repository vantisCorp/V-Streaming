import { EventEmitter } from 'events';
import {
  HotkeyAction,
  KeyBinding,
  HotkeyConfig,
  HOTKEY_ACTIONS,
} from '../types/hotkeys';
import { invoke } from '@tauri-apps/api/core';

class HotkeyManager extends EventEmitter {
  private config: HotkeyConfig;
  private bindingMap: Map<string, HotkeyAction>;
  private enabled: boolean = true;

  constructor() {
    super();
    this.config = {
      actions: HOTKEY_ACTIONS.map(action => ({
        ...action,
        currentBinding: action.defaultBinding,
      })),
      enabled: true,
    };
    this.bindingMap = new Map();
    this.buildBindingMap();
    this.loadConfig();
  }

  private buildBindingMap(): void {
    this.bindingMap.clear();
    for (const action of this.config.actions) {
      const key = this.bindingToString(action.currentBinding);
      this.bindingMap.set(key, action);
    }
  }

  private bindingToString(binding: KeyBinding): string {
    const modifiers = binding.modifiers.sort().join('+');
    return modifiers ? `${modifiers}+${binding.key}` : binding.key;
  }

  private stringToBinding(str: string): KeyBinding {
    const parts = str.split('+');
    const key = parts.pop() || '';
    const modifiers = parts.filter(p => ['ctrl', 'alt', 'shift', 'meta'].includes(p)) as any[];
    return { key, modifiers };
  }

  async loadConfig(): Promise<void> {
    try {
      const saved = await invoke<HotkeyConfig>('load_hotkey_config');
      if (saved) {
        this.config = saved;
        this.enabled = this.config.enabled;
        this.buildBindingMap();
      }
    } catch (error) {
      console.error('Failed to load hotkey config:', error);
    }
  }

  async saveConfig(): Promise<void> {
    try {
      await invoke('save_hotkey_config', { config: this.config });
    } catch (error) {
      console.error('Failed to save hotkey config:', error);
      throw error;
    }
  }

  getActions(): HotkeyAction[] {
    return this.config.actions;
  }

  getActionsByCategory(category: string): HotkeyAction[] {
    return this.config.actions.filter(action => action.category === category);
  }

  getAction(id: string): HotkeyAction | undefined {
    return this.config.actions.find(action => action.id === id);
  }

  async updateBinding(actionId: string, newBinding: KeyBinding): Promise<void> {
    const action = this.config.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    // Check for conflicts
    const conflictKey = this.bindingToString(newBinding);
    const conflictingAction = this.bindingMap.get(conflictKey);
    if (conflictingAction && conflictingAction.id !== actionId) {
      throw new Error(`Key binding conflicts with ${conflictingAction.name}`);
    }

    // Remove old binding
    const oldBindingKey = this.bindingToString(action.currentBinding);
    this.bindingMap.delete(oldBindingKey);

    // Update binding
    action.currentBinding = newBinding;
    this.bindingMap.set(conflictKey, action);

    await this.saveConfig();
    this.emit('binding_updated', { actionId, newBinding });
  }

  async resetBinding(actionId: string): Promise<void> {
    const action = this.config.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    await this.updateBinding(actionId, action.defaultBinding);
  }

  async resetAllBindings(): Promise<void> {
    for (const action of this.config.actions) {
      action.currentBinding = action.defaultBinding;
    }
    this.buildBindingMap();
    await this.saveConfig();
    this.emit('bindings_reset');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.config.enabled = enabled;
    this.emit('enabled_changed', enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  handleKeyPress(key: string, modifiers: string[]): HotkeyAction | null {
    if (!this.enabled) {
      return null;
    }

    const sortedModifiers = [...modifiers].sort();
    const bindingString = sortedModifiers.length > 0 
      ? sortedModifiers.join('+') + '+' + key
      : key;

    const action = this.bindingMap.get(bindingString);
    if (action) {
      this.emit('hotkey_triggered', action);
      return action;
    }

    return null;
  }

  getActionById(actionId: string): HotkeyAction | undefined {
    return this.config.actions.find(a => a.id === actionId);
  }

  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  async importConfig(configString: string): Promise<void> {
    try {
      const imported = JSON.parse(configString) as HotkeyConfig;
      
      // Validate config
      if (!imported.actions || !Array.isArray(imported.actions)) {
        throw new Error('Invalid config format');
      }

      // Update bindings for existing actions
      for (const importedAction of imported.actions) {
        const action = this.config.actions.find(a => a.id === importedAction.id);
        if (action && importedAction.currentBinding) {
          action.currentBinding = importedAction.currentBinding;
        }
      }

      this.buildBindingMap();
      await this.saveConfig();
      this.emit('config_imported');
    } catch (error) {
      console.error('Failed to import hotkey config:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hotkeyManager = new HotkeyManager();
export default hotkeyManager;