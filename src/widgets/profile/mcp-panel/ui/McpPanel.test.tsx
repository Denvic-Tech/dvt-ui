import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { McpPanel } from './McpPanel';

const { createLinkMock } = vi.hoisted(() => ({
  createLinkMock: vi.fn(),
}));

vi.mock('@/features/profile/agent-connect', () => ({
  agentConnectApi: { createLink: createLinkMock },
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: vi.fn() }),
}));

vi.mock('@/entities/admin/mcp-token', () => ({
  useMcpTokens: () => ({
    items: [],
    status: 'succeeded',
    error: null,
    creationStatus: 'idle',
    createdSecret: null,
    loadMcpTokens: vi.fn().mockResolvedValue([]),
    createMcpToken: vi.fn(),
    renameMcpToken: vi.fn(),
    revokeMcpToken: vi.fn(),
    resetCreationState: vi.fn(),
  }),
}));

vi.mock('@/entities/project/projects', () => ({
  useProjects: () => ({
    projects: [],
    loading: false,
    loadProjects: vi.fn(),
  }),
}));

vi.mock('@/entities/data/db-connection', () => ({
  useConnections: () => ({
    connections: [],
    loading: false,
    fetchConnections: vi.fn(),
  }),
}));

const NARROW_WIDTH = 1503;
const WIDE_WIDTH = 1504;
const LINK_URL = 'http://dvt.test/api/agents/connect/link.md';

let containerWidth = NARROW_WIDTH;
let notifyResize: () => void = () => undefined;

const resizeContainerTo = (width: number) => {
  containerWidth = width;
  act(() => notifyResize());
};

const connectButton = () =>
  screen.queryByRole('button', { name: 'Подключить MCP' });

const isDrawerOpen = () => screen.queryByRole('presentation') !== null;

describe('McpPanel adaptive connect panel', () => {
  beforeEach(() => {
    containerWidth = NARROW_WIDTH;
    createLinkMock.mockReset();
    createLinkMock.mockResolvedValue({
      url: LINK_URL,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
      () => containerWidth
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notifyResize = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the floating panel below the threshold', () => {
    render(<McpPanel />);

    expect(connectButton()).toBeInTheDocument();
    expect(isDrawerOpen()).toBe(false);

    fireEvent.click(connectButton()!);

    expect(isDrawerOpen()).toBe(true);
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('shows an always open column from the threshold, without button and cross', () => {
    containerWidth = WIDE_WIDTH;
    render(<McpPanel />);

    expect(connectButton()).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Закрыть' })).toBeNull();
    expect(isDrawerOpen()).toBe(false);
    expect(
      within(screen.getByRole('complementary')).getByText('Подключить MCP')
    ).toBeInTheDocument();
  });

  it('keeps the state and does not reissue the link across the threshold', async () => {
    render(<McpPanel />);
    fireEvent.click(connectButton()!);
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Мой агент' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Показать промпт' }));
    await screen.findByText(LINK_URL);

    resizeContainerTo(WIDE_WIDTH);

    expect(screen.getByLabelText('Название')).toHaveValue('Мой агент');
    expect(screen.getByText(LINK_URL)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Вручную' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Codex' }));

    resizeContainerTo(NARROW_WIDTH);

    expect(isDrawerOpen()).toBe(false);
    fireEvent.click(connectButton()!);

    expect(screen.getByRole('tab', { name: 'Вручную' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('radio', { name: 'Codex' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(createLinkMock).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state without the list heading and opens the create dialog', () => {
    render(<McpPanel />);

    expect(screen.getByText('Токенов пока нет')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Токены' })).toBeNull();
    expect(screen.queryByText('Новый MCP-токен')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'создайте токен' }));

    expect(screen.getByText('Новый MCP-токен')).toBeInTheDocument();
  });

  it('turns an open floating panel into the column and comes back closed', () => {
    render(<McpPanel />);
    fireEvent.click(connectButton()!);
    expect(isDrawerOpen()).toBe(true);

    resizeContainerTo(WIDE_WIDTH);

    expect(isDrawerOpen()).toBe(false);
    expect(screen.getByRole('complementary')).toBeInTheDocument();

    resizeContainerTo(NARROW_WIDTH);

    expect(connectButton()).toBeInTheDocument();
    expect(isDrawerOpen()).toBe(false);
  });
});
