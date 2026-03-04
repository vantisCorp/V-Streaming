import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import hotkeyManager from '../services/HotkeyManager';
import { getCategoryLabel, getCategoryIcon, HotkeyCategory, HotkeyAction, KeyBinding } from '../types/hotkeys';

interface Props {
  onClose?: () => void;
}

export const HotkeySettings: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [actions, setActions] = useState<HotkeyAction[]>([]);
  const [editingAction, setEditingAction] = useState<HotkeyAction | null>(null);
  const [recording, setRecording] = useState(false);
  const [tempBinding, setTempBinding] = useState<KeyBinding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HotkeyCategory | 'all'>('all');
  const [enabled, setEnabled] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadActions();
    setEnabled(hotkeyManager.isEnabled());

    const handleBindingUpdated = ({ actionId, newBinding }: { actionId: string; newBinding: KeyBinding }) => {
      loadActions();
      showNotification('success', 'Key binding updated successfully');
    };

    hotkeyManager.on('binding_updated', handleBindingUpdated);

    return () => {
      hotkeyManager.off('binding_updated', handleBindingUpdated);
    };
  }, []);

  const loadActions = () => {
    setActions(hotkeyManager.getActions());
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;

    e.preventDefault();

    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');

    const key = e.key;

    if (key === 'Escape') {
      // Cancel recording
      setRecording(false);
      setTempBinding(null);
      setEditingAction(null);
      return;
    }

    if (key === 'Enter' && tempBinding) {
      // Apply binding
      if (editingAction) {
        handleSaveBinding(editingAction.id, tempBinding);
      }
      return;
    }

    const newBinding: KeyBinding = {
      key: key.length === 1 ? key.toLowerCase() : key,
      modifiers: modifiers as any,
    };

    setTempBinding(newBinding);
  };

  const startRecording = (action: HotkeyAction) => {
    setEditingAction(action);
    setRecording(true);
    setTempBinding(null);
  };

  const handleSaveBinding = async (actionId: string, binding: KeyBinding) => {
    try {
      await hotkeyManager.updateBinding(actionId, binding);
      setRecording(false);
      setTempBinding(null);
      setEditingAction(null);
      loadActions();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to update binding');
    }
  };

  const handleResetBinding = async (actionId: string) => {
    try {
      await hotkeyManager.resetBinding(actionId);
      loadActions();
      showNotification('success', 'Binding reset to default');
    } catch (error) {
      showNotification('error', 'Failed to reset binding');
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Are you sure you want to reset all key bindings to default?')) {
      try {
        await hotkeyManager.resetAllBindings();
        loadActions();
        showNotification('success', 'All bindings reset to default');
      } catch (error) {
        showNotification('error', 'Failed to reset bindings');
      }
    }
  };

  const handleToggleEnabled = (enabled: boolean) => {
    hotkeyManager.setEnabled(enabled);
    setEnabled(enabled);
  };

  const handleExportConfig = () => {
    const config = hotkeyManager.exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotkey-config.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Configuration exported');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await hotkeyManager.importConfig(content);
        loadActions();
        showNotification('success', 'Configuration imported');
      } catch (error) {
        showNotification('error', 'Failed to import configuration');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatBinding = (binding: KeyBinding): string => {
    const modifiers = binding.modifiers.map(m => {
      const labels: Record<string, string> = {
        ctrl: 'Ctrl',
        alt: 'Alt',
        shift: 'Shift',
        meta: 'Meta',
      };
      return labels[m];
    }).join(' + ');

    const key = binding.key.length === 1 ? binding.key.toUpperCase() : binding.key;
    return modifiers ? `${modifiers} + ${key}` : key;
  };

  const categories: HotkeyCategory[] = ['stream', 'scenes', 'audio', 'capture', 'vtuber', 'chat', 'general'];

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || action.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<HotkeyCategory, HotkeyAction[]>);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Keyboard Shortcuts</h1>
            <p className="text-gray-400">Customize your keyboard shortcuts</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Enable Hotkeys</span>
          </label>

          <button
            onClick={handleResetAll}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            Reset All
          </button>

          <button
            onClick={handleExportConfig}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            Export
          </button>

          <label className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition cursor-pointer">
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Search and Filter */}
      <div className="p-6 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-64 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as HotkeyCategory | 'all')}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Keybinding Recording Modal */}
      {recording && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl text-center">
            <h2 className="text-2xl font-bold mb-4">Press a key</h2>
            <p className="text-gray-400 mb-6">
              {tempBinding ? `New binding: ${formatBinding(tempBinding)}` : 'Press any key combination'}
            </p>
            <div className="text-sm text-gray-500 mb-6">
              <p>Press Enter to apply</p>
              <p>Press Escape to cancel</p>
            </div>
            <button
              onClick={() => {
                setRecording(false);
                setTempBinding(null);
                setEditingAction(null);
              }}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keybindings List */}
      <div className="p-6">
        {Object.entries(groupedActions).map(([category, actions]) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>{getCategoryIcon(category as HotkeyCategory)}</span>
              {getCategoryLabel(category as HotkeyCategory)}
            </h2>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-750 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{action.name}</h3>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startRecording(action)}
                        className={`px-4 py-2 rounded-lg font-mono transition ${
                          editingAction?.id === action.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {formatBinding(action.currentBinding)}
                      </button>
                      <button
                        onClick={() => handleResetBinding(action.id)}
                        className="text-gray-400 hover:text-white transition"
                        title="Reset to default"
                      >
                        ↺
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredActions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No actions found matching your search
          </div>
        )}
      </div>
    </div>
  );
};

export default HotkeySettings;