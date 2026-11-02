import * as React from 'react';
import { Box } from '@mui/material';

import { copyHostSx, CopyIconButton } from './CopyIconButton';
import {
  hiddenContentSx,
  REVEAL_FIELD_BACKGROUND,
  RevealOverlay,
} from './RevealOverlay';
import { MONO_FONT_FAMILY } from './styles';

type TokenSecretFieldProps = {
  secret: string;
};

export const TokenSecretField = ({ secret }: TokenSecretFieldProps) => {
  const [isRevealed, setIsRevealed] = React.useState(false);

  return (
    <Box
      sx={{
        ...copyHostSx,
        py: 1.25,
        pl: 2,
        pr: 6,
        borderRadius: '12px',
        bgcolor: REVEAL_FIELD_BACKGROUND,
      }}
    >
      <Box
        component='code'
        aria-hidden={!isRevealed}
        sx={{
          display: 'block',
          color: '#1B1F2A',
          fontFamily: MONO_FONT_FAMILY,
          fontSize: 13,
          lineHeight: '20px',
          wordBreak: 'break-all',
          transition: 'filter 200ms ease',
          ...(isRevealed ? {} : hiddenContentSx),
        }}
      >
        {/* The real value stays out of the DOM until it is asked for. */}
        {isRevealed ? secret : secret.replace(/[^-_.]/g, 'x')}
      </Box>

      {isRevealed ? (
        <CopyIconButton text={secret} label='Скопировать токен' top={5} />
      ) : (
        <RevealOverlay
          label='Показать токен'
          onClick={() => setIsRevealed(true)}
        />
      )}
    </Box>
  );
};
