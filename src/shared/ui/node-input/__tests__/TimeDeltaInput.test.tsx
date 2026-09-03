import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TimeDeltaInput } from '../TimeDeltaInput';

describe('TimeDeltaInput', () => {
  it('renders every unit label with its corresponding input', () => {
    render(<TimeDeltaInput value='+1-2-3-4-5-6' onChange={vi.fn()} />);

    const expectedValues: Record<string, string> = {
      Годы: '1',
      Месяцы: '2',
      Дни: '3',
      Часы: '4',
      Минуты: '5',
      Секунды: '6',
    };

    Object.entries(expectedValues).forEach(([label, value]) => {
      expect(screen.getByRole('textbox', { name: label })).toHaveValue(value);
    });
  });

  it('normalizes a changed unit and emits the complete interval', () => {
    const onChange = vi.fn();
    render(<TimeDeltaInput value='+1-2-3-4-5-6' onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Месяцы' }), {
      target: { value: '004' },
    });

    expect(onChange).toHaveBeenLastCalledWith('+1-4-3-4-5-6');
  });

  it('moves focus to the next unit input on Enter', () => {
    render(<TimeDeltaInput value='+1-2-3-4-5-6' onChange={vi.fn()} />);

    const yearsInput = screen.getByRole('textbox', { name: 'Годы' });
    const monthsInput = screen.getByRole('textbox', { name: 'Месяцы' });

    yearsInput.focus();
    fireEvent.keyDown(yearsInput, { key: 'Enter' });

    expect(monthsInput).toHaveFocus();
  });
});
