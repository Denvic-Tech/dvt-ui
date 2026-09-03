import type { Column } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';

import type {
  SelectedVariableDraftRow,
  SelectedVariableFieldErrors,
  SelectedVariablesValue,
  SelectVariableAggFunc,
} from './helpers';

export type DataFrameSelectVariablesValues = {
  selected_variables?: SelectedVariablesValue;
};

export type SelectedVariableRowViewModel = {
  row: SelectedVariableDraftRow;
  index: number;
  rowErrors: SelectedVariableFieldErrors;
  selectedColumn: Column | null;
  availableAggFuncs: SelectVariableAggFunc[];
  suggestedVariable: VariableOutput | undefined;
  isRowReady: boolean;
};
