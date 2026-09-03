import { describe, expect, it } from 'vitest';

import {
  getClearedValueByType,
  getCompatibleVariableTypes,
  getDefaultValueForTypeInternal,
  parseConstValue,
} from '@/shared/lib/node-io';

describe('shared/lib/node-io/value', () => {
  it('returns defaults for supported io types', () => {
    expect(getDefaultValueForTypeInternal('STRING' as any)).toBe('');
    expect(getDefaultValueForTypeInternal('INT' as any)).toBe(0);
    expect(getDefaultValueForTypeInternal('FLOAT' as any)).toBe(0);
    expect(getDefaultValueForTypeInternal('BOOLEAN' as any)).toBe(false);
    expect(getDefaultValueForTypeInternal('JSON' as any)).toEqual({});
    expect(getDefaultValueForTypeInternal('DATETIME' as any)).toBeNull();
  });

  it('returns cleared values by type', () => {
    expect(getClearedValueByType('BOOLEAN' as any)).toBe(false);
    expect(getClearedValueByType('STRING' as any)).toBe('');
    expect(getClearedValueByType('FLOAT' as any)).toBe('');
    expect(getClearedValueByType('DATETIME' as any)).toBeNull();
    expect(getClearedValueByType('DICT' as any)).toBeNull();
  });

  it('maps compatible variable types', () => {
    expect(getCompatibleVariableTypes('STRING' as any)).toEqual(['STRING']);
    expect(getCompatibleVariableTypes('INT' as any)).toEqual(['INT']);
    expect(getCompatibleVariableTypes('FLOAT' as any)).toEqual([
      'FLOAT',
      'INT',
    ]);
    expect(getCompatibleVariableTypes('DATETIME' as any)).toEqual([
      'DATETIME',
    ]);
    expect(getCompatibleVariableTypes('JSON' as any)).toEqual([]);
  });

  it('parses and clamps integer values', () => {
    expect(
      parseConstValue('25', {
        type: 'INT',
        min_value: 10,
        max_value: 20,
      } as any)
    ).toBe(20);
    expect(
      parseConstValue('5', {
        type: 'INT',
        min_value: 10,
      } as any)
    ).toBe(10);
    expect(parseConstValue('abc', { type: 'INT' } as any)).toBeNull();
    expect(parseConstValue('', { type: 'INT' } as any)).toBeNull();
  });

  it('parses, clamps and rounds float values', () => {
    expect(
      parseConstValue('12.3456', {
        type: 'FLOAT',
        min_value: 1,
        max_value: 10,
        round_val: 2,
      } as any)
    ).toBe(10);
    expect(
      parseConstValue('1.2345', {
        type: 'FLOAT',
        round_val: 2,
      } as any)
    ).toBe(1.23);
    expect(parseConstValue('abc', { type: 'FLOAT' } as any)).toBeNull();
    expect(parseConstValue('', { type: 'FLOAT' } as any)).toBeNull();
  });
});
