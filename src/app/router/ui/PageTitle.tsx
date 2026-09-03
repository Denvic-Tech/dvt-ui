import React, { useEffect, useRef } from 'react';
import config from '@/config.ts';

interface PageTitleProps {
  title?: string;
  children: React.ReactNode;
}

const BASE_TITLE = 'Denvic Visual Transformer';
const SHORT_TITLE = 'DVT';

export const PageTitle: React.FC<PageTitleProps> = ({ title, children }) => {
  const inactiveTitleSuffix = config.inactiveTabSuffix || SHORT_TITLE;
  const activeTitle = title ? `${title} • ${BASE_TITLE}` : BASE_TITLE;
  const inactiveTitle = title
    ? `${title} • ${inactiveTitleSuffix}`
    : `${BASE_TITLE} • ${inactiveTitleSuffix}`;
  const activeTitleRef = useRef(activeTitle);
  const inactiveTitleRef = useRef(inactiveTitle);
  const isNavigatingAwayRef = useRef(false);
  const inactiveTitleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeTitleRef.current = activeTitle;
    inactiveTitleRef.current = inactiveTitle;

    if (typeof document === 'undefined' || document.hidden) {
      return;
    }

    document.title = activeTitle;
  }, [activeTitle, inactiveTitle]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const clearInactiveTitleTimer = () => {
      if (inactiveTitleTimerRef.current === null) {
        return;
      }

      window.clearTimeout(inactiveTitleTimerRef.current);
      inactiveTitleTimerRef.current = null;
    };

    const markNavigatingAway = () => {
      isNavigatingAwayRef.current = true;
      clearInactiveTitleTimer();
    };

    const clearNavigatingAway = () => {
      isNavigatingAwayRef.current = false;
    };

    const applyTitleByVisibility = () => {
      clearInactiveTitleTimer();

      if (document.hidden) {
        inactiveTitleTimerRef.current = window.setTimeout(() => {
          if (isNavigatingAwayRef.current || !document.hidden) {
            return;
          }

          document.title = inactiveTitleRef.current;
        }, 50);
      } else {
        document.title = activeTitleRef.current;
      }
    };

    window.addEventListener('beforeunload', markNavigatingAway);
    window.addEventListener('pagehide', markNavigatingAway);
    window.addEventListener('pageshow', clearNavigatingAway);
    document.addEventListener('visibilitychange', applyTitleByVisibility);

    return () => {
      clearInactiveTitleTimer();
      window.removeEventListener('beforeunload', markNavigatingAway);
      window.removeEventListener('pagehide', markNavigatingAway);
      window.removeEventListener('pageshow', clearNavigatingAway);
      document.removeEventListener('visibilitychange', applyTitleByVisibility);
    };
  }, []);

  return <>{children}</>;
};
