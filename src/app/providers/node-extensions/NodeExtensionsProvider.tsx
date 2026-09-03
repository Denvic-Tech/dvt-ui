import React from 'react';
import { NodeExtensionsContext } from './context';
import { nodeExtensionsRegistry } from './registry.ts';

/**
 * Провайдер кладёт singleton-реестр в контекст.
 * Если нужно несколько независимых реестров — можешь прокинуть custom instance через prop.
 */
export const NodeExtensionsProvider: React.FC<
  React.PropsWithChildren<{
    registry?: typeof nodeExtensionsRegistry;
  }>
> = ({ children, registry = nodeExtensionsRegistry }) => {
  return (
    <NodeExtensionsContext.Provider value={registry}>
      {children}
    </NodeExtensionsContext.Provider>
  );
};
