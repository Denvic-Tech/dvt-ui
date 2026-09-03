import * as React from 'react';
import Paper, { type PaperProps } from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';

import { mergeSx } from './control-styles';
import { getRadius, getSurfaceShadow } from './theme-style-helpers';

type PanelPadding = 'lg' | 'md' | 'none' | 'sm';
type PanelVariant = 'default' | 'muted' | 'subtle';

const paddingByVariant: Record<PanelPadding, number> = {
  none: 2,
  sm: 1.5,
  md: 2,
  lg: 2.5,
};

type PanelProps = Omit<PaperProps, 'variant'> & {
  padding?: PanelPadding;
  variant?: PanelVariant;
};

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ padding = 'none', variant = 'default', sx, ...props }, ref) => (
    <Paper
      ref={ref}
      elevation={0}
      sx={mergeSx(theme => {
        const paper = theme.palette.background.paper;

        return {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: getRadius(theme),
          border: '1px solid',
          borderColor: 'divider',
          background:
            variant === 'muted'
              ? alpha(
                  theme.palette.mode === 'light'
                    ? '#f7f8fc'
                    : theme.palette.background.paper,
                  theme.palette.mode === 'light' ? 0.82 : 0.68
                )
              : variant === 'subtle'
                ? alpha(paper, theme.palette.mode === 'light' ? 0.58 : 0.42)
                : `linear-gradient(180deg, ${alpha(paper, theme.palette.mode === 'light' ? 0.9 : 0.82)} 0%, ${alpha(paper, theme.palette.mode === 'light' ? 0.78 : 0.68)} 100%)`,
          boxShadow:
            variant === 'default'
              ? getSurfaceShadow(theme, 'md')
              : getSurfaceShadow(theme, 'xs'),
          backdropFilter: 'blur(18px)',
          p: paddingByVariant[padding],
        };
      }, sx)}
      {...props}
    />
  )
);

Panel.displayName = 'Panel';

export { Panel };
