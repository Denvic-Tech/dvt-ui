import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGraphUnsavedChangesGuard } from '../model/hooks.ts';

const { currentStateRef, useBeforeUnloadMock } = vi.hoisted(() => ({
  currentStateRef: {
    current: {
      syncGraph: {
        outbox: [] as any[],
        inFlight: false,
        flushMode: 'none',
        debounceMs: 2000,
        backoffMs: 0,
        lastError: null,
      },
    },
  },
  useBeforeUnloadMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useBeforeUnload: useBeforeUnloadMock,
}));

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector(currentStateRef.current),
}));

const TestComponent = () => {
  useGraphUnsavedChangesGuard();
  return null;
};

describe('useGraphUnsavedChangesGuard', () => {
  beforeEach(() => {
    useBeforeUnloadMock.mockReset();

    currentStateRef.current = {
      syncGraph: {
        outbox: [] as any[],
        inFlight: false,
        flushMode: 'none',
        debounceMs: 2000,
        backoffMs: 0,
        lastError: null,
      },
    };
  });

  it('registers beforeunload protection when graph changes are pending', () => {
    currentStateRef.current = {
      syncGraph: {
        ...currentStateRef.current.syncGraph,
        outbox: [{ id: 'op-1' }],
      },
    };

    let beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | undefined;
    useBeforeUnloadMock.mockImplementation(handler => {
      beforeUnloadHandler = handler;
    });

    render(<TestComponent />);

    const preventDefault = vi.fn();
    const event = {
      preventDefault,
      returnValue: undefined,
    } as unknown as BeforeUnloadEvent;

    beforeUnloadHandler?.(event);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(event.returnValue).toBe('');
  });

  it('does not block beforeunload when graph is fully synced', () => {
    let beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | undefined;
    useBeforeUnloadMock.mockImplementation(handler => {
      beforeUnloadHandler = handler;
    });

    render(<TestComponent />);

    const preventDefault = vi.fn();
    const event = {
      preventDefault,
      returnValue: undefined,
    } as unknown as BeforeUnloadEvent;

    beforeUnloadHandler?.(event);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(event.returnValue).toBeUndefined();
  });
});
