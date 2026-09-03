import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { DropColumnsEditor } from './ui/DropColumnsEditor.tsx';

const DataFrameDropColumnsExtension: NodeExtension = {
  id: 'data_frame_drop_columns',
  name: 'Data Frame Drop Columns',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameDropColumns';
  },
  type: 'modal',
  component: DropColumnsEditor,
};

export default DataFrameDropColumnsExtension;
