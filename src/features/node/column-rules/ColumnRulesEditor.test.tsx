import { useState } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Column } from '@/shared/gatewayClient';

import { RulesForm } from './ColumnRulesEditor';
import { ColumnSelector } from './ColumnSelector';
import { newRule, type Token, type Values } from './model';

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({ getConnectedInputMetadata: () => undefined }),
}));
vi.mock('./SeriesBindingsEditor', () => ({ SeriesBindingsEditor: () => null }));
vi.mock('@/shared/ui/node-input/PythonCodeInput', () => ({
  PythonCodeInput: () => null,
}));

afterEach(cleanup);
const columns: Column[] = [
  { name: 'Проект_a', dtype: 'STRING' },
  { name: 'Проект_b', dtype: 'STRING' },
  { name: 'Проект_*', dtype: 'STRING' },
  { name: 'amount', dtype: 'INT' },
];

function SelectionHarness() {
  const [value, onChange] = useState<Token[]>([]);
  return (
    <>
      <ColumnSelector columns={columns} value={value} onChange={onChange} />
      <output data-testid='value'>{JSON.stringify(value)}</output>
    </>
  );
}
function FormHarness() {
  const rule = newRule('regex');
  rule.id = 'initial';
  rule.selector.tokens = [{ kind: 'all', value: '' }];
  rule.params = { pattern: '\\s+', replacement: '' };
  const [values, setValues] = useState<Values>({ column_rules: [rule] });
  return (
    <>
      <RulesForm
        columns={columns}
        metadataKnown
        values={values}
        onChange={next => setValues(previous => ({ ...previous, ...next }))}
        operation='regex'
      />
      <output data-testid='value'>{JSON.stringify(values)}</output>
    </>
  );
}
describe('column rules editor', () => {
  it('offers a literal column and a mask as distinct choices in one dropdown', () => {
    render(<SelectionHarness />);
    const input = screen.getByRole('combobox', { name: 'Колонки' });
    fireEvent.change(input, { target: { value: 'Проект_*' } });
    fireEvent.click(screen.getByRole('option', { name: /Добавить маску/ }));
    expect(JSON.parse(screen.getByTestId('value').textContent!)).toEqual([
      { kind: 'mask', value: 'Проект_*' },
    ]);
    fireEvent.change(input, { target: { value: 'Проект_*' } });
    const exact = screen
      .getAllByRole('option')
      .find(option => within(option).queryByText('Проект_*'));
    fireEvent.click(exact!);
    expect(JSON.parse(screen.getByTestId('value').textContent!)).toEqual([
      { kind: 'mask', value: 'Проект_*' },
      { kind: 'name', value: 'Проект_*' },
    ]);
  });
  it('star selects all dynamically', () => {
    render(<SelectionHarness />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '*' } });
    fireEvent.click(screen.getByRole('option', { name: 'Все колонки' }));
    expect(JSON.parse(screen.getByTestId('value').textContent!)).toEqual([
      { kind: 'all', value: '' },
    ]);
  });
  it('hides advanced controls and creates an independent rule above the broad rule', async () => {
    render(<FormHarness />);
    expect(
      screen.queryByRole('textbox', {
        name: 'Дополнительный фильтр имени (regex)',
      })
    ).toBeNull();
    const advanced = screen.getAllByRole('button', { name: 'Дополнительно' });
    fireEvent.click(advanced[advanced.length - 1]!);
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Настроить отдельно' })[0]!
    );
    const values = JSON.parse(screen.getByTestId('value').textContent!);
    expect(values.column_rules).toHaveLength(2);
    expect(values.column_rules[0].selector.tokens).toEqual([
      { kind: 'name', value: 'Проект_a' },
    ]);
    await waitFor(() =>
      expect(
        screen.getAllByRole('textbox', { name: 'Регулярное выражение' })
      ).toHaveLength(1)
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Регулярное выражение' }),
      { target: { value: 'new' } }
    );
    const changed = JSON.parse(screen.getByTestId('value').textContent!);
    expect(changed.column_rules[0].params.pattern).toBe('new');
    expect(changed.column_rules[1].params.pattern).toBe('\\s+');
  });
});
