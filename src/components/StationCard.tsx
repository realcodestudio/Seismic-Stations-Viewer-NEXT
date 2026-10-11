'use client';

import { useMemo, useEffect, useRef } from 'react';
import { MapPin, Info, TrendingUp, Calculator, BarChart3, Activity } from 'lucide-react';
import type { SeismicData } from '@/src/types/seismic';
import { useAppStore } from '@/src/store/appStore';
import { getShindoStyle, getIntensityStyle, getLPGMStyle, formatShindoDisplay } from '@/src/utils/intensityColors';
import { ScrollingText } from './ScrollingText';
import { drawWaveform } from '@/src/utils/waveform';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useIsDark } from '@/src/hooks/useIsDark';
import styles from './StationCard.module.css';

interface StationCardProps {
  data: SeismicData;
  onClick: () => void;
}

export function StationCard({ data, onClick }: StationCardProps) {
  const { t } = useTranslation();
  const displaySettings = useAppStore((s) => s.displaySettings);
  const showWaveformMode = useAppStore((s) => s.showWaveformMode);
  const ignoreStale = useAppStore((s) => s.ignoreStale);
  const isDark = useIsDark();

  const isStale = !ignoreStale && Date.now() - data.lastPgaChangeAt > 25000;

  const updateTime = useMemo(() => {
    try {
      const d = new Date(data.update_at);
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }, [data.update_at]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pgaBufferRef = useRef<{ time: number; value: number }[]>([]);
  const lastPgaRef = useRef<number | null>(null);
  const lastPointRef = useRef(0);
  const lastPushAtRef = useRef(0);

  // Background tabs throttle canvas redraws while data keeps arriving;
  // replaying that backlog looks like fast-forwarding, so restart fresh on return.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        pgaBufferRef.current = [];
        lastPgaRef.current = null;
        lastPointRef.current = 0;
        lastPushAtRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    if (!showWaveformMode) {
      pgaBufferRef.current = [];
      lastPgaRef.current = null;
      return;
    }

    // Update PGA buffer with delta values
    const currentPga = data.PGA ?? 0;
    const parsed = data.update_at ? Date.parse(data.update_at) : NaN;
    const pointTime = Number.isFinite(parsed) ? parsed : Date.now();
    const arrivedAt = Date.now();
    // Dedupe by server timestamp and gate by local arrival time, so a burst
    // of backlog messages delivered after tab wake contributes at most one point
    if (lastPgaRef.current !== null && pointTime !== lastPointRef.current && arrivedAt - lastPushAtRef.current >= 800) {
      const delta = currentPga - lastPgaRef.current;
      pgaBufferRef.current.push({ time: pointTime, value: delta });
      if (pgaBufferRef.current.length > 60) {
        pgaBufferRef.current.shift();
      }
      lastPushAtRef.current = arrivedAt;
    }
    lastPgaRef.current = currentPga;
    lastPointRef.current = pointTime;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let raf = 0;
    let lastFrame = 0;
    const render = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        drawWaveform(canvas, pgaBufferRef.current, isDark, rect.width, rect.height);
      }
    };

    // rAF pauses while the tab is hidden, so no backlog replays on return
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (ts - lastFrame < 250) return;
      lastFrame = ts;
      render();
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [showWaveformMode, data.PGA, data.update_at, isDark]);

  return (
    <div
      className={`${styles.card} ${isStale ? styles.stale : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MapPin size={18} className={styles.headerIcon} />
          <ScrollingText
            text={data.region}
            className={styles.region}
            innerClassName={styles.regionText}
          />
        </div>
        <span className={styles.time}>{updateTime}</span>
      </div>

      {showWaveformMode ? (
        <>
          <div className={styles.waveformRow}>
            <div
              className={styles.metricBox}
              style={{
                backgroundColor: getShindoStyle(data.Shindo || '0', isDark).backgroundColor,
                borderColor: getShindoStyle(data.Shindo || '0', isDark).borderColor,
              }}
            >
              <span
                className={styles.metricLabel}
                style={{ color: getShindoStyle(data.Shindo || '0', isDark).color }}
              >
                {t('card.jma')}
              </span>
              <span
                className={styles.metricValue}
                style={{ color: getShindoStyle(data.Shindo || '0', isDark).color }}
              >
                {formatShindoDisplay(data.Shindo)}
              </span>
            </div>
            <div
              className={styles.metricBox}
              style={{
                backgroundColor: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).backgroundColor,
                borderColor: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).borderColor,
              }}
            >
              <span
                className={styles.metricLabel}
                style={{ color: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).color }}
              >
                {t('card.csis')}
              </span>
              <span
                className={styles.metricValue}
                style={{ color: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).color }}
              >
                {Math.round(Number(data.Intensity) || 0)}
              </span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>{t('card.pga')}</span>
              <span className={styles.metricValue}>{(data.PGA ?? 0).toFixed(3)}</span>
            </div>
          </div>
          <div className={styles.waveformArea}>
            <div className={styles.waveformHeader}>
              <Activity size={18} className={styles.waveformIcon} />
              <span className={styles.waveformTitle}>{t('card.pgaWaveform')}</span>
            </div>
            <div className={styles.waveformCanvasContainer} ref={containerRef}>
              <canvas ref={canvasRef} className={styles.waveformCanvas} />
            </div>
          </div>
        </>
      ) : (
        <div className={styles.dataGrid}>
          {/* Top row: 3 real-time badges */}
          {(displaySettings.realTimeJMA || displaySettings.realTimeCSIS || displaySettings.longPeriod) && (
          <div className={styles.topRow}>
            {displaySettings.realTimeJMA && (
              <div
                className={styles.metricBox}
                style={{
                  backgroundColor: getShindoStyle(data.Shindo || '0', isDark).backgroundColor,
                  borderColor: getShindoStyle(data.Shindo || '0', isDark).borderColor,
                }}
              >
                <span
                  className={styles.metricLabel}
                  style={{ color: getShindoStyle(data.Shindo || '0', isDark).color }}
                >
                  {t('card.realTimeJMA')}
                </span>
                <span
                  className={styles.metricValue}
                  style={{ color: getShindoStyle(data.Shindo || '0', isDark).color }}
                >
                  {formatShindoDisplay(data.Shindo)}
                </span>
              </div>
            )}
            {displaySettings.realTimeCSIS && (
              <div
                className={styles.metricBox}
                style={{
                  backgroundColor: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).backgroundColor,
                  borderColor: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).borderColor,
                }}
              >
                <span
                  className={styles.metricLabel}
                  style={{ color: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).color }}
                >
                  {t('card.realTimeCSIS')}
                </span>
                <span
                  className={styles.metricValue}
                  style={{ color: getIntensityStyle(String(Math.round(Number(data.Intensity) || 0)), isDark).color }}
                >
                  {Math.round(Number(data.Intensity) || 0)}
                </span>
              </div>
            )}
            {displaySettings.longPeriod && (
              <div
                className={styles.metricBox}
                style={{
                  backgroundColor: getLPGMStyle(String(data.LPGM || 0), isDark).backgroundColor,
                  borderColor: getLPGMStyle(String(data.LPGM || 0), isDark).borderColor,
                }}
              >
                <span
                  className={styles.metricLabel}
                  style={{ color: getLPGMStyle(String(data.LPGM || 0), isDark).color }}
                >
                  {t('card.realTimeLPGM')}
                </span>
                <span
                  className={styles.metricValue}
                  style={{ color: getLPGMStyle(String(data.LPGM || 0), isDark).color }}
                >
                  {data.LPGM}
                </span>
              </div>
            )}
          </div>
          )}

          {/* Middle row: PGA + CalcShindo */}
          {(displaySettings.pga || displaySettings.measuredIntensity) && (
          <div className={styles.bottomRow}>
            {displaySettings.pga && (
              <div className={styles.dataBox}>
                <div className={styles.dataBoxHeader}>
                  <TrendingUp size={13} className={styles.dataBoxIcon} />
                  <span className={styles.dataBoxLabel}>{t('card.combinedPGA')}</span>
                </div>
                <span className={styles.dataBoxValue}>{(data.PGA ?? 0).toFixed(3)}</span>
              </div>
            )}
            {displaySettings.measuredIntensity && (
              <div className={styles.dataBox}>
                <div className={styles.dataBoxHeader}>
                  <Calculator size={13} className={styles.dataBoxIcon} />
                  <span className={styles.dataBoxLabel}>{t('card.calcJMAIntensity')}</span>
                </div>
                <span className={styles.dataBoxValue}>{(data.CalcShindo ?? 0).toFixed(3)}</span>
              </div>
            )}
          </div>
          )}

          {/* Bottom row: Max values */}
          {(displaySettings.maxJMAShindo || displaySettings.maxCSISIntensity) && (
          <div className={styles.bottomRow}>
            {displaySettings.maxJMAShindo && (
              <div className={styles.dataBox}>
                <div className={styles.dataBoxHeader}>
                  <BarChart3 size={13} className={styles.dataBoxIcon} />
                  <span className={styles.dataBoxLabel}>
                    {t('card.maxJMAIntensity')}
                  </span>
                </div>
                <span className={styles.dataBoxValue}>
                  {formatShindoDisplay(data.Max_Shindo)}
                </span>
              </div>
            )}
            {displaySettings.maxCSISIntensity && (
              <div className={styles.dataBox}>
                <div className={styles.dataBoxHeader}>
                  <BarChart3 size={13} className={styles.dataBoxIcon} />
                  <span className={styles.dataBoxLabel}>
                    {t('card.maxCSISIntensity')}
                  </span>
                </div>
                <span className={styles.dataBoxValue}>
                  {Math.round(Number(data.Max_Intensity) || 0)}
                </span>
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* Info button */}
      <div className={styles.infoBtn} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <Info size={14} />
      </div>

      {isStale && <div className={styles.staleHint}>{t('card.noResponse')}</div>}
    </div>
  );
}
