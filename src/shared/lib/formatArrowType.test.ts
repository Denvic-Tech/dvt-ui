import { describe, expect, it } from 'vitest';

import type { ArrowTypeMetadata } from '@/shared/gatewayClient';

import { formatArrowType } from './formatArrowType';

export const headersType: ArrowTypeMetadata = {
  kind: 'list',
  fields: [
    {
      name: 'item',
      nullable: true,
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'key',
            nullable: false,
            type: { kind: 'scalar', name: 'string' },
          },
          {
            name: 'value',
            nullable: true,
            type: { kind: 'scalar', name: 'binary' },
          },
        ],
      },
    },
  ],
};

describe('Arrow type presentation', () => {
  it('describes nested headers without object coercion or rows', () => {
    expect(formatArrowType(headersType)).toBe(
      'list<item: struct<key: string not null, value: binary>>'
    );
  });
  it('retains scalar details', () => {
    expect(formatArrowType({ kind: 'scalar', name: 'binary' })).toBe('binary');
    expect(
      formatArrowType({ kind: 'timestamp', unit: 'ns', timezone: 'UTC' })
    ).toBe('timestamp[ns, UTC]');
    expect(formatArrowType({ kind: 'fixed_size_binary', size: 16 })).toBe(
      'fixed_size_binary[16]'
    );
  });
});
