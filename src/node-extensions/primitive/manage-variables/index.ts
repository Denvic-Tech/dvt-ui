import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { ManageVariablesNode } from './ui/ManageVariablesNode.tsx';

const ManageVariablesExtension: NodeExtension = {
  id: 'manage_variables',
  name: 'Manage Variables',
  condition: nodeDefinition => nodeDefinition.name === 'ManageVariables',
  type: 'modal',
  component: ManageVariablesNode,
};

export default ManageVariablesExtension;
