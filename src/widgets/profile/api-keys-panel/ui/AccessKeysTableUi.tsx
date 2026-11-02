import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

export type AccessKeyVisualStatus = 'active' | 'expiring' | 'expired';

export const getAccessKeyVisualStatus = (
  expiresAt?: number | null
): AccessKeyVisualStatus => {
  if (!expiresAt) return 'active';

  const expiration = dayjs.unix(expiresAt);
  if (expiration.isBefore(dayjs())) return 'expired';
  if (expiration.isBefore(dayjs().add(30, 'day'))) return 'expiring';

  return 'active';
};

const statusPresentation: Record<
  AccessKeyVisualStatus,
  { label: string; background: string; foreground: string }
> = {
  active: {
    label: 'Активен',
    background: 'rgba(16, 185, 129, 0.1)',
    foreground: '#16805b',
  },
  expiring: {
    label: 'Скоро истекает',
    background: 'rgba(245, 158, 11, 0.14)',
    foreground: '#9a5b00',
  },
  expired: {
    label: 'Истёк',
    background: 'rgba(148, 163, 184, 0.12)',
    foreground: '#9aa1ad',
  },
};

export const AccessKeyStatusBadge = ({
  status,
}: {
  status: AccessKeyVisualStatus;
}) => {
  const presentation = statusPresentation[status];

  return (
    <Chip
      size='small'
      icon={<FiberManualRecordRoundedIcon />}
      label={presentation.label}
      sx={{
        height: 21,
        bgcolor: presentation.background,
        color: presentation.foreground,
        fontSize: 10.5,
        fontWeight: 600,
        '& .MuiChip-label': { px: 0.85 },
        '& .MuiChip-icon': {
          ml: 0.75,
          mr: -0.45,
          color: 'inherit',
          fontSize: 8,
        },
      }}
    />
  );
};

export const AccessKeyIconBox = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      width: 36,
      height: 36,
      flex: '0 0 36px',
      display: 'grid',
      placeItems: 'center',
      borderRadius: '9px',
      bgcolor: 'rgba(99, 102, 241, 0.09)',
      color: '#6366f1',
      '& svg': { fontSize: 18 },
    }}
  >
    {children}
  </Box>
);

export const AccessKeysInfoBar = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <Stack
    direction='row'
    alignItems='center'
    gap={1}
    sx={{
      minHeight: 38,
      px: 2.5,
      py: 0.75,
      bgcolor: 'rgba(248, 250, 252, 0.8)',
      borderBottom: 1,
      borderColor: 'divider',
      color: 'text.secondary',
    }}
  >
    <InfoOutlinedIcon sx={{ color: 'primary.main', fontSize: 15 }} />
    <Typography component='div' sx={{ fontSize: 12.5, lineHeight: 1.45 }}>
      {children}
    </Typography>
  </Stack>
);

export const AccessKeysTableSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <>
    {Array.from({ length: rows }, (_, index) => (
      <Box
        key={index}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(280px, 1fr) 166px 176px 44px',
          },
          alignItems: 'center',
          minHeight: 64,
          px: 2.5,
          py: 0.75,
          borderBottom: 1,
          borderColor: 'divider',
          '&:last-child': { borderBottom: 0 },
        }}
      >
        <Stack direction='row' alignItems='center' gap={1.35}>
          <Skeleton
            variant='rounded'
            animation='wave'
            width={36}
            height={36}
            sx={{ flexShrink: 0, borderRadius: '9px' }}
          />
          <Box>
            <Skeleton animation='wave' width={118} height={18} />
            <Skeleton animation='wave' width={164} height={16} />
          </Box>
        </Stack>

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Skeleton animation='wave' width={78} height={17} />
          <Skeleton animation='wave' width={92} height={15} />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Skeleton animation='wave' width={84} height={17} />
        </Box>
      </Box>
    ))}
  </>
);

export const CreatedAtCell = ({ value }: { value: string }) => {
  const createdAt = dayjs(value);

  return (
    <Box>
      <Typography
        sx={{ fontSize: 12.5, color: 'text.primary', lineHeight: 1.4 }}
      >
        {createdAt.format('DD.MM.YYYY')}
      </Typography>
      <Typography
        sx={{ fontSize: 11.5, color: 'text.disabled', lineHeight: 1.35 }}
      >
        {createdAt.fromNow()}
      </Typography>
    </Box>
  );
};

export const ExpiresAtCell = ({
  value,
  status,
}: {
  value?: number | null;
  status: AccessKeyVisualStatus;
}) => (
  <Typography
    sx={{
      fontSize: 12.5,
      fontWeight: status === 'active' ? 400 : 600,
      color:
        status === 'expired'
          ? 'error.main'
          : status === 'expiring'
            ? '#9a5b00'
            : 'text.secondary',
    }}
  >
    {value ? dayjs.unix(value).format('DD.MM.YYYY') : 'Бессрочный'}
  </Typography>
);
