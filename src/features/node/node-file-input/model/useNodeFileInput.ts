import { useCallback } from 'react';

import { useAppSelector } from '@/app/providers/store';

import { nodeFileInputApi } from '../api';

const DEFAULT_NODE_FILE_INPUT_NAME = 'file';

export const useNodeFileInput = (
  nodeID: string,
  inputName = DEFAULT_NODE_FILE_INPUT_NAME
) => {
  const projectID = useAppSelector(
    state => state.projects.selectedProject?.id ?? null
  );

  const uploadNodeFileInput = useCallback(
    async (file: File | Blob) => {
      if (!projectID) {
        throw new Error('Не удалось определить текущий проект');
      }

      return nodeFileInputApi.upload(projectID, nodeID, inputName, file);
    },
    [inputName, nodeID, projectID]
  );

  const deleteNodeFileInput = useCallback(
    async (path: string) => {
      if (!projectID) {
        throw new Error('Не удалось определить текущий проект');
      }

      return nodeFileInputApi.delete(projectID, nodeID, inputName, path);
    },
    [inputName, nodeID, projectID]
  );

  return {
    inputName,
    projectID,
    uploadNodeFileInput,
    deleteNodeFileInput,
  };
};
