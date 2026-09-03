import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { JsonMetadata } from '@/shared/gatewayClient';

import { JsonMetadataPanel } from './JsonMetadataPanel';

vi.mock('@mui/x-tree-view/SimpleTreeView', () => ({
  SimpleTreeView: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='simple-tree-view'>{children}</div>
  ),
}));

vi.mock('@mui/x-tree-view/TreeItem', () => ({
  TreeItem: ({
    children,
    label,
  }: {
    children?: React.ReactNode;
    label: React.ReactNode;
  }) => (
    <div>
      {label}
      {children}
    </div>
  ),
}));

const jsonMetadata: JsonMetadata = {
  type: 'JSON',
  response: {
    meta: {
      request_id: 'req-1',
    },
    items: [
      {
        payload: {
          id: 1,
        },
      },
    ],
  },
  root: {
    name: '$',
    path: '$',
    display_path: '$',
    kind: 'OBJECT',
    occurrences: 1,
    children: [
      {
        name: 'meta',
        path: '$.meta',
        display_path: '$.meta',
        kind: 'OBJECT',
        required: true,
        nullable: false,
        occurrences: 1,
        children: [
          {
            name: 'request_id',
            path: '$.meta.request_id',
            display_path: '$.meta.request_id',
            kind: 'STRING',
            required: true,
            nullable: false,
            occurrences: 1,
            examples: ['req-1'],
          },
        ],
      },
      {
        name: 'items',
        path: '$.items',
        display_path: '$.items',
        kind: 'ARRAY',
        required: true,
        nullable: false,
        occurrences: 1,
        item_kind: 'OBJECT',
        array_min_items: 1,
        array_max_items: 3,
        sampled_items: 3,
        children: [
          {
            name: 'payload',
            path: '$.items[].payload',
            display_path: '$.items[].payload',
            kind: 'OBJECT',
            required: true,
            nullable: false,
            occurrences: 3,
            children: [
              {
                name: 'id',
                path: '$.items[].payload.id',
                display_path: '$.items[].payload.id',
                kind: 'INTEGER',
                required: true,
                nullable: false,
                occurrences: 3,
                examples: [1, 2],
              },
            ],
          },
        ],
      },
    ],
  },
  flatten_candidates: [
    {
      path: '$.items',
      display_path: '$.items',
      kind: 'RECORD_PATH',
      node_kind: 'ARRAY',
      confidence: 0.98,
      reason: 'Top-level array candidate',
    },
    {
      path: '$.meta.request_id',
      display_path: '$.meta.request_id',
      kind: 'META_PATH',
      node_kind: 'STRING',
      confidence: 0.82,
      reason: 'Stable scalar metadata',
    },
  ],
  stats: {
    total_nodes: 5,
    object_nodes: 3,
    array_nodes: 1,
    scalar_nodes: 1,
    union_nodes: 0,
    max_depth: 4,
  },
  inferred_schema: {
    type: 'object',
    properties: {
      meta: {
        type: 'object',
      },
      items: {
        type: 'array',
      },
    },
  },
  structure_truncated: true,
};

describe('JsonMetadataPanel', () => {
  it('renders structural JSON metadata, candidates and schema preview', () => {
    render(<JsonMetadataPanel metadata={jsonMetadata} />);

    expect(screen.getByText('JSON metadata')).toBeInTheDocument();
    expect(
      screen.getByText(/Backend усёк inference-структуру/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Total nodes')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getAllByText('$.items').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$.meta.request_id').length).toBeGreaterThan(0);
    expect(screen.getByText('Top-level array candidate')).toBeInTheDocument();
    expect(screen.getByText('Schema preview')).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => {
        return (
          element?.tagName.toLowerCase() === 'pre' &&
          (element.textContent?.includes('"properties"') ?? false)
        );
      }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Raw payload')).toBeInTheDocument();
  });
});
