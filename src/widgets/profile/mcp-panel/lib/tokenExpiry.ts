import dayjs, { type Dayjs } from 'dayjs';

import { pluralizeRu } from './mcpTokenScope';

const EXPIRING_SOON_DAYS = 14;
const HOURS_IN_DAY = 24;

export type TokenExpiryTone = 'normal' | 'soon' | 'expired';

export type TokenExpiry = {
  tone: TokenExpiryTone;
  label: string;
};

export const getTokenExpiry = (
  expiresAt: number | null | undefined,
  now: Dayjs = dayjs()
): TokenExpiry => {
  if (!expiresAt) {
    return { tone: 'normal', label: 'Бессрочный' };
  }

  const expiration = dayjs.unix(expiresAt);
  if (!expiration.isAfter(now)) {
    return { tone: 'expired', label: 'Истёк' };
  }

  const daysLeft = Math.ceil(expiration.diff(now, 'hour', true) / HOURS_IN_DAY);
  if (daysLeft <= EXPIRING_SOON_DAYS) {
    return {
      tone: 'soon',
      label: `Истекает через ${pluralizeRu(daysLeft, ['день', 'дня', 'дней'])}`,
    };
  }

  return {
    tone: 'normal',
    label: `Истекает ${expiration.format('DD.MM.YYYY')}`,
  };
};
