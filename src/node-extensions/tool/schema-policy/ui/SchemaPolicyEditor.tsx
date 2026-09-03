import { useCallback, useEffect, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/primitives';

import {
  formatFillValue,
  getPolicyColumnDiff,
  getTableSchemaColumns,
  isTableSchemaMetadata,
  normalizeSchemaPolicy,
  parseFillValue,
  syncPolicyWithSchema,
} from '../lib/helpers';
import type {
  ColumnSchemaPolicy,
  ExtraColumnsAction,
  MissingColumnAction,
  SchemaPolicySettings,
  SchemaPolicyValues,
  TypeMismatchAction,
} from '../lib/types';

const MISSING_ACTION_OPTIONS = [
  { label: 'Ошибка', value: 'error' },
  { label: 'Заполнить', value: 'fill' },
  { label: 'Игнорировать', value: 'ignore' },
] as const;

const TYPE_MISMATCH_OPTIONS = [
  { label: 'Ошибка', value: 'error' },
  { label: 'Строго привести', value: 'cast' },
  { label: 'Мягко привести', value: 'soft_cast' },
  { label: 'Игнорировать', value: 'ignore', default: true },
] as const;

const EXTRA_COLUMNS_OPTIONS = [
  { label: 'Ошибка', value: 'error' },
  { label: 'Удалить', value: 'drop' },
  { label: 'Оставить', value: 'ignore', default: true },
] as const;

const getCommonColumnPolicyValue = <
  Key extends 'on_missing' | 'on_type_mismatch',
>(
  columns: Record<string, ColumnSchemaPolicy>,
  key: Key
): ColumnSchemaPolicy[Key] | '' => {
  const columnPolicies = Object.values(columns);
  const firstValue = columnPolicies[0]?.[key];

  if (
    firstValue === undefined ||
    columnPolicies.some(columnPolicy => columnPolicy[key] !== firstValue)
  ) {
    return '';
  }

  return firstValue;
};

export const SchemaPolicyEditor = ({
  getConnectedInputMetadata,
  isOpen,
  localInputData,
  setLocalInputData,
  setValidationCallback,
}: NodeModalExtensionProps<SchemaPolicyValues>) => {
  const [fillDrafts, setFillDrafts] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );

  const policy = useMemo(
    () => normalizeSchemaPolicy(localInputData.policy),
    [localInputData.policy]
  );
  const schemaMetadata = getConnectedInputMetadata?.('schema');
  const schemaColumns = useMemo(
    () =>
      isTableSchemaMetadata(schemaMetadata)
        ? getTableSchemaColumns(schemaMetadata)
        : [],
    [schemaMetadata]
  );
  const policyDiff = useMemo(
    () => getPolicyColumnDiff(policy, schemaColumns),
    [policy, schemaColumns]
  );
  const isPolicySynced =
    schemaColumns.length > 0 &&
    policyDiff.missing.length === 0 &&
    policyDiff.unknown.length === 0;
  const commonMissingAction = getCommonColumnPolicyValue(
    policy.columns,
    'on_missing'
  );
  const commonTypeMismatchAction = getCommonColumnPolicyValue(
    policy.columns,
    'on_type_mismatch'
  );

  useEffect(() => {
    if (localInputData.policy) {
      return;
    }

    setLocalInputData(current => ({
      ...current,
      policy: normalizeSchemaPolicy(current.policy),
    }));
  }, [localInputData.policy, setLocalInputData]);

  useEffect(() => {
    if (!isOpen) {
      setFillDrafts({});
      setValidationMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!setValidationCallback) {
      return;
    }

    setValidationCallback(() => () => {
      if (schemaColumns.length === 0 || isPolicySynced) {
        setValidationMessage(null);
        return true;
      }

      setValidationMessage(
        'Синхронизируйте политики с TableSchema перед сохранением.'
      );
      return false;
    });
  }, [isPolicySynced, schemaColumns.length, setValidationCallback]);

  const updatePolicy = useCallback(
    (update: (current: SchemaPolicySettings) => SchemaPolicySettings) => {
      setValidationMessage(null);
      setLocalInputData(current => ({
        ...current,
        policy: update(normalizeSchemaPolicy(current.policy)),
      }));
    },
    [setLocalInputData]
  );

  const updateColumnPolicy = useCallback(
    (columnName: string, patch: Partial<ColumnSchemaPolicy>) => {
      updatePolicy(current => {
        const currentColumn = current.columns[columnName];
        if (!currentColumn) {
          return current;
        }

        return {
          ...current,
          columns: {
            ...current.columns,
            [columnName]: { ...currentColumn, ...patch },
          },
        };
      });
    },
    [updatePolicy]
  );

  const updateAllColumnPolicies = useCallback(
    (patch: Partial<ColumnSchemaPolicy>) => {
      updatePolicy(current => ({
        ...current,
        columns: Object.fromEntries(
          Object.entries(current.columns).map(([columnName, columnPolicy]) => [
            columnName,
            { ...columnPolicy, ...patch },
          ])
        ),
      }));
    },
    [updatePolicy]
  );

  const handleSyncPolicies = () => {
    updatePolicy(current => syncPolicyWithSchema(current, schemaColumns));
  };

  const syncButtonLabel = isPolicySynced
    ? 'Политики созданы'
    : Object.keys(policy.columns).length > 0
      ? 'Синхронизировать политики'
      : 'Создать политики для всех колонок';

  useEffect(() => {
    if (isOpen) {
      handleSyncPolicies();
    }
  }, [handleSyncPolicies, isOpen]);

  return (
    <Stack spacing={2}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='flex-start'
        spacing={2}
      >
        <Stack>
          <Typography variant='h6'>Политика схемы</Typography>
          <Typography variant='body2' color='text.secondary'>
            Настройте обработку отсутствующих, лишних и несовместимых колонок.
          </Typography>
        </Stack>
        <Button
          type='button'
          variant='outline'
          disabled={schemaColumns.length === 0 || isPolicySynced}
          onClick={handleSyncPolicies}
        >
          {syncButtonLabel}
        </Button>
      </Stack>

      <Field label='Лишние колонки DataFrame'>
        <Select
          options={EXTRA_COLUMNS_OPTIONS}
          SelectDisplayProps={{
            'aria-label': 'Действие для лишних колонок',
          }}
          value={policy.on_extra_columns}
          onChange={value =>
            updatePolicy(current => ({
              ...current,
              on_extra_columns: value as ExtraColumnsAction,
            }))
          }
        />
      </Field>

      {schemaColumns.length === 0 ? (
        <Alert variant='warning'>
          <AlertTitle>TableSchema пока пуст</AlertTitle>
          <AlertDescription>
            Выполните предыдущие ноды, чтобы получить TableSchema и создать
            политики для его колонок.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {!isPolicySynced ? (
            <Alert variant='warning'>
              <AlertTitle>Политики требуют синхронизации</AlertTitle>
              <AlertDescription>
                {policyDiff.missing.length > 0
                  ? `Без политики: ${policyDiff.missing.length}. `
                  : ''}
                {policyDiff.unknown.length > 0
                  ? `Отсутствуют в TableSchema: ${policyDiff.unknown.length}. `
                  : ''}
                Используйте кнопку выше, чтобы привести список в соответствие со
                схемой.
              </AlertDescription>
            </Alert>
          ) : null}

          {validationMessage ? (
            <Alert variant='destructive'>
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Field label='Если отсутствует — для всех колонок'>
              <Select
                disabled={!isPolicySynced}
                options={MISSING_ACTION_OPTIONS}
                placeholder='Разные значения'
                SelectDisplayProps={{
                  'aria-label': 'Действие при отсутствии для всех колонок',
                }}
                value={commonMissingAction}
                onChange={value =>
                  updateAllColumnPolicies({
                    on_missing: value as MissingColumnAction,
                  })
                }
              />
            </Field>
            <Field label='Несовпадение типа — для всех колонок'>
              <Select
                disabled={!isPolicySynced}
                options={TYPE_MISMATCH_OPTIONS}
                placeholder='Разные значения'
                SelectDisplayProps={{
                  'aria-label':
                    'Действие при несовпадении типа для всех колонок',
                }}
                value={commonTypeMismatchAction}
                onChange={value =>
                  updateAllColumnPolicies({
                    on_type_mismatch: value as TypeMismatchAction,
                  })
                }
              />
            </Field>
          </Stack>

          <Table aria-label='Политики колонок TableSchema'>
            <TableHeader>
              <TableRow>
                <TableHead>Колонка</TableHead>
                <TableHead>Если отсутствует</TableHead>
                <TableHead>Значение</TableHead>
                <TableHead>Несовпадение типа</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemaColumns.map(column => {
                const columnPolicy = policy.columns[column.name];

                return (
                  <TableRow key={column.name}>
                    <TableCell>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <Typography title={column.description ?? undefined}>
                          {column.name}
                        </Typography>
                        <Badge>{column.dtype ?? 'UNKNOWN'}</Badge>
                        {!columnPolicy ? (
                          <Badge variant='warning'>Не настроено</Badge>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={!columnPolicy}
                        options={MISSING_ACTION_OPTIONS}
                        SelectDisplayProps={{
                          'aria-label': `Действие при отсутствии: ${column.name}`,
                        }}
                        value={columnPolicy?.on_missing ?? 'error'}
                        onChange={value =>
                          updateColumnPolicy(column.name, {
                            on_missing: value as MissingColumnAction,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {columnPolicy?.on_missing === 'fill' ? (
                        <Input
                          inputProps={{
                            'aria-label': `Значение для заполнения: ${column.name}`,
                          }}
                          placeholder='null'
                          value={
                            fillDrafts[column.name] ??
                            formatFillValue(columnPolicy.fill_value)
                          }
                          onBlur={event => {
                            updateColumnPolicy(column.name, {
                              fill_value: parseFillValue(
                                event.target.value,
                                column.dtype
                              ),
                            });
                            setFillDrafts(current => {
                              const next = { ...current };
                              delete next[column.name];
                              return next;
                            });
                          }}
                          onChange={event =>
                            setFillDrafts(current => ({
                              ...current,
                              [column.name]: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <Typography color='text.secondary'>
                          Не требуется
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={!columnPolicy}
                        options={TYPE_MISMATCH_OPTIONS}
                        SelectDisplayProps={{
                          'aria-label': `Действие при несовпадении типа: ${column.name}`,
                        }}
                        value={columnPolicy?.on_type_mismatch ?? 'error'}
                        onChange={value =>
                          updateColumnPolicy(column.name, {
                            on_type_mismatch: value as TypeMismatchAction,
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Stack>
  );
};
