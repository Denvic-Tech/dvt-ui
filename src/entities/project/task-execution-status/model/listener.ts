import { createListenerMiddleware } from '@reduxjs/toolkit';

import { wsMessageActions } from '@/shared/wsMessageActions';
import { type RootState } from '@/app/providers/store';
import { addAlert } from '@/app/notifications';

export const taskExecutionStatusListener =
  createListenerMiddleware<RootState>();

taskExecutionStatusListener.startListening({
  actionCreator: wsMessageActions.TASK_EXECUTION_STATUS,
  effect: ({ payload }, api) => {
    if (payload.mode !== 'full' || payload.status !== 'ERROR') {
      return;
    }

    const message = payload.error?.message?.trim();
    const description = message ? message : 'Задача завершилась с ошибкой';

    api.dispatch(
      addAlert({
        type: 'error',
        title: 'Ошибка выполнения задачи',
        description,
        detail: `Task ID: ${payload.task_id}`,
        group: `task-execution:${payload.task_id}`,
      })
    );
  },
});

export const taskExecutionStatusListenerMiddleware =
  taskExecutionStatusListener.middleware;
