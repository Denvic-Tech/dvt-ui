import { describe, expect, it } from 'vitest';

import {
  buildExplainTree,
  buildLineagePath,
  filterNodeFields,
  flattenExplainTree,
  getFieldDependencyColumns,
  getFieldPreviousName,
  isFieldChanged,
  isSameLineageRef,
} from './presentation';
import type { ExplainStep, LineageOp, LineageRef, NodeField } from './types';

const nodeRef = (column: string, nodeId = 'node-1'): LineageRef => ({
  key: `node:${nodeId}:output:${column}`,
  kind: 'node',
  node_id: nodeId,
  port: 'output',
  column,
});

const dsRef = (fieldId: string): LineageRef => ({
  key: `ds:dataset-1:${fieldId}`,
  kind: 'ds',
  dataset_id: 'dataset-1',
  field_id: fieldId,
});

const makeField = (
  name: string,
  op: LineageOp,
  overrides: Partial<NodeField> = {}
): NodeField => ({
  name,
  op,
  ref: nodeRef(name, 'node-2'),
  origin: dsRef(`f-${name}`),
  ...overrides,
});

describe('lineage presentation', () => {
  it('collects unique dependency columns', () => {
    const field = makeField('total', 'compute', {
      deps: [nodeRef('price'), nodeRef('qty'), nodeRef('price')],
    });

    expect(getFieldDependencyColumns(field)).toEqual(['price', 'qty']);
  });

  it('resolves previous name only for rename', () => {
    expect(
      getFieldPreviousName(
        makeField('client_id', 'rename', { deps: [nodeRef('customer_id')] })
      )
    ).toBe('customer_id');
    expect(
      getFieldPreviousName(
        makeField('client_id', 'pass', { deps: [nodeRef('customer_id')] })
      )
    ).toBeNull();
    expect(
      getFieldPreviousName(
        makeField('same', 'rename', { deps: [nodeRef('same')] })
      )
    ).toBeNull();
  });

  it('compares refs by key', () => {
    expect(isSameLineageRef(dsRef('a'), dsRef('a'))).toBe(true);
    expect(isSameLineageRef(dsRef('a'), dsRef('b'))).toBe(false);
    expect(isSameLineageRef(dsRef('a'), null)).toBe(false);
  });

  it('splits fields into changed and unchanged and filters by text', () => {
    const fields = [
      makeField('id', 'pass'),
      makeField('amount', 'aggregate', { description: 'Сумма заказа' }),
      makeField('total', 'compute', { deps: [nodeRef('price')] }),
    ];

    expect(fields.filter(isFieldChanged).map(field => field.name)).toEqual([
      'amount',
      'total',
    ]);
    expect(isFieldChanged({ op: 'source' })).toBe(false);
    expect(filterNodeFields(fields, '')).toBe(fields);
    expect(filterNodeFields(fields, 'сумма').map(field => field.name)).toEqual([
      'amount',
    ]);
    expect(filterNodeFields(fields, 'price').map(field => field.name)).toEqual([
      'total',
    ]);
  });
});

const step = (
  ref: LineageRef,
  depth: number,
  op: LineageOp,
  deps?: LineageRef[]
): ExplainStep => ({
  ref,
  depth,
  op,
  node_id: ref.node_id ?? null,
  column: ref.column ?? null,
  ...(deps ? { deps } : {}),
});

describe('buildExplainTree', () => {
  it('builds branches from deps when the backend provides them', () => {
    const score = nodeRef('score', 'e');
    const total = nodeRef('total', 'j');
    const cust = nodeRef('cust', 'j');
    const amount = dsRef('f-amount');
    const tree = buildExplainTree({
      root: score,
      steps: [
        step(score, 0, 'compute', [total, cust]),
        step(total, 1, 'aggregate', [amount]),
        step(cust, 1, 'pass', [dsRef('f-cust')]),
        step(amount, 2, 'source', []),
        step(dsRef('f-cust'), 2, 'source', []),
      ],
    });

    expect(tree?.step.ref.key).toBe(score.key);
    expect(tree?.children.map(child => child.step.ref.key)).toEqual([
      total.key,
      cust.key,
    ]);
    expect(tree?.children[0].children[0].step.ref.key).toBe(amount.key);
    expect(
      flattenExplainTree(tree).map(row => [row.step.ref.key, row.level])
    ).toEqual([
      [score.key, 0],
      [total.key, 1],
      [amount.key, 2],
      [cust.key, 1],
      [dsRef('f-cust').key, 2],
    ]);
  });

  it('falls back to a linear chain by depth without deps', () => {
    const current = nodeRef('customer_id', 'drop');
    const renamed = nodeRef('customer_id', 'rename');
    const read = nodeRef('id', 'read');
    const tree = buildExplainTree({
      root: current,
      steps: [
        step(current, 0, 'pass'),
        step(renamed, 1, 'rename'),
        step(read, 2, 'source'),
        step(dsRef('f-id'), 3, 'source'),
      ],
    });

    expect(flattenExplainTree(tree).map(row => row.level)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(buildExplainTree({ root: current, steps: [] })).toBeNull();
  });
});

describe('buildLineagePath', () => {
  const current = nodeRef('customer_id', 'cur');
  const filtered = nodeRef('customer_id', 'flt');
  const joined = nodeRef('customer_id', 'join');
  const renamed = nodeRef('customer_id', 'ren');
  const read = nodeRef('id', 'read');
  const field = dsRef('f-id');

  const tree = buildExplainTree({
    root: current,
    steps: [
      step(current, 0, 'pass', [filtered]),
      step(filtered, 1, 'pass', [joined]),
      step(joined, 2, 'pass', [renamed]),
      step(renamed, 3, 'rename', [read]),
      step(read, 4, 'source', [field]),
      step(field, 5, 'source', []),
    ],
  });

  it('collapses pass-through steps and folds the dataset field into the source node', () => {
    const path = buildLineagePath(tree, false);

    expect(path.totalCount).toBe(5);
    expect(path.changesCount).toBe(3);
    expect(
      path.rows.map(row => [row.step.ref.key, row.collapsedBefore])
    ).toEqual([
      [current.key, 0],
      [renamed.key, 2],
      [read.key, 0],
    ]);
    expect(path.rows[1].inputs.map(input => input.ref.key)).toEqual([read.key]);
    expect(path.rows[2].sourceRef?.key).toBe(field.key);
    expect(path.rows[2].inputs).toEqual([]);
  });

  it('keeps every step in full mode', () => {
    const path = buildLineagePath(tree, true);

    expect(path.rows.map(row => row.isPassThrough)).toEqual([
      false,
      true,
      true,
      false,
      false,
    ]);
    expect(path.rows.every(row => row.collapsedBefore === 0)).toBe(true);
  });

  it('indents branches of multi-input steps', () => {
    const total = nodeRef('total', 'calc');
    const price = nodeRef('price', 'read');
    const qty = nodeRef('qty', 'read');
    const path = buildLineagePath(
      buildExplainTree({
        root: total,
        steps: [
          step(total, 0, 'compute', [price, qty]),
          step(price, 1, 'source'),
          step(qty, 1, 'source'),
        ],
      }),
      false
    );

    expect(path.rows.map(row => row.branch)).toEqual([0, 1, 1]);
    expect(buildLineagePath(null, false)).toEqual({
      rows: [],
      totalCount: 0,
      changesCount: 0,
    });
  });
});
