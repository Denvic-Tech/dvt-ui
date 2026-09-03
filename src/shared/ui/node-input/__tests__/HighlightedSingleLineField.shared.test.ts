import { describe, expect, it } from 'vitest';

import type { ExpressionsConfig } from '@/shared/gatewayClient';

import {
  buildExpressionAutocompleteCatalog,
  formatSingleLineExpression,
  getInlineExpressionDiagnostics,
  resolveExpressionsEnvironment,
  resolveInlineAutocomplete,
} from '../HighlightedSingleLineField.shared';

const expressionsConfig: ExpressionsConfig = {
  filters: [
    {
      name: 'trim',
      expression: 'trim',
      description: 'Trim whitespace',
    },
    {
      name: 'default',
      expression: 'default',
      description: 'Fallback value',
    },
  ],
  tests: [
    {
      name: 'defined',
      expression: 'defined',
      description: 'Defined test',
    },
    {
      name: 'none',
      expression: 'none',
      description: 'None test',
    },
    {
      name: 'eq',
      expression: '==',
      description: 'Equality test',
    },
  ],
  globals: [
    {
      name: 'len',
      expression: 'len',
      description: 'Length global',
    },
    {
      name: 'now',
      expression: 'now',
      description: 'Current timestamp',
    },
  ],
  default_policy: {
    name: 'default',
    allowed_filters: ['trim'],
    allowed_tests: ['defined', 'none', '=='],
    allowed_globals: ['len'],
  },
};

const variables = [
  {
    name: 'dataset_name',
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
    type: 'STRING',
    value: 'sales',
  },
  {
    name: 'batch_limit',
    scope: 'system',
    source: 'system',
    sourceLabel: 'Runtime context',
    type: 'INT',
    value: 100,
  },
] as const;

