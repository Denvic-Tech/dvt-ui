import React from 'react';

import { Tooltip } from '@/shared/ui';

import { formatBytes } from './lib/formatters.ts';
import { TaskPillRoot, TaskPulseDot, TaskRamValue } from './styled.ts';

interface TaskPillProps {
  ramUsed?: number | null | undefined;
}

export const TaskPill: React.FC<TaskPillProps> = ({ ramUsed }) => {
  const formattedRam = formatBytes(ramUsed);

  return (
    <Tooltip title='На воркере сейчас выполняется задача'>
      <span>
        <TaskPillRoot>
          <TaskPulseDot />
          Задача
          <TaskRamValue>{formattedRam}</TaskRamValue>
        </TaskPillRoot>
      </span>
    </Tooltip>
  );
};
