import {useCallback, useEffect} from 'react';
import type {Theme} from '../types';
import {useLocalStorage} from './use-local-storage';

export interface UseThemeReturn {
  isDark: boolean;
  setTheme: (theme: Theme | ((prev: Theme) => Theme)) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useLocalStorage<Theme>(
    'voice_timer_theme',
    () => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'dark';
    },
    'voice-timer_theme',
  );

  const isDark = theme === 'dark';

  // Synchronize document root class and color-scheme for native browser controls
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme, isDark]);

  // Listen for system appearance preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return {
    isDark,
    setTheme,
    theme,
    toggleTheme,
  };
}
