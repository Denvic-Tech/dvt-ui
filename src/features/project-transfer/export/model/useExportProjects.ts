import { useCallback, useState } from 'react';

import { useAlert } from '@/app/notifications';

import type { ExportRequestSchema } from '@/shared/gatewayClient';

import { projectTransferApi } from '../../api/projectTransferApi';
import { getApiErrorDescription } from '../../lib/errorMessage';
import { requestSaveTarget } from '../../lib/saveTarget';

export const PROJECT_TRANSFER_NOTIFICATION_GROUP = 'project-transfer';

export type ExportProjectsOptions = {
  /** Имя файла, предлагаемое в диалоге сохранения */
  suggestedName: string;
  /** Архив содержит секреты подключений, защищённые паролем */
  withSecrets: boolean;
};

/**
 * Открывает диалог сохранения, запускает серверный экспорт и записывает
 * архив в выбранный файл. Итог и предупреждения из `X-DVT-Export-Warnings`
 * показываются уведомлением. Возвращает `true`, если архив сохранён.
 */
export const useExportProjects = () => {
  const { showNotification } = useAlert();
  const [exporting, setExporting] = useState(false);

  const exportProjects = useCallback(
    async (
      request: ExportRequestSchema,
      { suggestedName, withSecrets }: ExportProjectsOptions
    ): Promise<boolean> => {
      // Диалог открывается до запроса, пока действует жест пользователя
      const target = await requestSaveTarget(suggestedName);
      if (!target) {
        return false;
      }

      setExporting(true);
      try {
        const result = await projectTransferApi.exportBundle(request);
        await target.save(result.blob, result.fileName);

        const notes = [
          withSecrets
            ? 'Рекомендуется передавать пароль отдельно от файла экспорта.'
            : '',
          ...result.warnings.map(warning => warning.message),
        ].filter(Boolean);

        showNotification({
          type: result.warnings.length > 0 ? 'warning' : 'success',
          title:
            result.warnings.length > 0
              ? 'Архив экспортирован с предупреждениями'
              : 'Архив экспортирован',
          description: notes.length > 0 ? notes.join(' ') : result.fileName,
          group: PROJECT_TRANSFER_NOTIFICATION_GROUP,
          ...(result.warnings.length > 0 ? { autoCloseDuration: null } : {}),
        });

        return true;
      } catch (error) {
        console.error('Project export failed', error);
        showNotification({
          type: 'error',
          title: 'Не удалось экспортировать',
          description: getApiErrorDescription(
            error,
            'Сервер не вернул архив. Попробуйте ещё раз.'
          ),
          group: PROJECT_TRANSFER_NOTIFICATION_GROUP,
        });
        return false;
      } finally {
        setExporting(false);
      }
    },
    [showNotification]
  );

  return { exporting, exportProjects };
};
