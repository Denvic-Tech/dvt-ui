import { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { hasFilledSelectorValue } from './lib/helpers';
import { ReadTableFromDBV3 } from './ui/ReadTableFromDBV3';

const ReadTableFromDBV3Extension: NodeExtension = {
  id: 'read_table_from_db_v3',
  name: 'Read Table From DB V3',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'ReadTableFromDBV3';
  },
  type: 'modal',
  presentation: { type: 'workspace' },
  dialogSize: { width: 1180, height: 720 },
  isSaveDisabled: values => !hasFilledSelectorValue(values?.['table_name']),
  component: ReadTableFromDBV3,
};

export default ReadTableFromDBV3Extension;
