import type { ProjectVariableType } from '@/shared/lib/variables';

import {
  BooleanChip,
  NullBadge,
  PreviewEmpty,
  PreviewText,
} from './projectVariableStyles.ts';

const isEmptyPreviewValue = (value: unknown): boolean =>
  value === '' || value === undefined;

const stringifyPreviewValue = (
  type: ProjectVariableType,
  value: unknown,
  isListType: boolean
): string => {
  if (isListType || type === 'JSON' || Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

export const getProjectVariableValuePreviewText = ({
  isListType,
  type,
  value,
}: {
  isListType: boolean;
  type: ProjectVariableType;
  value: unknown;
}): string => {
  if (value === null) {
    return 'NULL';
  }

  if (isEmptyPreviewValue(value)) {
    return 'пусто';
  }

  if (type === 'BOOLEAN' && typeof value === 'boolean' && !isListType) {
    return value ? 'true' : 'false';
  }

  return stringifyPreviewValue(type, value, isListType)
    .replace(/\s+/g, ' ')
    .trim();
};

type VariableValuePreviewProps = {
  isListType: boolean;
  type: ProjectVariableType;
  value: unknown;
};

export const VariableValuePreview = ({
  isListType,
  type,
  value,
}: VariableValuePreviewProps) => {
  if (value === null) {
    return <NullBadge title='Значение установлено в null'>NULL</NullBadge>;
  }

  if (isEmptyPreviewValue(value)) {
    return <PreviewEmpty>пусто</PreviewEmpty>;
  }

  if (type === 'BOOLEAN' && typeof value === 'boolean' && !isListType) {
    return <BooleanChip value={value}>{value ? 'true' : 'false'}</BooleanChip>;
  }

  const previewText = getProjectVariableValuePreviewText({
    isListType,
    type,
    value,
  });

  return <PreviewText title={previewText}>{previewText}</PreviewText>;
};
