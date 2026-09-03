import type {
  DbDatabase,
  DbDialect,
  DbMetadata,
  DbSchema,
  DbTable,
} from '@/shared/gatewayClient';

import type { DbMetadataTableSelector } from './types';

export type DbMetadataOption = {
  label: string;
  tableCount: number;
  value: string;
};

const normalizeName = (value: string | null | undefined): string => {
  return (value ?? '').trim().toLowerCase();
};

const pushNormalizedTable = (
  tableMap: Map<string, DbTable>,
  table: DbTable,
  parent: {
    databaseName?: string | null | undefined;
    schemaName?: string | null | undefined;
  } = {}
) => {
  const normalizedTable: DbTable = {
    ...table,
    database_name: table.database_name ?? parent.databaseName ?? null,
    schema_name: table.schema_name ?? parent.schemaName ?? null,
  };
  const key =
    normalizedTable.id ??
    [
      normalizeName(normalizedTable.database_name),
      normalizeName(normalizedTable.schema_name),
      normalizeName(normalizedTable.name),
      normalizedTable.type ?? '',
    ].join('::');
  const existing = tableMap.get(key);

  if (!existing) {
    tableMap.set(key, normalizedTable);
    return;
  }

  const existingColumnsCount = existing.columns?.length ?? 0;
  const nextColumnsCount = normalizedTable.columns?.length ?? 0;

  if (nextColumnsCount > existingColumnsCount) {
    tableMap.set(key, normalizedTable);
  }
};

const collectSchemaTables = (
  tableMap: Map<string, DbTable>,
  schema: DbSchema,
  parent: {
    databaseName?: string | null | undefined;
  } = {}
) => {
  for (const table of schema.tables ?? []) {
    pushNormalizedTable(tableMap, table, {
      databaseName: schema.database_name ?? parent.databaseName ?? null,
      schemaName: schema.name,
    });
  }
};

const collectDatabaseTables = (
  tableMap: Map<string, DbTable>,
  database: DbDatabase
) => {
  for (const schema of database.schemas ?? []) {
    collectSchemaTables(tableMap, schema, {
      databaseName: database.name,
    });
  }

  for (const table of database.tables ?? []) {
    pushNormalizedTable(tableMap, table, {
      databaseName: database.name,
    });
  }
};

export const resolveDbMetadataDialectKind = (
  metadata: DbMetadata | null | undefined
): DbDialect => {
  return metadata?.dialect || 'unknown';
};

export const flattenDbMetadataTables = (
  metadata: DbMetadata | null | undefined
): DbTable[] => {
  if (!metadata) {
    return [];
  }

  const tableMap = new Map<string, DbTable>();

  for (const database of metadata.databases ?? []) {
    collectDatabaseTables(tableMap, database);
  }

  for (const schema of metadata.schemas ?? []) {
    collectSchemaTables(tableMap, schema);
  }

  for (const table of metadata.tables ?? []) {
    pushNormalizedTable(tableMap, table);
  }

  return Array.from(tableMap.values());
};

export const getDbMetadataDatabaseOptions = (
  metadata: DbMetadata | null | undefined
): DbMetadataOption[] => {
  const tableCountByDatabase = new Map<string, number>();

  for (const database of metadata?.databases ?? []) {
    tableCountByDatabase.set(database.name, 0);
  }

  for (const table of flattenDbMetadataTables(metadata)) {
    const databaseName = table.database_name?.trim();
    if (!databaseName) {
      continue;
    }

    tableCountByDatabase.set(
      databaseName,
      (tableCountByDatabase.get(databaseName) ?? 0) + 1
    );
  }

  return Array.from(tableCountByDatabase.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, tableCount]) => ({
      value,
      label: value,
      tableCount,
    }));
};

