import {
  client,
  type QueueAction,
  type TaskExecutionStatus,
} from '@/shared/gatewayClient';

export const queueApi = {
  getQueueState: async (
    projectId?: string | null,
    statusFilter?: TaskExecutionStatus[] | null
  ) => {
    const response = await client.queue.get({
      query: {
        project_id: projectId ?? null,
        status_filter: statusFilter ?? null,
      },
    });

    return response.data;
  },

  performAction: async (taskId: string, action: QueueAction) => {
    const response = await client.queue.post({
      body: {
        task_id: taskId,
        action,
      },
    });

    return response.data;
  },
};
