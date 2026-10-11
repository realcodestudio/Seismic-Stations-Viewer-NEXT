import { useAppStore } from '@/src/store/appStore';
import { t as translate } from '@/src/utils/i18n';

export function useTranslation() {
  const locale = useAppStore((s) => s.locale);

  const t = (key: string) => translate(key, locale);

  return { t, locale };
}
