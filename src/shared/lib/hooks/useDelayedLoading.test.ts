import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDelayedLoading } from './useDelayedLoading';

describe('useDelayedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const render = (isLoading: boolean) =>
    renderHook(
      ({ loading }) =>
        useDelayedLoading(loading, { delay: 150, minDuration: 400 }),
      { initialProps: { loading: isLoading } }
    );

  it('never shows the indicator for loads faster than the delay', () => {
    const { result, rerender } = render(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(false);
  });

  it('keeps a shown indicator for at least the minimum duration', () => {
    const { result, rerender } = render(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ loading: false });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });
});
