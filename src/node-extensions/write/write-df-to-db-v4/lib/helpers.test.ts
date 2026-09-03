import { describe, expect, it, vi } from 'vitest';

import {
  applyUpsertKeyToTypedTableConfig,
  buildChangedMappingPreviewItems,
  buildColumnMapping,
  buildColumnMappingNameKey,
  buildDbColumnsFromColumnMapping,
  buildExistingTableColumnDiff,
  buildRequestedColumnMappingDraft,
  buildResolveWriteColumnsRequest,
  buildWriteTargetAfterDatabaseChange,
  buildWriteTargetAfterTableModeChange,
  confirmWriteModeOnContinue,
  type ExistingTableColumnDiffRow,
  findWriteTargetTable,
  getChangedTargetNameSourceNames,
  getColumnResolutionValidationErrors,
  getDefaultSelectedColumnActions,
  getTypedSpecValidationErrors,
  isSchemaStrategyStepValid,
  isTargetStepValid,
  isWriteModeStepValid,
  isWriteSettingsStepValid,
  normalizeResolvedColumnRows,
  normalizeTableCreateSpecColumns,
  orderExistingTableRowsPositionally,
  prioritizeUnmappedExistingTableRows,
  shouldShowColumnActionsLoadingOverlay,
  waitForCreateTableSuccessTransition,
  type WriteDataFrameToDBValues,
} from './helpers';

