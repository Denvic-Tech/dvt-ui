import React from 'react';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  buildSetupPayload,
  createSetupFormValues,
  getSetupFieldDescriptors,
  setupApi,
  type SetupFieldDescriptor,
  type SetupFormValues,
  useSetup,
} from '@/app/setup';

import { SetupStepForm } from '@/features/setup-step-form';

import { isApiError } from '@/shared/lib/errors';

import { useAuth } from '@/contexts/AuthContext';

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

function readPairingLink() {
  if (typeof window === 'undefined' || window.location.pathname !== '/setup') {
    return null;
  }
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get('pairing');
  const operation = params.get('operation');
  if (!code || !operation) return null;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', pathname + search);
  return { code, operation_id: operation };
}

// Capture once, before React effects or any reload can consume the fragment.
const initialPairing = readPairingLink();

function fieldErrors(detail: unknown): Record<string, string> {
  if (!Array.isArray(detail)) return {};
  return Object.fromEntries(
    detail.flatMap(error => {
      if (error?.loc?.[1] !== 'values' || typeof error.loc[2] !== 'string')
        return [];
      if (error.loc[2] === 'email') {
        return [['email', 'Введите корректный адрес электронной почты.']];
      }
      if (error.loc[2] === 'password') {
        return [['password', 'Введите пароль длиной от 8 до 255 символов.']];
      }
      return typeof error.msg === 'string' ? [[error.loc[2], error.msg]] : [];
    })
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    status,
    steps,
    isInitialized,
    loadStatus,
    loadError,
    loadSetupStatus,
    submitSetupStep,
    getSubmitStatus,
    getSubmitError,
  } = useSetup();

  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [pairing, setPairing] = React.useState(initialPairing);
  const [pairingBusy, setPairingBusy] = React.useState(false);
  const [pairingError, setPairingError] = React.useState<string | null>(null);

  const pair = async () => {
    if (!pairing || pairingBusy) return;
    setPairingBusy(true);
    try {
      await setupApi.pair(pairing);
      setPairing(null);
      await loadSetupStatus();
    } catch {
      setPairing(null);
      setPairingError(
        'Ссылка истекла или уже использована. Откройте первичную настройку заново из мастера.'
      );
    } finally {
      setPairingBusy(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setStatusError(null);

      try {
        await loadSetupStatus();
      } catch (error) {
        if (mounted) {
          setStatusError(
            resolveErrorMessage(
              error,
              'Не удалось загрузить статус первичной настройки.'
            )
          );
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [loadSetupStatus]);

  React.useEffect(() => {
    if (!status || !isInitialized) {
      return;
    }

    navigate(isAuthenticated ? '/projects' : '/sign_in', { replace: true });
  }, [isAuthenticated, isInitialized, navigate, status]);

  const handleStepSubmit = React.useCallback(
    async (
      code: string,
      fields: SetupFieldDescriptor[],
      values: SetupFormValues
    ) => {
      await submitSetupStep(
        code,
        buildSetupPayload({
          values,
          fields,
        })
      );

      await loadSetupStatus();
    },
    [loadSetupStatus, submitSetupStep]
  );

  if (loadStatus === 'loading' && !status) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const pendingSteps = steps.filter(step => !step.completed);

  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: 'auto',
        py: { xs: 2, md: 4 },
      }}
    >
      <Stack spacing={2}>
        {statusError ? <Alert severity='error'>{statusError}</Alert> : null}
        {!statusError && loadError ? (
          <Alert severity='error'>{loadError.message}</Alert>
        ) : null}

        {status?.pairing_required && (
          <Alert
            severity={pairingError ? 'error' : 'info'}
            action={
              pairing && (
                <Button onClick={() => void pair()} disabled={pairingBusy}>
                  Подтвердить первичную настройку
                </Button>
              )
            }
          >
            {pairingError ??
              (pairing
                ? 'Подтвердите, что вы открыли страницу из мастера установки DVT.'
                : 'Откройте первичную настройку из защищённого мастера установки DVT.')}
          </Alert>
        )}

        {steps
          .filter(step => !step.completed)
          .map(step => {
            const fields = getSetupFieldDescriptors({
              fields: step.fields,
            });

            const submitError = getSubmitError(step.code);
            const serverErrors = fieldErrors(submitError?.detail);

            return (
              <SetupStepForm
                key={step.code}
                title={step.title}
                description={step.description ?? null}
                submitLabel={step.submit_label}
                fields={fields}
                initialValues={createSetupFormValues({
                  fields,
                })}
                loading={getSubmitStatus(step.code) === 'loading'}
                serverErrors={serverErrors}
                submitError={
                  Object.keys(serverErrors).length
                    ? null
                    : (submitError?.message ?? null)
                }
                onSubmit={values => handleStepSubmit(step.code, fields, values)}
              />
            );
          })}

        {steps.length === 0 && !isInitialized && !status?.pairing_required ? (
          <Alert severity='info'>
            Сервер не вернул шаги первичной настройки.
          </Alert>
        ) : null}

        {steps.length > 0 && pendingSteps.length === 0 && !isInitialized ? (
          <Alert severity='info'>
            Все шаги инициализации отмечены как завершенные, ожидается
            обновление статуса.
          </Alert>
        ) : null}
      </Stack>
    </Box>
  );
}
