import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActiveNodesSection } from './ActiveNodesSection';

const {
  requestGraphNodeFocusMock,
  selectNodeMock,
  setNodeDataModalOpenMock,
  openNodesMock,
  resetSearchMock,
  stateRef,
} = vi.hoisted(() => ({
  requestGraphNodeFocusMock: vi.fn(),
  selectNodeMock: vi.fn(),
  setNodeDataModalOpenMock: vi.fn(),
  openNodesMock: vi.fn(),
  resetSearchMock: vi.fn(),
  stateRef: { current: {} as any },
}));

vi.mock('@/app/providers/store', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector(stateRef.current),
}));

vi.mock('@/features/project-editor/focus-node', () => ({
  useRequestGraphNodeFocus: () => requestGraphNodeFocusMock,
}));

vi.mock('@/features/project-editor/select-node', () => ({
  useSelectNode: () => ({
    selectNode: selectNodeMock,
    selectedNodeID: 'node-custom',
  }),
}));

vi.mock('@/features/ui-layout', () => ({
  useNodeDataModalUI: () => ({ setOpen: setNodeDataModalOpenMock }),
}));

const makeState = ({ loading = false, nodes = true } = {}) => ({
  graph: {
    nodesByID: nodes
      ? {
          'node-custom': {
            id: 'node-custom',
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {
              name: 'LoadCSV',
              displayName: 'CSV source',
              comment: 'Loads prepared ERP expenses',
              inputValues: {
                table_name: {
                  __dvt_type: 'const',
                  value: 'dev_ERP_ValPrib_Rashod_prepare',
                },
                path: {
                  __dvt_type: 'const',
                  value: 'warehouse/prepared/expenses.csv',
                },
                sql_code: {
                  __dvt_type: 'expr',
                  value: 'SELECT amount FROM prepared_expenses',
                  expression_kind: 'template',
                },
                code: {
                  __dvt_type: 'const',
                  value: 'df = normalize_expenses(df)',
                },
                unrelated_setting: {
                  __dvt_type: 'const',
                  value: 'private_search_token',
                },
              },
            },
          },
          'node-widget': {
            id: 'node-widget',
            type: 'widget',
            position: { x: 100, y: 100 },
            data: {
              name: 'Text',
              displayName: 'Project note',
              inputValues: {},
            },
          },
        }
      : {},
    graphLoading: loading,
  },
  nodeDefinition: {
    nodesDefinitionsMap: {
      LoadCSV: {
        name: 'LoadCSV',
        display_name: 'Load CSV',
        category: 'Extraction',
        category_color: '#10B981',
        emoji: '📄',
        tags: ['file', 'source'],
      },
      Text: {
        name: 'Text',
        display_name: 'Text widget',
        category: 'Widgets',
        category_color: '#8B5CF6',
        tags: ['note'],
      },
    },
  },
});

describe('ActiveNodesSection', () => {
  beforeEach(() => {
    requestGraphNodeFocusMock.mockReset();
    selectNodeMock.mockReset();
    setNodeDataModalOpenMock.mockReset();
    openNodesMock.mockReset();
    resetSearchMock.mockReset();
    stateRef.current = makeState();
  });

  it('renders custom and widget nodes from the current graph', () => {
    render(<ActiveNodesSection />);

    expect(screen.getByText('CSV source')).toBeInTheDocument();
    expect(screen.getByText('Project note')).toBeInTheDocument();
    expect(
      screen.queryByTestId('widgets/project-editor/sidebar/active-nodes-count')
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByTestId('widgets/project-editor/sidebar/active-node-card')
    ).toHaveLength(2);
    expect(
      screen.getAllByTestId(
        'widgets/project-editor/sidebar/active-node-card'
      )[0]
    ).toHaveAttribute('data-selected', 'true');
    expect(
      screen.getAllByTestId(
        'widgets/project-editor/sidebar/active-node-icon'
      )[0]
    ).toHaveAttribute('data-category-color', '#10B981');
  });

  it('filters nodes by definition metadata', () => {
    render(<ActiveNodesSection searchTerm='extraction' />);

    expect(screen.getByText('CSV source')).toBeInTheDocument();
    expect(screen.queryByText('Project note')).not.toBeInTheDocument();
  });

  it.each([
    ['comment', 'prepared erp'],
    ['table_name', 'dev_erp_valprib_rashod_prepare'],
    ['path', 'warehouse/prepared'],
    ['sql_code', 'select amount'],
    ['code', 'normalize_expenses'],
  ])('filters nodes by %s', (_field, searchTerm) => {
    render(<ActiveNodesSection searchTerm={searchTerm} />);

    expect(screen.getByText('CSV source')).toBeInTheDocument();
    expect(screen.queryByText('Project note')).not.toBeInTheDocument();
  });

  it('does not search unrelated input fields', () => {
    render(
      <ActiveNodesSection
        searchTerm='private_search_token'
        onResetSearch={resetSearchMock}
      />
    );

    expect(screen.queryByText('CSV source')).not.toBeInTheDocument();
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(
      screen.getByText('Нет нод по запросу «private_search_token»')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('widgets/project-editor/sidebar/active-nodes-empty')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Сбросить поиск' }));
    expect(resetSearchMock).toHaveBeenCalledOnce();
  });

  it('preserves graph order when several nodes match', () => {
    stateRef.current.graph.nodesByID['node-widget'].data.comment =
      'Loads prepared ERP expenses too';

    render(<ActiveNodesSection searchTerm='prepared erp' />);

    expect(
      screen
        .getAllByTestId('widgets/project-editor/sidebar/active-node-card')
        .map(card => card.getAttribute('data-node-id'))
    ).toEqual(['node-custom', 'node-widget']);
  });

  it('requests graph focus when the card is clicked', () => {
    render(<ActiveNodesSection />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Показать ноду CSV source' })
    );

    expect(requestGraphNodeFocusMock).toHaveBeenCalledWith('node-custom');
    expect(selectNodeMock).not.toHaveBeenCalled();
    expect(setNodeDataModalOpenMock).not.toHaveBeenCalled();
  });

  it('opens node settings without requesting graph focus', () => {
    render(<ActiveNodesSection />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Открыть настройки ноды CSV source',
      })
    );

    expect(selectNodeMock).toHaveBeenCalledWith('node-custom');
    expect(setNodeDataModalOpenMock).toHaveBeenCalledWith(true);
    expect(requestGraphNodeFocusMock).not.toHaveBeenCalled();
  });

  it('shows loading and empty states', () => {
    stateRef.current = makeState({ loading: true, nodes: false });
    const { rerender } = render(
      <ActiveNodesSection onOpenNodes={openNodesMock} />
    );

    expect(
      screen.getByTestId('widgets/project-editor/sidebar/active-nodes-loading')
    ).toBeInTheDocument();

    stateRef.current = makeState({ nodes: false });
    rerender(<ActiveNodesSection onOpenNodes={openNodesMock} />);

    expect(screen.getByText('Ни одной ноды на холсте')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'widgets/project-editor/sidebar/active-nodes-empty-skeleton'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Добавить ноду' }));
    expect(openNodesMock).toHaveBeenCalledOnce();
  });
});
