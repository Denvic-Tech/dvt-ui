import { type RefObject, useLayoutEffect, useRef, useState } from 'react';

// Container counterpart of a min-width media query: re-renders only when the
// element crosses the threshold, and before paint on the first measurement.
export const useContainerMinWidth = <T extends HTMLElement>(
  minWidth: number
): { ref: RefObject<T>; matches: boolean } => {
  const ref = useRef<T>(null);
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const measure = () => setMatches(element.offsetWidth >= minWidth);

    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [minWidth]);

  return { ref, matches };
};
