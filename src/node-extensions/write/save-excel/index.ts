import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { SaveExcelEditor } from './ui/SaveExcelEditor.tsx';

const SaveExcelExtension: NodeExtension = {
  id: 'save_excel',
  name: 'Save Excel',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'SaveExcel';
  },
  type: 'modal',
  component: SaveExcelEditor,
};

export default SaveExcelExtension;
