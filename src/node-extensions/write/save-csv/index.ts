import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { SaveCSVEditor } from './ui/SaveCSVEditor.tsx';

const SaveCSVExtension: NodeExtension = {
  id: 'save_csv',
  name: 'Save CSV',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'SaveCSV';
  },
  type: 'modal',
  component: SaveCSVEditor,
};

export default SaveCSVExtension;
