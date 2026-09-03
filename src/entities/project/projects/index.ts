export { projectsApi } from './api/projectsApi.ts';

export { projectsActions, projectsReducer } from './model/slice.ts';

export { useProjects } from './model/hooks/useProjects.ts';
export { useCurrentProject } from './model/hooks/useCurrentProject.ts';

export { ProjectCard } from './ui/ProjectCard.tsx';
export { CreateProjectModal } from './ui/CreateProjectModal.tsx';
