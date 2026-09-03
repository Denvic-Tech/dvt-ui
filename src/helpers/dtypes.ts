export function normalizeType(t: string | null | undefined): string | null {
  if (!t) return null;
  const u = t.trim().toUpperCase();
  const map: Record<string, string> = {
    STRING: 'STRING',
    TEXT: 'STRING',
    VARCHAR: 'STRING',
    CHAR: 'STRING',
    UUID: 'STRING',

    INT: 'INT',
    INTEGER: 'INT',
    BIGINT: 'INT',
    SMALLINT: 'INT',

    FLOAT: 'FLOAT',
    DOUBLE: 'FLOAT',
    REAL: 'FLOAT',
    DECIMAL: 'FLOAT',
    NUMERIC: 'FLOAT',

    BOOLEAN: 'BOOLEAN',
    BOOL: 'BOOLEAN',

    DATETIME: 'DATETIME',
    TIMESTAMP: 'DATETIME',

    DATE: 'DATE',
    TIME: 'TIME',
  };
  return map[u] ?? u;
}

// Разрешённые мягкие преобразования (DF -> DB)
const SAFE_CASTS = new Set<string>([
  'INT->FLOAT',
  'INT->STRING',
  'FLOAT->STRING',
  'BOOLEAN->INT',
  'BOOLEAN->STRING',
  'INT->BOOLEAN', // зависит от СУБД (0/1)
  'DATE->DATETIME',
  'DATE->STRING',
  'DATETIME->STRING',
  'TIME->STRING',
]);

export function isSafeCast(
  fromType: string | null,
  toType: string | null
): boolean {
  if (!fromType || !toType) return false;
  return SAFE_CASTS.has(`${fromType}->${toType}`);
}
