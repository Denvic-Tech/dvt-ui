import { memo } from 'react';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { Column, InputDefinitionModel } from '@/shared/gatewayClient';

type ColumnNameValue<IsMultiple extends boolean> = IsMultiple extends true
  ? string[]
  : string | undefined | null;

interface ColumnNameNodeInputProps<IsMultiple extends boolean = boolean> {
  inputDefinition: InputDefinitionModel & { is_list_type: IsMultiple };
  currentValue: ColumnNameValue<IsMultiple> | undefined;
  onChange: (value: ColumnNameValue<IsMultiple>) => void;
  columns?: Column[];
  hasMetadata?: boolean;
}

function ColumnNameNodeInput<IsMultiple extends boolean>(
  props: ColumnNameNodeInputProps<IsMultiple>
) {
  const {
    inputDefinition,
    currentValue,
    onChange,
    columns = [],
    hasMetadata = true,
  } = props;

  const allowNewColumnNames = Boolean(inputDefinition.allow_new);

  const normalizeSingleValue = (value: string | undefined): string | null => {
    const nextValue = value?.trim();
    if (!nextValue) {
      return null;
    }
    return nextValue;
  };

  const normalizeMultipleValues = (values: string[]): string[] =>
    Array.from(
      new Set(values.map(value => value.trim()).filter(value => value !== ''))
    );

  const noOptionsText = allowNewColumnNames
    ? 'Введите новое имя колонки...'
    : hasMetadata
      ? 'Не найдены столбцы во входном DataFrame...'
      : 'Не найдены метаданные входящего DataFrame...';

  if (inputDefinition.is_list_type) {
    return (
      <ColumnDropdownSelect
        multiple
        columns={columns}
        value={(currentValue as string[]) ?? []}
        onChange={nextValue => {
          const normalizedValue = allowNewColumnNames
            ? normalizeMultipleValues(nextValue)
            : nextValue;
          onChange(normalizedValue as ColumnNameValue<IsMultiple>);
        }}
        noOptionText={noOptionsText}
        allowNew={allowNewColumnNames}
      />
    );
  }

  return (
    <ColumnDropdownSelect
      columns={columns}
      value={(currentValue as string | null) ?? ''}
      onChange={nextValue => {
        const normalizedValue = normalizeSingleValue(nextValue);
        onChange(normalizedValue as ColumnNameValue<IsMultiple>);
      }}
      noOptionText={noOptionsText}
      allowNew={allowNewColumnNames}
    />
  );
}

export default memo(ColumnNameNodeInput);
