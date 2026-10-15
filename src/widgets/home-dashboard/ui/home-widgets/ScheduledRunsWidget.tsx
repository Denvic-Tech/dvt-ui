import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useGetScheduledRunsQuery } from '@/entities/home-widget';

import type { ScheduledRunsWidgetSchema } from '@/shared/gatewayClient';

import { StatusDot } from '../components/StatusDot';
import { formatUntil, pluralRu } from '../lib/date';
import { getRunTone, getRunToneLabel } from '../lib/runs';
import { hc, homeEllipsisSx, homeMonoFont } from '../styles/tokens';

import { WidgetQueryView } from './WidgetQueryView';
import { widgetEmptySx, widgetRowSx } from './widgetStyles';

export const SCHEDULED_RUNS_LIMIT = 8;
const POLLING_MS = 60_000;
const QUERY_ARG = { limit: SCHEDULED_RUNS_LIMIT };

export const ScheduledRunsWidget = () => {
  const query = useGetScheduledRunsQuery(QUERY_ARG, {
    pollingInterval: POLLING_MS,
  });

  return (
    <WidgetQueryView query={query} skeleton='list'>
      {data => <ScheduledRunsView data={data} />}
    </WidgetQueryView>
  );
};

const ScheduledRunsView = ({ data }: { data: ScheduledRunsWidgetSchema }) => {
  const active = Math.max(data.total_schedules - data.disabled_schedules, 0);
  const failed = data.items.filter(
    item => getRunTone(item.last_run_status) === 'err'
  ).length;
  const running = data.items.filter(
    item => getRunTone(item.last_run_status) === 'run'
  ).length;

  if (!data.items.length) {
    return (
      <Box sx={widgetEmptySx}>
        Расписаний пока нет — настройте запуск проекта по расписанию
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px 12px',
          fontSize: 12,
          color: hc.ink3,
          mb: 0.75,
          whiteSpace: 'nowrap',
        }}
      >
        <span>
          <Box component='b' sx={{ color: hc.ink, fontWeight: 600 }}>
            {active}
          </Box>{' '}
          {pluralRu(active, 'активное', 'активных', 'активных')}
        </span>
        {failed ? (
          <span>
            <Box component='b' sx={{ color: hc.err, fontWeight: 600 }}>
              {failed}
            </Box>{' '}
            с ошибкой
          </span>
        ) : null}
        {running ? (
          <span>
            <Box component='b' sx={{ color: hc.brand, fontWeight: 600 }}>
              {running}
            </Box>{' '}
            выполняется
          </span>
        ) : null}
      </Box>

      {data.items.map(item => {
        const tone = item.last_run_status
          ? getRunTone(item.last_run_status)
          : 'idle';
        const isError = tone === 'err';

        return (
          <Box
            key={item.project_id}
            component={RouterLink}
            to={`/project-editor/${item.project_id}`}
            sx={widgetRowSx}
          >
            <StatusDot tone={tone} />
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ ...homeEllipsisSx, fontSize: 12.5 }}>
                {item.project_name ?? 'Без названия'}
              </Box>
              <Box
                sx={{
                  ...homeEllipsisSx,
                  mt: '1px',
                  fontFamily: homeMonoFont,
                  fontSize: 11,
                  color: hc.ink3,
                }}
              >
                {item.cron}
              </Box>
            </Box>
            <Box
              sx={{
                textAlign: 'right',
                fontSize: 11.5,
                color: hc.ink3,
                whiteSpace: 'nowrap',
              }}
            >
              <Box sx={{ color: isError ? hc.err : hc.ink2 }}>
                {tone === 'idle' ? 'не запускался' : getRunToneLabel(tone)}
              </Box>
              <span>{formatUntil(item.next_run_time)}</span>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
