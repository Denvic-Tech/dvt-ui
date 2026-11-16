import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TableSpecSections } from './TableSpecSections';

const KEY_ERROR =
  'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.';

describe('TableSpecSections errors', () => {
  it('shows the key error as the last row of its own box', () => {
    render(
      <TableSpecSections
        isClickHouse
        value={null}
        columns={[]}
        typedSpecErrors={[KEY_ERROR]}
        onPatchCore={vi.fn()}
        onAdvancedChange={vi.fn()}
        onValidationChange={vi.fn()}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(KEY_ERROR);
    // Строка ошибки — последняя в том же боксе, что и Engine / Order by.
    const box = alert.parentElement!;
    expect(box.lastElementChild).toBe(alert);
    expect(within(box).getByText('Order by')).toBeInTheDocument();
  });

  it('keeps the ClickHouse block collapsed by default', () => {
    render(
      <TableSpecSections
        isClickHouse
        value={null}
        columns={[]}
        typedSpecErrors={[]}
        onPatchCore={vi.fn()}
        onAdvancedChange={vi.fn()}
        onValidationChange={vi.fn()}
      />
    );

    const toggle = screen.getByRole('button', {
      name: 'Параметры ClickHouse',
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('TTL expression')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('TTL expression')).toBeInTheDocument();
  });

  it('renders no error rows without errors', () => {
    render(
      <TableSpecSections
        isClickHouse={false}
        value={null}
        columns={[]}
        typedSpecErrors={[]}
        onPatchCore={vi.fn()}
        onAdvancedChange={vi.fn()}
        onValidationChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
