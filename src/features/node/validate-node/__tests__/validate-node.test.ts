import { describe, expect, it, vi } from 'vitest';

import {
  createValidationCallback,
  enrichNodeDataWithDefaults,
  validateNodeData,
} from '@/features/node/validate-node';

import { getDefaultValueForTypeInternal } from '@/shared/lib/node-io';

describe('features/validate-node', () => {
  const nodeDefinition = {
    input_definitions: {
      title: {
        attr_name: 'title',
        display_name: 'Title',
        type: 'STRING',
        optional: false,
        is_list_type: false,
        is_literal_type: false,
      },
      count: {
        attr_name: 'count',
        display_name: 'Count',
        type: 'INT',
        optional: false,
        is_list_type: false,
        is_literal_type: false,
      },
      payload: {
        attr_name: 'payload',
        display_name: 'Payload',
        type: 'DICT',
        optional: true,
        is_list_type: false,
        is_literal_type: false,
      },
    },
  } as any;

  it('validates const-wrapped input data', () => {
    const result = validateNodeData(nodeDefinition, {
      title: { __dvt_type: 'const', value: 'Report' },
      count: { __dvt_type: 'const', value: 2 },
      payload: { __dvt_type: 'const', value: { x: 1 } },
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('collects field-level errors when required value is missing', () => {
    const result = validateNodeData(nodeDefinition, {
      title: { __dvt_type: 'const', value: '' },
      count: { __dvt_type: 'const', value: 1 },
    });

    expect(result.success).toBe(false);
    expect(result.errors['title']?.length).toBeGreaterThan(0);
  });

  it('enriches missing values with defaults for required fields', () => {
    const enriched = enrichNodeDataWithDefaults(nodeDefinition, {
      title: 'A',
    });

    expect(enriched['title']).toBe('A');
    expect(enriched['count']).toBe(0);
    expect(getDefaultValueForTypeInternal('STRING' as any)).toBe('');
  });

  it('validates SCHEMA inputs against object-or-array JSON schema', () => {
    const schemaNodeDefinition = {
      input_definitions: {
        payload: {
          attr_name: 'payload',
          display_name: 'Payload',
          type: 'SCHEMA',
          optional: false,
          is_list_type: false,
          is_literal_type: false,
          schema: {
            oneOf: [{ type: 'object' }, { type: 'array', items: {} }],
          },
        },
      },
    } as any;

    expect(
      validateNodeData(schemaNodeDefinition, { payload: { key: 'value' } })
        .success
    ).toBe(true);
    expect(
      validateNodeData(schemaNodeDefinition, { payload: ['some_String'] })
        .success
    ).toBe(true);

    const scalarResult = validateNodeData(schemaNodeDefinition, {
      payload: 'some_String',
    });
    expect(scalarResult.success).toBe(false);
    expect(scalarResult.errors['payload']).toEqual([
      'Payload не соответствует ожидаемой структуре',
    ]);
  });

  it('does not fail the whole form when backend SCHEMA contains an unresolved local ref', () => {
    const schemaNodeDefinition = {
      input_definitions: {
        auth: {
          attr_name: 'auth',
          display_name: 'Auth',
          type: 'SCHEMA',
          optional: false,
          is_list_type: false,
          is_literal_type: false,
          default: { type: 'none' },
          schema: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  username: { $ref: '#/$defs/AuthStringValue' },
                },
              },
            ],
          },
        },
        payload: {
          attr_name: 'payload',
          display_name: 'Payload',
          type: 'SCHEMA',
          optional: true,
          is_list_type: false,
          is_literal_type: false,
          schema: {
            oneOf: [{ type: 'object' }, { type: 'array', items: {} }],
          },
        },
      },
    } as any;

    const result = validateNodeData(schemaNodeDefinition, {
      auth: { type: 'none' },
      payload: ['6d14ff9c-855a-40b0-abe0-eaeba65b44e9'],
    });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('allows expressions for required SCHEMA inputs until runtime resolution', () => {
    const schemaNodeDefinition = {
      input_definitions: {
        payload: {
          attr_name: 'payload',
          display_name: 'Payload',
          type: 'SCHEMA',
          optional: false,
          is_list_type: false,
          is_literal_type: false,
          schema: {
            type: 'object',
            required: ['required_key'],
            properties: {
              required_key: { type: 'string' },
            },
          },
        },
      },
    } as any;

    const result = validateNodeData(schemaNodeDefinition, {
      payload: {
        __dvt_type: 'expr',
        value: 'input_variables.payload',
        expression_kind: 'single',
      },
    });

    expect(result.success).toBe(true);
  });

  it('provides validation callback and calls error handler', () => {
    const onValidationError = vi.fn();
    const validate = createValidationCallback(
      nodeDefinition,
      () => ({ title: '', count: 1 }),
      onValidationError
    );

    expect(validate()).toBe(false);
    expect(onValidationError).toHaveBeenCalledTimes(1);
  });
});
