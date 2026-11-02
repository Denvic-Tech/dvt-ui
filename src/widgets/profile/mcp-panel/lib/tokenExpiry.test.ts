import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { formatAccessSummary } from './mcpTokenScope';
import { getTokenExpiry } from './tokenExpiry';

const NOW = dayjs('2026-10-30T12:00:00');

describe('getTokenExpiry', () => {
  it('treats a token without a date as perpetual', () => {
    expect(getTokenExpiry(null, NOW)).toEqual({
      tone: 'normal',
      label: 'Бессрочный',
    });
  });

  it('shows the date while the token is far from expiring', () => {
    expect(getTokenExpiry(NOW.add(15, 'day').unix(), NOW)).toEqual({
      tone: 'normal',
      label: `Истекает ${NOW.add(15, 'day').format('DD.MM.YYYY')}`,
    });
  });

  it('counts down the last 14 days with Russian plurals', () => {
    expect(getTokenExpiry(NOW.add(14, 'day').unix(), NOW)).toEqual({
      tone: 'soon',
      label: 'Истекает через 14 дней',
    });
    expect(getTokenExpiry(NOW.add(2, 'day').unix(), NOW).label).toBe(
      'Истекает через 2 дня'
    );
    expect(getTokenExpiry(NOW.add(1, 'hour').unix(), NOW).label).toBe(
      'Истекает через 1 день'
    );
  });

  it('marks a past date as expired', () => {
    expect(getTokenExpiry(NOW.subtract(1, 'minute').unix(), NOW)).toEqual({
      tone: 'expired',
      label: 'Истёк',
    });
  });
});

describe('formatAccessSummary', () => {
  it('collapses full access into one phrase', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'all' },
        db_connections: { mode: 'all' },
      })
    ).toBe('Все проекты и подключения');
  });

  it('counts selected resources', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'selected', ids: ['a', 'b'] },
        db_connections: { mode: 'selected', ids: ['c'] },
      })
    ).toBe('2 проекта, 1 подключение');
  });

  it('mixes full and selected access', () => {
    expect(
      formatAccessSummary({
        projects: { mode: 'all' },
        db_connections: { mode: 'selected', ids: ['a', 'b', 'c', 'd', 'e'] },
      })
    ).toBe('Все проекты, 5 подключений');
  });
});
