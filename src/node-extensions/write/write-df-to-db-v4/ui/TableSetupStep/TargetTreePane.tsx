import { type ReactNode, useState } from 'react';
import { MenuItem } from '@mui/material';

import {
  type CatalogTreeLevel,
  type CatalogTreeModel,
  type CatalogTreeNode,
  type CatalogTreeNodeRow,
  CatalogTreeView,
  getCatalogTreeRowPadding,
  TreeChevron,
  TreeIcon,
  TreeMenu,
  TreeName,
  TreeRowActionButton,
  TreeRowButton,
} from '@/features/node/db-catalog-tree';

import type { DbMetadata } from '@/shared/gatewayClient';
import {
  DatabasePlusIcon,
  DraftTableIcon,
  MoreIcon,
  PlusIcon,
  SchemaPlusIcon,
} from '@/shared/ui/clean-minimal/icons';

import type { CreateNamespaceRequest } from './CreateNamespaceDialog';
import { AddRowIcon, AddRowName } from './TableSetupStep.styles';

export type TableDraft = {
  databaseName: string | null;
  schemaName: string | null;
  name: string;
};

type TargetTreePaneProps = {
  tree: CatalogTreeModel;
  metadata: DbMetadata | null;
  draft: TableDraft | null;
  highlightedKey: string | null;
  canCreateDatabase: boolean;
  canCreateSchema: boolean;
  onTableSelect: (node: CatalogTreeNode) => void;
  onStartDraft: (
    databaseName: string | null,
    schemaName: string | null
  ) => void;
  onRequestCreate: (request: CreateNamespaceRequest) => void;
  isExpressionMode: boolean;
  canUseExpressions: boolean;
  onEnterExpressionMode: () => void;
  onExitExpressionMode: () => void;
  expressionContent: ReactNode;
};

/** Родитель таблиц, к которому относится строка узла. */
const getTableParent = (node: CatalogTreeNode) => ({
  databaseName: node.level === 'database' ? node.name : node.databaseName,
  schemaName: node.level === 'schema' ? node.name : null,
});

export const TargetTreePane = ({
  tree,
  metadata,
  draft,
  highlightedKey,
  canCreateDatabase,
  canCreateSchema,
  onTableSelect,
  onStartDraft,
  onRequestCreate,
  isExpressionMode,
  canUseExpressions,
  onEnterExpressionMode,
  onExitExpressionMode,
  expressionContent,
}: TargetTreePaneProps) => {
  const [rowMenu, setRowMenu] = useState<{
    key: string;
    anchor: HTMLElement;
    databaseName: string;
  } | null>(null);
  const rootLevel = tree.levels[0];

  // «+ Новая таблица» — первая строка внутри схемы (или базы, если схем нет).
  // Пока в узле есть черновик, вместо кнопки показывается сам черновик.
  const renderBranchLead = (
    row: CatalogTreeNodeRow,
    childLevel: CatalogTreeLevel
  ) => {
    if (childLevel !== 'table') return null;
    const parent = getTableParent(row.node);
    const depth = row.depth + 1;
    const padding = getCatalogTreeRowPadding(depth);
    const hasDraftHere =
      draft !== null &&
      draft.databaseName === parent.databaseName &&
      draft.schemaName === parent.schemaName;

    if (hasDraftHere) {
      const label = draft.name.trim() || 'без названия';
      return (
        <TreeRowButton
          type='button'
          role='treeitem'
          aria-level={depth + 1}
          aria-selected
          selected
          onPath={false}
          data-tree-draft='true'
          title={label}
          style={{ paddingLeft: padding }}
        >
          <TreeChevron />
          <TreeIcon className='tree-icon'>
            <DraftTableIcon />
          </TreeIcon>
          <TreeName className='tree-name'>{label}</TreeName>
        </TreeRowButton>
      );
    }

    return (
      <TreeRowButton
        type='button'
        selected={false}
        onPath={false}
        data-testid='node-extensions/write/write-df-to-db-v4/new-table-row'
        style={{ paddingLeft: padding }}
        onClick={() => onStartDraft(parent.databaseName, parent.schemaName)}
      >
        <TreeChevron />
        <AddRowIcon>
          <PlusIcon />
        </AddRowIcon>
        <AddRowName>Новая таблица</AddRowName>
      </TreeRowButton>
    );
  };

  const renderNodeActions = (row: CatalogTreeNodeRow) => {
    if (!canCreateSchema || row.node.level !== 'database') return null;
    const open = rowMenu?.key === row.key;
    return (
      <TreeRowActionButton
        type='button'
        aria-label='Действия с базой'
        title='Действия'
        aria-haspopup='menu'
        aria-expanded={open}
        active={open}
        onClick={event =>
          setRowMenu(
            open
              ? null
              : {
                  key: row.key,
                  anchor: event.currentTarget,
                  databaseName: row.node.name,
                }
          )
        }
      >
        <MoreIcon size={14} />
      </TreeRowActionButton>
    );
  };

  const renderExtraMenuItems = (closeMenu: () => void) => {
    // Схемы без уровня баз создаются из общего меню.
    const createRootSchema = canCreateSchema && rootLevel === 'schema';
    if (!canCreateDatabase && !createRootSchema) return null;
    return canCreateDatabase ? (
      <MenuItem
        onClick={() => {
          closeMenu();
          onRequestCreate({ kind: 'database' });
        }}
      >
        <DatabasePlusIcon />
        Создать базу данных
      </MenuItem>
    ) : (
      <MenuItem
        onClick={() => {
          closeMenu();
          onRequestCreate({ kind: 'schema', databaseName: null });
        }}
      >
        <SchemaPlusIcon />
        Создать схему
      </MenuItem>
    );
  };

  return (
    <>
      <CatalogTreeView
        tree={tree}
        metadata={metadata}
        isMetadataLoading={false}
        ariaLabel='Таблица-приёмник'
        onTableSelect={onTableSelect}
        isExpressionMode={isExpressionMode}
        canUseExpressions={canUseExpressions}
        onEnterExpressionMode={onEnterExpressionMode}
        onExitExpressionMode={onExitExpressionMode}
        expressionContent={expressionContent}
        renderBranchLead={renderBranchLead}
        renderNodeActions={renderNodeActions}
        renderExtraMenuItems={renderExtraMenuItems}
        highlightedKey={highlightedKey}
      />
      <RowActionsMenu
        state={rowMenu}
        onClose={() => setRowMenu(null)}
        onCreateSchema={databaseName => {
          setRowMenu(null);
          onRequestCreate({ kind: 'schema', databaseName });
        }}
      />
    </>
  );
};

type RowActionsMenuProps = {
  state: { anchor: HTMLElement; databaseName: string } | null;
  onClose: () => void;
  onCreateSchema: (databaseName: string) => void;
};

const RowActionsMenu = ({
  state,
  onClose,
  onCreateSchema,
}: RowActionsMenuProps) => (
  <TreeMenu
    anchorEl={state?.anchor ?? null}
    open={Boolean(state)}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    <MenuItem
      onClick={() => {
        if (state) onCreateSchema(state.databaseName);
      }}
    >
      <SchemaPlusIcon />
      Создать схему
    </MenuItem>
  </TreeMenu>
);
