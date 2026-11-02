import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { ExecutePython } from './ui/ExecutePython.tsx';

const ExecutePythonExtension: NodeExtension = {
  id: 'execute_python',
  name: 'Execute Python',
  type: 'modal',
  presentation: { type: 'workspace' },
  dialogSize: { width: 1100, height: 960 },
  condition: nodeDefinition => nodeDefinition.name === 'ExecutePython',
  component: ExecutePython,
};

export default ExecutePythonExtension;
