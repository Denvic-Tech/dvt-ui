import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  type ColumnDtypeEntry,
  ColumnDtypeOverridesEditor,
} from './ColumnDtypeOverridesEditor';

const options = [
  { value: 'string', label: 'string' },
  { value: 'Float64', label: 'Float64' },
];

const renderEditor = () => {
  const Wrapper = () => {
    const [entries, setEntries] = useState<ColumnDtypeEntry[]>([]);

    return (
      <>
        <ColumnDtypeOverridesEditor
          defaultDtype='string'
          description='Описание'
          emptyText='Нет настроенных типов'
          entries={entries}
          onChange={setEntries}
          options={options}
          title='Типы столбцов (dtype)'
        />
        <output data-testid='entries'>{JSON.stringify(entries)}</output>
      </>
    );
  };

  return render(<Wrapper />);
};

describe('ColumnDtypeOverridesEditor', () => {
  it('adds, edits, changes dtype, and removes an exact column name', async () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Добавить тип' }));
    fireEvent.change(screen.getByLabelText('Имя колонки 1'), {
      target: { value: ' 3 Брусок ' },
    });

    expect(screen.getByTestId('entries')).toHaveTextContent(
      JSON.stringify([{ columnName: ' 3 Брусок ', dtype: 'string' }])
    );

    fireEvent.mouseDown(screen.getByLabelText('Тип колонки 1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Float64' }));

    await waitFor(() => {
      expect(screen.getByTestId('entries')).toHaveTextContent(
        JSON.stringify([{ columnName: ' 3 Брусок ', dtype: 'Float64' }])
      );
    });

    fireEvent.click(screen.getByLabelText('Удалить dtype 1'));
    expect(screen.getByTestId('entries')).toHaveTextContent('[]');
    expect(screen.getByText('Нет настроенных типов')).toBeVisible();
  });
});
