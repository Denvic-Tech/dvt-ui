import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import { Chip, IconButton, Stack, Typography } from '@mui/material';

import {
  type CatalogListUiProps,
  MetadataOptionList,
} from '@/features/node/db-target-selector';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  ExpressionAccordionInput,
  type PrimitiveNodeInputProps,
} from '@/shared/ui/node-input';

import {
  SchemaCreateInput,
  SchemaCreateInputRow,
  SchemaCreateSaveButton,
  SchemaLabel,
  SchemaSegmentButton,
  SchemaSegmentedControl,
  SelectedTableBox,
} from '../../styles';

type DatabaseSectionProps = Pick<
  PrimitiveNodeInputProps,
  'onChange' | 'value'
> & {
  collapsedValue: string;
  inputDefinition: InputDefinitionModel | null | undefined;
  isCreateMode: boolean;
  isDatabaseNew: boolean;
  isOpen: boolean;
  isSaving: boolean;
  newDatabaseName: string;
  onClear: () => void;
  onCreateModeSelect: (mode: 'create' | 'select') => void;
  onDatabaseSelect: (databaseName: string) => void;
  onNewDatabaseNameChange: (value: string) => void;
  onSave: () => void;
  onToggle: () => void;
  options: Array<{ label: string; tableCount?: number; value: string }>;
  selectMode: 'create' | 'select';
  selectedValue?: string | null;
  variables: VariableOutput[];
} & CatalogListUiProps;

export const DatabaseSection: React.FC<DatabaseSectionProps> = React.memo(
  ({
    collapsedValue,
    inputDefinition,
    isCreateMode,
    isDatabaseNew,
    isOpen,
    isSaving,
    newDatabaseName,
    onChange,
    onClear,
    onCreateModeSelect,
    onDatabaseSelect,
    onNewDatabaseNameChange,
    onSave,
    onToggle,
    options,
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
    selectMode,
    selectedValue,
    value,
    variables,
  }) => {
    return (
      <ExpressionAccordionInput
        unmountOnExit
        inputDefinition={inputDefinition}
        value={value}
        onChange={onChange}
        variables={variables}
        isOpen={isOpen}
        onToggle={onToggle}
        icon={<StorageIcon sx={{ fontSize: 18 }} />}
        title={inputDefinition?.display_name || 'База данных'}
        description={inputDefinition?.description}
        collapsedValue={collapsedValue}
      >
        <Stack gap={1}>
          <SchemaLabel>База данных</SchemaLabel>

          {selectedValue ? (
            <SelectedTableBox>
              <Stack
                direction='row'
                alignItems='center'
                justifyContent='space-between'
                gap={1}
                width='100%'
                flexWrap='nowrap'
              >
                <Stack
                  direction='row'
                  alignItems='center'
                  gap={1}
                  sx={{ minWidth: 0 }}
                >
                  <StorageIcon sx={{ fontSize: 16 }} />
                  <Typography
                    noWrap
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'primary.main',
                    }}
                  >
                    {selectedValue}
                  </Typography>
                  {isDatabaseNew ? (
                    <Chip
                      size='small'
                      color='primary'
                      variant='outlined'
                      label='NEW'
                      sx={{
                        height: 18,
                        '& .MuiChip-label': {
                          px: 0.75,
                          fontSize: '0.625rem',
                          fontWeight: 700,
                        },
                      }}
                    />
                  ) : null}
                </Stack>

                <IconButton
                  size='small'
                  onClick={onClear}
                  aria-label='Очистить выбор базы данных'
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Stack>
            </SelectedTableBox>
          ) : (
            <>
              {isCreateMode ? (
                <SchemaSegmentedControl>
                  <SchemaSegmentButton
                    type='button'
                    selected={selectMode === 'select'}
                    aria-pressed={selectMode === 'select'}
                    onClick={() => onCreateModeSelect('select')}
                  >
                    <StorageIcon />
                    Выбрать существующую
                  </SchemaSegmentButton>
                  <SchemaSegmentButton
                    type='button'
                    selected={selectMode === 'create'}
                    aria-pressed={selectMode === 'create'}
                    onClick={() => onCreateModeSelect('create')}
                  >
                    <AddIcon />
                    Создать новую
                  </SchemaSegmentButton>
                </SchemaSegmentedControl>
              ) : null}

              {!isCreateMode || selectMode === 'select' ? (
                <MetadataOptionList
                  appearance='rows'
                  emptyText='Базы данных не найдены'
                  icon={<StorageIcon />}
                  options={options}
                  query={query}
                  onQueryChange={onQueryChange}
                  state={state}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  loadMoreError={loadMoreError}
                  onLoadNextPage={onLoadNextPage}
                  onRetry={onRetry}
                  onRefresh={onRefresh}
                  isRefreshing={isRefreshing}
                  searchPlaceholder='Поиск базы данных...'
                  selectedValue={selectedValue}
                  onSelect={onDatabaseSelect}
                />
              ) : (
                <SchemaCreateInputRow>
                  <SchemaCreateInput
                    type='text'
                    placeholder='Название новой базы данных'
                    value={newDatabaseName}
                    onChange={event =>
                      onNewDatabaseNameChange(event.target.value)
                    }
                  />
                  <SchemaCreateSaveButton
                    type='button'
                    onClick={onSave}
                    disabled={!newDatabaseName.trim() || isSaving}
                  >
                    {isSaving ? 'Создание...' : 'Сохранить'}
                  </SchemaCreateSaveButton>
                </SchemaCreateInputRow>
              )}
            </>
          )}
        </Stack>
      </ExpressionAccordionInput>
    );
  }
);

DatabaseSection.displayName = 'DatabaseSection';
