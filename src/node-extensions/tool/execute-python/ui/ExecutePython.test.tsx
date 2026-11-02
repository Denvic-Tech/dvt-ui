import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  EXECUTE_PYTHON_COMPLETION_PROVIDERS,
  ExecutePython,
} from './ExecutePython';

vi.mock('@/shared/ui/node-input', () => ({
  PythonCodeInput: () => <div data-testid='python-code-input' />,
  JSONNodeInput: ({ title }: { title?: React.ReactNode }) => (
    <div data-testid='json-node-input'>{title}</div>
  ),
}));

vi.mock('@/features/node/use-universal-node-data-input', () => ({
  NodeDataInput: () => <div data-testid='node-data-input' />,
}));

const nodeDefinition = {
  name: 'ExecutePython',
  input_definitions: {
    json_in: { attr_name: 'json_in', type: 'JSON', display_name: 'json_in' },
    code: {
      attr_name: 'code',
      type: 'STRING',
      multiline: true,
      display_name: 'code',
    },
  },
} as never;

describe('ExecutePython', () => {
  it('renders the JSON and script cards with the I/O contract', () => {
    render(
      <ExecutePython
        projectID='project-1'
        id='node-1'
        data={{} as never}
        nodeDefinition={nodeDefinition}
        isOpen
        localInputData={{ code: '', json_in: '' }}
        setLocalInputData={vi.fn()}
        variables={[]}
      />
    );

    expect(screen.getByTestId('json-node-input')).toBeInTheDocument();
    expect(screen.getByText('Входной JSON')).toBeInTheDocument();
    expect(screen.getByText('опционально')).toBeInTheDocument();
    expect(screen.getByText('Скрипт')).toBeInTheDocument();
    expect(screen.getByText('df_in')).toBeInTheDocument();
    expect(screen.getByText('output ← df_out')).toBeInTheDocument();
    expect(screen.getByText('output_json ← json_out')).toBeInTheDocument();
    expect(screen.getByText('input_variables')).toBeInTheDocument();
    expect(screen.getByText('project_variables')).toBeInTheDocument();
    expect(screen.getByText(/Jinja2 не используется/)).toBeInTheDocument();
    expect(screen.getByTestId('python-code-input')).toBeInTheDocument();
    expect(screen.queryByTestId('node-data-input')).not.toBeInTheDocument();
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
