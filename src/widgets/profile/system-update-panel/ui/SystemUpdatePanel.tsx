import * as React from 'react';
import Box from '@mui/material/Box';
import { IconCircleArrowUp } from '@tabler/icons-react';

import { useBuildVersion } from '@/features/profile/build-version-info';
import {
  getSystemUpdateOwnerKey,
  useSystemUpdate,
} from '@/features/profile/system-update';

import type { UserReadSchema } from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageLayout } from '@/shared/ui/page-layout';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Spinner,
} from '@/shared/ui/primitives';

import {
  FieldHint,
  FieldLabel,
  FieldRow,
  StartErrorNotice,
  TagInput,
  UpdateButton,
  UpdateContent,
  UpdateSection,
  UpdateTitle,
  UpdateVersion,
} from './styles';

interface SystemUpdatePanelProps {
  currentUser: UserReadSchema | null;
}

// The backend resolves this tag to the latest stable release.
const LATEST_TAG = 'latest';
const TAG_INPUT_ID = 'system-update-tag';

export const SystemUpdatePanel = ({ currentUser }: SystemUpdatePanelProps) => {
  const { confirm } = useConfirmDialog();
  const {
    versionInfo,
    isLoading: versionLoading,
    loadBuildVersion,
  } = useBuildVersion();
  const { phase, marker, error, start, resume, clear, clearStartError } =
    useSystemUpdate();
  const [tag, setTag] = React.useState(LATEST_TAG);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const ownerKey = getSystemUpdateOwnerKey(currentUser);
  const ownsMarker = Boolean(
    marker && ownerKey && marker.ownerKey === ownerKey
  );
  const pausedMarker = ownsMarker && marker?.paused ? marker : null;
  const isStarting = phase === 'starting';
  const targetVersion = tag.trim();
  const isFormDisabled = isStarting || Boolean(marker);
  const canStart = Boolean(targetVersion) && !isFormDisabled;

  React.useEffect(() => {
    void loadBuildVersion();
  }, [loadBuildVersion]);

  const handleStart = async () => {
    if (!targetVersion) {
      setValidationError('Укажите tag образов.');
      return;
    }

    if (!ownerKey) {
      setValidationError('Не удалось определить текущего пользователя.');
      return;
    }

    const approved = await confirm({
      title: 'Запустить обновление DVT?',
      message: `Будет запущено обновление до версии «${targetVersion}». Gateway, UI и другие сервисы временно станут недоступны. Не закрывайте приложение до появления результата.`,
      confirmLabel: 'Запустить обновление',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'sm',
    });

    if (!approved) {
      return;
    }

    try {
      await start({ ownerKey, version: targetVersion });
    } catch {
      // The slice exposes the locally rendered API error.
    }
  };

  const handleResetPausedMarker = async () => {
    const approved = await confirm({
      title: 'Сбросить локальный статус?',
      message:
        'DVT перестанет отслеживать это обновление в текущей вкладке. Само обновление в installation manager остановлено не будет.',
      confirmLabel: 'Сбросить статус',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'sm',
    });

    if (approved) {
      clear();
    }
  };

  const renderCurrentVersion = () => {
    if (versionLoading && !versionInfo) {
      return 'Определение версии…';
    }

    if (!versionInfo?.version) {
      return 'Установленная версия неизвестна';
    }

    return (
      <>
        Установлена <b>{versionInfo.version}</b>
      </>
    );
  };

  return (
    <PageLayout width='narrow' title='DVT Update' icon={IconCircleArrowUp}>
      <UpdateContent>
        {pausedMarker ? (
          <Alert variant='warning'>
            <AlertTitle>Мониторинг обновления приостановлен</AlertTitle>
            <AlertDescription>
              Проверка версии {pausedMarker.targetVersion} была остановлена
              после продолжительной недоступности gateway. Обновление могло
              продолжить выполняться в installation manager.
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 2,
                }}
              >
                <Button onClick={resume} size='sm'>
                  Продолжить проверку
                </Button>
                <Button
                  onClick={() => void handleResetPausedMarker()}
                  size='sm'
                  variant='outline'
                >
                  Сбросить локальный статус
                </Button>
              </Box>
            </AlertDescription>
          </Alert>
        ) : null}

        <UpdateSection aria-busy={isStarting}>
          <UpdateTitle>Версия DVT</UpdateTitle>
          <UpdateVersion>{renderCurrentVersion()}</UpdateVersion>

          <FieldLabel htmlFor={TAG_INPUT_ID}>Tag образов</FieldLabel>
          <FieldRow>
            <TagInput
              id={TAG_INPUT_ID}
              value={tag}
              disabled={isFormDisabled}
              error={Boolean(validationError)}
              inputProps={{ spellCheck: false }}
              onChange={event => {
                setTag(event.target.value);
                setValidationError(null);
                clearStartError();
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && canStart) {
                  event.preventDefault();
                  void handleStart();
                }
              }}
            />
            <UpdateButton
              disableRipple
              busy={isStarting}
              disabled={!canStart}
              onClick={() => void handleStart()}
            >
              {isStarting ? (
                <>
                  <Spinner color='inherit' size={12} />
                  Запуск обновления…
                </>
              ) : (
                'Обновить'
              )}
            </UpdateButton>
          </FieldRow>
          <FieldHint error={Boolean(validationError)}>
            {validationError ?? 'latest — последний стабильный релиз'}
          </FieldHint>

          {phase === 'idle' && error ? (
            <StartErrorNotice
              title='Не удалось запустить обновление'
              message={error.message}
              onDismiss={clearStartError}
            />
          ) : null}
        </UpdateSection>
      </UpdateContent>
    </PageLayout>
  );
};
