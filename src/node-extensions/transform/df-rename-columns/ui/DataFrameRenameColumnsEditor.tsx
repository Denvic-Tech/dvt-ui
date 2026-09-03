import React, { useCallback, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { DataFrameMetadata } from '@/shared/gatewayClient';

import { ColumnRenameTable } from './ColumnRenameTable';

type DataFrameRenameColumnsValues = {
  mapping?: { [originalName: string]: string };
};

export const DataFrameRenameColumnsEditor: React.FC<
  NodeModalExtensionProps<DataFrameRenameColumnsValues>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const inputMetadata = useMemo(() => {
    return getConnectedInputMetadata('df') as DataFrameMetadata | null;
  }, [getConnectedInputMetadata]);

  const [errorFocusRequest, setErrorFocusRequest] = useState<{
    key: string | null;
    id: number;
  }>({ key: null, id: 0 });

  /**
   * Считает итоговый набор имен колонок, который получится после применения ноды.
   * Если колонка есть в маппинге — берем новое имя, если нет — старое.
   */
  const getProjectedColumns = useCallback(() => {
    if (!inputMetadata?.columns) return [];

    const mapping = localInputData.mapping || {};

    return inputMetadata.columns.map(col => {
      const newName = mapping[col.name];
      if (newName === undefined) return col.name;
      return newName.trim();
    });
  }, [inputMetadata, localInputData.mapping]);

  const columnErrors = useMemo(() => {
    if (!inputMetadata?.columns) return {};

    const mapping = localInputData.mapping || {};
    const errors: Record<string, { empty?: boolean; duplicate?: boolean }> = {};
    const namesIndex: Record<string, string[]> = {};

    inputMetadata.columns.forEach(col => {
      const mappedValue = mapping[col.name];
      const nextName =
        mappedValue === undefined ? col.name : mappedValue.trim();

      if (mappedValue !== undefined && nextName === '') {
        errors[col.name] = { ...errors[col.name], empty: true };
        return;
      }

      if (!namesIndex[nextName]) {
        namesIndex[nextName] = [];
      }
      namesIndex[nextName].push(col.name);
    });

    Object.values(namesIndex).forEach(originalNames => {
      if (originalNames.length > 1) {
        originalNames.forEach(originalName => {
          errors[originalName] = {
            ...errors[originalName],
            duplicate: true,
          };
        });
      }
    });

    return errors;
  }, [inputMetadata, localInputData.mapping]);

  // Валидация при попытке сохранить/применить изменения в модальном окне
  React.useEffect(() => {
    if (!setValidationCallback) return;

    setValidationCallback(() => {
      return () => {
        const finalNames = getProjectedColumns();
        const hasEmpty = Object.values(columnErrors).some(err => err.empty);

        if (hasEmpty) {
          const firstError = inputMetadata?.columns.find(
            col => columnErrors[col.name]?.empty
          )?.name;
          if (firstError) {
            setErrorFocusRequest(prev => ({
              key: firstError,
              id: prev.id + 1,
            }));
          }
          return false;
        }

        const seen = new Set<string>();
        for (const name of finalNames) {
          if (name === '') return false;
          if (seen.has(name)) {
            const firstDuplicate = inputMetadata?.columns.find(
              col => columnErrors[col.name]?.duplicate
            )?.name;
            if (firstDuplicate) {
              setErrorFocusRequest(prev => ({
                key: firstDuplicate,
                id: prev.id + 1,
              }));
            }
            return false;
          }
          seen.add(name);
        }

        return true;
      };
    });
  }, [
    setValidationCallback,
    getProjectedColumns,
    columnErrors,
    inputMetadata?.columns,
  ]);

  // Обработка ввода нового имени
  const handleColumnRename = useCallback(
    (originalName: string, newName: string) => {
      setLocalInputData(prev => ({
        ...prev,
        mapping: {
          ...prev.mapping,
          [originalName]: newName,
        },
      }));
    },
    [setLocalInputData]
  );

  // Очистка пробелов в маппинге
  const handleBlur = useCallback(() => {
    const mapping = localInputData.mapping || {};
    const cleanedMapping = Object.entries(mapping).reduce(
      (acc, [key, value]) => {
        acc[key] = value.trim();
        return acc;
      },
      {} as { [key: string]: string }
    );

    const hasChanges = Object.entries(cleanedMapping).some(
      ([key, value]) => mapping[key] !== value
    );

    if (hasChanges) {
      setLocalInputData(prev => ({
        ...prev,
        mapping: cleanedMapping,
      }));
    }
  }, [localInputData.mapping, setLocalInputData]);

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      onBlur={handleBlur}
    >
      <Box sx={{ mt: 2, flex: 1, overflow: 'auto' }}>
        {inputMetadata && inputMetadata.columns ? (
          <ColumnRenameTable
            columns={inputMetadata.columns}
            columnRenames={localInputData.mapping || {}}
            onColumnRename={handleColumnRename}
            columnErrors={columnErrors}
            errorFocusKey={errorFocusRequest.key}
            errorFocusRequestId={errorFocusRequest.id}
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
