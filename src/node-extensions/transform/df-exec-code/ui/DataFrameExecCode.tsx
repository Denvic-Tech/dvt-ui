import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { OnMount } from '@monaco-editor/react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DragHandleIcon from '@mui/icons-material/DragHandle'; // Импортируем иконку для драггера
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import * as monacoTypes from 'monaco-editor';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import type { DataFrameMetadata } from '@/shared/gatewayClient';
import { Panel, PythonCodeInput } from '@/shared/ui';
import type { CodeEditorCompletionProvider } from '@/shared/ui/code-editor';
import { normalizeMonacoTextValue } from '@/shared/ui/node-input/monacoTextValue';

type DataFrameExecCodeValues = {
  code?: string | undefined;
};

const DEFAULT_CODE = `# Доступные глобалы:
#  - dd: dask.dataframe
#  - df_in: dd.DataFrame
# Обязательно создайте переменную df_out
df_out = df_in.copy()
`;

const DF_OUT_REGEX = /\bdf_out\s*=/;

type ColumnMeta = DataFrameMetadata['columns'][number];

const getDfColumnStringRange = (
  textBeforeCursor: string,
  position: monacoTypes.Position
): monacoTypes.IRange | null => {
  const match = /\bdf_in\s*\[\s*\[?\s*["']([^"']*)$/.exec(textBeforeCursor);

  if (!match) {
    return null;
  }

  const currentValue = match[1] ?? '';

  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: position.column - currentValue.length,
    endColumn: position.column,
  };
};

export const DataFrameExecCode: React.FC<
  NodeModalExtensionProps<DataFrameExecCodeValues>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const inputMetadata = useMemo(() => {
    return getConnectedInputMetadata('df') as DataFrameMetadata | null;
  }, [getConnectedInputMetadata]);

  const code = normalizeMonacoTextValue(localInputData.code ?? DEFAULT_CODE);

  const monacoRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(
    null
  );

  // --- ЛОГИКА RESIZE (ИЗМЕНЕНИЯ РАЗМЕРА) ---
  const [editorHeight, setEditorHeight] = useState(420); // Начальная высота редактора
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Начало перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = editorHeight;

    // Блокируем выделение текста во всем документе пока тянем
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';

    // Подписываемся на события движения мыши на документе
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Процесс перетаскивания
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current) return;

    const deltaY = e.clientY - startYRef.current;
    const newHeight = startHeightRef.current + deltaY;

    // Ограничиваем минимальную и максимальную высоту (например, от 100px до 600px)
    if (newHeight > 100 && newHeight < 800) {
      setEditorHeight(newHeight);
    }
  }, []);

  // Конец перетаскивания
  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Принудительно обновляем layout редактора, если вдруг automaticLayout не сработал мгновенно
    if (monacoRef.current) {
      monacoRef.current.layout();
    }
  }, []);
  // ------------------------------------------

  const [search, setSearch] = useState('');

  const handleChange = useCallback(
    (value?: string) => {
      setLocalInputData(prev => ({ ...(prev ?? {}), code: value ?? '' }));
    },
    [setLocalInputData]
  );

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => DF_OUT_REGEX.test(code);
    });
  }, [code, setValidationCallback]);

  const hasDfMetadata =
    !!inputMetadata &&
    inputMetadata.type === 'DATAFRAME' &&
    Array.isArray(inputMetadata.columns);

  const columns = useMemo<ColumnMeta[]>(() => {
    return hasDfMetadata ? inputMetadata!.columns : [];
  }, [hasDfMetadata, inputMetadata]);

  const dataframeCompletionProviders = useMemo<
    Array<CodeEditorCompletionProvider<void>>
  >(
    () => [
      {
        id: 'df-exec-code-dataframe',
        priority: 0,
        triggerCharacters: ['.', '_', '[', '"', "'"],
        getSections: ({ model, position, wordRange, monaco }) => {
          const lineText = model.getLineContent(position.lineNumber);
          const textBeforeCursor = lineText.slice(0, position.column - 1);
          const columnStringRange = getDfColumnStringRange(
            textBeforeCursor,
            position
          );

          if (columnStringRange) {
            return columns.length > 0
              ? [
                  {
                    id: 'df-in-columns',
                    title: 'df_in columns',
                    priority: 0,
                    items: columns.map(col => ({
                      label: col.name,
                      kind: 'field',
                      insertText: col.name,
                      detail: col.dtype.toLowerCase(),
                      documentation: `Колонка "${col.name}"`,
                      filterText: col.name,
                      keywords: [col.name, col.dtype],
                      range: columnStringRange,
                    })),
                  },
                ]
              : [];
          }

          return [
            {
              id: 'df-exec-globals',
              title: 'DataFrame globals',
              priority: 0,
              items: [
                {
                  label: 'dd',
                  kind: 'variable',
                  insertText: 'dd',
                  detail: 'dask.dataframe',
                  documentation: 'Модуль dask.dataframe доступен как dd',
                  range: wordRange,
                },
                {
                  label: 'df_in',
                  kind: 'variable',
                  insertText: 'df_in',
                  detail: 'dd.DataFrame',
                  documentation: 'Входной DataFrame',
                  range: wordRange,
                },
                {
                  label: 'df_out',
                  kind: 'variable',
                  insertText: 'df_out',
                  detail: 'dd.DataFrame (обязателен)',
                  documentation:
                    'Выходной DataFrame. В коде необходимо присвоить df_out = ...',
                  range: wordRange,
                },
              ],
            },
            {
              id: 'df-exec-snippets',
              title: 'DataFrame snippets',
              priority: 10,
              items: [
                {
                  label: 'df_out = df_in.copy()',
                  kind: 'snippet',
                  insertText: 'df_out = df_in.copy()',
                  detail: 'Шаблон: копия входного датафрейма',
                  range: wordRange,
                },
                {
                  label: 'filter rows',
                  kind: 'snippet',
                  insertText:
                    'df_out = df_in[df_in["${1:col}"] ${2:==} ${3:value}]',
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  detail: 'Фильтр строк',
                  range: wordRange,
                },
                {
                  label: 'assign column',
                  kind: 'snippet',
                  insertText: 'df_out = df_in.assign(${1:new_col}=${2:expr})',
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  detail: 'Добавить/переопределить колонку',
                  range: wordRange,
                },
                {
                  label: 'select columns',
                  kind: 'snippet',
                  insertText: 'df_out = df_in[[${1:"col1"}, ${2:"col2"}]]',
                  insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
                  detail: 'Выбор колонок',
                  range: wordRange,
                },
              ],
            },
          ];
        },
      },
    ],
    [columns]
  );

  const handleEditorMount: OnMount = editor => {
    monacoRef.current = editor;
    editor.getModel()?.updateOptions({ tabSize: 2, insertSpaces: true });
  };

  const handleInsertColumnSnippet = useCallback((colName: string) => {
    const editor = monacoRef.current;
    if (!editor) return;

    const position = editor.getPosition();
    if (!position) return;

    const range: monacoTypes.IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column,
      endColumn: position.column,
    };

    const snippet = `df_in["${colName}"]`;

    editor.executeEdits('insert-df-in-col', [
      {
        range,
        text: snippet,
        forceMoveMarkers: true,
      },
    ]);

    editor.focus();
  }, []);

  const filteredColumns = useMemo(() => {
    if (!search.trim()) return columns;
    const lc = search.toLowerCase();
    return columns.filter(col => col.name.toLowerCase().includes(lc));
  }, [columns, search]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Верхняя панель */}
      <Panel elevation={1} sx={{ p: 1.5 }}>
        <Stack gap={1}>
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
            flexWrap='wrap'
            gap={1}
          >
            <Stack direction='row' gap={1} alignItems='center' flexWrap='wrap'>
              <Chip size='small' label='Globals: dd, df_in' />
              <Chip
                size='small'
                color={DF_OUT_REGEX.test(code) ? 'success' : 'warning'}
                label={
                  DF_OUT_REGEX.test(code) ? 'df_out: OK' : 'df_out: required'
                }
                variant={DF_OUT_REGEX.test(code) ? 'filled' : 'outlined'}
              />
              {hasDfMetadata && (
                <>
                  <Chip
                    size='small'
                    icon={<TableChartIcon fontSize='small' />}
                    label={`Колонок: ${columns.length}`}
                  />
                </>
              )}
            </Stack>
          </Stack>

          <Typography variant='caption' color='text.secondary'>
            Напишите код на Python, который формирует переменную <b>df_out</b>{' '}
            (обязательно). Доступны глобалы: <b>dd</b> и <b>df_in</b>.
          </Typography>
        </Stack>
      </Panel>

      {/* Редактор + таблица колонок */}
      <Panel elevation={1} sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* КОНТЕЙНЕР РЕДАКТОРА С ДИНАМИЧЕСКОЙ ВЫСОТОЙ */}
        <Box
          sx={{
            height: editorHeight, // Используем стейт
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <PythonCodeInput
            value={code}
            onChange={handleChange}
            variables={variables}
            completionProviders={dataframeCompletionProviders}
            onMount={handleEditorMount}
          />
        </Box>

        {/* --- DIVIDER / RESIZER HANDLE --- */}
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'row-resize',
            height: '14px',
            backgroundColor: 'action.hover',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'action.selected',
              color: 'primary.main',
            },
            color: 'text.disabled',
          }}
        >
          <DragHandleIcon fontSize='small' sx={{ transform: 'rotate(0deg)' }} />
        </Box>

        {/* Метаданные df_in */}
        <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='subtitle2'>
              Входные поля <code>df_in</code>
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Пример: <code>df_out = df_in.copy()</code>
            </Typography>
          </Stack>

          {!hasDfMetadata && (
            <Typography
              variant='caption'
              color='text.secondary'
              display='block'
              sx={{ mt: 1 }}
            >
              Метаданные входного DataFrame недоступны. Подключите источник к
              входу ноды.
            </Typography>
          )}

          {hasDfMetadata && (
            <Stack gap={1} sx={{ mt: 1 }}>
              <TextField
                size='small'
                fullWidth
                variant='outlined'
                placeholder='Фильтр по колонкам...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Stack>
          )}
        </Box>

        {hasDfMetadata && (
          <TableContainer
            component={Paper}
            variant='outlined'
            sx={{
              m: 1,
              mt: 0.5,
              // Логика: если редактор маленький, даем таблице больше места.
              // Базовая высота (общая предполагаемая рабочая область ~640px) минус высота редактора.
              // Но не меньше 150px и не больше 500px.
              maxHeight: Math.max(150, 650 - editorHeight),
              overflow: 'auto',
              transition: draggingRef.current ? 'none' : 'max-height 0.2s', // Плавность только когда не тянем
            }}
          >
            <Table size='small' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Колонка</TableCell>
                  <TableCell align='center'>Тип</TableCell>
                  <TableCell align='center'>Индекс</TableCell>
                  <TableCell align='right'>Add</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredColumns.map(col => (
                  <TableRow
                    key={col.name}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleInsertColumnSnippet(col.name)}
                  >
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                      title={col.name}
                    >
                      {col.name}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={col.dtype.toLowerCase()}
                        size='small'
                        variant='outlined'
                        style={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align='center'>
                      {col.index && (
                        <Box
                          component='span'
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'inline-block',
                          }}
                          title='Index'
                        />
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title={`Вставить df_in["${col.name}"]`} arrow>
                        <IconButton
                          size='small'
                          edge='end'
                          onClick={e => {
                            e.stopPropagation();
                            handleInsertColumnSnippet(col.name);
                          }}
                        >
                          <ContentCopyIcon fontSize='inherit' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredColumns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align='center' sx={{ py: 3 }}>
                      <Typography variant='caption' color='text.secondary'>
                        Нет данных
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>
    </Box>
  );
};
