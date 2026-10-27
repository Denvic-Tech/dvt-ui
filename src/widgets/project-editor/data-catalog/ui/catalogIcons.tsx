import type { ReactNode } from 'react';

const icon = (paths: ReactNode) => {
  const Icon = ({ size = 14 }: { size?: number }) => (
    <svg
      aria-hidden='true'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {paths}
    </svg>
  );
  return Icon;
};

export const SearchIcon = icon(
  <>
    <circle cx='11' cy='11' r='7' />
    <path d='m20 20-3.5-3.5' />
  </>
);

export const CloseIcon = icon(<path d='M6 6l12 12M18 6 6 18' />);

export const ChevronIcon = icon(<path d='m9 6 6 6-6 6' />);

export const TableIcon = icon(
  <>
    <rect x='3.5' y='4.5' width='17' height='15' rx='2.5' />
    <path d='M3.5 9.5h17M9.5 9.5v10' />
  </>
);

export const FormulaIcon = icon(
  <>
    <path d='M14.5 4.5h-1.5a2.5 2.5 0 0 0-2.5 2.5v11a2.5 2.5 0 0 1-2.5 2.5H6.5M7 11h7' />
    <path d='m15 13 4.5 5M19.5 13 15 18' />
  </>
);
