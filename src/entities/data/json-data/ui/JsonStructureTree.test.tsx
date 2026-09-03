import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { JsonStructureNode } from '@/shared/gatewayClient';

import { JsonStructureTree } from './JsonStructureTree';

vi.mock('@mui/x-tree-view/SimpleTreeView', () => ({
  SimpleTreeView: ({ children }: { children: ReactNode }) => (
    <div data-testid='simple-tree-view'>{children}</div>
  ),
}));

vi.mock('@mui/x-tree-view/TreeItem', () => ({
  TreeItem: ({
    children,
    label,
  }: {
    children?: ReactNode;
    label: ReactNode;
  }) => (
    <div>
      {label}
      {children}
    </div>
  ),
}));

const deepNode: JsonStructureNode = {
  name: '$',
  path: '$',
  display_path: '$',
  kind: 'OBJECT',
  occurrences: 1,
  children: [
    {
      name: 'level1',
      path: '$.level1',
      display_path: '$.level1',
      kind: 'OBJECT',
      required: true,
      nullable: false,
      occurrences: 1,
      children: [
        {
          name: 'level2',
          path: '$.level1.level2',
          display_path: '$.level1.level2',
          kind: 'OBJECT',
          required: true,
          nullable: false,
          occurrences: 1,
          children: [
            {
              name: 'level3',
              path: '$.level1.level2.level3',
              display_path: '$.level1.level2.level3',
              kind: 'OBJECT',
              required: true,
              nullable: false,
              occurrences: 1,
              children: [
                {
                  name: 'level4',
                  path: '$.level1.level2.level3.level4',
                  display_path: '$.level1.level2.level3.level4',
                  kind: 'OBJECT',
                  required: true,
                  nullable: false,
                  occurrences: 1,
                  children: [
                    {
                      name: 'level5',
                      path: '$.level1.level2.level3.level4.level5',
                      display_path: '$.level1.level2.level3.level4.level5',
                      kind: 'STRING',
                      required: true,
                      nullable: false,
                      occurrences: 1,
                      examples: ['value-1', 'value-2'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('JsonStructureTree', () => {
  it('renders deep nested nodes and keeps path selection separate from inline actions', () => {
    const onPathSelect = vi.fn();
    const onActionClick = vi.fn();

    render(
      <JsonStructureTree
        activePath='$.level1.level2.level3.level4.level5'
        pathAssignments={{
          '$.level1.level2.level3.level4.level5': ['record_path'],
        }}
        renderActions={node => (
          <button
            aria-label={`action ${node.path}`}
            onClick={() => onActionClick(node.path)}
          >
            action
          </button>
        )}
        root={deepNode}
        onPathSelect={onPathSelect}
      />
    );

    const deepestPath = '$.level1.level2.level3.level4.level5';

    expect(screen.getByText(deepestPath)).toBeInTheDocument();
    expect(screen.getByText('Examples: 2')).toBeInTheDocument();
    expect(screen.queryByText(/Suggested:/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: `action ${deepestPath}` })
    );

    expect(onActionClick).toHaveBeenCalledWith(deepestPath);
    expect(onPathSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(deepestPath));

    expect(onPathSelect).toHaveBeenCalledWith(
      expect.objectContaining({ path: deepestPath })
    );
  });
});
