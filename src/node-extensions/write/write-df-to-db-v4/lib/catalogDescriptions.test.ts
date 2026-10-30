import { describe, expect, it } from 'vitest';

import type { NodeField } from '@/entities/data/lineage';

import {
  buildCatalogDescriptionPatch,
  buildCatalogDescriptions,
  describeCatalogProvenance,
  resolveCommentBaseline,
} from './catalogDescriptions';

const field = (
  name: string,
  description: string | null,
  provenance: NodeField['description_provenance']
): NodeField =>
  ({
    name,
    ref: { key: `node:w:df:${name}`, kind: 'node' },
    op: 'pass',
    origin: { key: 'ds:d:f', kind: 'ds' },
    deps: [],
    deps_unknown: false,
    description,
    description_provenance: provenance,
  }) as unknown as NodeField;

describe('catalog descriptions for write nodes', () => {
  const catalog = buildCatalogDescriptions([
    field('amount', 'Сумма заказа', 'inherited'),
    field('note', null, 'none'),
    field('spaces', '   ', 'declared'),
  ]);

  it('prefers the catalog text, then the input metadata comment, then null', () => {
    expect(resolveCommentBaseline('amount', catalog, 'из метаданных')).toBe(
      'Сумма заказа'
    );
    expect(resolveCommentBaseline('note', catalog, 'из метаданных')).toBe(
      'из метаданных'
    );
    expect(resolveCommentBaseline('spaces', catalog, '')).toBeNull();
    expect(resolveCommentBaseline('unknown', undefined, null)).toBeNull();
  });

  it('labels provenance only when the catalog has a text', () => {
    expect(
      describeCatalogProvenance(
        field('a', 'Текст', 'inherited'),
        'orders.amount'
      )
    ).toBe('из каталога: наследуется от orders.amount');
    expect(describeCatalogProvenance(field('a', 'Текст', 'declared'))).toBe(
      'своё описание'
    );
    expect(describeCatalogProvenance(field('a', 'Текст', 'source'))).toBe(
      'комментарий БД источника'
    );
    expect(describeCatalogProvenance(field('a', null, 'inherited'))).toBeNull();
    expect(
      describeCatalogProvenance(field('a', 'Текст', 'derived'))
    ).toBeNull();
  });

  it('builds a patch only from drafts that differ from the baseline', () => {
    const patch = buildCatalogDescriptionPatch({
      typedOverrides: {
        amount: 'Сумма заказа',
        note: 'Новая заметка',
        gone: '',
      },
      dbOverrides: { client_id: 'Клиент', orphan_db: 'нет source' },
      rows: [
        { db_name: 'client_id', source_name: 'clientId' },
        { db_name: 'orphan_db', source_name: null },
      ],
      catalog,
      metadataComments: { gone: 'Было в метаданных' },
    });

    expect(patch).toEqual([
      { column: 'note', description: 'Новая заметка' },
      { column: 'gone', description: null },
      { column: 'clientId', description: 'Клиент' },
    ]);
  });

  it('lets a DB-side draft win over a typed draft for the same source column', () => {
    const patch = buildCatalogDescriptionPatch({
      typedOverrides: { clientId: 'typed' },
      dbOverrides: { client_id: 'db' },
      rows: [{ db_name: 'client_id', source_name: 'clientId' }],
    });

    expect(patch).toEqual([{ column: 'clientId', description: 'db' }]);
  });
});
