import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Plus, X } from 'lucide-react';

import type { Column } from '@/shared/gatewayClient';
import type { CodeEditorCompletionProvider } from '@/shared/ui/code-editor';
import { PythonCodeInput } from '@/shared/ui/node-input/PythonCodeInput';
import { Button, Combobox, Input, Select } from '@/shared/ui/primitives';

import type { Operation, Pair, Params } from './model';

const units = [
  { value: 'years', label: 'лет' },
  { value: 'months', label: 'месяцев' },
  { value: 'days', label: 'дней' },
  { value: 'hours', label: 'часов' },
  { value: 'minutes', label: 'минут' },
  { value: 'seconds', label: 'секунд' },
] as const;
type Unit = (typeof units)[number]['value'];
const periods = [
  ['month', 'Месяц'],
  ['week', 'Неделя'],
  ['year', 'Год'],
  ['day', 'День'],
  ['hour', 'Час'],
  ['minute', 'Минута'],
  ['second', 'Секунда'],
].map(([value, label]) => ({ value: value!, label }));
const timezoneOptions = Array.from(
  new Set([
    'UTC',
    'Europe/Moscow',
    'Asia/Yekaterinburg',
    ...((
      Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.('timeZone') ?? []),
  ])
).map(value => ({ value, label: value }));

export function ExpressionField({
  value,
  onChange,
  columns,
  currentColumn = false,
}: {
  value: string;
  onChange: (value: string) => void;
  columns: Column[];
  currentColumn?: boolean;
}) {
  const completionProviders = useMemo<CodeEditorCompletionProvider<void>[]>(
    () => [
      {
        id: 'dataframe-columns',
        priority: 0,
        getSections: ({ wordRange }) => [
          {
            id: 'columns',
            title: 'Колонки',
            items: [
              ...(currentColumn
                ? [
                    {
                      label: '__column__',
                      insertText: '__column__',
                      detail: 'Текущая колонка',
                    },
                  ]
                : []),
              ...columns.map(column => ({
                label: column.name,
                insertText: '\x60' + column.name + '\x60',
                detail: column.dtype,
              })),
            ].map(item => ({
              ...item,
              kind: 'field' as const,
              range: wordRange,
            })),
          },
        ],
      },
    ],
    [columns, currentColumn]
  );
  return (
    <PythonCodeInput
      value={value}
      onChange={onChange}
      height={110}
      completionProviders={completionProviders}
      helperText={
        currentColumn
          ? '__column__ — значение обрабатываемой колонки. Подсказки — Tab.'
          : 'Выражение использует только исходные колонки. Подсказки — Tab.'
      }
    />
  );
}

function ReplacementValue({
  value,
  label,
  onChange,
  onPaste,
}: {
  value: Pair['old'];
  label: string;
  onChange: (value: Pair['old']) => void;
  onPaste?: React.ClipboardEventHandler<HTMLDivElement>;
}) {
  return (
    <Input
      label={label}
      value={value == null ? '' : String(value)}
      disabled={value === null}
      placeholder={value === null ? 'NULL' : 'Пустая строка'}
      onChange={event => onChange(event.target.value)}
      onPaste={onPaste}
      endAdornment={
        <Button
          size='xs'
          variant={value === null ? 'secondary' : 'ghost'}
          aria-label={
            label +
            ': ' +
            (value === null ? 'использовать текст' : 'использовать NULL')
          }
          onClick={() => onChange(value === null ? '' : null)}
        >
          NULL
        </Button>
      }
    />
  );
}

export function OperationFields({
  operation,
  params,
  columns,
  onChange,
}: {
  operation: Operation;
  params: Params;
  columns: Column[];
  onChange: (params: Params) => void;
}) {
  const update = (patch: Partial<Params>) => onChange({ ...params, ...patch });
  if (operation === 'replace') {
    const pairs = params.pairs ?? [];
    const updatePairs = (next: Pair[]) => {
      const { legacy_dictionary: _legacy, ...rest } = params;
      onChange({ ...rest, pairs: next });
    };
    return (
      <Stack spacing={1.5}>
        {pairs.map((pair, index) => (
          <Stack key={index} direction='row' spacing={1} alignItems='center'>
            <ReplacementValue
              label='Что заменить'
              value={pair.old}
              onChange={old =>
                updatePairs(
                  pairs.map((item, i) =>
                    i === index ? { ...item, old } : item
                  )
                )
              }
              onPaste={event => {
                const text = event.clipboardData.getData('text/plain');
                if (!text.includes('\t')) return;
                event.preventDefault();
                const imported = text
                  .replace(/\r/g, '')
                  .replace(/\n$/, '')
                  .split('\n')
                  .map(line => {
                    const [old = '', ...rest] = line.split('\t');
                    return { old, new: rest.join('\t') };
                  });
                updatePairs([
                  ...pairs.slice(0, index),
                  ...imported,
                  ...pairs.slice(index + 1),
                ]);
              }}
            />
            <Typography aria-hidden>→</Typography>
            <ReplacementValue
              label='На что заменить'
              value={pair.new}
              onChange={value =>
                updatePairs(
                  pairs.map((item, i) =>
                    i === index ? { ...item, new: value } : item
                  )
                )
              }
            />
            <Button
              aria-label={'Удалить замену ' + (index + 1)}
              size='icon-sm'
              variant='ghost'
              onClick={() => updatePairs(pairs.filter((_, i) => i !== index))}
            >
              <X size={16} />
            </Button>
          </Stack>
        ))}
        <Button
          size='sm'
          variant='outline'
          startIcon={<Plus size={16} />}
          onClick={() => updatePairs([...pairs, { old: '', new: '' }])}
        >
          Добавить замену
        </Button>
        {params.legacy_dictionary && (
          <Typography variant='caption'>
            Существующий словарь сохраняет прежнюю обработку NULL до изменения
            замен.
          </Typography>
        )}
      </Stack>
    );
  }
  if (operation === 'regex')
    return (
      <Stack spacing={2}>
        <Input
          label='Регулярное выражение'
          value={params.pattern ?? ''}
          onChange={event => update({ pattern: event.target.value })}
        />
        <Input
          label='Замена'
          value={params.replacement ?? ''}
          onChange={event => update({ replacement: event.target.value })}
          placeholder='Пустая строка удаляет совпадения'
        />
      </Stack>
    );
  if (operation === 'timezone')
    return (
      <Box>
        <Typography variant='caption'>Часовой пояс</Typography>
        <Combobox
          options={timezoneOptions}
          value={params.timezone}
          searchPlaceholder='Найти часовой пояс'
          onValueChange={value => update({ timezone: String(value) })}
        />
      </Box>
    );
  if (operation === 'period')
    return (
      <Select
        aria-label='Период'
        options={periods}
        value={params.period ?? 'month'}
        onChange={period => update({ period })}
      />
    );
  if (operation === 'delta') {
    const active = units.filter(unit => params[unit.value] !== undefined);
    const free = units.filter(unit => params[unit.value] === undefined);
    return (
      <Stack spacing={1}>
        {active.map(unit => (
          <Stack key={unit.value} direction='row' spacing={1}>
            <Input
              label='Смещение'
              type='number'
              value={params[unit.value] ?? 0}
              onChange={event =>
                update({ [unit.value]: Number(event.target.value) })
              }
            />
            <Select
              value={unit.value}
              options={[unit, ...free]}
              onChange={value => {
                const next = { ...params };
                delete next[unit.value];
                next[value as Unit] = params[unit.value] ?? 0;
                onChange(next);
              }}
            />
            <Button
              variant='ghost'
              aria-label={'Удалить компонент ' + unit.label}
              onClick={() => {
                const next = { ...params };
                delete next[unit.value];
                onChange(next);
              }}
            >
              <X size={16} />
            </Button>
          </Stack>
        ))}
        {!!free.length && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => update({ [free[0]!.value]: 0 })}
          >
            Добавить компонент
          </Button>
        )}
      </Stack>
    );
  }
  if (operation === 'split')
    return (
      <Stack spacing={2}>
        <Input
          label='Разделитель'
          value={params.delimiter ?? ''}
          onChange={event => update({ delimiter: event.target.value })}
        />
        <Input
          label='Максимум разделений'
          type='number'
          value={params.max_splits ?? 1}
          onChange={event => update({ max_splits: Number(event.target.value) })}
        />
      </Stack>
    );
  return (
    <ExpressionField
      value={params.expression ?? ''}
      onChange={expression => update({ expression })}
      columns={columns}
      currentColumn
    />
  );
}
