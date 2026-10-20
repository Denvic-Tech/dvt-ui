import { Fragment } from 'react';

import { Skeleton } from '@/shared/ui/primitives';

import {
  DetailPane,
  DetailSticky,
  GroupHeader,
  ListPane,
  ListScroll,
  SearchField,
  StepLine,
} from './NodeFieldsViewer.styles';

/** Ширины имён в строках-заглушках: разная длина читается как реальный список. */
const ROW_NAME_WIDTHS = [72, 54, 88, 64, 46, 80, 58, 92, 50, 70, 62, 84];
const STEP_TEXT_WIDTHS: Array<[number, number]> = [
  [44, 62],
  [52, 38],
  [36, 70],
  [48, 54],
];

const Bar = ({
  width,
  height,
  radius = 4,
}: {
  width: number | string;
  height: number;
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

const ColumnRowSkeleton = ({ nameWidth }: { nameWidth: number }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      gap: 8,
      height: 34,
      padding: '0 10px 0 8px',
    }}
  >
    <Skeleton animation='wave' variant='circular' width={6} height={6} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Bar width={`${nameWidth}%`} height={12} />
    </div>
    <Bar width={38} height={10} />
  </div>
);

/** Строки списка колонок на время загрузки состава порта. */
export const ColumnRowsSkeleton = ({ rows = 12 }: { rows?: number }) => (
  <div data-testid='widgets/node-fields-viewer/list-skeleton'>
    <GroupHeader>
      <Bar width={64} height={10} />
    </GroupHeader>
    {ROW_NAME_WIDTHS.slice(0, rows).map((width, index) => (
      <ColumnRowSkeleton key={index} nameWidth={width} />
    ))}
  </div>
);

/** Левая панель целиком: поле поиска уже на месте, вместо строк — заглушки. */
export const ColumnsListSkeleton = () => (
  <ListPane>
    <SearchField as='div'>
      <Bar width='60%' height={10} />
    </SearchField>
    <ListScroll>
      <ColumnRowsSkeleton />
    </ListScroll>
  </ListPane>
);

const ArrowSkeleton = () => (
  <div
    aria-hidden='true'
    style={{ display: 'flex', height: 24, justifyContent: 'center', width: 34 }}
  >
    <Skeleton
      animation='wave'
      variant='rounded'
      width={2}
      height={16}
      sx={{ alignSelf: 'center' }}
    />
  </div>
);

const StepSkeleton = ({
  widths: [titleWidth, textWidth],
}: {
  widths: [number, number];
}) => (
  <StepLine>
    <Bar width={34} height={34} radius={9} />
    <div style={{ display: 'grid', flex: 1, gap: 5, minWidth: 0 }}>
      <Bar width={`${titleWidth}%`} height={12} />
      <Bar width={`${textWidth}%`} height={11} />
    </div>
  </StepLine>
);

/** Шаги пути колонки: стрелка, плитка ноды и две строки текста. */
export const LineagePathSkeleton = ({ steps = 3 }: { steps?: number }) => (
  <div data-testid='widgets/node-fields-viewer/path-skeleton'>
    {STEP_TEXT_WIDTHS.slice(0, steps).map((widths, index) => (
      <Fragment key={index}>
        <ArrowSkeleton />
        <StepSkeleton widths={widths} />
      </Fragment>
    ))}
  </div>
);

/** Правая панель до того, как известна выбранная колонка. */
export const ColumnLineageSkeleton = () => (
  <DetailPane>
    <DetailSticky>
      <Bar width='100%' height={34} radius={9} />
      <div style={{ height: 16 }} />
      <StepSkeleton widths={[34, 58]} />
    </DetailSticky>
    <LineagePathSkeleton />
  </DetailPane>
);
