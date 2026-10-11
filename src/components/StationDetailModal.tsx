'use client';

import { useMemo, useState } from 'react';
import { X, MapPin, Globe, Tag, Waves, TrendingUp, AlertTriangle, Activity, Cpu, Clock, Copy, Check } from 'lucide-react';
import type { SeismicData } from '@/src/types/seismic';
import { useAppStore } from '@/src/store/appStore';
import { formatShindoDisplay } from '@/src/utils/intensityColors';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useIsDark } from '@/src/hooks/useIsDark';
import styles from './StationDetailModal.module.css';

interface StationDetailModalProps {
  station: SeismicData | null;
  onClose: () => void;
}

export function StationDetailModal({ station, onClose }: StationDetailModalProps) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const [showComponents, setShowComponents] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUUID = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-';
    if (key === 'Shindo' || key === 'Max_Shindo') {
      return formatShindoDisplay(String(value));
    }
    if (typeof value === 'number') {
      if (key === 'latitude' || key === 'longitude') return value.toFixed(1);
      if (['CalcShindo', 'Max_CalcShindo', 'Intensity', 'Max_Intensity'].includes(key))
        return value.toFixed(2);
      if (['LPGM', 'Max_LPGM'].includes(key)) return value.toFixed(0);
      return value.toFixed(6);
    }
    if (typeof value === 'boolean') return value ? t('boolean.yes') : t('boolean.no');
    if (typeof value === 'string' && value.includes('at')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  if (!station) return null;

  return (
    <div className={`${styles.overlay} ${styles.show}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{station.region}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.body}>
          {copied && (
            <div className={styles.toast}>
              <Check size={16} />
              <span>{t('settings.uuidCopied')}</span>
            </div>
          )}

          <div className={styles.panels}>
            {/* Basic Info */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <Globe size={20} />
                <h3>{t('detail.basicInfo')}</h3>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <MapPin size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.region')}</span>
                      <span className={styles.value}>{station.region}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MapPin size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.latLng')}</span>
                      <span className={styles.value}>
                        {station.latitude.toFixed(1)}, {station.longitude.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`${styles.infoItem} ${styles.clickable}`}
                    onClick={() => copyUUID(station.type)}
                  >
                    <Tag size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.uuid')}</span>
                      <span className={styles.valueMono}>{station.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Parameters */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <Waves size={20} />
                <h3>{t('detail.currentParams')}</h3>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.infoGrid}>
                  {[
                    { key: 'PGA', val: station.PGA },
                    { key: 'PGV', val: station.PGV },
                    { key: 'PGD', val: station.PGD },
                    { key: 'Shindo', val: station.Shindo },
                    { key: 'CalcShindo', val: station.CalcShindo },
                    { key: 'Intensity', val: station.Intensity },
                    { key: 'LPGM', val: station.LPGM },
                    { key: 'Sva30', val: station.Sva30 },
                  ].map((item) => (
                    <div key={item.key} className={styles.infoItem}>
                      <Activity size={18} />
                      <div>
                        <span className={styles.label}>{item.key}</span>
                        <span className={styles.value}>{formatValue(item.val, item.key)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Max Records */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <TrendingUp size={20} />
                <h3>{t('detail.maxRecords')}</h3>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.infoGrid}>
                  {[
                    { key: 'Max_PGA', val: station.Max_PGA },
                    { key: 'Max_PGV', val: station.Max_PGV },
                    { key: 'Max_PGD', val: station.Max_PGD },
                    { key: 'Max_Shindo', val: station.Max_Shindo },
                    { key: 'Max_CalcShindo', val: station.Max_CalcShindo },
                    { key: 'Max_Intensity', val: station.Max_Intensity },
                    { key: 'Max_LPGM', val: station.Max_LPGM },
                    { key: 'Max_Sva30', val: station.Max_Sva30 },
                  ].map((item) => (
                    <div key={item.key} className={styles.infoItem}>
                      <TrendingUp size={18} />
                      <div>
                        <span className={styles.label}>{item.key}</span>
                        <span className={styles.value}>{formatValue(item.val, item.key)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Directional Components */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <Activity size={20} />
                <h3>{t('detail.directionalComponents')}</h3>
                <button
                  className={styles.toggleBtn}
                  onClick={() => setShowComponents(!showComponents)}
                >
                  {showComponents ? '▲' : '▼'}
                </button>
              </div>
              {showComponents && (
                <div className={styles.panelContent}>
                  <div className={styles.componentGroup}>
                    <h4>{t('detail.currentPGA')}</h4>
                    <div className={styles.infoGrid}>
                      {[
                        { key: 'PGA_EW', val: station.PGA_EW },
                        { key: 'PGA_NS', val: station.PGA_NS },
                        { key: 'PGA_UD', val: station.PGA_UD },
                      ].map((item) => (
                        <div key={item.key} className={styles.infoItem}>
                          <Waves size={18} />
                          <div>
                            <span className={styles.label}>{item.key}</span>
                            <span className={styles.value}>{formatValue(item.val, item.key)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.componentGroup}>
                    <h4>{t('detail.currentPGV')}</h4>
                    <div className={styles.infoGrid}>
                      {[
                        { key: 'PGV_EW', val: station.PGV_EW },
                        { key: 'PGV_NS', val: station.PGV_NS },
                        { key: 'PGV_UD', val: station.PGV_UD },
                      ].map((item) => (
                        <div key={item.key} className={styles.infoItem}>
                          <Waves size={18} />
                          <div>
                            <span className={styles.label}>{item.key}</span>
                            <span className={styles.value}>{formatValue(item.val, item.key)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Status */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <Cpu size={20} />
                <h3>{t('detail.systemStatus')}</h3>
              </div>
              <div className={styles.panelContent}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <Cpu size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.desktop')}</span>
                      <span className={styles.value}>{station.is_desktop ? t('boolean.yes') : t('boolean.no')}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Cpu size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.highPrecision')}</span>
                      <span className={styles.value}>{station.High_Precision ? t('boolean.yes') : t('boolean.no')}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.updated')}</span>
                      <span className={styles.value}>{formatValue(station.update_at, 'update_at')}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock size={18} />
                    <div>
                      <span className={styles.label}>{t('detail.created')}</span>
                      <span className={styles.value}>{formatValue(station.create_at, 'create_at')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
