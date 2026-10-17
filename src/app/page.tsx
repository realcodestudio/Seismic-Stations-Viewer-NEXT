'use client';

import { useState, useMemo, useEffect } from 'react';
import { Settings, Activity, Moon, Sun, PictureInPicture2 } from 'lucide-react';
import { ViewModeToggle } from '@/src/components/ViewModeToggle';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useSeismicStore } from '@/src/store/seismicStore';
import { useAppStore } from '@/src/store/appStore';
import { usePipWindow } from '@/src/hooks/usePipWindow';
import { StationCard } from '@/src/components/StationCard';
import { MapOverview } from '@/src/components/MapOverview';
import { MiniStationCard } from '@/src/components/MiniStationCard';
import { StationDetailModal } from '@/src/components/StationDetailModal';
import { PipBridge } from '@/src/components/PipBridge';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { SettingsPanel } from '@/src/components/SettingsPanel';
import { SplashScreen } from '@/src/components/SplashScreen';
import { Toast } from '@/src/components/Toast';
import type { SeismicData } from '@/src/types/seismic';
import { useTranslation } from '@/src/hooks/useTranslation';

// StationCard shows the no-response hint after 25s without data change;
// hide it 10s later, and bring it back as soon as data changes again.
const STALE_HINT_MS = 25000;
const HIDE_AFTER_MS = STALE_HINT_MS + 10000;

