import React, { useEffect, useMemo, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
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

import { useNodeDefinition } from '@/features/node/get-node-definition';
import { useNodeData } from '@/features/node/manage-node-data';

import {
  useDataFrameCsvDownload,
  useDataFrameData,
} from '@/entities/data/dataframe';
import { useNodeDataFrameViewer } from '@/entities/node/node-dataframe-viewer';
import { useCurrentProject } from '@/entities/project/projects';
import { useTaskExecutionStatus } from '@/entities/project/task-execution-status';

import type { Column as DFColumn } from '@/shared/gatewayClient';

import {
  calcHeaderWidth,
  formatLocalDateTime,
  toDateFromMaybeEpoch,
} from './helpers.ts';
import {
  CloseButton,
  ColumnResizer,
  HeaderContent,
  HeaderInfo,
  HeaderLabel,
  HeaderLeft,
  HeaderText,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  ModalContent,
  ModalHeader,
  NodeIcon,
  NodeId,
  NodeName,
  NullValue,
  PaginationButton,
  PaginationContainer,
  ROW_INDEX_WIDTH,
  RowIndexCell,
  RowIndexHeader,
  SortDirection,
  SortIcon,
  SortMenu,
  SortMenuItem,
  StatBadge,
  StyledDialog,
  StyledTab,
  StyledTable,
  StyledTabs,
  TableBody,
  TableContainer,
  TableHeader,
  TableScroll,
  TabsContainer,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  TypeIcon,
  ViewerContainer,
} from './styles.ts';

const PAGE_SIZE = 100;

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
  DATETIME: 0.85,
};

// eslint-disable-next-line no-control-regex
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

const sanitizeFilename = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const cleaned = trimmed
    .replace(INVALID_FILENAME_CHARS, '_')
    .replace(/\s+/g, '-');

  return cleaned.length > 0 ? cleaned : fallback;
};

const ensureCsvExtension = (value: string): string =>
  value.toLowerCase().endsWith('.csv') ? value : `${value}.csv`;

