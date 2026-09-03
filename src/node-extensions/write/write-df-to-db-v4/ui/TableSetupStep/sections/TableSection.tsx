import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Alert, Button, IconButton, Stack, Typography } from '@mui/material';

import type {
  CatalogListUiProps,
  DbCatalogTableListItem,
} from '@/features/node/db-target-selector';

import { TablesViewsListV2 } from '@/entities/data/database';

import type {
  DbMetadata as DBMetadata,
  DbTable,
  InputDefinitionModel,
} from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  ExpressionAccordionInput,
  type PrimitiveNodeInputProps,
} from '@/shared/ui';

import {
  CreateTableInput,
  CreateTableRow,
  FieldGroup,
  FieldLabel,
  RadioCard,
  RadioCardDescription,
  RadioCardHeader,
  RadioCardsContainer,
  RadioCardTitle,
  RadioIndicator,
  SaveButton,
  SelectedTableBox,
  TableBrowserContainer,
} from '../../styles';

type TableListItem = DbTable | DbCatalogTableListItem;

type TableSectionProps = Pick<PrimitiveNodeInputProps, 'onChange' | 'value'> & {
  blockedMessage?: string | null;
  inputConnectionMetadata: DBMetadata | null;
  inputDefinition: InputDefinitionModel | null | undefined;
  isCreateTableNameEditorOpen: boolean;
  isOpen: boolean;
  isSelectTableBrowserOpen: boolean;
  newTableName: string;
  notice: {
    message: string;
    severity: 'error' | 'info' | 'success' | 'warning';
  } | null;
  onEditCreatedTableName: () => void;
  onEditSelectedTable: () => void;
  onResetTable: () => void;
  onSaveCreatedTableName: () => void;
  onTableModeChange: (mode: 'create' | 'select') => void;
  onTableNameChange: (value: string) => void;
  onTableSelect: (table: TableListItem) => void;
  onToggle: () => void;
  selectedTable: TableListItem | null;
  selectedTableLabel: string;
  selectTableMode: 'create' | 'select';
  tables: TableListItem[];
  value: unknown;
  variables: VariableOutput[];
  onCreateTableInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => void;
} & CatalogListUiProps;

export const TableSection: React.FC<TableSectionProps> = React.memo(
  ({
    blockedMessage,
    inputConnectionMetadata,
    inputDefinition,
    isCreateTableNameEditorOpen,
    isOpen,
    isSelectTableBrowserOpen,
    newTableName,
    notice,
    onChange,
    onCreateTableInputKeyDown,
    onEditCreatedTableName,
    onEditSelectedTable,
    onResetTable,
    onSaveCreatedTableName,
    onTableModeChange,
    onTableNameChange,
    onTableSelect,
    onToggle,
    selectedTable,
    selectedTableLabel,
    selectTableMode,
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
        icon={<TableChartIcon sx={{ fontSize: 18 }} />}
        title={inputDefinition?.display_name || 'Таблица'}
        description={inputDefinition?.description}
        collapsedValue={selectedTableLabel || 'Таблица не выбрана'}
      >
        {notice ? (
          <Alert severity={notice.severity} sx={{ mb: 1.5 }}>
            {notice.message}
          </Alert>
        ) : null}

        {blockedMessage ? (
          <Alert severity='info'>{blockedMessage}</Alert>
        ) : null}

        {!blockedMessage ? (
          <>
            <RadioCardsContainer>
              <RadioCard
                type='button'
                selected={selectTableMode === 'select'}
                onClick={() => onTableModeChange('select')}
              >
                <RadioCardHeader>
                  <RadioIndicator selected={selectTableMode === 'select'} />
                  <RadioCardTitle selected={selectTableMode === 'select'}>
                    Выбрать
                  </RadioCardTitle>
                </RadioCardHeader>
                <RadioCardDescription>
                  Существующую таблицу
                </RadioCardDescription>
              </RadioCard>

              <RadioCard
                type='button'
                selected={selectTableMode === 'create'}
                onClick={() => onTableModeChange('create')}
              >
                <RadioCardHeader>
                  <RadioIndicator selected={selectTableMode === 'create'} />
                  <RadioCardTitle selected={selectTableMode === 'create'}>
                    Создать
                  </RadioCardTitle>
                </RadioCardHeader>
                <RadioCardDescription>Новую таблицу</RadioCardDescription>
              </RadioCard>
            </RadioCardsContainer>

            {selectTableMode === 'select' ? (
              <>
                {selectedTableLabel ? (
                  <FieldGroup sx={{ mt: 1.5, mb: 1.5 }}>
                    <FieldLabel>Выбранная таблица</FieldLabel>
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
                          <TableChartIcon
                            sx={{ fontSize: 16, color: 'primary.main' }}
                          />
                          <Typography
                            noWrap
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'primary.main',
                            }}
                          >
                            {selectedTableLabel}
                          </Typography>
                        </Stack>

                        <Stack direction='row' alignItems='center' gap={0.5}>
                          {!isSelectTableBrowserOpen ? (
                            <Button
                              size='small'
                              variant='text'
                              onClick={onEditSelectedTable}
                            >
                              Изменить
                            </Button>
                          ) : null}
                          <IconButton
                            size='small'
                            onClick={onResetTable}
                            aria-label='Очистить выбор таблицы'
                          >
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </SelectedTableBox>
                  </FieldGroup>
                ) : null}

                {inputConnectionMetadata ? (
                  isSelectTableBrowserOpen && !selectedTableLabel ? (
                    <FieldGroup sx={{ mt: 1.5, mb: 0 }}>
                      <FieldLabel>Выбор таблицы</FieldLabel>
                      <TableBrowserContainer>
                        <TablesViewsListV2
                          appearance='rows'
                          tables={tables}
                          selectedItem={selectedTable ?? undefined}
                          onItemClick={onTableSelect}
                          collapseAfterSelect={true}
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
                        />
                      </TableBrowserContainer>
                    </FieldGroup>
                  ) : null
                ) : (
                  <Alert severity='warning' sx={{ mt: 1.5 }}>
                    Подключите вход `connection`, чтобы выбрать таблицу.
                  </Alert>
                )}
              </>
            ) : (
              <Stack sx={{ mt: 1.5, mb: 1 }}>
                <FieldLabel>Название новой таблицы</FieldLabel>

                {selectedTableLabel && !isCreateTableNameEditorOpen ? (
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
                        <TableChartIcon
                          sx={{ fontSize: 16, color: 'primary.main' }}
                        />
                        <Typography
                          noWrap
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'primary.main',
                          }}
                        >
                          {selectedTableLabel}
                        </Typography>
                      </Stack>
                      <Button
                        size='small'
                        variant='text'
                        onClick={onEditCreatedTableName}
                      >
                        Изменить
                      </Button>
                    </Stack>
                  </SelectedTableBox>
                ) : (
                  <CreateTableRow>
                    <CreateTableInput
                      type='text'
                      placeholder='Название новой таблицы'
                      value={newTableName}
                      onChange={event => onTableNameChange(event.target.value)}
                      onKeyDown={onCreateTableInputKeyDown}
                    />
                    <SaveButton
                      type='button'
                      onClick={onSaveCreatedTableName}
                      disabled={!newTableName.trim()}
                    >
                      Сохранить
                    </SaveButton>
                  </CreateTableRow>
                )}
              </Stack>
            )}
          </>
        ) : null}
      </ExpressionAccordionInput>
    );
  }
);

TableSection.displayName = 'TableSection';
