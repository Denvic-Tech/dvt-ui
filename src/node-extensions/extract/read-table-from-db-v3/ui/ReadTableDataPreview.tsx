import React, { useEffect, useMemo, useRef, useState } from 'react';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { Stack, Tooltip, Typography } from '@mui/material';
import { BiCheckboxChecked, BiQuestionMark } from 'react-icons/bi';
import { Bs123, BsCalendarDate } from 'react-icons/bs';
import { IoMdSettings } from 'react-icons/io';
import {
  MdAbc,
  MdCategory,
  MdHourglassEmpty,
  MdMenuBook,
} from 'react-icons/md';
import { TbDecimal } from 'react-icons/tb';

import type {
  DbCatalogTablePreview,
  DbCatalogTablePreviewColumn,
  DbCatalogTablePreviewValue,
} from '@/entities/data/db-connection/model/catalogTypes';

import {
  ColumnResizer,
  HeaderContent,
  HeaderLabel,
  HeaderText,
  NullValue,
  PREVIEW_MAX_COLUMN_WIDTH,
  PREVIEW_MIN_COLUMN_WIDTH,
  PREVIEW_ROW_INDEX_WIDTH,
  PreviewContainer,
  type PreviewSortDirection,
  RowIndexCell,
  RowIndexHeader,
  SortIndicator,
  SortMenu,
  SortMenuItem,
  StyledTable,
  TableBody,
  TableHeader,
  TableScroll,
  TypeIcon,
} from './ReadTableDataPreview.styles';

type ReadTableDataPreviewProps = {
  preview: DbCatalogTablePreview;
};

const dtypeIcons: Record<string, React.ReactNode> = {
  INT: <Bs123 />,
  FLOAT: <TbDecimal />,
  STRING: <MdAbc />,
  BOOLEAN: <BiCheckboxChecked />,
  DATETIME: <BsCalendarDate />,
  TIMEDELTA: <MdHourglassEmpty />,
  CATEGORY: <MdCategory />,
  DICTIONARY: <MdMenuBook />,
  OBJECT: <IoMdSettings />,
  UNKNOWN: <BiQuestionMark />,
};

const getDtypeKey = (dtype: string) => dtype.toUpperCase();

const getDefaultColumnWidth = (name: string) =>
  Math.min(
    PREVIEW_MAX_COLUMN_WIDTH,
    Math.max(PREVIEW_MIN_COLUMN_WIDTH, name.length * 7 + 70)
  );

const ColumnHeader = ({ column }: { column: DbCatalogTablePreviewColumn }) => {
  const dtypeKey = getDtypeKey(column.dtype);

  return (
    <Tooltip
      arrow
      placement='top-start'
      title={
        <Stack spacing={0.25}>
          <Typography component='span' sx={{ fontSize: 11, fontWeight: 650 }}>
            {column.name}
          </Typography>
          <Typography
            component='span'
            sx={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.72 }}
          >
            {column.dtype}
          </Typography>
        </Stack>
      }
    >
      <HeaderLabel>
        <TypeIcon scale={dtypeKey === 'DATETIME' ? 0.85 : 1}>
          {dtypeIcons[dtypeKey] ?? dtypeIcons['UNKNOWN']}
        </TypeIcon>
        <HeaderText>{column.name}</HeaderText>
      </HeaderLabel>
    </Tooltip>
  );
};

const comparePreviewValues = (
  left: DbCatalogTablePreviewValue,
  right: DbCatalogTablePreviewValue
) => {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return String(left).localeCompare(String(right), 'ru', {
    numeric: true,
    sensitivity: 'base',
  });
};

