import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { DataFrameFillNAEditor } from './ui/DataFrameFillNAEditor';

const DataFrameFillNAExtension: NodeExtension = {
  id: 'df_fill_na',
  name: 'Data Frame Fill NA',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameFillNA';
  },
  type: 'modal',
  component: DataFrameFillNAEditor,
};

export default DataFrameFillNAExtension;
