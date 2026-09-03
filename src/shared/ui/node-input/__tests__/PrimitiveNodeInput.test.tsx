import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ExpressionsConfig } from '@/shared/gatewayClient';
import { makeExpressionValue } from '@/shared/lib/node-input-values';

import PrimitiveNodeInput, {
  type PrimitiveNodeInputInlineAction,
} from '../PrimitiveNodeInput';

const registerCompletionItemProviderMock = vi.fn();

vi.mock('@monaco-editor/react', async () => {
  const ReactModule = await import('react');
  const MockMonacoEditor = ({
    value,
    onChange,
    onMount,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
    onMount?: (editor: any, monaco: any) => void;
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
      let keyUpHandler:
        | ((event: {
            altKey?: boolean;
            ctrlKey?: boolean;
            keyCode: number;
            metaKey?: boolean;
          }) => void)
        | undefined;

      editorRef.current = {
        addCommand: vi.fn(),
        deltaDecorations: vi.fn((_prev: string[], next: unknown[]) =>
          next.map((_, index) => `decoration-${index}`)
        ),
        focus: vi.fn(),
        getModel: () => ({
          getValue: () => modelValue,
          setValue: (nextValue: string) => {
            modelValue = nextValue;
          },
        }),
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
        onDidChangeModelContent: (
          callback: (event: { changes: Array<{ text: string }> }) => void
        ) => {
          contentChangeHandler = callback;
          return { dispose: vi.fn() };
        },
        onDidPaste: (_callback: () => void) => ({ dispose: vi.fn() }),
        setPosition: vi.fn(),
        __simulateBlur: () => blurHandler?.(),
        __simulateContentChange: (text: string) =>
          contentChangeHandler?.({ changes: [{ text }] }),
        __simulateFocus: () => focusHandler?.(),
        __simulateKeyUp: (keyCode: number) => keyUpHandler?.({ keyCode }),
        __setValue: (nextValue: string) => {
          modelValue = nextValue;
        },
        trigger: vi.fn(),
      };

      monacoRef.current = {
        MarkerSeverity: { Error: 8, Warning: 4 },
        editor: { setModelMarkers: vi.fn() },
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
        languages: {
          CompletionItemKind: {
            Function: 1,
            Keyword: 2,
            Operator: 3,
            Value: 4,
            Variable: 5,
          },
          getLanguages: () => [],
          register: vi.fn(),
          registerCompletionItemProvider:
            registerCompletionItemProviderMock.mockImplementation(
              (_languageId: string, provider: unknown) => ({
                dispose: vi.fn(),
                provider,
              })
            ),
          registerHoverProvider: vi.fn(() => ({
            dispose: vi.fn(),
          })),
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
      'data-testid': 'primitive-monaco',
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

const stringInputDefinition = {
  attr_name: 'dataset_name',
  allow_expressions: true,
  default: '',
  display_name: 'Dataset name',
  display_type: 'STRING',
  expression_policy: 'default',
  force_handle_visible: false,
  is_hidden: false,
  is_list_type: false,
  is_literal_type: false,
  metadata_source_field: null,
  multiline: false,
  optional: true,
  options: null,
  schema: null,
  step: null,
  round_val: null,
  min_value: null,
  max_value: null,
  type: 'STRING',
} as const;

const intInputDefinition = {
  ...stringInputDefinition,
  attr_name: 'retry_count',
  display_name: 'Retry count',
  display_type: 'INT',
  type: 'INT',
} as const;

const booleanInputDefinition = {
  ...stringInputDefinition,
  attr_name: 'notify_on_fail',
  display_name: 'Notify on fail',
  display_type: 'BOOLEAN',
  type: 'BOOLEAN',
} as const;

const datetimeInputDefinition = {
  ...stringInputDefinition,
  attr_name: 'started_at',
  display_name: 'Started at',
  display_type: 'DATETIME',
  type: 'DATETIME',
} as const;

const variables = [
  {
    name: 'dataset_name',
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
    type: 'STRING',
    value: 'sales',
  },
  {
    name: 'retry_count',
    scope: 'system',
    source: 'system',
    sourceLabel: 'Runtime context',
    type: 'INT',
    value: 2,
  },
  {
    name: 'started_at',
    scope: 'user',
    source: 'linked',
    sourceLabel: 'Upstream metadata',
    type: 'DATETIME',
    value: '2026-04-14T10:15:00Z',
  },
] as const;

const expressionsConfig: ExpressionsConfig = {
  filters: [
    { name: 'trim', expression: 'trim', description: 'Trim whitespace' },
  ],
  tests: [
    { name: 'defined', expression: 'defined', description: 'Defined test' },
    { name: 'eq', expression: '==', description: 'Equality test' },
  ],
  globals: [{ name: 'len', expression: 'len', description: 'Length global' }],
  default_policy: {
    name: 'default',
    allowed_filters: ['trim'],
    allowed_tests: ['defined', '=='],
    allowed_globals: ['len'],
  },
};

const Harness = ({
  initialValue,
  renderMode,
  inputDefinition = stringInputDefinition,
  masked,
  inlineActions,
}: {
  initialValue: unknown;
  renderMode?: 'editor' | 'canvas';
  inputDefinition?:
    | typeof stringInputDefinition
    | typeof intInputDefinition
    | typeof booleanInputDefinition
    | typeof datetimeInputDefinition;
  masked?: boolean;
  inlineActions?: PrimitiveNodeInputInlineAction[];
}) => {
  const [value, setValue] = React.useState<unknown>(initialValue);

  return (
    <>
      <PrimitiveNodeInput
        inputDefinition={inputDefinition as any}
        value={value}
        onChange={setValue}
        variables={[...variables]}
        expressionsConfig={expressionsConfig}
        renderMode={renderMode}
        masked={masked}
        inlineActions={inlineActions}
      />
      <div data-testid='serialized-value'>{JSON.stringify(value)}</div>
    </>
  );
};

describe('PrimitiveNodeInput', () => {
  it('preserves expression mode for DATETIME inputs', () => {
    render(
      <Harness
        initialValue={makeExpressionValue('started_at', 'single')}
        inputDefinition={datetimeInputDefinition}
      />
    );

    expect(screen.getByTestId('primitive-monaco')).toHaveValue('=started_at');
  });

  it('uses compact global expression controls and moves help into a tooltip', async () => {
    const { container } = render(
      <Harness initialValue={makeExpressionValue('dataset_name', 'single')} />
    );

    expect(
      screen.queryByText(/Expression mode\. Удалите ведущий/)
    ).not.toBeInTheDocument();

    const helpButton = screen.getByRole('button', {
      name: 'Справка по режиму выражения',
    });
    const clearButton = screen.getByRole('button', {
      name: 'Очистить значение',
    });
    const expressionField = container.querySelector(
      '.MuiFormControl-root > .MuiBox-root'
    );

    expect(expressionField).toHaveStyle({ borderRadius: '10px' });
    expect(helpButton).toHaveStyle({ opacity: '0.55' });
    expect(clearButton).toHaveStyle({ color: '#94a3b8' });
    expect(clearButton.querySelector('svg')).toHaveStyle({ fontSize: '18px' });

    fireEvent.mouseOver(helpButton);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Expression mode. Удалите ведущий "=" чтобы вернуться к literal. Переменные хранятся как expr(single).'
    );
  });

  it('exposes all primitive variables in expression autocomplete', () => {
    render(<Harness initialValue={makeExpressionValue('', 'single')} />);

    const provider = registerCompletionItemProviderMock.mock.calls[
      registerCompletionItemProviderMock.mock.calls.length - 1
    ]?.[1] as {
      provideCompletionItems: (
        model: { getValue: () => string },
        position: { column: number; lineNumber: number }
      ) => { suggestions: Array<{ label: string }> };
    };

    const result = provider.provideCompletionItems(
      { getValue: () => '=sta' },
      { lineNumber: 1, column: '=sta'.length + 1 }
    );

    expect(result.suggestions.some(item => item.label === 'started_at')).toBe(
      true
    );
  });

  it('switches to expr(single) when value starts with "="', () => {
    render(<Harness initialValue='' />);

    fireEvent.change(screen.getByTestId('primitive-monaco'), {
      target: { value: '=dataset_name   +  retry_count' },
    });

    expect(screen.getByTestId('serialized-value')).toHaveTextContent(
      '"__dvt_type":"expr"'
    );
    expect(screen.getByTestId('serialized-value').textContent).toContain(
      '"value":"dataset_name   +  retry_count"'
    );
  });

  it('formats expression value on blur and preserves literal spacing', () => {
    const expressionView = render(
      <Harness
        initialValue={makeExpressionValue(
          'dataset_name   +  " keep   spaces "',
          'single'
        )}
      />
    );

    const editor = screen.getByTestId('primitive-monaco');
    fireEvent.focus(editor);
    fireEvent.blur(editor);

    expect(screen.getByTestId('serialized-value').textContent).toContain(
      '"value":"dataset_name + \\" keep   spaces \\""'
    );

    expressionView.unmount();
    render(<Harness initialValue={'raw   value'} />);

    const literalEditor = screen.getByTestId('primitive-monaco');
    fireEvent.focus(literalEditor);
    fireEvent.blur(literalEditor);

    expect(screen.getByTestId('serialized-value').textContent).toContain(
      '"raw   value"'
    );
  });

  it('shows expression validation errors from expressions config', () => {
    render(
      <Harness
        initialValue={makeExpressionValue('dataset_name | defined', 'single')}
      />
    );

    expect(
      screen.getByText(
        'Тест "defined" используется как фильтр. Используйте его после "is".'
      )
    ).toBeInTheDocument();
  });

  it('shows a warning for direct incompatible variable passthrough', () => {
    render(
      <Harness
        initialValue={makeExpressionValue('dataset_name', 'single')}
        inputDefinition={intInputDefinition}
      />
    );

    expect(
      screen.getByText(
        'Переменная "dataset_name" имеет тип STRING, который может быть несовместим с полем INT.'
      )
    ).toBeInTheDocument();
  });

  it('uses lightweight field in canvas render mode', () => {
    render(<Harness initialValue='dataset' renderMode='canvas' />);

    expect(screen.queryByTestId('primitive-monaco')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders inline actions on both sides in canvas render mode', () => {
    render(
      <Harness
        initialValue='dataset'
        renderMode='canvas'
        inlineActions={[
          {
            id: 'left-action',
            side: 'start',
            ariaLabel: 'left action',
            icon: <span>L</span>,
            onClick: vi.fn(),
          },
          {
            id: 'right-action',
            ariaLabel: 'right action',
            icon: <span>R</span>,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(
      screen.getByRole('button', { name: 'left action' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'right action' })
    ).toBeInTheDocument();
  });

  it('calls custom inline actions in expression mode', () => {
    const handleStartAction = vi.fn();
    const handleEndAction = vi.fn();

    render(
      <Harness
        initialValue={makeExpressionValue('dataset_name', 'single')}
        inlineActions={[
          {
            id: 'left-action',
            side: 'start',
            ariaLabel: 'left action',
            icon: <span>L</span>,
            onClick: handleStartAction,
          },
          {
            id: 'right-action',
            ariaLabel: 'right action',
            icon: <span>R</span>,
            onClick: handleEndAction,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'left action' }));
    fireEvent.click(screen.getByRole('button', { name: 'right action' }));

    expect(handleStartAction).toHaveBeenCalledTimes(1);
    expect(handleEndAction).toHaveBeenCalledTimes(1);
  });

  it('renders custom end actions before built-in actions', () => {
    render(
      <Harness
        initialValue={100}
        inputDefinition={intInputDefinition}
        inlineActions={[
          {
            id: 'right-action',
            ariaLabel: 'right action',
            icon: <span>R</span>,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(
      screen
        .getAllByRole('button')
        .map(button => button.getAttribute('aria-label'))
    ).toEqual([
      'right action',
      'Перейти в режим выражения',
      'Очистить значение',
    ]);
  });

  it('ignores inline actions for boolean inputs', () => {
    render(
      <Harness
        initialValue={true}
        inputDefinition={booleanInputDefinition}
        inlineActions={[
          {
            id: 'ignored-action',
            side: 'start',
            ariaLabel: 'ignored action',
            icon: <span>I</span>,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'ignored action' })
    ).not.toBeInTheDocument();
  });

  it('masks literal values and still switches to expression mode', () => {
    const { container } = render(<Harness initialValue='secret' masked />);

    const passwordInput = container.querySelector(
      'input[type="password"]'
    ) as HTMLInputElement | null;

    expect(screen.queryByTestId('primitive-monaco')).not.toBeInTheDocument();
    expect(passwordInput).not.toBeNull();
    expect(passwordInput?.value).toBe('secret');

    fireEvent.change(passwordInput as HTMLInputElement, {
      target: { value: '=dataset_name' },
    });

    expect(screen.getByTestId('serialized-value')).toHaveTextContent(
      '"__dvt_type":"expr"'
    );
    expect(screen.getByTestId('primitive-monaco')).toBeInTheDocument();
  });

  it('renders inline actions for masked literal mode', () => {
    render(
      <Harness
        initialValue='secret'
        masked
        inlineActions={[
          {
            id: 'left-action',
            side: 'start',
            ariaLabel: 'left action',
            icon: <span>L</span>,
            onClick: vi.fn(),
          },
          {
            id: 'right-action',
            ariaLabel: 'right action',
            icon: <span>R</span>,
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(
      screen.getByRole('button', { name: 'left action' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'right action' })
    ).toBeInTheDocument();
  });
});
