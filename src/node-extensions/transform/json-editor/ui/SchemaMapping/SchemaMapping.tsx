import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildJsonPathAssignments,
  buildJsonPathOptions,
} from '@/entities/data/json-data';

import type { JsonStructureNode } from '@/shared/gatewayClient';
import { Button } from '@/shared/ui/primitives';

import {
  ACTION_DISABLED_REASONS,
  ACTION_TO_GROUP,
  buildAncestorMap,
  buildExpandedPathSet,
  getActionDisabledReason,
  type SchemaMappingActionKey,
  type SchemaMappingLayout,
} from './helpers';
import { MetaIcon, SplitLayoutIcon, TreeOnlyLayoutIcon } from './icons';
import { PathMappingPanel } from './PathMappingPanel';
import { SchemaMappingHelpDialog } from './SchemaMappingHelpDialog';
import { SchemaTree } from './SchemaTree';
import {
  HeaderActions,
  HeaderCopy,
  HeaderDescription,
  HeaderTitle,
  LayoutGrid,
  LayoutToggleWrap,
  MappingHeader,
  MappingSurface,
  TreeColumn,
} from './styled';
import { useJumpToNode } from './useJumpToNode';

export interface SchemaMappingValues {
  exclude_paths?: string[];
  explode_paths?: string[];
  keep_json_paths?: string[];
  meta_paths?: string[];
  record_path?: string;
}

interface SchemaMappingProps {
  isActionDisabled?: (
    path: string,
    action: SchemaMappingActionKey
  ) => boolean | undefined;
  nodeEmptyMessage: string;
  onClearActionGroup: (action: SchemaMappingActionKey) => void;
  root: JsonStructureNode | null | undefined;
  structureTruncated?: boolean | undefined;
  values: SchemaMappingValues;
  onClearAll: () => void;
  onToggleAction: (path: string, action: SchemaMappingActionKey) => void;
}

