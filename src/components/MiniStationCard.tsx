'use client';

import type { SeismicData } from '@/src/types/seismic';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAppStore } from '@/src/store/appStore';
import { getShindoStyle, formatShindoDisplay } from '@/src/utils/intensityColors';
import { ScrollingText } from './ScrollingText';
import styles from './MiniStationCard.module.css';

interface MiniStationCardProps {
  data: SeismicData;
  onClick?: () => void;
  /** Overrides the Minimode theme; the PiP window passes its own setting. */
  darkMode?: boolean;
}

const BAR_BLUE = '#4a7dff';
const BAR_GREEN = '#2ecc71';
const BAR_YELLOW = '#f1c40f';
const BAR_RED = '#e74c3c';

function shindoBarColor(v: number): string {
  if (!Number.isFinite(v) || v < 0) return BAR_BLUE;
  if (v < 3) return BAR_GREEN;
  if (v < 5) return BAR_YELLOW;
  return BAR_RED;
}

function pgaBarColor(v: number): string {
  if (!Number.isFinite(v) || v < 5) return BAR_BLUE;
  if (v < 10) return BAR_GREEN;
  if (v < 20) return BAR_YELLOW;
  return BAR_RED;
}

export function MiniStationCard({ data, onClick, darkMode }: MiniStationCardProps) {
  const { t } = useTranslation();
  const miniTheme = useAppStore((s) => s.miniTheme);
  const isDark = darkMode ?? miniTheme === 'dark';
  const shindoStyle = getShindoStyle(data.Shindo || '0', isDark);
  const shindoBar = shindoBarColor(Number(data.CalcShindo));
  const pgaBar = pgaBarColor(Number(data.PGA));

  return (
    <button
      className={`${styles.chip} ${isDark ? '' : styles.light} ${onClick ? '' : styles.static}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      aria-disabled={!onClick}
    >
      <div className={styles.info}>
        <ScrollingText
          text={data.region}
          className={styles.name}
          innerClassName={styles.nameText}
        />
        <div className={styles.metrics}>
          <span className={styles.metric}>
            {t('mini.shindo')}
            <span className={styles.shindoValue} style={{ borderBottomColor: shindoBar }}>
              {Number(data.CalcShindo).toFixed(1)}
            </span>
          </span>
          <span className={styles.metric}>
            {t('mini.pga')}
            <span className={styles.pgaValue} style={{ borderBottomColor: pgaBar }}>
              {Number(data.PGA).toFixed(2)}
            </span>
          </span>
        </div>
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
    </button>
  );
}
