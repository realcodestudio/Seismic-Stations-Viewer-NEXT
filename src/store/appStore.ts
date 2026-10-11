import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, BackgroundType, DisplaySettings } from '@/src/types/seismic';

export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';

interface AppState {
  theme: ThemeMode;
  background: BackgroundType;
  locale: Locale;
  showSettings: boolean;
  showWaveformMode: boolean;
  stationFilter: string;
  displaySettings: DisplaySettings;
  websocketUrl: string;
  debugMode: boolean;
  ignoreStale: boolean;
  soloMode: boolean;
  soloStations: string[];
  miniMode: boolean;
  wallpaperUrl: string;
  wallpaperBlur: boolean;
  cardOpacity: number;
  toast: string | null;

  toggleTheme: () => void;
  setBackground: (bg: BackgroundType) => void;
  setLocale: (locale: Locale) => void;
  toggleSettings: () => void;
  toggleWaveformMode: () => void;
  setStationFilter: (filter: string) => void;
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  setWebsocketUrl: (url: string) => void;
  setDebugMode: (enabled: boolean) => void;
  setIgnoreStale: (enabled: boolean) => void;
  setSoloMode: (enabled: boolean) => void;
  toggleSoloStation: (uuid: string) => void;
  toggleMiniMode: () => void;
  refreshWallpaper: () => void;
  setWallpaperBlur: (enabled: boolean) => void;
  setCardOpacity: (opacity: number) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const defaultDisplaySettings: DisplaySettings = {
  pga: true,
  measuredIntensity: true,
  maxJMAShindo: true,
  maxCSISIntensity: true,
  longPeriod: true,
  realTimeJMA: true,
  realTimeCSIS: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      background: 'white',
      locale: 'zh-CN',
      showSettings: false,
      showWaveformMode: false,
      stationFilter: '',
      displaySettings: defaultDisplaySettings,
      websocketUrl: 'wss://seisjs.wolfx.jp/all_seis',
      debugMode: false,
      ignoreStale: false,
      soloMode: false,
      soloStations: [],
      miniMode: false,
      wallpaperUrl: 'https://api.wolfx.jp/img.php',
      wallpaperBlur: false,
      cardOpacity: 100,
      toast: null,

      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
          let background = state.background;
          if (nextTheme === 'dark' && background === 'white') background = 'black';
          if (nextTheme === 'light' && background === 'black') background = 'white';
          return { theme: nextTheme, background };
        }),

      setBackground: (bg) => set({ background: bg }),

      setLocale: (locale) => set({ locale }),

      toggleSettings: () =>
        set((state) => ({ showSettings: !state.showSettings })),

      toggleWaveformMode: () =>
        set((state) => ({ showWaveformMode: !state.showWaveformMode })),

      setStationFilter: (filter) => set({ stationFilter: filter }),

      updateDisplaySettings: (settings) =>
        set((state) => ({
          displaySettings: { ...state.displaySettings, ...settings },
        })),

      setWebsocketUrl: (url) => set({ websocketUrl: url }),

      setDebugMode: (enabled) => set({ debugMode: enabled }),

      setIgnoreStale: (enabled) => set({ ignoreStale: enabled }),

      setSoloMode: (enabled) => set({ soloMode: enabled }),

      toggleSoloStation: (uuid) =>
        set((state) => ({
          soloStations: state.soloStations.includes(uuid)
            ? state.soloStations.filter((u) => u !== uuid)
            : [...state.soloStations, uuid],
        })),

      toggleMiniMode: () =>
        set((state) => {
          const next = !state.miniMode;
          return next
            ? { miniMode: true, showWaveformMode: false }
            : { miniMode: false };
        }),

      refreshWallpaper: () =>
        set({ wallpaperUrl: `https://api.wolfx.jp/img.php?t=${Date.now()}` }),

      setWallpaperBlur: (enabled) => set({ wallpaperBlur: enabled }),

      setCardOpacity: (opacity) => set({ cardOpacity: opacity }),

      showToast: (msg) => set({ toast: msg }),

      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'ssv-next-settings',
      storage: createJSONStorage(() => localStorage),
      // Deferred so the first client render matches the server HTML; page.tsx calls rehydrate() on mount
      skipHydration: true,
      partialize: (state) => ({
        theme: state.theme,
        background: state.background,
        locale: state.locale,
        showWaveformMode: state.showWaveformMode,
        displaySettings: state.displaySettings,
        websocketUrl: state.websocketUrl,
        ignoreStale: state.ignoreStale,
        soloMode: state.soloMode,
        soloStations: state.soloStations,
        miniMode: state.miniMode,
        wallpaperBlur: state.wallpaperBlur,
        cardOpacity: state.cardOpacity,
      }),
    }
  )
);
