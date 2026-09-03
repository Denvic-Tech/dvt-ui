import React from 'react';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ComputerRoundedIcon from '@mui/icons-material/ComputerRounded';

import type { SystemInfo, WorkerSystemInfo } from '@/shared/gatewayClient';
import { AlertDescription, AlertTitle } from '@/shared/ui';

import { formatOfflineAt } from './lib/formatOfflineAt.ts';
import { formatOfflineSince } from './lib/formatOfflineSince.ts';
import { DetailField } from './DetailField.tsx';
import { DetailsGrid, ExpandedOffline, OfflineAlert } from './styled.ts';

interface ServiceRowOfflineExpandedProps {
  data: SystemInfo | WorkerSystemInfo | null;
  offlineSince?: number | null | undefined;
}

export const ServiceRowOfflineExpanded: React.FC<
  ServiceRowOfflineExpandedProps
> = ({ data, offlineSince }) => {
  const offlineAt = formatOfflineAt(offlineSince);
  const offlineFor = formatOfflineSince(offlineSince);

  const detailFields = [
    data?.hostname
      ? {
          icon: <ComputerRoundedIcon />,
          label: 'Хост',
          mono: true,
          value: data.hostname,
        }
      : null,
    offlineAt
      ? {
          icon: <AccessTimeRoundedIcon />,
          label: 'Оффлайн с',
          mono: true,
          value: offlineAt,
        }
      : null,
    offlineFor
      ? {
          icon: <BlockRoundedIcon />,
          label: 'Длительность',
          mono: true,
          value: offlineFor,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: React.ReactNode;
    label: string;
    mono?: boolean;
    value: string;
  }>;

  return (
    <ExpandedOffline>
      <OfflineAlert variant='destructive'>
        <AlertTitle>
          Сервис оффлайн или не отвечает на запросы статуса
        </AlertTitle>
        <AlertDescription sx={{ fontSize: 11, color: '#7f1d1d' }}>
          {offlineAt ? (
            <>
              С {offlineAt}
              {offlineFor ? (
                <>
                  {' '}
                  (<strong>{offlineFor}</strong> назад)
                </>
              ) : null}
              . Метрики ресурсов недоступны.
            </>
          ) : (
            'Метрики ресурсов недоступны.'
          )}
        </AlertDescription>
      </OfflineAlert>

      {detailFields.length > 0 ? (
        <DetailsGrid>
          {detailFields.map(field => (
            <DetailField
              key={field.label}
              icon={field.icon}
              label={field.label}
              mono={field.mono}
              value={field.value}
            />
          ))}
        </DetailsGrid>
      ) : null}
    </ExpandedOffline>
  );
};
