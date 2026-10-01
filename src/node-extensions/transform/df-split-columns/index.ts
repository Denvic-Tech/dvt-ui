import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { DataFrameSplitColumnEditor } from './ui/DataFrameSplitColumns.tsx';

const DataFrameSplitColumnExtension: NodeExtension = {
  id: 'data_frame_split_column',
  name: 'Data Frame Split Column',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameSplitColumn';
  },
  type: 'modal',
  allowOpenWithoutConnectedMetadata: true,
  presentation: { type: 'centered', contentWidth: 'wide' },
  component: DataFrameSplitColumnEditor,
};

export default DataFrameSplitColumnExtension;
