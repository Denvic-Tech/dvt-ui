import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AutoLayoutControlButton } from './AutoLayoutControlButton';

describe('AutoLayoutControlButton', () => {
  it('runs layout from an accessible canvas control', () => {
    const onClick = vi.fn();
    render(<AutoLayoutControlButton onClick={onClick} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Авторасстановка графа' })
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks repeated interaction while layout is running', () => {
    const onClick = vi.fn();
    render(<AutoLayoutControlButton loading onClick={onClick} />);

    const button = screen.getByRole('button', {
      name: 'Авторасстановка графа',
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
