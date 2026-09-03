import { client, type PipelineExecutionMode } from '@/shared/gatewayClient';
import { ApiError } from '@/shared/lib/errors';

export const projectTaskApi = {
  createTask: async (
    projectID: string,
    mode: PipelineExecutionMode = 'full',
    forceExec: boolean = false,
    targetNodes: string[] | null = null
  ) => {
    const response = await client.projects.projectId(projectID).tasks.new.post({
      query: {
        mode,
        force_exec: forceExec,
        target_nodes: targetNodes,
      },
    });
    if (!response.data.success) {
      throw new ApiError({
        code: 'PROJECT_TASK:TASK_CREATE_ERROR',
        message: response.data.message ?? 'Error create task',
        status: response.status,
      });
    }
    return response.data;
  },

  cancelTask: async (projectID: string, taskID: string) => {
    const response = await client.projects
      .projectId(projectID)
      .tasks.taskId(taskID)
      .cancel.post();
    if (!response.data.success) {
      throw new ApiError({
        code: 'PROJECT_TASK:TASK_CANCEL_ERROR',
        message: response.data.message ?? 'Error cancel task',
        status: response.status,
      });
    }
    return response.data;
  },

  getTaskInfo: async (projectID: string, taskID: string) => {
    const response = await client.projects
      .projectId(projectID)
      .tasks.taskId(taskID)
      .info.get();

    return response.data;
  },
};
