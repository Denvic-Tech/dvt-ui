import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { DataFrameRegexReplaceEditor } from './ui/DataFrameRegexReplaceEditor.tsx';

const DataFrameRegexReplaceExtension: NodeExtension = {
  id: 'data_frame_regex_replace',
  name: 'Data Frame Regex Replace',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'DataFrameRegexReplace';
  },
  type: 'modal',
  allowOpenWithoutConnectedMetadata: true,
  presentation: { type: 'centered', contentWidth: 'wide' },
  component: DataFrameRegexReplaceEditor,
};

export default DataFrameRegexReplaceExtension;
