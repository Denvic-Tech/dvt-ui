import { describe, expect, it } from 'vitest';

import {
  buildNamespacedVariableReference,
  extractNamespacedVariableReference,
  getVariableNamespaceCompletionContext,
} from './helpers';

describe('variable namespace helpers', () => {
  it('builds and parses references for both namespaces', () => {
    expect(
      buildNamespacedVariableReference('input_name', 'input_variables')
    ).toBe('input_variables.input_name');
    expect(
      buildNamespacedVariableReference('project name', 'project_variables')
    ).toBe('project_variables["project name"]');

    expect(
      extractNamespacedVariableReference('project_variables.project_name')
    ).toEqual({
      name: 'project_name',
      namespace: 'project_variables',
    });
  });

  it('detects dot and bracket completion contexts', () => {
    expect(
      getVariableNamespaceCompletionContext(
        'project_variables.pro',
        'project_variables.pro'.length
      )
    ).toEqual({
      namespace: 'project_variables',
      query: 'pro',
      replaceStart: 'project_variables.'.length,
      replaceEnd: 'project_variables.pro'.length,
    });

    expect(
      getVariableNamespaceCompletionContext(
        'input_variables["odd',
        'input_variables["odd'.length
      )
    ).toEqual({
      namespace: 'input_variables',
      query: 'odd',
      replaceStart: 'input_variables["'.length,
      replaceEnd: 'input_variables["odd'.length,
    });
  });
});
