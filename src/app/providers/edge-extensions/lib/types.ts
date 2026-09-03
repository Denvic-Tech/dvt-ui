import React from 'react';
import { Edge, ReactFlowInstance, XYPosition } from '@xyflow/react';

import { AppDispatch } from '@/app/providers/store';

import { EdgeGeometrySnapshot } from '@/entities/project-editor/edge-context-menu';
import { CustomNodeType } from '@/entities/project-editor/graph';

export type EdgeExtensionType = 'context_menu';

export type EdgeContextMenuBuildContext = {
  edge: Edge;
  flowPosition: XYPosition | null;
  geometry: EdgeGeometrySnapshot | null;
  closeMenu: () => void;
  dispatch: AppDispatch;
  reactFlow: ReactFlowInstance<CustomNodeType, Edge>;
};

interface EdgeContextMenuItemBase {
  id: string;
  order?: number;
  disabled?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
}

export interface EdgeContextMenuActionItem extends EdgeContextMenuItemBase {
  type: 'action';
  label: string;
  closeOnSelect?: boolean;
  onSelect: (context: EdgeContextMenuBuildContext) => void | Promise<void>;
}

export interface EdgeContextMenuSubmenuItem extends EdgeContextMenuItemBase {
  type: 'submenu';
  label: string;
  items?: EdgeContextMenuItem[];
  renderContent?: (context: EdgeContextMenuBuildContext) => React.ReactNode;
  width?: number | string;
  disableListPadding?: boolean;
}

export interface EdgeContextMenuSeparatorItem extends EdgeContextMenuItemBase {
  type: 'separator';
  icon?: never;
  label?: never;
  items?: never;
  renderContent?: never;
  onSelect?: never;
}

export type EdgeContextMenuItem =
  | EdgeContextMenuActionItem
  | EdgeContextMenuSubmenuItem
  | EdgeContextMenuSeparatorItem;

export interface EdgeContextMenuExtension {
  id: string;
  name: string;
  order?: number;
  type: 'context_menu';
  condition: (edge: Edge) => boolean;
  getItems: (context: EdgeContextMenuBuildContext) => EdgeContextMenuItem[];
}

export type EdgeExtension = EdgeContextMenuExtension;