const metadata = {
  connection_id: 'connection-postgres',
  connection_revision: 'revision-1',
  dialect: 'postgresql',
  databases: [
    {
      name: 'analytics',
      schemas: [
        {
          name: 'public',
          tables: [
            {
              name: 'orders',
              columns: [{ name: 'order_id', dtype: 'INT' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
    {
      name: 'warehouse',
      schemas: [
        {
          name: 'staging',
          tables: [
            {
              name: 'events',
              columns: [{ name: 'event_id', dtype: 'INT' }],
              type: 'BASE TABLE',
            },
          ],
        },
      ],
    },
  ],
} as any;

const dataframeMetadata = {
  type: 'DATAFRAME',
  columns: [
    { name: 'clientId', dtype: 'INT', nullable: false },
    { name: 'eventTime', dtype: 'DATETIME', nullable: false },
  ],
} as any;

const clickhouseMetadata = {
  connection_id: 'connection-clickhouse',
  dialect: 'clickhouse',
} as any;

describe('isWriteSettingsStepValid', () => {
  const typedValues: WriteDataFrameToDBValues = {
    table_name: 'orders_new',
    write_mode: 'append',
    column_mapping: [
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'INT',
        nullable: false,
      },
    ],
  };
  const typedSharedState = {
    isTableNew: true,
    selectedCreationMode: 'typed' as const,
    inputConnectionMetadata: clickhouseMetadata,
    inputDataframeMetadata: dataframeMetadata,
  };

  it('blocks a new ClickHouse typed table without Order by or Primary key', () => {
    expect(isWriteSettingsStepValid(typedValues, typedSharedState)).toBe(false);
  });

  it.each([
    ['Order by', { clickhouse: { order_by: ['client_id'] } }],
    ['Primary key', { clickhouse: { primary_key: ['client_id'] } }],
  ])('allows saving when %s is configured', (_label, tableCreateSpec) => {
    expect(
      isWriteSettingsStepValid(
        { ...typedValues, table_create_spec: tableCreateSpec },
        typedSharedState
      )
    ).toBe(true);
  });

  it('does not apply the ClickHouse core-fields rule outside a new typed table', () => {
    expect(
      isWriteSettingsStepValid(typedValues, {
        ...typedSharedState,
        isTableNew: false,
      })
    ).toBe(true);
    expect(
      isWriteSettingsStepValid(typedValues, {
        ...typedSharedState,
        selectedCreationMode: 'raw',
      })
    ).toBe(true);
  });
});

describe('applyUpsertKeyToTypedTableConfig', () => {
  const values: WriteDataFrameToDBValues = {
    column_mapping: [
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'INT',
        nullable: true,
      },
      {
        source_name: 'eventTime',
        target_name: 'event_time',
        dtype: 'DATETIME',
        nullable: true,
      },
    ],
  };

  it('sets ClickHouse order by and makes the upsert key not nullable', () => {
    expect(
      applyUpsertKeyToTypedTableConfig({
        values,
        keyColumn: 'client_id',
        connectionMetadata: {
          connection_id: 'connection-clickhouse',
          dialect: 'clickhouse',
        } as any,
      })
    ).toMatchObject({
      upsert_config: { key_column: 'client_id' },
      column_mapping: [
        { target_name: 'client_id', nullable: false },
        { target_name: 'event_time', nullable: true },
      ],
      table_create_spec: {
        clickhouse: {
          engine_name: 'MergeTree',
          order_by: ['client_id'],
        },
      },
    });
  });

  it('adds a PostgreSQL index and replaces only the previous automatic key index', () => {
    const result = applyUpsertKeyToTypedTableConfig({
      values: {
        ...values,
        upsert_config: { key_column: 'event_time' },
        table_create_spec: {
          indexes: [
            { name: null, columns: ['event_time'], unique: false },
            {
              name: 'custom_event_idx',
              columns: ['event_time'],
              unique: false,
            },
          ],
        },
      },
      keyColumn: 'client_id',
      connectionMetadata: { dialect: 'postgresql' } as any,
    });

    expect(result.table_create_spec?.indexes).toEqual([
      {
        name: 'custom_event_idx',
        columns: ['event_time'],
        unique: false,
      },
      { name: null, columns: ['client_id'], unique: false },
    ]);
    expect(result.column_mapping?.[0]?.nullable).toBe(false);
  });

  it('only changes nullability for other database dialects', () => {
    const result = applyUpsertKeyToTypedTableConfig({
      values,
      keyColumn: 'client_id',
      connectionMetadata: { dialect: 'mysql' } as any,
    });

    expect(result.table_create_spec).toBeNull();
    expect(result.column_mapping?.[0]?.nullable).toBe(false);
  });
});

describe('shouldShowColumnActionsLoadingOverlay', () => {
  it('does not show the schema changes overlay when no actions were selected', () => {
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: {
          selectedColumnActions: [],
          isApplyingColumnActions: false,
          applyColumnActionsError: null,
          applyColumnActionsSuccess: null,
        },
      } as any)
    ).toBe(false);
  });

  it('keeps the overlay for selected actions and apply states', () => {
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: {
          selectedColumnActions: [
            { type: 'drop_column', column_name: 'obsolete_column' },
          ],
        },
      } as any)
    ).toBe(true);
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: { isApplyingColumnActions: true },
      } as any)
    ).toBe(true);
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: { applyColumnActionsError: 'Backend error' },
      } as any)
    ).toBe(true);
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: { applyColumnActionsSuccess: 'Applied' },
      } as any)
    ).toBe(true);
  });

  it('stops showing a completed transition after its success delay', () => {
    const now = Date.now();

    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: {
          applyColumnActionsSuccess: 'Applied',
          applyColumnActionsSuccessAt: now - 1000,
        },
      } as any)
    ).toBe(true);
    expect(
      shouldShowColumnActionsLoadingOverlay({
        sharedState: {
          applyColumnActionsSuccess: 'Applied',
          applyColumnActionsSuccessAt: now - 2000,
        },
      } as any)
    ).toBe(false);
  });
});

