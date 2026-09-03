type DataTypeTone = {
  background: string;
  color: string;
};

const DEFAULT_TONE: DataTypeTone = {
  background: '#f3f4f6',
  color: '#6b7280',
};

export const getDataTypeTone = (dataType: string): DataTypeTone => {
  const normalizedType = dataType.trim().toUpperCase();

  if (
    normalizedType.includes('STRING') ||
    normalizedType.includes('VARCHAR') ||
    normalizedType.includes('TEXT') ||
    normalizedType.includes('CHAR') ||
    normalizedType === 'STR' ||
    normalizedType === 'OBJECT'
  ) {
    return { background: '#d1fae5', color: '#065f46' };
  }

  if (
    normalizedType.includes('INT') ||
    normalizedType.includes('LONG') ||
    normalizedType.includes('SHORT')
  ) {
    return { background: '#dbeafe', color: '#1e40af' };
  }

  if (
    normalizedType.includes('FLOAT') ||
    normalizedType.includes('DOUBLE') ||
    normalizedType.includes('DECIMAL') ||
    normalizedType.includes('NUMERIC') ||
    normalizedType.includes('REAL')
  ) {
    return { background: '#ede9fe', color: '#5b21b6' };
  }

  if (normalizedType.includes('BOOL')) {
    return { background: '#fce7f3', color: '#9d174d' };
  }

  if (normalizedType.includes('DATE') || normalizedType.includes('TIME')) {
    return { background: '#fef3c7', color: '#92400e' };
  }

  return DEFAULT_TONE;
};
