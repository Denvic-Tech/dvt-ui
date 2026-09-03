import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CommentSection } from '../CommentSection';

vi.mock('@/shared/ui', () => ({
  EditableComment: () => <div data-testid='editable-comment' />,
}));

describe('CommentSection', () => {
  it('renders a constrained modal with a viewport-sized backdrop', () => {
    const onClose = vi.fn();

    render(
      <CommentSection
        value=''
        open
        onClose={onClose}
        onChange={vi.fn()}
        nodeTitle='Read Table DB V3'
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Комментарий' });
    expect(dialog).toHaveStyle({
      width: 'calc(100vw - 48px)',
      maxWidth: '960px',
    });
    expect(dialog.closest('.MuiModal-root')?.parentElement).toBe(document.body);

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).toBeInTheDocument();

    fireEvent.mouseDown(backdrop as Element);
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
