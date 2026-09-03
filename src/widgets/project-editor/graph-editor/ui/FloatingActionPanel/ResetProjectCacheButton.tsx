import React, { useCallback, useState } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Tooltip } from '@mui/material';

import { useAlert } from '@/app/notifications';
import { useAppDispatch } from '@/app/providers/store';

import { clearProjectCache } from '@/features/projects/reset-project-cache/model/clearProjectCache';

import { useCurrentProject } from '@/entities/project/projects';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { ActionButton } from './styles';

const TOOLTIP_BASE_PROPS = Object.freeze({
  placement: 'left' as const,
  disableInteractive: true,
  enterTouchDelay: 0,
  arrow: true,
});

const stringifyDetail = (detail: unknown): string | undefined => {
  if (detail == null) return undefined;

  if (typeof detail === 'string') {
    const value = detail.trim();
    return value.length > 0 ? value : undefined;
  }

  try {
    const value = JSON.stringify(detail);
    return value !== '{}' && value !== '[]' ? value : undefined;
  } catch {
    return String(detail);
  }
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const errorRecord = error as Record<string, unknown>;
    const detail = stringifyDetail(errorRecord['detail']);

    if (detail) return detail;

    if (
      typeof errorRecord['message'] === 'string' &&
      errorRecord['message'].trim().length > 0
    ) {
      return errorRecord['message'];
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Неизвестная ошибка';
};

export const ResetProjectCacheButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentProject } = useCurrentProject();
  const { showNotification } = useAlert();
  const { confirm } = useConfirmDialog();
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = useCallback(async () => {
    if (!currentProject?.id || isClearingCache) return;

    const confirmed = await confirm({
      title: 'Сбросить кэш проекта?',
      message:
        'Все кэшированные данные проекта будут удалены. При следующем запуске они будут рассчитаны заново.',
      confirmLabel: 'Сбросить кэш',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
    });

    if (!confirmed) return;

    setIsClearingCache(true);

    try {
      await dispatch(clearProjectCache()).unwrap();
      showNotification({ type: 'success', title: 'Кэш проекта очищен' });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Не удалось очистить кэш проекта',
        detail: getErrorMessage(error),
      });

      console.error('Ошибка при очистке кэша проекта:', error);
    } finally {
      setIsClearingCache(false);
    }
  }, [
    confirm,
    currentProject?.id,
    dispatch,
    isClearingCache,
    showNotification,
  ]);

  const tooltipTitle = isClearingCache
    ? 'Сброс кэша проекта...'
    : 'Сбросить кэш проекта';

  return (
    <Tooltip {...TOOLTIP_BASE_PROPS} title={tooltipTitle}>
      <span>
        <ActionButton
          data-testid='widgets/project-editor/graph-editor/reset-project-cache-button'
          variant='danger-subtle'
          loadingTone={isClearingCache ? 'danger' : null}
          aria-label='Сбросить кэш проекта'
          type='button'
          onClick={handleClearCache}
          disabled={!currentProject?.id || isClearingCache}
        >
          <RefreshRoundedIcon
            data-spinning={isClearingCache ? 'true' : undefined}
          />
        </ActionButton>
      </span>
    </Tooltip>
  );
};