export default function Home() {
  useWebSocket();
  const { t } = useTranslation();

  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [tick, setTick] = useState(0);
  const [uiIdle, setUiIdle] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);

  const seismicDataMap = useSeismicStore((s) => s.seismicDataMap);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const showSettings = useAppStore((s) => s.showSettings);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const stationFilter = useAppStore((s) => s.stationFilter);
  const soloMode = useAppStore((s) => s.soloMode);
  const soloStations = useAppStore((s) => s.soloStations);
  const ignoreStale = useAppStore((s) => s.ignoreStale);
  const miniMode = useAppStore((s) => s.miniMode);
  const mapMode = useAppStore((s) => s.mapMode);
  const wallpaperUrl = useAppStore((s) => s.wallpaperUrl);
  const wallpaperBlur = useAppStore((s) => s.wallpaperBlur);
  const cardOpacity = useAppStore((s) => s.cardOpacity);
  const background = useAppStore((s) => s.background);
  const locale = useAppStore((s) => s.locale);
  const sortByShindo = useAppStore((s) => s.sortByShindo);
  const accent = useAppStore((s) => s.accent);

  const {
    supported: pipSupported,
    pipWindow,
    restartToken: pipRestartToken,
    toggle: togglePip,
    restart: restartPip,
  } = usePipWindow();

  const isDark = theme === 'dark';

  // Settings live in localStorage; rehydrate after the first render so the
  // server HTML and the client's initial render both use store defaults.
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Inline so the PiP window (which copies documentElement's custom props) matches
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
  }, [accent]);

  useEffect(() => {
    document.body.classList.toggle('bg-transparent', background === 'green-black');
    document.documentElement.style.setProperty(
      '--card-opacity',
      background === 'green-black' ? String(cardOpacity / 100) : '1'
    );
  }, [background, cardOpacity]);

  // Idle chrome: hide the FAB, the view toggle and the map controls after 10s
  // without mouse movement, in every background mode. The expanded FAB menu is
  // exempt — fading it out would also swallow its clicks.
  useEffect(() => {
    if (showControls) {
      setUiIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      setUiIdle(false);
      timer = setTimeout(() => setUiIdle(true), 10000);
    };
    arm();
    window.addEventListener('mousemove', arm);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', arm);
    };
  }, [showControls]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  // Rebuilding the map costs a style + tile reload, so once it has been opened it
  // stays mounted and is merely hidden while another view is active.
  useEffect(() => {
    if (mapMode) setMapMounted(true);
  }, [mapMode]);

  // Re-evaluate staleness every second even when no WS messages arrive (e.g. debug mode)
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-collapse the expanded FAB menu after 10s
  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 10000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const stations = useMemo(() => {
    const allStations = Array.from(seismicDataMap.values());

    const filtered = stationFilter
      ? allStations.filter((s) => s.type === stationFilter)
      : ignoreStale
        ? allStations
        : allStations.filter((s) => Date.now() - s.lastPgaChangeAt < HIDE_AFTER_MS);

    const visible = soloMode
      ? filtered.filter((s) => soloStations.includes(s.type))
      : filtered;

    return visible.sort((a, b) => a.region.localeCompare(b.region, 'zh'));
  }, [seismicDataMap, stationFilter, ignoreStale, soloMode, soloStations, tick]);

  // Shindo sort applies only to the PiP window, never the main grid
  const pipStations = useMemo(() => {
    if (!sortByShindo) return stations;
    return [...stations].sort(
      (a, b) =>
        Number(b.CalcShindo) - Number(a.CalcShindo) ||
        a.region.localeCompare(b.region, 'zh')
    );
  }, [stations, sortByShindo]);

  const selectedStationData = useMemo(() => {
    if (!selectedStation) return null;
    return seismicDataMap.get(selectedStation) || null;
  }, [selectedStation, seismicDataMap]);

  const bgClass =
    background === 'wolfx'
      ? 'bg-wolfx'
      : background === 'green-black'
        ? 'bg-green'
        : background === 'black'
          ? 'bg-black'
          : 'bg-white';

  return (
    <main className={`app-container ${bgClass}`} data-theme={theme}>
      {/* Wolfx R2 wallpaper layer */}
      {background === 'wolfx' && (
        <div
          className="wallpaper-layer"
          style={{
            backgroundImage: `url(${wallpaperUrl})`,
            filter: wallpaperBlur ? 'blur(24px)' : 'none',
          }}
        />
      )}

      {/* Top-pinned view mode switch */}
      <ViewModeToggle idle={uiIdle} />

      {/* Floating Controls */}
      <div className={`controls-fab ${uiIdle ? 'ui-idle' : ''}`}>
        <button
          className="fab-btn fab-primary"
          onClick={() => setShowControls(!showControls)}
        >
          {showControls ? '✕' : '☰'}
        </button>

        <div className={`fab-menu ${showControls ? 'expanded' : ''}`}>
          <button className="fab-btn fab-secondary" onClick={toggleSettings} title={t('nav.settings')}>
            <Settings size={20} />
          </button>
          <button
            className={`fab-btn fab-secondary ${pipWindow ? 'fab-active' : ''}`}
            onClick={togglePip}
            disabled={!pipSupported}
            title={pipSupported ? t('nav.pipMode') : `${t('nav.pipMode')} (${t('nav.pipUnsupported')})`}
          >
            <PictureInPicture2 size={20} />
          </button>
          <button className="fab-btn fab-secondary" onClick={toggleTheme} title={t('nav.toggleTheme')}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Map view: mounted on first visit, then only hidden so it keeps its state */}
      {mapMounted && (
        <MapOverview
          stations={stations}
          onSelect={setSelectedStation}
          hidden={!mapMode}
          idle={uiIdle}
        />
      )}

      {/* Station Grid */}
      {!mapMode &&
        (stations.length > 0 ? (
          <div className={miniMode ? 'station-grid-mini' : 'station-grid'}>
            {stations.map((station) =>
              miniMode ? (
                <MiniStationCard
                  key={station.type}
                  data={station}
                  onClick={() => setSelectedStation(station.type)}
                />
              ) : (
                <StationCard
                  key={station.type}
                  data={station}
                  onClick={() => setSelectedStation(station.type)}
                />
              )
            )}
          </div>
        ) : (
          <div className="empty-state">
            <Activity size={48} strokeWidth={1} />
            <p>{t('status.noStations')}</p>
            <p className="empty-hint">{t('status.noStationsHint')}</p>
          </div>
        ))}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={toggleSettings} />}

      {/* Station Detail Modal */}
      <StationDetailModal
        station={selectedStationData}
        onClose={() => setSelectedStation(null)}
      />

      {/* Picture-in-Picture window */}
      <ErrorBoundary resetKey={pipRestartToken}>
        <PipBridge
          pipWindow={pipWindow}
          restartToken={pipRestartToken}
          stations={pipStations}
          background={background}
          theme={theme}
          onRestart={restartPip}
        />
      </ErrorBoundary>

      {/* Toast Notification */}
      <Toast />

      {/* Splash Screen */}
      <SplashScreen />
    </main>
  );
}
