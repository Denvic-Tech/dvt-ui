import { Box, Skeleton } from '@mui/material';

import type { ProjectScheduleResponse } from '@/shared/gatewayClient';
import { RunTicks } from '@/shared/ui/run-ticks/RunTicks';
import { TokenListRowMenu } from '@/shared/ui/token-list';

import * as S from './styles';

const formatNextRun = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const dateText = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace(/\.$/, '');
  const timeText = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${dateText.charAt(0).toUpperCase()}${dateText.slice(1)} ${timeText}`;
};

type ScheduleRowProps = {
  schedule: ProjectScheduleResponse;
  name: string;
  isPending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const ScheduleRow = ({
  schedule,
  name,
  isPending,
  onToggle,
  onEdit,
  onDelete,
}: ScheduleRowProps) => {
  const enabled = !schedule.disabled;
  const nextRun = formatNextRun(schedule.next_run_time);
  const hasRuns = (schedule.recent_runs?.length ?? 0) > 0;

  return (
    <S.ScheduleRowRoot>
      <S.ScheduleSwitch
        type='button'
        role='switch'
        checked={enabled}
        aria-checked={enabled}
        aria-label={enabled ? 'Выключить расписание' : 'Включить расписание'}
        disabled={isPending}
        onClick={onToggle}
      />

      <S.ScheduleNameCell>
        <S.ScheduleName enabled={enabled} title={name}>
          {name}
        </S.ScheduleName>
      </S.ScheduleNameCell>

      <S.ScheduleCron title={schedule.cron}>{schedule.cron}</S.ScheduleCron>

      <S.ScheduleNextRun muted={!enabled || !nextRun}>
        {enabled ? (nextRun ?? 'Не рассчитано') : 'Отключено'}
      </S.ScheduleNextRun>

      <S.ScheduleHistory>
        {hasRuns ? (
          <RunTicks runs={schedule.recent_runs} name={name} />
        ) : (
          <S.ScheduleNoRuns>Не запускался</S.ScheduleNoRuns>
        )}
      </S.ScheduleHistory>

      <TokenListRowMenu
        label={`Действия с расписанием ${name}`}
        actions={[
          { label: 'Изменить', onSelect: onEdit },
          { label: 'Удалить', onSelect: onDelete, danger: true },
        ]}
      />
    </S.ScheduleRowRoot>
  );
};

const Bone = ({
  width,
  height,
  radius = 6,
}: {
  width: number;
  height: number;
  radius?: number;
}) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ flexShrink: 0, borderRadius: `${radius}px`, bgcolor: '#F1F3F8' }}
  />
);

// Repeats the geometry of ScheduleRow, so the list does not shift on load.
export const ScheduleRowSkeleton = ({ nameWidth }: { nameWidth: number }) => (
  <S.ScheduleRowRoot aria-hidden>
    <Bone width={26} height={16} radius={8} />
    <S.ScheduleNameCell>
      <Bone width={nameWidth} height={12} />
    </S.ScheduleNameCell>
    <Box sx={{ width: 120, flexShrink: 0 }}>
      <Bone width={76} height={10} />
    </Box>
    <Box sx={{ width: 150, flexShrink: 0 }}>
      <Bone width={104} height={10} />
    </Box>
    <S.ScheduleHistory>
      <Bone width={40} height={12} radius={3} />
    </S.ScheduleHistory>
    <Box sx={{ width: 28, flexShrink: 0 }} />
  </S.ScheduleRowRoot>
);
