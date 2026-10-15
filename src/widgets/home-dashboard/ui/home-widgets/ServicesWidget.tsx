import { Box } from '@mui/material';

import { useGetServicesQuery } from '@/entities/home-widget';

import type {
  ServiceStatusItemSchema,
  ServicesWidgetSchema,
} from '@/shared/gatewayClient';

import { StatusDot, type StatusDotTone } from '../components/StatusDot';
import { hc, homeMonoFont } from '../styles/tokens';

import { WidgetQueryView } from './WidgetQueryView';

const POLLING_MS = 30_000;

const SERVICE_LABELS: Record<ServiceStatusItemSchema['name'], string> = {
  gateway: 'Gateway',
  project_scheduler: 'Планировщик',
  orchestrator: 'Оркестратор',
};

export const ServicesWidget = () => {
  const query = useGetServicesQuery(undefined, { pollingInterval: POLLING_MS });

  return (
    <WidgetQueryView query={query} skeleton='compact-list'>
      {data => <ServicesView data={data} />}
    </WidgetQueryView>
  );
};

const rowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  fontSize: 12.5,
  color: hc.ink,
} as const;

const ServicesView = ({ data }: { data: ServicesWidgetSchema }) => {
  const workersTone: StatusDotTone =
    data.workers.online === 0
      ? 'err'
      : data.workers.online < data.workers.total
        ? 'warn'
        : 'ok';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {data.services.map(service => {
        const online = service.status === 'online';

        return (
          <Box key={service.name} sx={rowSx}>
            <StatusDot tone={online ? 'ok' : 'err'} size={6} />
            <Box component='span' sx={{ flex: 1 }}>
              {SERVICE_LABELS[service.name] ?? service.name}
            </Box>
            <Box
              component='span'
              sx={{
                fontFamily: homeMonoFont,
                fontSize: 11.5,
                color: online ? hc.ink3 : hc.err,
              }}
            >
              {!online
                ? 'offline'
                : service.latency_ms != null
                  ? `${Math.round(service.latency_ms)} ms`
                  : 'online'}
            </Box>
          </Box>
        );
      })}
      <Box sx={rowSx}>
        <StatusDot tone={workersTone} size={6} />
        <Box component='span' sx={{ flex: 1 }}>
          Воркеры
        </Box>
        <Box
          component='span'
          sx={{ fontFamily: homeMonoFont, fontSize: 11.5, color: hc.ink3 }}
        >
          {data.workers.online}/{data.workers.total} · заняты{' '}
          {data.workers.busy}
        </Box>
      </Box>
    </Box>
  );
};
