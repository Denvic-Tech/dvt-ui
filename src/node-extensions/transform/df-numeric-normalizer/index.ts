import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { DataFrameNumericNormalizerEditor } from './ui/DataFrameNumericNormalizerEditor.tsx';

const DataFrameNumericNormalizerExtension: NodeExtension = {
  id: 'data_frame_numeric_normalizer',
  name: 'Data Frame Numeric Normalizer',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameNumericNormalizer';
  },
  type: 'modal',
  component: DataFrameNumericNormalizerEditor,
};

export default DataFrameNumericNormalizerExtension;
