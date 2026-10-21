import { writable } from 'svelte/store';
import { browser } from '$app/env';

const STORAGE_KEY = 'mergemail-theme';

function getInitialDarkMode(): boolean {
  if (!browser) return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  // Fall back to OS preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function createThemeStore() {
  const { subscribe, set, update } = writable<boolean>(getInitialDarkMode());

  return {
    subscribe,
    /** Enable dark mode. */
    enableDark() {
      set(true);
      if (browser) {
        localStorage.setItem(STORAGE_KEY, 'dark');
        document.documentElement.classList.add('dark');
      }
    },
    /** Enable light mode. */
    enableLight() {
      set(false);
      if (browser) {
        localStorage.setItem(STORAGE_KEY, 'light');
        document.documentElement.classList.remove('dark');
      }
    },
    /** Toggle between dark and light mode. */
    toggle() {
      update((isDark) => {
        const next = !isDark;
        if (browser) {
          localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
          document.documentElement.classList.toggle('dark', next);
        }
        return next;
      });
    },
    /** Apply the current theme to the DOM (call on mount). */
    applyToDom(isDark: boolean) {
      if (browser) {
        document.documentElement.classList.toggle('dark', isDark);
      }
    }
  };
}

export const theme = createThemeStore();
