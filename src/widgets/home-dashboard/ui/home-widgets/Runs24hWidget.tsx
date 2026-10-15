import * as React from 'react';
import { Box, ButtonBase } from '@mui/material';

import { useGetRuns24hQuery } from '@/entities/home-widget';

import type {
  RunsBucketSchema,
  RunsLast24hWidgetSchema,
} from '@/shared/gatewayClient';

import { HomePortal } from '../components/HomePortal';
import { StatusDot, type StatusDotTone } from '../components/StatusDot';
import { formatClock, pluralRu } from '../lib/date';
import { useDismiss } from '../lib/useDismiss';
import { homePopAppearSx } from '../styles/motion';
import { hc, homeMonoFont, homePopoverSx } from '../styles/tokens';

import { WidgetQueryView } from './WidgetQueryView';
import { widgetBigNumberSx, widgetMetaSx } from './widgetStyles';

const POLLING_MS = 60_000;
const POPOVER_WIDTH = 240;

export const Runs24hWidget = () => {
  const query = useGetRuns24hQuery(undefined, { pollingInterval: POLLING_MS });

  return (
    <WidgetQueryView query={query} skeleton='chart'>
      {data => <Runs24hView data={data} />}
    </WidgetQueryView>
  );
};

const getBucketColor = (bucket: RunsBucketSchema): string => {
  if (bucket.error > 0) {
    return hc.err;
  }
  if (bucket.cancelled > 0) {
    return hc.warn;
  }
  if (bucket.running > 0) {
    return hc.brand;
  }
  return hc.brandBorder;
};

const toTime = (value: string) => new Date(value).getTime();

type SelectedBucket = { index: number; rect: DOMRect };

const Runs24hView = ({ data }: { data: RunsLast24hWidgetSchema }) => {
  const [selected, setSelected] = React.useState<SelectedBucket | null>(null);
  const max = Math.max(1, ...data.buckets.map(bucket => bucket.total));
  const ratio =
    data.success_ratio != null ? Math.round(data.success_ratio * 100) : null;
  const middle = data.buckets[Math.floor(data.buckets.length / 2)];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Box component='span' sx={widgetBigNumberSx}>
          {data.total}
        </Box>
        <Box component='span' sx={widgetMetaSx}>
          {pluralRu(data.total, 'запуск', 'запуска', 'запусков')}
          {ratio != null ? ` · ${ratio}% успешно` : ''}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(data.buckets.length, 1)}, 1fr)`,
          gap: '3px',
          alignItems: 'end',
          height: 44,
          mt: 1.25,
        }}
      >
        {data.buckets.map((bucket, index) => {
          const isSelected = selected?.index === index;
          const label = `${formatClock(toTime(bucket.start))} · ${bucket.total} ${pluralRu(bucket.total, 'запуск', 'запуска', 'запусков')}`;

          return (
            <ButtonBase
              key={bucket.start}
              disableRipple
              aria-label={label}
              title={label}
              onMouseDown={event => event.stopPropagation()}
              onClick={event => {
                const rect = event.currentTarget.getBoundingClientRect();
                setSelected(current =>
                  current?.index === index ? null : { index, rect }
                );
              }}
              sx={{
                display: 'block',
                width: '100%',
                height: bucket.total
                  ? `${Math.max((bucket.total / max) * 100, 8)}%`
                  : '2px',
                borderRadius: '2px',
                backgroundColor: bucket.total
                  ? getBucketColor(bucket)
                  : hc.line,
                transformOrigin: 'bottom',
                transition: 'transform .14s, filter .14s',
                transform: isSelected ? 'scale(1.25, 1.12)' : 'none',
                boxShadow: isSelected ? `0 0 0 1.5px ${hc.brand}` : 'none',
                '&:hover': {
                  transform: 'scale(1.25, 1.12)',
                  filter: 'brightness(.92)',
                },
              }}
            />
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: hc.ink4,
          mt: 0.75,
          fontFamily: homeMonoFont,
        }}
      >
        <span>{formatClock(toTime(data.window_start))}</span>
        {middle ? <span>{formatClock(toTime(middle.start))}</span> : null}
        <span>сейчас</span>
      </Box>

      {selected && data.buckets[selected.index] ? (
        <BucketPopover
          bucket={data.buckets[selected.index]}
          bucketMinutes={data.bucket_minutes}
          onClose={() => setSelected(null)}
          rect={selected.rect}
        />
      ) : null}
    </Box>
  );
};

type BucketPopoverProps = {
  bucket: RunsBucketSchema;
  bucketMinutes: number;
  onClose: () => void;
  rect: DOMRect;
};

const BucketPopover = ({
  bucket,
  bucketMinutes,
  onClose,
  rect,
}: BucketPopoverProps) => {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  useDismiss(true, [popoverRef], onClose, { closeOnScroll: true });

  const start = toTime(bucket.start);
  const end = start + bucketMinutes * 60_000;
  const left = Math.max(
    8,
    Math.min(
      window.innerWidth - POPOVER_WIDTH - 8,
      rect.left + rect.width / 2 - POPOVER_WIDTH / 2
    )
  );
  const below = window.innerHeight - rect.bottom >= 200;
  const rows: { count: number; label: string; tone: StatusDotTone }[] = [
    { label: 'успешно', count: bucket.success, tone: 'ok' },
    { label: 'с ошибкой', count: bucket.error, tone: 'err' },
    { label: 'отменено', count: bucket.cancelled, tone: 'warn' },
    { label: 'выполняется', count: bucket.running, tone: 'run' },
  ];

  return (
    <HomePortal>
      <Box
        ref={popoverRef}
        role='dialog'
        aria-label='Запуски за интервал'
        sx={{
          ...homePopoverSx,
          ...homePopAppearSx,
          position: 'fixed',
          zIndex: 1400,
          left,
          width: POPOVER_WIDTH,
          ...(below
            ? { top: rect.bottom + 8 }
            : { bottom: window.innerHeight - rect.top + 8 }),
          p: '12px 14px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Box
            component='span'
            sx={{ fontSize: 13.5, fontWeight: 600, fontFamily: homeMonoFont }}
          >
            {formatClock(start)}–{formatClock(end)}
          </Box>
          <Box component='span' sx={{ fontSize: 12, color: hc.ink3 }}>
            {bucket.total}{' '}
            {pluralRu(bucket.total, 'запуск', 'запуска', 'запусков')}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {rows.map(row => (
            <Box
              key={row.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: 12.5,
                color: row.count ? hc.ink : hc.ink4,
              }}
            >
              <StatusDot tone={row.count ? row.tone : 'idle'} size={6} />
              <Box component='span' sx={{ flex: 1 }}>
                {row.label}
              </Box>
              <Box
                component='span'
                sx={{ fontFamily: homeMonoFont, fontSize: 12 }}
              >
                {row.count}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </HomePortal>
  );
};
