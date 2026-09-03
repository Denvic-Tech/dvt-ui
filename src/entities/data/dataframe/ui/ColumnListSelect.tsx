import { useDeferredValue, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import {
  alpha,
  Box,
  ListItemButton,
  Skeleton,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import { Virtuoso } from 'react-virtuoso';

import type { Column } from '@/shared/gatewayClient';

import { ColumnOptionRow } from './ColumnOptionRow';
import { filterColumnsByQuery } from './columnSelectUtils';

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
const VIRTUALIZATION_THRESHOLD = 80;
const VIRTUALIZED_OVERSCAN_PX = 72;
const COLUMN_ITEM_HEIGHT = 36;

const Container = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
});

const SearchRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
});

const SearchInputWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  flex: 1,
  minWidth: 0,
  '& svg': {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 17,
    color: theme.palette.text.disabled,
    pointerEvents: 'none',
  },
}));

const SearchInput = styled('input', {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ theme, hasError }) => ({
  width: '100%',
  height: 36,
  padding: '0 12px 0 36px',
  border: `1px solid ${
    hasError ? theme.palette.error.main : theme.palette.divider
  }`,
  borderRadius: 8,
  fontSize: '0.75rem',
  backgroundColor: alpha(theme.palette.common.black, 0.025),
  color: theme.palette.text.primary,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
  '&::placeholder': {
    color: theme.palette.text.disabled,
    opacity: 1,
  },
  '&:focus': {
    borderColor: hasError ? theme.palette.error.main : theme.palette.grey[400],
    boxShadow: 'none',
  },
  '&:disabled': {
    cursor: 'not-allowed',
    color: theme.palette.text.disabled,
  },
}));

const SelectionCount = styled(Typography)(({ theme }) => ({
  flexShrink: 0,
  color: theme.palette.text.secondary,
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.75rem',
  fontWeight: 600,
}));

const ListFrame = styled(Box, {
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>(({ theme, hasError }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  border: `1px solid ${
    hasError ? theme.palette.error.main : theme.palette.divider
  }`,
  borderRadius: 10,
  backgroundColor: theme.palette.background.paper,
}));

const OptionsList = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
});

const OptionButton = styled(ListItemButton, {
  shouldForwardProp: prop => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '7px 14px',
  border: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  backgroundColor: isSelected
    ? alpha(theme.palette.primary.main, 0.035)
    : 'transparent',
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: isSelected
      ? alpha(theme.palette.primary.main, 0.065)
      : alpha(theme.palette.common.black, 0.025),
  },
  '&.Mui-disabled': {
    cursor: 'not-allowed',
    opacity: 0.55,
  },
}));

const SelectAllRow = styled(OptionButton)(({ theme }) => ({
  height: 36,
  minHeight: 36,
  flexGrow: 0,
  flexShrink: 0,
  backgroundColor: alpha(theme.palette.common.black, 0.025),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.04),
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 96,
  padding: 24,
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}));

export interface ColumnListSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  mode?: 'action' | 'select';
  onItemClick?: (column: Column) => void;
  columns: Column[];
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  noOptionText?: string;
}

