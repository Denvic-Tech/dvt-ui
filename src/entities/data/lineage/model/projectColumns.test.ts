import { describe, expect, it } from 'vitest';

import {
  canClearRowDescription,
  countProjectColumnsFilters,
  filterProjectColumnRows,
  formatNodeCount,
  getDefaultTarget,
  getProjectColumnsStats,
  getRowDependencyNames,
  getRowMarks,
  getRowOriginLabel,
} from './projectColumns';
import type { ProjectColumnRow } from './types';

const ref = (key: string, nodeId?: string) => ({
  key,
  kind: nodeId ? ('node' as const) : ('ds' as const),
  ...(nodeId ? { node_id: nodeId } : {}),
});

const makeRow = (
  id: string,
  name: string,
  overrides: Partial<ProjectColumnRow> = {}
): ProjectColumnRow => ({
  id,
  name,
  origin: ref('ds:orders:amount'),
  start: ref(id, 'n-read'),
  kind: 'dataset_field',
  dataset_location: 'main.sales.orders @ db:5432',
  field_name: 'amount',
  description: null,
  description_provenance: 'none',
  occurrences: [
    {
      ref: ref(id, 'n-read'),
      node_id: 'n-read',
      node_name: 'ReadTableFromDBV3',
      port: 'output',
      role: 'output',
      column: name,
      op: 'source',
      depth: 1,
      description_provenance: 'none',
    },
  ],
  targets: [
    { scope: 'project', node_id: 'n-read', port: 'output', column: name },
    { scope: 'global', dataset_id: 'ds-1', field_id: 'f-amount' },
  ],
  ...overrides,
});

const amount = makeRow('node:n-read:output:amount', 'amount', {
  description: 'Сумма заказа',
  description_provenance: 'declared',
});
const revenue = makeRow('node:n-rename:output:revenue', 'revenue', {
  start: ref('node:n-rename:output:revenue', 'n-rename'),
  description: 'Выручка',
  description_provenance: 'declared',
  is_rename: true,
  renamed_from: 'amount',
  targets: [
    {
      scope: 'project',
      node_id: 'n-rename',
      port: 'output',
      column: 'revenue',
    },
  ],
  occurrences: [
    {
      ref: ref('node:n-rename:output:revenue', 'n-rename'),
      node_id: 'n-rename',
      node_name: 'DataFrameRenameColumns',
      port: 'output',
      role: 'output',
      column: 'revenue',
      op: 'rename',
      depth: 3,
      description_provenance: 'declared',
    },
  ],
});
const refined = makeRow('node:n-write:df:revenue', 'revenue', {
  start: ref('node:n-write:df:revenue', 'n-write'),
  description: 'Выручка без скидок',
  description_provenance: 'declared',
  is_refinement: true,
  occurrences: [
    {
      ref: ref('node:n-write:df:revenue', 'n-write'),
      node_id: 'n-write',
      node_name: 'WriteDataFrameToDBV4',
      port: 'df',
      role: 'input',
      column: 'revenue',
      op: 'pass',
      depth: 5,
      description_provenance: 'declared',
    },
  ],
});
const cost = makeRow('node:n-read:output:cost', 'cost', {
  field_name: 'cost',
  description: 'Себестоимость из 1С',
  description_provenance: 'source',
});
const ebitda = makeRow('node:n-expr:output:ebitda', 'ebitda', {
  kind: 'node_column',
  origin: ref('node:n-expr:output:ebitda', 'n-expr'),
  start: ref('node:n-expr:output:ebitda', 'n-expr'),
  dataset_location: null,
  field_name: null,
  origin_node_name: 'DataFrameAddColumnByExpression',
  description_provenance: 'derived',
  depends_on: [revenue.id, cost.id, 'missing-row'],
  targets: [
    { scope: 'project', node_id: 'n-expr', port: 'output', column: 'ebitda' },
  ],
});
const rows = [amount, revenue, refined, cost, ebitda];

describe('projectColumns', () => {
  it('filters rows by description presence, splits and search text', () => {
    expect(filterProjectColumnRows(rows, 'empty', '').map(r => r.id)).toEqual([
      ebitda.id,
    ]);
    expect(
      filterProjectColumnRows(rows, 'splits', '').map(r => r.name)
    ).toEqual(['revenue', 'revenue']);
    expect(
      filterProjectColumnRows(rows, 'described', 'Скид').map(r => r.id)
    ).toEqual([refined.id]);
    expect(filterProjectColumnRows(rows, 'all', 'orders').length).toBe(4);
    expect(countProjectColumnsFilters(rows)).toEqual({
      all: 5,
      described: 4,
      empty: 1,
      splits: 2,
    });
    expect(getProjectColumnsStats(rows)).toEqual({
      total: 5,
      empty: 1,
      renames: 1,
      refinements: 1,
    });
  });

  it('builds marks and origin labels', () => {
    expect(getRowMarks(amount)).toEqual({ rename: null, refinement: null });
    expect(getRowMarks(revenue)).toEqual({
      rename: 'из amount',
      refinement: null,
    });
    expect(getRowMarks(refined).refinement).toBe(
      'уточнение в ноде WriteDataFrameToDBV4'
    );
    expect(getRowOriginLabel(amount)).toBe('main.sales.orders.amount');
    expect(getRowOriginLabel(ebitda)).toBe('DataFrameAddColumnByExpression');
    expect(getRowDependencyNames(ebitda, rows)).toEqual(['revenue', 'cost']);
  });

  it('prefers the global target and allows clearing only declared text', () => {
    expect(getDefaultTarget(amount.targets)?.scope).toBe('global');
    expect(getDefaultTarget(revenue.targets)?.scope).toBe('project');
    expect(getDefaultTarget(undefined)).toBeNull();
    expect(canClearRowDescription(amount)).toBe(true);
    expect(canClearRowDescription(cost)).toBe(false);
    expect(canClearRowDescription(ebitda)).toBe(false);
  });

  it('declines node counts in Russian', () => {
    expect(formatNodeCount(1)).toBe('1 нода');
    expect(formatNodeCount(3)).toBe('3 ноды');
    expect(formatNodeCount(5)).toBe('5 нод');
    expect(formatNodeCount(11)).toBe('11 нод');
    expect(formatNodeCount(22)).toBe('22 ноды');
  });
});
