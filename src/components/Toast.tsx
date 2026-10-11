'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/src/store/appStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import styles from './Toast.module.css';

export function Toast() {
  const { t } = useTranslation();
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className={styles.toast} onClick={clearToast}>
      {t(toast)}
    </div>
  );
}
