import { useMemo } from 'react';

import type { DbColumn } from '@/shared/gatewayClient';
import { LinkButton } from '@/shared/ui/clean-minimal/controls';
import { CheckIcon } from '@/shared/ui/clean-minimal/icons';

import {
  ColumnRow,
  ColumnsBox,
  ColumnsEmpty,
  ColumnsHead,
  ColumnsList,
} from './SettingsPane.styles';

type ColumnsTabProps = {
  columns: readonly DbColumn[];
  selectedColumns: readonly string[] | null | undefined;
  query: string;
  onToggle: (columnName: string) => void;
  onSetSelected: (columnNames: string[]) => void;
};

export const ColumnsTab = ({
  columns,
  selectedColumns,
  query,
  onToggle,
  onSetSelected,
}: ColumnsTabProps) => {
  const selected = useMemo(
    () => new Set(selectedColumns ?? []),
    [selectedColumns]
  );
  const selectedCount = columns.filter(column =>
    selected.has(column.name)
  ).length;
  const visibleColumns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return columns;
    return columns.filter(column =>
      column.name.toLowerCase().includes(normalized)
    );
  }, [columns, query]);

  return (
    <ColumnsBox data-testid='node-extensions/extract/read-table-from-db-v3/columns-tab'>
      <ColumnsHead>
        <span>
          Выбрано {selectedCount} из {columns.length}
        </span>
        <LinkButton
          type='button'
          disabled={selectedCount === columns.length}
          onClick={() => onSetSelected(columns.map(column => column.name))}
        >
          Выбрать все
        </LinkButton>
        <LinkButton
          type='button'
          disabled={selectedCount === 0}
          onClick={() => onSetSelected([])}
        >
          Снять все
        </LinkButton>
      </ColumnsHead>
      <ColumnsList role='group' aria-label='Колонки таблицы'>
        {visibleColumns.map(column => {
          const checked = selected.has(column.name);
          return (
            <ColumnRow
              key={column.name}
              type='button'
              role='checkbox'
              aria-checked={checked}
              title={column.comment ?? undefined}
              onClick={() => onToggle(column.name)}
            >
              <span className='column-check'>
                {checked ? <CheckIcon /> : null}
              </span>
              <span className='column-label'>
                <span className='column-name'>{column.name}</span>
                {column.comment?.trim() ? (
                  <span className='column-comment'>{column.comment}</span>
                ) : null}
              </span>
              <span className='column-type'>{column.dtype}</span>
            </ColumnRow>
          );
        })}
        {visibleColumns.length === 0 ? (
          <ColumnsEmpty>Ничего не найдено</ColumnsEmpty>
        ) : null}
      </ColumnsList>
    </ColumnsBox>
  );
};
