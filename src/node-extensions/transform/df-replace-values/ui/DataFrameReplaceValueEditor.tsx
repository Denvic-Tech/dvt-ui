import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DeleteOutline as DeleteIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { Alert, Box, Collapse, Stack } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';

import {
  buildDictionaryFromPairs,
  createEmptyPair,
  mapDictionaryToPairs,
  ReplaceValuePair,
} from './helpers';
import {
  AddRuleButton,
  ArrowIcon,
  CountBadge,
  DeleteButton,
  EditorTextField,
  ErrorAlert,
  Root,
  RulesContainer,
  SectionCard,
  SectionHeader,
  SectionHint,
  SectionLabel,
  SelectorShell,
  WarningBlock,
  WarningText,
} from './styles';

interface ReplaceValuesData {
  column_to_replace?: string;
  dictionary?: Record<string, string>;
}

const ReplaceArrowIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M5 12h14' />
    <path d='M12 5l7 7-7 7' />
  </svg>
);

const AddRuleIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M12 5v14' />
    <path d='M5 12h14' />
  </svg>
);

export const DataFrameReplaceValuesEditor: React.FC<
  NodeModalExtensionProps<ReplaceValuesData>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  const dataframeMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );
  const [pairs, setPairs] = useState<ReplaceValuePair[]>([]);

  const duplicateKeys = useMemo(() => {
    const counts = pairs.reduce(
      (acc, p) => {
        const k = p.key.trim();
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return new Set(Object.keys(counts).filter(k => counts[k] > 1));
  }, [pairs]);

  useEffect(() => {
    const incomingDictionary = localValues.dictionary ?? {};
    const hasIncomingValues = Object.keys(incomingDictionary).length > 0;
    const hasOnlyPlaceholder =
      pairs.length === 0 ||
      (pairs.length === 1 && pairs[0].key === '' && pairs[0].value === '');

    if (hasIncomingValues) {
      const currentDictionary = buildDictionaryFromPairs(pairs);
      const isOutOfSync =
        JSON.stringify(currentDictionary) !==
        JSON.stringify(incomingDictionary);

      if (hasOnlyPlaceholder && isOutOfSync) {
        setPairs(mapDictionaryToPairs(incomingDictionary));
      }
      return;
    }

    if (pairs.length === 0) {
      setPairs([createEmptyPair()]);
    }
  }, [localValues.dictionary, pairs]);

  const syncChanges = useCallback(
    (newPairs: typeof pairs) => {
      const dict = buildDictionaryFromPairs(newPairs);
      setLocalValues(prev => ({ ...prev, dictionary: dict }));
      if (errors.length > 0) setErrors([]);
    },
    [setLocalValues, errors]
  );

  const addPair = () => {
    const newPairs = [...pairs, createEmptyPair()];
    setPairs(newPairs);
  };

  const removePair = (id: number) => {
    const newPairs = pairs.filter(p => p.id !== id);
    const finalPairs = newPairs.length > 0 ? newPairs : [createEmptyPair()];
    setPairs(finalPairs);
    syncChanges(finalPairs);
  };

  const updatePair = (id: number, field: 'key' | 'value', val: string) => {
    const newPairs = pairs.map(p => (p.id === id ? { ...p, [field]: val } : p));
    setPairs(newPairs);
    syncChanges(newPairs);
  };

  const validate = useCallback(() => {
    const newErrors: string[] = [];
    if (!localValues.column_to_replace) {
      newErrors.push('Выберите колонку для замены.');
    }

    if (duplicateKeys.size > 0) {
      const dups = Array.from(duplicateKeys).map(k =>
        k === '' ? 'NULL (пустое поле)' : `"${k}"`
      );
      newErrors.push(
        `Обнаружены дубликаты ключей: ${dups.join(', ')}. Ключи должны быть уникальными.`
      );
    }

    const dictKeys = Object.keys(localValues.dictionary || {});
    if (dictKeys.length === 0) {
      newErrors.push('Добавьте хотя бы одно правило замены.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [localValues, duplicateKeys]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  if (!dataframeMetadata) {
    return (
      <Alert severity='info' sx={{ borderRadius: 3 }}>
        Подключите входной DataFrame.
      </Alert>
    );
  }

  return (
    <Root>
      <Collapse in={errors.length > 0}>
        <ErrorAlert severity='error'>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </ErrorAlert>
      </Collapse>

      <SectionCard>
        <SectionLabel as='div'>Выбор колонки</SectionLabel>
        <SelectorShell>
          <ColumnDropdownSelect
            value={localValues.column_to_replace || ''}
            columns={columns}
            onChange={name => {
              setLocalValues(prev => ({ ...prev, column_to_replace: name }));
              setErrors([]);
            }}
            placeholder='Выберите целевую колонку...'
          />
        </SelectorShell>
      </SectionCard>

      <SectionCard>
        <SectionHeader>
          <Box>
            <SectionLabel as='div'>Словарь замен</SectionLabel>
            <SectionHint>
              Каждый ключ должен быть уникальным. Пустое поле = замена NULL.
            </SectionHint>
          </Box>
          <CountBadge>{pairs.length}</CountBadge>
        </SectionHeader>

        <RulesContainer>
          {pairs.map(pair => {
            const isDuplicate = duplicateKeys.has(pair.key.trim());
            const isDeleteDisabled =
              pairs.length === 1 && pair.key === '' && pair.value === '';

            return (
              <Stack
                key={pair.id}
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 1, md: 1.75 }}
                alignItems={{ xs: 'stretch', md: 'flex-start' }}
              >
                <EditorTextField
                  variant='outlined'
                  size='small'
                  fullWidth
                  value={pair.key}
                  error={isDuplicate}
                  onChange={e => updatePair(pair.id, 'key', e.target.value)}
                  placeholder='Искать значение'
                  helperText={isDuplicate ? 'Этот ключ уже используется' : ''}
                />

                <ArrowIcon>
                  <ReplaceArrowIcon />
                </ArrowIcon>

                <EditorTextField
                  variant='outlined'
                  size='small'
                  fullWidth
                  value={pair.value}
                  onChange={e => updatePair(pair.id, 'value', e.target.value)}
                  placeholder='Заменить на'
                />

                <DeleteButton
                  onClick={() => removePair(pair.id)}
                  disabled={isDeleteDisabled}
                  size='small'
                >
                  <DeleteIcon fontSize='small' />
                </DeleteButton>
              </Stack>
            );
          })}
        </RulesContainer>

        <AddRuleButton type='button' onClick={addPair}>
          <AddRuleIcon />
          Добавить правило
        </AddRuleButton>
      </SectionCard>

      <WarningBlock>
        <WarningIcon
          sx={{
            color: '#d97706',
            fontSize: 18,
            flexShrink: 0,
            mt: '1px',
          }}
        />
        <WarningText>
          <strong>Важно:</strong> Ключи не должны повторяться. Для замены
          нескольких значений на одно создайте отдельные правила.
        </WarningText>
      </WarningBlock>
    </Root>
  );
};
