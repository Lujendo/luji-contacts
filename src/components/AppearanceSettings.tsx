import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Eye, 
  EyeOff, 
  Palette, 
  Layout, 
  Zap,
  Save,
  RotateCcw,
  Check
} from 'lucide-react';

interface AppearanceSettingsProps {
  onClose?: () => void;
  onSettingsChange?: (settings: AppearanceSettings) => void;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  showHeader: boolean;
  showFooter: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  sidebarPosition: 'left' | 'right';
  accentColor: string;
  showCacheStats: boolean;
  enableInfiniteScroll: boolean;
}

const defaultSettings: AppearanceSettings = {
  theme: 'system',
  showHeader: true,
  showFooter: true,
  compactMode: false,
  animationsEnabled: true,
  highContrast: false,
  fontSize: 'medium',
  sidebarPosition: 'left',
  accentColor: '#3B82F6',
  showCacheStats: false,
  enableInfiniteScroll: true
};

const AppearanceSettingsComponent: React.FC<AppearanceSettingsProps> = ({
  onClose,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('luji-contacts-appearance');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('luji-contacts-appearance');
    const currentSettingsString = JSON.stringify(settings);
    const savedSettingsString = savedSettings || JSON.stringify(defaultSettings);
    setHasChanges(currentSettingsString !== savedSettingsString);
  }, [settings]);

  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem('luji-contacts-appearance', JSON.stringify(settings));
    onSettingsChange?.(settings);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('luji-contacts-appearance');
    onSettingsChange?.(defaultSettings);
  };

  const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Appearance Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the look and feel of your contact manager
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'light', label: 'Light', icon: Sun },
              { key: 'dark', label: 'Dark', icon: Moon },
              { key: 'system', label: 'System', icon: Monitor }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => updateSetting('theme', key as any)}
                className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                  settings.theme === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Layout</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium">Show Header</label>
                  <p className="text-xs text-gray-500">Display the application header with branding</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showHeader', !settings.showHeader)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showHeader ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showHeader ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EyeOff className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium">Show Footer</label>
                  <p className="text-xs text-gray-500">Display footer with links and information</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showFooter', !settings.showFooter)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showFooter ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showFooter ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Layout className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium">Compact Mode</label>
                  <p className="text-xs text-gray-500">Reduce spacing for more content</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('compactMode', !settings.compactMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium">Enable Animations</label>
                  <p className="text-xs text-gray-500">Smooth transitions and animations</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('animationsEnabled', !settings.animationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.animationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium">Show Cache Statistics</label>
                  <p className="text-xs text-gray-500">Display performance metrics (developer mode)</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showCacheStats', !settings.showCacheStats)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showCacheStats ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showCacheStats ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <h3 className="text-lg font-medium mb-4">Accent Color</h3>
          <div className="grid grid-cols-5 gap-3">
            {accentColors.map(({ name, value }) => (
              <button
                key={value}
                onClick={() => updateSetting('accentColor', value)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  settings.accentColor === value
                    ? 'border-gray-400 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: value }}
                title={name}
              >
                {settings.accentColor === value && (
                  <Check className="w-6 h-6 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <h3 className="text-lg font-medium mb-4">Font Size</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'small', label: 'Small' },
              { key: 'medium', label: 'Medium' },
              { key: 'large', label: 'Large' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => updateSetting('fontSize', key as any)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  settings.fontSize === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`font-medium ${
                  key === 'small' ? 'text-sm' : key === 'large' ? 'text-lg' : 'text-base'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-gray-50">
        <button
          onClick={resetSettings}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>

        <div className="flex items-center space-x-3">
          {saved && (
            <span className="text-sm text-green-600 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettingsComponent;
