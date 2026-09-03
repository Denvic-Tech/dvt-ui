import React from 'react';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GroupWorkRoundedIcon from '@mui/icons-material/GroupWorkRounded';

import type { AppDispatch } from '@/app/providers/store';
import { clearNodesCache } from '@/features/node/reset-node-cache';

export interface MultiNodeMenuActionContext {
  nodeIDs: string[];
  dispatch: AppDispatch;
  closeMenu: () => void;
  onDeleteNodes: (nodeIDs: string[]) => Promise<void>;
  onCreateSubgraph: (nodeIDs: string[]) => Promise<void>;
}

export interface MultiNodeMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onSelect: (context: MultiNodeMenuActionContext) => Promise<void>;
}

export type MultiNodeMenuItemFactory = (
  context: MultiNodeMenuActionContext
) => MultiNodeMenuItem | null;

const createSubgraphItem: MultiNodeMenuItemFactory = context => ({
  id: 'create-subgraph',
  label: 'Создать subgraph (beta)',
  icon: <GroupWorkRoundedIcon fontSize='small' />,
  disabled: context.nodeIDs.length < 2,
  onSelect: async itemContext => {
    await itemContext.onCreateSubgraph(itemContext.nodeIDs);
  },
});

const createDeleteNodesItem: MultiNodeMenuItemFactory = context => ({
  id: 'delete-selected-nodes',
  label: 'Удалить',
  icon: <DeleteOutlineRoundedIcon fontSize='small' />,
  danger: true,
  disabled: context.nodeIDs.length === 0,
  onSelect: async itemContext => {
    await itemContext.onDeleteNodes(itemContext.nodeIDs);
  },
});

const createClearCacheItem: MultiNodeMenuItemFactory = context => ({
  id: 'clear-selected-nodes-cache',
  label: 'Очистить кэш',
  icon: <CleaningServicesRoundedIcon fontSize='small' />,
  disabled: context.nodeIDs.length === 0,
  onSelect: async itemContext => {
    await itemContext
      .dispatch(clearNodesCache({ nodeIDs: itemContext.nodeIDs }))
      .unwrap();
  },
});

export const DEFAULT_MULTI_NODE_MENU_FACTORIES: MultiNodeMenuItemFactory[] = [
  createSubgraphItem,
  createDeleteNodesItem,
  createClearCacheItem,
];

export const buildMultiNodeMenuItems = (
  context: MultiNodeMenuActionContext,
  factories: MultiNodeMenuItemFactory[] = DEFAULT_MULTI_NODE_MENU_FACTORIES
): MultiNodeMenuItem[] => {
  return factories
    .map(factory => factory(context))
    .filter((item): item is MultiNodeMenuItem => item !== null);
};
