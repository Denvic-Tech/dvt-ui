import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Box, Stack, styled, Typography } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';

import type {
  JsonFlattenCandidateKind,
  JsonStructureNode,
} from '@/shared/gatewayClient';
import { Chip } from '@/shared/ui/primitives';

import {
  filterJsonStructure,
  flattenJsonStructure,
  getJsonNodeKindLabel,
  getJsonNodeSummary,
  getJsonStructureChildren,
  type JsonPathAssignments,
  type JsonPathGroupKey,
} from '../model/metadata';

const buildTreeItemId = (path: string): string => `json:${path || '$'}`;

type JsonNodeMode = 'exclude' | 'keep' | 'record' | null;

const MODE_RAIL_COLORS: Record<Exclude<JsonNodeMode, null>, string> = {
  record: '#8b5cf6',
  keep: '#10b981',
  exclude: '#ef4444',
};

const TreeList = styled(SimpleTreeView)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  border: '1px solid #f3f4f6',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
}));

const PathText = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  wordBreak: 'break-all',
}));

const KindText = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 11,
  color: '#9ca3af',
  textTransform: 'lowercase',
}));

const MetaText = styled(Typography)(() => ({
  fontSize: 11,
  color: '#9ca3af',
  wordBreak: 'break-word',
}));

const StatusChip = ({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'neutral' | 'success';
}) => (
  <Chip
    size='small'
    variant={variant}
    sx={{
      height: 20,
      border: 'none',
      borderRadius: '999px',
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: variant === 'success' ? '#d1fae5' : '#f3f4f6',
      color: variant === 'success' ? '#059669' : '#4b5563',
      '& .MuiChip-label': {
        px: 1,
      },
    }}
  >
    {children}
  </Chip>
);

const getJsonNodeMode = (groups: JsonPathGroupKey[]): JsonNodeMode => {
  if (groups.includes('exclude_paths')) {
    return 'exclude';
  }

  if (groups.includes('keep_json_paths')) {
    return 'keep';
  }

  if (groups.includes('record_path')) {
    return 'record';
  }

  return null;
};

