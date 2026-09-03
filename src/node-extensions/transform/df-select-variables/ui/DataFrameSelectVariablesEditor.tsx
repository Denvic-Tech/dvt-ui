import React, { useMemo } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Stack } from '@mui/material';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { DataFrameMetadata } from '@/shared/gatewayClient';
import { Button, IconButton, Input, Panel, Select } from '@/shared/ui';

import type { DataFrameSelectVariablesValues } from './editorTypes';
import { useDataFrameSelectVariablesEditor } from './useDataFrameSelectVariablesEditor';

const variableRowSx = {
  flexShrink: 0,
  p: 1,
};

const variableRowFieldsSx = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1.2fr) minmax(0, 1fr) minmax(180px, 0.9fr) auto',
  gap: 1,
  alignItems: 'center',
  '& > *': {
    minWidth: 0,
  },
};

const RemoveRowButton = ({
  index,
  onClick,
}: {
  index: number;
  onClick: () => void;
}) => (
  <IconButton
    aria-label={`Удалить переменную ${index + 1}`}
    size='xs'
    onClick={onClick}
  >
    <DeleteOutlineRoundedIcon fontSize='small' />
  </IconButton>
);

export const DataFrameSelectVariablesEditor: React.FC<
  NodeModalExtensionProps<DataFrameSelectVariablesValues>
> = ({
  id: nodeID,
  isOpen,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
  variables,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const dataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  const editor = useDataFrameSelectVariablesEditor({
    columns,
    isOpen,
    localInputData,
    setLocalInputData,
    setValidationCallback,
    setValidationErrors,
    variables,
  });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: 0,
      }}
    >
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack
          spacing={1}
          sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}
        >
          {editor.rowViewModels.map(rowViewModel => (
            <Panel key={rowViewModel.index} sx={variableRowSx}>
              <Box sx={variableRowFieldsSx}>
                <Input
                  fullWidth
                  aria-label='variable-name'
                  error={Boolean(rowViewModel.rowErrors.variableName)}
                  placeholder='Имя переменной'
                  value={rowViewModel.row.variableName}
                  onChange={event =>
                    editor.onVariableNameChange(
                      rowViewModel.row.id,
                      event.target.value
                    )
                  }
                />
                <ColumnDropdownSelect
                  columns={columns}
                  disabled={columns.length === 0}
                  error={Boolean(rowViewModel.rowErrors.sourceColumnName)}
                  noOptionText='Нет доступных колонок'
                  placeholder='Колонка DataFrame'
                  value={rowViewModel.row.sourceColumnName}
                  onChange={value =>
                    editor.onColumnChange(rowViewModel.row.id, value)
                  }
                />
                <Select
                  fullWidth
                  aria-label='Агрегация'
                  placeholder='Агрегация'
                  value={rowViewModel.row.aggFunc}
                  error={Boolean(rowViewModel.rowErrors.aggFunc)}
                  onChange={value =>
                    editor.onAggFuncChange(rowViewModel.row.id, value)
                  }
                  options={rowViewModel.availableAggFuncs.map(aggFunc => ({
                    value: aggFunc,
                    label: aggFunc,
                  }))}
                />
                <RemoveRowButton
                  index={rowViewModel.index}
                  onClick={() => editor.onRemoveRow(rowViewModel.row.id)}
                />
              </Box>
            </Panel>
          ))}
        </Stack>

        <Stack direction='row' justifyContent='space-between' gap={1}>
          <Button
            size='sm'
            startIcon={<AddRoundedIcon fontSize='small' />}
            onClick={editor.onAddRow}
          >
            Добавить переменную
          </Button>
          <Button
            variant='ghost'
            size='sm'
            color='inherit'
            onClick={editor.onClearAll}
          >
            Очистить всё
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
