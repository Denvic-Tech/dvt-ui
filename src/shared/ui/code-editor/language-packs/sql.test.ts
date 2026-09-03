import { describe, expect, it } from 'vitest';

import { createSqlCompletionProvider, type SqlCompletionCatalog } from './sql';

const catalog: SqlCompletionCatalog = {
  tables: [
    {
      name: 'public.users',
      columns: [
        { name: 'id', tableName: 'public.users', type: 'int' },
        { name: 'email', tableName: 'public.users', type: 'string' },
      ],
    },
    {
      name: 'public.orders',
      columns: [{ name: 'amount', tableName: 'public.orders', type: 'float' }],
    },
  ],
};

const getPosition = (value: string, offset = value.length) => {
  const lines = value.slice(0, offset).split('\n');

  return {
    lineNumber: lines.length,
    column: lines[lines.length - 1]!.length + 1,
  } as any;
};

const createModel = (value: string) =>
  ({
    getValue: () => value,
    getValueInRange: (range: { endColumn: number; endLineNumber: number }) => {
      const lines = value.split('\n');
      return lines
        .slice(0, range.endLineNumber)
        .map((line, index) =>
          index === range.endLineNumber - 1
            ? line.slice(0, range.endColumn - 1)
            : line
        )
        .join('\n');
    },
  }) as any;

const createParams = (value: string, offset = value.length) => {
  const position = getPosition(value, offset);

  return {
    context: undefined,
    editor: {} as any,
    model: createModel(value),
    monaco: {
      languages: {
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 4,
        },
      },
    } as any,
    position,
    wordRange: {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column,
      endColumn: position.column,
    },
  };
};

describe('createSqlCompletionProvider', () => {
  const provider = createSqlCompletionProvider(() => catalog);

  it('suggests tables after FROM', () => {
    const sections = provider.getSections(createParams('SELECT *\nFROM '));

    expect(sections[0]?.id).toBe('sql-tables');
    expect(sections[0]?.items.map(item => item.label)).toEqual([
      'public.users',
      'public.orders',
    ]);
  });

  it('suggests columns after SELECT', () => {
    const sections = provider.getSections(createParams('SELECT '));

    expect(sections[0]?.id).toBe('sql-columns');
    expect(sections[0]?.items.map(item => item.label)).toEqual([
      'id',
      'email',
      'amount',
    ]);
  });

  it('suggests scoped columns after table alias', () => {
    const sections = provider.getSections(
      createParams('SELECT u.\nFROM public.users u', 'SELECT u.'.length)
    );

    expect(sections[0]?.id).toBe('sql-columns');
    expect(sections[0]?.items.map(item => item.label)).toEqual(['id', 'email']);
  });
});
