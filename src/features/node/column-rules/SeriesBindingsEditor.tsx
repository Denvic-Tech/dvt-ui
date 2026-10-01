import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Stack, Typography } from '@mui/material';
import { Trash2 } from 'lucide-react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';
import { useAppSelector } from '@/app/providers/store';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { selectAllMetadata } from '@/entities/node/node-metadata/model/selectors';
import { selectGraphEdgesRaw } from '@/entities/project-editor/graph';

import type { DataFrameMetadata, SeriesMetadata } from '@/shared/gatewayClient';
import { Button, Checkbox, Combobox, Input } from '@/shared/ui/primitives';

import { Additional } from './Additional';
import { type ColumnBinding, type Values, withoutBinding } from './model';

export function SeriesBindingsEditor(props: NodeModalExtensionProps) {
  const { setLocalInputData, setValidationCallback } = props;
  const values = props.localInputData as Values;
  const edges = useAppSelector(selectGraphEdgesRaw);
  const metadata = useAppSelector(selectAllMetadata);
  const { getConnectedInputMetadata } = useNodeConnections(props.id);
  const df = getConnectedInputMetadata('df') as DataFrameMetadata | undefined;
  const sources = useMemo(
    () =>
      edges
        .filter(
          edge =>
            edge.target === props.id &&
            edge.targetHandle === 'input-column_data'
        )
        .map(
          edge =>
            metadata[edge.source]?.[
              edge.sourceHandle?.replace(/^output-/, '') ?? ''
            ]
        )
        .filter(
          (item): item is SeriesMetadata =>
            !!item && 'column_data' in item && 'name' in item
        ),
    [edges, metadata, props.id]
  );
  const bindings = useMemo<ColumnBinding[]>(
    () =>
      values.column_bindings ??
      (values.column_name
        ? [{ source: sources[0]?.name ?? '', target: values.column_name }]
        : []),
    [values.column_bindings, values.column_name, sources]
  );
  const [submitted, setSubmitted] = useState(false);
  const overwrite =
    values.overwrite_existing ??
    (values.column_bindings == null && !!values.column_name);
  const save = useCallback(
    (next: typeof bindings) =>
      setLocalInputData(previous => ({
        ...previous,
        column_bindings: next,
        overwrite_existing: overwrite,
      })),
    [setLocalInputData, overwrite]
  );
  useEffect(() => {
    if (
      values.column_bindings == null &&
      !values.column_name &&
      sources.length
    ) {
      save(
        sources.map(source => ({
          source: source.name,
          target: df?.columns.some(column => column.name === source.name)
            ? source.name + '_new'
            : source.name,
        }))
      );
    }
  }, [values.column_bindings, values.column_name, sources, df, save]);
  const names = bindings.map(binding => binding.target);
  const invalid =
    !bindings.length ||
    new Set(names).size !== names.length ||
    new Set(sources.map(source => source.name)).size !== sources.length ||
    bindings.some(
      binding =>
        (binding.source === null ? sources.length > 1 : !binding.source) ||
        (!binding.target?.trim() && !binding.input_bindings?.['target']) ||
        (binding.source !== null &&
          sources.length > 0 &&
          !sources.some(source => source.name === binding.source)) ||
        (!overwrite &&
          df?.columns.some(column => column.name === binding.target))
    );
  const validate = useCallback(() => {
    setSubmitted(true);
    return !invalid;
  }, [invalid]);
  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);
  return (
    <Stack spacing={2}>
      <Typography variant='body2'>
        Подключите Series к входу «column_data» и задайте имена результатов.
      </Typography>
      {!sources.length && (
        <Alert severity='info'>
          Нет метаданных Series. Имена источников будут проверены при запуске.
        </Alert>
      )}
      {submitted && invalid && (
        <Alert severity='error'>
          Проверьте источники, уникальность имён и разрешение перезаписи.
          Подключённые Series должны иметь разные имена.
        </Alert>
      )}
      {bindings.map((binding, index) => (
        <Stack key={index} direction='row' spacing={1}>
          {sources.length ? (
            <Combobox
              value={binding.source ?? '__single__'}
              options={[
                ...(binding.source === null
                  ? [
                      {
                        value: '__single__',
                        label: 'Единственная подключённая Series',
                      },
                    ]
                  : []),
                ...sources.map(source => ({
                  value: source.name,
                  label: source.name,
                })),
              ]}
              placeholder='Исходная Series'
              onValueChange={source =>
                save(
                  bindings.map((item, i) =>
                    i === index
                      ? {
                          ...item,
                          source:
                            source === '__single__' ? null : String(source),
                        }
                      : item
                  )
                )
              }
            />
          ) : (
            <Input
              label='Имя исходной Series'
              value={binding.source}
              onChange={event =>
                save(
                  bindings.map((item, i) =>
                    i === index ? { ...item, source: event.target.value } : item
                  )
                )
              }
            />
          )}
          <Input
            label='Имя результата'
            value={binding.target ?? ''}
            onChange={event =>
              save(
                bindings.map((item, i) =>
                  i === index
                    ? {
                        ...withoutBinding(item, 'target'),
                        target: event.target.value,
                      }
                    : item
                )
              )
            }
          />
          <Button
            variant='ghost'
            aria-label='Удалить привязку'
            onClick={() => save(bindings.filter((_, i) => i !== index))}
          >
            <Trash2 size={16} />
          </Button>
        </Stack>
      ))}
      <Button
        variant='outline'
        onClick={() => save([...bindings, { source: '', target: '' }])}
      >
        Добавить колонку
      </Button>
      <Additional
        summary={overwrite ? 'перезапись разрешена' : ''}
        reveal={submitted && invalid ? 1 : 0}
      >
        <label>
          <Checkbox
            checked={overwrite}
            onCheckedChange={overwrite_existing =>
              props.setLocalInputData(previous => ({
                ...previous,
                column_bindings: bindings,
                overwrite_existing,
              }))
            }
          />
          Разрешить перезапись существующих колонок
        </label>
        <Typography variant='caption'>
          Series выравниваются по индексу таблицы. Одинаковое количество строк
          не гарантирует совпадения индексов.
        </Typography>
        <Typography variant='body2'>Что изменится</Typography>
        {bindings.map((binding, index) => (
          <Typography key={index} variant='caption'>
            {binding.source ?? 'Единственная Series'} → {binding.target || '?'}
          </Typography>
        ))}
      </Additional>
    </Stack>
  );
}
