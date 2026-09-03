import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { zIo } from '@/shared/gatewayClient';
import { makeExpressionValue } from '@/shared/lib/node-input-values';

export const getPrimitiveExpressionSeed = (
  type: InputDefinitionModel['type'] | undefined,
  currentValue: unknown
): string => {
  if (currentValue == null || currentValue === '') {
    return '';
  }

  switch (type) {
    case zIo.enum.BOOLEAN:
      return currentValue ? 'true' : 'false';
    case zIo.enum.INT:
    case zIo.enum.FLOAT:
      return typeof currentValue === 'number' ? String(currentValue) : '';
    case zIo.enum.DATETIME:
    case zIo.enum.TIMEDELTA:
      return typeof currentValue === 'string'
        ? JSON.stringify(currentValue)
        : '';
    default:
      return typeof currentValue === 'string'
        ? JSON.stringify(currentValue)
        : '';
  }
};

export const buildSingleExpressionValue = (
  type: InputDefinitionModel['type'] | undefined,
  currentValue: unknown
) => {
  return makeExpressionValue(
    getPrimitiveExpressionSeed(type, currentValue),
    'single'
  );
};
