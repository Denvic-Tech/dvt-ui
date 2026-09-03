import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameSortValuesEditor } from './ui/DataFrameSortValuesEditor.tsx';

const DataFrameSortValuesExtension: NodeExtension = {
  id: 'data_frame_sort_values',
  name: 'Data Frame Sort Values',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameSortValues';
  },
  type: 'modal',
  component: DataFrameSortValuesEditor,
};

export default DataFrameSortValuesExtension;
