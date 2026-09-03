import type { NodeContextMenuExtension } from '@/app/providers/node-extensions/lib/types';

import { build{{component_name}}Items } from './ui/{{component_name}}';

const {{extension_const_name}}: NodeContextMenuExtension = {
  id: '{{extension_id}}',
  name: '{{node_name}}',
  condition: nodeDefinition => nodeDefinition.name === '{{node_name}}',
  type: 'context_menu',
  getItems: build{{component_name}}Items,
};

export default {{extension_const_name}};
