import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TableSchemaMetadata } from '../lib/types';

import { SchemaPolicyEditor } from './SchemaPolicyEditor';

const EditorHarness = ({ metadata }: { metadata: TableSchemaMetadata }) => {
  const [localInputData, setLocalInputData] = useState({});

  return (
    <>
      <SchemaPolicyEditor
        projectID='project-1'
        id='schema-policy-1'
        data={{} as never}
        isOpen
        nodeDefinition={{ name: 'SchemaPolicy' } as never}
        localInputData={localInputData}
        setLocalInputData={setLocalInputData}
        variables={[]}
        getConnectedInputMetadata={() => metadata as never}
      />
      <output data-testid='policy-value'>
        {JSON.stringify(localInputData)}
      </output>
    </>
  );
};

describe('SchemaPolicyEditor', () => {
  it('shows guidance when TableSchema metadata is empty', () => {
    render(<EditorHarness metadata={{ type: 'TABLE_SCHEMA', columns: [] }} />);

    expect(screen.getByText('TableSchema пока пуст')).toBeInTheDocument();
    expect(screen.getByText(/Выполните предыдущие ноды/)).toBeInTheDocument();
  });

  it('creates policies for every schema column and edits a fill value', async () => {
    render(
      <EditorHarness
        metadata={{
          type: 'TABLE_SCHEMA',
          columns: [
            { name: 'id', dtype: 'BIGINT' },
            { name: 'title', dtype: 'TEXT' },
          ],
        }}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Создать политики для всех колонок',
      })
    );

    await waitFor(() => {
      const value = JSON.parse(
        screen.getByTestId('policy-value').textContent ?? '{}'
      );
      expect(Object.keys(value.policy.columns)).toEqual(['id', 'title']);
    });

    fireEvent.mouseDown(screen.getByLabelText('Действие при отсутствии: id'));
    fireEvent.click(screen.getByRole('option', { name: 'Заполнить' }));

    const fillInput = await screen.findByLabelText(
      'Значение для заполнения: id'
    );
    fireEvent.change(fillInput, { target: { value: '42' } });
    fireEvent.blur(fillInput);

    await waitFor(() => {
      const value = JSON.parse(
        screen.getByTestId('policy-value').textContent ?? '{}'
      );
      expect(value.policy.columns.id).toMatchObject({
        on_missing: 'fill',
        fill_value: 42,
      });
    });
  });

  it('applies missing and type mismatch actions to every column', async () => {
    render(
      <EditorHarness
        metadata={{
          type: 'TABLE_SCHEMA',
          columns: [
            { name: 'id', dtype: 'BIGINT' },
            { name: 'title', dtype: 'TEXT' },
          ],
        }}
      />
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Создать политики для всех колонок',
      })
    );

    const missingBulkSelect = await screen.findByLabelText(
      'Действие при отсутствии для всех колонок'
    );
    fireEvent.mouseDown(missingBulkSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Игнорировать' }));

    const typeMismatchBulkSelect = screen.getByLabelText(
      'Действие при несовпадении типа для всех колонок'
    );
    fireEvent.mouseDown(typeMismatchBulkSelect);
    fireEvent.click(screen.getByRole('option', { name: 'Мягко привести' }));

    await waitFor(() => {
      const value = JSON.parse(
        screen.getByTestId('policy-value').textContent ?? '{}'
      );

      expect(value.policy.columns).toEqual({
        id: {
          fill_value: null,
          on_missing: 'ignore',
          on_type_mismatch: 'soft_cast',
        },
        title: {
          fill_value: null,
          on_missing: 'ignore',
          on_type_mismatch: 'soft_cast',
        },
      });
    });
  });
});
