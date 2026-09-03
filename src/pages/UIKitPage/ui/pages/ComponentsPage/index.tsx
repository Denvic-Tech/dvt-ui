import * as React from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Box from '@mui/material/Box';

import {
  ColumnNameNodeInput,
  ListNodeInput,
  LiteralNodeInput,
} from '@/features/node/use-universal-node-data-input/ui/inputs';

import {
  ColumnDropdownSelect,
  ColumnListSelect,
} from '@/entities/data/dataframe';

import {
  makeExpressionValue,
  makeVariableExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  DVTDateTimePicker,
  JSONNodeInput,
  MappingNodeInput,
  PrimitiveNodeInput,
  type PrimitiveNodeInputInlineAction,
  PythonCodeInput,
  TemplateMonacoInput,
  TimeDeltaInput,
} from '@/shared/ui/node-input';
import { Select } from '@/shared/ui/primitives';

import {
  columnNameMultiDefinition,
  columnNameSingleDefinition,
  componentColumns,
  componentVariables,
  jsonInitialValue,
  listDefinition,
  literalDefinition,
  mappingInitialRows,
  type PrimitiveDemoKey,
  primitiveInputDemoConfigs,
  primitiveInputTypeOrder,
  pythonInitialValue,
  templateInitialValue,
} from '../../../model/components-demo';
import { SectionCard } from '../../SectionCard';
import { UIKitDemoField, UIKitPageLead } from '../../UIKitShowcase';

export const ComponentsPageLead = () => (
  <UIKitPageLead
    description='Node-oriented controls и editors, которыми уже пользуются node extensions. Секция нужна для быстрой ручной проверки состояний.'
    title='Components'
  />
);

