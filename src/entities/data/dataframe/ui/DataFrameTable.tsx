import React, { useMemo } from 'react';
import { Box, Paper, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { Bs123, BsCalendarDate } from 'react-icons/bs';
import { TbDecimal } from 'react-icons/tb';
import {
  MdAbc,
  MdHourglassEmpty,
  MdCategory,
  MdMenuBook,
} from 'react-icons/md';
import { BiCheckboxChecked, BiQuestionMark } from 'react-icons/bi';
import { IoMdSettings } from 'react-icons/io';

import type { DataFrameData, Column as DFColumn } from '@/shared/gatewayClient';

interface DataFrameTableProps {
  data: DataFrameData;
  rowsOnScreen?: number;
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 52;

const calcTargetMaxHeight = (
  rowsOnScreen: number,
  rowH = ROW_HEIGHT,
  headerH = HEADER_HEIGHT,
  footerH = FOOTER_HEIGHT,
  extra = 0
) => headerH + rowsOnScreen * rowH + footerH + extra;

const ICON_SIZE = 18;

const TypeIcon: React.FC<{
  scale?: number;
  color?: string;
  children: React.ReactNode;
}> = ({ scale = 1, color, children }) => (
  <Box
    aria-hidden
    sx={{
      width: ICON_SIZE,
      height: ICON_SIZE,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      color: color ?? 'text.secondary',
      '& svg': {
        width: '100%',
        height: '100%',
        display: 'block',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      },
    }}
  >
    {children}
  </Box>
);

const dtypeIconSvg: Record<string, React.ReactNode> = {
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

const iconScale: Record<string, number> = {
  BOOLEAN: 0.9,
  OBJECT: 0.95,
  STRING: 1.3,
  TIMEDELTA: 0.95,
  DICTIONARY: 0.95,
  INT: 1.0,
  FLOAT: 1.2,
  DATETIME: 0.9,
  CATEGORY: 1.0,
  UNKNOWN: 1.0,
};

function toDateFromMaybeEpoch(v: unknown): Date | null {
  if (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v))) {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return null;

    const abs = Math.abs(n);
    let ms: number;

    if (abs < 1e11) {
      ms = n * 1000;
    } else if (abs < 1e14) {
      ms = n;
    } else if (abs < 1e17) {
      ms = Math.floor(n / 1000);
    } else {
      ms = Math.floor(n / 1e6);
    }
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t);
  }

  return null;
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

function formatLocalDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = d.getHours();
  const mm = d.getMinutes();
  const ss = d.getSeconds();
  const ms = d.getMilliseconds();
  return `${y}-${pad(m)}-${pad(day)} ${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(ms, 3)}`;
}

let _measureCanvas: HTMLCanvasElement | null = null;

function measureTextPx(text: string, font: string) {
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Ширина колонки по заголовку (учитываем иконку/зазор/паддинги) */
function calcHeaderWidth(colName: string, headerFont: string) {
  const textW = measureTextPx(colName, headerFont);
  const iconW = ICON_SIZE;
  const gap = 8;
  const padding = 16 * 2;
  const extra = 12;
  const w = Math.ceil(textW + iconW + gap + padding + extra);
  return Math.max(120, Math.min(w, 420));
}

function HeaderWithType({ col }: { col: DFColumn }) {
  const tip = `${col.name}
dtype: ${col.dtype}${col.nullable !== undefined ? `\nnullable: ${col.nullable}` : ''}${col.index ? `\nindex: true` : ''}`;

  const iconNode = dtypeIconSvg[col.dtype] ?? dtypeIconSvg['UNKNOWN'];
  const scale = iconScale[col.dtype] ?? 1;

  return (
    <Tooltip title={<pre style={{ margin: 0 }}>{tip}</pre>} arrow>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          lineHeight: 1,
        }}
      >
        <TypeIcon scale={scale}>{iconNode}</TypeIcon>
        <Box component='span' sx={{ fontWeight: 600 }}>
          {col.name}
        </Box>
      </Box>
    </Tooltip>
  );
}

export const DataFrameTable: React.FC<DataFrameTableProps> = ({
  data,
  rowsOnScreen = 25,
}) => {
  const { columns, values } = data;

  const rows = useMemo(
    () =>
      values.map((rowVals, i) => {
        const obj: Record<string, any> = { id: i };
        for (let c = 0; c < columns.length; c++) {
          obj[columns[c].name] = rowVals[c];
        }
        return obj;
      }),
    [values, columns]
  );

  const dtypeByField = useMemo(() => {
    const m = new Map<string, DFColumn['dtype']>();
    for (const c of columns) m.set(c.name, c.dtype);
    return m;
  }, [columns]);

  const gridColumns: GridColDef[] = useMemo(() => {
    const headerFont = '600 0.875rem Roboto, Helvetica, Arial, sans-serif';
    return columns.map(col => {
      const width = calcHeaderWidth(col.name, headerFont);

      const headerRenderer = () => <HeaderWithType col={col} />;

      const cellRenderer = (params: GridRenderCellParams<any>) => {
        const v = params.value;

        if (dtypeByField.get(params.field) === 'DATETIME') {
          const d = toDateFromMaybeEpoch(v);
          if (d) return formatLocalDateTime(d);
        }

        return v === null || v === undefined ? (
          <i style={{ opacity: 0.7 }}>null</i>
        ) : (
          String(v)
        );
      };

      return {
        field: col.name,
        headerName: col.name,
        width,
        minWidth: 120,
        sortable: false,
        renderHeader: headerRenderer,
        renderCell: cellRenderer,
      };
    });
  }, [columns, dtypeByField]);

  const MAX_H = calcTargetMaxHeight(rowsOnScreen);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <DataGrid
        rows={rows}
        columns={gridColumns}
        rowCount={rows.length}
        showColumnVerticalBorder
        showCellVerticalBorder
        getRowClassName={p =>
          p.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        /* размеры */
        density='compact'
        rowHeight={ROW_HEIGHT}
        columnHeaderHeight={HEADER_HEIGHT}
        sx={theme => {
          const isDark = theme.palette.mode === 'dark';
          const evenBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
          const oddBg = 'transparent';
          const hoverBg = isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.06)';

          return {
            maxHeight: MAX_H,

            /* нижняя граница хедера */
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            /* вертикальные линии между ячейками */
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            /* правый бордер у последней колонки */
            '& .MuiDataGrid-row': {
              borderRight: '1px solid',
              borderColor: 'divider',
            },

            /* зебра + hover + selected */
            '& .MuiDataGrid-row.even': {
              backgroundColor: evenBg,
              '&:hover': { backgroundColor: hoverBg },
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
                '&:hover': { backgroundColor: theme.palette.action.selected },
              },
            },
            '& .MuiDataGrid-row.odd': {
              backgroundColor: oddBg,
              '&:hover': { backgroundColor: hoverBg },
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
                '&:hover': { backgroundColor: theme.palette.action.selected },
              },
            },

            '&.MuiDataGrid-root': { border: 0 },
            '& .MuiDataGrid-footerContainer': { minHeight: FOOTER_HEIGHT },
          };
        }}
        disableColumnMenu
        disableRowSelectionOnClick
        pagination
        pageSizeOptions={[100]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 100 } },
        }}
      />
    </Paper>
  );
};
