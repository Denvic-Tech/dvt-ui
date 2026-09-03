import React from 'react';
import { Alert, Box, CircularProgress, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  buildSetupPayload,
  createSetupFormValues,
  getSetupFieldDescriptors,
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

        {steps
          .filter(step => !step.completed)
          .map(step => {
            const fields = getSetupFieldDescriptors({
              fields: step.fields,
            });

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
                submitError={getSubmitError(step.code)?.message ?? null}
                onSubmit={values => handleStepSubmit(step.code, fields, values)}
              />
            );
          })}

        {steps.length === 0 && !isInitialized ? (
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
