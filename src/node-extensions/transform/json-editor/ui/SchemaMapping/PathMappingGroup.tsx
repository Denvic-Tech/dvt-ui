import { useState } from 'react';

import type { JsonPathGroupKey } from '@/entities/data/json-data';

import { Button, IconButton, Tooltip } from '@/shared/ui/primitives';

import {
  ACTION_LABELS,
  ACTION_PALETTE,
  GROUP_LABELS,
  type SchemaAssignedPathEntry,
  type SchemaMappingActionKey,
} from './helpers';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  ExcludeIcon,
  ExplodeIcon,
  KeepIcon,
  MetaIcon,
  RecordIcon,
} from './icons';
import {
  ActionIconTile,
  CountPill,
  MappingFieldName,
  MappingGroupBody,
  MappingGroupCard,
  MappingGroupHeader,
  MappingGroupHeaderActions,
  MappingGroupHeaderMain,
  PathListButtonContent,
  PathListItem,
  PathListPath,
  PathListSegment,
} from './styled';

const ACTION_ICONS: Record<SchemaMappingActionKey, typeof RecordIcon> = {
  record: RecordIcon,
  keep: KeepIcon,
  exclude: ExcludeIcon,
  meta: MetaIcon,
  explode: ExplodeIcon,
};

interface PathMappingGroupProps {
  action: SchemaMappingActionKey;
  entries: SchemaAssignedPathEntry[];
  field: JsonPathGroupKey;
  onClearGroupAction: (action: SchemaMappingActionKey) => void;
  onJumpToNode: (path: string) => void;
  onRemoveAction: (path: string, action: SchemaMappingActionKey) => void;
}

export const PathMappingGroup = ({
  action,
  entries,
  field,
  onClearGroupAction,
  onJumpToNode,
  onRemoveAction,
}: PathMappingGroupProps) => {
  const palette = ACTION_PALETTE[action];
  const Icon = ACTION_ICONS[action];
  const fieldLabel = GROUP_LABELS[field];
  const hasItems = entries.length > 0;
  const [open, setOpen] = useState(true);

  return (
    <MappingGroupCard
      borderColor={hasItems ? palette.borderLight : '#f3f4f6'}
      hasItems={hasItems}
      open={open}
    >
      <MappingGroupHeader
        hasItems={hasItems && open}
        backgroundColor={hasItems ? palette.bgLight : '#fafbfc'}
        borderColor={palette.borderLight}
      >
        <MappingGroupHeaderMain>
          <ActionIconTile color={palette.active}>
            <Icon />
          </ActionIconTile>
          <MappingFieldName color={hasItems ? palette.text : '#9ca3af'}>
            {fieldLabel}
          </MappingFieldName>
        </MappingGroupHeaderMain>

        <MappingGroupHeaderActions>
          <CountPill color={hasItems ? palette.active : '#e5e7eb'}>
            {entries.length}
          </CountPill>

          {hasItems ? (
            <>
              <Tooltip title={`Очистить: ${fieldLabel}`}>
                <span>
                  <IconButton
                    aria-label={`clear ${fieldLabel}`}
                    size='xs'
                    variant='ghost'
                    onClick={() => onClearGroupAction(action)}
                    sx={{
                      width: 20,
                      minWidth: 20,
                      height: 20,
                      minHeight: 20,
                      color: '#6b7280',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.55)',
                        color: '#111827',
                      },
                      '& svg': {
                        width: 11,
                        height: 11,
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <IconButton
                aria-label={`${open ? 'collapse' : 'expand'} ${fieldLabel}`}
                size='xs'
                variant='ghost'
                onClick={() => setOpen(current => !current)}
                sx={{
                  width: 20,
                  minWidth: 20,
                  height: 20,
                  minHeight: 20,
                  color: '#6b7280',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    color: '#111827',
                  },
                  '& svg': {
                    width: 12,
                    height: 12,
                  },
                }}
              >
                {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </IconButton>
            </>
          ) : null}
        </MappingGroupHeaderActions>
      </MappingGroupHeader>

      {hasItems && open ? (
        <MappingGroupBody>
          {entries.map(entry => (
            <PathListItem key={`${field}:${entry.path}`}>
              <Button
                size='xs'
                variant='ghost'
                title={entry.path}
                onClick={() => onJumpToNode(entry.path)}
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
                <PathListButtonContent>
                  <PathListSegment>{entry.lastSegment}</PathListSegment>
                  <PathListPath>{entry.path}</PathListPath>
                </PathListButtonContent>
              </Button>

              <Tooltip title={`Убрать: ${ACTION_LABELS[action]}`}>
                <span>
                  <IconButton
                    aria-label={`remove ${ACTION_LABELS[action]} ${entry.path}`}
                    size='xs'
                    variant='ghost'
                    onClick={() => onRemoveAction(entry.path, action)}
                    sx={{
                      width: 18,
                      minWidth: 18,
                      height: 18,
                      minHeight: 18,
                      color: '#9ca3af',
                      '&:hover': {
                        backgroundColor: '#e5e7eb',
                        color: '#4b5563',
                      },
                      '& svg': {
                        width: 10,
                        height: 10,
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </PathListItem>
          ))}
        </MappingGroupBody>
      ) : null}
    </MappingGroupCard>
  );
};
