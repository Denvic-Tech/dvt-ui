import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { DataFrameCastColumnTypeEditor } from './ui/DataFrameCastColumnType';

const DataFrameCastColumnTypeExtension: NodeExtension = {
  id: 'data_frame_cast_column_type',
  name: 'Data Frame Cast Column Type',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'DataFrameCastColumnType';
  },
  type: 'modal',
  component: DataFrameCastColumnTypeEditor,
};

export default DataFrameCastColumnTypeExtension;
