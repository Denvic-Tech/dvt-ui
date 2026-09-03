import { useEffect } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useAlert } from '@/app/notifications';
import { useAppDispatch } from '@/app/providers/store';

import type { AIAnalysisRequest } from '../api/aiAnalysisApi';

import { AI_ANALYSIS_COMPLETED_EVENT } from './events';
import { openAIAnalysisResultModal } from './slice';

export const useAIAnalysisCompletionAlert = (
  projectId: string | null | undefined
) => {
  const dispatch = useAppDispatch();
  const { showNotification } = useAlert();

  useEffect(() => {
    if (!projectId) {
      return undefined;
    }

    const handler = (event: Event) => {
      const item = (event as CustomEvent<AIAnalysisRequest>).detail;

      if (item.project_id !== projectId) {
        return;
      }

      if (item.status === 'success') {
        const findingsCount = item.result?.content?.findings?.length ?? 0;
        const recommendationsCount =
          item.result?.content?.recommendations?.length ?? 0;

        showNotification({
          type: 'success',
          title: 'AI-анализ готов',
          description: `Найдено ${findingsCount} проблем · ${recommendationsCount} рекомендаций`,
          autoCloseDuration: null,
          icon: <AutoAwesomeIcon sx={{ fontSize: 16 }} />,
          actions: [
            {
              id: 'open',
              label: 'Открыть отчёт',
              variant: 'primary',
              icon: <ChevronRightIcon sx={{ fontSize: 14 }} />,
              onClick: () => {
                dispatch(openAIAnalysisResultModal(item.request_id));
              },
              closeOnClick: true,
            },
          ],
        });
      }

      if (item.status === 'error') {
        showNotification({
          type: 'error',
          title: 'AI-анализ не выполнен',
          description: item.error ?? 'Произошла неизвестная ошибка',
          autoCloseDuration: 8000,
        });
      }
    };

    window.addEventListener(AI_ANALYSIS_COMPLETED_EVENT, handler);

    return () => {
      window.removeEventListener(AI_ANALYSIS_COMPLETED_EVENT, handler);
    };
  }, [dispatch, projectId, showNotification]);
};
