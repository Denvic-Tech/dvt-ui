import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResetProjectCacheButton } from './ResetProjectCacheButton';

const {
  clearProjectCacheMock,
  confirmMock,
  dispatchMock,
  showNotificationMock,
  unwrapMock,
} = vi.hoisted(() => ({
  clearProjectCacheMock: vi.fn(),
  confirmMock: vi.fn(),
  dispatchMock: vi.fn(),
  showNotificationMock: vi.fn(),
  unwrapMock: vi.fn(),
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification: showNotificationMock }),
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
}));

vi.mock(
  '@/features/projects/reset-project-cache/model/clearProjectCache',
  () => ({
    clearProjectCache: clearProjectCacheMock,
  })
);

vi.mock('@/entities/project/projects', () => ({
  useCurrentProject: () => ({ currentProject: { id: 'project-1' } }),
}));

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: confirmMock }),
}));

describe('ResetProjectCacheButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProjectCacheMock.mockReturnValue({
      type: 'cache/clearProjectCache',
    });
    dispatchMock.mockReturnValue({ unwrap: unwrapMock });
    unwrapMock.mockResolvedValue(undefined);
  });

  it('does not clear the cache when confirmation is cancelled', async () => {
    confirmMock.mockResolvedValue(false);

    render(<ResetProjectCacheButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Сбросить кэш проекта' })
    );

    await waitFor(() => expect(confirmMock).toHaveBeenCalledOnce());
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('clears the cache only after confirmation', async () => {
    confirmMock.mockResolvedValue(true);

    render(<ResetProjectCacheButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Сбросить кэш проекта' })
    );

    await waitFor(() => expect(unwrapMock).toHaveBeenCalledOnce());

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Сбросить кэш проекта?',
        confirmLabel: 'Сбросить кэш',
        confirmColor: 'error',
      })
    );
    expect(clearProjectCacheMock).toHaveBeenCalledOnce();
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'cache/clearProjectCache',
    });
    expect(showNotificationMock).toHaveBeenCalledWith({
      type: 'success',
      title: 'Кэш проекта очищен',
    });
  });

  it('shows the API error when cache clearing fails', async () => {
    confirmMock.mockResolvedValue(true);
    unwrapMock.mockRejectedValue({ detail: 'Сервис кэша недоступен' });
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    render(<ResetProjectCacheButton />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Сбросить кэш проекта' })
    );

    await waitFor(() =>
      expect(showNotificationMock).toHaveBeenCalledWith({
        type: 'error',
        title: 'Не удалось очистить кэш проекта',
        detail: 'Сервис кэша недоступен',
      })
    );

    consoleErrorSpy.mockRestore();
  });
});
