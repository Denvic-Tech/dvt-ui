import { Spinner } from '@/shared/ui/clean-minimal/controls';

import { MessageBox } from '../../schema-step/SchemaStep.styles';

type StatusAlertsSectionProps = {
  createTableError: string | null | undefined;
  isCreateTableLoading: boolean;
  isTableNew: boolean;
};

export const StatusAlertsSection = ({
  createTableError,
  isCreateTableLoading,
  isTableNew,
}: StatusAlertsSectionProps) => {
  if (!isTableNew || (!isCreateTableLoading && !createTableError)) {
    return null;
  }

  return (
    <>
      {isCreateTableLoading ? (
        <MessageBox tone='info' role='status'>
          <Spinner size={13} style={{ marginTop: 2 }} />
          <span className='message-text'>
            Создание таблицы выполняется. Дождитесь завершения, перед
            продолжением записи.
          </span>
        </MessageBox>
      ) : null}

      {createTableError ? (
        <MessageBox tone='error' role='alert'>
          <span className='message-text'>
            {createTableError} Вернитесь на предыдущий шаг, исправьте
            SQL/параметры таблицы и попробуйте снова.
          </span>
        </MessageBox>
      ) : null}
    </>
  );
};
