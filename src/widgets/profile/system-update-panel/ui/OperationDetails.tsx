import {
  Alert,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

import type { OperationView } from '@/shared/gatewayClient';

import { updateFailureMessage } from './updateFailureMessage';

const stages: Record<OperationView['stage'], string> = {
  admitted: 'Операция сохранена',
  preparing: 'Подготовка комплекта',
  prepared: 'Комплект проверен',
  maintenance: 'Окно обслуживания',
  backup: 'Подготовка резервной копии',
  migrating: 'Миграция базы данных',
  applying: 'Применение комплекта',
  verifying: 'Проверка готовности',
  resuming: 'Подтверждение возобновления',
  recovery_required: 'Требуется восстановление',
  recovering: 'Восстановление',
  succeeded: 'Операция завершена',
  cancelled: 'Операция отменена',
  failed: 'Операция завершилась ошибкой',
};

const gib = (bytes: number) => (bytes / 1024 ** 3).toFixed(2);

export function OperationDetails({
  operation,
  children,
}: {
  operation: OperationView;
  children: ReactNode;
}) {
  const plan = operation.plan;
  return (
    <Card
      component='section'
      aria-label='Операция обновления'
      variant='outlined'
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant='h6'>
            Обновление до {operation.version}
          </Typography>
          <Typography>
            ID операции <Box component='code'>{operation.id}</Box>
          </Typography>
          <Typography role='status'>{stages[operation.stage]}</Typography>
          {operation.failure && (
            <Alert severity='error'>
              {updateFailureMessage(operation.failure)}
            </Alert>
          )}
          {plan && (
            <>
              <Typography variant='subtitle1'>План обновления</Typography>
              <Typography>
                Работает {plan.source_version}, схема {plan.source_revision}.
              </Typography>
              <Typography>
                Цель {plan.target_version}, схема {plan.target_revision}.
              </Typography>
              <Typography sx={{ overflowWrap: 'anywhere' }}>
                Манифест <Box component='code'>{operation.manifest_digest}</Box>
              </Typography>
              {plan.add.length > 0 && (
                <Typography>Будут добавлены {plan.add.join(', ')}.</Typography>
              )}
              {plan.recreate.length > 0 && (
                <Typography>
                  Будут пересозданы {plan.recreate.join(', ')}.
                </Typography>
              )}
              {plan.retire.length > 0 && (
                <Typography>Будут удалены {plan.retire.join(', ')}.</Typography>
              )}
              <Typography>
                Образы с распаковкой до {gib(plan.pull_and_unpack_bytes)} ГиБ.
                Резерв под данные {gib(plan.data_reserve_bytes)} ГиБ.
              </Typography>
              <Typography>
                Окно включает ожидание активных задач до{' '}
                {plan.maintenance_drain_seconds} с, создание копии, миграцию и
                проверку готовности. Активные задачи завершаются, непринятые
                корневые запуски отменяются. Запуски по расписанию в окне
                пропускаются, существующие повторы сохраняются.
              </Typography>
              {plan.rollback === 'restore_backup' && (
                <Typography>
                  Для отката после миграции потребуется резервная копия. Записи
                  после её создания будут потеряны.
                </Typography>
              )}
            </>
          )}
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}
