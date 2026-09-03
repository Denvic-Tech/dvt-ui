import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { TypedVariableValueEditor } from '@/features/node/primitive-variable-editor';
import {
  LiteralValueField,
  VariablePolicyFields,
} from '@/features/node/variable-policy';

import {
  isExpressionValue,
  normalizePrimitiveExpressionValue,
} from '@/shared/lib/node-input-values';
import {
  getDefaultValueForPrimitiveType,
  PRIMITIVE_VARIABLE_TYPES,
  type PrimitiveVariableType,
  type VariableOutput,
} from '@/shared/lib/variables';

import type { ManageVariableRow } from '../types';

type ManageVariableRowEditorProps = {
  onDelete: () => void;
  onPatch: (patch: Partial<ManageVariableRow>) => void;
  row: ManageVariableRow;
  variables: VariableOutput[];
};

const DEFAULT_HELPER_TEXT =
  'Оставьте поле пустым, чтобы default не назначать. Для пустой строки используйте `""`.';

export const ManageVariableRowEditor = ({
  onDelete,
  onPatch,
  row,
  variables,
}: ManageVariableRowEditorProps) => {
  const currentValue = row.mode === 'value' ? row.value : row.value_input;

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          fullWidth
          size='small'
          label='Имя'
          value={row.name}
          onChange={event => onPatch({ name: event.target.value })}
        />

        <FormControl size='small' fullWidth>
          <Select
            value={row.type}
            onChange={event => {
              const nextType = event.target.value as PrimitiveVariableType;
              const normalizedExpressionValue =
                normalizePrimitiveExpressionValue(currentValue);

              onPatch({
                type: nextType,
                mode: normalizedExpressionValue ? 'value_input' : 'value',
                value: normalizedExpressionValue
                  ? undefined
                  : getDefaultValueForPrimitiveType(nextType),
                value_input: normalizedExpressionValue ?? undefined,
                valueJsonError: null,
              });
            }}
          >
            {PRIMITIVE_VARIABLE_TYPES.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton
          color='error'
          onClick={onDelete}
          aria-label='Удалить строку'
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>

      <Stack spacing={1}>
        <Typography variant='body2'>Value</Typography>
        <TypedVariableValueEditor
          type={row.type}
          value={currentValue}
          onChange={nextValue =>
            onPatch({
              mode: isExpressionValue(nextValue) ? 'value_input' : 'value',
              value: isExpressionValue(nextValue) ? undefined : nextValue,
              value_input: isExpressionValue(nextValue) ? nextValue : undefined,
            })
          }
          allowExpressions
          jsonError={row.valueJsonError}
          onJsonErrorChange={nextError =>
            onPatch({ valueJsonError: nextError })
          }
          variables={variables}
        />
      </Stack>

      <VariablePolicyFields
        nullable={row.nullable}
        onNullableChange={nextValue => onPatch({ nullable: nextValue })}
        defaultEditor={
          <LiteralValueField
            label='Default'
            value={row.default_literal}
            onChange={nextValue => onPatch({ default_literal: nextValue })}
            helperText={DEFAULT_HELPER_TEXT}
            placeholder='Например: 0, null, "fallback", {"key": 1}'
          />
        }
      />
    </Stack>
  );
};
