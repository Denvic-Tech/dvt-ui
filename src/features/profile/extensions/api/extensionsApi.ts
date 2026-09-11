import {
  client,
  type ExtensionManifestNodeSchema,
  type ExtensionPackagePreviewSchema,
  type ExtensionReadSchema,
  zExtensionPackagePreviewSchema,
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

  async previewPackage(file: File): Promise<ExtensionPackagePreviewSchema> {
    // @hey-api/openapi-ts 0.85 generates z.string() for OpenAPI binary fields,
    // so the nested SDK rejects File before multipart serialization.
    const body = new FormData();
    body.append('file', file);

    const response = await client.post<
      ExtensionPackagePreviewSchema,
      unknown,
      true
    >({
      body,
      responseType: 'json',
      responseValidator: async data =>
        zExtensionPackagePreviewSchema.parseAsync(data),
      throwOnError: true,
      url: '/extensions/packages/preview',
    });
    return response.data;
  },

  async installPackage(
    packageId: string,
    options: { allowDowngrade?: boolean; allowReinstall?: boolean } = {}
  ): Promise<ExtensionReadSchema> {
    const response = await client.extensions.packages
      .packageId(packageId)
      .install.post({
        query: {
          allow_downgrade: options.allowDowngrade ?? false,
          allow_reinstall: options.allowReinstall ?? false,
        },
      });
    return normalizeExtension(response.data);
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
