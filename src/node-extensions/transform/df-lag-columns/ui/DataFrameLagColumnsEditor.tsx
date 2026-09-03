import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  History as LagIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { InputAdornment, Stack, TextField, Typography } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnListSelect } from '@/entities/data/dataframe';

import { DataFrameMetadata } from '@/shared/gatewayClient';

import {
  CardBody,
  CleanCard,
  ColumnsSection,
  EditorRoot,
  ErrorBanner,
  ErrorList,
  FlexCleanCard,
  InfoBanner,
  MutedLagIcon,
  MutedStepsIcon,
  PaddedContainer,
  ParamsSection,
  SectionLabel,
  SectionLabelRow,
  SelectorWrapper,
} from './styles';

interface LagColumnsValues {
  columns_to_lag?: string[];
  lag_steps?: number;
  fill_value?: string | number | boolean | null;
}

export const DataFrameLagColumnsEditor: React.FC<
  NodeModalExtensionProps<LagColumnsValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const [errors, setErrors] = useState<string[]>([]);

  // Use ref to keep current values inside validator
  const valuesRef = useRef(localValues);
  useEffect(() => {
    valuesRef.current = localValues;
  }, [localValues]);

  const dataframeMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const columns = useMemo(
    () => dataframeMetadata?.columns ?? [],
    [dataframeMetadata]
  );

  const [lagStepsInput, setLagStepsInput] = useState<string>(() => {
    const initial = localValues.lag_steps;
    return initial === undefined || initial === null ? '' : String(initial);
  });
  const didInitRef = useRef(false);

  // Force default state on open
  useEffect(() => {
    if (didInitRef.current) return;
    if (localValues.lag_steps === undefined) {
      setLocalValues(prev => ({ ...prev, lag_steps: 0 }));
      setLagStepsInput('0');
    }
    didInitRef.current = true;
  }, [localValues.lag_steps, setLocalValues, setLagStepsInput]);

  useEffect(() => {
    const next = localValues.lag_steps;
    setLagStepsInput(next === undefined || next === null ? '' : String(next));
  }, [localValues.lag_steps, nodeID]);

  const validate = useCallback(() => {
    const currentValues = valuesRef.current;
    const newErrors: string[] = [];

    if (
      !currentValues.columns_to_lag ||
      currentValues.columns_to_lag.length === 0
    ) {
      newErrors.push('Выберите хотя бы одну колонку.');
    }

    const steps = currentValues.lag_steps;
    if (steps === 0 || steps === undefined || steps === null) {
      newErrors.push('Шаг сдвига не может быть равен 0. Измените значение.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, []);

  useEffect(() => {
    if (setValidationCallback) {
      setValidationCallback(() => validate);
    }
  }, [setValidationCallback, validate]);

  const handleFieldChange = (field: keyof LagColumnsValues, val: any) => {
    setLocalValues(prev => ({ ...prev, [field]: val }));
  };

  const handleLagStepsChange = (raw: string) => {
    setLagStepsInput(raw);

    if (raw.trim() === '') {
      handleFieldChange('lag_steps', undefined);
      return;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      handleFieldChange('lag_steps', undefined);
      return;
    }

    handleFieldChange('lag_steps', parseInt(raw, 10));
  };

  if (!dataframeMetadata) {
    return (
      <PaddedContainer>
        <CleanCard>
          <CardBody>
            <InfoBanner>
              <InfoIcon fontSize='small' />
              Подключите датафрейм ко входу ноды.
            </InfoBanner>
          </CardBody>
        </CleanCard>
      </PaddedContainer>
    );
  }

  return (
    <EditorRoot>
      {errors.length > 0 && (
        <ErrorBanner>
          <ErrorList>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ErrorList>
        </ErrorBanner>
      )}

      <ColumnsSection>
        <SectionLabelRow>
          <SectionLabel>Колонки для сдвига</SectionLabel>
          <MutedLagIcon />
        </SectionLabelRow>

        <FlexCleanCard>
          <CardBody>
            <SelectorWrapper>
              <ColumnListSelect
                columns={columns}
                value={localValues.columns_to_lag || []}
                onChange={next => handleFieldChange('columns_to_lag', next)}
              />
            </SelectorWrapper>
          </CardBody>
        </FlexCleanCard>
      </ColumnsSection>

      <ParamsSection>
        <SectionLabelRow>
          <SectionLabel>Параметры сдвига</SectionLabel>
          <MutedStepsIcon />
        </SectionLabelRow>

        <CleanCard>
          <CardBody>
            <Stack spacing={3}>
              <Stack direction='row' spacing={2}>
                <TextField
                  label='Шаги сдвига (Steps)'
                  type='number'
                  size='small'
                  fullWidth
                  error={
                    lagStepsInput.trim() === '' ||
                    localValues.lag_steps === 0 ||
                    localValues.lag_steps === undefined
                  }
                  helperText='Укажите число (например, 1 или -5)'
                  value={lagStepsInput}
                  onChange={e => handleLagStepsChange(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position='start'>
                          <LagIcon fontSize='small' />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label='Значение для NaN'
                  size='small'
                  fullWidth
                  placeholder='null'
                  value={localValues.fill_value ?? ''}
                  onChange={e =>
                    handleFieldChange('fill_value', e.target.value)
                  }
                />
              </Stack>

              {localValues.lag_steps !== 0 &&
                localValues.lag_steps !== undefined && (
                  <InfoBanner>
                    <InfoIcon fontSize='small' />
                    <Typography variant='caption'>
                      Новые колонки: <b>_lag{localValues.lag_steps}</b>
                    </Typography>
                  </InfoBanner>
                )}
            </Stack>
          </CardBody>
        </CleanCard>
      </ParamsSection>
    </EditorRoot>
  );
};
