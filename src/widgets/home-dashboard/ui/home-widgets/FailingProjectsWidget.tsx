import { Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useGetFailingProjectsQuery } from '@/entities/home-widget';

import type { FailingProjectsWidgetSchema } from '@/shared/gatewayClient';

import { StatusDot } from '../components/StatusDot';
import { formatOpenedAt, pluralRu } from '../lib/date';
import { hc, homeEllipsisSx } from '../styles/tokens';

import { WidgetQueryView } from './WidgetQueryView';
import { widgetBadgeSx, widgetEmptySx, widgetRowSx } from './widgetStyles';

export const FAILING_PROJECTS_LIMIT = 8;
const POLLING_MS = 120_000;
const QUERY_ARG = { limit: FAILING_PROJECTS_LIMIT };

export const FailingProjectsWidget = () => {
  const query = useGetFailingProjectsQuery(QUERY_ARG, {
    pollingInterval: POLLING_MS,
  });

  return (
    <WidgetQueryView query={query} skeleton='list'>
      {data => <FailingProjectsView data={data} />}
    </WidgetQueryView>
  );
};

const FailingProjectsView = ({
  data,
}: {
  data: FailingProjectsWidgetSchema;
}) => {
  if (!data.items.length) {
    return <Box sx={widgetEmptySx}>За 7 дней проектов с ошибками нет</Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ fontSize: 12, color: hc.ink3, mb: 0.75 }}>
        Ошибки запусков за 7 дней
      </Box>
      {data.items.map(item => (
        <Box
          key={item.project_id}
          component={RouterLink}
          to={`/project-editor/${item.project_id}`}
          sx={widgetRowSx}
        >
          <StatusDot tone='err' />
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 0,
              }}
            >
              <Box sx={{ ...homeEllipsisSx, fontSize: 12.5 }}>
                {item.project_name ?? 'Без названия'}
              </Box>
              {item.consecutive_failures > 1 ? (
                <Box
                  component='span'
                  title='Последние запуски подряд завершились ошибкой'
                  sx={widgetBadgeSx(hc.err, hc.errSoft)}
                >
                  {item.consecutive_failures} подряд
                </Box>
              ) : null}
            </Box>
            <Box sx={{ mt: '1px', fontSize: 11.5, color: hc.ink3 }}>
              {item.error_count}{' '}
              {pluralRu(item.error_count, 'ошибка', 'ошибки', 'ошибок')} из{' '}
              {item.total_count}
            </Box>
          </Box>
          <Box
            title={new Date(item.last_error_at).toLocaleString('ru-RU')}
            sx={{ fontSize: 11.5, color: hc.ink3, whiteSpace: 'nowrap' }}
          >
            {formatOpenedAt(item.last_error_at)}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
