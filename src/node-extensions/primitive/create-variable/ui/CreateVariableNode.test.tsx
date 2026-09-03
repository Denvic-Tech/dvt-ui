import { type ReactNode, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CreateVariableNode } from './CreateVariableNode';

vi.mock('@mui/material', async () => {
  const actual =
    await vi.importActual<typeof import('@mui/material')>('@mui/material');

  return {
    ...actual,
    FormControl: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    MenuItem: ({ value, children }: { value: string; children: ReactNode }) => (
      <option value={value}>{children}</option>
    ),
    Select: ({
      value,
      onChange,
      children,
    }: {
      value: string;
      onChange: (event: { target: { value: string } }) => void;
      children: ReactNode;
    }) => (
      <select
        aria-label='type-select'
        value={value}
        onChange={event => onChange({ target: { value: event.target.value } })}
      >
        {children}
      </select>
    ),
  };
});

vi.mock('@/features/node/primitive-variable-editor', () => ({
  TypedVariableValueEditor: ({
    type,
    value,
  }: {
    type: string;
    value: unknown;
  }) => (
    <div data-testid='typed-variable-value'>
      {JSON.stringify({ type, value })}
    </div>
  ),
}));

vi.mock('@/features/node/variable-policy', () => ({
  LiteralValueField: () => <div data-testid='literal-value-field' />,
  VariablePolicyFields: ({ defaultEditor }: { defaultEditor: ReactNode }) => (
    <div>{defaultEditor}</div>
  ),
}));

const renderNode = (initialLocalInputData: Record<string, unknown>) => {
  const Wrapper = () => {
    const [localInputData, setLocalInputData] = useState(initialLocalInputData);

    return (
      <>
        <CreateVariableNode
          projectID='project-1'
          id='node-1'
          data={{} as any}
          nodeDefinition={{} as any}
          isOpen
          localInputData={localInputData}
          setLocalInputData={setLocalInputData}
          variables={[]}
        />
        <pre data-testid='local-input-data'>
          {JSON.stringify(localInputData)}
        </pre>
      </>
    );
  };

  return render(<Wrapper />);
};

const getSerializedInputData = (): Record<string, unknown> =>
  JSON.parse(screen.getByTestId('local-input-data').textContent ?? '{}');

describe('CreateVariableNode', () => {
  it('preserves legacy expression strings when switching type to JSON', async () => {
    renderNode({
      type: 'STRING',
      value: '=field_names | tojson',
    });

    fireEvent.change(screen.getByLabelText('type-select'), {
      target: { value: 'JSON' },
    });

    await waitFor(() => {
      expect(getSerializedInputData()).toMatchObject({
        type: 'JSON',
        value: {
          __dvt_type: 'expr',
          value: 'field_names | tojson',
          expression_kind: 'single',
        },
      });
    });

    expect(screen.getByTestId('typed-variable-value')).toHaveTextContent(
      '"__dvt_type":"expr"'
    );
  });
});
