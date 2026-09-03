import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SubgraphNode } from './SubgraphNode.tsx';
import { SubgraphPanelNode } from './SubgraphPanelNode.tsx';

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: any) => boolean) =>
    selector({
      nodeExecutionStatus: {
        statusByID: {},
      },
    }),
}));

vi.mock('@xyflow/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const MockHandle = React.forwardRef<HTMLDivElement, { id: string }>(
    ({ id }, ref) =>
      React.createElement('div', { ref, 'data-testid': `handle-${id}` })
  );
  MockHandle.displayName = 'MockHandle';

  return {
    Handle: MockHandle,
    Position: {
      Left: 'left',
      Right: 'right',
    },
    useStore: (selector: (state: unknown) => unknown) =>
      selector({
        transform: [0, 0, 1],
      }),
  };
});

describe('subgraph node rename', () => {
  it('renames collapsed subgraph by double click on title without toggling port mode', () => {
    const onDisplayNameChange = vi.fn();
    const props = {
      id: 'subgraph-1',
      selected: false,
      data: {
        name: 'subgraph',
        displayName: 'Subgraph',
        ports: [
          {
            id: 'sg-out:node-1:output-data',
            side: 'output',
            label: 'Producer: data',
            nodeDisplayName: 'Producer',
            handleDisplayName: 'data',
            ioType: 'DATAFRAME',
            internalNodeId: 'node-1',
            internalHandleId: 'output-data',
            connected: true,
          },
        ],
        memberNodeIDs: [],
      },
      onDisplayNameChange,
    } as any;

    render(<SubgraphNode {...props} />);

    fireEvent.doubleClick(screen.getByText('Subgraph'));

    const input = screen.getByDisplayValue('Subgraph');
    fireEvent.change(input, { target: { value: 'Renamed subgraph' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onDisplayNameChange).toHaveBeenCalledWith(
      'subgraph-1',
      'Renamed subgraph'
    );
    expect(screen.queryByText('Producer: data')).not.toBeInTheDocument();
    expect(screen.getByText('data')).toBeInTheDocument();
  });

  it('shows edit button in expanded edit mode and saves renamed value', () => {
    const onDisplayNameChange = vi.fn();
    const onSubgraphCollapse = vi.fn();
    const onToggleEditMode = vi.fn();
    const props = {
      id: 'subgraph-panel:subgraph-1',
      selected: false,
      data: {
        name: 'subgraphPanel',
        subgraphId: 'subgraph-1',
        displayName: 'Subgraph',
        memberNodeIDs: [],
        editMode: true,
      },
      onDisplayNameChange,
      onSubgraphCollapse,
      onToggleEditMode,
    } as any;

    render(<SubgraphPanelNode {...props} />);

    fireEvent.click(screen.getAllByRole('button')[0]);

    const input = screen.getByDisplayValue('Subgraph');
    fireEvent.change(input, { target: { value: 'Expanded subgraph' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onDisplayNameChange).toHaveBeenCalledWith(
      'subgraph-1',
      'Expanded subgraph'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Свернуть' }));
    expect(onSubgraphCollapse).toHaveBeenCalledWith('subgraph-1');

    fireEvent.doubleClick(screen.getByTestId('subgraph-panel-body'));
    expect(onToggleEditMode).toHaveBeenCalledWith('subgraph-1');
  });
});
