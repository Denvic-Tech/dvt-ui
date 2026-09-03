import type { TaskExecutionStatus } from '@/shared/gatewayClient';

export const getRunTone = (
  status: TaskExecutionStatus | null | undefined
): { backgroundColor: string; label: string } => {
  switch (status) {
    case 'SUCCESS':
      return {
        backgroundColor: '#16a34a',
        label: 'Последний запуск завершён успешно',
      };
    case 'ERROR':
      return {
        backgroundColor: '#dc2626',
        label: 'Последний запуск завершился ошибкой',
      };
    case 'RUNNING':
    case 'STARTED':
      return {
        backgroundColor: '#4f46e5',
        label: 'Проект сейчас выполняется',
      };
    case 'QUEUED':
    case 'ASSIGNED':
    case 'PENDING':
      return {
        backgroundColor: '#2563eb',
        label: 'Проект ожидает запуска',
      };
    case 'CANCELLED':
    case 'CANCEL_REQUESTED':
      return {
        backgroundColor: '#ea580c',
        label: 'Последний запуск был отменён',
      };
    default:
      return {
        backgroundColor: '#94a3b8',
        label: 'Нет данных о последних запусках',
      };
  }
};
