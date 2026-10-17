import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeMode, BackgroundType, DisplaySettings } from '@/src/types/seismic';

export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';
export type PipStyle = 'cards' | 'shindoList';
export type ViewMode = 'stations' | 'waveform' | 'mini' | 'map';
export type MiniTheme = 'dark' | 'light';
export interface PipDims { width: number; height: number }
export const PIP_STYLE_DEFAULTS: Record<PipStyle, PipDims> = {
  cards: { width: 255, height: 90 },
  shindoList: { width: 240, height: 220 },
};

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
  mapMode: boolean;
  miniTheme: MiniTheme;
  pipTheme: MiniTheme;
  /** MD3E accent seed; every tinted role derives from it. */
  accent: string;
  wallpaperUrl: string;
  wallpaperBlur: boolean;
  cardOpacity: number;
  pipStyle: PipStyle;
  pipDims: Record<PipStyle, PipDims>;
  sortByShindo: boolean;
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
  setMiniTheme: (theme: MiniTheme) => void;
  setPipTheme: (theme: MiniTheme) => void;
  setAccent: (hex: string) => void;
  setViewMode: (mode: ViewMode) => void;
  refreshWallpaper: () => void;
  setWallpaperBlur: (enabled: boolean) => void;
  setCardOpacity: (opacity: number) => void;
  setPipStyle: (style: PipStyle) => void;
  setPipDims: (style: PipStyle, dims: PipDims) => void;
  setSortByShindo: (enabled: boolean) => void;
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
      mapMode: true,
      miniTheme: 'dark',
      pipTheme: 'dark',
      // Lowercase: <input type="color"> only accepts #rrggbb in lowercase
      accent: '#6750a4',
      wallpaperUrl: 'https://api.wolfx.jp/img.php',
      wallpaperBlur: false,
      cardOpacity: 100,
      pipStyle: 'cards',
      pipDims: { ...PIP_STYLE_DEFAULTS, cards: { ...PIP_STYLE_DEFAULTS.cards }, shindoList: { ...PIP_STYLE_DEFAULTS.shindoList } },
      sortByShindo: false,
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
        set((state) => ({
          showWaveformMode: !state.showWaveformMode,
          mapMode: false,
        })),

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
            ? { miniMode: true, showWaveformMode: false, mapMode: false }
            : { miniMode: false };
        }),

      setViewMode: (mode) =>
        set(() => {
          if (mode === 'mini') return { miniMode: true, showWaveformMode: false, mapMode: false };
          if (mode === 'waveform') return { miniMode: false, showWaveformMode: true, mapMode: false };
          if (mode === 'map') return { miniMode: false, showWaveformMode: false, mapMode: true };
          return { miniMode: false, showWaveformMode: false, mapMode: false };
        }),

      setMiniTheme: (theme) => set({ miniTheme: theme }),

      setPipTheme: (theme) => set({ pipTheme: theme }),

      setAccent: (hex) => set({ accent: hex }),

      refreshWallpaper: () =>
        set({ wallpaperUrl: `https://api.wolfx.jp/img.php?t=${Date.now()}` }),

      setWallpaperBlur: (enabled) => set({ wallpaperBlur: enabled }),

      setCardOpacity: (opacity) => set({ cardOpacity: opacity }),

      setPipDims: (style, dims) =>
        set((state) => ({ pipDims: { ...state.pipDims, [style]: dims } })),

      setPipStyle: (style) => set({ pipStyle: style }),

      setSortByShindo: (enabled) => set({ sortByShindo: enabled }),

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
        mapMode: state.mapMode,
        miniTheme: state.miniTheme,
        pipTheme: state.pipTheme,
        accent: state.accent,
        wallpaperBlur: state.wallpaperBlur,
        cardOpacity: state.cardOpacity,
        pipStyle: state.pipStyle,
        pipDims: state.pipDims,
        sortByShindo: state.sortByShindo,
      }),
    }
  )
);
