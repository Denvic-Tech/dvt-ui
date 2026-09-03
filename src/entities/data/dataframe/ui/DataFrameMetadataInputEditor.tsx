import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { DataFrameMetadataInput } from '@/shared/gatewayClient';
import { JSONNodeInput } from '@/shared/ui/node-input';

import {
  createEmptyDataFrameMetadata,
  createEmptyDataFrameMetadataDraftRow,
  DATA_FRAME_DATA_TYPES,
  type DataFrameMetadataDraftRow,
  type DataFrameMetadataEditorMode,
  hydrateDataFrameMetadataDraftRows,
  normalizeDataFrameMetadataInput,
  parseDataFrameMetadataJson,
  serializeDataFrameMetadataDraftRows,
  validateDataFrameMetadataDraftRows,
} from '../model/dataFrameMetadataInput';

type DataFrameMetadataInputEditorProps = {
  onChange: (value: DataFrameMetadataInput) => void;
  onValidationChange?: (errors: string[]) => void;
  value: unknown;
};

const getFingerprint = (value: unknown) => {
  return JSON.stringify(value ?? null);
};

export const DataFrameMetadataInputEditor = ({
  onChange,
  onValidationChange,
  value,
}: DataFrameMetadataInputEditorProps) => {
  const normalizedValue = useMemo(() => {
    return (
      normalizeDataFrameMetadataInput(value) ?? createEmptyDataFrameMetadata()
    );
  }, [value]);
  const externalFingerprint = useMemo(() => {
    return getFingerprint(normalizedValue);
  }, [normalizedValue]);

  const [mode, setMode] = useState<DataFrameMetadataEditorMode>('ui');
  const [rows, setRows] = useState<DataFrameMetadataDraftRow[]>(() => {
    return hydrateDataFrameMetadataDraftRows(normalizedValue);
  });
  const [jsonValue, setJsonValue] = useState(() => {
    return JSON.stringify(normalizedValue, null, 2);
  });
  const [errors, setErrors] = useState<string[]>([]);

  const lastHydratedFingerprintRef = useRef<string | null>(null);
  const lastSerializedFingerprintRef = useRef<string | null>(null);
  const lastValidMetadataRef = useRef<DataFrameMetadataInput>(normalizedValue);

  useEffect(() => {
    if (
      lastHydratedFingerprintRef.current === externalFingerprint ||
      lastSerializedFingerprintRef.current === externalFingerprint
    ) {
      return;
    }

    lastHydratedFingerprintRef.current = externalFingerprint;
    lastValidMetadataRef.current = normalizedValue;
    setRows(hydrateDataFrameMetadataDraftRows(normalizedValue));
    setJsonValue(JSON.stringify(normalizedValue, null, 2));
    setErrors([]);
    onValidationChange?.([]);
  }, [externalFingerprint, normalizedValue, onValidationChange]);

  const commitMetadata = useCallback(
    (metadata: DataFrameMetadataInput) => {
      const fingerprint = getFingerprint(metadata);

      lastSerializedFingerprintRef.current = fingerprint;
      lastValidMetadataRef.current = metadata;
      setJsonValue(JSON.stringify(metadata, null, 2));
      setErrors([]);
      onValidationChange?.([]);
      onChange(metadata);
    },
    [onChange, onValidationChange]
  );

  const handleModeChange = useCallback(
    (nextMode: DataFrameMetadataEditorMode) => {
      if (nextMode === mode) {
        return;
      }

      if (nextMode === 'json') {
        const metadata = serializeDataFrameMetadataDraftRows(
          rows,
          lastValidMetadataRef.current
        );
        setJsonValue(JSON.stringify(metadata, null, 2));
      }

      if (nextMode === 'ui') {
        const metadata = lastValidMetadataRef.current;
        setRows(hydrateDataFrameMetadataDraftRows(metadata));
        setErrors([]);
        onValidationChange?.([]);
      }

      setMode(nextMode);
    },
    [mode, onValidationChange, rows]
  );

  const updateRows = useCallback(
    (nextRows: DataFrameMetadataDraftRow[]) => {
      setRows(nextRows);

      const nextErrors = validateDataFrameMetadataDraftRows(nextRows);
      setErrors(nextErrors);
      onValidationChange?.(nextErrors);

      if (nextErrors.length > 0) {
        return;
      }

      const metadata = serializeDataFrameMetadataDraftRows(
        nextRows,
        lastValidMetadataRef.current
      );

      commitMetadata(metadata);
    },
    [commitMetadata, onValidationChange]
  );

  const handleJsonChange = useCallback(
    (nextValue: unknown) => {
      const nextJsonValue =
        typeof nextValue === 'string'
          ? nextValue
          : JSON.stringify(nextValue ?? {}, null, 2);

      setJsonValue(nextJsonValue);

      const parsed = parseDataFrameMetadataJson(nextJsonValue);
      setErrors(parsed.errors);
      onValidationChange?.(parsed.errors);

      if (!parsed.metadata) {
        return;
      }

      setRows(hydrateDataFrameMetadataDraftRows(parsed.metadata));
      commitMetadata(parsed.metadata);
    },
    [commitMetadata, onValidationChange]
  );

  const addRow = useCallback(() => {
    updateRows([...rows, createEmptyDataFrameMetadataDraftRow()]);
  }, [rows, updateRows]);

  const removeRow = useCallback(
    (rowId: string) => {
      updateRows(rows.filter(row => row.id !== rowId));
    },
    [rows, updateRows]
  );

  const patchRow = useCallback(
    (
      rowId: string,
      patch: Partial<
        Pick<DataFrameMetadataDraftRow, 'dtype' | 'name' | 'nullable'>
      >
    ) => {
      updateRows(
        rows.map(row => {
          if (row.id !== rowId) {
            return row;
          }

          return {
            ...row,
            ...patch,
          };
        })
      );
    },
    [rows, updateRows]
  );

  return (
    <Stack spacing={1.5}>
      <Stack direction='row' spacing={1}>
        <Button
          size='small'
          variant={mode === 'ui' ? 'contained' : 'outlined'}
          startIcon={<ViewListRoundedIcon fontSize='small' />}
          onClick={() => handleModeChange('ui')}
        >
          UI
        </Button>
        <Button
          size='small'
          variant={mode === 'json' ? 'contained' : 'outlined'}
          startIcon={<DataObjectRoundedIcon fontSize='small' />}
          onClick={() => handleModeChange('json')}
        >
          JSON
        </Button>
      </Stack>

      {errors.length > 0 ? (
        <Alert severity='error'>
          <Stack spacing={0.25}>
            {errors.map(error => (
              <Typography key={error} variant='body2'>
                {error}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      {mode === 'ui' ? (
        <Stack spacing={1.25}>
          <Box
            sx={{
              minHeight: 0,
              maxHeight: 420,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <Paper
                  key={row.id}
                  elevation={0}
                  sx={theme => ({
                    p: 1.5,
                    borderRadius: '18px',
                    border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                    backgroundColor: alpha(theme.palette.common.white, 0.74),
                    flexShrink: 0,
                  })}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction='row'
                      alignItems='center'
                      justifyContent='space-between'
                      gap={1}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        Колонка {index + 1}
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={() => removeRow(row.id)}
                        aria-label='Удалить колонку'
                      >
                        <DeleteOutlineRoundedIcon fontSize='small' />
                      </IconButton>
                    </Stack>

                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'stretch', md: 'center' }}
                    >
                      <TextField
                        fullWidth
                        size='small'
                        label='Имя'
                        value={row.name}
                        onChange={event =>
                          patchRow(row.id, { name: event.target.value })
                        }
                      />
                      <TextField
                        select
                        size='small'
                        label='Тип'
                        value={row.dtype}
                        onChange={event =>
                          patchRow(row.id, {
                            dtype: event.target
                              .value as DataFrameMetadataDraftRow['dtype'],
                          })
                        }
                        sx={{ minWidth: { md: 180 } }}
                      >
                        {DATA_FRAME_DATA_TYPES.map(option => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Stack
                        direction='row'
                        alignItems='center'
                        justifyContent='space-between'
                        sx={theme => ({
                          px: 1.25,
                          py: 0.5,
                          borderRadius: '14px',
                          border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                          backgroundColor: alpha(
                            theme.palette.common.white,
                            0.68
                          ),
                          minWidth: { md: 150 },
                        })}
                      >
                        <Typography sx={{ fontSize: 13 }}>Nullable</Typography>
                        <Switch
                          size='small'
                          checked={row.nullable}
                          onChange={event =>
                            patchRow(row.id, { nullable: event.target.checked })
                          }
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Paper
                elevation={0}
                sx={theme => ({
                  p: 2,
                  borderRadius: '18px',
                  border: `1px dashed ${alpha(theme.palette.common.black, 0.12)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.62),
                })}
              >
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                  Пока нет ни одной колонки.
                </Typography>
              </Paper>
            )}
          </Box>

          <Button
            size='small'
            variant='outlined'
            startIcon={<AddRoundedIcon fontSize='small' />}
            onClick={addRow}
            sx={{ alignSelf: 'flex-start' }}
          >
            Добавить колонку
          </Button>
        </Stack>
      ) : (
        <JSONNodeInput
          value={jsonValue}
          onChange={handleJsonChange}
          title='DataFrame metadata JSON'
          hint='Поддерживается полный payload DataFrameMetadataInput.'
          height={320}
          errorText={errors[0] ?? null}
          allowVariableBinding={false}
        />
      )}
    </Stack>
  );
};
