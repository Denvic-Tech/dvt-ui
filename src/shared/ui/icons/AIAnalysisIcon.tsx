import React, { useId } from 'react';
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

export const AIAnalysisIcon = (props: SvgIconProps) => {
  const rawGradientId = useId();
  const gradientId = rawGradientId.replace(/:/g, '');

  return (
    <SvgIcon {...props} viewBox='0 0 24 24'>
      <defs>
        <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#6366f1' />
          <stop offset='100%' stopColor='#8b5cf6' />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d='M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zM11.5 9L9 3.5 6.5 9 1 11.5 6.5 14 9 19.5l2.5-5.5 5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25z'
      />
    </SvgIcon>
  );
};
