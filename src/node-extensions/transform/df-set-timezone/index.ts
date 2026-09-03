import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { SetTimezoneToDataFrameEditor } from './ui/DataFrameSetTimezoneEditor.tsx';

const DataFrameSetTimezoneExtension: NodeExtension = {
  id: 'data_frame_set_timezone',
  name: 'Data Frame Set Timezone',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameSetTimezone';
  },
  type: 'modal',
  component: SetTimezoneToDataFrameEditor,
};

export default DataFrameSetTimezoneExtension;
