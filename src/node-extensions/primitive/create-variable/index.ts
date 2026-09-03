import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { CreateVariableNode } from './ui/CreateVariableNode.tsx';

const CreateVariableExtension: NodeExtension = {
  id: 'create_variable',
  name: 'Create Variable',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'CreateVariable';
  },
  type: 'modal',
  component: CreateVariableNode,
};

export default CreateVariableExtension;
