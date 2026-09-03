import { useEffect, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import { TypedVariableValueEditor } from '../TypedVariableValueEditor';

const jsonNodeInputSpy = vi.fn();

vi.mock('@/shared/ui/node-input', () => ({
  HighlightedSingleLineFieldV2: ({
    value,
    onChange,
    errorText,
    helperText,
  }: {
    value: string;
    onChange: (nextValue: string) => void;
    errorText?: string;
    helperText?: string;
  }) => (
    <div>
      <input
        data-testid='json-single-line'
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      {helperText ? <div>{helperText}</div> : null}
      {errorText ? <div>{errorText}</div> : null}
    </div>
  ),
  JSONNodeInput: ({
    value,
    onChange,
    errorText,
    onValidationErrorChange,
  }: {
    value: unknown;
    onChange: (nextValue: unknown) => void;
    errorText?: string | null;
    onValidationErrorChange?: (nextError: string | null) => void;
  }) => {
    const serializeValue = (nextValue: unknown) => {
      if (typeof nextValue === 'string') {
        return nextValue;
      }

      if (
        typeof nextValue === 'object' &&
        nextValue !== null &&
        '__dvt_type' in nextValue &&
        (nextValue as { __dvt_type?: string }).__dvt_type === 'expr' &&
        (nextValue as { expression_kind?: string }).expression_kind ===
          'template'
      ) {
        return String((nextValue as { value?: unknown }).value ?? '');
      }

      return JSON.stringify(nextValue, null, 2);
    };

    const [draft, setDraft] = useState(() => serializeValue(value));

    useEffect(() => {
      setDraft(serializeValue(value));
    }, [value]);

    return (
      <div>
        {jsonNodeInputSpy({ value })}
        <input
          data-testid='json-node-input'
          value={draft}
          onChange={event => {
            const nextValue = event.target.value;
            setDraft(nextValue);

            if (nextValue.includes('{{')) {
              if (nextValue.includes('asd')) {
                onValidationErrorChange?.('Некорректный JSON формат.');
              } else {
                onValidationErrorChange?.(null);
              }
              onChange(makeExpressionValue(nextValue, 'template'));
              return;
            }

            onValidationErrorChange?.(null);
            onChange(nextValue);
          }}
        />
        {errorText ? <div>{errorText}</div> : null}
      </div>
    );
  },
  PrimitiveNodeInput: () => <div data-testid='primitive-node-input' />,
}));

const JsonNullHarness = () => {
  const [value, setValue] = useState<unknown>({});

  return (
    <TypedVariableValueEditor
      type='JSON'
      value={value}
      onChange={setValue}
      allowExpressions
      variables={[]}
    />
  );
};

describe('TypedVariableValueEditor', () => {
  beforeEach(() => {
    jsonNodeInputSpy.mockClear();
  });

  it('passes saved template expression object into JSONNodeInput for hydration', () => {
    const savedTemplateValue = makeExpressionValue(
      '{"name": "{{ dataset_name }}"}',
      'template'
    );

    render(
      <TypedVariableValueEditor
        type='JSON'
        value={savedTemplateValue}
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    expect(jsonNodeInputSpy).toHaveBeenLastCalledWith({
      value: savedTemplateValue,
    });
  });

  it('renders single line editor for JSON expression strings', () => {
    render(
      <TypedVariableValueEditor
        type='JSON'
        value='=my_var'
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-single-line')).toHaveValue('=my_var');
    expect(screen.queryByTestId('json-node-input')).not.toBeInTheDocument();
  });

  it('renders JSON editor for object-shaped JSON strings', () => {
    render(
      <TypedVariableValueEditor
        type='JSON'
        value='{"a":1}'
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-node-input')).toHaveValue('{"a":1}');
    expect(screen.queryByTestId('json-single-line')).not.toBeInTheDocument();
  });

  it('renders JSON editor for object values', async () => {
    render(
      <TypedVariableValueEditor
        type='JSON'
        value={{ a: 1 }}
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    await waitFor(() =>
      expect(
        (screen.getByTestId('json-node-input') as HTMLInputElement).value
      ).toContain('"a": 1')
    );
    expect(screen.queryByTestId('json-single-line')).not.toBeInTheDocument();
  });

  it('renders JSON editor for template expressions with double-curly variables', () => {
    render(
      <TypedVariableValueEditor
        type='JSON'
        value={makeExpressionValue(
          '{"name": "{{ dataset_name }}"}',
          'template'
        )}
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-node-input')).toHaveValue(
      '{"name": "{{ dataset_name }}"}'
    );
    expect(screen.queryByTestId('json-single-line')).not.toBeInTheDocument();
  });

  it('keeps JSON editor fallback for non-object JSON literals', () => {
    render(
      <TypedVariableValueEditor
        type='JSON'
        value='[]'
        onChange={vi.fn()}
        allowExpressions
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-node-input')).toHaveValue('[]');
    expect(screen.queryByTestId('json-single-line')).not.toBeInTheDocument();
  });

  it('hides JSON editors after switching to null literal', () => {
    render(<JsonNullHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Set null' }));

    expect(screen.queryByTestId('json-node-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('json-single-line')).not.toBeInTheDocument();
    expect(
      screen.getByText('Будет отправлен literal `null`.')
    ).toBeInTheDocument();
  });

  it('serializes single-line JSON expressions via expr(single)', () => {
    const onChange = vi.fn();
    const onJsonErrorChange = vi.fn();

    render(
      <TypedVariableValueEditor
        type='JSON'
        value='=my_var'
        onChange={onChange}
        onJsonErrorChange={onJsonErrorChange}
        jsonError='Некорректный JSON формат.'
        allowExpressions
        variables={[]}
      />
    );

    fireEvent.change(screen.getByTestId('json-single-line'), {
      target: { value: '=other_var' },
    });

    expect(onJsonErrorChange).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith(
      makeExpressionValue('other_var', 'single')
    );
  });

  it('passes through template JSON expressions from JSON editor', () => {
    const onChange = vi.fn();
    const onJsonErrorChange = vi.fn();

    render(
      <TypedVariableValueEditor
        type='JSON'
        value='{"name": "static"}'
        onChange={onChange}
        onJsonErrorChange={onJsonErrorChange}
        allowExpressions
        variables={[]}
      />
    );

    fireEvent.change(screen.getByTestId('json-node-input'), {
      target: { value: '{"name": "{{ dataset_name }}"}' },
    });

    expect(onJsonErrorChange).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith(
      makeExpressionValue('{"name": "{{ dataset_name }}"}', 'template')
    );
  });

  it('forwards template JSON structural validation errors from JSONNodeInput', () => {
    const onChange = vi.fn();
    const onJsonErrorChange = vi.fn();

    render(
      <TypedVariableValueEditor
        type='JSON'
        value='{"name": "static"}'
        onChange={onChange}
        onJsonErrorChange={onJsonErrorChange}
        allowExpressions
        variables={[]}
      />
    );

    fireEvent.change(screen.getByTestId('json-node-input'), {
      target: { value: '{"name": "{{ dataset_name }}"} asd' },
    });

    expect(onJsonErrorChange).toHaveBeenCalledWith('Некорректный JSON формат.');
    expect(onChange).toHaveBeenCalledWith(
      makeExpressionValue('{"name": "{{ dataset_name }}"} asd', 'template')
    );
  });

  it('keeps JSON editor open on invalid JSON draft and does not commit null', () => {
    const onChange = vi.fn();
    const onJsonErrorChange = vi.fn();

    render(
      <TypedVariableValueEditor
        type='JSON'
        value={{}}
        onChange={onChange}
        onJsonErrorChange={onJsonErrorChange}
        allowExpressions
        variables={[]}
      />
    );

    fireEvent.change(screen.getByTestId('json-node-input'), {
      target: { value: '{' },
    });

    expect(screen.getByTestId('json-node-input')).toHaveValue('{');
    expect(
      screen.queryByText('Будет отправлен literal `null`.')
    ).not.toBeInTheDocument();
    expect(onJsonErrorChange).toHaveBeenCalledWith('Некорректный JSON формат.');
    expect(onChange).not.toHaveBeenCalled();
  });
});
