/**
 * Подписи экрана результата применения (создание таблицы, изменения схемы).
 * Словаря UI-переводов во фронтенде пока нет (`src/app/i18n` только выбирает
 * язык для бэкенда), поэтому ключи собраны в одном месте, чтобы перенести их
 * в словарь целиком.
 */
export const APPLY_RESULT_TEXT = {
  checkSettings: 'Проверьте настройки',
  tryAgain: 'и попробуйте снова',
  copy: 'Копировать',
  copied: 'Скопировано',
  goingToNextStep: 'Переходим к следующему шагу…',
  savingSettings: 'Сохраняем настройки…',
  loadingHint: 'Это может занять некоторое время',
  createTableFailed: 'Таблица не создана',
  createTableDone: 'Таблица создана',
  createTableLoading: 'Создаём таблицу',
  columnActionsFailed: 'Изменения схемы не применены',
  columnActionsDone: 'Изменения схемы применены',
  columnActionsLoading: 'Применяем изменения схемы',
} as const;
