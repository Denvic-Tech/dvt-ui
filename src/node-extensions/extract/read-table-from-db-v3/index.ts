import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { ReadTableFromDBV3 } from './ui/ReadTableFromDBV3';

const ReadTableFromDBV3Extension: NodeExtension = {
  id: 'read_table_from_db_v3',
  name: 'Read Table From DB V3',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'ReadTableFromDBV3';
  },
  type: 'modal',
  presentation: { type: 'workspace' },
  component: ReadTableFromDBV3,
};

export default ReadTableFromDBV3Extension;
