import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { AppSettingsFieldDescriptor } from '../../model/types';

import { DccSettingsForm } from './DccSettingsForm';

const createField = (
  name: string,
  overrides: Partial<AppSettingsFieldDescriptor> = {}
): AppSettingsFieldDescriptor => ({
  key: `dcc.${name}`,
  namespace: 'dcc',
  relativePath: [name],
  label: `DCC ${name}`,
  description: null,
  group: null,
  kind: 'text',
  valueType: { type: 'string' },
  enumOptions: [],
  nullable: true,
  required: false,
  runtimeEditable: true,
  secret: false,
  readEnv: false,
  envVar: null,
  defaultValue: null,
  ge: null,
  le: null,
  minLength: null,
  maxLength: null,
  ...overrides,
});

const fields = [
  createField('url'),
  createField('username'),
  createField('password', { kind: 'password', secret: true }),
];

const values = {
  'dcc.url': 'https://dcc.example.com',
  'dcc.username': 'admin',
  'dcc.password': 'secret',
};

const renderForm = (
  props: Partial<ComponentProps<typeof DccSettingsForm>> = {}
) =>
  render(
    <DccSettingsForm
      fields={fields}
      values={values}
      errors={{}}
      onChange={vi.fn()}
      isDirty={false}
      isSaving={false}
      showSaved={false}
      {...props}
    />
  );

describe('DccSettingsForm', () => {
  it('disables saving until the values change', () => {
    const { rerender } = renderForm();

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();

    rerender(
      <DccSettingsForm
        fields={fields}
        values={values}
        errors={{}}
        onChange={vi.fn()}
        isDirty
        isSaving={false}
        showSaved={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled();
  });

  it('labels the fields and reports edits', () => {
    const onChange = vi.fn();
    renderForm({ onChange });

    fireEvent.change(screen.getByLabelText('URL'), {
      target: { value: 'https://new.example.com' },
    });

    expect(screen.getByLabelText('Пользователь')).toHaveValue('admin');
    expect(onChange).toHaveBeenCalledWith(fields[0], 'https://new.example.com');
  });

  it('shows and hides the password', () => {
    renderForm();
    const password = screen.getByLabelText('Пароль');

    expect(password).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Показать' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows the saved note only while nothing has changed', () => {
    renderForm({ showSaved: true });

    expect(screen.getByRole('status')).toHaveTextContent('Сохранено');
  });
});
