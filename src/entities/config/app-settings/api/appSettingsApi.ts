import {
  type AppSettingDefinitionSchema,
  type AppSettingHistoryItemSchema,
  type AppSettingsReadSchema,
  type AppSettingsUpdateSchema,
  client,
} from '@/shared/gatewayClient';

export interface AppSettingsQueryOptions {}

export const appSettingsApi = {
  async definitions(): Promise<AppSettingDefinitionSchema[]> {
    const response = await client.appSettings.definitions.get();
    return response.data;
  },

  async get(
    _options?: AppSettingsQueryOptions
  ): Promise<AppSettingsReadSchema> {
    const response = await client.appSettings.get();

    return response.data;
  },

  async upsert(
    values: AppSettingsUpdateSchema,
    _options?: AppSettingsQueryOptions
  ): Promise<AppSettingsReadSchema> {
    const response = await client.appSettings.post({
      body: values,
    });

    return response.data;
  },

  async getValue(key: string, _options?: AppSettingsQueryOptions) {
    const response = await client.appSettings.key(key).get();

    return response.data;
  },

  async setValue(
    key: string,
    value: unknown,
    _options?: AppSettingsQueryOptions
  ) {
    const response = await client.appSettings.key(key).post({
      body: value,
    });

    return response.data;
  },

  async deleteValue(key: string): Promise<void> {
    await client.appSettings.key(key).delete();
  },

  async history(key: string): Promise<AppSettingHistoryItemSchema[]> {
    const response = await client.appSettings.key(key).history.get();
    return response.data;
  },
};
