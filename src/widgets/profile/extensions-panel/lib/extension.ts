import type {
  ExtensionCatalogVersionSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';
import { type ApiErrorPayload, isApiError } from '@/shared/lib/errors';

export type ExtensionsTab = 'installed' | 'available';

export type PendingAction = 'install' | 'update' | 'reload' | 'delete';

export type ReleaseOperation = NonNullable<
  ExtensionCatalogVersionSchema['operation']
>;

export interface ExtensionActionError {
  action: PendingAction;
  message: string;
}

export const getExtensionName = (extension: ExtensionReadSchema) =>
  extension.display_name || extension.name;

export const sortExtensions = (items: ExtensionReadSchema[]) =>
  [...items].sort((left, right) =>
    getExtensionName(left).localeCompare(getExtensionName(right), 'ru')
  );

// A not installed extension without published versions is not in the catalog.
export const isInCatalog = (extension: ExtensionReadSchema) =>
  extension.is_installed ||
  Boolean(
    extension.catalog_versions?.length || extension.available_versions?.length
  );

export const isInTab = (extension: ExtensionReadSchema, tab: ExtensionsTab) =>
  tab === 'installed' ? extension.is_installed : !extension.is_installed;

// For an installed extension the backend recommends only a newer version.
export const hasUpdate = (extension: ExtensionReadSchema) =>
  extension.is_installed && Boolean(extension.recommended_version);

export const formatVersion = (version?: string | null) => {
  if (!version) {
    return '—';
  }

  return /^v/i.test(version) ? version : `v${version}`;
};

// Installed extensions show the current version, available ones the
// recommended one.
export const getListVersion = (extension: ExtensionReadSchema) =>
  formatVersion(
    extension.is_installed
      ? extension.current_version
      : extension.recommended_version || extension.current_version
  );

// Without a chosen release the backend installs the recommended version.
export const getReleaseOperation = (
  extension: ExtensionReadSchema,
  release?: ExtensionCatalogVersionSchema
): ReleaseOperation =>
  release?.operation ?? (extension.is_installed ? 'upgrade' : 'install');

export const OPERATION_LABELS: Record<ReleaseOperation, string> = {
  install: 'Установить',
  upgrade: 'Обновить',
  downgrade: 'Понизить версию',
  reinstall: 'Переустановить',
};

export const canInstallRelease = (release: ExtensionCatalogVersionSchema) =>
  Boolean(release.operation) && !release.incompatibility;

export const getReleaseLabel = (release: ExtensionCatalogVersionSchema) =>
  release.channel === 'rc'
    ? `${formatVersion(release.version)} · RC`
    : formatVersion(release.version);

const PLATFORM_FIELD_LABELS = {
  os: 'ОС',
  architecture: 'Архитектура',
  python: 'Python',
  implementation: 'Реализация Python',
};

// Why the release can not be installed, or «Установлено» for the current one.
export const getReleaseNote = (
  release: ExtensionCatalogVersionSchema
): string | null => {
  const differences = release.incompatibility_details ?? [];

  if (release.incompatibility === 'target') {
    const reasons = differences.flatMap(({ field, current, required }) =>
      field === 'dvt_version'
        ? []
        : [`${PLATFORM_FIELD_LABELS[field]}: ${current}, требуется ${required}`]
    );
    return reasons.length ? reasons.join(' · ') : 'Несовместимая платформа';
  }

  if (release.incompatibility === 'dvt_version') {
    const difference = differences.find(({ field }) => field === 'dvt_version');
    const requirement = difference?.required ?? release.dvt_version;
    if (difference?.current && requirement) {
      return `DVT ${difference.current}, требуется ${requirement}`;
    }
    return `Требуется DVT ${requirement ?? 'совместимой версии'}`;
  }

  return release.operation === 'reinstall' ? 'Установлено' : null;
};

const MONTHS = [
  'янв.',
  'февр.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сент.',
  'окт.',
  'нояб.',
  'дек.',
];

// «15 сент. 2026, 12:15».
export const formatInstalledAt = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
};

export const buildErrorPayload = (
  error: unknown,
  fallbackMessage: string
): ApiErrorPayload => {
  if (isApiError(error)) {
    return error.payload;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return { code: 'UNKNOWN', message: error.message };
  }

  return { code: 'UNKNOWN', message: fallbackMessage };
};

// The same text the gateway notification shows for this error.
export const getErrorText = (payload: ApiErrorPayload) => {
  if (payload.description && payload.description !== 'Unexpected error') {
    return payload.description;
  }

  return payload.detail || payload.message;
};
