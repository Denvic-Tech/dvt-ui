import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { DataFrameReplaceValuesEditor } from './ui/DataFrameReplaceValueEditor.tsx';

const DataFrameReplaceValuesExtension: NodeExtension = {
  id: 'data_frame_replace_values',
  name: 'Data Frame Replace Values',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameReplaceValues';
  },
  type: 'modal',
  allowOpenWithoutConnectedMetadata: true,
  presentation: { type: 'centered', contentWidth: 'wide' },
  component: DataFrameReplaceValuesEditor,
};

export default DataFrameReplaceValuesExtension;
