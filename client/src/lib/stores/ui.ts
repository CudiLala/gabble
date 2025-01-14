import { writable, type Readable } from 'svelte/store';

const PREFERS_COLOR_SCHEME_DARK_MEDIA_QUERY = '(prefers-color-scheme:dark)';

export type UIStoreMethods = {
  openSidebar(): void;
  closeSidebar(): void;
  setDarkColorScheme(): void;
  setLightColorScheme(): void;
  syncPreferredScheme(): void;
};

export enum ColorScheme {
  Dark = 'dark',
  Light = 'light',
}

export type UIStore = {
  isSidebarOpen: boolean;
  colorScheme: ColorScheme;
};

/**
 * Returns the preferred color scheme based on user's operative system
 */
export function getPreferredScheme(): ColorScheme {
  if (typeof window !== 'undefined') {
    return window?.matchMedia?.(PREFERS_COLOR_SCHEME_DARK_MEDIA_QUERY)?.matches
      ? ColorScheme.Dark
      : ColorScheme.Light;
  }

  return ColorScheme.Light;
}

export function createUIStore() {
  const { subscribe, update } = writable({
    isSidebarOpen: false,
    colorScheme: getPreferredScheme(),
  });

  const syncPreferredScheme = () => {
    // const preferredScheme = getPreferredScheme();

    // if (preferredScheme === ColorScheme.Dark) {
    //   setDarkColorScheme();
    // } else {
    //   setLightColorScheme();
    // }
    // setLightColorScheme();
    setDarkColorScheme();
  };

  const closeSidebar = () =>
    update((current) => ({
      ...current,
      isSidebarOpen: false,
    }));

  const openSidebar = () =>
    update((current) => ({
      ...current,
      isSidebarOpen: true,
    }));

  const setDarkColorScheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');

      update((current) => ({
        ...current,
        colorScheme: ColorScheme.Dark,
      }));
    }
  };

  const setLightColorScheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');

      update((current) => ({
        ...current,
        colorScheme: ColorScheme.Light,
      }));
    }
  };

  return {
    subscribe,
    openSidebar,
    closeSidebar,
    setDarkColorScheme,
    setLightColorScheme,
    syncPreferredScheme,
  };
}

const uiStore = createUIStore() as unknown as Readable<UIStore> &
  UIStoreMethods;
export default uiStore;
