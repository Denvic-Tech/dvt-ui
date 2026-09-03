import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UseLogDragSelectOptions {
  rowCount: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onExpandRow: (index: number | null) => void;
}

interface UseLogDragSelectReturn {
  selectedIndices: Set<number>;
  hasSelection: boolean;
  selectionCount: number;
  clearSelection: () => void;
  getRowHandlers: (index: number) => {
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseMove: (event: React.MouseEvent) => void;
    onMouseUp: (event: React.MouseEvent) => void;
  };
}

function rangeSet(a: number, b: number): Set<number> {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const set = new Set<number>();

  for (let i = min; i <= max; i += 1) {
    set.add(i);
  }

  return set;
}

export function useLogDragSelect({
  rowCount,
  containerRef: _containerRef,
  onExpandRow,
}: UseLogDragSelectOptions): UseLogDragSelectReturn {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set()
  );

  const anchorRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const didCollapseRef = useRef(false);
  const isMouseDownRef = useRef(false);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    anchorRef.current = null;
    isDraggingRef.current = false;
    didCollapseRef.current = false;
    isMouseDownRef.current = false;
  }, []);

  useEffect(() => {
    clearSelection();
  }, [rowCount, clearSelection]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
      isDraggingRef.current = false;
      didCollapseRef.current = false;
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getRowHandlers = useCallback(
    (index: number) => {
      const onMouseDown = (event: React.MouseEvent) => {
        if (event.button !== 0) return;

        event.preventDefault();

        isMouseDownRef.current = true;

        if (event.shiftKey && anchorRef.current !== null) {
          setSelectedIndices(rangeSet(anchorRef.current, index));
          isDraggingRef.current = false;
          return;
        }

        anchorRef.current = index;
        isDraggingRef.current = false;
        didCollapseRef.current = false;
      };

      const onMouseMove = () => {
        if (!isMouseDownRef.current) return;
        if (anchorRef.current === null) return;
        if (index === anchorRef.current && !isDraggingRef.current) return;

        if (!isDraggingRef.current) {
          isDraggingRef.current = true;

          if (!didCollapseRef.current) {
            onExpandRow(null);
            didCollapseRef.current = true;
          }
        }

        setSelectedIndices(rangeSet(anchorRef.current, index));
      };

      const onMouseUp = () => {
        const wasDragging = isDraggingRef.current;

        isMouseDownRef.current = false;
        isDraggingRef.current = false;
        didCollapseRef.current = false;

        if (anchorRef.current === null) return;

        if (wasDragging) {
          return;
        }

        setSelectedIndices(new Set());
        onExpandRow(index);
        anchorRef.current = index;
      };

      return { onMouseDown, onMouseMove, onMouseUp };
    },
    [onExpandRow]
  );

  return {
    selectedIndices,
    hasSelection: selectedIndices.size > 0,
    selectionCount: selectedIndices.size,
    clearSelection,
    getRowHandlers,
  };
}
