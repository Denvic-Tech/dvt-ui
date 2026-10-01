import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
} from 'lucide-react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import type { Column, DataFrameMetadata } from '@/shared/gatewayClient';
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  Input,
  Panel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/primitives';

import { Additional } from './Additional';
import { ColumnSelector } from './ColumnSelector';
import {
  advancedSummary,
  type CalculatedColumn,
  type ColumnKind,
  kindLabels,
  legacyRule,
  newRule,
  type Operation,
  operations,
  operationSummary,
  previewRules,
  type Rule,
  ruleSummary,
  selectColumns,
  updatedRule,
  type Values,
  withoutBinding,
} from './model';
import { ExpressionField, OperationFields } from './OperationFields';
import { SeriesBindingsEditor } from './SeriesBindingsEditor';

const EMPTY_COLUMNS: Column[] = [];
const typeOptions = Object.entries(kindLabels).map(([value, label]) => ({
  value,
  label,
}));

export function ColumnRulesEditor(props: NodeModalExtensionProps) {
  const { getConnectedInputMetadata } = useNodeConnections(props.id);
  const metadata = (props.getConnectedInputMetadata?.('df') ??
    getConnectedInputMetadata('df')) as DataFrameMetadata | undefined;
  if (props.nodeDefinition.name === 'SetColumnToDataFrame')
    return <SeriesBindingsEditor {...props} />;
  const operation = operations[props.nodeDefinition.name];
  if (!operation) return <Alert severity='error'>Неизвестная операция.</Alert>;
  return (
    <RulesForm
      operation={operation}
      columns={metadata?.columns ?? EMPTY_COLUMNS}
      metadataKnown={!!metadata}
      values={props.localInputData as Values}
      onChange={values =>
        props.setLocalInputData(previous => ({ ...previous, ...values }))
      }
      setValidationCallback={props.setValidationCallback}
    />
  );
}

