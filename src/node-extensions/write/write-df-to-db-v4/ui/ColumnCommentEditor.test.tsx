import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ColumnCommentEditor } from './ColumnCommentEditor';

describe('column comment editor', () => {
  it('edits multiline text without trimming and can cancel', () => {
    const change = vi.fn();
    render(
      <ColumnCommentEditor
        name='id'
        value='DB'
        sourceComment='DF'
        onChange={change}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Комментарий колонки id' })
    );
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: '  new\n ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Принять' }));
    expect(change).toHaveBeenCalledWith('  new\n ');
  });
  it('clears explicitly and imports a source comment only on request', () => {
    const change = vi.fn();
    render(
      <ColumnCommentEditor
        name='id'
        value={null}
        sourceComment='DF'
        onChange={change}
      />
    );
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Комментарий колонки id' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Взять из DF' }));
    expect(screen.getByLabelText('Комментарий')).toHaveValue('DF');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(change).toHaveBeenCalledWith(null);
  });
  it('does not save a cancelled draft', () => {
    const change = vi.fn();
    render(<ColumnCommentEditor name='id' value='DB' onChange={change} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Комментарий колонки id' })
    );
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'discard' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(change).not.toHaveBeenCalled();
  });
});
