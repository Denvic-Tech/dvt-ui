import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { VariableOutput } from '@/shared/lib/variables';

import { TemplateMonacoInput } from '../TemplateMonacoInput';

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
      getModel: () => ({
        getPositionAt: (offset: number) => ({
          lineNumber: 1,
          column: offset + 1,
        }),
      }),
    });
    const monacoRef = ReactModule.useRef<any>({
      MarkerSeverity: { Error: 8 },
      editor: { setModelMarkers: vi.fn() },
      languages: {
        CompletionItemKind: {
          Function: 1,
          Keyword: 2,
          Operator: 3,
          Value: 4,
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
      'data-testid': 'template-monaco',
      'data-value': value ?? '',
    });
  };

  return {
    default: MockMonacoEditor,
  };
});

const variables = [
  {
    name: 'dataset_name',
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
    type: 'STRING',
    value: 'sales',
  },
] as const;

describe('TemplateMonacoInput', () => {
  it('normalizes raw template strings to expr(template)', () => {
    const handleChange = vi.fn();

    render(
      <TemplateMonacoInput
        value='SELECT {{ dataset_name }}'
        onChange={handleChange}
        allowExpressions
        variables={[...variables]}
      />
    );

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        __dvt_type: 'expr',
        expression_kind: 'template',
      })
    );
  });

  it('shows diagnostics only for expressions inside template markers', () => {
    render(
      <TemplateMonacoInput
        value='prefix text {{ unknown_var }} suffix text'
        onChange={vi.fn()}
        allowExpressions
        helperText='base helper'
        variables={[...variables]}
      />
    );

    expect(
      screen.getByText('Неизвестная переменная "unknown_var".')
    ).toBeInTheDocument();
    expect(screen.queryByText('base helper')).not.toBeInTheDocument();
  });

  it('normalizes malformed template bindings before passing them to Monaco', () => {
    render(
      <TemplateMonacoInput
        value={
          {
            __dvt_type: 'expr',
            expression_kind: 'template',
            value: { sql: 'SELECT 1' },
          } as unknown
        }
        onChange={vi.fn()}
        allowExpressions
      />
    );

    expect(screen.getByTestId('template-monaco')).toHaveAttribute(
      'data-value',
      '{\n  "sql": "SELECT 1"\n}'
    );
  });

  it('uses lightweight textarea in canvas render mode', () => {
    render(
      <TemplateMonacoInput
        value='SELECT {{ dataset_name }}'
        onChange={vi.fn()}
        allowExpressions
        renderMode='canvas'
        variables={[...variables]}
      />
    );

    expect(screen.queryByTestId('template-monaco')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('marks Monaco wrapper as nokey in editor mode', () => {
    render(
      <TemplateMonacoInput
        value='SELECT {{ dataset_name }}'
        onChange={vi.fn()}
        allowExpressions
        variables={[...variables]}
      />
    );

    expect(document.querySelector('.nokey')).not.toBeNull();
    expect(screen.getByTestId('template-monaco')).toBeInTheDocument();
  });

  it('filters template suggestions by variable namespace', () => {
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

    registerCompletionItemProviderSpy.mockClear();
    render(
      <TemplateMonacoInput
        value='SELECT {{ input_variables. }}'
        onChange={vi.fn()}
        allowExpressions
        variables={[...inputVariables, ...projectVariables]}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
      />
    );

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
    const getSuggestions = (expression: string) => {
      const text = `SELECT {{ ${expression}`;
      const position = { lineNumber: 1, column: text.length + 1 };
      return provider?.provideCompletionItems(
        {
          getValue: () => text,
          getOffsetAt: () => text.length,
          getPositionAt: (offset: number) => ({
            lineNumber: 1,
            column: offset + 1,
          }),
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
    expect(
      getSuggestions('project_variables.')?.map(item => item.label)
    ).toEqual(['project_name']);
  });
});
