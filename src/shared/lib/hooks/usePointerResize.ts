import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

type PointerPoint = {
  x: number;
  y: number;
};

interface PointerResizeDragState {
  pointerId: number;
  startPointer: PointerPoint;
  startValue: number;
}

interface UsePointerResizeOptions {
  value: number;
  clamp: (nextValue: number) => number;
  getNextValue: (args: {
    currentPointer: PointerPoint;
    startPointer: PointerPoint;
    startValue: number;
  }) => number;
  onCommit: (nextValue: number) => void;
  cursor: string;
}

interface UsePointerResizeResult {
  isResizing: boolean;
  liveValue: number;
  setLiveValue: (nextValue: number) => void;
  handlePointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLElement>) => void;
}

export const usePointerResize = ({
  value,
  clamp,
  getNextValue,
  onCommit,
  cursor,
}: UsePointerResizeOptions): UsePointerResizeResult => {
  const [isResizing, setIsResizing] = useState(false);
  const [liveValue, setLiveValueState] = useState(() => clamp(value));

  const dragStateRef = useRef<PointerResizeDragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const queuedValueRef = useRef<number>(clamp(value));
  const liveValueRef = useRef<number>(clamp(value));

  const setLiveValue = useCallback(
    (nextValue: number) => {
      const clampedValue = clamp(nextValue);
      queuedValueRef.current = clampedValue;
      liveValueRef.current = clampedValue;
      setLiveValueState(prevValue =>
        prevValue === clampedValue ? prevValue : clampedValue
      );
    },
    [clamp]
  );

  const scheduleLiveValue = useCallback(
    (nextValue: number) => {
      queuedValueRef.current = clamp(nextValue);
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        setLiveValue(queuedValueRef.current);
      });
    },
    [clamp, setLiveValue]
  );

  useEffect(() => {
    if (isResizing) {
      return;
    }
    setLiveValue(clamp(value));
  }, [clamp, isResizing, setLiveValue, value]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const nextValue = clamp(liveValueRef.current);
      dragStateRef.current = {
        pointerId: event.pointerId,
        startPointer: { x: event.clientX, y: event.clientY },
        startValue: nextValue,
      };
      setIsResizing(true);
      setLiveValue(nextValue);
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = cursor;
    },
    [clamp, cursor, setLiveValue]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const nextValue = getNextValue({
        currentPointer: { x: event.clientX, y: event.clientY },
        startPointer: dragState.startPointer,
        startValue: dragState.startValue,
      });

      scheduleLiveValue(nextValue);
    },
    [getNextValue, scheduleLiveValue]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const nextValue = clamp(
        getNextValue({
          currentPointer: { x: event.clientX, y: event.clientY },
          startPointer: dragState.startPointer,
          startValue: dragState.startValue,
        })
      );

      dragStateRef.current = null;
      setIsResizing(false);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      setLiveValue(nextValue);

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release mismatches during rapid pointer teardown.
      }

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      onCommit(nextValue);
    },
    [clamp, getNextValue, onCommit, setLiveValue]
  );

  return {
    isResizing,
    liveValue,
    setLiveValue,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};
