import { useEffect, useRef, useState } from 'react';

export const useElapsedTime = (
  startedAt: string | null | undefined,
  isActive: boolean
): string => {
  const [elapsed, setElapsed] = useState('0:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setElapsed('0:00');
      return undefined;
    }

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      );
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setElapsed(`${minutes}:${String(seconds).padStart(2, '0')}`);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startedAt]);

  return elapsed;
};
