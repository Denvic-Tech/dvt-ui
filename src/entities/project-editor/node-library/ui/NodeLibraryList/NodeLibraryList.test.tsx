import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NodeLibraryList } from './NodeLibraryList.tsx';

const {
  nodeDefinitionsRef,
  nodeLibraryPreferencesRef,
  toggleNodePinnedMock,
  toggleCategoryCollapsedMock,
} = vi.hoisted(() => ({
  nodeDefinitionsRef: {
    current: {
      nodeDefinitionsMap: {},
      isLoading: false,
      status: 'succeeded',
    } as any,
  },
  nodeLibraryPreferencesRef: {
    current: {
      pinnedNodeNames: [],
      collapsedCategories: {},
    } as any,
  },
  toggleNodePinnedMock: vi.fn(),
  toggleCategoryCollapsedMock: vi.fn(),
}));

vi.mock('@/entities/node/node-definition', () => ({
  useNodeDefinitions: () => nodeDefinitionsRef.current,
}));

vi.mock('@/entities/ui-preferences', () => ({
  useNodeLibraryPreferences: () => ({
    ...nodeLibraryPreferencesRef.current,
    toggleNodePinned: toggleNodePinnedMock,
    toggleCategoryCollapsed: toggleCategoryCollapsedMock,
  }),
}));

describe('NodeLibraryList', () => {
  beforeEach(() => {
    toggleNodePinnedMock.mockReset();
    toggleCategoryCollapsedMock.mockReset();
    nodeDefinitionsRef.current = {
      nodeDefinitionsMap: {
        load_csv: {
          name: 'load_csv',
          display_name: 'Load CSV',
          category: 'Extraction',
          tags: ['Fast'],
          description: 'Loads CSV files',
          visible: true,
        },
        query_from_db_v3: {
          name: 'query_from_db_v3',
          display_name: 'Query From DB V3',
          category: 'Extraction',
          tags: ['Deprecated', 'SQL'],
          deprecated: true,
          description: 'Deprecated query node',
          visible: true,
        },
        json_editor: {
          name: 'json_editor',
          display_name: 'JSON Editor',
          category: 'JSON',
          tags: [],
          visible: true,
        },
      },
      isLoading: false,
      status: 'succeeded',
    };
    nodeLibraryPreferencesRef.current = {
      pinnedNodeNames: ['load_csv'],
      collapsedCategories: {},
    };
  });

  it('renders pinned section above regular categories', () => {
    render(<NodeLibraryList />);

    const pinnedHeader = screen.getByText('Закрепленные');
    const extractionHeader = screen.getByRole('button', {
      name: /Extraction/i,
    });

    expect(
      pinnedHeader.compareDocumentPosition(extractionHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getAllByText('Load CSV')).toHaveLength(2);
  });

  it('toggles category collapse from the header', () => {
    nodeLibraryPreferencesRef.current = {
      pinnedNodeNames: [],
      collapsedCategories: {
        Extraction: true,
      },
    };

    render(<NodeLibraryList />);

    const extractionHeader = screen.getByRole('button', {
      name: /Extraction/i,
    });

    expect(extractionHeader).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Load CSV')).not.toBeInTheDocument();

    fireEvent.click(extractionHeader);
    expect(toggleCategoryCollapsedMock).toHaveBeenCalledWith('Extraction');
  });

  it('pins nodes without triggering selection and shows deprecated badge', () => {
    const onNodeSelect = vi.fn();

    render(<NodeLibraryList onNodeSelect={onNodeSelect} />);

    fireEvent.click(screen.getAllByLabelText('Открепить ноду Load CSV')[0]!);
    expect(toggleNodePinnedMock).toHaveBeenCalledWith('load_csv');
    expect(onNodeSelect).not.toHaveBeenCalled();

    expect(screen.getByText('Deprecated')).toBeInTheDocument();
    expect(screen.getByText('Query From DB V3')).toHaveAttribute(
      'data-deprecated',
      'true'
    );
  });
});
