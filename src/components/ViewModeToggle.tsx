'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGrid, Activity, Minimize2, Map as MapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '@/src/store/appStore';
import type { ViewMode } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import styles from './ViewModeToggle.module.css';

export function ViewModeToggle({ idle }: { idle?: boolean }) {
  const { t } = useTranslation();
  const miniMode = useAppStore((s) => s.miniMode);
  const showWaveformMode = useAppStore((s) => s.showWaveformMode);
  const mapMode = useAppStore((s) => s.mapMode);
  const setViewMode = useAppStore((s) => s.setViewMode);

  const current: ViewMode = mapMode
    ? 'map'
    : miniMode
      ? 'mini'
      : showWaveformMode
        ? 'waveform'
        : 'stations';

  const options: { value: ViewMode; label: string; icon: LucideIcon }[] = [
    { value: 'map', label: t('nav.viewOverview'), icon: MapIcon },
    { value: 'stations', label: t('nav.viewStations'), icon: LayoutGrid },
    { value: 'waveform', label: t('nav.viewWaveform'), icon: Activity },
    { value: 'mini', label: t('nav.viewMini'), icon: Minimize2 },
  ];

  const segRefs = useRef<Partial<Record<ViewMode, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [ready, setReady] = useState(false);
  const labelsKey = options.map((o) => o.label).join('|');

  // Track the active segment's box so the highlight can slide to it.
  const measure = useCallback(() => {
    const el = segRefs.current[current];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }, [current]);

  useEffect(() => {
    measure();
  }, [measure, labelsKey]);

  // Crossing the icon-only breakpoint changes every segment's box, so re-measure
  // on resize; otherwise the highlight keeps the old width until the next switch.
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Enable transitions only after the first measure, so it doesn't slide in from 0 on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`${styles.wrap} ${idle ? styles.wrapIdle : ''}`}>
      <div className={styles.toggle} role="tablist" aria-label={t('nav.viewMode')}>
        <span
          aria-hidden
          className={`${styles.indicator} ${ready ? styles.indicatorAnim : ''}`}
          style={{
            width: indicator.width,
            height: indicator.height,
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            ref={(el) => {
              segRefs.current[opt.value] = el;
            }}
            type="button"
            role="tab"
            aria-selected={current === opt.value}
            aria-label={opt.label}
            title={opt.label}
            className={`${styles.seg} ${current === opt.value ? styles.active : ''}`}
            onClick={() => setViewMode(opt.value)}
          >
            <opt.icon size={16} />
            <span className={styles.label}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
