import { createListenerMiddleware } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';
import { addAlert } from '@/app/notifications/model/slice.ts';
import { wsMessageActions } from '@/shared/wsMessageActions.ts';

export const nodeExecutionStatusListener =
  createListenerMiddleware<RootState>();

nodeExecutionStatusListener.startListening({
  actionCreator: wsMessageActions.NODE_EXECUTION_STATUS,
  effect: ({ payload }, api) => {
    if (payload.status !== 'error') {
      return;
    }

    const nodeData = api.getState().graph.nodeDataByID[payload.node_id];
    const nodeLabel =
      nodeData?.displayName ?? nodeData?.name ?? payload.node_id;
    const message = payload?.message;
    const executionMode = payload?.execution_mode;

    if (executionMode === 'metadata_only') {
      return;
    }

    let description = `Нода "${nodeLabel}" завершилась с ошибкой`;

    if (message) {
      description += `: ${message}`;
    }

    api.dispatch(
      addAlert({
        type: 'error',
        title: 'Ошибка выполнения ноды',
        description,
        detail: `Node ID: ${payload.node_id}`,
        group: `node-execution:${payload.node_id}`,
      })
    );
  },
});

export const nodeExecutionStatusListenerMiddleware =
  nodeExecutionStatusListener.middleware;
