import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameLagColumnsEditor } from './ui/DataFrameLagColumnsEditor';

const DataFrameLagColumnsExtension: NodeExtension = {
  id: 'data_frame_lag_columns',
  name: 'Data Frame Lag Columns',
  condition: (nodeDefinition) => {
    return nodeDefinition.name === 'DataFrameLagColumns';
  },
  type: 'modal',
  component: DataFrameLagColumnsEditor,
};

export default DataFrameLagColumnsExtension;
