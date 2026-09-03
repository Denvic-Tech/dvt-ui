import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HighlightedSingleLineFieldV2 } from '../HighlightedSingleLineFieldV2';
import { normalizeMonacoTextValue } from '../monacoTextValue';

const registerCompletionItemProviderMock = vi.fn();
const registerHoverProviderMock = vi.fn();
const registerLanguageMock = vi.fn();
const setModelMarkersMock = vi.fn();
let lastEditorInstance: any = null;

vi.mock('@monaco-editor/react', async () => {
  const ReactModule = await import('react');
  const MockMonacoEditor = ({
    value,
    onChange,
    onMount,
    options,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
    onMount?: (editor: any, monaco: any) => void;
    options?: { placeholder?: string };
  }) => {
    const editorRef = ReactModule.useRef<any>(null);
    const monacoRef = ReactModule.useRef<any>(null);
    const mountedRef = ReactModule.useRef(false);

    if (!editorRef.current) {
      let modelValue = value ?? '';
      let blurHandler: (() => void) | undefined;
      let contentChangeHandler:
        | ((event: { changes: Array<{ text: string }> }) => void)
        | undefined;
      let focusHandler: (() => void) | undefined;
      let cursorPositionHandler: (() => void) | undefined;
      let keyUpHandler:
        | ((event: {
            altKey?: boolean;
            ctrlKey?: boolean;
            keyCode: number;
            metaKey?: boolean;
          }) => void)
        | undefined;
      let pasteHandler: (() => void) | undefined;

      const model = {
        getValue: () => modelValue,
        setValue: (nextValue: string) => {
          modelValue = nextValue;
        },
      };

      editorRef.current = {
        addCommand: vi.fn(),
        deltaDecorations: vi.fn((_prev: string[], next: unknown[]) =>
          next.map((_, index) => `decoration-${index}`)
        ),
        focus: vi.fn(),
        hasTextFocus: () => true,
        getModel: () => model,
        getPosition: () => ({
          lineNumber: 1,
          column: modelValue.length + 1,
        }),
        getValue: () => modelValue,
        onDidBlurEditorText: (callback: () => void) => {
          blurHandler = callback;
          return { dispose: vi.fn() };
        },
        onDidFocusEditorText: (callback: () => void) => {
          focusHandler = callback;
          return { dispose: vi.fn() };
        },
        onDidChangeCursorPosition: (callback: () => void) => {
          cursorPositionHandler = callback;
          return { dispose: vi.fn() };
        },
        onKeyUp: (
          callback: (event: {
            altKey?: boolean;
            ctrlKey?: boolean;
            keyCode: number;
            metaKey?: boolean;
          }) => void
        ) => {
          keyUpHandler = callback;
          return { dispose: vi.fn() };
        },
        onDidPaste: (callback: () => void) => {
          pasteHandler = callback;
          return { dispose: vi.fn() };
        },
        onDidChangeModelContent: (
          callback: (event: { changes: Array<{ text: string }> }) => void
        ) => {
          contentChangeHandler = callback;
          return { dispose: vi.fn() };
        },
        setPosition: vi.fn(),
        __simulateBlur: () => blurHandler?.(),
        __simulateContentChange: (text: string) =>
          contentChangeHandler?.({ changes: [{ text }] }),
        __simulateFocus: () => focusHandler?.(),
        __simulateCursorPositionChange: () => cursorPositionHandler?.(),
        __simulateKeyUp: (keyCode: number) => keyUpHandler?.({ keyCode }),
        __simulatePaste: () => pasteHandler?.(),
        __setValue: (nextValue: string) => {
          modelValue = nextValue;
        },
        trigger: vi.fn(),
      };
      lastEditorInstance = editorRef.current;

      monacoRef.current = {
        KeyCode: {
          DownArrow: 18,
          Enter: 3,
          Escape: 9,
          LeftArrow: 15,
          RightArrow: 17,
          Tab: 2,
          UpArrow: 16,
        },
        KeyMod: { Shift: 1024 },
        MarkerSeverity: { Error: 8, Warning: 4 },
        editor: {
          setModelMarkers: setModelMarkersMock,
        },
        languages: {
          CompletionItemKind: {
            Function: 1,
            Keyword: 2,
            Operator: 3,
            Value: 4,
            Variable: 5,
          },
          getLanguages: () => [],
          register: registerLanguageMock,
          registerCompletionItemProvider:
            registerCompletionItemProviderMock.mockImplementation(
              (_languageId: string, provider: unknown) => ({
                dispose: vi.fn(),
                provider,
              })
            ),
          registerHoverProvider: registerHoverProviderMock.mockImplementation(
            (_languageId: string, provider: unknown) => ({
              dispose: vi.fn(),
              provider,
            })
          ),
        },
      };
    }

    ReactModule.useEffect(() => {
      editorRef.current.__setValue(value ?? '');
    }, [value]);

    ReactModule.useEffect(() => {
      if (mountedRef.current) {
        return;
      }
      mountedRef.current = true;
      onMount?.(editorRef.current, monacoRef.current);
    }, [onMount]);

    return ReactModule.createElement('input', {
      'data-testid': 'monaco-editor',
      placeholder: options?.placeholder,
      value: value ?? '',
      onBlur: () => editorRef.current.__simulateBlur(),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        editorRef.current.__setValue(event.target.value);
        onChange?.(event.target.value);
      },
      onFocus: () => editorRef.current.__simulateFocus(),
    });
  };

  return {
    default: MockMonacoEditor,
  };
});

