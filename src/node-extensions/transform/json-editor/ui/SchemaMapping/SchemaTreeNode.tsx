import { memo } from 'react';

import {
  getJsonNodeKindLabel,
  type JsonPathGroupKey,
} from '@/entities/data/json-data';

import type { JsonStructureNode } from '@/shared/gatewayClient';
import { Badge, Button, IconButton, Tooltip } from '@/shared/ui/primitives';

import {
  ACTION_LABELS,
  ACTION_PALETTE,
  buildNodeSummaryText,
  getLastSegment,
  getNodeMode,
  type SchemaMappingActionKey,
} from './helpers';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExcludeIcon,
  ExplodeIcon,
  KeepIcon,
  MetaIcon,
  RecordIcon,
} from './icons';
import {
  ActionGroup,
  ActionGroupsWrap,
  ChevronSlot,
  KindText,
  LeftRail,
  NodeRow,
  PathFullText,
  PathHeader,
  PathPrimary,
  PathSegmentText,
  RowBody,
} from './styled';

const ACTION_ICONS: Record<SchemaMappingActionKey, typeof RecordIcon> = {
  record: RecordIcon,
  keep: KeepIcon,
  exclude: ExcludeIcon,
  meta: MetaIcon,
  explode: ExplodeIcon,
};

const MODE_RAIL_COLOR = {
  record: ACTION_PALETTE.record.active,
  keep: ACTION_PALETTE.keep.active,
  exclude: ACTION_PALETTE.exclude.active,
};

interface SchemaTreeNodeProps {
  depth: number;
  expanded: boolean;
  getActionDisabledReason: (
    path: string,
    action: SchemaMappingActionKey
  ) => string | null;
  groups: JsonPathGroupKey[];
  hasChildren: boolean;
  highlighted: boolean;
  isActionActive: (path: string, action: SchemaMappingActionKey) => boolean;
  node: JsonStructureNode;
  onJumpToNode: (path: string) => void;
  onToggleAction: (path: string, action: SchemaMappingActionKey) => void;
  onToggleExpand: (path: string) => void;
  registerNodeRef: (path: string) => (element: HTMLDivElement | null) => void;
}

const ACTION_GROUPS: Array<{
  actions: SchemaMappingActionKey[];
  divider?: boolean;
}> = [
  { actions: ['record', 'keep', 'exclude'], divider: true },
  { actions: ['meta', 'explode'] },
];

export const SchemaTreeNode = memo(
  ({
    depth,
    expanded,
    getActionDisabledReason,
    groups,
    hasChildren,
    highlighted,
    isActionActive,
    node,
    onJumpToNode,
    onToggleAction,
    onToggleExpand,
    registerNodeRef,
  }: SchemaTreeNodeProps) => {
    const mode = getNodeMode(groups);

    return (
      <NodeRow highlighted={highlighted} ref={registerNodeRef(node.path)}>
        <LeftRail {...(mode ? { railColor: MODE_RAIL_COLOR[mode] } : {})} />

        <RowBody depth={depth}>
          <ChevronSlot
            interactive={hasChildren}
            onClick={hasChildren ? () => onToggleExpand(node.path) : undefined}
          >
            {hasChildren ? (
              expanded ? (
                <ChevronDownIcon />
              ) : (
                <ChevronRightIcon />
              )
            ) : null}
          </ChevronSlot>

          <Button
            size='xs'
            variant='ghost'
            title={node.path}
            onClick={() => onJumpToNode(node.path)}
            sx={{
              flex: 1,
              minWidth: 0,
              justifyContent: 'flex-start',
              px: 0,
              py: 0,
              minHeight: 'auto',
              textAlign: 'left',
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <PathPrimary>
              <PathHeader>
                <PathSegmentText>{getLastSegment(node.path)}</PathSegmentText>
                <KindText>{getJsonNodeKindLabel(node.kind)}</KindText>
                {node.required ? (
                  <Badge
                    variant='success'
                    style={{
                      minHeight: 18,
                      border: 'none',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 500,
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      padding: '1px 7px',
                    }}
                  >
                    required
                  </Badge>
                ) : null}
                {typeof node.occurrences === 'number' ? (
                  <Badge
                    variant='default'
                    style={{
                      minHeight: 18,
                      border: 'none',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 500,
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      padding: '1px 7px',
                    }}
                  >
                    occ. {node.occurrences}
                  </Badge>
                ) : null}
              </PathHeader>

              <PathFullText title={node.path}>
                {buildNodeSummaryText(node)}
              </PathFullText>
            </PathPrimary>
          </Button>

          <ActionGroupsWrap>
            {ACTION_GROUPS.map(group => (
              <ActionGroup
                key={group.actions.join(':')}
                {...(group.divider ? { withDivider: true } : {})}
              >
                {group.actions.map(action => {
                  const Icon = ACTION_ICONS[action];
                  const palette = ACTION_PALETTE[action];
                  const active = isActionActive(node.path, action);
                  const disabledReason = getActionDisabledReason(
                    node.path,
                    action
                  );
                  const disabled = disabledReason != null;

                  return (
                    <Tooltip
                      key={action}
                      title={disabledReason ?? ACTION_LABELS[action]}
                    >
                      <span>
                        <IconButton
                          aria-label={`${ACTION_LABELS[action]} ${node.path}`}
                          disabled={disabled}
                          size='xs'
                          variant='outline'
                          onClick={() => onToggleAction(node.path, action)}
                          sx={{
                            width: 26,
                            minWidth: 26,
                            height: 26,
                            minHeight: 26,
                            borderRadius: '7px',
                            p: 0,
                            backgroundColor: active
                              ? palette.active
                              : '#ffffff',
                            border: active
                              ? '1px solid transparent'
                              : '1px solid #f3f4f6',
                            color: active
                              ? '#ffffff'
                              : disabled
                                ? '#d1d5db'
                                : '#9ca3af',
                            opacity: disabled ? 0.4 : 1,
                            boxShadow: 'none',
                            '&:hover': disabled
                              ? {}
                              : {
                                  backgroundColor: active
                                    ? palette.active
                                    : '#f9fafb',
                                  borderColor: active
                                    ? 'transparent'
                                    : '#e5e7eb',
                                  color: active ? '#ffffff' : '#4b5563',
                                  boxShadow: 'none',
                                },
                            '&:disabled': {
                              opacity: 0.4,
                              cursor: 'not-allowed',
                              color: '#d1d5db',
                              backgroundColor: '#ffffff',
                              borderColor: '#f3f4f6',
                            },
                            '& svg': {
                              width: 11,
                              height: 11,
                            },
                          }}
                        >
                          <Icon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })}
              </ActionGroup>
            ))}
          </ActionGroupsWrap>
        </RowBody>
      </NodeRow>
    );
  }
);

SchemaTreeNode.displayName = 'SchemaTreeNode';
