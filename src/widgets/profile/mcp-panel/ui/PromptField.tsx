import { Box, Typography } from '@mui/material';

import {
  buildConnectPrompt,
  CONNECT_PROMPT_FALLBACK,
  CONNECT_PROMPT_INTRO,
} from '../lib/connectPrompt';

import { copyHostSx, CopyIconButton } from './CopyIconButton';
import {
  hiddenContentSx,
  REVEAL_FIELD_BACKGROUND,
  RevealOverlay,
} from './RevealOverlay';
import { MONO_FONT_FAMILY } from './styles';

// Shown only under the blur, while the link does not exist yet.
const HIDDEN_LINK_PLACEHOLDER = '/api/agents/connect/XXXX-XXXX.md';

type PromptFieldProps = {
  url: string | null;
  canReveal: boolean;
  onReveal: () => void;
};

export const PromptField = ({ url, canReveal, onReveal }: PromptFieldProps) => {
  const isHidden = url === null;
  const visibleUrl =
    url ?? `${window.location.origin}${HIDDEN_LINK_PLACEHOLDER}`;

  return (
    <Box
      sx={{
        ...copyHostSx,
        py: 1.75,
        pl: 2,
        pr: 6,
        borderRadius: '12px',
        bgcolor: REVEAL_FIELD_BACKGROUND,
      }}
    >
      <Box
        aria-hidden={isHidden}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          color: '#1B1F2A',
          fontSize: 14,
          lineHeight: '22px',
          transition: 'filter 200ms ease',
          ...(isHidden ? hiddenContentSx : {}),
        }}
      >
        <Typography component='p' sx={{ font: 'inherit', m: 0 }}>
          {CONNECT_PROMPT_INTRO}
        </Typography>
        <Typography
          component='p'
          noWrap
          sx={{
            m: 0,
            color: '#4343D6',
            fontFamily: MONO_FONT_FAMILY,
            fontSize: 12.5,
            lineHeight: '20px',
          }}
        >
          {url === null ? (
            visibleUrl
          ) : (
            <Box
              component='a'
              href={url}
              target='_blank'
              rel='noopener noreferrer'
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                textUnderlineOffset: '3px',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {url}
            </Box>
          )}
        </Typography>
        <Typography component='p' sx={{ font: 'inherit', m: 0 }}>
          {CONNECT_PROMPT_FALLBACK}
        </Typography>
      </Box>

      {url !== null ? (
        <CopyIconButton
          text={buildConnectPrompt(url)}
          label='Скопировать промпт'
          persistent
        />
      ) : (
        <RevealOverlay
          label='Показать промпт'
          disabled={!canReveal}
          onClick={onReveal}
        />
      )}
    </Box>
  );
};
