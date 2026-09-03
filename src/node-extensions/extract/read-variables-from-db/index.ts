import type { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { ReadVariablesFromDBEditor } from './ui/ReadVariablesFromDBEditor';

const ReadVariablesFromDBExtension: NodeExtension = {
  id: 'read_variables_from_db',
  name: 'Read Variables From DB',
  condition: nodeDefinition => nodeDefinition.name === 'ReadVariablesFromDB',
  type: 'modal',
  component: ReadVariablesFromDBEditor,
};

export default ReadVariablesFromDBExtension;
