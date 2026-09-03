import * as React from 'react';
import { type ComponentProps } from 'react';

import { Button, type ButtonProps } from './button.tsx';

type IconButtonSize = 'xs' | 'sm' | 'default' | 'lg';

export interface IconButtonProps
  extends Omit<ButtonProps, 'size' | 'children'> {
  size?: IconButtonSize;
  children: NonNullable<ComponentProps<typeof Button>['children']>;
}

const sizeMap: Record<IconButtonSize, NonNullable<ButtonProps['size']>> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  default: 'icon',
  lg: 'icon-lg',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'sm', variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} size={sizeMap[size]} variant={variant} {...props} />
  )
);
IconButton.displayName = 'IconButton';
