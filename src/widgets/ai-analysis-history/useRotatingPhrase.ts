import { useEffect, useState } from 'react';

export const useRotatingPhrase = (
  phrases: string[],
  intervalMs = 2500
): string => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [phrases]);

  useEffect(() => {
    if (phrases.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setIndex(current => (current + 1) % phrases.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, phrases.length]);

  return phrases[index] ?? '';
};
