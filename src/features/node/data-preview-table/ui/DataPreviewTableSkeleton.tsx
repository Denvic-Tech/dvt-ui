import { useMemo } from 'react';

import { SkeletonBar } from '@/shared/ui/clean-minimal/controls';

import {
  buildDataPreviewSkeletonLayout,
  DATA_PREVIEW_SKELETON_ROW_COUNT,
  type DataPreviewSkeletonColumn,
} from '../lib/skeletonLayout';

import {
  DataPreviewFrame,
  DataPreviewTable,
  SkeletonHeadBar,
  SkeletonIndexBar,
} from './DataPreviewTable.styles';

type DataPreviewTableSkeletonProps = {
  /**
   * Колонки, известные до загрузки: шапка показывает их названия.
   * Без колонок шапка тоже скелетонная.
   */
  columns?: readonly DataPreviewSkeletonColumn[] | null | undefined;
  rowCount?: number;
};

/**
 * Загрузка таблицы превью: та же таблица и тот же контейнер, что у
 * загруженных данных, но в ячейках — shimmer-плашки.
 */
export const DataPreviewTableSkeleton = ({
  columns,
  rowCount = DATA_PREVIEW_SKELETON_ROW_COUNT,
}: DataPreviewTableSkeletonProps) => {
  const layout = useMemo(
    () => buildDataPreviewSkeletonLayout(columns, rowCount),
    [columns, rowCount]
  );

  return (
    <DataPreviewFrame
      role='status'
      aria-busy='true'
      aria-label='Загрузка данных'
    >
      <DataPreviewTable skeleton aria-hidden='true'>
        <thead>
          <tr>
            <th className='preview-index' />
            {layout.head.map((cell, index) =>
              cell.kind === 'label' ? (
                <th key={index} title={cell.title}>
                  {cell.label}
                </th>
              ) : (
                <th key={index}>
                  <SkeletonHeadBar style={{ width: cell.width }} />
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {layout.rows.map((widths, rowIndex) => (
            <tr key={rowIndex}>
              <td className='preview-index'>
                <SkeletonIndexBar />
              </td>
              {widths.map((width, columnIndex) => (
                <td key={columnIndex}>
                  <SkeletonBar style={{ width }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </DataPreviewTable>
    </DataPreviewFrame>
  );
};
