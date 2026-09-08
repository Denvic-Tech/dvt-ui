import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GroupByAggregationEditor } from './GroupByAggEditor';

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: () => undefined,
  }),
}));

vi.mock('@/entities/data/dataframe', () => ({
  ColumnDropdownSelect: () => <div data-testid='column-select' />,
}));

vi.mock('@/shared/ui', () => ({
  Panel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

describe('GroupByAggregationEditor hydration', () => {
  it('does not mutate an empty draft before the modal hydrates saved input values', () => {
    const setLocalInputData = vi.fn();

    render(
      <GroupByAggregationEditor
        {...({
          projectID: 'project',
          id: 'group-by-node',
          data: {},
          nodeDefinition: { input_definitions: {} },
          isOpen: true,
          localInputData: {},
          setLocalInputData,
          variables: [],
        } as unknown as React.ComponentProps<typeof GroupByAggregationEditor>)}
      />
    );

    expect(setLocalInputData).not.toHaveBeenCalled();
  });
});
