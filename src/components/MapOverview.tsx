'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Activity, Maximize, Minus, Plus } from 'lucide-react';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import { StationCard } from './StationCard';
import { PipShindoRow } from './PipShindoRow';
import type { SeismicData } from '@/src/types/seismic';
import styles from './MapOverview.module.css';

// Deployed builds fetch the token from a Pages Function so the key lives in a
// secret, not in the repo or the static bundle. Keep the local dev token in
// .env.development.local, never .env.local — next build reads that too and
// would bake the key straight back into out/.
const DEV_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
const TOKEN_ENDPOINT = '/api/mapbox-token';
// Mapbox Standard carries both appearances in one style
const MAP_STYLE = 'mapbox://styles/mapbox/standard';
// Home view; the reset control under the zoom buttons flies back to it
const DEFAULT_CENTER: [number, number] = [104.5, 35.5];
const DEFAULT_ZOOM = 2;

function applyMapTheme(map: mapboxgl.Map, theme: string) {
  // Standard expresses light/dark as an illumination preset, not a color theme
  map.setConfigProperty('basemap', 'lightPreset', theme === 'dark' ? 'night' : 'day');
}

// CalcShindo tier colors, same thresholds as the mini-mode underline bars
function shindoDotColor(v: number): string {
  if (!Number.isFinite(v) || v < 0) return '#4a7dff';
  if (v < 3) return '#2ecc71';
  if (v < 5) return '#f1c40f';
  return '#e74c3c';
}

interface StationMarker {
  marker: mapboxgl.Marker;
  dot: HTMLDivElement;
  name: HTMLSpanElement;
  shindoLabel: HTMLSpanElement;
  shindo: HTMLSpanElement;
  pgaLabel: HTMLSpanElement;
  pga: HTMLSpanElement;
}

interface MapOverviewProps {
  stations: SeismicData[];
  onSelect: (type: string) => void;
  /** Kept mounted while another view is shown so the map isn't rebuilt on every switch. */
  hidden?: boolean;
  /** OBS transparent mode fades the chrome out while the mouse is idle. */
  idle?: boolean;
}

