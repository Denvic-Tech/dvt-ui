import { Box } from '@mui/material';

import { homeLiveRingSx } from '@/shared/ui/home-theme/motion';
import { hc } from '@/shared/ui/home-theme/tokens';

import type { RunTone } from './runs';

export type StatusDotTone = RunTone | 'idle';

const DOT_COLORS: Record<StatusDotTone, string> = {
  ok: hc.ok,
  err: hc.err,
  warn: hc.warn,
  run: hc.brand,
  queue: hc.ink4,
  none: hc.idle,
  idle: hc.idle,
};

type StatusDotProps = {
  size?: number;
  title?: string | undefined;
  tone: StatusDotTone;
};

export const StatusDot = ({ size = 7, title, tone }: StatusDotProps) => {
  const color = DOT_COLORS[tone];

  return (
    <Box
      component='span'
      title={title}
      sx={{
        width: size,
        height: size,
        borderRadius: '99px',
        backgroundColor: color,
        flexShrink: 0,
        ...(tone === 'run' ? homeLiveRingSx(color) : null),
      }}
    />
  );
};
