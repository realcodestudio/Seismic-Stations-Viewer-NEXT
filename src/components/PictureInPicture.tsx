'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SeismicData, BackgroundType, ThemeMode } from '@/src/types/seismic';
import { useAppStore } from '@/src/store/appStore';
import { MiniStationCard } from './MiniStationCard';
import { PipShindoRow } from './PipShindoRow';

interface PictureInPictureProps {
  pipWindow: Window & { document: Document };
  stations: SeismicData[];
  background: BackgroundType;
  theme: ThemeMode;
}

function syncStylesheets(pipDoc: Document) {
  for (const el of Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))) {
    if (el instanceof HTMLStyleElement) {
      const style = pipDoc.createElement('style');
      style.textContent = el.textContent;
      pipDoc.head.appendChild(style);
    } else if (el instanceof HTMLLinkElement && el.href) {
      const link = pipDoc.createElement('link');
      link.rel = 'stylesheet';
      link.href = el.href;
      pipDoc.head.appendChild(link);
    }
  }
}

export function PictureInPicture({
  pipWindow,
  stations,
  background,
  theme,
}: PictureInPictureProps) {
  const [mounted, setMounted] = useState(false);
  const pipStyle = useAppStore((s) => s.pipStyle);
  const pipTheme = useAppStore((s) => s.pipTheme);
  const pipDark = pipTheme === 'dark';
  const pipDoc = pipWindow.document;

  useEffect(() => {
    pipDoc.title = 'SSV NEXT';
    // carry the font-variable class, theme and runtime CSS vars across
    pipDoc.documentElement.className = document.documentElement.className;
    pipDoc.documentElement.setAttribute('data-theme', theme);
    for (const prop of Array.from(document.documentElement.style)) {
      pipDoc.documentElement.style.setProperty(prop, document.documentElement.style.getPropertyValue(prop));
    }
    syncStylesheets(pipDoc);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && node.rel === 'stylesheet')) {
            syncStylesheets(pipDoc);
            return;
          }
        }
      }
    });
    observer.observe(document.head, { childList: true });
    setMounted(true);
    return () => observer.disconnect();
  }, [pipDoc, theme]);

  if (!mounted) return null;

  const bgClass =
    background === 'wolfx'
      ? 'bg-wolfx'
      : background === 'green-black'
        ? 'bg-green'
        : background === 'black'
          ? 'bg-black'
          : 'bg-white';

  return createPortal(
    <main className={`app-container ${bgClass}`} data-theme={theme} style={{ padding: pipStyle === 'shindoList' ? 8 : 12, minHeight: 'auto' }}>
      {pipStyle === 'cards' ? (
        <div className="station-grid-mini" style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', maxHeight: '100%', overflowY: 'auto' as const }}>
          {stations.map((station) => (
            <MiniStationCard key={station.type} data={station} darkMode={pipDark} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, maxHeight: '100%', overflowY: 'auto' as const }}>
          {stations.map((station) => (
            <PipShindoRow key={station.type} data={station} darkMode={pipDark} />
          ))}
        </div>
      )}
    </main>,
    pipDoc.body
  );
}
