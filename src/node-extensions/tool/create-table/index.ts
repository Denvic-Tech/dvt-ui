import type { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { CreateTableEditor } from './ui/CreateTableEditor';

const CreateTableExtension: NodeExtension = {
  id: 'create_table',
  name: 'Create Table',
  condition: nodeDefinition => nodeDefinition.name === 'CreateTable',
  type: 'modal',
  component: CreateTableEditor,
};

export default CreateTableExtension;
