import {
  client,
  type ExtensionManifestNodeSchema,
  type ExtensionReadSchema,
} from '@/shared/gatewayClient';

const sortExtensions = (items: Array<ExtensionReadSchema>) =>
  [...items].sort((left, right) =>
    (left.display_name || left.name).localeCompare(
      right.display_name || right.name,
      'ru'
    )
  );

const sortNodes = (items?: Array<ExtensionManifestNodeSchema>) =>
  [...(items ?? [])].sort((left, right) =>
    (left.display_name || left.name || '').localeCompare(
      right.display_name || right.name || '',
      'ru'
    )
  );

const normalizeExtension = (item: ExtensionReadSchema): ExtensionReadSchema => {
  if (!item.manifest_json) {
    return item;
  }

  return {
    ...item,
    manifest_json: {
      ...item.manifest_json,
      nodes: sortNodes(item.manifest_json.nodes),
    },
  };
};

export const extensionsApi = {
  async list(): Promise<Array<ExtensionReadSchema>> {
    const response = await client.extensions.get();
    return sortExtensions(response.data.map(normalizeExtension));
  },

  async sync(): Promise<Array<ExtensionReadSchema>> {
    const response = await client.extensions.sync.post();
    return sortExtensions(response.data.map(normalizeExtension));
  },

  async install(
    extensionName: string,
    version?: string | null | undefined
  ): Promise<ExtensionReadSchema> {
    const response = await client.extensions
      .extensionName(extensionName)
      .install.post({
        query: version != null ? { version } : {},
      });
    return normalizeExtension(response.data);
  },

  async reload(extensionName: string): Promise<ExtensionReadSchema> {
    const response = await client.extensions
      .extensionName(extensionName)
      .reload.post();
    return normalizeExtension(response.data);
  },

  async remove(
    extensionName: string,
    dropExtensionData = false
  ): Promise<ExtensionReadSchema> {
    const response = await client.extensions
      .extensionName(extensionName)
      .uninstall.delete({
        body: { drop_extension_data: dropExtensionData },
      });
    return normalizeExtension(response.data);
  },
};
