export type SqlTokenKind =
  | 'keyword'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'punctuation'
  | 'identifier'
  | 'plain';

export type SqlToken = { text: string; kind: SqlTokenKind };

const KEYWORDS = new Set([
  'ADD',
  'ALTER',
  'AND',
  'AS',
  'ASC',
  'BY',
  'CHECK',
  'CODEC',
  'COLUMN',
  'COMMENT',
  'CONSTRAINT',
  'CREATE',
  'DAY',
  'DEFAULT',
  'DESC',
  'ENGINE',
  'EXISTS',
  'FOREIGN',
  'FROM',
  'GRANULARITY',
  'HOUR',
  'IF',
  'INDEX',
  'INSERT',
  'INTERVAL',
  'INTO',
  'KEY',
  'MATERIALIZED',
  'MONTH',
  'NOT',
  'NULL',
  'ON',
  'OR',
  'ORDER',
  'PARTITION',
  'PRIMARY',
  'REFERENCES',
  'SAMPLE',
  'SCHEMA',
  'SELECT',
  'SETTINGS',
  'TABLE',
  'TO',
  'TTL',
  'TYPE',
  'UNIQUE',
  'USING',
  'VALUES',
  'WEEK',
  'WHERE',
  'WITH',
  'YEAR',
]);

/** Типы ClickHouse (регистр важен) и PostgreSQL (в верхнем регистре). */
const TYPES = new Set([
  'Array',
  'BIGINT',
  'BIGSERIAL',
  'BOOLEAN',
  'BYTEA',
  'Bool',
  'CHAR',
  'DATE',
  'DECIMAL',
  'DOUBLE',
  'Date',
  'Date32',
  'DateTime',
  'DateTime64',
  'Decimal',
  'Enum16',
  'Enum8',
  'FixedString',
  'Float32',
  'Float64',
  'INT',
  'INTEGER',
  'IPv4',
  'IPv6',
  'Int128',
  'Int16',
  'Int256',
  'Int32',
  'Int64',
  'Int8',
  'JSON',
  'JSONB',
  'LowCardinality',
  'Map',
  'NUMERIC',
  'Nullable',
  'PRECISION',
  'REAL',
  'SERIAL',
  'SMALLINT',
  'String',
  'TEXT',
  'TIME',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'Tuple',
  'UInt128',
  'UInt16',
  'UInt256',
  'UInt32',
  'UInt64',
  'UInt8',
  'UUID',
  'VARCHAR',
]);

const TOKEN_PATTERN =
  /(--[^\n]*)|('(?:[^'\\]|\\.|'')*'?)|("(?:[^"]|"")*"?|`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([(),;.=[\]{}*+-])|(\s+)|(.)/g;

const classifyWord = (word: string): SqlTokenKind => {
  if (word === word.toUpperCase() && KEYWORDS.has(word)) return 'keyword';
  if (TYPES.has(word) || word.endsWith('MergeTree')) return 'type';
  return 'identifier';
};

const tokenizeLine = (line: string): SqlToken[] => {
  const tokens: SqlToken[] = [];
  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const [text, comment, string, quoted, number, word, punctuation] = match;
    const kind: SqlTokenKind = comment
      ? 'comment'
      : string
        ? 'string'
        : quoted
          ? 'identifier'
          : number
            ? 'number'
            : word
              ? classifyWord(word)
              : punctuation
                ? 'punctuation'
                : 'plain';
    const previous = tokens[tokens.length - 1];
    if (previous && previous.kind === kind && kind === 'plain') {
      previous.text += text;
    } else {
      tokens.push({ text, kind });
    }
  }
  return tokens;
};

/** Разбивает SQL на строки токенов для простой подсветки в `<pre>`. */
export const highlightSql = (sql: string): SqlToken[][] =>
  sql.replace(/\r\n/g, '\n').split('\n').map(tokenizeLine);