describe('writeDataFrameToDBV4 helpers', () => {
  it('builds recreate columns only from dataframe mapping', () => {
    expect(
      buildDbColumnsFromColumnMapping({
        dataframeMetadata,
        mapping: [
          {
            source_name: 'clientId',
            target_name: 'customer_id',
            dtype: 'BIGINT',
            nullable: true,
          },
          {
            source_name: 'eventTime',
            target_name: 'event_at',
            dtype: 'DATETIME',
            nullable: false,
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        name: 'customer_id',
        dtype: 'BIGINT',
        nullable: true,
      }),
      expect.objectContaining({
        name: 'event_at',
        dtype: 'DATETIME',
        nullable: false,
      }),
    ]);
  });

  it('keeps the create-table success transition visible for two seconds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T09:00:00.000Z'));

    try {
      let resolved = false;
      const transition = waitForCreateTableSuccessTransition(Date.now()).then(
        () => {
          resolved = true;
        }
      );

      await vi.advanceTimersByTimeAsync(1999);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await transition;
      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
  it('confirms truncate before leaving the write-mode step', async () => {
    const requestTruncateConfirm = vi.fn().mockResolvedValue(false);
    const context = {
      inputValues: {
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'orders',
        write_mode: 'truncate',
      },
      sharedState: {
        isTableNew: false,
        requestTruncateConfirm,
      },
    } as any;

    await expect(confirmWriteModeOnContinue(context)).resolves.toBe(false);
    expect(requestTruncateConfirm).toHaveBeenCalledWith(
      'analytics.public.orders'
    );

    context.sharedState.isTableNew = true;
    await expect(confirmWriteModeOnContinue(context)).resolves.toBe(true);
    expect(requestTruncateConfirm).toHaveBeenCalledTimes(1);
  });

  it('preserves selected database and schema when table mode changes', () => {
    const current: WriteDataFrameToDBValues = {
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders_draft',
      write_mode: 'truncate',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    };

    expect(buildWriteTargetAfterTableModeChange(current)).toEqual({
      ...current,
      table_name: null,
    });
  });

  it('preserves a new table name when database changes in create mode', () => {
    const current: WriteDataFrameToDBValues = {
      database_name: null,
      schema_name: 'public',
      table_name: 'orders_draft',
      write_mode: 'truncate',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    };

    expect(
      buildWriteTargetAfterDatabaseChange(current, 'analytics', true)
    ).toMatchObject({
      database_name: 'analytics',
      schema_name: null,
      table_name: 'orders_draft',
    });
  });

  it('does not match a same-name table from another selected database', () => {
    expect(
      findWriteTargetTable(metadata, {
        database_name: 'warehouse',
        schema_name: 'public',
        table_name: 'orders',
      })
    ).toBeNull();
  });

  it('keeps user overrides when rebuilding column mapping from dataframe metadata', () => {
    expect(
      buildColumnMapping({
        dataframeMetadata,
        existingMapping: [
          {
            source_name: 'clientId',
            target_name: 'client_id',
            dtype: 'INT',
            nullable: true,
          },
        ],
      })
    ).toEqual([
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'INT',
        nullable: true,
      },
      {
        source_name: 'eventTime',
        target_name: 'eventTime',
        dtype: 'DATETIME',
        nullable: false,
      },
    ]);
  });

  it('builds typed-create resolver payload from requested mapping draft', () => {
    expect(
      buildResolveWriteColumnsRequest({
        connectionMetadata: metadata,
        dataframeMetadata,
        isTableNew: true,
        creationMode: 'typed',
        inputValues: {
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders_new',
          table_create_spec: {
            primary_key_cols: ['client_id'],
          } as any,
        },
        requestedMapping: [
          {
            source_name: 'clientId',
            target_name: 'Код',
            dtype: 'INT',
            nullable: false,
          },
        ],
      })
    ).toMatchObject({
      mode: 'typed_create',
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders_new',
      column_mapping: [
        {
          source_name: 'clientId',
          target_name: 'Код',
          dtype: 'INT',
          nullable: false,
        },
      ],
      table_create_spec: {
        primary_key_cols: ['client_id'],
      },
    });
  });

  it('builds existing-table resolver payload with policy defaults', () => {
    expect(
      buildResolveWriteColumnsRequest({
        connectionMetadata: metadata,
        dataframeMetadata,
        isTableNew: false,
        creationMode: 'raw',
        inputValues: {
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'orders',
        },
      })
    ).toMatchObject({
      mode: 'existing_table',
      on_extra_df_columns: 'ignore',
      on_missing_df_columns: 'ignore_if_default',
      table_name: 'orders',
    });
  });

  it('does not build resolver payload without connection_id', () => {
    expect(
      buildResolveWriteColumnsRequest({
        connectionMetadata: {
          ...metadata,
          connection_id: undefined,
        } as any,
        dataframeMetadata,
        isTableNew: false,
        creationMode: 'raw',
        inputValues: {
          table_name: 'orders',
        },
      })
    ).toBeNull();
  });

  it('tracks only source and target names in mapping name key', () => {
    const firstMapping = [
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'INT',
        nullable: false,
      },
    ] as const;
    const secondMapping = [
      {
        source_name: 'clientId',
        target_name: 'client_id',
        dtype: 'STRING',
        nullable: true,
      },
    ] as const;

    expect(buildColumnMappingNameKey(firstMapping as any)).toBe(
      buildColumnMappingNameKey(secondMapping as any)
    );
  });

  it('preserves empty draft target name while user clears the input', () => {
    expect(
      buildRequestedColumnMappingDraft({
        dataframeMetadata,
        existingMapping: [
          {
            source_name: 'clientId',
            target_name: 'client_id',
            dtype: 'INT',
            nullable: false,
          },
        ],
        existingDraft: [
          {
            source_name: 'clientId',
            target_name: '',
            dtype: 'INT',
            nullable: false,
          },
        ],
      })
    ).toEqual([
      {
        source_name: 'clientId',
        target_name: '',
        dtype: 'INT',
        nullable: false,
      },
      {
        source_name: 'eventTime',
        target_name: 'eventTime',
        dtype: 'DATETIME',
        nullable: false,
      },
    ]);
  });

  it('returns only rows whose target name actually changed', () => {
    expect(
      getChangedTargetNameSourceNames(
        [
          {
            source_name: 'clientId',
            target_name: 'client_id',
            dtype: 'INT',
            nullable: false,
          },
          {
            source_name: 'eventTime',
            target_name: 'event_time',
            dtype: 'DATETIME',
            nullable: false,
          },
        ],
        [
          {
            source_name: 'clientId',
            target_name: 'client_id_v2',
            dtype: 'INT',
            nullable: false,
          },
          {
            source_name: 'eventTime',
            target_name: 'event_time',
            dtype: 'STRING',
            nullable: true,
          },
        ]
      )
    ).toEqual(['clientId']);
  });

  it('keeps DataFrame source names while exposing effective target names', () => {
    const rows = normalizeResolvedColumnRows({
      dataframeMetadata,
      requestedMapping: buildRequestedColumnMappingDraft({
        dataframeMetadata,
        existingDraft: [
          {
            source_name: 'clientId',
            target_name: 'Код',
            dtype: 'INT',
            nullable: false,
          },
        ],
      }),
      response: {
        effective_column_mapping: [
          {
            source_name: 'clientId',
            target_name: 'kod',
            dtype: 'INT',
            nullable: false,
          },
        ],
        columns: [
          {
            source_name: 'clientId',
            requested_target_name: 'Код',
            effective_target_name: 'kod',
            db_name: 'kod',
            dtype: 'INT',
            nullable: false,
            status: 'normalized_target',
            reason: null,
          },
        ],
        diagnostics: [],
      },
    });

    expect(rows).toEqual([
      {
        source_name: 'clientId',
        requested_target_name: 'Код',
        effective_target_name: 'kod',
        db_name: 'kod',
        dtype: 'INT',
        nullable: false,
        status: 'normalized_target',
        reason: null,
      },
    ]);
  });

  it('blocks duplicate effective targets and optional missing DB columns', () => {
    const duplicateRows = [
      {
        source_name: 'clientId',
        requested_target_name: 'client',
        effective_target_name: 'client_id',
        db_name: 'client_id',
        dtype: 'INT',
        nullable: false,
        status: 'duplicate_effective_target' as const,
        reason: 'Duplicate target.',
      },
    ];
    const missingRows = [
      {
        source_name: 'eventTime',
        requested_target_name: 'eventTime',
        effective_target_name: null,
        db_name: null,
        dtype: 'DATETIME',
        nullable: false,
        status: 'missing_in_db' as const,
        reason: 'Missing target.',
      },
    ];

    expect(
      getColumnResolutionValidationErrors({ rows: duplicateRows })
    ).toEqual(['Duplicate target.']);
    expect(getColumnResolutionValidationErrors({ rows: missingRows })).toEqual(
      []
    );
    expect(
      getColumnResolutionValidationErrors({
        rows: missingRows,
        blockMissingInDb: true,
      })
    ).toEqual(['Missing target.']);
  });

  it('keeps DB-only rows as rows without dataframe source', () => {
    expect(
      normalizeResolvedColumnRows({
        dataframeMetadata,
        response: {
          effective_column_mapping: [],
          columns: [
            {
              source_name: null,
              requested_target_name: null,
              effective_target_name: null,
              db_name: 'created_at',
              dtype: 'DATETIME',
              nullable: false,
              status: 'missing_in_dataframe',
              reason: 'DB-only column.',
            },
          ],
          diagnostics: [],
        },
      })
    ).toEqual([
      {
        source_name: null,
        requested_target_name: null,
        effective_target_name: null,
        db_name: 'created_at',
        dtype: 'DATETIME',
        nullable: false,
        status: 'missing_in_dataframe',
        reason: 'DB-only column.',
      },
    ]);
  });

  it('keeps add and drop actions on their own rows after a rename', () => {
    const column = dataframeMetadata.columns[0];
    const unchangedColumn = dataframeMetadata.columns[1];
    const rows = buildExistingTableColumnDiff({
      dataframeMetadata: {
        ...dataframeMetadata,
        columns: [unchangedColumn, column],
      },
      requestedMapping: [
        {
          source_name: unchangedColumn.name,
          target_name: unchangedColumn.name,
          dtype: 'DATETIME',
          nullable: false,
        },
        {
          source_name: column.name,
          target_name: 'kod_tova',
          dtype: 'INT',
          nullable: false,
        },
      ],
      resolvedColumnRows: [
        {
          source_name: unchangedColumn.name,
          requested_target_name: unchangedColumn.name,
          effective_target_name: unchangedColumn.name,
          db_name: unchangedColumn.name,
          dtype: 'DATETIME',
          nullable: false,
          db_nullable: true,
          status: 'match',
          reason: null,
          suggested_action: null,
        },
        {
          source_name: column.name,
          requested_target_name: 'kod_tova',
          effective_target_name: 'kod_tova',
          db_name: null,
          dtype: 'INT',
          nullable: false,
          status: 'missing_in_db',
          reason: 'Target column is missing.',
          suggested_action: {
            type: 'add_column',
            column_name: 'kod_tova',
            column: {
              name: 'kod_tova',
              dtype: 'INT',
              nullable: false,
            },
          },
        },
        {
          source_name: null,
          requested_target_name: null,
          effective_target_name: null,
          db_name: column.name,
          dtype: 'INT',
          nullable: false,
          status: 'missing_in_dataframe',
          reason: 'Old database column is unused.',
          suggested_action: {
            type: 'drop_column',
            column_name: column.name,
            column: null,
          },
        },
      ],
      resolvedDiagnostics: [],
    });

    expect(rows.map(row => row.status)).toEqual([
      'match',
      'missing_in_db',
      'missing_in_dataframe',
    ]);

    expect(
      rows.find(row => row.dfName === column.name)?.suggestedAction
    ).toMatchObject({
      type: 'add_column',
      column_name: 'kod_tova',
    });
    expect(
      rows.find(row => row.dbName === column.name)?.suggestedAction
    ).toMatchObject({
      type: 'drop_column',
      column_name: column.name,
    });
    expect(
      rows.find(row => row.dfName === unchangedColumn.name)?.dbNullable
    ).toBe(true);
    expect(rows.find(row => row.dfName === column.name)?.dbNullable).toBe(
      false
    );
  });

  it('selects only add-column suggestions by default', () => {
    expect(
      getDefaultSelectedColumnActions([
        {
          suggested_action: {
            type: 'add_column',
            column_name: 'new_column',
            column: {
              name: 'new_column',
              dtype: 'INT',
              nullable: false,
            },
          },
        },
        {
          suggested_action: {
            type: 'drop_column',
            column_name: 'legacy_column',
            column: null,
          },
        },
        {
          suggested_action: {
            type: 'recreate_column',
            column_name: 'changed_column',
            column: {
              name: 'changed_column',
              dtype: 'STRING',
              nullable: true,
            },
          },
        },
        { suggested_action: null },
      ])
    ).toEqual([
      {
        type: 'add_column',
        column_name: 'new_column',
        column: {
          name: 'new_column',
          dtype: 'INT',
          nullable: false,
        },
      },
    ]);
  });

  it('keeps positional order by default and prioritizes unmapped rows on demand', () => {
    const row = (
      name: string,
      status: ExistingTableColumnDiffRow['status']
    ): ExistingTableColumnDiffRow => ({
      dfName: name,
      dfType: 'INT',
      requestedTargetName: name,
      dbName: name,
      dbType: 'INT',
      dbNullable: false,
      status,
      reason: null,
      suggestedAction: null,
    });
    const renamedRow = {
      ...row('kod_tovara', 'missing_in_db'),
      dbName: 'kod_tovar',
    };
    const oldDbRow = {
      ...row('unused', 'missing_in_dataframe'),
      dfName: null,
      dbName: 'kod_tovara',
    };
    const responseRows = [
      renamedRow,
      row('second_mapped', 'explicit_mapping'),
      row('third_mapped', 'match'),
      oldDbRow,
      row('fifth_invalid', 'type_mismatch'),
    ];
    const positionalRows = orderExistingTableRowsPositionally(responseRows);

    expect(positionalRows).toEqual([
      renamedRow,
      oldDbRow,
      responseRows[1],
      responseRows[2],
      responseRows[4],
    ]);

    expect(
      orderExistingTableRowsPositionally([
        oldDbRow,
        responseRows[1],
        renamedRow,
      ])
    ).toEqual([responseRows[1], renamedRow, oldDbRow]);

    expect(
      prioritizeUnmappedExistingTableRows(positionalRows).map(
        item => item.dfName
      )
    ).toEqual([
      'kod_tovara',
      null,
      'fifth_invalid',
      'second_mapped',
      'third_mapped',
    ]);
  });

  it('normalizes table create spec to target columns only', () => {
    expect(
      normalizeTableCreateSpecColumns(
        {
          primary_key_cols: ['client_id', 'legacy_id'],
          indexes: [
            {
              name: 'ix_client',
              columns: ['client_id', 'legacy_id'],
              unique: false,
            },
          ],
          clickhouse: {
            engine_name: 'MergeTree',
            order_by: ['client_id', 'legacy_id'],
            partition_by: null,
            primary_key: ['legacy_id'],
            sample_by: null,
            ttl_expression: null,
            version_column: null,
            sign_column: null,
            summing_columns: null,
            table_path: null,
            replica_name: null,
            settings: null,
          },
        },
        ['client_id']
      )
    ).toEqual({
      primary_key_cols: 'client_id',
      indexes: [
        {
          name: 'ix_client',
          columns: ['client_id'],
          unique: false,
        },
      ],
      foreign_keys: null,
      clickhouse: {
        engine_name: 'MergeTree',
        order_by: ['client_id'],
        partition_by: null,
        primary_key: null,
        sample_by: null,
        ttl_expression: null,
        version_column: null,
        sign_column: null,
        summing_columns: null,
        table_path: null,
        replica_name: null,
        settings: null,
      },
    });
  });

  it('validates typed mode against target names and clickhouse requirements', () => {
    expect(
      getTypedSpecValidationErrors({
        connectionMetadata: {
          connection_id: 'connection-clickhouse',
          dialect: 'clickhouse',
        } as any,
        mapping: [
          {
            source_name: 'clientId',
            target_name: 'client_id',
            dtype: 'INT',
            nullable: false,
          },
        ],
        tableCreateSpec: null,
        upsertKeyColumn: 'missing_key',
        requireUpsertKey: true,
      })
    ).toEqual([
      'Upsert key column "missing_key" должен ссылаться на target_name из column_mapping.',
      'Для ClickHouse в Typed Table spec нужно заполнить Order by или Primary key.',
    ]);
  });

  it('limits changed mapping preview to the first five items', () => {
    const changedMappingItems = Array.from({ length: 6 }, (_, index) => ({
      source_name: `source_${index + 1}`,
      target_name: `target_${index + 1}`,
      dtype: index % 2 === 0 ? 'INT' : 'STRING',
      nullable: index % 2 === 0,
    }));

    const mappingChangeStateBySource = new Map(
      changedMappingItems.map(item => [
        item.source_name.toLowerCase(),
        {
          dtypeChanged: true,
          nullableChanged: true,
          targetNameChanged: false,
        },
      ])
    );

    expect(
      buildChangedMappingPreviewItems(
        changedMappingItems,
        mappingChangeStateBySource
      )
    ).toEqual(
      changedMappingItems.slice(0, 5).map(item => ({
        item,
        state: {
          dtypeChanged: true,
          nullableChanged: true,
          targetNameChanged: false,
        },
        tokens: [String(item.dtype), item.nullable ? 'NULL' : 'NOT NULL'],
      }))
    );
  });

  it('validates target step independently from write mode', () => {
    expect(
      isTargetStepValid(
        {
          database_name: 'analytics',
          table_name: 'orders',
          schema_name: 'public',
        },
        {
          inputConnectionMetadata: metadata,
          isTableNew: false,
        }
      )
    ).toBe(true);
  });

  it('requires write mode and upsert key on dedicated write mode step', () => {
    expect(
      isWriteModeStepValid(
        {
          database_name: 'analytics',
          table_name: 'orders',
          schema_name: 'public',
        },
        {
          inputConnectionMetadata: metadata,
          isTableNew: false,
        }
      )
    ).toBe(false);

    expect(
      isWriteModeStepValid(
        {
          database_name: 'analytics',
          table_name: 'orders',
          schema_name: 'public',
          write_mode: 'append',
        },
        {
          inputConnectionMetadata: metadata,
          isTableNew: false,
        }
      )
    ).toBe(true);

    expect(
      isWriteModeStepValid(
        {
          table_name: 'events_new',
          schema_name: 'public',
          write_mode: 'upsert',
          upsert_config: { key_column: 'client_id' },
          column_mapping: [
            {
              source_name: 'clientId',
              target_name: 'client_id',
              dtype: 'INT',
              nullable: false,
            },
            {
              source_name: 'eventTime',
              target_name: 'event_time',
              dtype: 'DATETIME',
              nullable: false,
            },
          ],
          table_create_spec: {
            clickhouse: {
              engine_name: 'MergeTree',
              order_by: ['client_id'],
              partition_by: null,
              primary_key: null,
              sample_by: null,
              ttl_expression: null,
              version_column: null,
              sign_column: null,
              summing_columns: null,
              table_path: null,
              replica_name: null,
              settings: null,
            },
          },
        },
        {
          inputConnectionMetadata: {
            connection_id: 'connection-clickhouse',
            dialect: 'clickhouse',
          } as any,
          inputDataframeMetadata: dataframeMetadata,
          isTableNew: true,
          selectedCreationMode: 'typed',
        }
      )
    ).toBe(true);

    expect(
      isWriteModeStepValid(
        {
          table_name: 'events_new',
          schema_name: 'public',
          write_mode: 'upsert',
          upsert_config: { key_column: 'client_id' },
          column_mapping: [
            {
              source_name: 'clientId',
              target_name: 'client_id',
              dtype: 'INT',
              nullable: false,
            },
          ],
          table_create_spec: null,
        },
        {
          inputConnectionMetadata: {
            connection_id: 'connection-clickhouse',
            dialect: 'clickhouse',
          } as any,
          inputDataframeMetadata: dataframeMetadata,
          isTableNew: true,
          selectedCreationMode: 'typed',
        }
      )
    ).toBe(true);
  });

  it('accepts typed schema step when mapping is valid without clickhouse core fields', () => {
    expect(
      isSchemaStrategyStepValid(
        {
          table_name: 'events',
          schema_name: 'public',
          column_mapping: [
            {
              source_name: 'clientId',
              target_name: 'client_id',
              dtype: 'INT',
              nullable: false,
            },
            {
              source_name: 'eventTime',
              target_name: 'event_time',
              dtype: 'DATETIME',
              nullable: false,
            },
          ],
          table_create_spec: null,
        },
        {
          inputConnectionMetadata: {
            connection_id: 'connection-clickhouse',
            dialect: 'clickhouse',
          } as any,
          inputDataframeMetadata: dataframeMetadata,
          isTableNew: true,
          selectedCreationMode: 'typed',
        }
      )
    ).toBe(true);
  });

  it('blocks the schema step while column names are dirty or resolving', () => {
    expect(
      isSchemaStrategyStepValid(
        {},
        {
          isTableNew: false,
          columnResolveStates: { clientId: 'dirty' },
        }
      )
    ).toBe(false);
    expect(
      isSchemaStrategyStepValid(
        {},
        {
          isTableNew: false,
          columnResolveStates: { clientId: 'loading' },
        }
      )
    ).toBe(false);
    expect(
      isSchemaStrategyStepValid(
        {},
        {
          isTableNew: false,
          columnResolveStates: { clientId: 'flash' },
        }
      )
    ).toBe(true);
  });
});
