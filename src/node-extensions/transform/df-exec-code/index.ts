import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameExecCode } from './ui/DataFrameExecCode.tsx';

const DataFrameExecCodeExtension: NodeExtension = {
  id: 'data_frame_exec_code',
  name: 'Data Frame Exec Code',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'DataFrameExecCode';
  },
  type: 'modal',
  component: DataFrameExecCode,
};

export default DataFrameExecCodeExtension;
