export const normalizeMonacoTextValue = (value: unknown): string => {
  if (value == null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }

  if (typeof value === 'object') {
    try {
      const serializedValue = JSON.stringify(value, null, 2);
      if (typeof serializedValue === 'string') {
        return serializedValue;
      }
    } catch {
      return String(value);
    }
  }

  return String(value);
};
