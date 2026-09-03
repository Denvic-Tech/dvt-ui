import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Button, FormHelperText, Stack, Typography } from '@mui/material';
import { FiTable } from 'react-icons/fi';

import {
  type DatabaseObjectListItem,
  TablesViewsListV2,
} from '@/entities/data/database';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  type ExpressionAccordionAppearance,
  ExpressionAccordionInput,
} from '@/shared/ui/node-input';
import { Input } from '@/shared/ui/primitives';

import {
  type CatalogListUiProps,
  type DbTargetSelectorValue,
  getLiteralStringValue,
} from '../model/helpers';

import {
  ErrorBadge,
  FieldGroup,
  FieldLabel,
  TableBrowserContainer,
} from './styles';

type TableSectionProps<T extends DatabaseObjectListItem> = {
  allowNew?: boolean;
  appearance?: ExpressionAccordionAppearance;
  collapsedValue: string;
  error?: string | undefined;
  hasError?: boolean;
  inputDefinition: InputDefinitionModel | null | undefined;
  isOpen: boolean;
  stepNumber?: number | undefined;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
  onChange: (nextValue: unknown) => void;
  onTableSelect: (table: T) => void;
  onToggle: () => void;
  selectedTable: T | null;
  selectedTableLabel: string;
  tables: T[];
  value: unknown;
  variables: VariableOutput[];
} & CatalogListUiProps;

export const TableSection = <T extends DatabaseObjectListItem>({
  allowNew = false,
  appearance,
  collapsedValue,
  error,
  hasError = false,
  inputDefinition,
  isOpen,
  stepNumber,
  disabled,
  disabledReason,
  onChange,
  onTableSelect,
  onToggle,
  selectedTable,
  tables,
  query,
  onQueryChange,
  state,
  hasNextPage,
  isFetchingNextPage,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  onRefresh,
  isRefreshing,
  selectedTableLabel,
  value,
  variables,
}: TableSectionProps<T>) => {
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(value as DbTargetSelectorValue);
  }, [value]);
  const selectedTableName = selectedTable?.name ?? selectedTableLabel;
  const [isCreatingNewTable, setIsCreatingNewTable] = useState(
    allowNew && Boolean(literalTableName) && !selectedTable
  );

  useEffect(() => {
    if (!allowNew || selectedTable) {
      setIsCreatingNewTable(false);
      return;
    }

    if (literalTableName) {
      setIsCreatingNewTable(true);
    }
  }, [allowNew, literalTableName, selectedTable]);

  const handleCreateModeOpen = () => {
    setIsCreatingNewTable(true);
    onChange('');
  };

  const handleCreateModeClose = () => {
    setIsCreatingNewTable(false);
    onChange(undefined);
  };

  return (
    <ExpressionAccordionInput
      appearance={appearance}
      inputDefinition={inputDefinition}
      value={value}
      onChange={onChange}
      variables={variables}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<FiTable size={18} />}
      title='Таблица'
      description={inputDefinition?.description}
      required
      hasError={hasError}
      collapsedValue={selectedTableName || collapsedValue}
      stepNumber={stepNumber}
      completed={Boolean(selectedTableName)}
      disabled={disabled}
      disabledReason={disabledReason}
      badge={
        hasError ? (
          <ErrorBadge>
            <ErrorOutlineIcon sx={{ fontSize: 12 }} />
            Error
          </ErrorBadge>
        ) : undefined
      }
    >
      {error ? (
        <FormHelperText error sx={{ mx: 0 }}>
          {error}
        </FormHelperText>
      ) : null}

      {allowNew && isCreatingNewTable ? (
        <FieldGroup>
          <Stack direction='row' alignItems='center' gap={1} sx={{ mb: 1 }}>
            <FieldLabel style={{ marginBottom: 0 }}>
              Название новой таблицы
            </FieldLabel>
            <Button
              size='small'
              variant='text'
              onClick={handleCreateModeClose}
              sx={{ ml: 'auto', textTransform: 'none' }}
            >
              К списку
            </Button>
          </Stack>
          <Input
            placeholder='Введите имя новой таблицы'
            value={typeof value === 'string' ? value : ''}
            onChange={event => onChange(event.target.value)}
          />
        </FieldGroup>
      ) : tables.length > 0 || allowNew || state !== undefined ? (
        <FieldGroup
          {...(appearance === 'workspace'
            ? {
                sx: {
                  flex: '1 1 auto',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                },
              }
            : {})}
        >
          <TableBrowserContainer
            sx={{
              border: 'none',
              borderRadius: 0,
              overflow: 'visible',
              ...(appearance === 'workspace'
                ? { height: 'auto', flex: '1 1 auto', minHeight: 0 }
                : {}),
            }}
          >
            <TablesViewsListV2
              appearance='rows'
              tables={tables}
              selectedItem={selectedTable ?? undefined}
              onItemClick={onTableSelect}
              showHierarchy={false}
              searchQuery={query}
              onSearchQueryChange={onQueryChange}
              state={state}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              loadMoreError={loadMoreError}
              onLoadNextPage={onLoadNextPage}
              onRetry={onRetry}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              testIds={{
                root: 'features/node/db-target-selector/database-tables-list',
                searchInput:
                  'entities/data/database/database-table-search-input',
                tableOption: 'entities/data/database/database-table-option',
              }}
              headerAction={
                allowNew ? (
                  <Button
                    fullWidth
                    variant='text'
                    startIcon={<AddIcon />}
                    onClick={handleCreateModeOpen}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    Новая таблица
                  </Button>
                ) : undefined
              }
            />
          </TableBrowserContainer>
        </FieldGroup>
      ) : (
        <FieldGroup>
          <FieldLabel>Выбор таблицы</FieldLabel>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            Таблицы не найдены для текущего фильтра
          </Typography>
        </FieldGroup>
      )}
    </ExpressionAccordionInput>
  );
};
