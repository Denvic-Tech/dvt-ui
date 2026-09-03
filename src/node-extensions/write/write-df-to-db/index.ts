import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { WriteDataFrameToDB } from './ui/WriteDataFrameToDB.tsx';

const WriteDataFrameToDBExtension: NodeExtension = {
  id: 'write_data_frame_to_db',
  name: 'Write Data Frame To DB',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'WriteDataFrameToDB';
  },
  type: 'modal',
  component: WriteDataFrameToDB,
};

export default WriteDataFrameToDBExtension;
