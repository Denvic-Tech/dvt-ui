import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameFilterEditor } from './ui/DataFrameFilterEditor.tsx';

const DataFrameFilterExtension: NodeExtension = {
  id: 'data_frame_filter',
  name: 'Data Frame Filter',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameFilter';
  },
  type: 'modal',
  component: DataFrameFilterEditor,
};

export default DataFrameFilterExtension;
