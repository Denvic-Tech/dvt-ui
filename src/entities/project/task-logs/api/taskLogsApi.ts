import { client, type LogEntriesPageSchema } from '@/shared/gatewayClient';

export interface GetTaskLogsParams {
  projectId: string;
  taskId: string;
  limit: number;
  offset: number;
}

export const taskLogsApi = {
  async getTaskLogs({
    projectId,
    taskId,
    limit,
    offset,
  }: GetTaskLogsParams): Promise<LogEntriesPageSchema> {
    const response = await client.projects.projectId(projectId).logs.get({
      query: {
        task_id: taskId,
        limit,
        offset,
      },
    });

    return response.data;
  },
};