const buildCsvFilename = ({
  nodeLabel,
  outputName,
  nodeID,
}: {
  nodeLabel?: string | null;
  outputName?: string | null;
  nodeID?: string | null;
}): string => {
  const parts = [
    nodeLabel?.trim() ? nodeLabel : null,
    outputName?.trim() ? outputName : null,
    nodeID ? nodeID.slice(-6) : null,
  ].filter(Boolean) as string[];

  const base = parts.length > 0 ? parts.join('-') : 'dataframe';
  return ensureCsvExtension(sanitizeFilename(base, 'dataframe'));
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const isAbortError = (error: unknown): boolean =>
  Boolean((error as { name?: string })?.name === 'AbortError');

function HeaderWithType({ col }: { col: DFColumn }) {
  const tip = `${col.name}
dtype: ${col.dtype}${col.nullable !== undefined ? `\nnullable: ${col.nullable}` : ''}${col.index ? `\nindex: true` : ''}`;

  const iconNode = dtypeIconSvg[col.dtype] ?? dtypeIconSvg['UNKNOWN'];
  const scale = iconScale[col.dtype] ?? 1;

  return (
    <Tooltip title={<pre style={{ margin: 0 }}>{tip}</pre>} arrow>
      <HeaderLabel>
        <TypeIcon scale={scale}>{iconNode}</TypeIcon>
        <HeaderText>{col.name}</HeaderText>
      </HeaderLabel>
    </Tooltip>
  );
}

interface DataFrameBodyProps {
  projectID: string;
  nodeID: string;
  outputName: string;
  nodeLabel?: string | null;
}

const DataFrameBody: React.FC<DataFrameBodyProps> = ({
  projectID,
  nodeID,
  outputName,
  nodeLabel,
}) => {
  const { status, dataFrameData, reload } = useDataFrameData(
    projectID,
    nodeID,
    outputName
  );
  const downloadCsv = useDataFrameCsvDownload();
  const { status: taskStatus, taskId } = useTaskExecutionStatus();
  const lastFetchedTaskIdRef = useRef<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [sortMenuColumn, setSortMenuColumn] = useState<string | null>(null);
  const resizeStateRef = useRef<{
    column: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  useEffect(() => {
    if (!taskId || taskStatus !== 'SUCCESS') return;
    if (lastFetchedTaskIdRef.current === taskId) return;
    lastFetchedTaskIdRef.current = taskId;
    void reload({ force: true });
  }, [taskId, taskStatus, reload]);

  const columns = useMemo(
    () => dataFrameData?.columns ?? [],
    [dataFrameData?.columns]
  );

  const values = useMemo(
    () => dataFrameData?.values ?? [],
    [dataFrameData?.values]
  );

  const rowCount = dataFrameData?.total_rows ?? 0;
  const partitionCount = dataFrameData?.total_partitions ?? 0;

  const columnIndexByName = useMemo(
    () => new Map(columns.map((col, idx) => [col.name, idx])),
    [columns]
  );

  const dtypeByName = useMemo(() => {
    const m = new Map<string, DFColumn['dtype']>();
    for (const col of columns) m.set(col.name, col.dtype);
    return m;
  }, [columns]);

  const defaultColumnWidths = useMemo(() => {
    const headerFont = '600 11px Roboto, Helvetica, Arial, sans-serif';
    const next: Record<string, number> = {};
    for (const col of columns) {
      next[col.name] = calcHeaderWidth(col.name, headerFont);
    }
    return next;
  }, [columns]);

  useEffect(() => {
    setColumnWidths(prev => {
      if (columns.length === 0) {
        return Object.keys(prev).length === 0 ? prev : {};
      }

      let changed = Object.keys(prev).length !== columns.length;
      const next: Record<string, number> = {};
      for (const col of columns) {
        const nextWidth =
          prev[col.name] ?? defaultColumnWidths[col.name] ?? MIN_COLUMN_WIDTH;
        next[col.name] = nextWidth;
        if (prev[col.name] !== nextWidth) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [columns, defaultColumnWidths]);

  useEffect(() => {
    if (sortColumn && !columnIndexByName.has(sortColumn)) {
      setSortColumn(null);
      setSortDirection(null);
    }
  }, [sortColumn, columnIndexByName]);

  useEffect(() => {
    setPage(0);
  }, [sortColumn, sortDirection, outputName]);

  const handleOpenSortMenu =
    (column: string) => (event: React.MouseEvent<HTMLElement>) => {
      if (resizingColumn) return;
      setSortMenuAnchor(event.currentTarget);
      setSortMenuColumn(column);
    };

  const handleCloseSortMenu = () => {
    setSortMenuAnchor(null);
    setSortMenuColumn(null);
  };

  const handleSortSelect = (direction: SortDirection) => {
    if (sortMenuColumn) {
      setSortColumn(sortMenuColumn);
      setSortDirection(direction);
    }
    handleCloseSortMenu();
  };

  const sortedValues = useMemo(() => {
    if (!sortColumn || !sortDirection) return values;

    const colIndex = columnIndexByName.get(sortColumn);
    if (colIndex === undefined) return values;

    return [...values].sort((a, b) => {
      const aVal = a[colIndex] as any;
      const bVal = b[colIndex] as any;

      if (aVal === null || aVal === undefined) {
        return bVal === null || bVal === undefined ? 0 : 1;
      }
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [values, sortColumn, sortDirection, columnIndexByName]);

  const totalRows = sortedValues.length;
  const lastPageIndex = Math.max(0, Math.ceil(totalRows / PAGE_SIZE) - 1);

  useEffect(() => {
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
    }
  }, [page, lastPageIndex]);

  const pagedValues = useMemo(
    () => sortedValues.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [sortedValues, page]
  );

  const startRow = totalRows === 0 ? 0 : page * PAGE_SIZE + 1;
  const endRow =
    totalRows === 0 ? 0 : Math.min(totalRows, (page + 1) * PAGE_SIZE);
  const isLastPage = page >= lastPageIndex;

  const handleExportCSV = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const suggestedName = buildCsvFilename({
      ...(nodeLabel !== undefined ? { nodeLabel } : {}),
      outputName,
      nodeID,
    });

    try {
      const showSaveFilePicker = (
        window as Window & {
          showSaveFilePicker?: (options?: unknown) => Promise<{
            createWritable: () => Promise<{
              write: (data: Blob) => Promise<void>;
              close: () => Promise<void>;
            }>;
          }>;
        }
      ).showSaveFilePicker;

      if (showSaveFilePicker) {
        let fileHandle: {
          createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
          }>;
        };

        try {
          fileHandle = await showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: 'CSV',
                accept: { 'text/csv': ['.csv'] },
              },
            ],
          });
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }
          throw error;
        }

        const result = await downloadCsv({
          projectID,
          nodeID,
          outputName,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(result.blob);
        await writable.close();
        return;
      }

      const result = await downloadCsv({
        projectID,
        nodeID,
        outputName,
      });
      const fallbackName = sanitizeFilename(
        result.filename ?? suggestedName,
        suggestedName
      );
      const finalName = ensureCsvExtension(fallbackName);
      triggerBlobDownload(result.blob, finalName);
    } catch (error) {
      console.error('[NodeDataFrameViewer] CSV download failed', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResizeStart =
    (column: string) => (event: React.PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      event.preventDefault();
      const startWidth =
        columnWidths[column] ?? defaultColumnWidths[column] ?? MIN_COLUMN_WIDTH;

      resizeStateRef.current = {
        column,
        startX: event.clientX,
        startWidth,
      };
      setResizingColumn(column);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    };

  const handleResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStateRef.current) return;
    event.preventDefault();
    const { column, startX, startWidth } = resizeStateRef.current;
    const dx = event.clientX - startX;
    const nextWidth = Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(MIN_COLUMN_WIDTH, startWidth + dx)
    );

    setColumnWidths(prev => ({ ...prev, [column]: nextWidth }));
  };

  const handleResizeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStateRef.current) return;
    resizeStateRef.current = null;
    setResizingColumn(null);
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(
        event.pointerId
      );
    } catch {
      /* ignore */
    }
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  const handleResizerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const formatCellValue = (value: unknown, columnName: string) => {
    if (value === null || value === undefined) return null;

    if (dtypeByName.get(columnName) === 'DATETIME') {
      const d = toDateFromMaybeEpoch(value);
      if (d) return formatLocalDateTime(d);
    }

    return String(value);
  };

  if (status == 'loading') {
    return <CircularProgress />;
  }

  if (!dataFrameData) {
    return <Typography>Нет данных...</Typography>;
  }

  return (
    <ViewerContainer>
      <Toolbar>
        <ToolbarGroup>
          <StatBadge>
            <TableRowsIcon />
            <span className='value'>{rowCount}</span> rows
          </StatBadge>
          <StatBadge>
            <ViewModuleIcon />
            <span className='value'>{partitionCount}</span> partitions
          </StatBadge>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            type='button'
            onClick={handleExportCSV}
            disabled={isDownloading}
            aria-busy={isDownloading}
          >
            <FileDownloadIcon /> CSV
          </ToolbarButton>

          <PaginationContainer>
            <PaginationButton
              type='button'
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              {'<'}
            </PaginationButton>
            <span>
              {startRow}-{endRow} / {totalRows}
            </span>
            <PaginationButton
              type='button'
              disabled={isLastPage}
              onClick={() => setPage(p => Math.min(lastPageIndex, p + 1))}
            >
              {'>'}
            </PaginationButton>
          </PaginationContainer>
        </ToolbarGroup>
      </Toolbar>

      <TableScroll>
        <StyledTable>
          <colgroup>
            <col style={{ width: ROW_INDEX_WIDTH }} />
            {columns.map(col => {
              const width =
                columnWidths[col.name] ??
                defaultColumnWidths[col.name] ??
                MIN_COLUMN_WIDTH;
              return <col key={col.name} style={{ width }} />;
            })}
          </colgroup>
          <TableHeader>
            <tr>
              <RowIndexHeader>#</RowIndexHeader>
              {columns.map(col => {
                const direction =
                  sortColumn === col.name ? sortDirection : null;
                const ariaSort =
                  sortColumn !== col.name || !sortDirection
                    ? 'none'
                    : sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending';

                return (
                  <th
                    key={col.name}
                    onClick={handleOpenSortMenu(col.name)}
                    aria-sort={ariaSort}
                  >
                    <HeaderContent>
                      <HeaderWithType col={col} />
                      <SortIcon direction={direction} />
                    </HeaderContent>
                    <ColumnResizer
                      className={
                        resizingColumn === col.name ? 'resizing' : undefined
                      }
                      onPointerDown={handleResizeStart(col.name)}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeEnd}
                      onPointerCancel={handleResizeEnd}
                      onClick={handleResizerClick}
                    />
                  </th>
                );
              })}
            </tr>
          </TableHeader>
          <TableBody>
            {pagedValues.map((row, rowIndex) => {
              const rowKey = rowIndex + page * PAGE_SIZE;
              return (
                <tr key={rowKey}>
                  <RowIndexCell>{rowKey + 1}</RowIndexCell>
                  {columns.map((col, colIndex) => {
                    const value = row[colIndex];
                    const displayValue = formatCellValue(value, col.name);
                    const title =
                      displayValue === null ? '' : String(displayValue);

                    return (
                      <td key={col.name} title={title}>
                        {displayValue === null ? <NullValue /> : displayValue}
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
        onClose={handleCloseSortMenu}
      >
        <SortMenuItem onClick={() => handleSortSelect('asc')}>
          По возрастанию
        </SortMenuItem>
        <SortMenuItem onClick={() => handleSortSelect('desc')}>
          По убыванию
        </SortMenuItem>
      </SortMenu>
    </ViewerContainer>
  );
};

interface NodeDataFrameViewerContentProps {
  closeViewer: () => void;
  nodeID: string;
}

const NodeDataFrameViewerContent: React.FC<NodeDataFrameViewerContentProps> = ({
  closeViewer,
  nodeID,
}) => {
  const { currentProject } = useCurrentProject();
  const { nodeData } = useNodeData(nodeID);
  const nodeDefinition = useNodeDefinition(nodeData?.name);

  const dataFrameOutputs = useMemo(() => {
    return nodeDefinition
      ? Object.values(nodeDefinition.output_definitions ?? {})
          .filter(outputDef => outputDef.type === 'DATAFRAME')
          .map(outputDef => outputDef.attr_name)
      : null;
  }, [nodeDefinition]);

  const [selectedOutputName, setSelectedOutputName] = useState<string | ''>('');

  useEffect(() => {
    setSelectedOutputName('');
  }, [nodeID]);

  useEffect(() => {
    if (!dataFrameOutputs?.length) {
      setSelectedOutputName('');
      return;
    }

    if (!selectedOutputName) {
      setSelectedOutputName(dataFrameOutputs[0]);
    }
  }, [dataFrameOutputs, selectedOutputName]);

  useEffect(() => {
    if (
      selectedOutputName &&
      dataFrameOutputs &&
      !dataFrameOutputs.includes(selectedOutputName)
    ) {
      setSelectedOutputName(dataFrameOutputs[0] ?? '');
    }
  }, [dataFrameOutputs, selectedOutputName]);

  const shortNodeId = nodeID ? `${nodeID.slice(5, 21)}...` : '';
  const displayName = nodeData?.displayName ?? nodeData?.name ?? 'DataFrame';

  return (
    <StyledDialog fullWidth maxWidth={false} open onClose={closeViewer}>
      <ModalHeader>
        <HeaderLeft>
          <NodeIcon>
            <TableChartIcon />
          </NodeIcon>
          <HeaderInfo>
            <NodeName>{displayName}</NodeName>
            <NodeId>{shortNodeId}</NodeId>
          </HeaderInfo>
        </HeaderLeft>
        <CloseButton type='button' onClick={closeViewer}>
          <CloseIcon />
        </CloseButton>
      </ModalHeader>

      <ModalContent>
        {dataFrameOutputs && dataFrameOutputs.length > 1 && (
          <TabsContainer>
            <StyledTabs
              allowScrollButtonsMobile
              variant='scrollable'
              value={selectedOutputName}
              onChange={(_, value) => setSelectedOutputName(value)}
            >
              {dataFrameOutputs.map(outputName => (
                <StyledTab
                  key={outputName}
                  label={outputName}
                  value={outputName}
                />
              ))}
            </StyledTabs>
          </TabsContainer>
        )}

        {currentProject?.id && nodeID && selectedOutputName && (
          <TableContainer>
            <DataFrameBody
              projectID={currentProject.id}
              nodeID={nodeID}
              outputName={selectedOutputName}
              nodeLabel={displayName}
            />
          </TableContainer>
        )}
      </ModalContent>
    </StyledDialog>
  );
};

export const NodeDataFrameViewer: React.FC = () => {
  const { open, nodeID, closeViewer } = useNodeDataFrameViewer();

  if (!open || !nodeID) {
    return null;
  }

  return (
    <NodeDataFrameViewerContent closeViewer={closeViewer} nodeID={nodeID} />
  );
};
