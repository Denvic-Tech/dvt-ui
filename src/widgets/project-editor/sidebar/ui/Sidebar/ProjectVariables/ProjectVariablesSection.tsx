import { useEffect } from 'react';

import { useProjects } from '@/entities/project/projects/model/hooks/useProjects.ts';

import type {
  ProjectReadSchema,
  ProjectVariableCreate,
  ProjectVariableRead,
  ProjectVariableUpdate,
} from '@/shared/gatewayClient';

import { ProjectVariablesEditor } from './ProjectVariablesEditor.tsx';

type ProjectVariablesSectionProps = {
  currentProject: ProjectReadSchema;
  searchTerm: string;
};

const getErrorMessage = (detail: unknown): string | null => {
  if (!detail) {
    return null;
  }

  if (typeof detail === 'string') {
    return detail.trim() || null;
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
};

export const ProjectVariablesSection = ({
  currentProject,
  searchTerm,
}: ProjectVariablesSectionProps) => {
  const {
    createProjectVariable,
    deleteProjectVariable,
    loadProjectVariables,
    projectVariablesByProjectId,
    projectVariablesErrorByProjectId,
    projectVariablesStatusByProjectId,
    updateProjectVariable,
  } = useProjects();

  const projectVariables = projectVariablesByProjectId[currentProject.id] ?? [];
  const status = projectVariablesStatusByProjectId[currentProject.id] ?? 'idle';
  const requestError = projectVariablesErrorByProjectId[currentProject.id];

  useEffect(() => {
    if (status !== 'idle') {
      return;
    }

    void loadProjectVariables(currentProject.id);
  }, [currentProject.id, loadProjectVariables, status]);
  const isLoading = status === 'loading' && projectVariables.length === 0;
  const serverError =
    status === 'error'
      ? getErrorMessage(requestError?.detail ?? requestError?.message)
      : null;

  return (
    <ProjectVariablesEditor
      isLoading={isLoading}
      searchTerm={searchTerm}
      serverError={serverError}
      variables={projectVariables}
      onCreate={(
        variableKey: string,
        data: ProjectVariableCreate
      ): Promise<ProjectVariableRead> =>
        createProjectVariable(currentProject.id, variableKey, data)
      }
      onDelete={(variableKey: string) =>
        deleteProjectVariable(currentProject.id, variableKey).then(() => {
          return undefined;
        })
      }
      onUpdate={(
        variableKey: string,
        data: ProjectVariableUpdate
      ): Promise<ProjectVariableRead> =>
        updateProjectVariable(currentProject.id, variableKey, data)
      }
    />
  );
};