export const ReadTableDataPreview = ({
  preview,
}: ReadTableDataPreviewProps) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] =
    useState<PreviewSortDirection>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [sortMenuColumn, setSortMenuColumn] = useState<string | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStateRef = useRef<{
    column: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    setColumnWidths(current => {
      const next = Object.fromEntries(
        preview.columns.map(column => [
          column.name,
          current[column.name] ?? getDefaultColumnWidth(column.name),
        ])
      );
      const unchanged =
        Object.keys(current).length === preview.columns.length &&
        preview.columns.every(
          column => current[column.name] === next[column.name]
        );
      return unchanged ? current : next;
    });
  }, [preview.columns]);

  useEffect(
    () => () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    },
    []
  );

  const columnIndexByName = useMemo(
    () => new Map(preview.columns.map((column, index) => [column.name, index])),
    [preview.columns]
  );

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return preview.rows;
    const columnIndex = columnIndexByName.get(sortColumn);
    if (columnIndex === undefined) return preview.rows;

    return [...preview.rows].sort((left, right) => {
      const result = comparePreviewValues(
        left[columnIndex] ?? null,
        right[columnIndex] ?? null
      );
      return sortDirection === 'asc' ? result : -result;
    });
  }, [columnIndexByName, preview.rows, sortColumn, sortDirection]);

  const handleOpenSortMenu =
    (columnName: string) => (event: React.MouseEvent<HTMLElement>) => {
      if (resizingColumn) return;
      setSortMenuAnchor(event.currentTarget);
      setSortMenuColumn(columnName);
    };

  const handleSort = (direction: Exclude<PreviewSortDirection, null>) => {
    setSortColumn(sortMenuColumn);
    setSortDirection(direction);
    setSortMenuAnchor(null);
    setSortMenuColumn(null);
  };

  const handleResizeStart =
    (columnName: string) => (event: React.PointerEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      resizeStateRef.current = {
        column: columnName,
        startX: event.clientX,
        startWidth:
          columnWidths[columnName] ?? getDefaultColumnWidth(columnName),
      };
      setResizingColumn(columnName);
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    };

  const handleResizeMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;
    event.preventDefault();
    const nextWidth = Math.min(
      PREVIEW_MAX_COLUMN_WIDTH,
      Math.max(
        PREVIEW_MIN_COLUMN_WIDTH,
        resizeState.startWidth + event.clientX - resizeState.startX
      )
    );
    setColumnWidths(current => ({
      ...current,
      [resizeState.column]: nextWidth,
    }));
  };

  const handleResizeEnd = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!resizeStateRef.current) return;
    resizeStateRef.current = null;
    setResizingColumn(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  return (
    <PreviewContainer>
      <TableScroll>
        <StyledTable aria-label='Предпросмотр данных таблицы'>
          <colgroup>
            <col style={{ width: PREVIEW_ROW_INDEX_WIDTH }} />
            {preview.columns.map(column => (
              <col
                key={column.name}
                style={{
                  width:
                    columnWidths[column.name] ??
                    getDefaultColumnWidth(column.name),
                }}
              />
            ))}
          </colgroup>
          <TableHeader>
            <tr>
              <RowIndexHeader>#</RowIndexHeader>
              {preview.columns.map(column => {
                const direction =
                  sortColumn === column.name ? sortDirection : null;
                const ariaSort =
                  direction === 'asc'
                    ? 'ascending'
                    : direction === 'desc'
                      ? 'descending'
                      : 'none';
                return (
                  <th
                    key={column.name}
                    aria-sort={ariaSort}
                    onClick={handleOpenSortMenu(column.name)}
                  >
                    <HeaderContent>
                      <ColumnHeader column={column} />
                      <SortIndicator active={Boolean(direction)}>
                        {direction === 'asc' ? (
                          <ArrowUpwardRoundedIcon />
                        ) : direction === 'desc' ? (
                          <ArrowDownwardRoundedIcon />
                        ) : (
                          <UnfoldMoreRoundedIcon />
                        )}
                      </SortIndicator>
                    </HeaderContent>
                    <ColumnResizer
                      className={
                        resizingColumn === column.name ? 'resizing' : undefined
                      }
                      onClick={event => event.stopPropagation()}
                      onPointerDown={handleResizeStart(column.name)}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeEnd}
                      onPointerCancel={handleResizeEnd}
                    />
                  </th>
                );
              })}
            </tr>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row, rowIndex) => {
              return (
                <tr key={rowIndex}>
                  <RowIndexCell>{rowIndex + 1}</RowIndexCell>
                  {preview.columns.map((column, columnIndex) => {
                    const value = row[columnIndex] ?? null;
                    return (
                      <td
                        key={column.name}
                        title={value === null ? undefined : String(value)}
                      >
                        {value === null ? (
                          <NullValue aria-label='NULL'>∅</NullValue>
                        ) : (
                          String(value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </TableBody>
        </StyledTable>
      </TableScroll>

      <SortMenu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => {
          setSortMenuAnchor(null);
          setSortMenuColumn(null);
        }}
      >
        <SortMenuItem onClick={() => handleSort('asc')}>
          По возрастанию
        </SortMenuItem>
        <SortMenuItem onClick={() => handleSort('desc')}>
          По убыванию
        </SortMenuItem>
      </SortMenu>
    </PreviewContainer>
  );
};