export const getDbMetadataSchemaOptions = (
  metadata: DbMetadata | null | undefined,
  databaseName?: string | null | undefined
): DbMetadataOption[] => {
  const tableCountBySchema = new Map<string, number>();
  const normalizedDatabaseName = normalizeName(databaseName);

  for (const schema of metadata?.schemas ?? []) {
    if (
      normalizedDatabaseName &&
      normalizeName(schema.database_name) !== normalizedDatabaseName
    ) {
      continue;
    }

    tableCountBySchema.set(
      schema.name,
      tableCountBySchema.get(schema.name) ?? 0
    );
  }

  for (const database of metadata?.databases ?? []) {
    if (
      normalizedDatabaseName &&
      normalizeName(database.name) !== normalizedDatabaseName
    ) {
      continue;
    }

    for (const schema of database.schemas ?? []) {
      tableCountBySchema.set(
        schema.name,
        tableCountBySchema.get(schema.name) ?? 0
      );
    }
  }

  for (const table of flattenDbMetadataTables(metadata)) {
    if (
      normalizedDatabaseName &&
      normalizeName(table.database_name) !== normalizedDatabaseName
    ) {
      continue;
    }

    const schemaName = table.schema_name?.trim();
    if (!schemaName) {
      continue;
    }

    tableCountBySchema.set(
      schemaName,
      (tableCountBySchema.get(schemaName) ?? 0) + 1
    );
  }

  return Array.from(tableCountBySchema.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, tableCount]) => ({
      value,
      label: value,
      tableCount,
    }));
};

export const getDbMetadataFilteredTables = (
  metadata: DbMetadata | null | undefined,
  selectors: {
    databaseName?: string | null | undefined;
    schemaName?: string | null | undefined;
  } = {}
): DbTable[] => {
  const normalizedDatabaseName = normalizeName(selectors.databaseName);
  const normalizedSchemaName = normalizeName(selectors.schemaName);

  return flattenDbMetadataTables(metadata).filter(table => {
    if (
      normalizedDatabaseName &&
      normalizeName(table.database_name) !== normalizedDatabaseName
    ) {
      return false;
    }

    if (
      normalizedSchemaName &&
      normalizeName(table.schema_name) !== normalizedSchemaName
    ) {
      return false;
    }

    return true;
  });
};

export const findDbMetadataTable = (
  metadata: DbMetadata | null | undefined,
  selector: DbMetadataTableSelector
): DbTable | null => {
  const normalizedTableName = normalizeName(selector.tableName);
  if (!normalizedTableName) {
    return null;
  }

  const normalizedDatabaseName = normalizeName(selector.databaseName);
  const normalizedSchemaName = normalizeName(selector.schemaName);
  const tables = flattenDbMetadataTables(metadata);

  const exact = tables.find(table => {
    return (
      normalizeName(table.name) === normalizedTableName &&
      (!normalizedDatabaseName ||
        normalizeName(table.database_name) === normalizedDatabaseName) &&
      (!normalizedSchemaName ||
        normalizeName(table.schema_name) === normalizedSchemaName)
    );
  });

  if (exact) {
    return exact;
  }

  if (normalizedDatabaseName || normalizedSchemaName) {
    return null;
  }

  return (
    tables.find(table => {
      return normalizeName(table.name) === normalizedTableName;
    }) ?? null
  );
};

/**
 * Возвращает новый `DbMetadata`, в котором целевая таблица (заданная тем же
 * `selector`, что использует `findDbMetadataTable` — по имени + при наличии
 * database/schema) заменена на `table` во всех местах вложенности.
 *
 * Матчинг делается по `selector` (значениям из inputData), а не по собственным
 * `database_name`/`schema_name` объекта `table`, потому что в свежих
 * метаданных с бэкенда они могут быть `null`, тогда как во вложенной структуре
 * db/schema наследуются от родителя.
 *
 * Замена делается «на месте» (не добавлением), т.к. `flattenDbMetadataTables`
 * при коллизии ключа оставляет вариант с бóльшим числом колонок — после
 * drop_column иначе осталась бы старая версия. Если совпадений не найдено,
 * таблица добавляется в верхнеуровневой `tables`.
 */
