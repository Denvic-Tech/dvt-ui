import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import { HomeSearch } from './HomeSearch';

const { navigateMock, searchResultsRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  searchResultsRef: { current: [] as ProjectReadSchema[] },
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  )),
  useNavigate: () => navigateMock,
}));

vi.mock('../../model/useProjectSearch', () => ({
  useProjectSearch: () => ({
    failed: false,
    loading: false,
    results: searchResultsRef.current,
    retry: vi.fn(),
    total: searchResultsRef.current.length,
  }),
}));

vi.mock(
  '@/features/projects/users-projects/ui/ProjectsSourceSearchDialog',
  () => ({
    ProjectsSourceSearchDialog: ({
      initialQuery,
      onOpenProject,
      open,
    }: {
      initialQuery: string;
      onOpenProject: (projectId: string) => void;
      open: boolean;
    }) =>
      open ? (
        <div role='dialog' aria-label='source search'>
          {initialQuery}
          <button type='button' onClick={() => onOpenProject('project-9')}>
            open found project
          </button>
        </div>
      ) : null,
  })
);

const project = (id: string, name: string): ProjectReadSchema => ({
  id,
  name,
  organization_id: 'org-1',
});

const renderSearch = () =>
  render(
    <MemoryRouter>
      <HomeSearch onPickSection={vi.fn()} recentProjects={[]} sections={[]} />
    </MemoryRouter>
  );

describe('widgets/home-dashboard/HomeSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchResultsRef.current = [];
  });

  it('uses the source-search placeholder', () => {
    renderSearch();

    expect(
      screen.getByPlaceholderText('Проект, раздел или поиск по источнику')
    ).toBeInTheDocument();
  });

  it('lists at most 5 projects and offers source search after them', () => {
    searchResultsRef.current = Array.from({ length: 5 }, (_, index) =>
      project(`p-${index}`, `orders ${index}`)
    );

    renderSearch();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'orders' },
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(6);
    expect(options[5]).toHaveTextContent('Найти проекты по источнику «orders»');
  });

  it('opens the source search dialog and navigates to a found project', () => {
    renderSearch();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: ' sales_mart ' },
    });

    fireEvent.click(
      screen.getByRole('option', { name: /Найти проекты по источнику/ })
    );

    expect(
      screen.getByRole('dialog', { name: 'source search' })
    ).toHaveTextContent('sales_mart');

    fireEvent.click(screen.getByRole('button', { name: 'open found project' }));
    expect(navigateMock).toHaveBeenCalledWith('/project-editor/project-9');
    expect(
      screen.queryByRole('dialog', { name: 'source search' })
    ).not.toBeInTheDocument();
  });

  it('hides source search while the query is empty', () => {
    renderSearch();
    fireEvent.focus(screen.getByRole('combobox'));

    expect(
      screen.queryByRole('option', { name: /Найти проекты по источнику/ })
    ).not.toBeInTheDocument();
  });
});