export function RulesForm({
  operation,
  columns,
  metadataKnown,
  values,
  onChange,
  setValidationCallback,
}: {
  operation: Operation;
  columns: Column[];
  metadataKnown: boolean;
  values: Values;
  onChange: (values: Values) => void;
  setValidationCallback?: NodeModalExtensionProps['setValidationCallback'];
}) {
  const rules = useMemo(
    () => values.column_rules ?? [legacyRule(values, operation)],
    [values, operation]
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reveal, setReveal] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const isCalculated =
    operation === 'expression' &&
    (values.calculated_columns != null ||
      (metadataKnown &&
        values.column_rules == null &&
        !!values.column_name &&
        !columns.some(column => column.name === values.column_name)));
  const calculated = useMemo<CalculatedColumn[]>(
    () =>
      values.calculated_columns ?? [
        { name: values.column_name ?? '', expression: values.expression ?? '' },
      ],
    [values.calculated_columns, values.column_name, values.expression]
  );
  const preview = useMemo(
    () => previewRules(columns, rules, operation),
    [columns, rules, operation]
  );
  const issues = useMemo(() => {
    if (isCalculated) {
      const names = calculated.map(item => item.name);
      return calculated.length === 0 ||
        calculated.some(
          item =>
            (!item.name?.trim() && !item.input_bindings?.['name']) ||
            (!item.expression?.trim() &&
              !item.input_bindings?.['expression']) ||
            (!item.overwrite_existing &&
              columns.some(column => column.name === item.name))
        ) ||
        new Set(names).size !== names.length
        ? [
            'Укажите уникальные новые имена и выражения. Все выражения читают исходную таблицу.',
          ]
        : [];
    }
    return [
      ...(rules.length ? [] : ['Добавьте правило.']),
      ...Object.values(preview.errors)
        .flat()
        .filter(message => metadataKnown || !message.endsWith('отсутствует.')),
    ];
  }, [isCalculated, calculated, columns, rules, preview.errors, metadataKnown]);
  const validate = useCallback(() => {
    setSubmitted(true);
    if (issues.length) {
      setReveal(value => value + 1);
      setExpanded(
        rules.find(rule => preview.errors[rule.id]?.length)?.id ?? null
      );
    }
    return !issues.length;
  }, [issues, rules, preview.errors]);
  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);
  const save = (next: Rule[]) =>
    onChange(
      operation === 'expression'
        ? { column_rules: next, calculated_columns: null }
        : { column_rules: next }
    );
  const changeRule = (id: string, next: Rule) =>
    save(rules.map(rule => (rule.id === id ? updatedRule(rule, next) : rule)));
  const move = (index: number, delta: number) => {
    const next = [...rules];
    const other = index + delta;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other]!, next[index]!];
    save(next);
  };
  const customize = (source: string, ruleId: string) => {
    const parent = rules.find(rule => rule.id === ruleId);
    if (!parent) return;
    const next = structuredClone(parent);
    next.id = crypto.randomUUID();
    next.selector = { tokens: [{ kind: 'name', value: source }] };
    delete next.input_bindings?.['selector.tokens.0.value'];
    const index = rules.indexOf(parent);
    save([...rules.slice(0, index), next, ...rules.slice(index)]);
    setExpanded(next.id);
  };
  return (
    <Stack spacing={2}>
      {!metadataKnown && (
        <Alert severity='info'>
          Нет актуальной схемы. Настройки можно сохранить; колонки будут
          проверены при запуске.
        </Alert>
      )}
      {operation === 'expression' && (
        <Select
          aria-label='Сценарий вычисления'
          value={isCalculated ? 'calculated' : 'transform'}
          options={[
            { value: 'transform', label: 'Преобразовать колонки' },
            { value: 'calculated', label: 'Рассчитать новые колонки' },
          ]}
          onChange={value =>
            value === 'calculated'
              ? onChange({ calculated_columns: calculated, column_rules: null })
              : onChange({
                  calculated_columns: null,
                  column_rules: values.column_rules ?? [newRule(operation)],
                })
          }
        />
      )}
      {submitted && !!issues.length && (
        <Alert severity='error'>
          {issues.map((issue, index) => (
            <div key={index}>{issue}</div>
          ))}
        </Alert>
      )}
      {isCalculated ? (
        <>
          {calculated.map((entry, index) => (
            <Panel key={index} sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction='row' spacing={1}>
                  <Input
                    label='Новая колонка'
                    value={entry.name ?? ''}
                    onChange={event =>
                      onChange({
                        calculated_columns: calculated.map((item, i) =>
                          i === index
                            ? {
                                ...withoutBinding(item, 'name'),
                                name: event.target.value,
                              }
                            : item
                        ),
                        column_rules: null,
                      })
                    }
                  />
                  <Button
                    aria-label='Удалить вычисляемую колонку'
                    variant='ghost'
                    onClick={() =>
                      onChange({
                        calculated_columns: calculated.filter(
                          (_, i) => i !== index
                        ),
                        column_rules: null,
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </Stack>
                <ExpressionField
                  columns={columns}
                  value={entry.expression ?? ''}
                  onChange={expression =>
                    onChange({
                      calculated_columns: calculated.map((item, i) =>
                        i === index
                          ? {
                              ...withoutBinding(item, 'expression'),
                              expression,
                            }
                          : item
                      ),
                      column_rules: null,
                    })
                  }
                />
                <Additional
                  summary={
                    entry.overwrite_existing ? 'перезапись разрешена' : ''
                  }
                >
                  <label>
                    <Checkbox
                      checked={entry.overwrite_existing ?? false}
                      onCheckedChange={overwrite_existing =>
                        onChange({
                          calculated_columns: calculated.map((item, i) =>
                            i === index ? { ...item, overwrite_existing } : item
                          ),
                          column_rules: null,
                        })
                      }
                    />
                    Разрешить перезапись существующей колонки
                  </label>
                  {!!Object.keys(entry.input_bindings ?? {}).length && (
                    <Typography variant='caption'>
                      Динамические параметры сохранены:{' '}
                      {Object.keys(entry.input_bindings ?? {}).join(', ')}. Ввод
                      значения заменяет соответствующую привязку.
                    </Typography>
                  )}
                </Additional>
              </Stack>
            </Panel>
          ))}
          <Button
            variant='outline'
            onClick={() =>
              onChange({
                calculated_columns: [
                  ...calculated,
                  { name: '', expression: '' },
                ],
                column_rules: null,
              })
            }
          >
            Добавить колонку
          </Button>
        </>
      ) : (
        <>
          {rules.map((rule, index) => {
            const open = expanded === null ? index === 0 : expanded === rule.id;
            const count = preview.counts[rule.id];
            return (
              <Panel key={rule.id} sx={{ p: 2 }}>
                <Collapsible
                  open={open}
                  onOpenChange={next => setExpanded(next ? rule.id : '')}
                >
                  <CollapsibleTrigger>
                    <Button
                      variant='ghost'
                      aria-expanded={open}
                      sx={{ justifyContent: 'flex-start', width: '100%' }}
                      startIcon={
                        open ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )
                      }
                    >
                      {index + 1}. {ruleSummary(rule)} ·{' '}
                      {operationSummary(operation, rule.params)}
                      {rule.enabled === false
                        ? ' · отключено'
                        : count
                          ? ' · применяется к ' + count.applied
                          : ''}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Stack spacing={2} sx={{ pt: 2 }}>
                      <ColumnSelector
                        columns={columns}
                        value={rule.selector.tokens.filter(
                          token => typeof token.value === 'string'
                        )}
                        onChange={tokens =>
                          changeRule(rule.id, {
                            ...rule,
                            selector: { ...rule.selector, tokens },
                          })
                        }
                      />
                      <OperationFields
                        operation={operation}
                        params={rule.params}
                        columns={columns}
                        onChange={params =>
                          changeRule(rule.id, { ...rule, params })
                        }
                      />
                      {count &&
                        metadataKnown &&
                        count.applied === 0 &&
                        rule.enabled !== false && (
                          <Typography variant='caption' color='warning.main'>
                            {count.matched
                              ? 'Колонки перекрыты предыдущими правилами или пропущены.'
                              : 'Нет совпадений по текущей схеме.'}
                          </Typography>
                        )}
                      <Additional
                        summary={advancedSummary(rule)}
                        reveal={
                          submitted && preview.errors[rule.id]?.length
                            ? reveal
                            : 0
                        }
                      >
                        {!!Object.keys(rule.input_bindings ?? {}).length && (
                          <Typography variant='caption'>
                            Значения из выражений и подключений будут определены
                            при запуске:{' '}
                            {Object.values(rule.input_bindings ?? {}).join(
                              ', '
                            )}
                            . Ввод значения заменяет соответствующую привязку.
                          </Typography>
                        )}
                        <Typography variant='caption'>
                          Типы и исключения сужают выбор. Имена и маски
                          объединяются.
                        </Typography>
                        <Combobox
                          multiple
                          value={rule.selector.types ?? []}
                          options={typeOptions}
                          placeholder='Любые типы'
                          onValueChange={types =>
                            changeRule(rule.id, {
                              ...rule,
                              selector: {
                                ...rule.selector,
                                types: types as ColumnKind[],
                              },
                            })
                          }
                        />
                        <ColumnSelector
                          label='Исключить колонки'
                          columns={columns}
                          exactOnly
                          value={(rule.selector.exclude ?? []).map(value => ({
                            kind: 'name',
                            value,
                          }))}
                          onChange={tokens =>
                            changeRule(rule.id, {
                              ...rule,
                              selector: {
                                ...rule.selector,
                                exclude: tokens.map(token => token.value),
                              },
                            })
                          }
                        />
                        <Input
                          label='Дополнительный фильтр имени (regex)'
                          value={rule.selector.name_regex ?? ''}
                          onChange={event =>
                            changeRule(rule.id, {
                              ...rule,
                              selector: {
                                ...rule.selector,
                                name_regex: event.target.value,
                              },
                            })
                          }
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          disabled={!metadataKnown || !count?.matched}
                          onClick={() => {
                            const names = selectColumns(
                              columns,
                              rule.selector
                            ).map(column => column.name);
                            changeRule(rule.id, {
                              ...rule,
                              selector: {
                                tokens: names.map(value => ({
                                  kind: 'name',
                                  value,
                                })),
                              },
                            });
                          }}
                        >
                          Зафиксировать текущий список
                        </Button>
                        {operation !== 'split' && (
                          <>
                            <Select
                              aria-label='Размещение результата'
                              value={rule.output?.mode ?? 'replace'}
                              options={[
                                {
                                  value: 'replace',
                                  label: 'Заменить исходные колонки',
                                },
                                {
                                  value: 'new',
                                  label: 'Создать новые колонки',
                                },
                              ]}
                              onChange={mode =>
                                changeRule(rule.id, {
                                  ...rule,
                                  output: {
                                    ...rule.output,
                                    mode: mode as 'new' | 'replace',
                                    suffix: rule.output?.suffix ?? '_result',
                                  },
                                })
                              }
                            />
                            {rule.output?.mode === 'new' && (
                              <>
                                <Input
                                  label='Суффикс новых колонок'
                                  value={rule.output.suffix ?? ''}
                                  onChange={event =>
                                    changeRule(rule.id, {
                                      ...rule,
                                      output: {
                                        ...rule.output!,
                                        suffix: event.target.value,
                                        target: null,
                                        require_target: false,
                                        fallback_to_source: false,
                                      },
                                    })
                                  }
                                />
                                {preview.rows
                                  .filter(row => row.ruleId === rule.id)
                                  .map(row => (
                                    <Input
                                      key={row.source}
                                      label={row.source + ' → имя результата'}
                                      value={
                                        rule.output?.names?.[row.source] ??
                                        rule.output?.target ??
                                        ''
                                      }
                                      placeholder={row.targets[0]}
                                      onChange={event => {
                                        const names = { ...rule.output?.names };
                                        if (event.target.value)
                                          names[row.source] =
                                            event.target.value;
                                        else delete names[row.source];
                                        changeRule(rule.id, {
                                          ...rule,
                                          output: {
                                            ...rule.output!,
                                            target: null,
                                            require_target: false,
                                            names,
                                          },
                                        });
                                      }}
                                    />
                                  ))}
                              </>
                            )}
                          </>
                        )}
                        {operation === 'delta' && (
                          <label>
                            <Checkbox
                              checked={rule.skip_incompatible ?? false}
                              onCheckedChange={skip_incompatible =>
                                changeRule(rule.id, {
                                  ...rule,
                                  skip_incompatible,
                                })
                              }
                            />
                            Пропускать колонки неподходящего типа
                          </label>
                        )}
                        {operation === 'split' && (
                          <label>
                            <Checkbox
                              checked={rule.params.drop_source ?? false}
                              onCheckedChange={drop_source =>
                                changeRule(rule.id, {
                                  ...rule,
                                  params: { ...rule.params, drop_source },
                                })
                              }
                            />
                            Удалять исходные колонки
                          </label>
                        )}
                        {operation === 'timezone' && (
                          <Typography variant='caption'>
                            Датам без пояса назначается выбранный пояс; даты с
                            поясом переводятся с сохранением момента времени.
                            Ошибки разбора и неоднозначные даты становятся NaT.
                          </Typography>
                        )}
                        {operation === 'period' && (
                          <Typography variant='caption'>
                            Неделя начинается в понедельник. У результата
                            удаляется часовой пояс с сохранением местного
                            времени.
                          </Typography>
                        )}
                        {(operation === 'regex' || operation === 'split') && (
                          <Typography variant='caption'>
                            Значения, включая представления пропусков,
                            предварительно преобразуются в строки.
                          </Typography>
                        )}
                        {operation === 'replace' && (
                          <Typography variant='caption'>
                            Можно вставить две колонки из таблицы. Значения
                            приводятся к типу каждой колонки отдельно;
                            несовместимая замена может перевести результат в
                            текст. NULL и пустая строка различаются.
                          </Typography>
                        )}
                        <Stack direction='row' gap={1} flexWrap='wrap'>
                          <label>
                            <Checkbox
                              checked={rule.enabled !== false}
                              onCheckedChange={enabled =>
                                changeRule(rule.id, { ...rule, enabled })
                              }
                            />
                            Включено
                          </label>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={index === 0}
                            aria-label='Правило выше'
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp size={16} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={index === rules.length - 1}
                            aria-label='Правило ниже'
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown size={16} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            startIcon={<Copy size={16} />}
                            onClick={() => {
                              const copy = {
                                ...structuredClone(rule),
                                id: crypto.randomUUID(),
                              };
                              save([
                                ...rules.slice(0, index + 1),
                                copy,
                                ...rules.slice(index + 1),
                              ]);
                              setExpanded(copy.id);
                            }}
                          >
                            Дублировать
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            startIcon={<Trash2 size={16} />}
                            onClick={() =>
                              save(rules.filter(item => item.id !== rule.id))
                            }
                          >
                            Удалить правило
                          </Button>
                        </Stack>
                      </Additional>
                    </Stack>
                  </CollapsibleContent>
                </Collapsible>
              </Panel>
            );
          })}
          <Button
            variant='outline'
            startIcon={<Plus size={16} />}
            onClick={() => {
              const rule = newRule(operation);
              save([...rules, rule]);
              setExpanded(rule.id);
            }}
          >
            Добавить правило
          </Button>
          <Additional>
            <Typography variant='body2'>Что изменится</Typography>
            <Typography variant='caption'>
              Для каждой колонки действует первое подходящее правило сверху. Все
              правила читают исходную таблицу.
            </Typography>
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Колонка</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Правило</TableHead>
                    <TableHead>Результат</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map(column => {
                    const row = preview.rows.find(
                      item => item.source === column.name
                    );
                    return (
                      <TableRow key={column.name}>
                        <TableCell>{column.name}</TableCell>
                        <TableCell>{column.dtype}</TableCell>
                        <TableCell>{row ? row.ruleNumber : '—'}</TableCell>
                        <TableCell>
                          {!row
                            ? 'Без изменений'
                            : row.skipped
                              ? 'Пропущена: неподходящий тип'
                              : row.targets.join(', ')}
                        </TableCell>
                        <TableCell>
                          {row && (
                            <Button
                              variant='link'
                              size='xs'
                              onClick={() => customize(column.name, row.ruleId)}
                            >
                              Настроить отдельно
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Additional>
        </>
      )}
    </Stack>
  );
}
