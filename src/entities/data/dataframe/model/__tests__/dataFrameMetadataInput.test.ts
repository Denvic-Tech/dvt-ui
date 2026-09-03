import { describe, expect, it } from 'vitest';

import {
  parseDataFrameMetadataJson,
  serializeDataFrameMetadataDraftRows,
  validateDataFrameMetadataDraftRows,
} from '../dataFrameMetadataInput';

describe('dataFrameMetadataInput helpers', () => {
  it('preserves hidden column fields when serializing ui draft rows', () => {
    const serialized = serializeDataFrameMetadataDraftRows(
      [
        {
          id: 'row-1',
          dtype: 'FLOAT',
          name: 'price',
          nullable: true,
        },
      ],
      {
        type: 'DATAFRAME',
        columns: [
          {
            name: 'amount',
            dtype: 'INT',
            dtype_metadata: {
              class: 'IntegerDtype',
              name: 'Int64',
              origin: 'pandas',
            },
            index: true,
            nullable: false,
          },
        ],
        rows_num: 10,
        size: 20,
      }
    );

    expect(serialized).toEqual({
      type: 'DATAFRAME',
      columns: [
        {
          name: 'price',
          dtype: 'FLOAT',
          dtype_metadata: {
            class: 'IntegerDtype',
            name: 'Int64',
            origin: 'pandas',
          },
          index: true,
          nullable: true,
        },
      ],
      rows_num: 10,
      size: 20,
    });
  });

  it('validates duplicate and empty column names', () => {
    const errors = validateDataFrameMetadataDraftRows([
      {
        id: 'row-1',
        dtype: 'STRING',
        name: '',
        nullable: false,
      },
      {
        id: 'row-2',
        dtype: 'INT',
        name: 'ID',
        nullable: false,
      },
      {
        id: 'row-3',
        dtype: 'INT',
        name: 'id',
        nullable: false,
      },
    ]);

    expect(errors).toEqual([
      'Колонка 1: укажите имя.',
      'Колонка 3: имя "id" повторяется.',
    ]);
  });

  it('parses valid dataframe metadata json', () => {
    const parsed = parseDataFrameMetadataJson(`{
      "type": "DATAFRAME",
      "columns": [
        {
          "name": "id",
          "dtype": "INT",
          "nullable": false
        }
      ]
    }`);

    expect(parsed.errors).toEqual([]);
    expect(parsed.metadata?.columns[0]?.name).toBe('id');
  });
});
