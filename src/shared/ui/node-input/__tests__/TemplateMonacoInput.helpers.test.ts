import { describe, expect, it } from 'vitest';

import {
  resolveTemplateMonacoMode,
  shouldNormalizeTemplateExpressionValue,
} from '../TemplateMonacoInput.helpers';

describe('TemplateMonacoInput helpers', () => {
  it('switches raw values with template markers to template mode', () => {
    expect(
      resolveTemplateMonacoMode({
        allowExpressions: true,
        isTemplateBinding: false,
        value: 'SELECT {{ table_name }}',
      })
    ).toBe('template');
  });

  it('keeps literal mode when expressions are disabled', () => {
    expect(
      resolveTemplateMonacoMode({
        allowExpressions: false,
        isTemplateBinding: false,
        value: 'SELECT {{ table_name }}',
      })
    ).toBe('literal');
  });

  it('marks raw template strings for normalization to expr contract', () => {
    expect(
      shouldNormalizeTemplateExpressionValue({
        allowExpressions: true,
        isTemplateBinding: false,
        value: '{{ user_input }}',
      })
    ).toBe(true);
  });

  it('does not re-normalize values that are already template bindings', () => {
    expect(
      shouldNormalizeTemplateExpressionValue({
        allowExpressions: true,
        isTemplateBinding: true,
        value: '{{ user_input }}',
      })
    ).toBe(false);
  });
});
