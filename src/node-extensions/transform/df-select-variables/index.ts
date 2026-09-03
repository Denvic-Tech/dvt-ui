import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { DataFrameSelectVariablesEditor } from './ui/DataFrameSelectVariablesEditor';

const DataFrameSelectVariablesExtension: NodeExtension = {
  id: 'data_frame_select_variables',
  name: 'Data Frame Select Variables',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameSelectVariables';
  },
  type: 'modal',
  component: DataFrameSelectVariablesEditor,
};

export default DataFrameSelectVariablesExtension;
