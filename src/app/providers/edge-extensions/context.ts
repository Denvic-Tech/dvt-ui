import { createContext, useContext } from 'react';

import { EdgeExtensionsRegistry } from './lib/registry.ts';

export const EdgeExtensionsContext = createContext<EdgeExtensionsRegistry | null>(
  null
);

export const useEdgeExtensionsRegistry = (): EdgeExtensionsRegistry => {
  const registry = useContext(EdgeExtensionsContext);
  if (!registry) {
    throw new Error(
      'useEdgeExtensionsRegistry must be used within EdgeExtensionsProvider'
    );
  }
  return registry;
};
