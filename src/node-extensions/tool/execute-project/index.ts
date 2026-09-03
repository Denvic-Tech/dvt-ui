import { NodeModalExtension } from '@/app/providers/node-extensions/lib/types';

import { getConstValue } from '@/shared/lib/node-input-values';

import { ExecuteProjectEditor } from './ui/ExecuteProjectEditor';

const ExecuteProjectExtension: NodeModalExtension = {
  id: 'execute_project',
  name: 'Execute Project',
  condition: nodeDefinition => {
    return nodeDefinition.name === 'ExecuteProject';
  },
  type: 'modal',
  component: ExecuteProjectEditor,
  getHeaderDescription: ({ data }) => {
    const targetProjectName = getConstValue<string>(
      data.inputValues['target_project_name']
    )?.trim();

    return targetProjectName
      ? `Выбранный проект: "${targetProjectName}"`
      : null;
  },
};

export default ExecuteProjectExtension;
