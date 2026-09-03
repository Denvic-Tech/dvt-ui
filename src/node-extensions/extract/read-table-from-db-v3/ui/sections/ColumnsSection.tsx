import React from 'react';
import { Box, Typography } from '@mui/material';
import { HiOutlineViewColumns } from 'react-icons/hi2';

import { ColumnSelectorContainer } from '@/features/node/db-target-selector/ui/styles';

import { ColumnListSelect } from '@/entities/data/dataframe';

import type { DbTable } from '@/shared/gatewayClient';
import {
  type ExpressionAccordionAppearance,
  ExpressionAccordionInput,
} from '@/shared/ui/node-input';

const NOOP = () => undefined;

type ColumnsSectionProps = {
  appearance?: ExpressionAccordionAppearance;
  disabled?: boolean;
  disabledReason?: string | undefined;
  isOpen: boolean;
  loading?: boolean;
  onToggle: () => void;
  selectedColumns: string[];
  selectedColumnsCount: number;
  selectedTable: DbTable | null;
  setSelectedColumns: (columns: string[]) => void;
  stepNumber?: number | undefined;
};

export const ColumnsSection: React.FC<ColumnsSectionProps> = ({
  appearance,
  disabled = false,
  disabledReason,
  isOpen,
  loading = false,
  onToggle,
  selectedColumns,
  selectedColumnsCount,
  selectedTable,
  setSelectedColumns,
  stepNumber,
}) => {
  const availableColumnsCount = selectedTable?.columns.length ?? 0;

  return (
    <ExpressionAccordionInput
      appearance={appearance}
      inputDefinition={undefined}
      value={selectedColumns}
      onChange={NOOP}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<HiOutlineViewColumns size={18} />}
      title='Выбор колонок'
      stepNumber={stepNumber}
      completed={Boolean(selectedTable && selectedColumnsCount > 0)}
      disabled={disabled}
      disabledReason={disabledReason}
      loading={loading}
      loadingVariant='title-wave'
      collapsedValue={
        selectedTable
          ? `${selectedColumnsCount}/${availableColumnsCount}`
          : 'Не выбраны'
      }
    >
      {selectedTable ? (
        <ColumnSelectorContainer
          {...(appearance === 'workspace'
            ? {
                sx: {
                  height: 'auto',
                  minHeight: 0,
                  maxHeight: 'none',
                  flex: '1 1 auto',
                },
              }
            : {})}
        >
          <ColumnListSelect
            columns={selectedTable.columns}
            value={selectedColumns}
            onChange={setSelectedColumns}
          />
        </ColumnSelectorContainer>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
            Сначала выберите таблицу
          </Typography>
        </Box>
      )}
    </ExpressionAccordionInput>
  );
};
