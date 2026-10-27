import { Skeleton } from '@/shared/ui/primitives';

import {
  ColumnsPane,
  SkeletonRow,
  TableBody,
  TableHead,
  Toolbar,
} from './ProjectColumnsView.styles';

/**
 * Ширины в строках-заглушках (в % ячейки): разная длина имени, описания и
 * источника читается как реальная таблица, а не как ряд одинаковых плашек.
 */
const ROWS: Array<{ name: number; description: number; source: number }> = [
  { name: 46, description: 72, source: 64 },
  { name: 62, description: 0, source: 58 },
  { name: 38, description: 54, source: 70 },
  { name: 70, description: 86, source: 52 },
  { name: 52, description: 0, source: 66 },
  { name: 44, description: 64, source: 60 },
  { name: 58, description: 40, source: 72 },
  { name: 36, description: 0, source: 56 },
  { name: 66, description: 78, source: 62 },
  { name: 48, description: 58, source: 68 },
];

const FILTER_WIDTHS = [52, 108, 112, 196];

const Bar = ({
  width,
  height = 10,
  radius = 4,
}: {
  width: number | string;
  height?: number;
  radius?: number;
}) => (
  <Skeleton
    animation='wave'
    variant='rounded'
    width={width}
    height={height}
    sx={{ borderRadius: `${radius}px`, flexShrink: 0 }}
  />
);

/** Скелетон раздела «Колонки»: повторяет тулбар, шапку и строки таблицы. */
export const ProjectColumnsSkeleton = () => (
  <ColumnsPane
    aria-busy='true'
    aria-label='Загрузка колонок'
    data-testid='widgets/data-catalog/columns-skeleton'
  >
    <Toolbar>
      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
        <Bar width='100%' height={32} radius={6} />
      </div>
      <div style={{ display: 'flex', gap: 1 }}>
        {FILTER_WIDTHS.map(width => (
          <Bar key={width} width={width} height={32} radius={6} />
        ))}
      </div>
    </Toolbar>
    <TableHead>
      <Bar width={52} height={8} />
      <Bar width={64} height={8} />
      <Bar width={58} height={8} />
      <Bar width={30} height={8} />
    </TableHead>
    <TableBody style={{ overflow: 'hidden' }}>
      {ROWS.map((row, index) => (
        <SkeletonRow key={index}>
          <Bar width={`${row.name}%`} />
          {row.description ? (
            <Bar width={`${row.description}%`} />
          ) : (
            <Bar width={96} height={10} />
          )}
          <span
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 8,
              minWidth: 0,
            }}
          >
            <Bar width={22} height={22} radius={6} />
            <Bar width={`${row.source}%`} />
          </span>
          <span
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Bar width={42} />
            <Bar width={8} height={8} radius={2} />
          </span>
        </SkeletonRow>
      ))}
    </TableBody>
  </ColumnsPane>
);
