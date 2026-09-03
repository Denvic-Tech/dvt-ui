import { useMemo, useSyncExternalStore } from 'react';
import type { Edge } from '@xyflow/react';

import { useEdgeExtensionsRegistry } from './context';
import {
  EdgeContextMenuBuildContext,
  EdgeContextMenuItem,
} from './lib/types.ts';

const EMPTY_ITEMS: EdgeContextMenuItem[] = [];

export const useEdgeContextMenuItems = (
  edge: Edge | null | undefined,
  context: EdgeContextMenuBuildContext | null
): EdgeContextMenuItem[] => {
  const registry = useEdgeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!edge || !context) {
      return EMPTY_ITEMS;
    }
    void version;
    return registry.getContextMenuItems(edge, context);
  }, [context, edge, registry, version]);
};
