import { normalizeName, type WriteDataFrameToDBValues } from './helpers';

/** Роль колонки в схеме новой таблицы (PK, ORDER BY, PARTITION BY…). */
export type ColumnSchemaRole = {
  key: string;
  label: string;
  /** Полное название роли для подсказки. */
  title: string;
};

export const EMPTY_SCHEMA_ROLES: ColumnSchemaRole[] = [];

const toNormalizedRoleColumnList = (
  value: string | string[] | null | undefined
): string[] => {
  if (Array.isArray(value)) {
    return value.map(columnName => columnName.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  return [];
};

export const buildSchemaRolesByTarget = (
  tableCreateSpec: WriteDataFrameToDBValues['table_create_spec']
): Map<string, ColumnSchemaRole[]> => {
  const rolesByTarget = new Map<string, ColumnSchemaRole[]>();
  const addRole = (
    columnName: string | null | undefined,
    role: ColumnSchemaRole
  ) => {
    const normalizedColumnName = normalizeName(columnName);
    if (!normalizedColumnName) {
      return;
    }

    const currentRoles = rolesByTarget.get(normalizedColumnName) ?? [];
    if (currentRoles.some(currentRole => currentRole.key === role.key)) {
      return;
    }

    rolesByTarget.set(normalizedColumnName, [...currentRoles, role]);
  };

  const primaryKeyColumns = toNormalizedRoleColumnList(
    tableCreateSpec?.primary_key_cols
  );
  primaryKeyColumns.forEach((columnName, index) => {
    addRole(columnName, {
      key: `pk:${index}`,
      label: primaryKeyColumns.length > 1 ? `PK ${index + 1}` : 'PK',
      title: 'Primary key',
    });
  });

  const clickhouseSpec = tableCreateSpec?.clickhouse;
  toNormalizedRoleColumnList(clickhouseSpec?.order_by).forEach(
    (columnName, index) => {
      addRole(columnName, {
        key: `ord:${index}`,
        label: `ORD ${index + 1}`,
        title: 'Order by',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.partition_by).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `part:${index}`,
        label: allColumns.length > 1 ? `PART ${index + 1}` : 'PART',
        title: 'Partition by',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.primary_key).forEach(
    (columnName, index) => {
      addRole(columnName, {
        key: `ch-pk:${index}`,
        label: primaryKeyColumns.length > 0 ? `CH PK ${index + 1}` : 'PK',
        title: 'Primary key (ClickHouse)',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.summing_columns).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `sum:${index}`,
        label: allColumns.length > 1 ? `SUM ${index + 1}` : 'SUM',
        title: 'Summing columns',
      });
    }
  );
  toNormalizedRoleColumnList(clickhouseSpec?.sample_by).forEach(
    (columnName, index, allColumns) => {
      addRole(columnName, {
        key: `sample:${index}`,
        label: allColumns.length > 1 ? `SAMPLE ${index + 1}` : 'SAMPLE',
        title: 'Sample by',
      });
    }
  );
  addRole(clickhouseSpec?.version_column, {
    key: 'version',
    label: 'VER',
    title: 'Version column',
  });
  addRole(clickhouseSpec?.sign_column, {
    key: 'sign',
    label: 'SIGN',
    title: 'Sign column',
  });

  return rolesByTarget;
};
