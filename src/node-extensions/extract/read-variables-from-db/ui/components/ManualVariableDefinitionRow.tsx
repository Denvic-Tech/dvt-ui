import type { DbTable } from '@/shared/gatewayClient';

import { getManualColumnOptions } from '../../lib/helpers';
import type { ManualVariableDraft } from '../../lib/types';
import {
  CheckboxBox,
  CheckboxInput,
  CheckboxLabel,
  CheckboxLabelText,
  DefaultBadge,
  FieldHint,
  FieldLabel,
  IconButton,
  MonoInput,
  MutedInlineText,
  NullableBadge,
  NullPolicyExpandedBlock,
  NullPolicySummary,
  NullPolicyTitle,
  NullPolicyTriggerBtn,
  TextInput,
  VariableCard,
  VariableCardBody,
  VariableFieldsColumn,
  VariableFieldsRow,
  VariableHeaderRow,
} from '../styles';

import { CheckIcon, ChevronDownIcon, SparkleIcon, TrashIcon } from './icons';
import { OptionSelectField } from './OptionSelectField';
import { SelectorValueField } from './SelectorValueField';

type ManualVariableDefinitionRowProps = {
  isPolicyExpanded: boolean;
  onDelete: () => void;
  onPatch: (patch: Partial<ManualVariableDraft>) => void;
  onTogglePolicy: () => void;
  orderByRequiredAggregations: Set<string>;
  row: ManualVariableDraft;
  selectedTable: DbTable | null;
  supportedAggregations: string[];
  toneIndex: number;
};

export const ManualVariableDefinitionRow = ({
  isPolicyExpanded,
  onDelete,
  onPatch,
  onTogglePolicy,
  orderByRequiredAggregations,
  row,
  selectedTable,
  supportedAggregations,
  toneIndex,
}: ManualVariableDefinitionRowProps) => {
  const columnOptions = getManualColumnOptions(selectedTable);
  const showOrderByField = orderByRequiredAggregations.has(row.aggregation);
  const columnHelperText = selectedTable
    ? undefined
    : 'Подсказки колонок появятся после выбора literal table для всей ноды.';
  const hasPolicy = row.nullable || row.default_literal.trim().length > 0;

  return (
    <VariableCard toneIndex={toneIndex}>
      <VariableCardBody>
        <div>
          <FieldLabel>Имя переменной</FieldLabel>
          <VariableHeaderRow>
            <TextInput
              value={row.name}
              placeholder='Имя переменной'
              aria-label='Имя переменной'
              onChange={event => onPatch({ name: event.target.value })}
            />
            <IconButton
              type='button'
              variant='danger'
              aria-label='Удалить переменную'
              onClick={onDelete}
            >
              <TrashIcon />
            </IconButton>
          </VariableHeaderRow>
        </div>

        <VariableFieldsColumn>
          <VariableFieldsRow>
            <SelectorValueField
              label='Column'
              value={row.column_name}
              options={columnOptions}
              helperText={columnHelperText}
              placeholder='Выберите колонку'
              searchPlaceholder='Поиск колонки или =expression'
              onChange={column_name =>
                onPatch({
                  column_name,
                  order_by_column:
                    row.order_by_column && row.order_by_column === column_name
                      ? column_name
                      : row.order_by_column,
                })
              }
            />

            <OptionSelectField
              label='Aggregation'
              value={row.aggregation}
              options={supportedAggregations}
              onChange={aggregation =>
                onPatch({
                  aggregation,
                  order_by_column: undefined,
                })
              }
            />
          </VariableFieldsRow>

          {showOrderByField ? (
            <SelectorValueField
              label='Order By Column'
              value={row.order_by_column}
              options={columnOptions}
              helperText={columnHelperText}
              placeholder='Выберите колонку'
              searchPlaceholder='Поиск колонки или =expression'
              onChange={order_by_column => onPatch({ order_by_column })}
            />
          ) : null}
        </VariableFieldsColumn>
      </VariableCardBody>

      <NullPolicyTriggerBtn
        type='button'
        isExpanded={isPolicyExpanded}
        onClick={onTogglePolicy}
      >
        <NullPolicyTitle isActive={hasPolicy}>
          <SparkleIcon />
          Null Policy
        </NullPolicyTitle>
        <NullPolicySummary>
          {row.nullable ? <NullableBadge>nullable</NullableBadge> : null}
          {row.default_literal.trim() ? (
            <DefaultBadge>{`default: ${row.default_literal}`}</DefaultBadge>
          ) : null}
          {!hasPolicy ? <MutedInlineText>не настроена</MutedInlineText> : null}
          <ChevronDownIcon
            style={{
              transform: isPolicyExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </NullPolicySummary>
      </NullPolicyTriggerBtn>

      {isPolicyExpanded ? (
        <NullPolicyExpandedBlock>
          <CheckboxLabel>
            <CheckboxInput
              type='checkbox'
              checked={row.nullable}
              onChange={event => onPatch({ nullable: event.target.checked })}
            />
            <CheckboxBox isChecked={row.nullable}>
              {row.nullable ? <CheckIcon /> : null}
            </CheckboxBox>
            <CheckboxLabelText>
              <span className='main'>nullable</span>
              <span className='hint'>
                Разрешить NULL значения для этой переменной.
              </span>
            </CheckboxLabelText>
          </CheckboxLabel>

          <div>
            <FieldLabel>Default</FieldLabel>
            <MonoInput
              value={row.default_literal}
              placeholder='Например: null, 0, "fallback"'
              aria-label='Default literal'
              onChange={event =>
                onPatch({ default_literal: event.target.value })
              }
            />
            <FieldHint>Оставьте поле пустым, если default не нужен.</FieldHint>
          </div>
        </NullPolicyExpandedBlock>
      ) : null}
    </VariableCard>
  );
};
