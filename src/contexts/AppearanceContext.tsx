import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppearanceSettings } from '../components/AppearanceSettings';

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSettings: (newSettings: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
  isDarkMode: boolean;
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

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};

interface AppearanceProviderProps {
  children: ReactNode;
}

export const AppearanceProvider: React.FC<AppearanceProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Determine dark mode based on theme setting
  useEffect(() => {
    const updateDarkMode = () => {
      if (settings.theme === 'dark') {
        setIsDarkMode(true);
      } else if (settings.theme === 'light') {
        setIsDarkMode(false);
      } else {
        // System theme
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    };

    updateDarkMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      console.log('Applied dark mode class');
    } else {
      root.classList.remove('dark');
      console.log('Removed dark mode class');
    }

    // Apply other settings as CSS custom properties
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--font-size-base', 
      settings.fontSize === 'small' ? '14px' : 
      settings.fontSize === 'large' ? '18px' : '16px'
    );

    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply animations
    if (!settings.animationsEnabled) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  }, [isDarkMode, settings]);

  const updateSettings = (newSettings: Partial<AppearanceSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('luji-contacts-appearance', JSON.stringify(updatedSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('luji-contacts-appearance');
  };

  const value: AppearanceContextType = {
    settings,
    updateSettings,
    resetSettings,
    isDarkMode
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
};

export default AppearanceProvider;
