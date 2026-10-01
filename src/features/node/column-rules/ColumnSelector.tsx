import { useMemo, useState } from 'react';
import { Typography } from '@mui/material';

import type { Column } from '@/shared/gatewayClient';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/primitives';
import {
  TokenCombobox,
  type TokenOption,
} from '@/shared/ui/primitives/components/token-combobox';

import { maskMatches, type Token, tokenLabel } from './model';

const option = (token: Token): TokenOption => ({
  value: JSON.stringify(token),
  label: tokenLabel(token),
});
export function ColumnSelector({
  columns,
  value,
  onChange,
  exactOnly = false,
  label = 'Колонки',
}: {
  columns: Column[];
  value: Token[];
  onChange: (value: Token[]) => void;
  exactOnly?: boolean;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const matches = useMemo(
    () =>
      columns.filter(column =>
        /[*?]/.test(query)
          ? maskMatches(query, column.name)
          : column.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      ),
    [columns, query]
  );
  const selected = columns.filter(column =>
    value.some(
      token =>
        token.kind === 'all' ||
        (token.kind === 'mask'
          ? maskMatches(token.value, column.name)
          : token.value === column.name)
    )
  );
  const options: TokenOption[] = [];
  if (!exactOnly && (!query || query === '*'))
    options.push(option({ kind: 'all', value: '' }));
  if (!exactOnly && query && query !== '*' && /[*?]/.test(query)) {
    options.push({
      ...option({ kind: 'mask', value: query }),
      actionLabel: 'Добавить маску «' + query + '»',
      description:
        'Сейчас найдено: ' +
        matches.length +
        '. Выбор обновляется при запуске.',
    });
  }
  if (
    query &&
    !/[*?]/.test(query) &&
    !columns.some(column => column.name === query)
  ) {
    options.push({
      ...option({ kind: 'name', value: query }),
      actionLabel: 'Добавить имя «' + query + '»',
    });
  }
  options.push(
    ...matches.slice(0, 100).map(column => ({
      ...option({ kind: 'name', value: column.name }),
      description: column.dtype,
    }))
  );
  return (
    <>
      <TokenCombobox
        label={label}
        value={value.map(option)}
        options={options}
        query={query}
        onQueryChange={setQuery}
        onChange={next =>
          onChange(next.map(item => JSON.parse(item.value) as Token))
        }
      />
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger>
          <Button variant='link' size='xs'>
            Выбрано {selected.length} колонок
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Typography variant='caption' sx={{ overflowWrap: 'anywhere' }}>
            {selected.map(column => column.name).join(', ') ||
              'Нет совпадений по текущей схеме'}
          </Typography>
          <Button
            variant='ghost'
            size='xs'
            onClick={() =>
              onChange([
                ...value.filter(
                  token =>
                    token.kind !== 'name' ||
                    !matches.some(column => column.name === token.value)
                ),
                ...matches.map(column => ({
                  kind: 'name' as const,
                  value: column.name,
                })),
              ])
            }
          >
            Выбрать все найденные ({matches.length})
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
