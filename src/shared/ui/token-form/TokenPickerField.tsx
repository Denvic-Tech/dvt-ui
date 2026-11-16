import * as React from 'react';
import { Box, Popover } from '@mui/material';

import { fieldTriggerSx } from './styles';

const POPOVER_GAP = 6;

type TokenPickerFieldProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  // Used to open upwards when the popover would not fit below the field.
  estimatedHeight: number;
  onOpen?: () => void;
  children: (close: () => void) => React.ReactNode;
};

export const TokenPickerField = ({
  label,
  value,
  icon,
  estimatedHeight,
  onOpen,
  children,
}: TokenPickerFieldProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [opensUp, setOpensUp] = React.useState(false);

  const close = () => setAnchor(null);

  const open = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const height = estimatedHeight + POPOVER_GAP;

    setOpensUp(
      rect.bottom + height > window.innerHeight && rect.top - height > 0
    );
    setAnchor(element);
    onOpen?.();
  };

  return (
    <>
      <Box
        component='button'
        type='button'
        aria-label={label}
        aria-haspopup='dialog'
        aria-expanded={anchor !== null}
        onClick={event => open(event.currentTarget)}
        sx={fieldTriggerSx}
      >
        <Box
          component='span'
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Box>
        {icon}
      </Box>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        disableScrollLock
        transitionDuration={{ enter: 100, exit: 0 }}
        anchorOrigin={{
          vertical: opensUp ? 'top' : 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: opensUp ? 'bottom' : 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': label,
            sx: {
              boxSizing: 'border-box',
              width: anchor?.offsetWidth,
              mt: `${opensUp ? -POPOVER_GAP : POPOVER_GAP}px`,
              p: 1,
              border: '1px solid #E3E7EF',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(20, 24, 40, 0.14)',
              backgroundImage: 'none',
            },
          },
        }}
      >
        {children(close)}
      </Popover>
    </>
  );
};
