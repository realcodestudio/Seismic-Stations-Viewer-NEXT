'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SeismicData } from '@/src/types/seismic';
import { useAppStore } from '@/src/store/appStore';
import { getShindoStyle, formatShindoDisplay } from '@/src/utils/intensityColors';
import styles from './PipShindoRow.module.css';

interface PipShindoRowProps {
  data: SeismicData;
  /** Overrides the Minimode theme; the map overlay passes the app theme instead. */
  darkMode?: boolean;
}

export function PipShindoRow({ data, darkMode }: PipShindoRowProps) {
  const miniTheme = useAppStore((s) => s.miniTheme);
  const isDark = darkMode ?? miniTheme === 'dark';
  const shindoStyle = getShindoStyle(data.Shindo || '0', isDark);

  const nameRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const measure = () => {
      const inner = el.firstElementChild as HTMLElement | null;
      setOverflow(inner ? Math.max(0, inner.offsetWidth - el.clientWidth) : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [data.region]);

  // ~30px per second, clamped so short names don't crawl and long ones don't fly
  const marqueeSeconds = Math.min(14, Math.max(2.5, overflow / 30));

  return (
    <div className={`${styles.row} ${isDark ? '' : styles.light}`}>
      <div
        ref={nameRef}
        className={`${styles.name} ${overflow > 0 ? styles.nameScroll : ''}`}
        style={
          {
            '--marquee-shift': `-${overflow}px`,
            '--marquee-duration': `${marqueeSeconds}s`,
          } as CSSProperties
        }
      >
        <span className={styles.nameInner}>{data.region}</span>
      </div>
      <div
        className={styles.badge}
        style={{
          backgroundColor: shindoStyle.backgroundColor,
          borderColor: shindoStyle.borderColor,
          color: shindoStyle.color,
        }}
      >
        {formatShindoDisplay(data.Shindo)}
      </div>
    </div>
  );
}
