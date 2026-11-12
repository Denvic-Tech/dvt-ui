import { Tooltip } from '@mui/material';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { IconButtonBase } from './controls';

type ToolbarIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type'
> & {
  label: string;
  active?: boolean;
  children: ReactNode;
};

export const ToolbarIconButton = ({
  label,
  active = false,
  children,
  ...buttonProps
}: ToolbarIconButtonProps) => (
  <Tooltip title={label} placement='bottom' enterDelay={400} disableInteractive>
    <span style={{ display: 'inline-flex', flex: 'none' }}>
      <IconButtonBase
        type='button'
        aria-label={label}
        active={active}
        {...buttonProps}
      >
        {children}
      </IconButtonBase>
    </span>
  </Tooltip>
);
