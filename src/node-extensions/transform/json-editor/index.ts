import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';

import { JsonEditorEditor } from './ui/JsonEditorEditor.tsx';

const JsonEditorExtension: NodeExtension = {
  id: 'json_editor',
  name: 'JSON Editor',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'JSONEditor';
  },
  type: 'modal',
  component: JsonEditorEditor,
};

export default JsonEditorExtension;
