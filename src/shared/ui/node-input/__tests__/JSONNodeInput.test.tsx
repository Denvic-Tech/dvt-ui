import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import { JSONNodeInput } from '../JSONNodeInput';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    defaultLanguage,
    value,
    onChange,
    onMount,
  }: {
    defaultLanguage?: string;
    value?: string;
    onChange?: (nextValue?: string) => void;
    onMount?: (editor: any, monaco: any) => void;
  }) => (
    <MonacoTextareaMock
      {...(defaultLanguage !== undefined ? { defaultLanguage } : {})}
      {...(value !== undefined ? { value } : {})}
      {...(onChange !== undefined ? { onChange } : {})}
      {...(onMount !== undefined ? { onMount } : {})}
    />
  ),
}));

const setModelLanguage = vi.fn();
const setModelMarkers = vi.fn();

const getPositionAt = (value: string, offset: number) => {
  const safeOffset = Math.max(0, Math.min(offset, value.length));
  const lines = value.slice(0, safeOffset).split('\n');
  return {
    lineNumber: lines.length,
    column: lines[lines.length - 1]!.length + 1,
  };
};

const getOffsetAt = (
  value: string,
  position: { column: number; lineNumber: number }
) => {
  const lines = value.split('\n');
  const lineIndex = Math.max(0, position.lineNumber - 1);
  const precedingLinesLength = lines
    .slice(0, lineIndex)
    .reduce((sum, line) => sum + line.length + 1, 0);
  const currentLine = lines[lineIndex] ?? '';
  return (
    precedingLinesLength + Math.min(currentLine.length, position.column - 1)
  );
};

const MonacoTextareaMock = ({
  defaultLanguage,
  value,
  onChange,
  onMount,
}: {
  defaultLanguage?: string;
  value?: string;
  onChange?: (nextValue?: string) => void;
  onMount?: (editor: any, monaco: any) => void;
}) => {
  const mountedRef = React.useRef(false);
  const selectionListenersRef = React.useRef<Array<() => void>>([]);
  const valueRef = React.useRef(value ?? '');
  const selectionRef = React.useRef({ start: 0, end: 0 });

  React.useEffect(() => {
    valueRef.current = value ?? '';
  }, [value]);

  const editorRef = React.useRef<any>({
    getModel: () => ({
      id: 'json-model',
      getOffsetAt: (position: { column: number; lineNumber: number }) =>
        getOffsetAt(valueRef.current, position),
      getPositionAt: (offset: number) =>
        getPositionAt(valueRef.current, offset),
      getValue: () => valueRef.current,
      getValueLength: () => valueRef.current.length,
    }),
    focus: vi.fn(),
    getSelection: () => ({
      startLineNumber: getPositionAt(
        valueRef.current,
        selectionRef.current.start
      ).lineNumber,
      startColumn: getPositionAt(valueRef.current, selectionRef.current.start)
        .column,
      endLineNumber: getPositionAt(valueRef.current, selectionRef.current.end)
        .lineNumber,
      endColumn: getPositionAt(valueRef.current, selectionRef.current.end)
        .column,
    }),
    onDidChangeCursorSelection: (listener: () => void) => {
      selectionListenersRef.current.push(listener);
      return { dispose: vi.fn() };
    },
    onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
    setPosition: (position: { column: number; lineNumber: number }) => {
      const offset = getOffsetAt(valueRef.current, position);
      selectionRef.current = { start: offset, end: offset };
    },
    trigger: vi.fn(),
  });
  const monacoRef = React.useRef<any>({
    KeyCode: { Enter: 3 },
    MarkerSeverity: { Error: 8, Warning: 4 },
    editor: {
      setModelLanguage,
      setModelMarkers,
    },
    languages: {
      CompletionItemKind: {
        Function: 1,
        Keyword: 2,
        Operator: 3,
        Value: 4,
        Variable: 5,
      },
      registerCompletionItemProvider: vi.fn(() => ({
        dispose: vi.fn(),
      })),
    },
  });

  React.useEffect(() => {
    if (mountedRef.current) {
      return;
    }

    mountedRef.current = true;
    onMount?.(editorRef.current, monacoRef.current);
  }, [onMount]);

  const syncSelectionFromDom = (
    event: React.SyntheticEvent<HTMLTextAreaElement>
  ) => {
    const target = event.currentTarget;
    selectionRef.current = {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? target.selectionStart ?? 0,
    };
    selectionListenersRef.current.forEach(listener => listener());
  };

  return (
    <div data-testid='json-monaco-wrapper' data-language={defaultLanguage}>
      <textarea
        data-testid='json-monaco'
        value={value ?? ''}
        onChange={event => onChange?.(event.target.value)}
        onClick={syncSelectionFromDom}
        onKeyUp={syncSelectionFromDom}
        onSelect={syncSelectionFromDom}
      />
    </div>
  );
};

