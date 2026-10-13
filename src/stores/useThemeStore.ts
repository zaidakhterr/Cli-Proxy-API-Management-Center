/**
 * Theme: light or dark. Until the user picks one, it follows the system setting.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/types';
import { STORAGE_KEY_THEME } from '@/utils/constants';

interface ThemeState {
  /** The user's explicit choice, or null to follow the system. */
  theme: Theme | null;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initializeTheme: () => () => void;
}

const getSystemTheme = (): Theme =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

/** Older builds saved 'auto', 'white' or 'light' (a warm palette); map them onto the two themes. */
export const normalizeStoredTheme = (value: unknown): Theme | null => {
  if (value === 'dark') return 'dark';
  if (value === 'light' || value === 'white') return 'light';
  return null;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: null,
      resolvedTheme: 'light',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme, resolvedTheme: theme });
      },

      toggleTheme: () => {
        get().setTheme(get().resolvedTheme === 'dark' ? 'light' : 'dark');
      },

      initializeTheme: () => {
        const { theme } = get();
        const resolved = theme ?? getSystemTheme();
        applyTheme(resolved);
        set({ resolvedTheme: resolved });

        if (!window.matchMedia) {
          return () => {};
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
          if (get().theme !== null) return;
          const next = getSystemTheme();
          applyTheme(next);
          set({ resolvedTheme: next });
        };

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
      },
    }),
    {
      name: STORAGE_KEY_THEME,
      version: 1,
      partialize: (state) => ({ theme: state.theme }),
      migrate: (persisted) => ({
        theme: normalizeStoredTheme((persisted as { theme?: unknown } | undefined)?.theme),
      }),
    }
  )
);
