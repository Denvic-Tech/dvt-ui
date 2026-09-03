import { NodeExtension } from '@/app/providers/node-extensions/lib/types.ts';
import { LoadExcelEditor } from './ui/LoadExcelEditor.tsx';

const LoadExcelExtension: NodeExtension = {
  id: 'load_excel',
  name: 'Load Excel',
  condition: (nodeDefinition): boolean => {
    return nodeDefinition.name === 'LoadExcel';
  },
  type: 'modal',
  component: LoadExcelEditor,
};

export default LoadExcelExtension;
