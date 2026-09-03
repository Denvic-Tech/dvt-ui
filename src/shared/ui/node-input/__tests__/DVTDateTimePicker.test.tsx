import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs, { type Dayjs } from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

import { DVTDateTimePicker } from '../DVTDateTimePicker';

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@mui/x-date-pickers/DateTimePicker', () => ({
  DateTimePicker: ({
    value,
    onChange,
  }: {
    value: Dayjs | null;
    onChange: (value: Dayjs | null) => void;
  }) => (
    <div>
      <output data-testid='picker-value'>
        {value === null
          ? 'null'
          : value.isValid()
            ? value.toISOString()
            : 'invalid'}
      </output>
      <button type='button' onClick={() => onChange(dayjs('invalid'))}>
        Invalid draft
      </button>
      <button
        type='button'
        onClick={() => onChange(dayjs('2026-07-14T09:10:11Z'))}
      >
        Valid value
      </button>
    </div>
  ),
}));

describe('DVTDateTimePicker', () => {
  it('keeps an invalid draft locally and commits only a valid UTC value', () => {
    const onChange = vi.fn();

    render(
      <DVTDateTimePicker
        initialIsoValue={null}
        onPythonDateTimeChange={onChange}
        label={null}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Invalid draft' }));

    expect(screen.getByTestId('picker-value')).toHaveTextContent('invalid');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Valid value' }));

    expect(onChange).toHaveBeenCalledWith('2026-07-14T09:10:11.000Z');
  });
});
