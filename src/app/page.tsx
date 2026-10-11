'use client';

import { useState, useMemo, useEffect } from 'react';
import { Settings, Activity, Moon, Sun, Radio, Minimize2 } from 'lucide-react';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useSeismicStore } from '@/src/store/seismicStore';
import { useAppStore } from '@/src/store/appStore';
import { StationCard } from '@/src/components/StationCard';
import { MiniStationCard } from '@/src/components/MiniStationCard';
import { StationDetailModal } from '@/src/components/StationDetailModal';
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

  const seismicDataMap = useSeismicStore((s) => s.seismicDataMap);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const showSettings = useAppStore((s) => s.showSettings);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const showWaveformMode = useAppStore((s) => s.showWaveformMode);
  const toggleWaveformMode = useAppStore((s) => s.toggleWaveformMode);
  const stationFilter = useAppStore((s) => s.stationFilter);
  const soloMode = useAppStore((s) => s.soloMode);
  const soloStations = useAppStore((s) => s.soloStations);
  const ignoreStale = useAppStore((s) => s.ignoreStale);
  const miniMode = useAppStore((s) => s.miniMode);
  const toggleMiniMode = useAppStore((s) => s.toggleMiniMode);
  const wallpaperUrl = useAppStore((s) => s.wallpaperUrl);
  const wallpaperBlur = useAppStore((s) => s.wallpaperBlur);
  const cardOpacity = useAppStore((s) => s.cardOpacity);
  const background = useAppStore((s) => s.background);
  const locale = useAppStore((s) => s.locale);

  const isDark = theme === 'dark';

  // Settings live in localStorage; rehydrate after the first render so the
  // server HTML and the client's initial render both use store defaults.
  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle('bg-transparent', background === 'green-black');
    document.documentElement.style.setProperty(
      '--card-opacity',
      background === 'green-black' ? String(cardOpacity / 100) : '1'
    );
  }, [background, cardOpacity]);

  // Transparent (OBS) mode: hide FAB + status bar after 10s without mouse movement
  useEffect(() => {
    if (background !== 'green-black') {
      setUiIdle(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      setUiIdle(false);
      timer = setTimeout(() => setUiIdle(true), 10000);
    };
    arm();
    window.addEventListener('mousemove', arm);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', arm);
    };
  }, [background]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  // Re-evaluate staleness every second even when no WS messages arrive (e.g. debug mode)
  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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
            className={`fab-btn fab-secondary ${showWaveformMode ? 'fab-active' : ''}`}
            onClick={toggleWaveformMode}
            disabled={miniMode}
            title={t('nav.waveformMode')}
          >
            <Activity size={20} />
          </button>
          <button
            className={`fab-btn fab-secondary ${miniMode ? 'fab-active' : ''}`}
            onClick={toggleMiniMode}
            title={t('nav.miniMode')}
          >
            <Minimize2 size={20} />
          </button>
          <button className="fab-btn fab-secondary" onClick={toggleTheme} title={t('nav.toggleTheme')}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`status-bar ${uiIdle ? 'ui-idle' : ''}`}>
        <Radio size={14} className="status-dot" />
        <span className="status-text">
          {stations.length === 0 ? t('status.noStations') : `${stations.length} ${t('status.stationsActive')}`}
        </span>
      </div>

      {/* Station Grid */}
      {stations.length > 0 ? (
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
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={toggleSettings} />}

      {/* Station Detail Modal */}
      <StationDetailModal
        station={selectedStationData}
        onClose={() => setSelectedStation(null)}
      />

      {/* Toast Notification */}
      <Toast />

      {/* Splash Screen */}
      <SplashScreen />
    </main>
  );
}
