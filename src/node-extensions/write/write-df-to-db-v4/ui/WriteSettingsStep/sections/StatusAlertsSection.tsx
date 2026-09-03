import React from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';

type StatusAlertsSectionProps = {
  createTableError: string | null | undefined;
  isCreateTableLoading: boolean;
  isTableNew: boolean;
};

export const StatusAlertsSection: React.FC<StatusAlertsSectionProps> = ({
  createTableError,
  isCreateTableLoading,
  isTableNew,
}) => {
  if (!isTableNew || (!isCreateTableLoading && !createTableError)) {
    return null;
  }

  return (
    <>
      {isCreateTableLoading && (
        <Alert severity='info' variant='outlined'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Создание таблицы выполняется. Дождитесь завершения, перед
            продолжением записи.
          </Box>
        </Alert>
      )}

      {createTableError && (
        <Alert severity='error' variant='outlined'>
          {createTableError} Вернитесь на предыдущий шаг, исправьте
          SQL/параметры таблицы и попробуйте снова.
        </Alert>
      )}
    </>
  );
};
