import React from 'react';

import { useMonacoRuntime } from './useMonacoRuntime';

type MonacoRuntimeGateProps = {
  children: React.ReactNode;
  /** Rendered while the Monaco bundle is still loading. */
  fallback?: React.ReactNode;
  /** Rendered if the bundle failed to load; defaults to `fallback`. */
  errorFallback?: React.ReactNode;
};

/**
 * The only allowed wrapper around `<MonacoEditor>` from `@monaco-editor/react`.
 * It guarantees `loader.config({ monaco })` has run before the editor mounts,
 * so the library never tries to fetch Monaco from its default CDN.
 */
export const MonacoRuntimeGate: React.FC<MonacoRuntimeGateProps> = ({
  children,
  fallback = null,
  errorFallback,
}) => {
  const { status } = useMonacoRuntime();

  if (status === 'ready') {
    return <>{children}</>;
  }

  if (status === 'error') {
    return <>{errorFallback ?? fallback}</>;
  }

  return <>{fallback}</>;
};
