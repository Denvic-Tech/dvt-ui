import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number;
};

const Svg = ({ size = 15, ...props }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 16 16'
    fill='none'
    stroke='currentColor'
    aria-hidden='true'
    focusable='false'
    {...props}
  />
);

export const ChevronRightIcon = (props: IconProps) => (
  <Svg
    size={12}
    strokeWidth={1.8}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M6 3.5L10.5 8 6 12.5' />
  </Svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Svg
    size={14}
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M4.5 6.5L8 10l3.5-3.5' />
  </Svg>
);

export const DatabaseIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} {...props}>
    <ellipse cx='8' cy='3.8' rx='5.5' ry='2' />
    <path d='M2.5 3.8v8.4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.8M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2' />
  </Svg>
);

export const SchemaIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} strokeLinejoin='round' {...props}>
    <path d='M2 4.5A1 1 0 0 1 3 3.5h3.2l1.3 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z' />
  </Svg>
);

export const TableIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} {...props}>
    <rect x='2' y='2.5' width='12' height='11' rx='2' />
    <path d='M2 6.5h12M6 6.5v7' />
  </Svg>
);

export const SearchIcon = (props: IconProps) => (
  <Svg size={14} strokeWidth={1.6} {...props}>
    <circle cx='7' cy='7' r='4.5' />
    <path d='M10.5 10.5L14 14' strokeLinecap='round' />
  </Svg>
);

export const LocateIcon = (props: IconProps) => (
  <Svg strokeWidth={1.5} strokeLinecap='round' {...props}>
    <circle cx='8' cy='8' r='4.5' />
    <circle cx='8' cy='8' r='1.2' fill='currentColor' stroke='none' />
    <path d='M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2' />
  </Svg>
);

export const CollapseAllIcon = (props: IconProps) => (
  <Svg
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M4.5 2.5L8 6l3.5-3.5M4.5 13.5L8 10l3.5 3.5' />
  </Svg>
);

export const MoreIcon = (props: IconProps) => (
  <Svg stroke='none' {...props}>
    <circle cx='3.5' cy='8' r='1.3' fill='currentColor' />
    <circle cx='8' cy='8' r='1.3' fill='currentColor' />
    <circle cx='12.5' cy='8' r='1.3' fill='currentColor' />
  </Svg>
);

export const CodeIcon = (props: IconProps) => (
  <Svg
    strokeWidth={1.5}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5' />
  </Svg>
);

export const RefreshIcon = (props: IconProps) => (
  <Svg
    strokeWidth={1.5}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3' />
  </Svg>
);

export const BackIcon = (props: IconProps) => (
  <Svg
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M13 8H3.5M7.5 4L3.5 8l4 4' />
  </Svg>
);

export const CheckIcon = (props: IconProps) => (
  <Svg
    size={10}
    strokeWidth={2.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M3 8.5l3.2 3.2L13 4.8' />
  </Svg>
);

export const InfoIcon = (props: IconProps) => (
  <Svg size={13} strokeWidth={1.5} {...props}>
    <circle cx='8' cy='8' r='6' />
    <path d='M8 7.2v3.6' strokeLinecap='round' />
    <circle cx='8' cy='5' r='.4' fill='currentColor' />
  </Svg>
);

export const CloseIcon = (props: IconProps) => (
  <Svg size={12} strokeWidth={1.8} strokeLinecap='round' {...props}>
    <path d='M4 4l8 8M12 4l-8 8' />
  </Svg>
);

export const ChevronUpIcon = (props: IconProps) => (
  <Svg
    size={14}
    strokeWidth={1.6}
    strokeLinecap='round'
    strokeLinejoin='round'
    {...props}
  >
    <path d='M4.5 9.5L8 6l3.5 3.5' />
  </Svg>
);

export const CopyIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} strokeLinejoin='round' {...props}>
    <rect x='5.5' y='5.5' width='8' height='8' rx='1.6' />
    <path d='M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5' />
  </Svg>
);

export const PlusIcon = (props: IconProps) => (
  <Svg strokeWidth={1.6} strokeLinecap='round' {...props}>
    <path d='M8 4v8M4 8h8' />
  </Svg>
);

/**
 * Таблица-черновик: ещё не создана, рамка пунктиром. Контур TableIcon
 * (12×11, r=2) собран из сплошных скруглённых углов и штриха посередине
 * каждой стороны с равными зазорами — пунктир не рвётся на скруглениях.
 */
export const DraftTableIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} {...props}>
    <path d='M2 5.5v-1a2 2 0 0 1 2-2h1.2M10.8 2.5H12a2 2 0 0 1 2 2v1M14 10.5v1a2 2 0 0 1-2 2h-1.2M5.2 13.5H4a2 2 0 0 1-2-2v-1M6.7 2.5h2.6M6.7 13.5h2.6M2 7v2M14 7v2' />
  </Svg>
);

export const DatabasePlusIcon = (props: IconProps) => (
  <Svg strokeWidth={1.5} strokeLinecap='round' {...props}>
    <ellipse cx='7' cy='3.8' rx='4.8' ry='1.8' />
    <path d='M2.2 3.8v7.4c0 1 2.1 1.8 4.8 1.8M11.8 3.8v2.7M2.2 7.5c0 1 2.1 1.8 4.8 1.8M12.5 9.5v5M10 12h5' />
  </Svg>
);

export const SchemaPlusIcon = (props: IconProps) => (
  <Svg strokeWidth={1.4} strokeLinejoin='round' {...props}>
    <path d='M2 4.5A1 1 0 0 1 3 3.5h3.2l1.3 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z' />
    <path d='M8 7.2v3.6M6.2 9h3.6' strokeLinecap='round' />
  </Svg>
);
