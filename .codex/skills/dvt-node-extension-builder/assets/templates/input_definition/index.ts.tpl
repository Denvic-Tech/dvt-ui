import type { NodeInputDefinitionExtension } from '@/app/providers/node-extensions/lib/types';

import { {{component_name}} } from './ui/{{component_name}}';

const {{extension_const_name}}: NodeInputDefinitionExtension = {
  id: '{{extension_id}}',
  name: '{{node_name}}',
  type: 'input_definition',
  allowInModal: true,
  condition: context =>
    context.nodeDefinition.name === '{{node_name}}' &&
    context.inputDefinition.attr_name === '{{suggested_input_attr_name}}',
  component: {{component_name}},
};

export default {{extension_const_name}};
