import type { DbMetadata } from '@/shared/gatewayClient';
import {
  isDialectSupportsDatabases,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';
import {
  isSafeVariableIdentifier,
  parseDefaultLiteralDraft,
} from '@/shared/lib/variables';

import {
  extractSqlQueryText,
  hasConfiguredManualTarget,
  hasConfiguredSelectorValue,
} from './helpers';
import type {
  ManualTargetDraft,
  ManualVariableDraft,
  SqlPreviewState,
  SqlVariablePolicyDraft,
} from './types';

export const validateManualDefinition = ({
  connectionID,
  connectionMetadata,
  manualRows,
  manualTarget,
  orderByRequiredAggregations,
}: {
  connectionID: string | null | undefined;
  connectionMetadata: DbMetadata | null | undefined;
  manualRows: ManualVariableDraft[];
  manualTarget: ManualTargetDraft;
  orderByRequiredAggregations: Set<string>;
}): string[] => {
  const messages: string[] = [];

  if (!connectionID) {
    messages.push('Подключите вход connection к ноде с connection_id.');
  }

  if (manualRows.length === 0) {
    messages.push('Добавьте хотя бы одну переменную в manual режиме.');
    return messages;
  }

  const shouldRequireDatabase = connectionMetadata
    ? isDialectSupportsDatabases(connectionMetadata.dialect)
    : false;
  const shouldRequireSchema = connectionMetadata
    ? isDialectSupportsSchemas(connectionMetadata.dialect)
    : false;
  const seenNames = new Set<string>();

  if (!hasConfiguredManualTarget(manualTarget)) {
    messages.push('table_name обязателен для manual режима.');
  }

  if (
    shouldRequireDatabase &&
    !hasConfiguredSelectorValue(manualTarget.database_name)
  ) {
    messages.push('database_name обязателен для manual режима.');
  }

  if (
    shouldRequireSchema &&
    !hasConfiguredSelectorValue(manualTarget.schema_name)
  ) {
    messages.push('schema_name обязателен для manual режима.');
  }

  manualRows.forEach((row, index) => {
    const rowIndex = index + 1;
    const trimmedName = row.name.trim();

    if (!trimmedName) {
      messages.push(`Строка ${rowIndex}: имя переменной обязательно.`);
    } else if (!isSafeVariableIdentifier(trimmedName)) {
      messages.push(
        `Строка ${rowIndex}: имя "${trimmedName}" должно быть валидным Python identifier.`
      );
    } else if (seenNames.has(trimmedName)) {
      messages.push(
        `Строка ${rowIndex}: переменная "${trimmedName}" повторяется.`
      );
    } else {
      seenNames.add(trimmedName);
    }

    if (!hasConfiguredSelectorValue(row.column_name)) {
      messages.push(`Строка ${rowIndex}: column_name обязателен.`);
    }

    if (!row.aggregation.trim()) {
      messages.push(`Строка ${rowIndex}: aggregation обязателен.`);
    }

    if (
      orderByRequiredAggregations.has(row.aggregation) &&
      !hasConfiguredSelectorValue(row.order_by_column)
    ) {
      messages.push(
        `Строка ${rowIndex}: order_by_column обязателен для aggregation=${row.aggregation}.`
      );
    }
  });

  return messages;
};

export const validateSqlDefinition = ({
  connectionID,
  sqlQueryValue,
}: {
  connectionID: string | null | undefined;
  sqlQueryValue: unknown;
}): string[] => {
  const messages: string[] = [];

  if (!connectionID) {
    messages.push('Подключите вход connection к ноде с connection_id.');
  }

  const sqlQuery = extractSqlQueryText(sqlQueryValue);

  if (!sqlQuery.trim()) {
    messages.push('SQL query обязателен для режима sql.');
  }

  return messages;
};

export const validateManualPolicyStep = (
  rows: ManualVariableDraft[]
): string[] => {
  return rows.flatMap((row, index) => {
    const parsedDefault = parseDefaultLiteralDraft(row.default_literal);
    if (parsedDefault.error) {
      return [`Строка ${index + 1}: ${parsedDefault.error}`];
    }

    return [];
  });
};

export const validateSqlPreviewState = ({
  connectionID,
  currentFingerprint,
  previewState,
  sqlQueryValue,
}: {
  connectionID: string | null | undefined;
  currentFingerprint: string | null;
  previewState: SqlPreviewState;
  sqlQueryValue: unknown;
}): string[] => {
  const messages = validateSqlDefinition({
    connectionID,
    sqlQueryValue,
  });

  if (messages.length > 0) {
    return messages;
  }

  if (
    previewState.status === 'success' &&
    previewState.fingerprint === currentFingerprint &&
    previewState.metadata
  ) {
    return [];
  }

  if (
    previewState.status === 'loading' &&
    previewState.fingerprint === currentFingerprint
  ) {
    return ['Дождитесь, пока загрузится metadata по SQL query.'];
  }

  if (
    previewState.status === 'error' &&
    previewState.fingerprint === currentFingerprint
  ) {
    return [previewState.error ?? 'Не удалось получить metadata по SQL query.'];
  }

  return ['Metadata по SQL query ещё не готова.'];
};

export const validateSqlPolicyStep = (
  rows: SqlVariablePolicyDraft[]
): string[] => {
  return rows.flatMap((row, index) => {
    const parsedDefault = parseDefaultLiteralDraft(row.default_literal);
    if (parsedDefault.error) {
      return [`Колонка ${index + 1} (${row.name}): ${parsedDefault.error}`];
    }

    return [];
  });
};
