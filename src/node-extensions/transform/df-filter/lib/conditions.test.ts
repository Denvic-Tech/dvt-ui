import { describe, expect, it } from 'vitest';

import {
  makeExpressionValue,
  makeVariableExpressionValue,
} from '@/shared/lib/node-input-values';

import {
  buildConditionsTreeFromBuilder,
  createBuilderStateFromInput,
  createEmptyBuilderCondition,
  createEmptyBuilderGroup,
  createIdFactory,
  normalizeFilterRulesSpec,
} from './conditions';

describe('dataFrameFilter conditions helpers', () => {
  const spec = normalizeFilterRulesSpec({
    version: 3,
    null_literal_token: '__dvt_null_value',
    empty_string_literal_token: '__dvt_empty_string_value',
    operand_types: ['column', 'literal', 'expression'],
    expression_operand: {
      enabled: true,
      expression_kind: 'single',
      value_payload_type: 'NodeInputExpressionValue',
    },
    node_kinds: ['condition', 'and', 'or'],
    operators: [
      '==',
      '!=',
      '>',
      '>=',
      '<',
      '<=',
      'contains',
      'startswith',
      'endswith',
      'isin',
      'notin',
      'isnull',
      'notnull',
    ],
    operators_without_right: ['isnull', 'notnull'],
    operators_with_list_right: ['isin', 'notin'],
    operators_with_literal_right_only: [
      'contains',
      'startswith',
      'endswith',
      'isin',
      'notin',
    ],
  });

  it('normalizes v3 expression operand support', () => {
    expect(spec.version).toBe(3);
    expect(spec.operandTypes.has('expression')).toBe(true);
    expect(spec.expressionOperandEnabled).toBe(true);
  });

  it('converts legacy filter_conditions/logic to builder state', () => {
    const nextId = createIdFactory();
    const builder = createBuilderStateFromInput(
      {
        logic: 'OR',
        filter_conditions: [
          { column: 'age', operator: '>=', value: 18 },
          { column: 'status', operator: '==', value: '__dvt_null_value' },
        ],
      },
      spec,
      nextId,
      'age'
    );

    expect(builder.rootLogic).toBe('or');
    expect(builder.nodes).toHaveLength(2);
    expect(builder.nodes[0]).toMatchObject({
      type: 'condition',
      leftColumn: 'age',
      operator: '>=',
    });
    expect(builder.nodes[1]).toMatchObject({
      type: 'condition',
      leftColumn: 'status',
      operator: '==',
      right: { kind: 'null' },
    });
  });

  it('parses nested conditions tree to builder state', () => {
    const nextId = createIdFactory();
    const builder = createBuilderStateFromInput(
      {
        conditions: {
          kind: 'and',
          conditions: [
            {
              kind: 'condition',
              left: { type: 'column', column: 'age' },
              operator: '>=',
              right: { type: 'literal', value: 30 },
            },
            {
              kind: 'or',
              conditions: [
                {
                  kind: 'condition',
                  left: { type: 'column', column: 'name' },
                  operator: 'contains',
                  right: { type: 'literal', value: '{{user_name}}' },
                },
              ],
            },
          ],
        },
      },
      spec,
      nextId,
      'age'
    );

    expect(builder.rootLogic).toBe('and');
    expect(builder.nodes).toHaveLength(2);
    expect(builder.nodes[1]).toMatchObject({
      type: 'group',
      logic: 'or',
    });
    expect(builder.nodes[1]).toMatchObject({
      children: [
        {
          right: { kind: 'literal', value: '{{user_name}}' },
        },
      ],
    });
  });

  it('parses expression operand to builder state', () => {
    const nextId = createIdFactory();
    const expression = makeExpressionValue('param', 'single');
    const builder = createBuilderStateFromInput(
      {
        conditions: {
          kind: 'condition',
          left: { type: 'column', column: 'age' },
          operator: '>=',
          right: { type: 'expression', value: expression },
        },
      },
      spec,
      nextId,
      'age'
    );

    expect(builder.nodes[0]).toMatchObject({
      type: 'condition',
      right: { kind: 'expression', value: expression },
    });
  });

  it('builds strict tree with nested groups and typed right operands', () => {
    const nextId = createIdFactory();
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'age',
          operator: '>=',
          right: { kind: 'literal' as const, value: '18' },
          listValues: [],
        },
        {
          id: nextId(),
          type: 'group' as const,
          logic: 'or' as const,
          children: [
            {
              id: nextId(),
              type: 'condition' as const,
              leftColumn: 'left_col',
              operator: '==',
              right: { kind: 'column' as const, column: 'right_col' },
              listValues: [],
            },
            {
              id: nextId(),
              type: 'condition' as const,
              leftColumn: 'name',
              operator: 'isin',
              right: { kind: 'literal' as const, value: '' },
              listValues: [
                { id: nextId(), kind: 'literal' as const, value: 'Ann' },
                { id: nextId(), kind: 'null' as const },
              ],
            },
          ],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['age', 'left_col', 'right_col', 'name'],
      columnTypes: { age: 'INT' },
    });

    expect(result.errors).toEqual([]);
    expect(result.tree).toEqual({
      kind: 'and',
      conditions: [
        {
          kind: 'condition',
          left: { type: 'column', column: 'age' },
          operator: '>=',
          right: { type: 'literal', value: 18 },
        },
        {
          kind: 'or',
          conditions: [
            {
              kind: 'condition',
              left: { type: 'column', column: 'left_col' },
              operator: '==',
              right: { type: 'column', column: 'right_col' },
            },
            {
              kind: 'condition',
              left: { type: 'column', column: 'name' },
              operator: 'isin',
              right: {
                type: 'literal',
                value: ['Ann', '__dvt_null_value'],
              },
            },
          ],
        },
      ],
    });
  });

  it('serializes variable selection as canonical expression operand', () => {
    const nextId = createIdFactory();
    const variableExpression = makeVariableExpressionValue('limit_value');
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'age',
          operator: '>=',
          right: {
            kind: 'expression' as const,
            value: variableExpression,
          },
          listValues: [],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['age'],
      columnTypes: { age: 'INT' },
    });

    expect(result.errors).toEqual([]);
    expect(result.tree.conditions[0]).toEqual({
      kind: 'condition',
      left: { type: 'column', column: 'age' },
      operator: '>=',
      right: {
        type: 'expression',
        value: variableExpression,
      },
    });
  });

  it('keeps double-curly text as a literal string', () => {
    const nextId = createIdFactory();
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'name',
          operator: 'contains',
          right: { kind: 'literal' as const, value: '{{user_name}}' },
          listValues: [],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['name'],
      columnTypes: { name: 'STRING' },
    });

    expect(result.errors).toEqual([]);
    expect(result.tree.conditions[0]).toMatchObject({
      right: { type: 'literal', value: '{{user_name}}' },
    });
  });

  it('serializes list operator expression as the whole right operand', () => {
    const nextId = createIdFactory();
    const listExpression = makeExpressionValue('allowed_names', 'single');
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'name',
          operator: 'isin',
          right: { kind: 'expression' as const, value: listExpression },
          listValues: [
            { id: nextId(), kind: 'literal' as const, value: 'Ann' },
          ],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['name'],
      columnTypes: { name: 'STRING' },
    });

    expect(result.errors).toEqual([]);
    expect(result.tree.conditions[0]).toEqual({
      kind: 'condition',
      left: { type: 'column', column: 'name' },
      operator: 'isin',
      right: {
        type: 'expression',
        value: listExpression,
      },
    });
  });

  it('rejects invalid expression operands in strict mode', () => {
    const nextId = createIdFactory();
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'name',
          operator: '==',
          right: {
            kind: 'expression' as const,
            value: {
              __dvt_type: 'expr',
              value: 'name',
              expression_kind: 'template',
            },
          },
          listValues: [],
        },
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'name',
          operator: '!=',
          right: {
            kind: 'expression' as const,
            value: makeExpressionValue('', 'single'),
          },
          listValues: [],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['name'],
      columnTypes: { name: 'STRING' },
    });

    expect(result.errors).toEqual([
      'Корень.Условие 1: expression должен быть canonical expr(single).',
      'Корень.Условие 2: expression не должен быть пустым.',
    ]);
  });

  it('returns strict error when NULL is used with comparison operator', () => {
    const nextId = createIdFactory();
    const builder = {
      rootLogic: 'and' as const,
      nodes: [
        {
          id: nextId(),
          type: 'condition' as const,
          leftColumn: 'age',
          operator: '>',
          right: { kind: 'null' as const },
          listValues: [],
        },
      ],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['age'],
      columnTypes: { age: 'INT' },
    });

    expect(result.errors).toEqual([
      "Корень.Условие 1: оператор '>' нельзя использовать с NULL-литералом.",
    ]);
  });

  it('allows empty root (pass-through)', () => {
    const nextId = createIdFactory();
    const builder = {
      rootLogic: 'and' as const,
      nodes: [],
    };

    const result = buildConditionsTreeFromBuilder(builder, spec, {
      strict: true,
      columnNames: ['age'],
      columnTypes: { age: 'INT' },
    });

    expect(result.errors).toEqual([]);
    expect(result.tree).toEqual({
      kind: 'and',
      conditions: [],
    });

    const emptyCondition = createEmptyBuilderCondition(
      [{ name: 'age' }],
      spec,
      nextId
    );
    const emptyGroup = createEmptyBuilderGroup(spec, nextId);
    expect(emptyCondition.type).toBe('condition');
    expect(emptyGroup.type).toBe('group');
  });
});
