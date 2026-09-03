import React, { PropsWithChildren, useMemo } from 'react';

import { EdgeExtensionsContext } from './context';
import { EdgeExtensionsRegistry } from './lib/registry.ts';
import { edgeExtensionsRegistry } from './registry.ts';

interface EdgeExtensionsProviderProps {
  registry?: EdgeExtensionsRegistry;
}

export const EdgeExtensionsProvider: React.FC<
  PropsWithChildren<EdgeExtensionsProviderProps>
> = ({ registry = edgeExtensionsRegistry, children }) => {
  const value = useMemo(() => registry, [registry]);
  return (
    <EdgeExtensionsContext.Provider value={value}>
      {children}
    </EdgeExtensionsContext.Provider>
  );
};
