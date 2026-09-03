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
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
  };
}

function rangeSet(a: number, b: number): Set<number> {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const set = new Set<number>();
  for (let i = min; i <= max; i++) set.add(i);
  return set;
}

export function useLogDragSelect({
  rowCount,
  containerRef,
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

  // Clear selection when row count changes (filter/search)
  useEffect(() => {
    clearSelection();
  }, [rowCount, clearSelection]);

  // Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  // Global mouseup to always stop drag tracking
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
      const onMouseDown = (e: React.MouseEvent) => {
        // Only handle left button
        if (e.button !== 0) return;
        // Prevent text selection during drag
        e.preventDefault();

        isMouseDownRef.current = true;

        if (e.shiftKey && anchorRef.current !== null) {
          // Shift+click: extend range from anchor
          setSelectedIndices(rangeSet(anchorRef.current, index));
          isDraggingRef.current = false;
          return;
        }

        anchorRef.current = index;
        isDraggingRef.current = false;
        didCollapseRef.current = false;
      };

      const onMouseMove = (_e: React.MouseEvent) => {
        // Only process moves while primary button is held
        if (!isMouseDownRef.current) return;
        if (anchorRef.current === null) return;
        if (index === anchorRef.current && !isDraggingRef.current) return;

        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          // Collapse any expanded row on first drag
          if (!didCollapseRef.current) {
            onExpandRow(null);
            didCollapseRef.current = true;
          }
        }

        setSelectedIndices(rangeSet(anchorRef.current, index));
      };

      const onMouseUp = (_e: React.MouseEvent) => {
        const wasDragging = isDraggingRef.current;
        isMouseDownRef.current = false;
        isDraggingRef.current = false;
        didCollapseRef.current = false;

        if (anchorRef.current === null) return;

        if (wasDragging) {
          // Was dragging → finalize selection, skip expand toggle
          // Keep anchor for potential shift+click extension
        } else {
          // Was a simple click → clear selection & toggle expand
          setSelectedIndices(new Set());
          onExpandRow(index);
          anchorRef.current = index;
        }
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