type HarnessProps = {
  initialValue: unknown;
};

const SemanticNormalizationHarness = ({ initialValue }: HarnessProps) => {
  const [value, setValue] = useState<unknown>(initialValue);

  return (
    <JSONNodeInput
      value={value}
      onChange={nextValue => {
        if (typeof nextValue !== 'string') {
          setValue(nextValue);
          return;
        }

        try {
          setValue(JSON.parse(nextValue));
        } catch {
          setValue(nextValue);
        }
      }}
      allowVariableBinding={false}
      variables={[]}
    />
  );
};

const IgnoreInvalidDraftHarness = ({ initialValue }: HarnessProps) => {
  const [value, setValue] = useState<unknown>(initialValue);

  return (
    <JSONNodeInput
      value={value}
      onChange={nextValue => {
        if (typeof nextValue !== 'string') {
          setValue(nextValue);
          return;
        }

        try {
          setValue(JSON.parse(nextValue));
        } catch {
          // Keep previous external value to simulate parent that only commits valid JSON.
        }
      }}
      allowVariableBinding={false}
      variables={[]}
    />
  );
};

describe('JSONNodeInput', () => {
  const inputVariables = [
    {
      name: 'dataset_name',
      scope: 'user' as const,
      source: 'linked' as const,
      sourceLabel: 'Manage Variables',
      type: 'STRING' as const,
      value: 'sales',
    },
  ];
  const projectVariables = [
    {
      name: 'project_name',
      scope: 'user' as const,
      source: 'project' as const,
      sourceLabel: 'Project variable',
      type: 'STRING' as const,
      value: 'analytics',
    },
  ];
  const variables = [
    {
      name: 'dataset_name',
      scope: 'user' as const,
      source: 'project' as const,
      sourceLabel: 'Project variable',
      type: 'STRING' as const,
      value: 'sales',
    },
    {
      name: 'test_json',
      scope: 'user' as const,
      source: 'linked' as const,
      sourceLabel: 'Manage Variables',
      type: 'JSON' as const,
      value: { ok: true },
    },
  ];

  it('switches Monaco model language to plaintext in template mode to suppress raw JSON syntax errors', () => {
    setModelLanguage.mockClear();

    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{"name": "{{ dataset_name }}"}',
          'template'
        )}
        onChange={vi.fn()}
        variables={[]}
      />
    );

    expect(setModelLanguage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'json-model' }),
      'plaintext'
    );
  });

  it('boots Monaco in plaintext immediately for hydrated template JSON payloads', () => {
    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{"test": 1, "value": {{test_json |tojson}}}',
          'template'
        )}
        onChange={vi.fn()}
        variables={variables}
      />
    );

    expect(screen.getByTestId('json-monaco-wrapper')).toHaveAttribute(
      'data-language',
      'plaintext'
    );
  });

  it('reports template JSON structural errors through validation callback and clears them after fix', () => {
    const onValidationErrorChange = vi.fn();

    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{\n  "test": 1,\n  "value": {{test_json}}\n}',
          'template'
        )}
        onChange={vi.fn()}
        onValidationErrorChange={onValidationErrorChange}
        variables={variables}
      />
    );

    fireEvent.change(screen.getByTestId('json-monaco'), {
      target: {
        value: '{\n  "test": 1,\n  "value": {{test_json}} asd,\n}',
      },
    });

    expect(onValidationErrorChange).toHaveBeenLastCalledWith(
      'Некорректный JSON формат.'
    );

    fireEvent.change(screen.getByTestId('json-monaco'), {
      target: {
        value: '{\n  "test": 1,\n  "value": {{test_json}}\n}',
      },
    });

    expect(onValidationErrorChange).toHaveBeenLastCalledWith(null);
  });

  it('keeps structural JSON validation active in template mode', () => {
    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{\n  "test": 1,\n  "check": {{test_json}},\n  aslk\n}',
          'template'
        )}
        onChange={vi.fn()}
        variables={variables}
      />
    );

    expect(screen.getByText('Некорректный JSON формат.')).toBeInTheDocument();
  });

  it('does not show direct variable type mismatch warnings for valid JSON template payloads', () => {
    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{\n  "test": 1,\n  "check": {{test_json}}\n}',
          'template'
        )}
        onChange={vi.fn()}
        variables={variables}
      />
    );

    expect(
      screen.queryByText(/имеет тип JSON, который может быть несовместим/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Некорректный JSON формат.')
    ).not.toBeInTheDocument();
  });

  it('hydrates template expressions as raw editor text', () => {
    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '{"name": "{{ dataset_name }}"}',
          'template'
        )}
        onChange={vi.fn()}
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-monaco')).toHaveValue(
      '{"name": "{{ dataset_name }}"}'
    );
  });

  it('marks Monaco wrapper as nokey to prevent graph-level hotkeys from hijacking Enter', () => {
    render(
      <JSONNodeInput
        value={{ test: 'one' }}
        onChange={vi.fn()}
        allowVariableBinding={false}
        variables={[]}
      />
    );

    expect(document.querySelector('.nokey.nopan')).not.toBeNull();
  });

  it('hydrates and preserves JSON array values', () => {
    render(<SemanticNormalizationHarness initialValue={['some_String']} />);

    const textarea = screen.getByTestId('json-monaco');
    expect(textarea).toHaveValue('[\n  "some_String"\n]');

    fireEvent.change(textarea, {
      target: { value: '["some_String","next"]' },
    });

    expect(textarea).toHaveValue('["some_String","next"]');
  });

  it('supports explicit input_variables and project_variables in JSON templates', () => {
    render(
      <JSONNodeInput
        value={makeExpressionValue(
          '["{{ input_variables.dataset_name }}", "{{ project_variables.project_name }}"]',
          'template'
        )}
        onChange={vi.fn()}
        variables={[...inputVariables, ...projectVariables]}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
      />
    );

    expect(
      screen.queryByText(/Неизвестная переменная/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Некорректный JSON формат.')
    ).not.toBeInTheDocument();
  });

  it('preserves local valid JSON draft when parent normalizes it back to object', () => {
    render(<SemanticNormalizationHarness initialValue={{ test: '' }} />);

    fireEvent.change(screen.getByTestId('json-monaco'), {
      target: { value: '{"test":"tes"}' },
    });

    expect(screen.getByTestId('json-monaco')).toHaveValue('{"test":"tes"}');
  });

  it('preserves local invalid multiline draft when parent ignores invalid JSON', () => {
    render(<IgnoreInvalidDraftHarness initialValue={{ test: 1 }} />);

    fireEvent.change(screen.getByTestId('json-monaco'), {
      target: { value: '{"test": 1,\n}' },
    });

    expect(screen.getByTestId('json-monaco')).toHaveValue('{"test": 1,\n}');
  });

  it('serializes template drafts with double-curly variable syntax to expr(template)', () => {
    const onChange = vi.fn();

    render(
      <JSONNodeInput value='{}' onChange={onChange} variables={variables} />
    );

    fireEvent.change(screen.getByTestId('json-monaco'), {
      target: { value: '{"name": "{{ dataset_name }}"}' },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        __dvt_type: 'expr',
        expression_kind: 'template',
        value: '{"name": "{{ dataset_name }}"}',
      })
    );
  });

  it('shows input-linked scalar variables in the picker before template mode starts', () => {
    render(
      <JSONNodeInput value='{}' onChange={vi.fn()} variables={variables} />
    );

    fireEvent.click(screen.getByLabelText('Выбрать переменную'));

    expect(screen.getByText('dataset_name')).toBeInTheDocument();
    expect(screen.getByText('test_json')).toBeInTheDocument();
  });

  it('inserts picked variable at the current caret position instead of appending to the end', () => {
    const onChange = vi.fn();

    render(
      <JSONNodeInput
        value={'{\n  "check": \n}'}
        onChange={onChange}
        variables={variables}
      />
    );

    const textarea = screen.getByTestId('json-monaco') as HTMLTextAreaElement;
    const insertionOffset = textarea.value.indexOf('\n}');
    textarea.setSelectionRange(insertionOffset, insertionOffset);
    fireEvent.select(textarea);

    fireEvent.click(screen.getByLabelText('Выбрать переменную'));
    fireEvent.click(screen.getByText('dataset_name'));

    expect(textarea).toHaveValue('{\n  "check": {{dataset_name}}\n}');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        __dvt_type: 'expr',
        expression_kind: 'template',
        value: '{\n  "check": {{dataset_name}}\n}',
      })
    );
  });

  it('hydrates editor when external value changes semantically', () => {
    const { rerender } = render(
      <JSONNodeInput
        value={{ test: 'one' }}
        onChange={vi.fn()}
        allowVariableBinding={false}
        variables={[]}
      />
    );

    rerender(
      <JSONNodeInput
        value={{ test: 'two' }}
        onChange={vi.fn()}
        allowVariableBinding={false}
        variables={[]}
      />
    );

    expect(
      (screen.getByTestId('json-monaco') as HTMLTextAreaElement).value
    ).toContain('"test": "two"');
    expect(
      (screen.getByTestId('json-monaco') as HTMLTextAreaElement).value
    ).not.toContain('"test": "one"');
  });
});
