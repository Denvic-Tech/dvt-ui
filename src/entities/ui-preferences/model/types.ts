export type ProjectsViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark';

export type SuppressiblePromptId = string;

export interface NodeLibraryUIPreferences {
  pinnedNodeNames: string[];
  collapsedCategories: Partial<Record<string, true>>;
}

export interface NodeModalWorkspaceUIPreferences {
  previewWidth: number;
}

export interface UIPreferencesState {
  themeMode: ThemeMode;
  projectsPage: {
    viewMode: ProjectsViewMode;
  };
  nodeLibrary: NodeLibraryUIPreferences;
  nodeModalWorkspace: NodeModalWorkspaceUIPreferences;
  skipHardStopConfirm: boolean;
  suppressedPrompts: Partial<Record<SuppressiblePromptId, true>>;
}
