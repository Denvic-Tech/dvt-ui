import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useConnectAgentState } from '../model/useConnectAgentState';

import { AutoConnectTab } from './AutoConnectTab';

const Harness = () => <AutoConnectTab state={useConnectAgentState()} />;

const { createLinkMock } = vi.hoisted(() => ({
  createLinkMock: vi.fn(),
}));

vi.mock('@/features/profile/agent-connect', () => ({
  agentConnectApi: { createLink: createLinkMock },
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification: vi.fn() }),
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

const LINK_URL = 'http://dvt.test/api/agents/connect/link.md';

const revealPrompt = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Показать промпт' }));
  await screen.findByRole('button', { name: 'Скопировать промпт' });
};

describe('AutoConnectTab', () => {
  beforeEach(() => {
    createLinkMock.mockReset();
    createLinkMock.mockResolvedValue({
      url: LINK_URL,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });
  });

  it('does not request a link until the prompt is revealed', () => {
    render(<Harness />);

    expect(createLinkMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Показать промпт' })
    ).toBeEnabled();
    expect(screen.queryByText(LINK_URL)).not.toBeInTheDocument();
  });

  it('shows the link created for the current settings', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Мой агент' },
    });
    await revealPrompt();

    expect(screen.getByText(LINK_URL)).toBeInTheDocument();
    expect(createLinkMock).toHaveBeenCalledWith({
      base_url: window.location.origin,
      name: 'Мой агент',
      token_expires_at: null,
      access_scope: {
        schema_version: 1,
        purpose: 'mcp',
        projects: { mode: 'all' },
        db_connections: { mode: 'all' },
      },
    });
  });

  it('hides the prompt on edit and requests a new link only on reveal', async () => {
    render(<Harness />);
    await revealPrompt();

    const nameInput = screen.getByLabelText('Название');
    fireEvent.change(nameInput, { target: { value: 'А' } });
    fireEvent.change(nameInput, { target: { value: 'Аг' } });

    expect(screen.queryByText(LINK_URL)).not.toBeInTheDocument();
    expect(createLinkMock).toHaveBeenCalledTimes(1);

    await revealPrompt();

    expect(createLinkMock).toHaveBeenCalledTimes(2);
  });

  it('hides the prompt when the link expires', async () => {
    createLinkMock.mockResolvedValue({
      url: LINK_URL,
      expiresAt: new Date(Date.now() + 50).toISOString(),
    });
    render(<Harness />);

    await revealPrompt();

    await waitFor(() =>
      expect(screen.queryByText(LINK_URL)).not.toBeInTheDocument()
    );
  });

  it('ignores a response for settings that have changed since the request', async () => {
    let resolveLink: (value: unknown) => void = () => undefined;
    createLinkMock.mockReturnValue(
      new Promise(resolve => {
        resolveLink = resolve;
      })
    );
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Показать промпт' }));
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Новое' },
    });
    resolveLink({
      url: LINK_URL,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Показать промпт' })
      ).toBeEnabled()
    );
    expect(screen.queryByText(LINK_URL)).not.toBeInTheDocument();
  });
});
