import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DataFrameMetadata } from '@/shared/gatewayClient';

import type { DataFrameFilterInputValues } from '../lib/conditions';

import { DataFrameFilterEditor } from './DataFrameFilterEditor';

const { getConnectedInputMetadataMock } = vi.hoisted(() => ({
  getConnectedInputMetadataMock: vi.fn(),
}));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: getConnectedInputMetadataMock,
  }),
}));

vi.mock('@/shared/ui/node-input', () => ({
  HighlightedSingleLineFieldV2: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (nextValue: string) => void;
  }) => (
    <input
      aria-label='expression-input'
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));

const metadata: DataFrameMetadata = {
  columns: [
    { name: 'period', dtype: 'DATETIME' },
    { name: 'podrazdmanag', dtype: 'STRING' },
  ],
} as unknown as DataFrameMetadata;

const initialLocalInputData: DataFrameFilterInputValues = {
  conditions: {
    kind: 'and',
    conditions: [
      {
        kind: 'condition',
        left: {
          type: 'column',
          column: 'period',
        },
        operator: '>',
        right: {
          type: 'literal',
          value: '2024-01-01T00:00:00.000Z',
        },
      },
    ],
  },
};

const renderEditor = () => {
  const Wrapper = () => {
    const [localInputData, setLocalInputData] =
      useState<DataFrameFilterInputValues>(initialLocalInputData);

    return (
      <DataFrameFilterEditor
        projectID='project-1'
        id='node-1'
        data={{} as any}
        nodeDefinition={
          { name: 'DataFrameFilter', additional_schema: {} } as any
        }
        isOpen
        localInputData={localInputData}
        setLocalInputData={setLocalInputData}
        variables={[]}
      />
    );
  };

  return render(<Wrapper />);
};

describe('DataFrameFilterEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnectedInputMetadataMock.mockReturnValue(metadata);
  });

  it('keeps operand popover paper overflow visible for expression autocomplete', async () => {
    renderEditor();

    const operandButton = screen
      .getAllByRole('button')
      .find(button => button.textContent?.includes('2024-01-01T00:00:00.000Z'));

    expect(operandButton).toBeDefined();

    fireEvent.click(operandButton!);

    await waitFor(() => {
      expect(screen.getByText('Expression')).toBeInTheDocument();
    });

    const popoverPaper = document.querySelector('.MuiPopover-paper');

    expect(popoverPaper).not.toBeNull();
    expect(popoverPaper).toHaveStyle({ overflow: 'visible' });
  });
});
