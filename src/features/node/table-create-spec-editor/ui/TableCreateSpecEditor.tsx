import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import type { Column, TableCreateSpec } from '@/shared/gatewayClient';

import {
  CLICKHOUSE_ENGINE_OPTIONS,
  createEmptyClickHouseSettingDraft,
  createEmptyForeignKeyDraft,
  createEmptyIndexDraft,
  type DraftClickHouseSetting,
  type DraftForeignKeySpec,
  type DraftIndexSpec,
  hydrateTableCreateSpecDraft,
  parseCommaSeparatedList,
  serializeTableCreateSpecDraft,
  stringifyStringList,
  type TableCreateSpecDraft,
  validateTableCreateSpecDraft,
} from '../model/helpers';

type TableCreateSpecEditorProps = {
  columns: Column[];
  compact?: boolean;
  isClickHouse: boolean;
  onChange: (value: TableCreateSpec | null) => void;
  onValidationChange?: (errors: string[]) => void;
  showClickHouseCoreSection?: boolean;
  showErrors?: boolean;
  showPrimaryKeySection?: boolean;
  value: TableCreateSpec | null | undefined;
};

const getFingerprint = (value: unknown) => {
  return JSON.stringify(value ?? null);
};

const cardSx = {
  borderRadius: '18px',
  flexShrink: 0,
  p: 1.5,
};

const fieldLabelSx = {
  fontSize: 12,
  fontWeight: 500,
  color: 'text.secondary',
  px: 0.25,
};

const indexTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 40,
    borderRadius: '10px',
    backgroundColor: 'background.paper',
  },
  '& .MuiOutlinedInput-input': {
    boxSizing: 'border-box',
    height: '100%',
    padding: '0 14px',
    fontSize: 13,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    fontSize: 13,
    color: 'text.secondary',
    opacity: 1,
  },
};

const addEntityButtonSx = {
  py: 0.3,
  minHeight: 28,
  borderRadius: '8px',
};

const emptyStateSx = {
  px: 1.5,
  py: 1.2,
  borderRadius: '12px',
  border: '1px dashed',
  borderColor: 'divider',
  backgroundColor: 'rgba(148, 163, 184, 0.04)',
  color: 'text.secondary',
  fontSize: 12.5,
};

const scrollableListSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  scrollbarGutter: 'stable',
};

const IndexUniqueSwitch = styled(Switch)({
  width: 34,
  height: 20,
  padding: 0,
  display: 'flex',
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transitionDuration: '150ms',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&.Mui-checked': {
      transform: 'translateX(14px)',
      color: '#ffffff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#6366f1',
        opacity: 1,
        borderColor: '#6366f1',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 16,
    height: 16,
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    opacity: 1,
    border: '1px solid #e2e8f0',
    transition: 'background-color 150ms ease, border-color 150ms ease',
  },
});

