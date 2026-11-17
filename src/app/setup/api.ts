import {
  client,
  type SetupPairingWritable,
  type SetupStatus,
  type SetupStepSubmitRequest,
  zSetupStatus,
  zSetupStepSubmitRequest,
} from '@/shared/gatewayClient';

export interface SubmitSetupStepArgs {
  code: string;
  values: Record<string, unknown>;
}

export const setupApi = {
  getStatus: async (): Promise<SetupStatus> => {
    const response = await client.setup.status.get(undefined, { silent: true });

    return response.data;
  },

  pair: async (data: SetupPairingWritable): Promise<SetupStatus> => {
    const response = await client.setup.pairing.post(
      { body: data },
      { headers: { 'X-DVT-CSRF': '1' }, silent: true }
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
      headers: { 'X-DVT-CSRF': '1' },
      responseValidator: async data => {
        return await zSetupStatus.parseAsync(data);
      },
      silent: true,
    });

    return zSetupStatus.parse(response.data) as SetupStatus;
  },
};
