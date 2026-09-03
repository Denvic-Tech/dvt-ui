import type { NodeModalStepperExtension } from '@/app/providers/node-extensions/lib/types';

import { {{component_name}} } from './ui/{{component_name}}';

type {{component_shared_state_name}} = {
  initialized: boolean;
};

const {{extension_const_name}}: NodeModalStepperExtension<{{component_shared_state_name}}> = {
  id: '{{extension_id}}',
  name: '{{node_name}}',
  condition: nodeDefinition => nodeDefinition.name === '{{node_name}}',
  type: 'modal_stepper',
  steps: [
    {
      id: 'main',
      label: '{{node_display_name}}',
      component: {{component_name}},
    },
  ],
};

export default {{extension_const_name}};
