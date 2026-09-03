import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFramePivotEditor } from './ui/DataFramePivotEditor.tsx';

const DataFramePivotExtension: NodeExtension = {
  id: 'data_frame_pivot',
  name: 'Data Frame Pivot',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFramePivot';
  },
  type: 'modal',
  component: DataFramePivotEditor,
};

export default DataFramePivotExtension;
