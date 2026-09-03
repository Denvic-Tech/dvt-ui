const numberFormatter = new Intl.NumberFormat('ru-RU');

export const formatNumber = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return numberFormatter.format(value);
};

export const formatBoolean = (value?: boolean | null) => {
  if (value == null) {
    return '—';
  }

  return value ? 'Да' : 'Нет';
};

export const formatBytes = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  if (value === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  const formattedValue = value / 1024 ** exponent;

  return `${formattedValue.toFixed(formattedValue >= 10 ? 0 : 1)} ${units[exponent]}`;
};

export const formatValue = (value: unknown) => {
  if (value == null) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }

  if (typeof value === 'number') {
    return formatNumber(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : '—';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }

  return JSON.stringify(value, null, 2);
};

export const getValueKind = (value: unknown) => {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
};
