import React from 'react';

export const FolderIcon = ({
  size = 16,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M2 4.2A1.2 1.2 0 0 1 3.2 3h2.6l1.4 1.6h5.6A1.2 1.2 0 0 1 14 5.8v6A1.2 1.2 0 0 1 12.8 13H3.2A1.2 1.2 0 0 1 2 11.8V4.2z'
      stroke={color}
      strokeWidth='1.4'
      strokeLinejoin='round'
    />
  </svg>
);

export const ExpressionIcon = ({
  size = 14,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <path
      d='M4 3L2 8l2 5M12 3l2 5-2 5'
      stroke={color}
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M6.5 10.5l3-5M6.5 5.5l3 5'
      stroke={color}
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </svg>
);

export const InfoIcon = ({
  size = 13,
  color = 'currentColor',
}: {
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size} viewBox='0 0 16 16' fill='none'>
    <circle cx='8' cy='8' r='6.3' stroke={color} strokeWidth='1.4' />
    <path
      d='M8 7.5v3.5M8 4.8v.1'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);
