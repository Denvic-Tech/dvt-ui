import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Chip, IconButton, Stack, Typography } from '@mui/material';

import type { CatalogListUiProps } from '@/features/node/db-target-selector';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { SchemaIcon } from '@/shared/icons';
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

import { MetadataOptionList } from './MetadataOptionList';

type SchemaSectionProps = Pick<
  PrimitiveNodeInputProps,
  'onChange' | 'value'
> & {
  blockedMessage?: string | null;
  collapsedValue: string;
  inputDefinition: InputDefinitionModel | null | undefined;
  isCreateMode: boolean;
  isOpen: boolean;
  isSchemaNew: boolean;
  isSaving: boolean;
  newSchemaName: string;
  onClear: () => void;
  onCreateModeSelect: (mode: 'create' | 'select') => void;
  onNewSchemaNameChange: (value: string) => void;
  onSave: () => void;
  onSchemaSelect: (schemaName: string) => void;
  onToggle: () => void;
  options: Array<{ label: string; tableCount?: number; value: string }>;
  selectMode: 'create' | 'select';
  selectedValue?: string | null;
  variables: VariableOutput[];
} & CatalogListUiProps;

export const SchemaSection: React.FC<SchemaSectionProps> = React.memo(
  ({
    blockedMessage,
    collapsedValue,
    inputDefinition,
    isCreateMode,
    isOpen,
    isSaving,
    isSchemaNew,
    newSchemaName,
    onChange,
    onClear,
    onCreateModeSelect,
    onNewSchemaNameChange,
    onSave,
    onSchemaSelect,
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
        icon={<SchemaIcon style={{ fontSize: '1rem' }} />}
        title={inputDefinition?.display_name || 'Схема'}
        description={inputDefinition?.description}
        collapsedValue={collapsedValue}
      >
        <Stack gap={1}>
          <SchemaLabel>Схема</SchemaLabel>

          {blockedMessage ? (
            <Alert severity='info'>{blockedMessage}</Alert>
          ) : selectedValue ? (
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
                  <SchemaIcon style={{ fontSize: '1rem' }} />
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
                  {isSchemaNew ? (
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
                  aria-label='Очистить выбор схемы'
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
                  emptyText='Схемы не найдены'
                  icon={<SchemaIcon style={{ fontSize: '1rem' }} />}
                  options={options}
                  query={query}
                  onQueryChange={onQueryChange}
                  state={state}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  loadMoreError={loadMoreError}
                  onLoadNextPage={onLoadNextPage}
                  onRetry={onRetry}
                  searchPlaceholder='Поиск схемы...'
                  selectedValue={selectedValue}
                  onSelect={onSchemaSelect}
                />
              ) : (
                <SchemaCreateInputRow>
                  <SchemaCreateInput
                    type='text'
                    placeholder='Название новой схемы'
                    value={newSchemaName}
                    onChange={event =>
                      onNewSchemaNameChange(event.target.value)
                    }
                  />
                  <SchemaCreateSaveButton
                    type='button'
                    onClick={onSave}
                    disabled={!newSchemaName.trim() || isSaving}
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

SchemaSection.displayName = 'SchemaSection';
