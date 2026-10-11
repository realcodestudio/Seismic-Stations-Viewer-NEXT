'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { X, RefreshCw, Wifi, Palette, Eye, Bug, Play, Globe, ListFilter, ChevronDown, Wrench, Github, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import pkg from '../../package.json';
import { useAppStore } from '@/src/store/appStore';
import type { Locale } from '@/src/store/appStore';
import { useSeismicStore } from '@/src/store/seismicStore';
import type { BackgroundType, SeismicData, DisplaySettings } from '@/src/types/seismic';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useIsDark } from '@/src/hooks/useIsDark';
import styles from './SettingsPanel.module.css';

const APP_VERSION: string = pkg.version;
// Replace with the project's GitHub repository URL
const GITHUB_REPO_URL = 'https://github.com/realcodestudio/Seismic-Stations-Viewer-NEXT';
const DEFAULT_WS_URL = 'wss://seisjs.wolfx.jp/all_seis';

interface SettingsPanelProps {
  onClose: () => void;
}

function SettingsGroup({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.group}>
      <button type="button" className={styles.groupHeader} onClick={() => setOpen((o) => !o)}>
        <Icon size={16} />
        <span className={styles.groupTitle}>{title}</span>
        <ChevronDown size={18} className={`${styles.groupChevron} ${open ? styles.groupChevronOpen : ''}`} />
      </button>
      {open && <div className={styles.groupBody}>{children}</div>}
    </div>
  );
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const background = useAppStore((s) => s.background);
  const setBackground = useAppStore((s) => s.setBackground);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const displaySettings = useAppStore((s) => s.displaySettings);
  const updateDisplaySettings = useAppStore((s) => s.updateDisplaySettings);
  const websocketUrl = useAppStore((s) => s.websocketUrl);
  const setWebsocketUrl = useAppStore((s) => s.setWebsocketUrl);
  const showToast = useAppStore((s) => s.showToast);
  const debugMode = useAppStore((s) => s.debugMode);
  const setDebugMode = useAppStore((s) => s.setDebugMode);
  const ignoreStale = useAppStore((s) => s.ignoreStale);
  const setIgnoreStale = useAppStore((s) => s.setIgnoreStale);
  const soloMode = useAppStore((s) => s.soloMode);
  const setSoloMode = useAppStore((s) => s.setSoloMode);
  const soloStations = useAppStore((s) => s.soloStations);
  const toggleSoloStation = useAppStore((s) => s.toggleSoloStation);
  const miniMode = useAppStore((s) => s.miniMode);
  const wallpaperBlur = useAppStore((s) => s.wallpaperBlur);
  const setWallpaperBlur = useAppStore((s) => s.setWallpaperBlur);
  const cardOpacity = useAppStore((s) => s.cardOpacity);
  const setCardOpacity = useAppStore((s) => s.setCardOpacity);
  const refreshWallpaper = useAppStore((s) => s.refreshWallpaper);
  const seismicDataMap = useSeismicStore((s) => s.seismicDataMap);
  const updateSeismicData = useSeismicStore((s) => s.updateSeismicData);
  const clearSeismicData = useSeismicStore((s) => s.clearSeismicData);

  const [wsInput, setWsInput] = useState(websocketUrl);
  const [debugJson, setDebugJson] = useState('');
  const [debugError, setDebugError] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [wsCheck, setWsCheck] = useState<{ url: string; status: 'testing' | 'ok' | 'fail' } | null>(null);
  const testSocketRef = useRef<WebSocket | null>(null);
  const testTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Persisted store values rehydrate after this panel mounts, so sync inputs from them
  useEffect(() => {
    setWsInput(websocketUrl);
  }, [websocketUrl]);

  const stopTest = useCallback(() => {
    clearTimeout(testTimerRef.current);
    const sock = testSocketRef.current;
    if (sock) {
      testSocketRef.current = null;
      sock.onopen = null;
      sock.onerror = null;
      sock.close();
    }
  }, []);

  useEffect(() => stopTest, [stopTest]);

  const startWsCheck = () => {
    const url = wsInput.trim();
    if (!/^wss?:\/\/\S+$/i.test(url)) {
      showToast('settings.toastWsInvalid');
      return;
    }
    stopTest();
    setWsCheck({ url, status: 'testing' });
    let sock: WebSocket;
    try {
      sock = new WebSocket(url);
    } catch {
      setWsCheck({ url, status: 'fail' });
      return;
    }
    testSocketRef.current = sock;
    testTimerRef.current = setTimeout(() => {
      setWsCheck((prev) => (prev?.status === 'testing' ? { ...prev, status: 'fail' } : prev));
      stopTest();
    }, 6000);
    sock.onopen = () => {
      setWsCheck((prev) => (prev ? { ...prev, status: 'ok' } : prev));
      stopTest();
    };
    sock.onerror = () => {
      setWsCheck((prev) => (prev ? { ...prev, status: 'fail' } : prev));
      stopTest();
    };
  };

  const confirmWsSave = () => {
    if (!wsCheck) return;
    setWebsocketUrl(wsCheck.url);
    showToast('settings.toastWsSaved');
    stopTest();
    setWsCheck(null);
  };

  const cancelWsCheck = () => {
    stopTest();
    setWsCheck(null);
  };

  const lastDebugJsonRef = useRef('');

  const parseAndLoad = useCallback((json: string) => {
    setDebugError('');
    const hadContent = lastDebugJsonRef.current.trim().length > 0;
    lastDebugJsonRef.current = json;
    if (!json.trim()) {
      // Empty input must not leave stale debug stations behind
      if (hadContent || debugMode) {
        clearSeismicData();
        setDebugMode(false);
      }
      return;
    }
    try {
      let cleaned = json;
      cleaned = cleaned.replace(/\/\/.*$/gm, '');
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
      cleaned = cleaned.replace(/'/g, '"');
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace !== -1) {
        let depth = 0;
        let endIndex = firstBrace;
        for (let i = firstBrace; i < cleaned.length; i++) {
          if (cleaned[i] === '{') depth++;
          else if (cleaned[i] === '}') {
            depth--;
            if (depth === 0) {
              endIndex = i;
              break;
            }
          }
        }
        cleaned = cleaned.substring(firstBrace, endIndex + 1);
      }
      cleaned = cleaned.trim();

      const data = JSON.parse(cleaned);
      if (!data || typeof data.PGA === 'undefined') {
        setDebugError(t('settings.missingPGA'));
        return;
      }
      if (!data.type) {
        setDebugError(t('settings.missingType'));
        return;
      }
      clearSeismicData();
      updateSeismicData(data as SeismicData);
      setDebugMode(true);
    } catch (err) {
      setDebugError(t('settings.parseError').replace('{error}', err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [clearSeismicData, updateSeismicData, setDebugMode, debugMode]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      parseAndLoad(debugJson);
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [debugJson, parseAndLoad]);

  const allStations = useMemo(
    () =>
      Array.from(seismicDataMap.values()).sort((a, b) =>
        a.region.localeCompare(b.region, 'zh')
      ),
    [seismicDataMap]
  );

  const bgOptions: { value: BackgroundType; label: string }[] = [
    { value: 'white', label: t('settings.bgWhite') },
    { value: 'black', label: t('settings.bgBlack') },
    { value: 'wolfx', label: t('settings.bgWolfx') },
    { value: 'green-black', label: t('settings.bgGreen') },
  ];

  const localeOptions: { value: Locale; label: string; flag: string }[] = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨' },
    { value: 'zh-TW', label: '繁體中文', flag: '🇼' },
    { value: 'en', label: 'English', flag: '🇸' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  const resumeLive = () => {
    setDebugMode(false);
    setDebugJson('');
    setDebugError('');
  };

  const toggleDisplay = (key: keyof DisplaySettings) => {
    if (miniMode) {
      showToast('settings.toastMiniDisplay');
      return;
    }
    const realTimeKeys: (keyof DisplaySettings)[] = ['realTimeJMA', 'realTimeCSIS', 'longPeriod'];
    if (realTimeKeys.includes(key) && displaySettings[key]
      && realTimeKeys.filter((k) => displaySettings[k]).length <= 1) {
      showToast('settings.toastBadgeRequired');
      return;
    }
    updateDisplaySettings({ [key]: !displaySettings[key] });
  };

  const sampleData = {
    type: "debug-station-001",
    region: "Debug Test Station",
    latitude: 35.6762,
    longitude: 139.6503,
    version: "1.0",
    PGA: 125.5,
    Max_PGA: 150.0,
    PGA_EW: 100.0,
    Max_PGA_EW: 120.0,
    PGA_NS: 80.0,
    Max_PGA_NS: 100.0,
    PGA_UD: 60.0,
    Max_PGA_UD: 80.0,
    PGV: 50.0,
    Max_PGV: 60.0,
    PGV_EW: 40.0,
    Max_PGV_EW: 50.0,
    PGV_NS: 35.0,
    Max_PGV_NS: 45.0,
    PGV_UD: 30.0,
    Max_PGV_UD: 40.0,
    PGD: 10.0,
    Max_PGD: 15.0,
    PGD_EW: 8.0,
    Max_PGD_EW: 12.0,
    PGD_NS: 7.0,
    Max_PGD_NS: 10.0,
    PGD_UD: 5.0,
    Max_PGD_UD: 8.0,
    Shindo: "5強",
    Max_Shindo: "6弱",
    CalcShindo: 5.2,
    Max_CalcShindo: 5.8,
    Intensity: "8",
    Max_Intensity: "9",
    LPGM: 3,
    Max_LPGM: 4,
    Sva30: 150.0,
    Max_Sva30: 200.0,
    is_desktop: false,
    High_Precision: true,
    error_code: [],
    update_at: new Date().toISOString(),
    create_at: new Date().toISOString(),
  };

  return (
    <div className={`${styles.panel} ${styles.show}`}>
      <div className={styles.header}>
        <h3>{t('settings.title')}</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.content}>
        <SettingsGroup icon={Palette} title={t('settings.groupAppearance')} defaultOpen>
        {/* Theme */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Palette size={16} />
            {t('settings.theme')}
          </label>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.optionBtn} ${!isDark ? styles.active : ''}`}
              onClick={() => { if (isDark) toggleTheme(); }}
            >
              {t('settings.light')}
            </button>
            <button
              className={`${styles.optionBtn} ${isDark ? styles.active : ''}`}
              onClick={() => { if (!isDark) toggleTheme(); }}
            >
              {t('settings.dark')}
            </button>
          </div>
        </section>

        {/* Background */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Palette size={16} />
            {t('settings.background')}
          </label>
          <div className={styles.buttonGroup}>
            {bgOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.optionBtn} ${background === opt.value ? styles.active : ''}`}
                onClick={() => setBackground(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {background === 'green-black' && (
            <div className={styles.opacityRow}>
              <label className={styles.sliderLabel}>
                {t('settings.cardOpacity')}
                <span className={styles.sliderValue}>{cardOpacity}%</span>
              </label>
              <input
                type="range"
                className={styles.range}
                min={20}
                max={100}
                step={5}
                value={cardOpacity}
                onChange={(e) => setCardOpacity(Number(e.target.value))}
              />
            </div>
          )}
          {background === 'wolfx' && (
            <div className={styles.wallpaperRow}>
              <div className={styles.alertRow}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={wallpaperBlur}
                    onChange={(e) => setWallpaperBlur(e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
                <span className={styles.switchLabel}>{t('settings.bgBlur')}</span>
              </div>
              <button className={styles.refreshBtn} onClick={refreshWallpaper}>
                <RefreshCw size={14} />
                {t('settings.refreshWallpaper')}
              </button>
            </div>
          )}
        </section>

        </SettingsGroup>

        <SettingsGroup icon={Globe} title={t('settings.groupLanguage')} defaultOpen>
        {/* Language */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Globe size={16} />
            Language
          </label>
          <div className={styles.buttonGroup}>
            {localeOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.optionBtn} ${locale === opt.value ? styles.active : ''}`}
                onClick={() => setLocale(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
        </SettingsGroup>

        <SettingsGroup icon={Eye} title={t('settings.groupDisplay')} defaultOpen>
        {/* Display Settings */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Eye size={16} />
            {t('settings.dataDisplay')}
          </label>
          <div className={styles.buttonGroup}>
            {([
              ['pga', 'display.pga'],
              ['measuredIntensity', 'display.calcShindo'],
              ['maxJMAShindo', 'display.maxShindo'],
              ['maxCSISIntensity', 'display.maxIntensity'],
            ] as const).map(([key, labelKey]) => (
              <button
                key={key}
                className={`${styles.optionBtn} ${displaySettings[key] ? styles.active : ''}`}
                onClick={() => toggleDisplay(key)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Real-time Display */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Eye size={16} />
            {t('settings.realTimeBadges')}
          </label>
          <div className={styles.buttonGroup}>
            {([
              ['realTimeJMA', 'display.jmaShindo'],
              ['realTimeCSIS', 'display.csisIntensity'],
              ['longPeriod', 'display.lpgm'],
            ] as const).map(([key, labelKey]) => (
              <button
                key={key}
                className={`${styles.optionBtn} ${displaySettings[key] ? styles.active : ''}`}
                onClick={() => toggleDisplay(key)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Solo Station Display */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <ListFilter size={16} />
            {t('settings.soloStations')}
          </label>
          <div className={styles.alertRow}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={soloMode}
                onChange={(e) => setSoloMode(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
            <span className={styles.switchLabel}>{t('settings.soloHint')}</span>
          </div>
          {soloMode && (
            <div className={styles.stationList}>
              {allStations.map((station) => (
                <label key={station.type} className={styles.stationItem}>
                  <input
                    type="checkbox"
                    checked={soloStations.includes(station.type)}
                    onChange={() => toggleSoloStation(station.type)}
                  />
                  <span className={styles.stationName}>{station.region}</span>
                  <span className={styles.stationUuid}>{station.type}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        </SettingsGroup>

        <SettingsGroup icon={Wrench} title={t('settings.groupAdvanced')}>
        {/* WebSocket */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Wifi size={16} />
            {t('settings.websocketUrl')}
          </label>
          <div className={styles.wsRow}>
            <input
              type="text"
              className={styles.input}
              value={wsInput}
              onChange={(e) => setWsInput(e.target.value)}
              placeholder={t('settings.wsPlaceholder')}
            />
            <button
              className={styles.saveBtn}
              onClick={startWsCheck}
            >
              {t('settings.save')}
            </button>
            <button
              className={styles.resetBtn}
              onClick={() => {
                setWsInput(DEFAULT_WS_URL);
                setWebsocketUrl(DEFAULT_WS_URL);
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </section>

        {/* Debug Section */}
        <section className={styles.section}>
          <label className={styles.sectionLabel}>
            <Bug size={16} />
            {t('settings.debug')}
          </label>
          {debugMode && (
            <div className={styles.debugStatus}>
              <span className={styles.debugStatusDot} />
              {t('settings.debugActive')}
            </div>
          )}
          <div className={styles.alertRow}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={ignoreStale}
                onChange={(e) => setIgnoreStale(e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
            <span className={styles.switchLabel}>{t('settings.ignoreNoResponse')}</span>
          </div>
          <textarea
            className={styles.debugTextarea}
            value={debugJson}
            onChange={(e) => { setDebugJson(e.target.value); setDebugError(''); }}
            placeholder={t('settings.jsonPlaceholder')}
            rows={6}
          />
          {debugError && <div className={styles.debugError}>{debugError}</div>}
          <div className={styles.debugActions}>
            {debugMode ? (
              <button className={styles.saveBtn} onClick={resumeLive}>
                <Wifi size={14} />
                {t('settings.resumeLive')}
              </button>
            ) : (
              <button
                className={styles.resetBtn}
                onClick={() => {
                  setDebugJson(JSON.stringify(sampleData, null, 2));
                  setDebugError('');
                }}
                title={t('settings.loadSample')}
              >
                {t('settings.sample')}
              </button>
            )}
          </div>
        </section>
        </SettingsGroup>

        <footer className={styles.footer}>
          <span className={styles.version}>v{APP_VERSION}</span>
          <a
            className={styles.repoLink}
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={14} />
            {t('settings.githubRepo')}
          </a>
        </footer>
      </div>

      {wsCheck && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h4 className={styles.dialogTitle}>{t('settings.wsCheckTitle')}</h4>
            <p className={styles.dialogUrl}>{wsCheck.url}</p>
            {wsCheck.url !== DEFAULT_WS_URL && (
              <p className={styles.dialogWarn}>{t('settings.wsCustomWarn')}</p>
            )}
            <p
              className={`${styles.dialogStatus} ${
                wsCheck.status === 'ok' ? styles.dialogOk : wsCheck.status === 'fail' ? styles.dialogFail : ''
              }`}
            >
              {wsCheck.status === 'testing' && <Loader2 size={14} className={styles.dialogSpin} />}
              {wsCheck.status === 'testing'
                ? t('settings.wsChecking')
                : wsCheck.status === 'ok'
                  ? t('settings.wsCheckOk')
                  : t('settings.wsCheckFail')}
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.resetBtn} onClick={cancelWsCheck}>
                {t('settings.wsCancel')}
              </button>
              <button
                className={styles.saveBtn}
                disabled={wsCheck.status === 'testing'}
                onClick={confirmWsSave}
              >
                {wsCheck.status === 'fail' ? t('settings.wsSaveAnyway') : t('settings.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
