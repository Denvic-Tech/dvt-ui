import {
  client,
  zSetupStatus,
  zSetupStepSubmitRequest,
  type SetupStatus,
  type SetupStepSubmitRequest,
} from '@/shared/gatewayClient';

export interface SubmitSetupStepArgs {
  code: string;
  values: Record<string, unknown>;
}

export const setupApi = {
  getStatus: async (): Promise<SetupStatus> => {
    const response = await client.setup.status.get(
      undefined,
      { silent: true }
    );

    return response.data;
  },

  submitStep: async ({
    code,
    values,
  }: SubmitSetupStepArgs): Promise<SetupStatus> => {
    const payload: SetupStepSubmitRequest = {
      values,
    };

    await zSetupStepSubmitRequest.parseAsync(payload);

    const response = await client.post({
      url: `/setup/${encodeURIComponent(code)}`,
      body: payload,
      responseValidator: async data => {
        return await zSetupStatus.parseAsync(data);
      },
      silent: true,
    });

    return zSetupStatus.parse(response.data) as SetupStatus;
  },
};
