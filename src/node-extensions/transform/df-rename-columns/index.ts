import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameRenameColumnsEditor } from './ui/DataFrameRenameColumnsEditor.tsx';

const DataFrameRenameColumnsExtension: NodeExtension = {
  id: 'data_frame_rename_columns',
  name: 'Data Frame Rename Columns',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'DataFrameRenameColumns';
  },
  type: 'modal',
  component: DataFrameRenameColumnsEditor,
};

export default DataFrameRenameColumnsExtension;
