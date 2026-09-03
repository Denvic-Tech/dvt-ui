import type { AIAnalysisRequest } from '@/entities/ai-analysis';

export const AI_RUNNING_PHRASES = [
  'AI анализирует ошибку',
  'Смотрим что пошло не так',
  'Разбираемся с логами',
  'Изучаем контекст графа',
  'Сравниваем с прошлыми запусками',
  'Ищем причину сбоя',
  'Формулируем рекомендации',
  'Почти готово',
];

const getShortRequestId = (requestId: string) => requestId.slice(0, 8);

export const getAnalysisTitle = (item: AIAnalysisRequest): string => {
  const title = item.title?.trim();

  return title && title.length > 0
    ? title
    : `Анализ ${getShortRequestId(item.request_id)}`;
};

/**
 * Возвращает имя ноды если есть, иначе null.
 */
export const getAnalysisNode = (item: AIAnalysisRequest): string | null =>
  item.result?.context?.target_nodes?.[0] ?? null;

export const formatAnalysisRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diff < 60) {
    return 'только что';
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} мин назад`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} ч назад`;
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
