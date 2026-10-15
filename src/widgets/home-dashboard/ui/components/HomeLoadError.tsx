import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, ButtonBase } from '@mui/material';

import { hc } from '../styles/tokens';

type HomeLoadErrorProps = {
  /** Small inline variant for widget cards: muted icon, no description. */
  compact?: boolean;
  onRetry: () => void;
  text?: string;
  title: string;
};

export const HomeLoadError = ({
  compact = false,
  onRetry,
  text,
  title,
}: HomeLoadErrorProps) => (
  <Box
    role='alert'
    sx={{
      flex: 1,
      height: compact ? '100%' : undefined,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      px: compact ? 1.5 : 3,
      py: compact ? 1 : 2.5,
      minHeight: 0,
    }}
  >
    <Box
      component='span'
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(compact
          ? { color: hc.ink4, mb: 1 }
          : {
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: hc.errSoft,
              color: hc.err,
              mb: 1.5,
            }),
      }}
    >
      <CloudOffOutlinedIcon sx={{ fontSize: 19 }} />
    </Box>
    <Box
      sx={
        compact
          ? { fontSize: 12.5, color: hc.ink3 }
          : {
              fontSize: 14,
              fontWeight: 600,
              color: hc.ink,
              letterSpacing: '-0.1px',
            }
      }
    >
      {title}
    </Box>
    {text && !compact ? (
      <Box
        sx={{
          fontSize: 12.5,
          color: hc.ink3,
          mt: 0.5,
          maxWidth: 340,
          lineHeight: 1.45,
          textWrap: 'pretty',
        }}
      >
        {text}
      </Box>
    ) : null}
    <ButtonBase
      disableRipple
      onClick={onRetry}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        mt: compact ? 0.5 : 1.25,
        px: compact ? 0.5 : 0.75,
        py: compact ? 0.25 : 0.5,
        borderRadius: '6px',
        color: hc.brand,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'inherit',
        '&:hover': { color: hc.brandStrong },
      }}
    >
      <RefreshRoundedIcon sx={{ fontSize: 15 }} />
      Повторить
    </ButtonBase>
  </Box>
);