export const ComponentsScalarInputsSection = () => {
  const [primitiveType, setPrimitiveType] =
    React.useState<PrimitiveDemoKey>('STRING');
  const [primitiveValue, setPrimitiveValue] = React.useState<unknown>(
    primitiveInputDemoConfigs.STRING.initialValue
  );
  const [literalValue, setLiteralValue] = React.useState<unknown>('upsert');
  const [listValue, setListValue] = React.useState<unknown[]>([
    'vip',
    'retention',
    'enterprise',
  ]);
  const [durationValue, setDurationValue] = React.useState('+0-0-7-12-30-0');
  const [dateTimeValue, setDateTimeValue] = React.useState<string | null>(
    '2026-04-01T12:45:00.000Z'
  );
  const [leftActionValue, setLeftActionValue] =
    React.useState<unknown>('api/customer_360');
  const [rightActionsValue, setRightActionsValue] =
    React.useState<unknown>('sk-demo-42');
  const [bothSidesValue, setBothSidesValue] = React.useState<unknown>(2500);

  const selectedPrimitiveDemo = primitiveInputDemoConfigs[primitiveType];

  const handlePrimitiveTypeChange = React.useCallback(
    (nextType: PrimitiveDemoKey) => {
      setPrimitiveType(nextType);
      setPrimitiveValue(primitiveInputDemoConfigs[nextType].initialValue);
    },
    []
  );
  const leftInlineActions = React.useMemo<PrimitiveNodeInputInlineAction[]>(
    () => [
      {
        id: 'prefix-base-url',
        side: 'start',
        ariaLabel: 'Подставить базовый URL',
        tooltip: 'Подставить https:// перед значением',
        icon: <LinkRoundedIcon fontSize='small' />,
        onClick: () =>
          setLeftActionValue((currentValue: unknown) => {
            const resolvedValue =
              typeof currentValue === 'string' && currentValue.length > 0
                ? currentValue
                : 'api.denvic.dev/v1';

            return resolvedValue.startsWith('https://')
              ? resolvedValue
              : `https://${resolvedValue}`;
          }),
      },
    ],
    []
  );
  const rightInlineActions = React.useMemo<PrimitiveNodeInputInlineAction[]>(
    () => [
      {
        id: 'preset-token',
        ariaLabel: 'Подставить demo token',
        tooltip: 'Подставить готовый demo token',
        icon: <ContentCopyRoundedIcon fontSize='small' />,
        onClick: () => setRightActionsValue('sk-demo-customer-360'),
      },
      {
        id: 'use-variable-expression',
        ariaLabel: 'Подставить expression',
        tooltip: 'Заполнить через project variable',
        icon: <AutoFixHighRoundedIcon fontSize='small' />,
        onClick: () =>
          setRightActionsValue(makeExpressionValue('owner_email', 'single')),
      },
    ],
    []
  );
  const bothSidesInlineActions = React.useMemo<
    PrimitiveNodeInputInlineAction[]
  >(
    () => [
      {
        id: 'set-default-limit',
        side: 'start',
        ariaLabel: 'Подставить стандартный лимит',
        tooltip: 'Подставить стандартный лимит 5000',
        icon: <CalculateRoundedIcon fontSize='small' />,
        onClick: () => setBothSidesValue(5000),
      },
      {
        id: 'increase-limit',
        ariaLabel: 'Увеличить лимит',
        tooltip: 'Добавить 500 к текущему значению',
        icon: <AddRoundedIcon fontSize='small' />,
        onClick: () =>
          setBothSidesValue((currentValue: unknown) =>
            typeof currentValue === 'number' ? currentValue + 500 : 500
          ),
      },
      {
        id: 'reset-limit',
        ariaLabel: 'Сбросить лимит',
        tooltip: 'Вернуть значение 1000',
        icon: <RefreshRoundedIcon fontSize='small' />,
        onClick: () => setBothSidesValue(1000),
      },
    ],
    []
  );

  return (
    <>
      <SectionCard
        description='Универсальный scalar input для primitive-типов и встроенных inline actions.'
        title='PrimitiveNodeInput'
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <UIKitDemoField
            hint='Переключение подменяет contract и стартовое demo-значение.'
            label='Primitive type'
          >
            <Select
              options={primitiveInputTypeOrder.map(type => ({
                label: primitiveInputDemoConfigs[type].label,
                value: type,
              }))}
              placeholder='Select primitive type'
              value={primitiveType}
              onChange={value =>
                handlePrimitiveTypeChange(value as PrimitiveDemoKey)
              }
            />
          </UIKitDemoField>
          <UIKitDemoField hint={selectedPrimitiveDemo.hint} label='Preview'>
            <PrimitiveNodeInput
              value={primitiveValue}
              inputDefinition={selectedPrimitiveDemo.definition}
              onChange={setPrimitiveValue}
              variables={componentVariables}
            />
          </UIKitDemoField>
          <UIKitDemoField
            hint='Кнопка слева подставляет protocol prefix и остаётся внутри поля.'
            label='Left action'
          >
            <PrimitiveNodeInput
              value={leftActionValue}
              inlineActions={leftInlineActions}
              inputDefinition={primitiveInputDemoConfigs.STRING.definition}
              onChange={setLeftActionValue}
              variables={componentVariables}
            />
          </UIKitDemoField>
          <UIKitDemoField
            hint='Справа можно комбинировать custom actions с built-in переходом в expression mode и очисткой.'
            label='Right actions'
          >
            <PrimitiveNodeInput
              value={rightActionsValue}
              inlineActions={rightInlineActions}
              inputDefinition={primitiveInputDemoConfigs.STRING.definition}
              masked
              onChange={setRightActionsValue}
              variables={componentVariables}
            />
          </UIKitDemoField>
          <UIKitDemoField
            hint='Числовой input поддерживает встроенные actions по обе стороны.'
            label='Both sides'
          >
            <PrimitiveNodeInput
              value={bothSidesValue}
              inlineActions={bothSidesInlineActions}
              inputDefinition={primitiveInputDemoConfigs.INT.definition}
              onChange={setBothSidesValue}
              variables={componentVariables}
            />
          </UIKitDemoField>
        </Box>
      </SectionCard>

      <SectionCard
        description='Частые scalar-варианты для literal, list и datetime.'
        title='Other scalar inputs'
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <LiteralNodeInput
            currentValue={literalValue}
            inputDefinition={literalDefinition}
            nodeId='demo-node'
            onChange={setLiteralValue}
          />
          <ListNodeInput
            currentValue={listValue}
            inputDefinition={listDefinition}
            nodeId='demo-node'
            onChange={setListValue}
          />
          <TimeDeltaInput onChange={setDurationValue} value={durationValue} />
          <DVTDateTimePicker
            initialIsoValue={dateTimeValue}
            onPythonDateTimeChange={setDateTimeValue}
          />
        </Box>
      </SectionCard>
    </>
  );
};