describe('HighlightedSingleLineField.shared', () => {
  it('formats operators, pipes, globals and preserves string contents', () => {
    expect(
      formatSingleLineExpression(
        '=len ( dataset_name )| trim + " keep   spaces " and input_variables["odd   name"]'
      )
    ).toBe(
      '= len(dataset_name) | trim + " keep   spaces " and input_variables["odd   name"]'
    );
  });

  it('resolves expressions environment through default policy', () => {
    const environment = resolveExpressionsEnvironment(
      expressionsConfig,
      'custom'
    );

    expect(environment.filters.map(item => item.expression)).toEqual(['trim']);
    expect(environment.tests.map(item => item.expression)).toEqual([
      'defined',
      'none',
      '==',
    ]);
    expect(environment.globals.map(item => item.expression)).toEqual(['len']);
  });

  it('builds globals as callable operand suggestions', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
      expressionPolicyName: 'default',
    });

    expect(
      catalog.itemsByKind.global.map(item => ({
        label: item.label,
        insertText: item.insertText,
      }))
    ).toEqual([{ label: 'len', insertText: 'len()' }]);
    expect(
      catalog.itemsByKind.variable.map(item => ({
        label: item.label,
        insertText: item.insertText,
      }))
    ).toEqual(
      expect.arrayContaining([
        { label: 'dataset_name', insertText: 'dataset_name' },
        { label: 'batch_limit', insertText: 'batch_limit' },
      ])
    );
  });

  it('offers namespace roots instead of bare variables in scoped mode', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputVariables: [variables[1]],
      projectVariables: [variables[0]],
      inputType: 'STRING',
      expressionsConfig,
      expressionPolicyName: 'default',
    });

    expect(catalog.itemsByKind.variable.map(item => item.label)).toEqual([
      'input_variables',
      'project_variables',
    ]);
  });

  it('validates qualified variables against their own namespace', () => {
    const inputVariables = [variables[1]];
    const projectVariables = [variables[0]];
    const allVariables = [...inputVariables, ...projectVariables];

    expect(
      getInlineExpressionDiagnostics('=project_variables.dataset_name', {
        variables: allVariables,
        inputVariables,
        projectVariables,
      })
    ).toEqual([]);
    expect(
      getInlineExpressionDiagnostics('=dataset_name', {
        variables: allVariables,
        inputVariables,
        projectVariables,
      })
    ).toEqual([]);
    expect(
      getInlineExpressionDiagnostics('=input_variables.dataset_name', {
        variables: allVariables,
        inputVariables,
        projectVariables,
      })
    ).toEqual([
      expect.objectContaining({
        code: 'unknown-variable',
        message: 'Неизвестная переменная "dataset_name" в input_variables.',
      }),
    ]);
  });

  it('returns operand suggestions at expression start including globals', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
    });

    expect(resolveInlineAutocomplete('=', 1, catalog)).toMatchObject({
      allowedKinds: ['variable', 'value', 'global'],
      phase: 'operand',
    });
    expect(
      resolveInlineAutocomplete(
        '=dataset_name == ',
        '=dataset_name == '.length,
        catalog
      )
    ).toMatchObject({
      allowedKinds: ['variable', 'value', 'global'],
      phase: 'operand',
    });
    expect(
      resolveInlineAutocomplete('=dat', '=dat'.length, catalog).items.some(
        item => item.label === 'dataset_name'
      )
    ).toBe(true);
    expect(
      resolveInlineAutocomplete('=le', '=le'.length, catalog).items.some(
        item => item.label === 'len'
      )
    ).toBe(true);
  });

  it('returns filter suggestions only after pipe', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
    });

    const decision = resolveInlineAutocomplete(
      '=dataset_name | ',
      '=dataset_name | '.length,
      catalog
    );

    expect(decision.phase).toBe('filter');
    expect(decision.allowedKinds).toEqual(['filter']);
    expect(decision.items.map(item => item.label)).toEqual(['trim']);
  });

  it('returns tests after is and symbolic tests as normal operators', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
    });

    const isDecision = resolveInlineAutocomplete(
      '=dataset_name is ',
      '=dataset_name is '.length,
      catalog
    );
    expect(isDecision.phase).toBe('is-tail');
    expect(isDecision.items.map(item => item.label)).toEqual([
      'not',
      'defined',
      'none',
    ]);

    const operatorDecision = resolveInlineAutocomplete(
      '=dataset_name ',
      '=dataset_name '.length,
      catalog
    );
    expect(operatorDecision.phase).toBe('operator');
    expect(operatorDecision.items.some(item => item.label === '==')).toBe(true);
  });

  it('returns operator suggestions while typing operator words', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
    });

    const decision = resolveInlineAutocomplete(
      '=dataset_name a',
      '=dataset_name a'.length,
      catalog
    );

    expect(decision.phase).toBe('operator');
    expect(decision.items.map(item => item.label)).toEqual(['and', 'as']);
  });

  it('disables suggestions inside quoted strings and variable key strings', () => {
    const catalog = buildExpressionAutocompleteCatalog({
      variables: [...variables],
      inputType: 'STRING',
      expressionsConfig,
    });

    expect(
      resolveInlineAutocomplete('="ab', '="ab'.length, catalog)
    ).toMatchObject({
      allowedKinds: [],
      items: [],
      phase: 'disabled',
    });

    expect(
      resolveInlineAutocomplete(
        '=input_variables["od',
        '=input_variables["od'.length,
        catalog
      )
    ).toMatchObject({
      allowedKinds: [],
      items: [],
      phase: 'disabled',
    });
  });

  it('reports diagnostics for wrong filter/test/global and unknown variables', () => {
    const unknownVariableDiagnostics = getInlineExpressionDiagnostics(
      '=unknown_var',
      {
        variables: [...variables],
        expressionsConfig,
      }
    );
    expect(unknownVariableDiagnostics.map(item => item.code)).toEqual([
      'unknown-variable',
    ]);
    expect(unknownVariableDiagnostics[0]?.severity).toBe('error');

    expect(
      getInlineExpressionDiagnostics('=dataset_name | defined', {
        variables: [...variables],
        expressionsConfig,
      }).map(item => item.code)
    ).toEqual(['test-used-as-filter']);

    expect(
      getInlineExpressionDiagnostics('=dataset_name is trim', {
        variables: [...variables],
        expressionsConfig,
      }).map(item => item.code)
    ).toEqual(['filter-used-as-test']);

    expect(
      getInlineExpressionDiagnostics('=now()', {
        variables: [...variables],
        expressionsConfig,
      }).map(item => item.code)
    ).toEqual(['unknown-global']);

    expect(
      getInlineExpressionDiagnostics('=len', {
        variables: [...variables],
        expressionsConfig,
      }).map(item => item.code)
    ).toEqual([]);

    expect(
      getInlineExpressionDiagnostics('=dataset_name()', {
        variables: [...variables],
        expressionsConfig,
      }).map(item => item.code)
    ).toEqual(['variable-used-as-function']);
  });

  it('reports type mismatch only for direct variable passthrough', () => {
    const directVariableDiagnostics = getInlineExpressionDiagnostics(
      '=dataset_name',
      {
        variables: [...variables],
        inputType: 'INT',
        expressionsConfig,
      }
    );

    expect(directVariableDiagnostics).toEqual([
      expect.objectContaining({
        code: 'type-mismatch-direct-variable',
        severity: 'warning',
      }),
    ]);

    expect(
      getInlineExpressionDiagnostics('=len(dataset_name)', {
        variables: [...variables],
        inputType: 'INT',
        expressionsConfig,
      })
    ).toEqual([]);
  });
});
