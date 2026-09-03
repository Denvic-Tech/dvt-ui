import { Button } from '@/shared/ui/primitives';

import {
  ACTION_PALETTE,
  getPrimaryAction,
  type SchemaAssignedPathEntry,
} from './helpers';
import {
  ExcludeIcon,
  ExplodeIcon,
  KeepIcon,
  MetaIcon,
  RecordIcon,
} from './icons';
import {
  ChipExtraCount,
  ChipIconBox,
  ChipText,
  SelectedChipsRow,
  SelectedHeader,
  SelectedItem,
  SelectedItemContent,
  SelectedItemPath,
  SelectedLabel,
  SelectedWrap,
} from './styled';

const ACTION_ICONS = {
  record: RecordIcon,
  keep: KeepIcon,
  exclude: ExcludeIcon,
  meta: MetaIcon,
  explode: ExplodeIcon,
};

interface SelectedChipsProps {
  entries: SchemaAssignedPathEntry[];
  onClearAll: () => void;
  onJumpToNode: (path: string) => void;
}

export const SelectedChips = ({
  entries,
  onClearAll,
  onJumpToNode,
}: SelectedChipsProps) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <SelectedWrap>
      <SelectedHeader>
        <SelectedLabel>Выбрано: {entries.length}</SelectedLabel>
        <Button size='xs' variant='link' onClick={onClearAll}>
          очистить
        </Button>
      </SelectedHeader>

      <SelectedChipsRow>
        {entries.map(entry => {
          const action = getPrimaryAction(entry.groups);

          if (!action) {
            return null;
          }

          const Icon = ACTION_ICONS[action];
          const palette = ACTION_PALETTE[action];
          const extraCount = Math.max(entry.actions.length - 1, 0);

          return (
            <SelectedItem
              key={entry.path}
              backgroundColor={palette.bgLight}
              borderColor={palette.borderLight}
              title={entry.path}
              onClick={() => onJumpToNode(entry.path)}
            >
              <ChipIconBox color={palette.active}>
                <Icon />
              </ChipIconBox>
              <SelectedItemContent>
                <ChipText>{entry.lastSegment}</ChipText>
                <SelectedItemPath>{entry.path}</SelectedItemPath>
              </SelectedItemContent>
              {extraCount > 0 ? (
                <ChipExtraCount>+{extraCount}</ChipExtraCount>
              ) : null}
            </SelectedItem>
          );
        })}
      </SelectedChipsRow>
    </SelectedWrap>
  );
};
