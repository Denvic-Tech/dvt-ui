import dayjs, { type Dayjs } from 'dayjs';

export type TokenExpiryMode = '30d' | '90d' | '1y' | 'never' | 'date';

export type TokenExpiryValue = {
  expiryMode: TokenExpiryMode;
  expiryDate: Dayjs | null;
};

export const EXPIRY_PRESETS: Array<{
  value: Exclude<TokenExpiryMode, 'date'>;
  label: string;
}> = [
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: '1y', label: '1 год' },
  { value: 'never', label: 'Бессрочно' },
];

export const formatTokenExpiry = (value: TokenExpiryValue): string => {
  if (value.expiryMode === 'date') {
    return `До ${value.expiryDate?.format('DD.MM.YYYY') ?? ''}`;
  }

  return (
    EXPIRY_PRESETS.find(preset => preset.value === value.expiryMode)?.label ??
    ''
  );
};

export const resolveTokenExpiresAt = (
  value: TokenExpiryValue,
  now: Dayjs = dayjs()
): number | null => {
  switch (value.expiryMode) {
    case '30d':
      return now.add(30, 'day').unix();
    case '90d':
      return now.add(90, 'day').unix();
    case '1y':
      return now.add(1, 'year').unix();
    case 'date':
      return value.expiryDate?.unix() ?? null;
    case 'never':
      return null;
  }
};

export const isTokenExpiryValid = (
  value: TokenExpiryValue,
  now: Dayjs = dayjs()
): boolean =>
  value.expiryMode !== 'date' ||
  (value.expiryDate?.isValid() === true && value.expiryDate.isAfter(now));
