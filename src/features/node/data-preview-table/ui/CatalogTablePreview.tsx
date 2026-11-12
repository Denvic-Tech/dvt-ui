import type { DbCatalogTablePreview } from '@/entities/data/db-connection/model/catalogTypes';

import { DataPreviewFrame, DataPreviewTable } from './DataPreviewTable.styles';

type CatalogTablePreviewProps = {
  preview: DbCatalogTablePreview;
};

/** NULL в предпросмотре показываем тире, а в подсказке — как есть. */
const NULL_LABEL = '—';

/** Первые строки таблицы БД из каталога: тип колонки — в подсказке шапки. */
export const CatalogTablePreview = ({ preview }: CatalogTablePreviewProps) => (
  <DataPreviewFrame>
    <DataPreviewTable aria-label='Предпросмотр данных таблицы'>
      <thead>
        <tr>
          <th className='preview-index' aria-label='Номер строки' />
          {preview.columns.map(column => (
            <th key={column.name} title={column.dtype}>
              {column.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <td className='preview-index'>{rowIndex + 1}</td>
            {preview.columns.map((column, columnIndex) => {
              const value = row[columnIndex] ?? null;
              return value === null ? (
                <td key={column.name} className='preview-null' title='NULL'>
                  {NULL_LABEL}
                </td>
              ) : (
                <td key={column.name} title={String(value)}>
                  {String(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </DataPreviewTable>
  </DataPreviewFrame>
);
