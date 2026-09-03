import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EditableTypography } from '../EditableTypography';

describe('shared/ui/editable/EditableTypography', () => {
  it('uses full-width editor and keeps interactive nodrag classes', () => {
    const handleChange = vi.fn();

    render(
      <EditableTypography
        value='A'
        onChange={handleChange}
        showButton={false}
        textFieldProps={{ fullWidth: true }}
      />
    );

    fireEvent.doubleClick(screen.getByText('A'));

    const input = screen.getByRole('textbox');
    const formControl = input.closest('.MuiFormControl-root');

    expect(formControl?.className).toContain('nodrag');
    expect(formControl?.className).toContain('nopan');
    expect(formControl?.getAttribute('style')).toContain('width: 100%');

    fireEvent.change(input, { target: { value: 'Renamed' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('Renamed');
  });
});