export const ColumnListSelect = ({
  value,
  onChange,
  mode = 'select',
  onItemClick,
  columns,
  loading = false,
  disabled = false,
  error = false,
  placeholder = 'Поиск колонок...',
  noOptionText,
}: ColumnListSelectProps) => {
  const [query, setQuery] = useState('');
  const selectedValues = value;
  const deferredQuery = useDeferredValue(query);
  const selectedValueSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );

  const filteredColumns = useMemo(
    () => filterColumnsByQuery(columns, deferredQuery),
    [columns, deferredQuery]
  );
  const shouldVirtualize = filteredColumns.length >= VIRTUALIZATION_THRESHOLD;

  const selectedCount = selectedValues.length;
  const totalCount = columns.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const partiallySelected = selectedCount > 0 && !allSelected;

  const handleToggleColumn = (columnName: string) => {
    if (disabled) {
      return;
    }

    const column = columns.find(item => item.name === columnName);
    if (mode === 'action') {
      if (column) {
        onItemClick?.(column);
      }
      return;
    }

    const nextValue = selectedValueSet.has(columnName)
      ? selectedValues.filter(value => value !== columnName)
      : [...selectedValues, columnName];
    onChange(nextValue);
  };

  const handleToggleAll = () => {
    if (disabled || totalCount === 0) {
      return;
    }

    onChange(allSelected ? [] : columns.map(column => column.name));
  };

  return (
    <Container hasError={error}>
      <SearchRow>
        <SearchInputWrapper>
          <SearchIcon />
          <SearchInput
            hasError={error}
            type='text'
            placeholder={placeholder}
            value={query}
            disabled={disabled}
            onChange={event => setQuery(event.target.value)}
          />
        </SearchInputWrapper>

        {mode === 'select' ? (
          <SelectionCount>
            {selectedCount}/{totalCount}
          </SelectionCount>
        ) : null}
      </SearchRow>

      <ListFrame hasError={error}>
        {mode === 'select' ? (
          <SelectAllRow
            aria-label={allSelected ? 'None' : 'All'}
            disableRipple
            disabled={disabled || totalCount === 0}
            onClick={handleToggleAll}
          >
            <ColumnOptionRow
              checkbox
              selected={allSelected}
              indeterminate={partiallySelected}
              label={allSelected ? 'Снять все' : 'Выбрать все'}
            />
          </SelectAllRow>
        ) : null}

        <OptionsList>
          {loading ? (
            <Stack>
              {SKELETON_ROWS.map(row => (
                <Stack
                  key={row}
                  direction='row'
                  alignItems='center'
                  spacing={1.25}
                  sx={theme => ({
                    minHeight: 36,
                    px: 1.75,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  {mode === 'select' ? (
                    <Skeleton
                      animation='wave'
                      variant='rounded'
                      width={16}
                      height={16}
                      sx={{ borderRadius: '5px', flexShrink: 0 }}
                    />
                  ) : null}
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width='28%'
                    height={11}
                  />
                  <Box sx={{ flex: 1 }} />
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width={42}
                    height={14}
                  />
                </Stack>
              ))}
            </Stack>
          ) : filteredColumns.length > 0 ? (
            shouldVirtualize ? (
              <Virtuoso
                data={filteredColumns}
                style={{ height: '100%' }}
                overscan={VIRTUALIZED_OVERSCAN_PX}
                fixedItemHeight={COLUMN_ITEM_HEIGHT}
                computeItemKey={(_, column) => column.name}
                itemContent={(_, column) => {
                  const isSelected = selectedValueSet.has(column.name);

                  return (
                    <OptionButton
                      disableRipple
                      isSelected={isSelected}
                      disabled={disabled}
                      onClick={() => handleToggleColumn(column.name)}
                    >
                      <ColumnOptionRow
                        column={column}
                        checkbox={mode === 'select'}
                        selected={isSelected}
                      />
                    </OptionButton>
                  );
                }}
              />
            ) : (
              filteredColumns.map(column => {
                const isSelected = selectedValueSet.has(column.name);

                return (
                  <OptionButton
                    key={column.name}
                    disableRipple
                    isSelected={isSelected}
                    disabled={disabled}
                    onClick={() => handleToggleColumn(column.name)}
                  >
                    <ColumnOptionRow
                      column={column}
                      checkbox={mode === 'select'}
                      selected={isSelected}
                    />
                  </OptionButton>
                );
              })
            )
          ) : (
            <EmptyState>
              {noOptionText ??
                (query ? 'Колонки не найдены' : 'Нет доступных колонок')}
            </EmptyState>
          )}
        </OptionsList>
      </ListFrame>
    </Container>
  );
};

export default ColumnListSelect;
