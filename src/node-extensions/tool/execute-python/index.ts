import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { ExecutePython } from './ui/ExecutePython.tsx';

const ExecutePythonExtension: NodeExtension = {
  id: 'execute_python',
  name: 'Execute Python',
  type: 'input_definition',
  allowInNode: false,
  condition: context =>
    context.nodeDefinition.name === 'ExecutePython' &&
    context.inputDefinition.attr_name === 'code',
  component: ExecutePython,
};

export default ExecutePythonExtension;