const variables = [
  {
    name: 'batch_limit',
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
    type: 'INT',
    value: 100,
  },
  {
    name: 'retry_count',
    scope: 'system',
    source: 'system',
    sourceLabel: 'Runtime context',
    type: 'INT',
    value: 2,
  },
] as const;

const Harness = ({
  initialValue,
  highlightingEnabled = true,
  autoFormatOnBlur = true,
  diagnostics = [],
  errorText,
  warningText,
  autocompleteItems,
  startActions,
  endActions,
  actions = <button type='button'>action</button>,
}: {
  initialValue: string;
  highlightingEnabled?: boolean;
  autoFormatOnBlur?: boolean;
  diagnostics?: Array<{
    code: string;
    start: number;
    end: number;
    message: string;
    severity?: 'error' | 'warning';
  }>;
  errorText?: string;
  warningText?: string;
  autocompleteItems?: Array<{
    id: string;
    kind: 'variable' | 'operator' | 'value' | 'filter' | 'test' | 'global';
    label: string;
    insertText: string;
  }>;
  startActions?: React.ReactNode;
  endActions?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const [value, setValue] = React.useState(initialValue);

  return (
    <>
      <HighlightedSingleLineFieldV2
        value={value}
        onChange={setValue}
        placeholder='placeholder'
        helperText='helper'
        startActions={startActions}
        endActions={endActions}
        actions={actions}
        autocompleteItems={
          autocompleteItems ?? [
            {
              id: 'variable:batch_limit',
              kind: 'variable',
              label: 'batch_limit',
              insertText: 'batch_limit',
            },
          ]
        }
        variables={[...variables]}
        highlightingEnabled={highlightingEnabled}
        autoFormatOnBlur={autoFormatOnBlur}
        diagnostics={diagnostics as any}
        errorText={errorText}
        warningText={warningText}
      />
      <div data-testid='current-value'>{value}</div>
    </>
  );
};

describe('HighlightedSingleLineFieldV2', () => {
  beforeEach(() => {
    registerCompletionItemProviderMock.mockClear();
    registerHoverProviderMock.mockClear();
    registerLanguageMock.mockClear();
    setModelMarkersMock.mockClear();
    lastEditorInstance = null;
  });

  it('renders helper text, placeholder, and actions', () => {
    render(<Harness initialValue='' />);

    expect(screen.getByText('helper')).toBeInTheDocument();
    expect(screen.getByText('placeholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'action' })).toBeInTheDocument();
    expect(document.querySelector('.dvt-inline-monaco.nokey')).not.toBeNull();
  });

  it('renders start and end actions independently', () => {
    render(
      <Harness
        initialValue=''
        actions={undefined}
        startActions={<button type='button'>left action</button>}
        endActions={<button type='button'>right action</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'left action' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'right action' })
    ).toBeInTheDocument();
  });

  it('treats legacy actions prop as end actions', () => {
    render(
      <Harness
        initialValue=''
        actions={<button type='button'>legacy action</button>}
      />
    );

    expect(
      screen.getByRole('button', { name: 'legacy action' })
    ).toBeInTheDocument();
  });

  it('normalizes non-string values before syncing Monaco', () => {
    const handleChange = vi.fn();
    const expectedValue = '{   "query": "SELECT 1" }';
    const { rerender } = render(
      <HighlightedSingleLineFieldV2
        value={'initial'}
        onChange={handleChange}
        helperText='helper'
        highlightingEnabled={false}
        autoFormatOnBlur={false}
      />
    );

    rerender(
      <HighlightedSingleLineFieldV2
        value={{ query: 'SELECT 1' } as unknown as string}
        onChange={handleChange}
        helperText='helper'
        highlightingEnabled={false}
        autoFormatOnBlur={false}
      />
    );

    expect(expectedValue).toBe(
      normalizeMonacoTextValue({ query: 'SELECT 1' }).replace(/\r?\n+/g, ' ')
    );
    expect(screen.getByTestId('monaco-editor')).toHaveValue(expectedValue);
    expect(lastEditorInstance.getValue()).toBe(expectedValue);
  });

  it('keeps the editor single-line and formats expression on blur', () => {
    render(<Harness initialValue='=batch_limit' />);

    const input = screen.getByTestId('monaco-editor');

    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: '=batch_limit   +\n retry_count' },
    });

    expect(screen.getByTestId('current-value').textContent).toBe(
      '=batch_limit   + retry_count'
    );

    fireEvent.blur(input);

    expect(screen.getByTestId('current-value').textContent).toBe(
      '= batch_limit + retry_count'
    );
  });

  it('does not autoformat when highlighting is disabled', () => {
    render(
      <Harness
        initialValue='raw   value'
        highlightingEnabled={false}
        autoFormatOnBlur={false}
      />
    );

    const input = screen.getByTestId('monaco-editor');
    fireEvent.focus(input);
    fireEvent.change(input, {
      target: { value: 'raw   value' },
    });
    fireEvent.blur(input);

    expect(screen.getByTestId('current-value').textContent).toBe('raw   value');
  });

  it('registers Monaco providers only when highlighting is enabled', () => {
    render(<Harness initialValue='=dataset_name' />);

    expect(registerLanguageMock).toHaveBeenCalled();
    expect(registerCompletionItemProviderMock).toHaveBeenCalled();
    expect(registerHoverProviderMock).toHaveBeenCalled();

    registerCompletionItemProviderMock.mockClear();
    registerHoverProviderMock.mockClear();
    registerLanguageMock.mockClear();

    render(
      <Harness
        initialValue='raw value'
        highlightingEnabled={false}
        autoFormatOnBlur={false}
      />
    );

    expect(registerLanguageMock).not.toHaveBeenCalled();
    expect(registerCompletionItemProviderMock).not.toHaveBeenCalled();
    expect(registerHoverProviderMock).not.toHaveBeenCalled();
  });

  it('maps globals and tests to Monaco completion kinds', () => {
    render(
      <Harness
        initialValue='=ut'
        autocompleteItems={[
          {
            id: 'global:utcnow',
            kind: 'global',
            label: 'utcnow',
            insertText: 'utcnow()',
          },
          {
            id: 'test:defined',
            kind: 'test',
            label: 'defined',
            insertText: 'defined',
          },
        ]}
      />
    );

    const provider = registerCompletionItemProviderMock.mock.calls[
      registerCompletionItemProviderMock.mock.calls.length - 1
    ]?.[1] as {
      provideCompletionItems: (
        model: { getValue: () => string },
        position: { column: number; lineNumber: number }
      ) => { suggestions: Array<{ kind: number; label: string }> };
    };

    const result = provider.provideCompletionItems(
      { getValue: () => '=utcnow' },
      { lineNumber: 1, column: '=utcnow'.length + 1 }
    );

    expect(result.suggestions[0]).toMatchObject({
      kind: 1,
      label: 'utcnow',
    });
  });

  it('reapplies decorations on focus and blur transitions', () => {
    render(<Harness initialValue='=batch_limit + retry_count' />);

    const input = screen.getByTestId('monaco-editor');
    const initialDecorationCalls =
      lastEditorInstance.deltaDecorations.mock.calls.length;

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(
      lastEditorInstance.deltaDecorations.mock.calls.length
    ).toBeGreaterThan(initialDecorationCalls);
  });

  it('surfaces diagnostics via helper text and Monaco markers', () => {
    render(
      <Harness
        initialValue='=unknown_var'
        errorText='Неизвестная переменная "unknown_var".'
        diagnostics={[
          {
            code: 'unknown-variable',
            start: 1,
            end: 12,
            message: 'Неизвестная переменная "unknown_var".',
            severity: 'error',
          },
        ]}
      />
    );

    expect(
      screen.getByText('Неизвестная переменная "unknown_var".')
    ).toBeInTheDocument();
    expect(setModelMarkersMock).toHaveBeenCalled();
    expect(
      setModelMarkersMock.mock.calls[
        setModelMarkersMock.mock.calls.length - 1
      ]?.[2]
    ).toHaveLength(1);
  });

  it('triggers suggestions on focus when autocomplete items are available', async () => {
    render(<Harness initialValue='=' />);

    fireEvent.focus(screen.getByTestId('monaco-editor'));

    await new Promise(resolve => setTimeout(resolve, 260));

    expect(lastEditorInstance.trigger).toHaveBeenCalledWith(
      'keyboard',
      'editor.action.triggerSuggest',
      {}
    );
  });

  it('renders warning helper text and warning markers without error text', () => {
    render(
      <Harness
        initialValue='=dataset_name'
        warningText='Тип переменной может не совпадать с типом поля.'
        diagnostics={[
          {
            code: 'type-mismatch-direct-variable',
            start: 1,
            end: 13,
            message: 'Тип переменной может не совпадать с типом поля.',
            severity: 'warning',
          },
        ]}
      />
    );

    expect(
      screen.getByText('Тип переменной может не совпадать с типом поля.')
    ).toBeInTheDocument();
    expect(
      setModelMarkersMock.mock.calls[
        setModelMarkersMock.mock.calls.length - 1
      ]?.[2]?.[0]
    ).toMatchObject({
      severity: 4,
    });
  });
});
