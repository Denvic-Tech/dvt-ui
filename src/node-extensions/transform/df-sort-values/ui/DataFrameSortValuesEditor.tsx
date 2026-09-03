import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Divider from '@mui/material/Divider';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { Column, DataFrameMetadata } from '@/shared/gatewayClient';

import {
  type ColumnSortConfig,
  ColumnSortTable,
  type SortOrder,
} from './ColumnSortTable';

interface DataFrameSortValuesValues {
  sort_columns?: ColumnSortConfig[];
  by?: string[] | null;
  ascending?: boolean[] | null;
}

export const DataFrameSortValuesEditor: React.FC<
  NodeModalExtensionProps<DataFrameSortValuesValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const inputMetadata = useMemo(() => {
    return getConnectedInputMetadata('df') as DataFrameMetadata | null;
  }, [getConnectedInputMetadata]);

  const [selectedSortColumns, setSelectedSortColumns] = useState<
    ColumnSortConfig[]
  >([]);

  useEffect(() => {
    if (localValues.sort_columns) {
      setSelectedSortColumns(localValues.sort_columns);
    } else if (localValues.by && localValues.ascending) {
      const sortColumns: ColumnSortConfig[] = localValues.by.map(
        (column, index) => ({
          column,
          order: localValues.ascending![index] ? 'ASC' : 'DESC',
        })
      );
      setSelectedSortColumns(sortColumns);
      setLocalValues(prev => ({ ...prev, sort_columns: sortColumns }));
    }
  }, [
    localValues.sort_columns,
    localValues.by,
    localValues.ascending,
    setLocalValues,
  ]);

  const updateParentState = (updatedSortColumns: ColumnSortConfig[]) => {
    const by = updatedSortColumns.map(config => config.column);
    const ascending = updatedSortColumns.map(config => config.order === 'ASC');

    setLocalValues(prev => ({
      ...prev,
      sort_columns: updatedSortColumns,
      by: by.length > 0 ? by : null,
      ascending: ascending.length > 0 ? ascending : null,
    }));
  };

  const handleAddSortColumn = useCallback(
    (column: Column) => {
      if (!selectedSortColumns.some(config => config.column === column.name)) {
        const updatedSortColumns = [
          ...selectedSortColumns,
          { column: column.name, order: 'ASC' as SortOrder },
        ];
        setSelectedSortColumns(updatedSortColumns);
        updateParentState(updatedSortColumns);
      }
    },
    [selectedSortColumns, setLocalValues]
  );

  const handleRemoveSortColumn = useCallback(
    (columnName: string) => {
      const updatedSortColumns = selectedSortColumns.filter(
        config => config.column !== columnName
      );
      setSelectedSortColumns(updatedSortColumns);
      updateParentState(updatedSortColumns);
    },
    [selectedSortColumns, setLocalValues]
  );

  const handleChangeSortOrder = useCallback(
    (columnName: string, order: SortOrder) => {
      const updatedSortColumns = selectedSortColumns.map(config =>
        config.column === columnName ? { ...config, order } : config
      );
      setSelectedSortColumns(updatedSortColumns);
      updateParentState(updatedSortColumns);
    },
    [selectedSortColumns, setLocalValues]
  );

  const handleMoveColumnUp = useCallback(
    (columnName: string) => {
      const columnIndex = selectedSortColumns.findIndex(
        config => config.column === columnName
      );

      if (columnIndex > 0) {
        const updatedSortColumns = [...selectedSortColumns];
        const temp = updatedSortColumns[columnIndex];
        updatedSortColumns[columnIndex] = updatedSortColumns[columnIndex - 1];
        updatedSortColumns[columnIndex - 1] = temp;

        setSelectedSortColumns(updatedSortColumns);
        updateParentState(updatedSortColumns);
      }
    },
    [selectedSortColumns, setLocalValues]
  );

  const handleMoveColumnDown = useCallback(
    (columnName: string) => {
      const columnIndex = selectedSortColumns.findIndex(
        config => config.column === columnName
      );

      if (columnIndex >= 0 && columnIndex < selectedSortColumns.length - 1) {
        const updatedSortColumns = [...selectedSortColumns];
        const temp = updatedSortColumns[columnIndex];
        updatedSortColumns[columnIndex] = updatedSortColumns[columnIndex + 1];
        updatedSortColumns[columnIndex + 1] = temp;

        setSelectedSortColumns(updatedSortColumns);
        updateParentState(updatedSortColumns);
      }
    },
    [selectedSortColumns, setLocalValues]
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant='h6' gutterBottom>
        Сортировка значений DataFrame
      </Typography>

      <Divider />

      <Box sx={{ mt: 2, flex: 1, overflow: 'auto' }}>
        {inputMetadata && inputMetadata.columns ? (
          <ColumnSortTable
            availableColumns={inputMetadata.columns}
            selectedSortColumns={selectedSortColumns}
            onAddSortColumn={handleAddSortColumn}
            onRemoveSortColumn={handleRemoveSortColumn}
            onChangeSortOrder={handleChangeSortOrder}
            onMoveColumnUp={handleMoveColumnUp}
            onMoveColumnDown={handleMoveColumnDown}
          />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Нет данных DataFrame для отображения. Подключите DataFrame к входу
            узла.
          </Typography>
        )}
      </Box>
    </Box>
  );
};
