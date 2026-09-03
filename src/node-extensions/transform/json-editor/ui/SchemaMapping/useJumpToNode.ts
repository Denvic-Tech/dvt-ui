import { useEffect, useMemo, useRef, useState } from 'react';

const TREE_SCROLL_SELECTOR = '[data-schema-tree-scroll="true"]';
const TREE_SCROLL_OFFSET = 12;

export interface UseJumpToNodeOptions {
  ancestorMap: Record<string, string[]>;
  onExpandAncestors: (path: string, ancestors: string[]) => void;
}

export interface UseJumpToNodeResult {
  highlightedId: string | null;
  jumpToNode: (path: string) => void;
  registerNodeRef: (path: string) => (element: HTMLDivElement | null) => void;
}

export const useJumpToNode = ({
  ancestorMap,
  onExpandAncestors,
}: UseJumpToNodeOptions): UseJumpToNodeResult => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollTimeoutRef = useRef<number | null>(null);
  const clearHighlightTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (scrollTimeoutRef.current != null) {
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    if (clearHighlightTimeoutRef.current != null) {
      window.clearTimeout(clearHighlightTimeoutRef.current);
      clearHighlightTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  const registerNodeRef = useMemo(() => {
    return (path: string) => (element: HTMLDivElement | null) => {
      if (element) {
        nodeRefs.current[path] = element;
        return;
      }

      delete nodeRefs.current[path];
    };
  }, []);

  const scrollNodeIntoView = (element: HTMLDivElement) => {
    const scrollContainer = element.closest<HTMLElement>(TREE_SCROLL_SELECTOR);

    if (!scrollContainer) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const maxScrollTop = Math.max(
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
      0
    );
    const targetTop = Math.min(
      Math.max(
        scrollContainer.scrollTop +
          (elementRect.top - containerRect.top) -
          TREE_SCROLL_OFFSET,
        0
      ),
      maxScrollTop
    );

    if (typeof scrollContainer.scrollTo === 'function') {
      scrollContainer.scrollTo({
        behavior: 'smooth',
        top: targetTop,
      });
      return;
    }

    scrollContainer.scrollTop = targetTop;
  };

  const jumpToNode = (path: string) => {
    const ancestors = ancestorMap[path];

    if (!ancestors) {
      return;
    }

    onExpandAncestors(path, ancestors);
    clearTimers();

    scrollTimeoutRef.current = window.setTimeout(() => {
      const element = nodeRefs.current[path];

      if (element) {
        scrollNodeIntoView(element);
      }

      setHighlightedId(path);
      clearHighlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedId(null);
      }, 1500);
    }, 50);
  };

  return {
    highlightedId,
    jumpToNode,
    registerNodeRef,
  };
};
