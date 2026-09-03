import React from 'react';

import { useCurrentProject } from '@/entities/project/projects';

import { EmptyState, SettingsContainer } from '../ProjectSettings/styles.ts';

import { ProjectVariablesSection } from './ProjectVariablesSection.tsx';

type ProjectVariablesProps = {
  searchTerm: string;
};

export const ProjectVariables: React.FC<ProjectVariablesProps> = ({
  searchTerm,
}) => {
  const { currentProject } = useCurrentProject();

  if (!currentProject) {
    return (
      <SettingsContainer>
        <EmptyState>Выберите проект для настройки переменных</EmptyState>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <ProjectVariablesSection
        currentProject={currentProject}
        searchTerm={searchTerm}
      />
    </SettingsContainer>
  );
};
