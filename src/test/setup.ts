import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

// Editors are gated behind the Monaco runtime; tests mock `@monaco-editor/react`
// directly, so report the runtime as ready and never touch the real loader.
vi.mock('@/shared/ui/code-editor/runtime/monacoRuntime', () => ({
  ensureMonacoRuntime: () => Promise.resolve(),
  getMonacoRuntimeStatus: () => 'ready',
  isMonacoRuntimeReady: () => true,
  getMonacoRuntimeError: () => null,
  subscribeMonacoRuntime: () => () => {},
}));

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
