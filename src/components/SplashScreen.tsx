'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/src/store/appStore';
import styles from './SplashScreen.module.css';

const MIN_VISIBLE_MS = 1400;
const FADE_MS = 600;

export function SplashScreen() {
  const background = useAppStore((s) => s.background);
  const [phase, setPhase] = useState<'show' | 'fade' | 'done'>('show');

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fade'), MIN_VISIBLE_MS);
    const done = setTimeout(() => setPhase('done'), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  // OBS transparent capture must never be covered by the splash
  if (background === 'green-black' || phase === 'done') return null;

  return (
    <div className={`${styles.splash} ${phase === 'fade' ? styles.fadeOut : ''}`}>
      <img src="/wolf.png" alt="" className={styles.logo} />
      <h1 className={styles.title}>SSV NEXT</h1>
      <p className={styles.subtitle}>Wolfx SeisJS</p>
    </div>
  );
}
