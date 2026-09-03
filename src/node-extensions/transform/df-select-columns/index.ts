import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { SelectColumnsEditor } from './ui/SelectColumnsEditor.tsx';

const DataFrameSelectColumnsExtension: NodeExtension = {
  id: 'data_frame_select_columns',
  name: 'Data Frame Select Columns',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameSelectColumns';
  },
  type: 'modal',
  component: SelectColumnsEditor,
};

export default DataFrameSelectColumnsExtension;