export const SchemaMapping = ({
  isActionDisabled,
  nodeEmptyMessage,
  onClearActionGroup,
  root,
  structureTruncated = false,
  values,
  onClearAll,
  onToggleAction,
}: SchemaMappingProps) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [layout, setLayout] = useState<SchemaMappingLayout>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selectedTreeActions, setSelectedTreeActions] = useState<
    Set<SchemaMappingActionKey>
  >(new Set<SchemaMappingActionKey>());

  const assignments = useMemo(() => buildJsonPathAssignments(values), [values]);
  const pathOptions = useMemo(() => buildJsonPathOptions(root), [root]);
  const ancestorMap = useMemo(() => buildAncestorMap(root), [root]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    if (!root?.path) {
      return new Set<string>();
    }

    return new Set<string>([root.path]);
  });

  useEffect(() => {
    if (!root?.path) {
      return;
    }

    setExpandedPaths(prev => {
      if (prev.size > 0) {
        return prev;
      }

      return new Set<string>([root.path]);
    });
  }, [root?.path]);

  const { highlightedId, jumpToNode, registerNodeRef } = useJumpToNode({
    ancestorMap,
    onExpandAncestors: (_path, ancestors) => {
      setExpandedPaths(prev => {
        const next = new Set(prev);

        ancestors.forEach(ancestor => next.add(ancestor));

        if (root?.path) {
          next.add(root.path);
        }

        return next;
      });
    },
  });

  const isActionActive = useCallback(
    (path: string, action: SchemaMappingActionKey) => {
      return (assignments[path] ?? []).includes(ACTION_TO_GROUP[action]);
    },
    [assignments]
  );

  const resolveActionDisabledReason = useCallback(
    (path: string, action: SchemaMappingActionKey) => {
      if (isActionDisabled?.(path, action)) {
        return ACTION_DISABLED_REASONS.unavailable;
      }

      return getActionDisabledReason({
        action,
        assignments,
        path,
      });
    },
    [assignments, isActionDisabled]
  );

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedPaths(buildExpandedPathSet(root));
  }, [root]);

  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(
      root?.path ? new Set<string>([root.path]) : new Set<string>()
    );
  }, [root?.path]);

  const handleActionFilterToggle = useCallback(
    (action: SchemaMappingActionKey) => {
      setSelectedTreeActions(prev => {
        const next = new Set(prev);

        if (next.has(action)) {
          next.delete(action);
        } else {
          next.add(action);
        }

        return next;
      });
    },
    []
  );

  const handleJumpToNode = (path: string) => {
    setSearchQuery('');
    setSelectedOnly(false);
    setSelectedTreeActions(new Set<SchemaMappingActionKey>());
    jumpToNode(path);
  };

  const handleRemoveAction = (path: string, action: SchemaMappingActionKey) => {
    if (!isActionActive(path, action)) {
      return;
    }

    onToggleAction(path, action);
  };

  return (
    <MappingSurface>
      <MappingHeader>
        <HeaderCopy>
          <HeaderTitle>Schema mapping</HeaderTitle>
          <HeaderDescription>
            Назначайте действия прямо на узлах дерева. Path mapping справа
            отражает те же значения и поддерживает быстрый jump-to.
          </HeaderDescription>
        </HeaderCopy>

        <HeaderActions>
          <Button
            size='xs'
            variant='outline'
            startIcon={<MetaIcon width={12} height={12} />}
            onClick={() => setHelpOpen(true)}
            sx={{
              minHeight: 30,
              px: 1.25,
              borderRadius: '7px',
              whiteSpace: 'nowrap',
            }}
          >
            Как работает нода
          </Button>

          <LayoutToggleWrap>
            <Button
              aria-pressed={layout === 'split'}
              size='xs'
              variant='ghost'
              startIcon={<SplitLayoutIcon width={12} height={12} />}
              onClick={() => setLayout('split')}
              sx={{
                minHeight: 30,
                px: 1.25,
                borderRadius: '7px',
                backgroundColor: layout === 'split' ? '#eef2ff' : 'transparent',
                color: layout === 'split' ? '#4f46e5' : '#6b7280',
                '&:hover': {
                  backgroundColor: layout === 'split' ? '#eef2ff' : '#f3f4f6',
                },
              }}
            >
              Split
            </Button>
            <Button
              aria-pressed={layout === 'tree'}
              size='xs'
              variant='ghost'
              startIcon={<TreeOnlyLayoutIcon width={12} height={12} />}
              onClick={() => setLayout('tree')}
              sx={{
                minHeight: 30,
                px: 1.25,
                borderRadius: '7px',
                backgroundColor: layout === 'tree' ? '#eef2ff' : 'transparent',
                color: layout === 'tree' ? '#4f46e5' : '#6b7280',
                '&:hover': {
                  backgroundColor: layout === 'tree' ? '#eef2ff' : '#f3f4f6',
                },
              }}
            >
              Tree only
            </Button>
          </LayoutToggleWrap>
        </HeaderActions>
      </MappingHeader>

      <LayoutGrid layout={layout}>
        <TreeColumn>
          <SchemaTree
            assignments={assignments}
            expandedPaths={expandedPaths}
            getActionDisabledReason={resolveActionDisabledReason}
            highlightedId={highlightedId}
            isActionActive={isActionActive}
            isTreeOnlyLayout={layout === 'tree'}
            nodeEmptyMessage={nodeEmptyMessage}
            onActionFilterToggle={handleActionFilterToggle}
            onClearAll={onClearAll}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            onJumpToNode={handleJumpToNode}
            onSearchQueryChange={setSearchQuery}
            onSelectedOnlyChange={setSelectedOnly}
            onToggleAction={onToggleAction}
            onToggleExpand={handleToggleExpand}
            registerNodeRef={registerNodeRef}
            root={root}
            searchQuery={searchQuery}
            selectedOnly={selectedOnly}
            selectedTreeActions={selectedTreeActions}
          />
        </TreeColumn>

        {layout === 'split' ? (
          <PathMappingPanel
            assignments={assignments}
            onClearAll={onClearAll}
            onClearGroupAction={onClearActionGroup}
            onJumpToNode={handleJumpToNode}
            onRemoveAction={handleRemoveAction}
            pathOptions={pathOptions}
          />
        ) : null}
      </LayoutGrid>

      <SchemaMappingHelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </MappingSurface>
  );
};
