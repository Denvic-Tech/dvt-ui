import { EdgeExtensionsRegistry } from './lib/registry.ts';

import EdgeAddNodeExtension from '@/edge-extensions/addNodeBetweenEdge';
import EdgeDeleteConnectionExtension from '@/edge-extensions/deleteEdgeConnection';

export const edgeExtensionsRegistry = new EdgeExtensionsRegistry();

edgeExtensionsRegistry.register(
  EdgeAddNodeExtension,
  EdgeDeleteConnectionExtension
);