export function MapOverview({ stations, onSelect, hidden, idle }: MapOverviewProps) {
  const theme = useAppStore((s) => s.theme);
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, StationMarker>>(new Map());
  const themeRef = useRef(theme);
  // null = still fetching, '' = unavailable, otherwise the access token
  const [token, setToken] = useState<string | null>(DEV_TOKEN || null);

  useEffect(() => {
    if (token !== null) return;
    let alive = true;
    fetch(TOKEN_ENDPOINT)
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => alive && setToken(text.trim()))
      .catch(() => alive && setToken(''));
    return () => {
      alive = false;
    };
  }, [token]);

  // Top 5 by shindo; same tie-break as the PiP ranking list
  const ranking = useMemo(
    () =>
      [...stations]
        .sort(
          (a, b) =>
            Number(b.CalcShindo) - Number(a.CalcShindo) ||
            a.region.localeCompare(b.region, 'zh')
        )
        .slice(0, 5),
    [stations]
  );

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: 12,
      // Set with the style so the first frame already matches the theme
      config: { basemap: { lightPreset: theme === 'dark' ? 'night' : 'day' } },
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('load', () => applyMapTheme(map, themeRef.current));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    themeRef.current = theme;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) applyMapTheme(map, theme);
  }, [theme]);

  // display:none gives the container a 0x0 size and mapbox only tracks window
  // resizes, so tell it the real size again when the view comes back. The class
  // change is already committed here, so the layout read inside resize() is fresh.
  useEffect(() => {
    if (hidden) return;
    mapRef.current?.resize();
  }, [hidden]);

  // Sync one marker per station: create/update/remove against the live list
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const existing = markersRef.current;
    const seen = new Set<string>();

    for (const data of stations) {
      seen.add(data.type);
      let entry = existing.get(data.type);
      if (!entry) {
        const el = document.createElement('div');
        el.className = styles.marker;
        const dot = document.createElement('div');
        dot.className = styles.dot;
        const tip = document.createElement('div');
        tip.className = styles.tip;
        const name = document.createElement('div');
        name.className = styles.tipName;
        const mkRow = (label: HTMLSpanElement, value: HTMLSpanElement) => {
          const row = document.createElement('div');
          row.className = styles.tipRow;
          row.append(label, value);
          return row;
        };
        const shindoLabel = document.createElement('span');
        const shindo = document.createElement('span');
        shindo.className = styles.tipVal;
        const pgaLabel = document.createElement('span');
        const pga = document.createElement('span');
        pga.className = styles.tipVal;
        tip.append(name, mkRow(shindoLabel, shindo), mkRow(pgaLabel, pga));
        el.append(dot, tip);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([data.longitude, data.latitude])
          .addTo(map);
        entry = { marker, dot, name, shindo, shindoLabel, pga, pgaLabel };
        existing.set(data.type, entry);
      }
      entry.marker.setLngLat([data.longitude, data.latitude]);
      entry.dot.style.background = shindoDotColor(Number(data.CalcShindo));
      entry.name.textContent = data.region;
      entry.shindoLabel.textContent = t('display.calcShindo');
      entry.shindo.textContent = Number(data.CalcShindo ?? 0).toFixed(1);
      entry.pgaLabel.textContent = t('display.pga');
      entry.pga.textContent = `${Number(data.PGA ?? 0).toFixed(2)} gal`;
    }

    for (const [type, entry] of existing) {
      if (!seen.has(type)) {
        entry.marker.remove();
        existing.delete(type);
      }
    }
  }, [stations, t]);

  return (
    <div className={`${styles.wrap} ${hidden ? styles.wrapHidden : ''}`}>
      <div className={styles.mapPanel}>
        {token === null ? null : token ? (
          <div ref={containerRef} className={styles.mapCanvas} />
        ) : (
          <div className={styles.mapFallback}>
            未取到 Mapbox Token：线上请在 Pages 项目里设置 MAPBOX_TOKEN secret，本地开发则在
            .env.local 中设置 NEXT_PUBLIC_MAPBOX_TOKEN 后重启开发服务
          </div>
        )}
        {token && (
          <div className={`${styles.mapCtrl} ${idle ? styles.mapCtrlIdle : ''}`}>
            <button
              type="button"
              className={styles.ctrlBtn}
              title={t('display.zoomIn')}
              aria-label={t('display.zoomIn')}
              onClick={() => mapRef.current?.zoomIn()}
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className={styles.ctrlBtn}
              title={t('display.zoomOut')}
              aria-label={t('display.zoomOut')}
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus size={18} strokeWidth={2.2} />
            </button>
            <span className={styles.ctrlDivider} />
            <button
              type="button"
              className={`${styles.ctrlBtn} ${styles.ctrlReset}`}
              title={t('display.resetMapView')}
              aria-label={t('display.resetMapView')}
              onClick={() =>
                mapRef.current?.flyTo({
                  center: DEFAULT_CENTER,
                  zoom: DEFAULT_ZOOM,
                  curve: 1.4,
                  speed: 1.1,
                })
              }
            >
              <Maximize size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
        {token && stations.length > 0 && (
          <div className={styles.ranking}>
            <div className={styles.rankingTitle}>{t('display.liveShindoRanking')}</div>
            {ranking.map((station) => (
              <PipShindoRow key={station.type} data={station} darkMode={theme === 'dark'} />
            ))}
          </div>
        )}
      </div>
      <aside className={styles.sideCol}>
        {stations.length > 0 ? (
          stations.map((station) => (
            <StationCard
              key={station.type}
              data={station}
              onClick={() => onSelect(station.type)}
            />
          ))
        ) : (
          <div className={`empty-state ${styles.emptyFill}`}>
            <Activity size={48} strokeWidth={1} />
            <p>{t('status.noStations')}</p>
            <p className="empty-hint">{t('status.noStationsHint')}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
