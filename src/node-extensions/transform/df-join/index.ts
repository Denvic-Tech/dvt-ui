import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameJoinEditor } from './ui/DataFrameJoinEditor.tsx';

const DataFrameJoinExtension: NodeExtension = {
  id: 'data_frame_join',
  name: 'Data Frame Join',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameJoin';
  },
  type: 'modal',
  component: DataFrameJoinEditor,
};

export default DataFrameJoinExtension;
