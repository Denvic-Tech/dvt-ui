/**
 * Подписи поиска внутри узлов дерева каталога. Словаря UI-переводов во
 * фронтенде пока нет (`src/app/i18n` только выбирает язык для бэкенда),
 * поэтому ключи собраны в одном месте, чтобы перенести их в словарь целиком.
 */
export const CATALOG_TREE_TEXT = {
  searchSchemas: 'Поиск схем',
  searchTables: 'Поиск таблиц',
  nothingFound: 'Ничего не найдено',
  countOf: 'из',
  clearSearch: 'Очистить',
} as const;

export type CatalogExpressionField =
  | 'database_name'
  | 'schema_name'
  | 'table_name';

/**
 * Placeholder-ы полей блока «Выражения»: пример формата — строка в кавычках
 * или переменная после «=»; для обычного значения — просто имя. Короткие,
 * чтобы влезать в узкую левую панель (~22 символа моноширинного шрифта).
 */
export const CATALOG_EXPRESSION_PLACEHOLDERS: Record<
  CatalogExpressionField,
  { literal: string; expression: string }
> = {
  database_name: { literal: 'dwh', expression: '="dwh" или =db_name' },
  schema_name: { literal: 'public', expression: '="public" или =schema' },
  table_name: { literal: 'orders', expression: '="orders" или =table' },
};
