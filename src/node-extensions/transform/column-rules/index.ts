import type { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { ColumnRulesEditor } from '@/features/node/column-rules/ColumnRulesEditor';

const ColumnRulesExtension: NodeExtension = {
  id: 'column-rules',
  name: 'Column transformation rules',
  type: 'modal',
  allowOpenWithoutConnectedMetadata: true,
  presentation: { type: 'centered', contentWidth: 'wide' },
  condition: definition =>
    [
      'DataFrameConvertToPeriodStart',
      'DataFrameAddColumnByExpression',
      'SetColumnToDataFrame',
    ].includes(definition.name),
  component: ColumnRulesEditor,
};
export default ColumnRulesExtension;
