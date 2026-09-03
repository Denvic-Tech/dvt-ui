import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { LoadParquetEditor } from './ui/LoadParquetEditor.tsx';

const LoadParquetExtension: NodeExtension = {
  id: 'load_parquet',
  name: 'Load Parquet',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'LoadParquet';
  },
  type: 'modal',
  component: LoadParquetEditor,
};

export default LoadParquetExtension;
