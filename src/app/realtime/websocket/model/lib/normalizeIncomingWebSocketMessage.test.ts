import { describe, expect, it } from 'vitest';

import { zEvent } from '@/shared/gatewayClient';

import { normalizeIncomingWebSocketMessage } from './normalizeIncomingWebSocketMessage';

describe('normalizeIncomingWebSocketMessage', () => {
  it('fills VARIABLE_MAP type for output_variables metadata', () => {
    const message = {
      type: 'NODE_METADATA',
      project_id: 'project-1',
      task_id: 'task-1',
      node_id: 'node-1',
      metadata: {
        output_variables: {
          variables: [
            {
              name: 'table_name',
              type: 'STRING',
              value_state: 'resolved',
            },
          ],
        },
      },
    };

    const normalized = normalizeIncomingWebSocketMessage(message);
    const parsed = zEvent.safeParse(normalized);

    expect(parsed.success).toBe(true);
    if (!parsed.success || parsed.data.type !== 'NODE_METADATA') {
      return;
    }

    expect(parsed.data.metadata['output_variables']).toEqual({
      type: 'VARIABLE_MAP',
      variables: [
        {
          name: 'table_name',
          type: 'STRING',
          value_state: 'resolved',
        },
      ],
    });
  });

  it('converts descriptor maps into VARIABLE_MAP.variables array', () => {
    const message = {
      type: 'NODE_METADATA',
      project_id: 'project-1',
      task_id: 'task-1',
      node_id: 'node-1',
      metadata: {
        output_variables: {
          source_table: {
            type: 'STRING',
            value_state: 'resolved',
          },
          batch_size: {
            type: 'INT',
            var_type: 'system',
          },
        },
      },
    };

    const normalized = normalizeIncomingWebSocketMessage(message);
    const parsed = zEvent.safeParse(normalized);

    expect(parsed.success).toBe(true);
    if (!parsed.success || parsed.data.type !== 'NODE_METADATA') {
      return;
    }

    expect(parsed.data.metadata['output_variables']).toEqual({
      type: 'VARIABLE_MAP',
      variables: [
        {
          name: 'source_table',
          type: 'STRING',
          value_state: 'resolved',
        },
        {
          name: 'batch_size',
          type: 'INT',
          var_type: 'system',
        },
      ],
    });
  });

  it('keeps dataframe metadata compatible when dtype class is missing', () => {
    const message = {
      type: 'NODE_METADATA',
      project_id: 'project-1',
      task_id: 'task-1',
      node_id: 'node-1',
      metadata: {
        df: {
          type: 'DATAFRAME',
          columns: [
            {
              name: 'id',
              dtype: 'INT',
              dtype_metadata: {
                name: 'int64',
                origin: 'numpy',
              },
            },
          ],
        },
      },
    };

    const normalized = normalizeIncomingWebSocketMessage(message);
    const parsed = zEvent.safeParse(normalized);

    expect(parsed.success).toBe(true);
    if (!parsed.success || parsed.data.type !== 'NODE_METADATA') {
      return;
    }

    expect(parsed.data.metadata['df']).toMatchObject({
      type: 'DATAFRAME',
      columns: [
        {
          name: 'id',
          dtype_metadata: {
            class: 'int64',
          },
        },
      ],
    });
  });
});