const buildJsonNodeMeta = ({
  node,
}: {
  node: JsonStructureNode;
}): string | null => {
  const parts = [
    node.nullable ? 'nullable' : null,
    getJsonNodeSummary(node),
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(' · ') : null;
};

const ChevronRightIcon = () => <LuChevronRight size={13} />;
const ChevronDownIcon = () => <LuChevronDown size={13} />;

type JsonTreeNodeLabelProps = {
  node: JsonStructureNode;
  onPathSelect: ((node: JsonStructureNode) => void) | undefined;
  renderActions?: ((node: JsonStructureNode) => ReactNode) | undefined;
};

const JsonTreeNodeLabel = ({
  node,
  onPathSelect,
  renderActions,
}: JsonTreeNodeLabelProps) => {
  const meta = buildJsonNodeMeta({ node });

  return (
    <Box
      role={onPathSelect ? 'button' : undefined}
      tabIndex={onPathSelect ? 0 : -1}
      onClick={() => onPathSelect?.(node)}
      onKeyDown={event => {
        if (!onPathSelect) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPathSelect(node);
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        minWidth: 0,
        cursor: onPathSelect ? 'pointer' : 'default',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction='row'
          alignItems='center'
          flexWrap='wrap'
          gap={0.75}
          sx={{ minWidth: 0 }}
        >
          <PathText>{node.display_path || node.path || node.name}</PathText>
          <KindText>{getJsonNodeKindLabel(node.kind)}</KindText>
          {node.required ? (
            <StatusChip variant='success'>required</StatusChip>
          ) : null}
          {typeof node.occurrences === 'number' ? (
            <StatusChip variant='neutral'>occ. {node.occurrences}</StatusChip>
          ) : null}
        </Stack>

        {meta ? <MetaText sx={{ mt: 0.35 }}>{meta}</MetaText> : null}
      </Box>

      {renderActions ? (
        <Box
          onClick={event => event.stopPropagation()}
          sx={{ flexShrink: 0, alignSelf: 'center' }}
        >
          {renderActions(node)}
        </Box>
      ) : null}
    </Box>
  );
};

type JsonTreeItemProps = {
  assignments: JsonPathAssignments;
  depth: number;
  node: JsonStructureNode;
  onPathSelect: ((node: JsonStructureNode) => void) | undefined;
  renderActions?: ((node: JsonStructureNode) => ReactNode) | undefined;
};

const JsonTreeItem = ({
  assignments,
  depth,
  node,
  onPathSelect,
  renderActions,
}: JsonTreeItemProps) => {
  const children = getJsonStructureChildren(node);
  const groups = assignments[node.path] ?? [];
  const mode = getJsonNodeMode(groups);

  return (
    <TreeItem
      itemId={buildTreeItemId(node.path)}
      label={
        <JsonTreeNodeLabel
          node={node}
          onPathSelect={onPathSelect}
          renderActions={renderActions}
        />
      }
      sx={{
        '--json-tree-rail-color': mode ? MODE_RAIL_COLORS[mode] : 'transparent',
        '& .MuiTreeItem-content': {
          position: 'relative',
          minHeight: 0,
          py: '10px',
          pr: '12px',
          pl: `${12 + depth * 20}px`,
          borderRadius: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f3f4f6',
          alignItems: 'center',
          transition: 'background-color 150ms ease',
          margin: 0,
          paddingTop: '10px',
          paddingBottom: '10px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '3px',
            backgroundColor: 'var(--json-tree-rail-color)',
            transition: 'background-color 150ms ease',
          },
          '&:hover': {
            backgroundColor: '#fafbfc',
          },
          '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
            backgroundColor: '#ffffff',
          },
          '&:last-child': {
            borderBottom: 'none',
          },
        },
        '& .MuiTreeItem-iconContainer': {
          width: 16,
          minWidth: 16,
          height: 16,
          ml: 0,
          mr: 1.5,
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        },
        '& .MuiTreeItem-label': {
          width: '100%',
          p: 0,
        },
        '& .MuiTreeItem-groupTransition': {
          ml: 0,
          pl: 0,
          borderLeft: 'none',
        },
      }}
    >
      {children.map(child => (
        <JsonTreeItem
          key={child.path}
          assignments={assignments}
          depth={depth + 1}
          node={child}
          onPathSelect={onPathSelect}
          renderActions={renderActions}
        />
      ))}
    </TreeItem>
  );
};

export interface JsonStructureTreeProps {
  activePath?: string | null;
  candidateKindsByPath?: Record<string, JsonFlattenCandidateKind[]>;
  conflictPaths?: string[];
  emptyMessage?: string;
  onPathSelect?: (node: JsonStructureNode) => void;
  pathAssignments?: JsonPathAssignments;
  renderActions?: (node: JsonStructureNode) => ReactNode;
  root: JsonStructureNode | null | undefined;
  searchQuery?: string;
}

export const JsonStructureTree = ({
  candidateKindsByPath: _candidateKindsByPath,
  conflictPaths: _conflictPaths,
  emptyMessage = 'JSON structure is not available.',
  onPathSelect,
  pathAssignments,
  renderActions,
  root,
  searchQuery = '',
}: JsonStructureTreeProps) => {
  const filteredRoot = useMemo(() => {
    return filterJsonStructure(root, searchQuery);
  }, [root, searchQuery]);
  const assignments = pathAssignments ?? {};

  const allExpandedItems = useMemo(() => {
    if (!filteredRoot) {
      return [];
    }

    return flattenJsonStructure(filteredRoot).map(({ node }) =>
      buildTreeItemId(node.path)
    );
  }, [filteredRoot]);

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    if (!filteredRoot) {
      setExpandedItems([]);
      return;
    }

    const rootItemId = buildTreeItemId(filteredRoot.path);

    if (searchQuery.trim()) {
      setExpandedItems(allExpandedItems);
      return;
    }

    setExpandedItems(current => (current.length > 0 ? current : [rootItemId]));
  }, [allExpandedItems, filteredRoot, searchQuery]);

  if (!filteredRoot) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography color='text.secondary' sx={{ fontSize: 13 }}>
          {searchQuery.trim() ? 'Совпадения не найдены.' : emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <TreeList
      expandedItems={expandedItems}
      onExpandedItemsChange={(_, itemIds) => setExpandedItems(itemIds)}
      expansionTrigger='iconContainer'
      slots={{
        collapseIcon: ChevronDownIcon,
        expandIcon: ChevronRightIcon,
      }}
      itemChildrenIndentation={0}
      sx={{
        '& .MuiTreeItem-root': {
          m: 0,
        },
        '& .MuiTreeItem-groupTransition': {
          m: 0,
          p: 0,
        },
        '& .MuiTreeItem-root:last-of-type > .MuiTreeItem-content': {
          borderBottom: 'none',
        },
      }}
    >
      <JsonTreeItem
        assignments={assignments}
        depth={0}
        node={filteredRoot}
        onPathSelect={onPathSelect}
        renderActions={renderActions}
      />
    </TreeList>
  );
};
