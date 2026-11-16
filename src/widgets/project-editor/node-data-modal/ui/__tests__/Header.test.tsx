import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CommentTrigger } from '../CommentSection';
import { Header } from '../Header';

vi.mock('@/shared/ui', () => ({
  EditableComment: () => <div data-testid='editable-comment' />,
}));

describe('node-data-modal Header', () => {
  it('shows documentation link only when handler is provided', () => {
    const { rerender } = render(
      <Header
        title='Expand JSON'
        subtitle='Expand JSON'
        onClose={vi.fn()}
        onChangeTitle={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Документация')).not.toBeInTheDocument();

    const onOpenDocumentation = vi.fn();

    rerender(
      <Header
        title='Expand JSON'
        subtitle='Expand JSON'
        onClose={vi.fn()}
        onChangeTitle={vi.fn()}
        onOpenDocumentation={onOpenDocumentation}
      />
    );

    fireEvent.click(screen.getByLabelText('Документация'));

    expect(onOpenDocumentation).toHaveBeenCalledTimes(1);
  });

  it('shows the node type next to the title only after renaming', () => {
    const { rerender } = render(
      <Header
        title='Read Table DB V3'
        subtitle='Read Table DB V3'
        onClose={vi.fn()}
        onChangeTitle={vi.fn()}
      />
    );

    expect(screen.getAllByText('Read Table DB V3')).toHaveLength(1);

    rerender(
      <Header
        title='Заказы за ноябрь'
        subtitle='Read Table DB V3'
        onClose={vi.fn()}
        onChangeTitle={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Переименовать ноду' })
    ).toHaveTextContent('Заказы за ноябрь');
    expect(screen.getByText('Read Table DB V3')).toBeInTheDocument();
  });

  it('renames the node and closes from the icon button', () => {
    const onClose = vi.fn();
    const onChangeTitle = vi.fn();
    render(
      <Header
        title='Read Table DB V3'
        subtitle='Read Table DB V3'
        onClose={onClose}
        onChangeTitle={onChangeTitle}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Переименовать ноду' }));
    const input = screen.getByRole('textbox', { name: 'Название ноды' });
    fireEvent.change(input, { target: { value: 'Заказы' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChangeTitle).toHaveBeenCalledWith('Заказы');

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('marks the comment button with a dot when a comment exists', () => {
    const { container, rerender } = render(
      <CommentTrigger value='' onClick={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: 'Добавить комментарий' })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('button > span')).toHaveLength(0);

    rerender(<CommentTrigger value='Проверить фильтр' onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Открыть комментарий' })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('button > span')).toHaveLength(1);
  });
});
