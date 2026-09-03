import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectEditorRoute } from '../ui/ProjectEditorRoute.tsx';

const { navigateMock, useCurrentProjectMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useCurrentProjectMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/entities/project/projects', () => ({
  useCurrentProject: () => useCurrentProjectMock(),
}));

vi.mock('@/features/project-editor/sync-graph', () => ({
  useGraphUnsavedChangesGuard: vi.fn(),
}));

vi.mock('../ui/ProjectEditorPage.tsx', () => ({
  ProjectEditorPage: () => <div>project editor content</div>,
}));

vi.mock('@/app/router/ui/PageTitle.tsx', () => ({
  PageTitle: ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

describe('pages/ProjectEditorPage/ProjectEditorRoute', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useCurrentProjectMock.mockReset();
  });

  it('shows loader while project access is being resolved', () => {
    useCurrentProjectMock.mockReturnValue({
      currentProject: null,
      isProjectLoading: false,
      isProjectUnavailable: false,
      projectAccessError: null,
    });

    render(<ProjectEditorRoute />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(
      screen.queryByText('project editor content')
    ).not.toBeInTheDocument();
  });

  it('shows not found dialog for missing project and redirects to projects list', () => {
    useCurrentProjectMock.mockReturnValue({
      currentProject: null,
      isProjectLoading: false,
      isProjectUnavailable: true,
      projectAccessError: {
        code: 'HTTP_404',
        message: 'Not found',
        status: 404,
      },
    });

    render(<ProjectEditorRoute />);

    expect(
      screen.getByRole('heading', { name: 'Проект не найден' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/проект не существует или был удалён/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'К списку проектов' }));

    expect(navigateMock).toHaveBeenCalledWith('/projects', { replace: true });
  });

  it('shows forbidden dialog for inaccessible project', () => {
    useCurrentProjectMock.mockReturnValue({
      currentProject: null,
      isProjectLoading: false,
      isProjectUnavailable: true,
      projectAccessError: {
        code: 'HTTP_403',
        message: 'Forbidden',
        status: 403,
      },
    });

    render(<ProjectEditorRoute />);

    expect(
      screen.getByRole('heading', { name: 'Нет доступа к проекту' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/у вас нет доступа к этому проекту/i)
    ).toBeInTheDocument();
  });

  it('renders editor when project is available', () => {
    useCurrentProjectMock.mockReturnValue({
      currentProject: {
        id: 'project-1',
        name: 'Alpha',
      },
      isProjectLoading: false,
      isProjectUnavailable: false,
      projectAccessError: null,
    });

    render(<ProjectEditorRoute />);

    expect(screen.getByText('project editor content')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
