import { client } from '@/shared/gatewayClient';
import {
  extensionFrontendRegistryCache,
  type ExtensionFrontendMetadata,
  type ExtensionRegistry,
  RegisterFunction,
} from './extensionRegistry.ts';
import { host } from '@/app/extensions/exposeExtensionHost.ts';

type ExtensionModule = Record<string, unknown> & {
  default?: unknown;
  register?: () => ExtensionRegistry | Promise<ExtensionRegistry>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRegistry = (value: unknown): value is ExtensionRegistry =>
  isRecord(value) && ('editors' in value ? isRecord(value['editors']) : true);

const resolveRegister = (
  module: ExtensionModule,
  metadata: ExtensionFrontendMetadata
): RegisterFunction => {
  const entry = metadata.entrypoint || 'register';
  const fn = (module as Record<string, unknown>)[entry];
  if (typeof fn !== 'function') {
    throw new Error(`Entrypoint "${entry}" not found in extension module`);
  }
  return fn as RegisterFunction;
};

const importExtensionModule = async (
  metadata: ExtensionFrontendMetadata
): Promise<ExtensionModule> => {
  if (!metadata.bundle_url) throw new Error('No bundle_url in metadata');

  // Запрашиваем текст JS-файла через API
  const response = await client.extensions
    .extensionName(metadata.extension_name)
    .frontend
    .assets
    .assetPath(metadata.entry_file)
    // Клиент не имеет такого типа, поэтому игнор, но работает
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    .get({ responseType: 'text' });

  const code = response.data as string; // Явно указываем тип string

  // Создаём Blob и динамически импортируем его
  const blob = new Blob([code], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    return (await import(/* @vite-ignore */ blobUrl)) as ExtensionModule;
  } finally {
    // Можно удалить URL после использования
    URL.revokeObjectURL(blobUrl);
  }
};

const requestExtensionFrontend = async (extensionName: string) => {
  const response = await client.extensions
    .extensionName(extensionName)
    .frontend.get(undefined, { silent: true });

  return response.data as ExtensionFrontendMetadata;
};

const loadExtensionFrontendUncached = async (
  extensionName: string
): Promise<ExtensionRegistry> => {
  const metadata = await requestExtensionFrontend(extensionName);

  if (!metadata) {
    throw new Error(`Frontend metadata for extension "${extensionName}" not found`);
  }

  const module = await importExtensionModule(metadata);
  const register = resolveRegister(module, metadata);

  console.log(register);

  const registry = await register(host);

  if (!isRegistry(registry)) {
    throw new Error(
      `register() for extension "${extensionName}" returned an invalid registry`
    );
  }

  return registry;
};

export const loadExtensionFrontend = async (
  extensionName: string
): Promise<ExtensionRegistry> => {
  const cached = extensionFrontendRegistryCache.get(extensionName);
  if (cached) return cached;

  const registryPromise = loadExtensionFrontendUncached(extensionName).catch(
    (error) => {
      extensionFrontendRegistryCache.delete(extensionName);
      throw error;
    }
  );

  extensionFrontendRegistryCache.set(extensionName, registryPromise);
  return registryPromise;
};