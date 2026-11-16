import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NodeDataModalDialog } from '../NodeDataModalDialog';

describe('NodeDataModalDialog', () => {
  it('renders content in an accessible modal overlay', () => {
    render(
      <NodeDataModalDialog open onClose={vi.fn()}>
        Node settings
      </NodeDataModalDialog>
    );

    const dialog = screen.getByRole('dialog', { name: 'Настройки ноды' });
    expect(dialog).toHaveTextContent('Node settings');
    expect(dialog).toHaveStyle({ borderRadius: '10px' });
    expect(document.querySelector('.MuiBackdrop-root')).toBeInTheDocument();
  });

  it('requests close from the backdrop', () => {
    const onClose = vi.fn();

    render(
      <NodeDataModalDialog open onClose={onClose}>
        Node settings
      </NodeDataModalDialog>
    );

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();

    fireEvent.mouseDown(backdrop as Element);
    fireEvent.click(backdrop as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
