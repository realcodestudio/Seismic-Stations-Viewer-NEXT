'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { PictureInPicture } from './PictureInPicture';
import type { SeismicData, BackgroundType, ThemeMode } from '@/src/types/seismic';

interface PipBridgeProps {
  pipWindow: (Window & { document: Document }) | null;
  restartToken: number;
  stations: SeismicData[];
  background: BackgroundType;
  theme: ThemeMode;
  onRestart: () => void;
}

/**
 * Owns the PiP portal. Remounting via `key` detaches the portal from the PiP
 * document before that document is destroyed — closing the window without
 * this crashes the opener page. Also triggers the close+reopen cycle when
 * the content style changes.
 */
let lastPipStyle: string | undefined;

export function PipBridge({
  pipWindow,
  restartToken,
  stations,
  background,
  theme,
  onRestart,
}: PipBridgeProps) {
  const pipStyle = useAppStore((s) => s.pipStyle);

  useEffect(() => {
    const prev = lastPipStyle;
    lastPipStyle = pipStyle;
    if (prev !== undefined && prev !== pipStyle) onRestart();
  }, [pipStyle, onRestart]);

  if (!pipWindow) return null;
  return (
    <PictureInPicture
      key={restartToken}
      pipWindow={pipWindow}
      stations={stations}
      background={background}
      theme={theme}
    />
  );
}
