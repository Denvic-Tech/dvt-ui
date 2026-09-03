import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { makeExpressionValue } from '@/shared/lib/node-input-values';

import { SaveParquetExpressionField } from './SaveParquetExpressionField';

vi.mock('@/shared/ui/node-input', () => ({
  PrimitiveNodeInput: ({
    value,
    inlineActions,
  }: {
    value: unknown;
    onChange: (value: unknown) => void;
    inlineActions?: Array<{
      id: string;
      ariaLabel: string;
      tooltip?: React.ReactNode;
      onClick: () => void;
    }>;
  }) => (
    <div data-testid='expression-editor'>
      {JSON.stringify(value)}
      {inlineActions?.map(action => (
        <button
          key={action.id}
          type='button'
          aria-label={action.ariaLabel}
          title={String(action.tooltip)}
          data-action-sx={JSON.stringify((action as { sx?: unknown }).sx)}
          onClick={action.onClick}
        />
      ))}
    </div>
  ),
}));

const makeInputDefinition = (
  type: InputDefinitionModel['type'],
  isListType = false
): InputDefinitionModel =>
  ({
    attr_name: 'test_field',
    allow_expressions: true,
    is_list_type: isListType,
    type,
  }) as InputDefinitionModel;

const Harness = ({
  initialValue,
  inputDefinition,
  literalFallback,
  title,
}: {
  initialValue: unknown;
  inputDefinition: InputDefinitionModel;
  literalFallback: unknown;
  title: string;
}) => {
  const [value, setValue] = React.useState(initialValue);

  return (
    <>
      <SaveParquetExpressionField
        inputDefinition={inputDefinition}
        value={value}
        onChange={setValue}
        title={title}
        literalFallback={literalFallback}
      >
        <div data-testid='literal-editor'>literal</div>
      </SaveParquetExpressionField>
      <div data-testid='serialized-value'>{JSON.stringify(value)}</div>
    </>
  );
};

describe('SaveParquetExpressionField', () => {
  it.each([
    {
      title: 'Лимит строк (row_cap)',
      definition: makeInputDefinition('INT'),
      literalValue: 250,
      fallback: null,
      expression: '250',
    },
    {
      title: 'Сжатие (compression)',
      definition: makeInputDefinition('STRING'),
      literalValue: 'snappy',
      fallback: 'snappy',
      expression: '"snappy"',
    },
    {
      title: 'Режим записи (mode)',
      definition: makeInputDefinition('STRING'),
      literalValue: 'overwrite',
      fallback: 'create',
      expression: '"overwrite"',
    },
    {
      title: 'Разбиение по колонкам (partition_on)',
      definition: makeInputDefinition('STRING', true),
      literalValue: ['country', 'date'],
      fallback: null,
      expression: '["country","date"]',
    },
    {
      title: 'Сохранять индекс DataFrame в файл',
      definition: makeInputDefinition('BOOLEAN'),
      literalValue: true,
      fallback: false,
      expression: 'true',
    },
  ])(
    'switches $title from literal to expr(single) and restores the literal',
    ({ title, definition, literalValue, fallback, expression }) => {
      render(
        <Harness
          initialValue={literalValue}
          inputDefinition={definition}
          literalFallback={fallback}
          title={title}
        />
      );

      const toggle = screen.getByRole('button', {
        name: `Режим выражения: ${title}`,
      });
      fireEvent.click(toggle);

      expect(screen.queryByTestId('literal-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('expression-editor')).toHaveTextContent(
        `"__dvt_type":"expr"`
      );
      expect(screen.getByTestId('serialized-value').textContent).toContain(
        `"value":${JSON.stringify(expression)}`
      );
      expect(screen.getByTestId('serialized-value')).toHaveTextContent(
        '"expression_kind":"single"'
      );

      fireEvent.click(toggle);

      expect(screen.getByTestId('literal-editor')).toBeInTheDocument();
      expect(screen.getByTestId('serialized-value')).toHaveTextContent(
        JSON.stringify(literalValue)
      );
    }
  );

  it('keeps a hydrated expression and uses the configured fallback on exit', () => {
    const handleChange = vi.fn();
    const title = 'Лимит строк (row_cap)';

    render(
      <SaveParquetExpressionField
        inputDefinition={makeInputDefinition('INT')}
        value={makeExpressionValue('runtime_limit', 'single')}
        onChange={handleChange}
        title={title}
        literalFallback={null}
      >
        <div data-testid='literal-editor'>literal</div>
      </SaveParquetExpressionField>
    );

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('expression-editor')).toHaveTextContent(
      'runtime_limit'
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: `Режим выражения: ${title}`,
      })
    );

    expect(handleChange).toHaveBeenCalledWith(null);
  });
});
