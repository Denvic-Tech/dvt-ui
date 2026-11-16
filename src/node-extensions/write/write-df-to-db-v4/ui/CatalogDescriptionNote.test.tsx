import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { NodeField } from '@/entities/data/lineage';

import { ColumnCommentPanel } from './schema-step/ColumnCommentPanel';
import { CatalogDescriptionNote } from './CatalogDescriptionNote';

vi.mock('@/app/providers/store', () => ({
  useAppSelector: () => undefined,
}));

vi.mock('@/entities/data/data-catalog', () => ({
  useGetDatasetQuery: () => ({ data: undefined }),
  getDatasetQualifiedName: () => '',
}));

const field = (
  description: string | null,
  provenance: NodeField['description_provenance']
): NodeField =>
  ({
    name: 'category',
    ref: { key: 'node:w:df:category', kind: 'node' },
    op: 'pass',
    origin: { key: 'ds:d:f', kind: 'ds' },
    deps: [],
    deps_unknown: false,
    description,
    description_provenance: provenance,
    description_source: { kind: 'node', node_id: 'n1', column: 'Группа' },
  }) as unknown as NodeField;

describe('catalog description note', () => {
  it('keeps only the description in the source box and moves provenance to a tooltip', async () => {
    render(
      <ColumnCommentPanel
        columnName='category'
        value='Категория'
        onChange={vi.fn()}
        sourceComment='Категория'
        onUseSource={vi.fn()}
        sourceAdornment={
          <CatalogDescriptionNote field={field('Категория', 'inherited')} />
        }
        hasPrevious={false}
        hasNext={false}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText('Категория', { selector: '.source-value' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/наследуется от/)).not.toBeInTheDocument();

    fireEvent.mouseOver(
      screen.getByTestId('write-df-to-db-v4/catalog-description-note')
    );

    expect(
      await screen.findByText('Из каталога: наследуется от нода n1.Группа')
    ).toBeInTheDocument();
  });

  it('renders nothing without a catalog description', () => {
    render(<CatalogDescriptionNote field={field(null, 'none')} />);
    expect(
      screen.queryByTestId('write-df-to-db-v4/catalog-description-note')
    ).not.toBeInTheDocument();
  });
});
