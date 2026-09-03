import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { LoadCSVEditor } from './ui/LoadCSVEditor';

const LoadCSVExtension: NodeExtension = {
  id: 'load_csv',
  name: 'Load CSV',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'LoadCSV';
  },
  type: 'modal',
  component: LoadCSVEditor,
};

export default LoadCSVExtension;
