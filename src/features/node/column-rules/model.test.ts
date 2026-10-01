import { describe, expect, it } from 'vitest';

import type { Column } from '@/shared/gatewayClient';

import {
  legacyRule,
  maskMatches,
  newRule,
  previewRules,
  selectColumns,
  updatedRule,
} from './model';

const columns: Column[] = [
  { name: 'Проект_a', dtype: 'STRING' },
  { name: 'Проект_b', dtype: 'STRING' },
  { name: 'Проект_*', dtype: 'STRING' },
  { name: 'amount', dtype: 'INT' },
];
describe('column rule selection and priority', () => {
  it('distinguishes literal names from masks, preserves unicode and literal brackets', () => {
    expect(
      selectColumns(columns, {
        tokens: [{ kind: 'name', value: 'Проект_*' }],
      }).map(c => c.name)
    ).toEqual(['Проект_*']);
    expect(
      selectColumns(columns, { tokens: [{ kind: 'mask', value: 'Проект_*' }] })
    ).toHaveLength(3);
    expect(maskMatches('a[1]?', 'a[1]x')).toBe(true);
    expect(maskMatches('a[1]?', 'a1x')).toBe(false);
  });
  it('unions names and masks, then intersects types and exclusions', () => {
    expect(
      selectColumns(columns, {
        tokens: [
          { kind: 'all', value: '' },
          { kind: 'name', value: 'Проект_a' },
        ],
        types: ['text'],
        exclude: ['Проект_b'],
      }).map(c => c.name)
    ).toEqual(['Проект_a', 'Проект_*']);
  });
  it('first enabled match wins and survives serialization', () => {
    const broad = newRule('regex');
    broad.params.pattern = 'x';
    broad.selector.tokens = [{ kind: 'all', value: '' }];
    const specific = newRule('regex');
    specific.params.pattern = 'y';
    specific.selector.tokens = [{ kind: 'name', value: 'Проект_a' }];
    const rules = JSON.parse(JSON.stringify([specific, broad]));
    let preview = previewRules(columns, rules, 'regex');
    expect(preview.rows[0]?.ruleId).toBe(specific.id);
    expect(preview.counts[broad.id]?.applied).toBe(3);
    rules[0].enabled = false;
    preview = previewRules(columns, rules, 'regex');
    expect(preview.rows.every(row => row.ruleId === broad.id)).toBe(true);
  });
  it('detects collisions and missing literal columns', () => {
    const rule = newRule('regex');
    rule.params.pattern = 'x';
    rule.selector.tokens = [
      { kind: 'name', value: 'Проект_a' },
      { kind: 'name', value: 'missing' },
    ];
    rule.output = { mode: 'new', names: { Проект_a: 'amount' } };
    expect(previewRules(columns, [rule], 'regex').errors[rule.id]).toHaveLength(
      2
    );
  });
  it('preserves legacy dictionary semantics while changing the selection', () => {
    const dictionary = { '': '0', null: '1' };
    const rule = legacyRule(
      { column_to_replace: 'amount', dictionary },
      'replace'
    );
    expect(rule.params.legacy_dictionary).toEqual(dictionary);
    expect(rule.selector.tokens).toEqual([{ kind: 'name', value: 'amount' }]);
  });
  it('keeps skipped columns claimed by the first rule', () => {
    const first = newRule('delta');
    first.selector.tokens = [{ kind: 'all', value: '' }];
    first.skip_incompatible = true;
    const second = { ...newRule('delta'), selector: first.selector };
    const preview = previewRules(columns, [first, second], 'delta');
    expect(preview.rows.every(row => row.skipped)).toBe(true);
    expect(preview.counts[second.id]?.applied).toBe(0);
  });
});

describe('migrated contracts', () => {
  it('preserves empty regex, fixed result names and overwrite semantics in preview', () => {
    const rule = newRule('regex');
    rule.compatibility = 'v1';
    rule.selector.tokens = [{ kind: 'name', value: 'Проект_a' }];
    rule.params = { pattern: '', replacement: '.' };
    rule.output = { mode: 'new', target: 'amount' };
    const preview = previewRules(columns, [rule], 'regex');
    expect(preview.errors).toEqual({});
    expect(preview.rows[0]?.targets).toEqual(['amount']);
  });
  it('retains a dynamic binding until its corresponding control is edited', () => {
    const rule = newRule('regex');
    rule.compatibility = 'v1';
    rule.input_bindings = {
      'selector.tokens.0.value': 'column_to_replace',
      'params.pattern': 'pattern',
    };
    expect(previewRules(columns, [rule], 'regex').errors).toEqual({});
    const updated = updatedRule(rule, { ...rule, params: { pattern: 'new' } });
    expect(updated.input_bindings).toEqual({
      'selector.tokens.0.value': 'column_to_replace',
    });
    const selection = updatedRule(updated, {
      ...updated,
      selector: { tokens: [{ kind: 'all', value: '' }] },
    });
    expect(selection.input_bindings).toEqual({});
  });
  it('accepts an empty migrated replacement dictionary', () => {
    const rule = newRule('replace');
    rule.compatibility = 'v1';
    rule.selector.tokens = [{ kind: 'all', value: '' }];
    rule.params = { legacy_dictionary: {}, pairs: [] };
    expect(previewRules(columns, [rule], 'replace').errors).toEqual({});
  });
});
