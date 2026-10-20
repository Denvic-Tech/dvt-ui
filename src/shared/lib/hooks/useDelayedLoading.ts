import { useEffect, useRef, useState } from 'react';

export interface DelayedLoadingOptions {
  /** Сколько ждать перед показом индикатора: быстрые ответы его не увидят. */
  delay?: number;
  /** Если индикатор показан, держать его не меньше этого времени. */
  minDuration?: number;
}

/**
 * Флаг показа индикатора загрузки без мигания: появляется только если
 * загрузка длится дольше `delay` и не исчезает раньше `minDuration`.
 */
export const useDelayedLoading = (
  isLoading: boolean,
  { delay = 150, minDuration = 400 }: DelayedLoadingOptions = {}
): boolean => {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    if (isLoading && !visible) {
      const show = () => {
        shownAtRef.current = Date.now();
        setVisible(true);
      };
      if (delay <= 0) {
        show();
        return undefined;
      }
      const timer = setTimeout(show, delay);
      return () => clearTimeout(timer);
    }

    if (!isLoading && visible) {
      const remaining = minDuration - (Date.now() - shownAtRef.current);
      if (remaining <= 0) {
        setVisible(false);
        return undefined;
      }
      const timer = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isLoading, visible, delay, minDuration]);

  return visible;
};