export const upsertDbMetadataTable = (
  metadata: DbMetadata,
  table: DbTable,
  selector: DbMetadataTableSelector
): DbMetadata => {
  const targetName = normalizeName(selector.tableName);
  const targetDatabase = normalizeName(selector.databaseName);
  const targetSchema = normalizeName(selector.schemaName);

  if (!targetName) {
    return metadata;
  }

  let replaced = false;

  const matches = (
    candidate: DbTable,
    parentDatabase?: string | null,
    parentSchema?: string | null
  ): boolean => {
    if (normalizeName(candidate.name) !== targetName) {
      return false;
    }

    const effectiveDatabase = normalizeName(
      candidate.database_name ?? parentDatabase ?? null
    );
    const effectiveSchema = normalizeName(
      candidate.schema_name ?? parentSchema ?? null
    );

    return (
      (!targetDatabase || effectiveDatabase === targetDatabase) &&
      (!targetSchema || effectiveSchema === targetSchema)
    );
  };

  const replaceInTables = (
    tables: DbTable[] | undefined,
    parentDatabase?: string | null,
    parentSchema?: string | null
  ): DbTable[] | undefined => {
    if (!tables) {
      return tables;
    }

    let changed = false;
    const next = tables.map(candidate => {
      if (matches(candidate, parentDatabase, parentSchema)) {
        changed = true;
        replaced = true;
        return table;
      }
      return candidate;
    });

    return changed ? next : tables;
  };

  const mapSchema = (
    schema: DbSchema,
    parentDatabase?: string | null
  ): DbSchema => {
    const nextTables = replaceInTables(
      schema.tables,
      schema.database_name ?? parentDatabase,
      schema.name
    );
    if (nextTables === schema.tables) {
      return schema;
    }
    // changed ⇒ nextTables определён.
    return { ...schema, tables: nextTables as DbTable[] };
  };

  const mapDatabase = (database: DbDatabase): DbDatabase => {
    let nextDatabase = database;

    if (database.schemas) {
      const nextSchemas = database.schemas.map(schema =>
        mapSchema(schema, database.name)
      );
      if (
        nextSchemas.some(
          (schema, index) => schema !== database.schemas?.[index]
        )
      ) {
        nextDatabase = { ...nextDatabase, schemas: nextSchemas };
      }
    }

    if (database.tables) {
      const nextTables = replaceInTables(database.tables, database.name);
      if (nextTables !== database.tables) {
        nextDatabase = { ...nextDatabase, tables: nextTables as DbTable[] };
      }
    }

    return nextDatabase;
  };

  // Прогоняем замену по всем веткам (side effect — выставляет `replaced`).
  const nextDatabases = metadata.databases?.map(mapDatabase);
  const nextSchemas = metadata.schemas?.map(schema =>
    mapSchema(schema, schema.database_name)
  );
  const nextTopLevelTables = metadata.tables
    ? replaceInTables(metadata.tables)
    : undefined;

  if (!replaced) {
    return {
      ...metadata,
      tables: [...(metadata.tables ?? []), table],
    };
  }

  const result: DbMetadata = { ...metadata };
  if (nextDatabases) {
    result.databases = nextDatabases;
  }
  if (nextSchemas) {
    result.schemas = nextSchemas;
  }
  if (nextTopLevelTables) {
    result.tables = nextTopLevelTables;
  }
  return result;
};

export const buildDbMetadataTableLabel = (
  table:
    | Pick<DbTable, 'database_name' | 'name' | 'schema_name'>
    | null
    | undefined
): string => {
  if (!table) {
    return '';
  }

  return [table.database_name, table.schema_name, table.name]
    .filter(value => typeof value === 'string' && value.trim().length > 0)
    .join('.');
};

export const getDbMetadataSqlReference = (table: DbTable): string => {
  if (table.schema_name?.trim()) {
    return `${table.schema_name}.${table.name}`;
  }

  if (table.database_name?.trim()) {
    return `${table.database_name}.${table.name}`;
  }

  return table.name;
};

export * from './constants';
export * from './helpers';
export type * from './types';