export const TableCreateSpecEditor = ({
  columns,
  isClickHouse,
  compact = false,
  onChange,
  onValidationChange,
  showClickHouseCoreSection = true,
  showErrors = true,
  showPrimaryKeySection = true,
  value,
}: TableCreateSpecEditorProps) => {
  const shouldRenderPrimaryKeySection = showPrimaryKeySection;
  const normalizedValue = useMemo(() => value ?? null, [value]);
  const externalFingerprint = useMemo(() => {
    return getFingerprint(normalizedValue);
  }, [normalizedValue]);

  const [draft, setDraft] = useState<TableCreateSpecDraft>(() => {
    return hydrateTableCreateSpecDraft(normalizedValue);
  });
  const [errors, setErrors] = useState<string[]>([]);

  const lastHydratedFingerprintRef = useRef<string | null>(null);
  const lastSerializedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      lastHydratedFingerprintRef.current === externalFingerprint ||
      lastSerializedFingerprintRef.current === externalFingerprint
    ) {
      return;
    }

    lastHydratedFingerprintRef.current = externalFingerprint;
    const nextDraft = hydrateTableCreateSpecDraft(normalizedValue);
    setDraft(nextDraft);
    const nextErrors = compact
      ? validateTableCreateSpecDraft(nextDraft, columns).errors
      : [];
    setErrors(nextErrors);
    onValidationChange?.(nextErrors);
  }, [
    columns,
    compact,
    externalFingerprint,
    normalizedValue,
    onValidationChange,
  ]);

  const runDraftValidation = useCallback(
    (nextDraft: TableCreateSpecDraft) => {
      const validation = validateTableCreateSpecDraft(nextDraft, columns);
      setErrors(validation.errors);
      onValidationChange?.(validation.errors);

      if (!validation.isValid) {
        return;
      }

      const nextValue = serializeTableCreateSpecDraft(nextDraft);
      lastSerializedFingerprintRef.current = getFingerprint(nextValue);
      onChange(nextValue);
    },
    [columns, onChange, onValidationChange]
  );

  const updateDraft = useCallback(
    (updater: (current: TableCreateSpecDraft) => TableCreateSpecDraft) => {
      setDraft(current => {
        const nextDraft = updater(current);
        runDraftValidation(nextDraft);
        return nextDraft;
      });
    },
    [runDraftValidation]
  );

  const patchIndex = useCallback(
    (indexId: string, patch: Partial<DraftIndexSpec>) => {
      updateDraft(current => ({
        ...current,
        indexes: current.indexes.map(index => {
          if (index.id !== indexId) {
            return index;
          }

          return {
            ...index,
            ...patch,
          };
        }),
      }));
    },
    [updateDraft]
  );

  const patchForeignKey = useCallback(
    (foreignKeyId: string, patch: Partial<DraftForeignKeySpec>) => {
      updateDraft(current => ({
        ...current,
        foreignKeys: current.foreignKeys.map(foreignKey => {
          if (foreignKey.id !== foreignKeyId) {
            return foreignKey;
          }

          return {
            ...foreignKey,
            ...patch,
          };
        }),
      }));
    },
    [updateDraft]
  );

  const patchSetting = useCallback(
    (settingId: string, patch: Partial<DraftClickHouseSetting>) => {
      updateDraft(current => ({
        ...current,
        clickhouse: {
          ...current.clickhouse,
          settings: current.clickhouse.settings.map(setting => {
            if (setting.id !== settingId) {
              return setting;
            }

            return {
              ...setting,
              ...patch,
            };
          }),
        },
      }));
    },
    [updateDraft]
  );

  return (
    <Stack
      spacing={compact ? 0 : 1.5}
      sx={
        compact
          ? {
              '& > .spec-section': {
                p: '18px 20px',
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
              '& .spec-heading': {
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: '#9b9ba6',
                textTransform: 'uppercase',
              },
              '& .spec-count': { display: 'none' },
              '& .spec-empty': {
                p: 0,
                border: 0,
                background: 'none',
                color: '#b2b2bd',
                fontSize: 13,
              },
              '& .spec-add': { border: 0, p: 0, minHeight: 24, fontSize: 12.5 },
              '& .MuiPaper-root': { borderRadius: '8px' },
            }
          : {}
      }
    >
      {showErrors && errors.length > 0 ? (
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

      {shouldRenderPrimaryKeySection ? (
        <Paper
          elevation={0}
          sx={theme => ({
            ...cardSx,
            border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
            backgroundColor: alpha(theme.palette.common.white, 0.72),
          })}
        >
          <Stack spacing={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Primary key columns
            </Typography>
            <ColumnDropdownSelect
              multiple
              allowNew
              columns={columns}
              value={draft.primaryKeyColumns}
              onChange={value => {
                updateDraft(current => ({
                  ...current,
                  primaryKeyColumns: value,
                }));
              }}
              placeholder='Выберите колонки primary key...'
            />
          </Stack>
        </Paper>
      ) : null}

      <Stack className='spec-section' spacing={1}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          gap={1}
        >
          <Stack direction='row' alignItems='center' spacing={0.75}>
            <Typography
              className='spec-heading'
              sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}
            >
              {compact ? 'Индексы' : 'Indexes'}
            </Typography>
            <Chip
              className='spec-count'
              label={draft.indexes.length}
              size='small'
              sx={theme => ({
                height: 20,
                borderRadius: '999px',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                fontSize: 11,
                fontWeight: 700,
                '& .MuiChip-label': {
                  px: 0.9,
                },
              })}
            />
          </Stack>
          <Button
            size='small'
            variant='outlined'
            startIcon={<AddRoundedIcon fontSize='small' />}
            className='spec-add'
            disableRipple
            sx={addEntityButtonSx}
            onClick={() =>
              updateDraft(current => ({
                ...current,
                indexes: [...current.indexes, createEmptyIndexDraft()],
              }))
            }
          >
            {compact ? 'Индекс' : 'Добавить индекс'}
          </Button>
        </Stack>

        {draft.indexes.length > 0 ? (
          <Box
            sx={{
              maxHeight: 360,
              ...scrollableListSx,
            }}
          >
            {draft.indexes.map((index, indexNumber) => (
              <Paper
                key={index.id}
                elevation={0}
                sx={theme => ({
                  ...cardSx,
                  border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.72),
                })}
              >
                <Stack spacing={1.25}>
                  <Stack
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    gap={1}
                  >
                    <Stack direction='row' alignItems='center' spacing={1}>
                      <Chip
                        label={indexNumber + 1}
                        size='small'
                        sx={theme => ({
                          height: 20,
                          borderRadius: '6px',
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.08
                          ),
                          color: 'text.secondary',
                          fontSize: 11,
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 0.9,
                          },
                        })}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        {index.name.trim() || 'Index'}
                      </Typography>
                    </Stack>
                    <IconButton
                      size='small'
                      onClick={() =>
                        updateDraft(current => ({
                          ...current,
                          indexes: current.indexes.filter(
                            currentIndex => currentIndex.id !== index.id
                          ),
                        }))
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize='small' />
                    </IconButton>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    alignItems='flex-start'
                    sx={{ minWidth: 0 }}
                  >
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Имя индекса</Typography>
                      <TextField
                        size='small'
                        fullWidth
                        value={index.name}
                        onChange={event =>
                          patchIndex(index.id, { name: event.target.value })
                        }
                        placeholder='Имя индекса'
                        sx={indexTextFieldSx}
                      />
                    </Stack>
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Колонки</Typography>
                      <ColumnDropdownSelect
                        multiple
                        allowNew
                        columns={columns}
                        error={compact && index.columns.length === 0}
                        value={index.columns}
                        onChange={value =>
                          patchIndex(index.id, { columns: value })
                        }
                        placeholder='Колонки индекса...'
                      />
                    </Stack>
                  </Stack>
                  <Stack
                    direction='row'
                    alignItems='center'
                    gap={1}
                    sx={{ minHeight: 24 }}
                  >
                    <IndexUniqueSwitch
                      disableRipple
                      checked={index.unique}
                      onChange={event =>
                        patchIndex(index.id, { unique: event.target.checked })
                      }
                    />
                    <Typography sx={{ fontSize: 13 }}>Unique</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
                      уникальный индекс
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box className='spec-empty' sx={emptyStateSx}>
            Нет индексов
          </Box>
        )}
      </Stack>

      <Stack className='spec-section' spacing={1}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          gap={1}
        >
          <Stack direction='row' alignItems='center' spacing={0.75}>
            <Typography
              className='spec-heading'
              sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}
            >
              {compact ? 'Внешние ключи' : 'Foreign keys'}
            </Typography>
            <Chip
              className='spec-count'
              label={draft.foreignKeys.length}
              size='small'
              sx={theme => ({
                height: 20,
                borderRadius: '999px',
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                fontSize: 11,
                fontWeight: 700,
                '& .MuiChip-label': {
                  px: 0.9,
                },
              })}
            />
          </Stack>
          <Button
            size='small'
            variant='outlined'
            startIcon={<AddRoundedIcon fontSize='small' />}
            className='spec-add'
            disableRipple
            sx={addEntityButtonSx}
            onClick={() =>
              updateDraft(current => ({
                ...current,
                foreignKeys: [
                  ...current.foreignKeys,
                  createEmptyForeignKeyDraft(),
                ],
              }))
            }
          >
            {compact ? 'Внешний ключ' : 'Add foreign key'}
          </Button>
        </Stack>

        {draft.foreignKeys.length > 0 ? (
          <Box
            sx={{
              maxHeight: 420,
              ...scrollableListSx,
            }}
          >
            {draft.foreignKeys.map((foreignKey, index) => (
              <Paper
                key={foreignKey.id}
                elevation={0}
                sx={theme => ({
                  ...cardSx,
                  border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.72),
                })}
              >
                <Stack spacing={1.25}>
                  <Stack
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    gap={1}
                  >
                    <Stack direction='row' alignItems='center' spacing={1}>
                      <Chip
                        label={index + 1}
                        size='small'
                        sx={theme => ({
                          height: 22,
                          borderRadius: '999px',
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.08
                          ),
                          color: 'text.secondary',
                          fontSize: 11,
                          fontWeight: 700,
                          '& .MuiChip-label': {
                            px: 0.9,
                          },
                        })}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        {foreignKey.name.trim() || 'Foreign key'}
                      </Typography>
                    </Stack>
                    <IconButton
                      size='small'
                      onClick={() =>
                        updateDraft(current => ({
                          ...current,
                          foreignKeys: current.foreignKeys.filter(
                            currentForeignKey =>
                              currentForeignKey.id !== foreignKey.id
                          ),
                        }))
                      }
                    >
                      <DeleteOutlineRoundedIcon fontSize='small' />
                    </IconButton>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    alignItems='flex-start'
                    sx={{ minWidth: 0 }}
                  >
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Constraint name</Typography>
                      <TextField
                        size='small'
                        fullWidth
                        value={foreignKey.name}
                        onChange={event =>
                          patchForeignKey(foreignKey.id, {
                            name: event.target.value,
                          })
                        }
                        placeholder='Constraint name'
                        sx={indexTextFieldSx}
                      />
                    </Stack>
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Колонки</Typography>
                      <ColumnDropdownSelect
                        multiple
                        allowNew
                        columns={columns}
                        error={
                          compact &&
                          (foreignKey.columns.length === 0 ||
                            foreignKey.columns.length !==
                              foreignKey.refColumns.length)
                        }
                        value={foreignKey.columns}
                        onChange={value =>
                          patchForeignKey(foreignKey.id, { columns: value })
                        }
                        placeholder='Колонки текущей таблицы...'
                      />
                    </Stack>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Ref schema</Typography>
                      <TextField
                        size='small'
                        fullWidth
                        value={foreignKey.refSchema}
                        onChange={event =>
                          patchForeignKey(foreignKey.id, {
                            refSchema: event.target.value,
                          })
                        }
                        placeholder='Ref schema'
                        sx={indexTextFieldSx}
                      />
                    </Stack>
                    <Stack
                      spacing={0.5}
                      sx={{ flex: 1, minWidth: 0, width: '100%' }}
                    >
                      <Typography sx={fieldLabelSx}>Ref table</Typography>
                      <TextField
                        size='small'
                        fullWidth
                        error={compact && !foreignKey.refTable.trim()}
                        value={foreignKey.refTable}
                        onChange={event =>
                          patchForeignKey(foreignKey.id, {
                            refTable: event.target.value,
                          })
                        }
                        placeholder='Ref table'
                        sx={indexTextFieldSx}
                      />
                    </Stack>
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography sx={fieldLabelSx}>Ref columns</Typography>
                    <TextField
                      size='small'
                      fullWidth
                      error={
                        compact &&
                        (foreignKey.refColumns.length === 0 ||
                          foreignKey.columns.length !==
                            foreignKey.refColumns.length)
                      }
                      value={stringifyStringList(foreignKey.refColumns)}
                      onChange={event =>
                        patchForeignKey(foreignKey.id, {
                          refColumns: parseCommaSeparatedList(
                            event.target.value
                          ),
                        })
                      }
                      placeholder='Ref columns'
                      helperText={
                        compact &&
                        foreignKey.columns.length !==
                          foreignKey.refColumns.length
                          ? 'Количество колонок должно совпадать'
                          : 'Через запятую'
                      }
                      sx={indexTextFieldSx}
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box className='spec-empty' sx={emptyStateSx}>
            Нет внешних ключей
          </Box>
        )}
      </Stack>

      {isClickHouse ? (
        <Box
          className='spec-section'
          sx={
            showClickHouseCoreSection
              ? theme => ({
                  ...cardSx,
                  border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.72),
                  borderRadius: cardSx.borderRadius,
                })
              : {}
          }
        >
          <Stack
            spacing={1.25}
            sx={{ mt: showClickHouseCoreSection ? 0 : 2.5 }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}
            >
              {showClickHouseCoreSection
                ? 'ClickHouse engine'
                : 'ClickHouse advanced options'}
            </Typography>

            {showClickHouseCoreSection ? (
              <>
                <TextField
                  select
                  size='small'
                  fullWidth
                  label='Engine'
                  value={draft.clickhouse.engineName}
                  onChange={event =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        engineName: event.target
                          .value as TableCreateSpecDraft['clickhouse']['engineName'],
                      },
                    }))
                  }
                >
                  {CLICKHOUSE_ENGINE_OPTIONS.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <ColumnDropdownSelect
                  multiple
                  allowNew
                  columns={columns}
                  value={draft.clickhouse.orderBy}
                  onChange={value =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        orderBy: value,
                      },
                    }))
                  }
                  placeholder='order_by...'
                />
                <ColumnDropdownSelect
                  multiple
                  allowNew
                  columns={columns}
                  value={draft.clickhouse.partitionBy}
                  onChange={value =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        partitionBy: value,
                      },
                    }))
                  }
                  placeholder='partition_by...'
                />
                <ColumnDropdownSelect
                  multiple
                  allowNew
                  columns={columns}
                  value={draft.clickhouse.primaryKey}
                  onChange={value =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        primaryKey: value,
                      },
                    }))
                  }
                  placeholder='clickhouse primary_key...'
                />
              </>
            ) : null}
            <Stack spacing={0.5}>
              <Typography sx={fieldLabelSx}>SAMPLE BY</Typography>
              <ColumnDropdownSelect
                multiple
                allowNew
                columns={columns}
                value={draft.clickhouse.sampleBy}
                onChange={value =>
                  updateDraft(current => ({
                    ...current,
                    clickhouse: {
                      ...current.clickhouse,
                      sampleBy: value,
                    },
                  }))
                }
                placeholder='sample_by...'
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography sx={fieldLabelSx}>TTL EXPRESSION</Typography>
                <TextField
                  size='small'
                  fullWidth
                  value={draft.clickhouse.ttlExpression}
                  onChange={event =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        ttlExpression: event.target.value,
                      },
                    }))
                  }
                  placeholder='TTL expression'
                  sx={indexTextFieldSx}
                />
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography sx={fieldLabelSx}>TABLE PATH</Typography>
                <TextField
                  size='small'
                  fullWidth
                  error={
                    compact &&
                    errors.some(error => error.includes('table path'))
                  }
                  value={draft.clickhouse.tablePath}
                  onChange={event =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        tablePath: event.target.value,
                      },
                    }))
                  }
                  placeholder='Table path'
                  sx={indexTextFieldSx}
                />
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography sx={fieldLabelSx}>REPLICA NAME</Typography>
                <TextField
                  size='small'
                  fullWidth
                  error={
                    compact && errors.some(error => error.includes('replica'))
                  }
                  value={draft.clickhouse.replicaName}
                  onChange={event =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        replicaName: event.target.value,
                      },
                    }))
                  }
                  placeholder='Replica name'
                  sx={indexTextFieldSx}
                />
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography sx={fieldLabelSx}>VERSION COLUMN</Typography>
                <ColumnDropdownSelect
                  allowNew
                  columns={columns}
                  error={
                    compact &&
                    errors.some(error => error.includes('version column'))
                  }
                  value={draft.clickhouse.versionColumn}
                  onChange={value =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        versionColumn: value,
                      },
                    }))
                  }
                  placeholder='version_column...'
                />
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <Typography sx={fieldLabelSx}>SIGN COLUMN</Typography>
                <ColumnDropdownSelect
                  allowNew
                  columns={columns}
                  error={
                    compact &&
                    errors.some(error => error.includes('sign column'))
                  }
                  value={draft.clickhouse.signColumn}
                  onChange={value =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        signColumn: value,
                      },
                    }))
                  }
                  placeholder='sign_column...'
                />
              </Stack>
            </Stack>

            <Stack spacing={0.5}>
              <Typography sx={fieldLabelSx}>SUMMING COLUMNS</Typography>
              <ColumnDropdownSelect
                multiple
                allowNew
                columns={columns}
                error={
                  compact &&
                  errors.some(error => error.includes('summing columns'))
                }
                value={draft.clickhouse.summingColumns}
                onChange={value =>
                  updateDraft(current => ({
                    ...current,
                    clickhouse: {
                      ...current.clickhouse,
                      summingColumns: value,
                    },
                  }))
                }
                placeholder='summing_columns...'
              />
            </Stack>

            <Stack spacing={1}>
              <Stack
                direction='row'
                alignItems='center'
                justifyContent='space-between'
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  Settings
                </Typography>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<AddRoundedIcon fontSize='small' />}
                  onClick={() =>
                    updateDraft(current => ({
                      ...current,
                      clickhouse: {
                        ...current.clickhouse,
                        settings: [
                          ...current.clickhouse.settings,
                          createEmptyClickHouseSettingDraft(),
                        ],
                      },
                    }))
                  }
                >
                  Add setting
                </Button>
              </Stack>

              {draft.clickhouse.settings.length > 0 ? (
                <Box
                  sx={{
                    maxHeight: 220,
                    ...scrollableListSx,
                  }}
                >
                  {draft.clickhouse.settings.map(setting => (
                    <Paper
                      key={setting.id}
                      elevation={0}
                      sx={theme => ({
                        ...cardSx,
                        border: `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
                        backgroundColor: alpha(
                          theme.palette.common.white,
                          0.68
                        ),
                      })}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                      >
                        <TextField
                          size='small'
                          fullWidth
                          label='Key'
                          value={setting.key}
                          onChange={event =>
                            patchSetting(setting.id, {
                              key: event.target.value,
                            })
                          }
                        />
                        <TextField
                          size='small'
                          fullWidth
                          label='Value'
                          value={setting.value}
                          onChange={event =>
                            patchSetting(setting.id, {
                              value: event.target.value,
                            })
                          }
                        />
                        <Box
                          sx={{ display: 'flex', justifyContent: 'flex-end' }}
                        >
                          <IconButton
                            size='small'
                            onClick={() =>
                              updateDraft(current => ({
                                ...current,
                                clickhouse: {
                                  ...current.clickhouse,
                                  settings: current.clickhouse.settings.filter(
                                    currentSetting =>
                                      currentSetting.id !== setting.id
                                  ),
                                },
                              }))
                            }
                          >
                            <DeleteOutlineRoundedIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
};
