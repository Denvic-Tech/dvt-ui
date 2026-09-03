import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ProjectVariablesEditor } from './ProjectVariablesEditor';

vi.mock('@/app/notifications/hooks/useAlert.ts', () => ({
  useAlert: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    openDialog: vi.fn(),
  }),
}));

vi.mock('@/shared/ui/node-input', () => ({
  DVTDateTimePicker: ({
    disabled,
    initialIsoValue,
    onPythonDateTimeChange,
  }: {
    disabled?: boolean;
    initialIsoValue?: string | null;
    onPythonDateTimeChange: (value: string | null) => void;
  }) => (
    <input
      aria-label='Дата и время'
      disabled={disabled}
      type='datetime-local'
      value={initialIsoValue ?? ''}
      onChange={event => onPythonDateTimeChange(event.target.value)}
    />
  ),
}));

describe('ProjectVariablesEditor', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect() {}
        observe() {}
      }
    );
  });

  it('allows a null DATETIME value to be switched to an editable value', () => {
    render(
      <ProjectVariablesEditor
        isLoading={false}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onUpdate={vi.fn()}
        searchTerm=''
        variables={[
          {
            is_list_type: false,
            key: 'started_at',
            type: 'DATETIME',
            value: null,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText('started_at'));

    expect(screen.getByText('null ✓')).toBeInTheDocument();
    expect(screen.queryByLabelText('Дата и время')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('null ✓'));

    const input = screen.getByLabelText('Дата и время');
    fireEvent.change(input, { target: { value: '2026-08-04T12:30:11' } });

    expect(input).toHaveValue('2026-08-04T12:30:11.000');
  });
});
