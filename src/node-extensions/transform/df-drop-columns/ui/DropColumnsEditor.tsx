import React, { useEffect, useMemo, useState } from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import type {
  DataFrameMetadata,
  InputDefinitionModel,
  Io,
  NodeDefinition,
} from '@/shared/gatewayClient';

import {
  getTypeIcon,
  toAvailableColumns,
  toSelectedColumns,
} from './helpers';
import {
  ActionButton,
  ActionsRow,
  AddButton,
  ColumnInfo,
  ColumnItem,
  ColumnName,
  Content,
  CountBadge,
  EmptyState,
  Panel,
  PanelHeader,
  PanelLabel,
  PanelList,
  Panels,
  RemoveButton,
  Root,
  TypeIcon,
  ValidationHint,
} from './styles';

type DropColumnsValues = {
  columns?: string[];
};

const hasIoType = (
  type: InputDefinitionModel['type'],
  target: Io | 'DATAFRAME'
): boolean => {
  return Array.isArray(type) ? type.includes(target as Io) : type === target;
};

const getPrimaryDataFrameInput = (
  nodeDefinition: NodeDefinition
): string | null => {
  const inputDefinitions = Object.values(
    nodeDefinition.input_definitions ?? {}
  );
  const explicitDf = inputDefinitions.find(input => input.attr_name === 'df');

  if (explicitDf && hasIoType(explicitDf.type, 'DATAFRAME')) {
    return explicitDf.attr_name;
  }

  const fallback = inputDefinitions.find(input =>
    hasIoType(input.type, 'DATAFRAME')
  );

  return fallback?.attr_name ?? null;
};

const CheckIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M20 6L9 17l-5-5' />
  </svg>
);

const PlusIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M12 5v14M5 12h14' />
  </svg>
);

const CloseSmallIcon = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <path d='M18 6L6 18M6 6l12 12' />
  </svg>
);

export const DropColumnsEditor: React.FC<
  NodeModalExtensionProps<DropColumnsValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );

  const dataframeInputName = useMemo(
    () => getPrimaryDataFrameInput(nodeDefinition),
    [nodeDefinition]
  );

  const dataframeMetadata = useMemo(() => {
    if (!dataframeInputName) {
      return null;
    }

    return getConnectedInputMetadata(
      dataframeInputName
    ) as DataFrameMetadata | null;
  }, [dataframeInputName, getConnectedInputMetadata]);

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  const selectedColumnNames = useMemo(() => {
    return Array.isArray(localInputData.columns)
      ? localInputData.columns.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];
  }, [localInputData.columns]);

  const selectedColumns = useMemo(
    () => toSelectedColumns(selectedColumnNames, columns),
    [columns, selectedColumnNames]
  );

  const availableColumns = useMemo(
    () => toAvailableColumns(selectedColumnNames, columns),
    [columns, selectedColumnNames]
  );

  useEffect(() => {
    if (!setValidationCallback) {
      return;
    }

    setValidationCallback(() => {
      return () => {
        if (selectedColumnNames.length > 0) {
          setValidationMessage(null);
          return true;
        }

        const message = 'Выберите хотя бы одну колонку для сохранения.';
        setValidationMessage(message);
        return false;
      };
    });
  }, [selectedColumnNames, setValidationCallback]);

  const handleColumnsChange = (nextColumns: string[]) => {
    setValidationMessage(null);
    setLocalInputData(prev => ({
      ...prev,
      columns: nextColumns,
    }));
  };

  const handleToggleColumn = (columnName: string) => {
    if (selectedColumnNames.includes(columnName)) {
      handleColumnsChange(
        selectedColumnNames.filter(item => item !== columnName)
      );
      return;
    }

    handleColumnsChange([...selectedColumnNames, columnName]);
  };

  const handleSelectAll = () => {
    handleColumnsChange(columns.map(column => column.name));
  };

  const handleClearSelection = () => {
    handleColumnsChange([]);
  };

  const unavailableMessage =
    !dataframeInputName || !dataframeMetadata
      ? 'Подключите входной DataFrame, чтобы выбрать доступные колонки.'
      : null;

  return (
    <Root>
      <Content>
        <ActionsRow>
          <ActionButton
            type='button'
            onClick={handleSelectAll}
            disabled={
              columns.length === 0 || selectedColumns.length === columns.length
            }
          >
            <CheckIcon />
            Выбрать все
          </ActionButton>
          <ActionButton
            type='button'
            onClick={handleClearSelection}
            disabled={selectedColumns.length === 0}
          >
            <CloseSmallIcon />
            Очистить выбор
          </ActionButton>
        </ActionsRow>

        <Panels>
          <Panel>
            <PanelHeader>
              <PanelLabel variant='available'>Доступные</PanelLabel>
              <CountBadge variant='available'>
                {availableColumns.length}
              </CountBadge>
            </PanelHeader>
            <PanelList variant='available'>
              {availableColumns.length === 0 ? (
                <EmptyState>
                  {columns.length === 0
                    ? 'Нет доступных колонок'
                    : 'Все колонки уже выбраны'}
                </EmptyState>
              ) : (
                availableColumns.map(column => (
                  <ColumnItem
                    key={column.name}
                    type='button'
                    variant='available'
                    onClick={() => handleToggleColumn(column.name)}
                  >
                    <ColumnInfo>
                      <TypeIcon variant='available'>
                        {getTypeIcon(column.type)}
                      </TypeIcon>
                      <ColumnName variant='available' title={column.name}>
                        {column.name}
                      </ColumnName>
                    </ColumnInfo>
                    <AddButton>
                      <PlusIcon />
                    </AddButton>
                  </ColumnItem>
                ))
              )}
            </PanelList>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelLabel variant='selected'>
                <CheckIcon />
                Выбрано
              </PanelLabel>
              <CountBadge variant='selected'>
                {selectedColumns.length}
              </CountBadge>
            </PanelHeader>
            <PanelList variant='selected'>
              {selectedColumns.length === 0 ? (
                <EmptyState>Нет выбранных колонок</EmptyState>
              ) : (
                selectedColumns.map(column => (
                  <ColumnItem
                    key={column.name}
                    type='button'
                    variant='selected'
                    onClick={() => handleToggleColumn(column.name)}
                  >
                    <ColumnInfo>
                      <TypeIcon variant='selected'>
                        {getTypeIcon(column.type)}
                      </TypeIcon>
                      <ColumnName variant='selected' title={column.name}>
                        {column.name}
                      </ColumnName>
                    </ColumnInfo>
                    <RemoveButton>
                      <CloseSmallIcon />
                    </RemoveButton>
                  </ColumnItem>
                ))
              )}
            </PanelList>
          </Panel>
        </Panels>

        {validationMessage ? (
          <ValidationHint>{validationMessage}</ValidationHint>
        ) : null}
        {unavailableMessage ? (
          <ValidationHint>{unavailableMessage}</ValidationHint>
        ) : null}
      </Content>
    </Root>
  );
};
