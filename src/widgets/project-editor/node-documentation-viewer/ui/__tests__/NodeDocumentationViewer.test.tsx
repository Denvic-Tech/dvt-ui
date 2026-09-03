import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NodeDocumentationViewer } from '../index';

const viewerRef = vi.hoisted(() => ({
  current: {
    closeViewer: vi.fn(),
    nodeName: 'expand_json',
    nodeTitle: 'Expand JSON',
    open: true,
  } as any,
}));

const documentationRef = vi.hoisted(() => ({
  current: {
    documentation: null,
    error: null,
    isLoading: false,
    reload: vi.fn(),
    status: 'idle',
  } as any,
}));

vi.mock('@/entities/node/node-documentation-viewer', () => ({
  useNodeDocumentationViewer: () => viewerRef.current,
}));

vi.mock('@/entities/node/node-documentation', () => ({
  useNodeDocumentation: () => documentationRef.current,
}));

describe('NodeDocumentationViewer', () => {
  it('renders markdown documentation in global dialog', () => {
    documentationRef.current = {
      documentation: {
        content: '# Заголовок\n\nОписание `кода`.',
        locale: 'ru-RU',
        node_name: 'expand_json',
      },
      error: null,
      isLoading: false,
      reload: vi.fn(),
      status: 'succeeded',
    };

    render(<NodeDocumentationViewer />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Документация ноды')).toBeInTheDocument();
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
  });

  it('retries loading on error and closes through global viewer action', () => {
    const reload = vi.fn();
    const closeViewer = vi.fn();
    viewerRef.current = {
      closeViewer,
      nodeName: 'expand_json',
      nodeTitle: 'Expand JSON',
      open: true,
    };
    documentationRef.current = {
      documentation: null,
      error: {
        code: 'DOC_FETCH_FAILED',
        message: 'Не удалось получить документацию',
      },
      isLoading: false,
      reload,
      status: 'failed',
    };

    render(<NodeDocumentationViewer />);

    fireEvent.click(screen.getByText('Повторить'));
    fireEvent.click(screen.getByLabelText('Закрыть документацию'));

    expect(reload).toHaveBeenCalledWith({ force: true });
    expect(closeViewer).toHaveBeenCalledTimes(1);
  });
});
