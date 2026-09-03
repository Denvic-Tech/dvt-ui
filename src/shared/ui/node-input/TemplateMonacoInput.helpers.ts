export const hasTemplateExpressionTrigger = (value: string): boolean =>
  value.includes('{{');

type ResolveTemplateMonacoModeParams = {
  allowExpressions: boolean;
  isTemplateBinding: boolean;
  value: string;
};

export const resolveTemplateMonacoMode = ({
  allowExpressions,
  isTemplateBinding,
  value,
}: ResolveTemplateMonacoModeParams): 'literal' | 'template' => {
  if (isTemplateBinding) {
    return 'template';
  }

  if (allowExpressions && hasTemplateExpressionTrigger(value)) {
    return 'template';
  }

  return 'literal';
};

export const shouldNormalizeTemplateExpressionValue = ({
  allowExpressions,
  isTemplateBinding,
  value,
}: ResolveTemplateMonacoModeParams): boolean =>
  allowExpressions &&
  !isTemplateBinding &&
  hasTemplateExpressionTrigger(value);
