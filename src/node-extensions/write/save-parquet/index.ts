import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { SaveParquetEditor } from './ui/SaveParquetEditor.tsx';

const SaveParquetExtension: NodeExtension = {
  id: 'save_parquet',
  name: 'Save Parquet',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'SaveParquet';
  },
  type: 'modal',
  component: SaveParquetEditor,
};

export default SaveParquetExtension;
