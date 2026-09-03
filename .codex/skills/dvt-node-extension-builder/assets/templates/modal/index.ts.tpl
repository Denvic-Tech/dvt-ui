import type { NodeModalExtension } from '@/app/providers/node-extensions/lib/types';

import { {{component_name}} } from './ui/{{component_name}}';

const {{extension_const_name}}: NodeModalExtension = {
  id: '{{extension_id}}',
  name: '{{node_name}}',
  condition: nodeDefinition => nodeDefinition.name === '{{node_name}}',
  type: 'modal',
  component: {{component_name}},
};

export default {{extension_const_name}};
