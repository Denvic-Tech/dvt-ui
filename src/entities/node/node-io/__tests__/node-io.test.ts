import { describe, expect, it } from 'vitest';

import {
  CONNECTION_REQUIRED_TYPES,
  HAS_WIDGET_TYPES,
  PRIMITIVE_TYPES,
  getClearedValueByType,
  getCompatibleVariableTypes,
  getDefaultValueForTypeInternal,
  getIOTypeColor,
  isConnectRequiredType,
  isPrimitiveIOType,
  isPrimitiveType,
  isWidgetType,
  parseConstValue,
  requiresConnectedNodeMetadata,
  shouldCheckInputConnection,
} from '@/entities/node/node-io';
import { JSONNodeInput, TemplateMonacoInput } from '@/entities/node/node-io/ui';

describe('entities/node-io', () => {
  it('detects primitive types correctly', () => {
    expect(isPrimitiveIOType('STRING' as any)).toBe(true);
    expect(isPrimitiveIOType(['STRING', 'INT'] as any)).toBe(true);
    expect(isPrimitiveIOType(['STRING', 'DATAFRAME'] as any)).toBe(false);
    expect(isPrimitiveIOType('DICT' as any)).toBe(false);
    expect(isPrimitiveIOType('JSON' as any)).toBe(false);

    expect(isPrimitiveType('INT' as any)).toBe(true);
    expect(isPrimitiveType('DATAFRAME' as any)).toBe(false);
    expect(isPrimitiveType('DICT' as any)).toBe(false);
    expect(isPrimitiveType('JSON' as any)).toBe(false);
  });

  it('detects connect required and widget types', () => {
    expect(
      isConnectRequiredType({
        type: 'SCHEMA',
        schema: { title: 'DBConnection' },
      } as any)
    ).toBe(true);

    expect(
      isConnectRequiredType({
        type: 'STRING',
      } as any)
    ).toBe(false);
    expect(
      isConnectRequiredType({
        type: 'SIGNAL',
      } as any)
    ).toBe(true);
    expect(
      shouldCheckInputConnection({
        type: 'DATAFRAME',
        use_connection: true,
      } as any)
    ).toBe(true);
    expect(
      shouldCheckInputConnection({
        type: 'DATAFRAME',
        use_connection: false,
      } as any)
    ).toBe(false);
    expect(
      requiresConnectedNodeMetadata({
        type: 'SIGNAL',
      } as any)
    ).toBe(false);
    expect(
      requiresConnectedNodeMetadata({
        type: 'VARIABLE',
      } as any)
    ).toBe(false);
    expect(
      requiresConnectedNodeMetadata({
        type: 'DATAFRAME',
      } as any)
    ).toBe(true);

    expect(isWidgetType('STRING' as any)).toBe(true);
    expect(isWidgetType('DATAFRAME' as any)).toBe(false);
  });

  it('resolves io color and schema-derived constants', () => {
    expect(getIOTypeColor('STRING' as any)).toBeTruthy();
    expect(getIOTypeColor(['INT'] as any)).toBeTruthy();

    expect(PRIMITIVE_TYPES.length).toBeGreaterThan(0);
    expect(CONNECTION_REQUIRED_TYPES.length).toBeGreaterThan(0);
    expect(CONNECTION_REQUIRED_TYPES).toContain('SIGNAL');
    expect(HAS_WIDGET_TYPES.length).toBeGreaterThan(0);
    expect(getIOTypeColor('SIGNAL' as any)).toBe('#E91E63');
  });

  it('re-exports shared value helpers through entity public api', () => {
    expect(getDefaultValueForTypeInternal('STRING' as any)).toBe('');
    expect(getDefaultValueForTypeInternal(['FLOAT'] as any)).toBe(0);
    expect(getCompatibleVariableTypes('FLOAT' as any)).toEqual([
      'FLOAT',
      'INT',
    ]);
    expect(getClearedValueByType('DATETIME' as any)).toBeNull();
    expect(
      parseConstValue('99', {
        type: 'INT',
        min_value: 0,
        max_value: 10,
      } as any)
    ).toBe(10);
  });

  it('keeps shared ui compatibility exports available from entity ui barrel', () => {
    expect(JSONNodeInput).toBeTypeOf('function');
    expect(TemplateMonacoInput).toBeTypeOf('function');
  });
});
