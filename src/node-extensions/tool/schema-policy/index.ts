import type { NodeExtension } from '@/app/providers/node-extensions/lib/types';

import { SchemaPolicyEditor } from './ui/SchemaPolicyEditor';

const SchemaPolicyExtension: NodeExtension = {
  id: 'schema_policy',
  name: 'Schema Policy',
  allowOpenWithoutConnectedMetadata: true,
  condition: nodeDefinition => nodeDefinition.name === 'SchemaPolicy',
  type: 'modal',
  component: SchemaPolicyEditor,
};

export default SchemaPolicyExtension;
