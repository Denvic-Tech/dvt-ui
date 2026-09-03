import React from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import { Tooltip } from '@/shared/ui';

import { OfflineDot, StatusBadgeRoot } from './styled.ts';

interface StatusBadgeProps {
  status: 'online' | 'offline';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const title =
    status === 'online'
      ? 'Сервис отвечает на запросы статуса'
      : 'Сервис сейчас недоступен';

  return (
    <Tooltip title={title}>
      <span>
        <StatusBadgeRoot variantState={status}>
          {status === 'online' ? <CheckRoundedIcon /> : <OfflineDot />}
          {status === 'online' ? 'Работает' : 'Оффлайн'}
        </StatusBadgeRoot>
      </span>
    </Tooltip>
  );
};
