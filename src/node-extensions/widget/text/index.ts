import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { TextFormat } from './ui/Text.tsx';

const TextExtension: NodeExtension = {
  id: 'text',
  name: 'Text',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'Text';
  },
  type: 'node_content_top',
  component: TextFormat,
};

export default TextExtension;
