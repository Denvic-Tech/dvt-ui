import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NodeModalWorkspaceContentWidth } from '../model/types';

import { NodeModalWorkspace } from './NodeModalWorkspace';

const { setPreviewWidth } = vi.hoisted(() => ({
  setPreviewWidth: vi.fn(),
}));

vi.mock('@/entities/ui-preferences/model/hooks', () => ({
  useNodeModalWorkspacePreferences: () => ({
    previewWidth: 420,
    setPreviewWidth,
  }),
}));

const sections = [
  {
    id: 'database',
    label: 'База данных',
    icon: <span>DB</span>,
    summary: 'analytics',
    required: true,
    complete: true,
    content: <div>Database content</div>,
  },
  {
    id: 'table',
    label: 'Таблица',
    icon: <span>T</span>,
    summary: 'Не выбрана',
    required: true,
    content: <div>Table content</div>,
  },
  {
    id: 'columns',
    label: 'Колонки',
    icon: <span>C</span>,
    disabled: true,
    disabledReason: 'Сначала выберите таблицу',
    content: <div>Columns content</div>,
  },
];

const ControlledWorkspace = ({
  contentWidth,
}: {
  contentWidth?: NodeModalWorkspaceContentWidth;
}) => {
  const [activeSectionId, setActiveSectionId] = useState('database');

  return (
    <NodeModalWorkspace
      sections={sections}
      activeSectionId={activeSectionId}
      onSectionChange={setActiveSectionId}
      {...(contentWidth ? { contentWidth } : {})}
      preview={{ title: 'Предпросмотр', content: <div>Preview content</div> }}
    />
  );
};

const renderWorkspace = () => {
  render(<ControlledWorkspace />);
};

describe('NodeModalWorkspace', () => {
  it('renders all zones, statuses and required progress', () => {
    renderWorkspace();

    expect(
      screen.getByRole('navigation', { name: 'Секции настройки ноды' })
    ).toBeInTheDocument();
    expect(screen.getByText('Database content')).toBeInTheDocument();
    expect(screen.getByText('Preview content')).toBeInTheDocument();
    expect(screen.getByText('Обязательные шаги: 1 / 2')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/node/modal-workspace/main').firstElementChild
    ).toHaveStyle({ maxWidth: '800px', paddingTop: '0px' });
    expect(
      screen.getByTestId('features/node/modal-workspace/preview-header')
    ).toHaveStyle({ minHeight: '52px' });

    fireEvent.click(screen.getByRole('tab', { name: /Таблица/ }));
    expect(screen.getByText('Table content')).toBeInTheDocument();

    const disabledSection = screen.getByRole('tab', { name: /Колонки/ });
    expect(disabledSection).toBeDisabled();
    fireEvent.click(disabledSection);
    expect(screen.queryByText('Columns content')).not.toBeInTheDocument();
  });

  it('provides a wider responsive content preset', () => {
    render(<ControlledWorkspace contentWidth='wide' />);

    expect(
      screen.getByTestId('features/node/modal-workspace/main').firstElementChild
    ).toHaveStyle({
      maxWidth: '1200px',
      width: '100%',
      height: '100%',
      marginLeft: '0px',
      marginRight: 'auto',
    });
  });

  it('supports keyboard section navigation and preview collapse', () => {
    renderWorkspace();

    const databaseTab = screen.getByRole('tab', { name: /База данных/ });
    databaseTab.focus();
    fireEvent.keyDown(databaseTab, { key: 'ArrowDown' });
    expect(screen.getByText('Table content')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Свернуть предпросмотр' })
    );
    expect(
      screen.queryByTestId('features/node/modal-workspace/preview')
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('features/node/modal-workspace/preview-collapsed')
    ).toBeInTheDocument();
    expect(screen.getByText('Предпросмотр')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Открыть предпросмотр' })
    );
    expect(
      screen.getByTestId('features/node/modal-workspace/preview')
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('features/node/modal-workspace/preview-collapsed')
    ).not.toBeInTheDocument();
  });

  it('resizes preview by keyboard, pointer and double click', () => {
    renderWorkspace();
    const root = screen.getByTestId('features/node/modal-workspace');
    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 1800,
    });
    fireEvent(window, new Event('resize'));

    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuemin', '736');
    expect(separator).toHaveAttribute('aria-valuemax', '976');
    Object.assign(separator, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    });

    fireEvent.keyDown(separator, { key: 'ArrowLeft' });
    expect(setPreviewWidth).toHaveBeenLastCalledWith(752);

    fireEvent.pointerDown(separator, {
      pointerId: 1,
      clientX: 500,
    });
    fireEvent.pointerUp(separator, {
      pointerId: 1,
      clientX: 100,
    });
    expect(setPreviewWidth).toHaveBeenLastCalledWith(976);

    fireEvent.doubleClick(separator);
    expect(setPreviewWidth).toHaveBeenLastCalledWith(736);
  });

  it('clamps preview width to preserve the minimum main column', () => {
    renderWorkspace();
    const root = screen.getByTestId('features/node/modal-workspace');
    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 1200,
    });
    fireEvent(window, new Event('resize'));

    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuemax', '376');
    Object.assign(separator, {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    });
    fireEvent.pointerDown(separator, { pointerId: 2, clientX: 500 });
    fireEvent.pointerUp(separator, { pointerId: 2, clientX: 100 });

    expect(setPreviewWidth).toHaveBeenLastCalledWith(376);
  });

  it('hides preview when space is tight and restores it after resize', () => {
    renderWorkspace();
    const root = screen.getByTestId('features/node/modal-workspace');
    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    fireEvent(window, new Event('resize'));

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('features/node/modal-workspace/preview')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Открыть предпросмотр' })
    ).not.toBeInTheDocument();

    Object.defineProperty(root, 'clientWidth', {
      configurable: true,
      value: 1200,
    });
    fireEvent(window, new Event('resize'));

    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/node/modal-workspace/preview')
    ).toBeInTheDocument();
  });
});
