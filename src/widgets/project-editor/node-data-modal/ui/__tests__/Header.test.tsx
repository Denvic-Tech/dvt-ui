import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Header } from '../Header';

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
});
