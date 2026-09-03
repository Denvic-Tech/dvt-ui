import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const BaseIcon = (props: IconProps) => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
    {...props}
  />
);

export const RecordIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect x='3' y='3' width='18' height='18' rx='2' />
    <line x1='3' y1='9' x2='21' y2='9' />
  </BaseIcon>
);

export const KeepIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='20 6 9 17 4 12' />
  </BaseIcon>
);

export const ExcludeIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </BaseIcon>
);

export const MetaIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx='12' cy='12' r='10' />
    <line x1='12' y1='16' x2='12' y2='12' />
    <line x1='12' y1='8' x2='12.01' y2='8' />
  </BaseIcon>
);

export const ExplodeIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='15 3 21 3 21 9' />
    <polyline points='9 21 3 21 3 15' />
    <line x1='21' y1='3' x2='14' y2='10' />
    <line x1='3' y1='21' x2='10' y2='14' />
  </BaseIcon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='6 9 12 15 18 9' />
  </BaseIcon>
);

export const ChevronRightIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='9 6 15 12 9 18' />
  </BaseIcon>
);

export const SearchIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx='11' cy='11' r='8' />
    <line x1='21' y1='21' x2='16.65' y2='16.65' />
  </BaseIcon>
);

export const WarningIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' />
    <line x1='12' y1='9' x2='12' y2='13' />
    <line x1='12' y1='17' x2='12.01' y2='17' />
  </BaseIcon>
);

export const CloseIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </BaseIcon>
);

export const FilterIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polygon points='22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' />
  </BaseIcon>
);

export const CollapseAllIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='4 14 10 14 10 20' />
    <polyline points='20 10 14 10 14 4' />
    <line x1='14' y1='10' x2='21' y2='3' />
    <line x1='3' y1='21' x2='10' y2='14' />
  </BaseIcon>
);

export const ExpandAllIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <polyline points='15 3 21 3 21 9' />
    <polyline points='9 21 3 21 3 15' />
    <line x1='21' y1='3' x2='14' y2='10' />
    <line x1='3' y1='21' x2='10' y2='14' />
  </BaseIcon>
);

export const SplitLayoutIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect x='3' y='3' width='18' height='18' rx='2' />
    <line x1='15' y1='3' x2='15' y2='21' />
  </BaseIcon>
);

export const TreeOnlyLayoutIcon = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect x='3' y='3' width='18' height='18' rx='2' />
  </BaseIcon>
);
