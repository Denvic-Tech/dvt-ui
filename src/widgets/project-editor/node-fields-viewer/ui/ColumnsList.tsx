import { memo, type RefObject } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import {
  isFieldChanged,
  LINEAGE_OP_APPEARANCE,
  type NodeField,
} from '@/entities/data/lineage';

import {
  ColumnRowButton,
  GroupBlock,
  GroupHeader,
  Highlight,
  ListMessage,
  ListPane,
  ListScroll,
  RowDot,
  RowMeta,
  RowName,
  RowsStack,
  SearchField,
  SearchInput,
} from './NodeFieldsViewer.styles';

export interface ColumnsGroup {
  id: 'changed' | 'same';
  title: string;
  items: NodeField[];
}

const HighlightedName = ({ name, query }: { name: string; query: string }) => {
  const needle = query.trim().toLowerCase();
  const index = needle ? name.toLowerCase().indexOf(needle) : -1;

  if (index < 0) {
    return <>{name}</>;
  }

  return (
    <>
      {name.slice(0, index)}
      <Highlight>{name.slice(index, index + needle.length)}</Highlight>
      {name.slice(index + needle.length)}
    </>
  );
};

interface ColumnRowProps {
  field: NodeField;
  active: boolean;
  query: string;
  type: string | undefined;
  onSelect: (name: string) => void;
}

const ColumnRow = memo(
  ({ field, active, query, type, onSelect }: ColumnRowProps) => {
    const changed = isFieldChanged(field);
    const appearance = LINEAGE_OP_APPEARANCE[field.op];

    return (
      <ColumnRowButton
        type='button'
        active={active}
        data-col={field.name}
        aria-current={active ? 'true' : undefined}
        title={changed ? appearance.label : undefined}
        data-testid='widgets/node-fields-viewer/column-row'
        onClick={() => onSelect(field.name)}
      >
        <RowDot changed={changed} />
        <RowName active={active} changed={changed}>
          <HighlightedName name={field.name} query={query} />
        </RowName>
        {changed ? (
          <RowMeta dim={false}>{appearance.change}</RowMeta>
        ) : type ? (
          <RowMeta dim>{type}</RowMeta>
        ) : null}
      </ColumnRowButton>
    );
  }
);
ColumnRow.displayName = 'ColumnRow';

interface ColumnsListProps {
  groups: ColumnsGroup[];
  query: string;
  selected: string | null;
  columnTypes: ReadonlyMap<string, string>;
  searchRef: RefObject<HTMLInputElement>;
  listRef: RefObject<HTMLDivElement>;
  onQueryChange: (query: string) => void;
  onSelect: (name: string) => void;
}

const ColumnsListComponent = ({
  groups,
  query,
  selected,
  columnTypes,
  searchRef,
  listRef,
  onQueryChange,
  onSelect,
}: ColumnsListProps) => (
  <ListPane>
    <SearchField>
      <SearchRoundedIcon sx={{ fontSize: 16 }} />
      <SearchInput
        ref={searchRef}
        value={query}
        placeholder='Поиск по имени или описанию'
        aria-label='Поиск колонок'
        onChange={event => onQueryChange(event.target.value)}
      />
    </SearchField>
    <ListScroll ref={listRef}>
      {groups.map(group => (
        <GroupBlock key={group.id}>
          <GroupHeader>
            {group.title}
            <span>{group.items.length}</span>
          </GroupHeader>
          <RowsStack>
            {group.items.map(field => (
              <ColumnRow
                key={field.ref.key}
                field={field}
                query={query}
                type={columnTypes.get(field.name)}
                active={field.name === selected}
                onSelect={onSelect}
              />
            ))}
          </RowsStack>
        </GroupBlock>
      ))}
      {!groups.length ? (
        <ListMessage>
          Ничего не найдено{query.trim() ? ` по «${query.trim()}»` : ''}
        </ListMessage>
      ) : null}
    </ListScroll>
  </ListPane>
);

export const ColumnsList = memo(ColumnsListComponent);
