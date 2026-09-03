import { createContext, useContext } from 'react';
import { NodeExtensionsRegistry } from './lib/registry.ts';
import { nodeExtensionsRegistry } from './registry.ts';

const NodeExtensionsCtx = createContext<NodeExtensionsRegistry>(
  nodeExtensionsRegistry
);

export const useNodeExtensionsRegistry = () => useContext(NodeExtensionsCtx);

export const NodeExtensionsContext = NodeExtensionsCtx;
