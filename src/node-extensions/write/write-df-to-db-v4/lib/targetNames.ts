/** Имя новой базы, схемы или таблицы: латиница, цифры и «_», не с цифры. */
const CATALOG_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const CATALOG_NAME_FORMAT_ERROR =
  'Только латиница, цифры и «_», первый символ — не цифра';

/**
 * Ошибка в имени нового объекта каталога или пустая строка. Пустое имя
 * ошибкой не считается — кнопка создания просто недоступна.
 * `location` — где проверяется уникальность («db / schema»), для текста.
 */
export const getCatalogNameError = (
  value: string,
  takenNames: readonly string[],
  location = ''
): string => {
  const name = value.trim();
  if (!name) return '';
  if (!CATALOG_NAME_PATTERN.test(name)) return CATALOG_NAME_FORMAT_ERROR;
  const lowered = name.toLowerCase();
  if (takenNames.some(taken => taken.toLowerCase() === lowered)) {
    return `«${name}» уже есть${location ? ` в ${location}` : ''}`;
  }
  return '';
};

export const formatCatalogLocation = (
  ...parts: Array<string | null | undefined>
): string => parts.filter(Boolean).join(' / ');
