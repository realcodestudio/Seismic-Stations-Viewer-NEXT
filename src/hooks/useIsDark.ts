import { useAppStore } from '@/src/store/appStore';

/** Returns true when dark styling should be applied. */
export function useIsDark() {
  const theme = useAppStore((s) => s.theme);
  return theme === 'dark';
}
