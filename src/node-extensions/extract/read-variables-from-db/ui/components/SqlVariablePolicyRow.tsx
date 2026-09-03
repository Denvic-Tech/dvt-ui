import type { SqlVariablePolicyDraft } from '../../lib/types';
import {
  CheckboxBox,
  CheckboxInput,
  CheckboxLabel,
  CheckboxLabelText,
  DefaultBadge,
  DtypeBadge,
  FieldHint,
  FieldLabel,
  MonoInput,
  MutedInlineText,
  NullableBadge,
  NullPolicyExpandedBlock,
  NullPolicySummary,
  NullPolicyTitle,
  NullPolicyTriggerBtn,
  SqlColumnHeader,
  SqlColumnHeaderMain,
  SqlColumnIconBox,
  SqlColumnName,
  VariableCard,
} from '../styles';

import { CheckIcon, ChevronDownIcon, ColumnIcon, SparkleIcon } from './icons';

type SqlVariablePolicyRowProps = {
  isExpanded: boolean;
  onPatch: (patch: Partial<SqlVariablePolicyDraft>) => void;
  onToggle: () => void;
  row: SqlVariablePolicyDraft;
  toneIndex: number;
};

export const SqlVariablePolicyRow = ({
  isExpanded,
  onPatch,
  onToggle,
  row,
  toneIndex,
}: SqlVariablePolicyRowProps) => {
  const hasPolicy = row.nullable || row.default_literal.trim().length > 0;

  return (
    <VariableCard toneIndex={toneIndex}>
      <SqlColumnHeader>
        <SqlColumnHeaderMain>
          <SqlColumnIconBox>
            <ColumnIcon />
          </SqlColumnIconBox>
          <SqlColumnName>{row.name}</SqlColumnName>
        </SqlColumnHeaderMain>
        {row.dtype ? <DtypeBadge>{row.dtype}</DtypeBadge> : null}
      </SqlColumnHeader>

      <NullPolicyTriggerBtn
        type='button'
        isExpanded={isExpanded}
        onClick={onToggle}
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
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </NullPolicySummary>
      </NullPolicyTriggerBtn>

      {isExpanded ? (
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
                Разрешить NULL значения для этой колонки.
              </span>
            </CheckboxLabelText>
          </CheckboxLabel>

          <div>
            <FieldLabel>Default</FieldLabel>
            <MonoInput
              value={row.default_literal}
              placeholder='Например: null, 0, "fallback"'
              aria-label={`Default literal for ${row.name}`}
              onChange={event =>
                onPatch({ default_literal: event.target.value })
              }
            />
            <FieldHint>
              Default применяется, если query вернул NULL в этой колонке.
            </FieldHint>
          </div>
        </NullPolicyExpandedBlock>
      ) : null}
    </VariableCard>
  );
};
