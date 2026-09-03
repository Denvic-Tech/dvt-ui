import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeConst } from '@/shared/lib/node-input-values';

import {
  EXECUTE_PYTHON_COMPLETION_PROVIDERS,
  ExecutePython,
} from './ExecutePython';

vi.mock('@/shared/ui/node-input', () => ({
  PythonCodeInput: ({ helperText }: { helperText?: string }) => (
    <div data-testid='python-code-input'>{helperText}</div>
  ),
}));

describe('ExecutePython', () => {
  it('describes optional inputs and output variable mapping', () => {
    render(
      <ExecutePython
        nodeId='node-1'
        nodeName='ExecutePython'
        inputDefinition={{} as never}
        value={makeConst('')}
        onChange={vi.fn()}
        context='modal'
        variables={[]}
      />
    );

    expect(screen.getByText('Входы: df_in, json_in')).toBeInTheDocument();
    expect(screen.getByText('output ← df_out')).toBeInTheDocument();
    expect(screen.getByText('output_json ← json_out')).toBeInTheDocument();
    expect(screen.getByText(/JSON-данные/)).toBeInTheDocument();
  });

  it('provides input, output and snippet completions', () => {
    const sections = EXECUTE_PYTHON_COMPLETION_PROVIDERS[0].getSections({
      wordRange: {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      },
    } as never);
    const labels = sections.flatMap(section =>
      section.items.map(item => item.label)
    );

    expect(labels).toEqual(
      expect.arrayContaining([
        'df_in',
        'json_in',
        'df_out',
        'json_out',
        'df_out = df_in.copy()',
        'json_out = json_in',
      ])
    );
  });
});
