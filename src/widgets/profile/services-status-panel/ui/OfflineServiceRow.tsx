import React from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import { formatOfflineAt } from './lib/formatOfflineAt.ts';
import { formatOfflineSince } from './lib/formatOfflineSince.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  ChevronSlot,
  MainInfoSlot,
  NameSlot,
  NameText,
  OfflineInfoFallback,
  OfflineInfoMain,
  OfflineInfoRow,
  OfflineInfoSince,
  OfflineInfoTime,
  RowButton,
  StatusSlot,
  TaskSlot,
} from './styled.ts';
import type { ServiceStatusRowItem } from './types.ts';

interface OfflineServiceRowProps {
  expanded: boolean;
  item: ServiceStatusRowItem;
  onToggle: () => void;
}

export const OfflineServiceRow: React.FC<OfflineServiceRowProps> = ({
  expanded,
  item,
  onToggle,
}) => {
  const offlineFor = formatOfflineSince(item.offlineSince);
  const offlineAt = formatOfflineAt(item.offlineSince);

  return (
    <RowButton
      aria-expanded={expanded}
      offline
      onClick={onToggle}
      type='button'
      title={item.title}
    >
      <NameSlot>
        <NameText offline>{item.title}</NameText>
      </NameSlot>
      <StatusSlot>
        <StatusBadge status='offline' />
      </StatusSlot>
      <TaskSlot />
      <MainInfoSlot>
        {offlineFor || offlineAt ? (
          <OfflineInfoRow>
            <OfflineInfoMain>
              <AccessTimeRoundedIcon />
              <span>не в сети</span>
              {offlineFor ? (
                <OfflineInfoTime>{offlineFor}</OfflineInfoTime>
              ) : null}
            </OfflineInfoMain>
            {offlineAt ? (
              <OfflineInfoSince>· с {offlineAt}</OfflineInfoSince>
            ) : null}
          </OfflineInfoRow>
        ) : (
          <OfflineInfoFallback>метрики недоступны</OfflineInfoFallback>
        )}
      </MainInfoSlot>
      <ChevronSlot>
        {expanded ? (
          <KeyboardArrowDownRoundedIcon />
        ) : (
          <ChevronRightRoundedIcon />
        )}
      </ChevronSlot>
    </RowButton>
  );
};
