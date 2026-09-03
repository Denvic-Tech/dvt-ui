import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';
import {
  Anchor,
  DEFAULT_ANCHOR,
  EXIT_ANIMATION_MS,
  MAX_VISIBLE,
  defaultTTLs,
  posKey,
} from '@/app/notifications/model/types.ts';
import {
  dismissGroup,
  purgeGroup,
  setPaused,
  startExitAnimation,
} from '@/app/notifications/model/slice.ts';

type UseNotificationStackParams = {
  anchor?: Anchor | undefined;
  maxVisible?: number | undefined;
};

export const useNotificationStack = ({
  anchor = DEFAULT_ANCHOR,
  maxVisible = MAX_VISIBLE,
}: UseNotificationStackParams = {}) => {
  const dispatch = useAppDispatch();
  const { groupsByKey, orderByPosition } = useAppSelector(s => s.alerts);

  const pk = posKey(anchor);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const visibleGroups = useMemo(() => {
    return (orderByPosition[pk] || [])
      .map(k => groupsByKey[k])
      .filter(Boolean)
      .filter(g => g.visible);
  }, [groupsByKey, orderByPosition, pk]);

  const renderedGroups = useMemo(
    () => visibleGroups.slice(0, maxVisible),
    [visibleGroups, maxVisible]
  );

  const onDismissGroup = useCallback(
    (groupKey: string, manual = false) => {
      const existing = timersRef.current.get(groupKey);
      if (existing) {
        clearTimeout(existing);
        timersRef.current.delete(groupKey);
      }
      // If manually dismissed (user clicked close), mark notifications as dismissed
      // so they won't appear in the notification center history
      if (manual) {
        dispatch(dismissGroup({ groupKey }));
      }
      dispatch(startExitAnimation({ groupKey }));
      setTimeout(() => {
        dispatch(purgeGroup({ groupKey }));
      }, EXIT_ANIMATION_MS);
    },
    [dispatch]
  );

  const onMouseEnter = useCallback(
    (groupKey: string) => {
      dispatch(setPaused({ groupKey, paused: true }));
      const existing = timersRef.current.get(groupKey);
      if (existing) {
        clearTimeout(existing);
        timersRef.current.delete(groupKey);
      }
    },
    [dispatch]
  );

  const onMouseLeave = useCallback(
    (groupKey: string) => {
      dispatch(setPaused({ groupKey, paused: false }));
      const g = groupsByKey[groupKey];
      if (!g) return;

      const ttl = defaultTTLs[g.type];
      if (ttl === null) return; // no auto-close for this type

      const timer = setTimeout(() => {
        timersRef.current.delete(groupKey);
        onDismissGroup(groupKey, false); // auto-close, not manual
      }, ttl);
      timersRef.current.set(groupKey, timer);
    },
    [dispatch, groupsByKey, onDismissGroup]
  );

  const dismissAll = useCallback(() => {
    visibleGroups.forEach(group => {
      onDismissGroup(group.key, true);
    });
  }, [onDismissGroup, visibleGroups]);

  // Set up auto-close timers for rendered groups
  useEffect(() => {
    renderedGroups.forEach(g => {
      if (g.paused || g.exiting) return;
      if (timersRef.current.has(g.key)) return;

      const ttl = defaultTTLs[g.type];
      if (ttl === null) return;

      const timer = setTimeout(() => {
        timersRef.current.delete(g.key);
        onDismissGroup(g.key, false); // auto-close, not manual
      }, ttl);
      timersRef.current.set(g.key, timer);
    });

    // Clean up timers for groups no longer rendered
    const renderedKeys = new Set(renderedGroups.map(g => g.key));
    timersRef.current.forEach((timer, key) => {
      if (!renderedKeys.has(key)) {
        clearTimeout(timer);
        timersRef.current.delete(key);
      }
    });
  }, [renderedGroups, onDismissGroup]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Wrapper for manual dismissal (user clicked close button)
  const handleManualDismiss = useCallback(
    (groupKey: string) => onDismissGroup(groupKey, true),
    [onDismissGroup]
  );

  return {
    visibleGroups,
    renderedGroups,
    dismissGroup: handleManualDismiss,
    dismissAll,
    onMouseEnter,
    onMouseLeave,
    onHideAll: dismissAll,
  };
};
