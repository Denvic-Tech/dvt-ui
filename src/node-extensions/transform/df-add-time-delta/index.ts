import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { AddTimeDeltaToDataFrameEditor } from './ui/AddTimeDeltaToDataFrame';

const AddTimeDeltaToDataFrameExtension: NodeExtension = {
  id: 'add_time_delta_to_data_frame',
  name: 'Add Time Delta To Data Frame',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'AddTimeDeltaToDataFrame';
  },
  type: 'modal',
  component: AddTimeDeltaToDataFrameEditor,
};

export default AddTimeDeltaToDataFrameExtension;
