import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { LoadJSONEditor } from './ui/LoadJSONEditor';

const LoadJSONExtension: NodeExtension = {
  id: 'load_json',
  name: 'Load JSON',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'LoadJSON';
  },
  type: 'modal',
  component: LoadJSONEditor,
};

export default LoadJSONExtension;
