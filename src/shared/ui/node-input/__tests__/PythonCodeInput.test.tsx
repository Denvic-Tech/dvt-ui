import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VariableOutput } from '@/shared/lib/variables';

import { PythonCodeInput } from '../PythonCodeInput';

const layoutSpy = vi.fn();
const observeSpy = vi.fn();
const disconnectSpy = vi.fn();
const unobserveSpy = vi.fn();
const registerCompletionItemProviderSpy = vi.fn(() => ({
  dispose: vi.fn(),
}));

vi.mock('@monaco-editor/react', async () => {
  const ReactModule = await import('react');
  const MockMonacoEditor = ({
    value,
    onMount,
  }: {
    value?: string;
    onMount?: (editor: any, monaco: any) => void;
  }) => {
    const mountedRef = ReactModule.useRef(false);
    const editorRef = ReactModule.useRef<any>({
      layout: layoutSpy,
    });
    const monacoRef = ReactModule.useRef<any>({
      languages: {
        CompletionItemKind: {
          Variable: 5,
        },
        registerCompletionItemProvider: registerCompletionItemProviderSpy,
      },
    });

    ReactModule.useEffect(() => {
      if (mountedRef.current) {
        return;
      }
      mountedRef.current = true;
      onMount?.(editorRef.current, monacoRef.current);
    }, [onMount]);

    return ReactModule.createElement('div', {
      'data-testid': 'python-monaco',
      'data-value': value ?? '',
    });
  };

  return {
    default: MockMonacoEditor,
  };
});

describe('PythonCodeInput', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalCancelAnimationFrame = window.cancelAnimationFrame;

  beforeEach(() => {
    layoutSpy.mockClear();
    observeSpy.mockClear();
    disconnectSpy.mockClear();
    registerCompletionItemProviderSpy.mockClear();

    class ResizeObserverMock {
      constructor(_callback: ResizeObserverCallback) {}

      observe = observeSpy;
      unobserve = unobserveSpy;
      disconnect = disconnectSpy;
    }

    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
    window.requestAnimationFrame = vi.fn(callback => {
      callback(0);
      return 1;
    });
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('shows helper text passed by node extensions', () => {
    render(
      <PythonCodeInput
        value='print("hello")'
        onChange={vi.fn()}
        helperText='input_variables доступен только для чтения.'
      />
    );

    expect(
      screen.getByText('input_variables доступен только для чтения.')
    ).toBeInTheDocument();
  });

  it('forces Monaco layout after mount and observes container resize', async () => {
    render(<PythonCodeInput value='print("hello")' onChange={vi.fn()} />);

    await waitFor(() => {
      expect(layoutSpy).toHaveBeenCalled();
    });
    expect(observeSpy).toHaveBeenCalled();
    expect(screen.getByTestId('python-monaco')).toBeInTheDocument();
    expect(document.querySelector('.nokey.nopan')).not.toBeNull();
  });

  it('passes onMount through to the shared CodeEditor', async () => {
    const onMount = vi.fn();

    render(
      <PythonCodeInput
        value='df_out = df_in.copy()'
        onChange={vi.fn()}
        onMount={onMount}
      />
    );

    await waitFor(() => {
      expect(onMount).toHaveBeenCalled();
    });
  });

  it('registers external completion providers together with runtime hints', async () => {
    render(
      <PythonCodeInput
        value='df_in["'
        onChange={vi.fn()}
        completionProviders={[
          {
            id: 'test-dataframe-columns',
            priority: 0,
            triggerCharacters: ['['],
            getSections: () => [
              {
                id: 'columns',
                items: [
                  {
                    label: 'amount',
                    insertText: 'amount',
                    kind: 'field',
                  },
                ],
              },
            ],
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(registerCompletionItemProviderSpy).toHaveBeenCalled();
    });

    const calls = registerCompletionItemProviderSpy.mock
      .calls as unknown as Array<[string, { triggerCharacters: string[] }]>;
    const registeredProvider = calls[calls.length - 1]?.[1];

    expect(registeredProvider?.triggerCharacters).toContain('[');
  });

  it('filters variable suggestions by namespace', async () => {
    const inputVariables = [
      {
        name: 'incoming_name',
        scope: 'user',
        source: 'linked',
        type: 'STRING',
        value: 'input',
      },
    ] satisfies VariableOutput[];
    const projectVariables = [
      {
        name: 'project_name',
        scope: 'user',
        source: 'project',
        type: 'STRING',
        value: 'project',
      },
    ] satisfies VariableOutput[];
    const { rerender } = render(
      <PythonCodeInput
        value='input_variables.'
        onChange={vi.fn()}
        variables={[...inputVariables, ...projectVariables]}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
      />
    );

    await waitFor(() => {
      expect(registerCompletionItemProviderSpy).toHaveBeenCalled();
    });

    const getSuggestions = (lineText: string) => {
      const calls = registerCompletionItemProviderSpy.mock
        .calls as unknown as Array<
        [
          string,
          {
            provideCompletionItems: (
              model: any,
              position: any
            ) => { suggestions: Array<{ label: string }> };
          },
        ]
      >;
      const provider = calls[calls.length - 1]?.[1];
      const position = { lineNumber: 1, column: lineText.length + 1 };
      return provider?.provideCompletionItems(
        {
          getLineContent: () => lineText,
          getWordUntilPosition: () => ({
            startColumn: position.column,
            endColumn: position.column,
          }),
        },
        position
      ).suggestions;
    };

    expect(getSuggestions('input_variables.')?.map(item => item.label)).toEqual(
      ['incoming_name']
    );

    rerender(
      <PythonCodeInput
        value='project_variables.'
        onChange={vi.fn()}
        variables={[...inputVariables, ...projectVariables]}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
      />
    );

    await waitFor(() => {
      expect(
        registerCompletionItemProviderSpy.mock.calls.length
      ).toBeGreaterThan(1);
    });
    expect(
      getSuggestions('project_variables.')?.map(item => item.label)
    ).toEqual(['project_name']);
  });
});
