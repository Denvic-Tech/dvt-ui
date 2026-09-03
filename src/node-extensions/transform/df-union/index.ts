import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameUnionEditor } from './ui/DataFrameUnionEditor.tsx';

const DataFrameUnionExtension: NodeExtension = {
  id: 'data_frame_union',
  name: 'Data Frame Union',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameUnion';
  },
  type: 'modal',
  component: DataFrameUnionEditor,
};

export default DataFrameUnionExtension;