export const ComponentsColumnsMetadataSection = () => {
  const [columnValue, setColumnValue] = React.useState('customer_id');
  const [columnsValue, setColumnsValue] = React.useState<string[]>([
    'customer_id',
    'revenue',
  ]);
  const [columnNameValue, setColumnNameValue] = React.useState<string | null>(
    'normalized_country'
  );
  const [columnNameListValue, setColumnNameListValue] = React.useState<
    string[]
  >(['customer_id', 'lifecycle_score']);

  const handleSingleColumnNameChange = React.useCallback(
    (value: string | string[] | null | undefined) => {
      setColumnNameValue(typeof value === 'string' ? value : null);
    },
    []
  );

  const handleMultiColumnNameChange = React.useCallback(
    (value: string | string[] | null | undefined) => {
      if (Array.isArray(value)) {
        setColumnNameListValue(value);
        return;
      }

      setColumnNameListValue(value ? [value] : []);
    },
    []
  );

  return (
    <>
      <SectionCard
        description='Dropdown и list-сценарии для выбора колонок.'
        title='Column selects'
      >
        <ColumnDropdownSelect
          columns={componentColumns}
          onChange={setColumnValue}
          value={columnValue}
        />
        <ColumnDropdownSelect
          multiple
          columns={componentColumns}
          onChange={setColumnsValue}
          value={columnsValue}
        />
        <ColumnListSelect
          columns={componentColumns}
          onChange={setColumnsValue}
          value={columnsValue}
        />
      </SectionCard>

      <SectionCard
        description='Metadata-aware обёртка для single и multi режимов.'
        title='ColumnNameNodeInput'
      >
        <UIKitDemoField label='Single value'>
          <ColumnNameNodeInput
            columns={componentColumns}
            currentValue={columnNameValue}
            inputDefinition={columnNameSingleDefinition}
            onChange={handleSingleColumnNameChange}
          />
        </UIKitDemoField>
        <UIKitDemoField label='Multiple values'>
          <ColumnNameNodeInput
            columns={componentColumns}
            currentValue={columnNameListValue}
            inputDefinition={columnNameMultiDefinition}
            onChange={handleMultiColumnNameChange}
          />
        </UIKitDemoField>
      </SectionCard>
    </>
  );
};

export const ComponentsStructuredInputsSection = () => {
  const [jsonValue, setJsonValue] = React.useState<unknown>(jsonInitialValue);
  const [jsonVariableValue, setJsonVariableValue] = React.useState<unknown>(
    makeVariableExpressionValue('pipeline_config')
  );
  const [mappingRows, setMappingRows] = React.useState(mappingInitialRows);

  return (
    <>
      <SectionCard
        description='JSON editor с format/binding режимами.'
        title='JSONNodeInput'
      >
        <UIKitDemoField label='Constant JSON'>
          <JSONNodeInput
            onChange={setJsonValue}
            value={jsonValue}
            variables={componentVariables}
          />
        </UIKitDemoField>
        <UIKitDemoField label='Variable binding'>
          <JSONNodeInput
            onChange={setJsonVariableValue}
            value={jsonVariableValue}
            variables={componentVariables}
          />
        </UIKitDemoField>
      </SectionCard>

      <SectionCard
        description='Табличный key-value editor для mapping сценариев.'
        title='MappingNodeInput'
      >
        <MappingNodeInput
          emptyHint='Используйте для простых rename/mapping сценариев.'
          keyPlaceholder='Source field'
          onRowsChange={setMappingRows}
          options={componentColumns.map(column => column.name)}
          rows={mappingRows}
          valuePlaceholder='Target field'
        />
      </SectionCard>
    </>
  );
};

export const ComponentsCodeTemplatesSection = () => {
  const [pythonValue, setPythonValue] = React.useState(pythonInitialValue);
  const [templateValue, setTemplateValue] = React.useState<unknown>(
    makeExpressionValue(templateInitialValue, 'template')
  );

  return (
    <>
      <SectionCard
        description='Python editor с completion по runtime variables.'
        title='PythonCodeInput'
      >
        <PythonCodeInput
          helperText='Демо показывает runtime-переменные для python-выражений.'
          onChange={setPythonValue}
          value={pythonValue}
          variables={componentVariables}
        />
      </SectionCard>

      <SectionCard
        description='Шаблонный Monaco editor для SQL и template bindings.'
        title='TemplateMonacoInput'
      >
        <TemplateMonacoInput
          allowExpressions
          helperText='Template mode активирован сразу.'
          language='sql'
          onChange={setTemplateValue}
          value={templateValue}
          variables={componentVariables}
        />
      </SectionCard>
    </>
  );
};
