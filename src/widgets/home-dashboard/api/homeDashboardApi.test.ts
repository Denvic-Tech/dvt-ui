import { describe, expect, it, vi } from 'vitest';

import { homeDashboardApi } from './homeDashboardApi';

const { getAllMock } = vi.hoisted(() => ({ getAllMock: vi.fn() }));

vi.mock('@/entities/project/projects/api/projectsApi', () => ({
  projectsApi: {
    getAll: (...args: unknown[]) => getAllMock(...args),
  },
}));

describe('widgets/home-dashboard/homeDashboardApi', () => {
  it('requests only the 10 most recently updated projects', async () => {
    getAllMock.mockResolvedValue([]);

    await homeDashboardApi.getRecentProjects();

    expect(getAllMock).toHaveBeenCalledWith({
      sortBy: 'updated_at',
      sortOrder: 'desc',
      limit: 10,
      silent: true,
    });
  });
});
