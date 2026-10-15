import * as React from 'react';

type UseDismissOptions = {
  /** Selector of elements that count as "inside" even when portaled. */
  ignoreSelector?: string;
  /** Close on any scroll (for fixed-position layers tied to an anchor). */
  closeOnScroll?: boolean;
};

/** Closes a floating layer on outside mousedown, Escape and (optionally) scroll. */
export const useDismiss = (
  open: boolean,
  refs: readonly React.RefObject<HTMLElement | null>[],
  onClose: () => void,
  { ignoreSelector, closeOnScroll = false }: UseDismissOptions = {}
) => {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  const refsRef = React.useRef(refs);
  refsRef.current = refs;

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const close = () => onCloseRef.current();
    const isInside = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) {
        return false;
      }

      return (
        refsRef.current.some(ref => ref.current?.contains(target)) ||
        Boolean(ignoreSelector && target.closest(ignoreSelector))
      );
    };
    const handleMouseDown = (event: MouseEvent) => {
      if (event.target && !isInside(event.target)) {
        close();
      }
    };
    // Scrolling inside the layer itself (e.g. a long error log) must not
    // dismiss it; only page/container scrolls detach it from its anchor.
    const handleScroll = (event: Event) => {
      if (!isInside(event.target)) {
        close();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    if (closeOnScroll) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeOnScroll) {
        window.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, [closeOnScroll, ignoreSelector, open]);
};
