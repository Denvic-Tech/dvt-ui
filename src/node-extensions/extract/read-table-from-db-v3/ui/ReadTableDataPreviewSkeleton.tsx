import { Skeleton } from '@mui/material';

import {
  PREVIEW_ROW_INDEX_WIDTH,
  PreviewContainer,
  RowIndexCell,
  RowIndexHeader,
  StyledTable,
  TableBody,
  TableHeader,
  TableScroll,
} from './ReadTableDataPreview.styles';

type ReadTableDataPreviewSkeletonProps = {
  columnCount?: number | undefined;
};

const SKELETON_ROWS = 9;
const DEFAULT_COLUMN_COUNT = 4;
const MAX_VISIBLE_COLUMNS = 6;

const SkeletonLine = ({ width }: { width: string | number }) => (
  <Skeleton
    animation='wave'
    variant='rounded'
    width={width}
    height={12}
    sx={{ borderRadius: '4px', backgroundColor: '#e5e7eb' }}
  />
);

export const ReadTableDataPreviewSkeleton = ({
  columnCount = DEFAULT_COLUMN_COUNT,
}: ReadTableDataPreviewSkeletonProps) => {
  const visibleColumnCount = Math.min(
    Math.max(columnCount, 1),
    MAX_VISIBLE_COLUMNS
  );

  return (
    <PreviewContainer
      role='status'
      aria-busy='true'
      aria-label='Загрузка предпросмотра таблицы'
    >
      <TableScroll>
        <StyledTable aria-hidden='true'>
          <colgroup>
            <col style={{ width: PREVIEW_ROW_INDEX_WIDTH }} />
            {Array.from({ length: visibleColumnCount }).map((_, index) => (
              <col key={index} style={{ width: 132 }} />
            ))}
          </colgroup>
          <TableHeader>
            <tr>
              <RowIndexHeader>
                <SkeletonLine width={12} />
              </RowIndexHeader>
              {Array.from({ length: visibleColumnCount }).map((_, index) => (
                <th key={index}>
                  <SkeletonLine width={`${58 + (index % 3) * 12}%`} />
                </th>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <RowIndexCell>
                  <SkeletonLine width={12} />
                </RowIndexCell>
                {Array.from({ length: visibleColumnCount }).map(
                  (_, columnIndex) => (
                    <td key={columnIndex}>
                      <SkeletonLine
                        width={`${46 + ((rowIndex + columnIndex) % 4) * 11}%`}
                      />
                    </td>
                  )
                )}
              </tr>
            ))}
          </TableBody>
        </StyledTable>
      </TableScroll>
    </PreviewContainer>
  );
};
