import type {
  JsonPathAssignments,
  JsonPathGroupKey,
  JsonPathOption,
} from '@/entities/data/json-data';

import { Button } from '@/shared/ui/primitives';

import {
  ACTION_TO_GROUP,
  buildActionEntries,
  type SchemaMappingActionKey,
} from './helpers';
import { PathMappingGroup } from './PathMappingGroup';
import {
  MappingDescription,
  MappingHeaderCopy,
  MappingList,
  MappingPanelHeader,
  MappingPanelWrap,
  MappingTitle,
} from './styled';

const ACTIONS: SchemaMappingActionKey[] = [
  'record',
  'keep',
  'exclude',
  'meta',
  'explode',
];

interface PathMappingPanelProps {
  assignments: JsonPathAssignments;
  onClearAll: () => void;
  onClearGroupAction: (action: SchemaMappingActionKey) => void;
  onJumpToNode: (path: string) => void;
  onRemoveAction: (path: string, action: SchemaMappingActionKey) => void;
  pathOptions: JsonPathOption[];
}

export const PathMappingPanel = ({
  assignments,
  onClearAll,
  onClearGroupAction,
  onJumpToNode,
  onRemoveAction,
  pathOptions,
}: PathMappingPanelProps) => {
  const uniquePathsCount = Object.keys(assignments).length;
  const entriesByAction = ACTIONS.map(action => ({
    action,
    entries: buildActionEntries({
      action,
      assignments,
      pathOptions,
    }),
  }));

  return (
    <MappingPanelWrap>
      <MappingPanelHeader>
        <MappingHeaderCopy>
          <MappingTitle>Path mapping</MappingTitle>
          <MappingDescription>
            {uniquePathsCount} путей · клик = переход к узлу
          </MappingDescription>
        </MappingHeaderCopy>

        {uniquePathsCount > 0 ? (
          <Button size='xs' variant='link' onClick={onClearAll}>
            Очистить
          </Button>
        ) : null}
      </MappingPanelHeader>

      <MappingList>
        {entriesByAction.map(({ action, entries }) => {
          const field = ACTION_TO_GROUP[action] as JsonPathGroupKey;

          return (
            <PathMappingGroup
              key={field}
              action={action}
              entries={entries}
              field={field}
              onClearGroupAction={onClearGroupAction}
              onJumpToNode={onJumpToNode}
              onRemoveAction={onRemoveAction}
            />
          );
        })}
      </MappingList>
    </MappingPanelWrap>
  );
};
