import { useDeferredValue, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';

import {
  filterJsonStructure,
  getJsonStructureChildren,
  type JsonPathAssignments,
} from '@/entities/data/json-data';

import type { JsonStructureNode } from '@/shared/gatewayClient';
import { Button, Input, Tooltip } from '@/shared/ui/primitives';

import {
  ACTION_LABELS,
  ACTION_PALETTE,
  buildActionCounts,
  buildExpandedPathSet,
  filterSchemaTree,
  type SchemaMappingActionKey,
} from './helpers';
import {
  CollapseAllIcon,
  ExcludeIcon,
  ExpandAllIcon,
  ExplodeIcon,
  FilterIcon,
  KeepIcon,
  MetaIcon,
  RecordIcon,
  SearchIcon,
} from './icons';
import { SchemaTreeNode } from './SchemaTreeNode';
import {
  FilterChipsLabel,
  FilterChipsWrap,
  ToolbarDivider,
  TreeBranch,
  TreeEmptyState,
  TreeScroll,
  TreeSection,
  TreeToolbarWrap,
} from './styled';

interface SchemaTreeProps {
  assignments: JsonPathAssignments;
  expandedPaths: Set<string>;
  getActionDisabledReason: (
    path: string,
    action: SchemaMappingActionKey
  ) => string | null;
  highlightedId: string | null;
  isActionActive: (path: string, action: SchemaMappingActionKey) => boolean;
  isTreeOnlyLayout: boolean;
  nodeEmptyMessage: string;
  onActionFilterToggle: (action: SchemaMappingActionKey) => void;
  onClearAll: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onJumpToNode: (path: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedOnlyChange: (value: boolean) => void;
  onToggleAction: (path: string, action: SchemaMappingActionKey) => void;
  onToggleExpand: (path: string) => void;
  registerNodeRef: (path: string) => (element: HTMLDivElement | null) => void;
  root: JsonStructureNode | null | undefined;
  searchQuery: string;
  selectedOnly: boolean;
  selectedTreeActions: Set<SchemaMappingActionKey>;
}

const FILTER_ACTION_ICONS: Record<SchemaMappingActionKey, typeof RecordIcon> = {
  record: RecordIcon,
  keep: KeepIcon,
  exclude: ExcludeIcon,
  meta: MetaIcon,
  explode: ExplodeIcon,
};

export const SchemaTree = ({
  assignments,
  expandedPaths,
  getActionDisabledReason,
  highlightedId,
  isActionActive,
  isTreeOnlyLayout,
  nodeEmptyMessage,
  onActionFilterToggle,
  onClearAll,
  onCollapseAll,
  onExpandAll,
  onJumpToNode,
  onSearchQueryChange,
  onSelectedOnlyChange,
  onToggleAction,
  onToggleExpand,
  registerNodeRef,
  root,
  searchQuery,
  selectedOnly,
  selectedTreeActions,
}: SchemaTreeProps) => {
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredBySearch = useMemo(() => {
    return filterJsonStructure(root, deferredSearchQuery);
  }, [deferredSearchQuery, root]);

  const filteredRoot = useMemo(() => {
    return filterSchemaTree({
      activeActions: selectedTreeActions,
      root: filteredBySearch,
      selectedOnly,
      assignments,
    });
  }, [assignments, filteredBySearch, selectedOnly, selectedTreeActions]);

  useEffect(() => {
    if (
      deferredSearchQuery.trim() ||
      selectedOnly ||
      selectedTreeActions.size > 0
    ) {
      if (buildExpandedPathSet(filteredRoot).size > 0) {
        onExpandAll();
      }
    }
  }, [
    deferredSearchQuery,
    filteredRoot,
    onExpandAll,
    selectedOnly,
    selectedTreeActions,
  ]);

  const actionCounts = useMemo(
    () => buildActionCounts(assignments),
    [assignments]
  );
  const visibleActionChips = (
    Object.keys(actionCounts) as SchemaMappingActionKey[]
  ).filter(action => actionCounts[action] > 0);

  const renderNode = (node: JsonStructureNode, depth: number) => {
    const children = getJsonStructureChildren(node);
    const groups = assignments[node.path] ?? [];
    const isExpanded = expandedPaths.has(node.path);
    const visibleChildren =
      children.length > 0 && isExpanded
        ? children.map(child => renderNode(child, depth + 1))
        : null;

    return (
      <TreeBranch key={node.path}>
        <SchemaTreeNode
          depth={depth}
          expanded={isExpanded}
          getActionDisabledReason={getActionDisabledReason}
          groups={groups}
          hasChildren={children.length > 0}
          highlighted={highlightedId === node.path}
          isActionActive={isActionActive}
          node={node}
          onJumpToNode={onJumpToNode}
          onToggleAction={onToggleAction}
          onToggleExpand={onToggleExpand}
          registerNodeRef={registerNodeRef}
        />
        {visibleChildren}
      </TreeBranch>
    );
  };

  return (
    <TreeSection>
      <TreeToolbarWrap>
        <Input
          value={searchQuery}
          placeholder='Поиск по path...'
          startAdornment={<SearchIcon width={14} height={14} />}
          onChange={event => onSearchQueryChange(event.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              borderRadius: '8px',
            },
          }}
        />

        <ToolbarDivider />

        <Tooltip title='Свернуть всё'>
          <span>
            <Button
              aria-label='collapse all'
              size='xs'
              variant='outline'
              onClick={onCollapseAll}
              sx={{
                minWidth: 30,
                width: 30,
                height: 30,
                px: 0,
                borderRadius: '7px',
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  borderColor: '#e5e7eb',
                },
                '& svg': {
                  width: 12,
                  height: 12,
                },
              }}
            >
              <CollapseAllIcon />
            </Button>
          </span>
        </Tooltip>

        <Tooltip title='Развернуть всё'>
          <span>
            <Button
              aria-label='expand all'
              size='xs'
              variant='outline'
              onClick={onExpandAll}
              sx={{
                minWidth: 30,
                width: 30,
                height: 30,
                px: 0,
                borderRadius: '7px',
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  borderColor: '#e5e7eb',
                },
                '& svg': {
                  width: 12,
                  height: 12,
                },
              }}
            >
              <ExpandAllIcon />
            </Button>
          </span>
        </Tooltip>

        <Button
          aria-pressed={selectedOnly}
          size='xs'
          variant='outline'
          startIcon={<FilterIcon width={12} height={12} />}
          onClick={() => onSelectedOnlyChange(!selectedOnly)}
          sx={{
            minWidth: 'auto',
            height: 30,
            px: '10px',
            borderRadius: '7px',
            backgroundColor: selectedOnly ? '#eef2ff' : '#ffffff',
            borderColor: selectedOnly ? '#c7d2fe' : '#e5e7eb',
            color: selectedOnly ? '#4f46e5' : '#6b7280',
            '&:hover': {
              backgroundColor: selectedOnly ? '#eef2ff' : '#f9fafb',
              borderColor: selectedOnly ? '#c7d2fe' : '#e5e7eb',
            },
            '& .MuiButton-startIcon': {
              mr: 0.5,
            },
            '& svg': {
              width: 12,
              height: 12,
            },
          }}
        >
          выбранные
        </Button>
      </TreeToolbarWrap>

      {visibleActionChips.length > 0 ? (
        <FilterChipsWrap>
          <FilterChipsLabel>фильтр:</FilterChipsLabel>
          {visibleActionChips.map(action => {
            const palette = ACTION_PALETTE[action];
            const active = selectedTreeActions.has(action);
            const Icon = FILTER_ACTION_ICONS[action];

            return (
              <Tooltip key={action} title={ACTION_LABELS[action]}>
                <span>
                  <Button
                    aria-label={ACTION_LABELS[action]}
                    size='xs'
                    variant='outline'
                    onClick={() => onActionFilterToggle(action)}
                    sx={{
                      minWidth: 'auto',
                      minHeight: 26,
                      px: '7px',
                      gap: '6px',
                      borderRadius: '7px',
                      backgroundColor: active ? palette.active : '#ffffff',
                      borderColor: active
                        ? palette.active
                        : palette.borderLight,
                      color: active ? '#ffffff' : palette.text,
                      '&:hover': {
                        backgroundColor: active ? palette.active : '#ffffff',
                        borderColor: active
                          ? palette.active
                          : palette.borderLight,
                      },
                      '& svg': {
                        width: 11,
                        height: 11,
                      },
                    }}
                  >
                    <Icon />
                    <Box
                      component='span'
                      sx={{
                        px: '5px',
                        borderRadius: '4px',
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        backgroundColor: active
                          ? 'rgba(255,255,255,0.25)'
                          : palette.bgLight,
                        color: active ? '#ffffff' : palette.text,
                      }}
                    >
                      {actionCounts[action]}
                    </Box>
                  </Button>
                </span>
              </Tooltip>
            );
          })}
          {isTreeOnlyLayout ? (
            <Button
              size='xs'
              variant='link'
              onClick={onClearAll}
              sx={{
                ml: 'auto',
                minHeight: 26,
                alignSelf: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Очистить всё
            </Button>
          ) : null}
        </FilterChipsWrap>
      ) : null}

      <TreeScroll data-schema-tree-scroll='true'>
        {filteredRoot ? (
          renderNode(filteredRoot, 0)
        ) : (
          <TreeEmptyState>
            {deferredSearchQuery.trim() ||
            selectedOnly ||
            selectedTreeActions.size > 0
              ? 'Ничего не найдено'
              : nodeEmptyMessage}
          </TreeEmptyState>
        )}
      </TreeScroll>
    </TreeSection>
  );
};
