export const DEFAULT_UNSET_SENTINEL = '__DVT_UNSET__';

const LITERAL_VALUE_ERROR =
  'Введите JSON literal: `null`, `true`, `123`, `"text"`, массив или объект.';

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isWrappedNodeInputValue = (value: unknown): boolean => {
  if (!isObjectRecord(value)) {
    return false;
  }

  const inputType = value['__dvt_type'];
  if (inputType === 'expr') {
    return (
      typeof value['value'] === 'string' &&
      (value['expression_kind'] === 'single' ||
        value['expression_kind'] === 'template')
    );
  }

  if (inputType === 'link') {
    return (
      typeof value['node_id'] === 'string' &&
      typeof value['output_name'] === 'string'
    );
  }

  if (inputType === 'const') {
    return Object.prototype.hasOwnProperty.call(value, 'value');
  }

  return false;
};

export const stringifyLiteralValue = (value: unknown): string => {
  if (value === undefined) {
    return '';
  }

  return JSON.stringify(value);
};

export const parseLiteralValue = (
  rawValue: string
): { value?: unknown; error?: string } => {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return { error: LITERAL_VALUE_ERROR };
  }

  try {
    const parsedValue = JSON.parse(trimmedValue);
    if (isWrappedNodeInputValue(parsedValue)) {
      return { error: LITERAL_VALUE_ERROR };
    }

    return {
      value: parsedValue,
    };
  } catch {
    return { error: LITERAL_VALUE_ERROR };
  }
};

export const isUnsetDefaultValue = (
  value: unknown
): value is typeof DEFAULT_UNSET_SENTINEL => value === DEFAULT_UNSET_SENTINEL;

export const normalizeDefaultLiteralDraft = (rawValue: string): string =>
  rawValue.trim() === DEFAULT_UNSET_SENTINEL ? '' : rawValue;

export const hydrateDefaultLiteralDraft = (value: unknown): string => {
  if (value === undefined || isUnsetDefaultValue(value)) {
    return '';
  }

  return stringifyLiteralValue(value);
};

export const parseDefaultLiteralDraft = (
  rawValue: string
): { error?: string; isUnset: boolean; value: unknown } => {
  const normalizedValue = normalizeDefaultLiteralDraft(rawValue);

  if (!normalizedValue.trim()) {
    return {
      isUnset: true,
      value: DEFAULT_UNSET_SENTINEL,
    };
  }

  const parsed = parseLiteralValue(normalizedValue);
  if (parsed.error) {
    return {
      error: parsed.error,
      isUnset: false,
      value: DEFAULT_UNSET_SENTINEL,
    };
  }

  return {
    isUnset: false,
    value: parsed.value,
  };
};
