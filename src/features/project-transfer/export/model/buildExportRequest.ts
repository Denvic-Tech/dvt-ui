import type { ExportRequestSchema } from '@/shared/gatewayClient';

export const MIN_EXPORT_PASSPHRASE_LENGTH = 8;

export type ExportTarget = {
  projectIds: string[];
  folderIds: string[];
  /** Название проекта или папки для шапки диалога */
  name?: string;
};

export type ExportOptionsState = {
  includeVariables: boolean;
  includeConnections: boolean;
  passphrase: string;
  includeFiles: boolean;
  includeSchedule: boolean;
  /** Инверсия `disable_schedule_after_export` */
  enableScheduleAfterImport: boolean;
};

export const INITIAL_EXPORT_OPTIONS: ExportOptionsState = {
  includeVariables: false,
  includeConnections: false,
  passphrase: '',
  includeFiles: false,
  includeSchedule: false,
  enableScheduleAfterImport: false,
};

/**
 * Подключения всегда экспортируются вместе с секретами, зашифрованными
 * паролем архива. Расписание доступно только администраторам.
 */
export const buildExportRequest = (
  target: ExportTarget,
  options: ExportOptionsState,
  { canExportSchedule }: { canExportSchedule: boolean }
): ExportRequestSchema => {
  const includeSchedule = canExportSchedule && options.includeSchedule;
  return {
    project_ids: target.projectIds,
    folder_ids: target.folderIds,
    include_variables: options.includeVariables,
    include_connections: options.includeConnections,
    include_secrets: options.includeConnections,
    passphrase: options.includeConnections ? options.passphrase : null,
    include_files: options.includeFiles,
    include_schedule: includeSchedule,
    disable_schedule_after_export:
      includeSchedule && !options.enableScheduleAfterImport,
  };
};
