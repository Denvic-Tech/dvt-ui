import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Column, TableCreateSpec } from '@/shared/gatewayClient';

import {
  hydrateTableCreateSpecDraft,
  serializeTableCreateSpecDraft,
  type TableCreateSpecDraft,
  validateTableCreateSpecDraft,
} from './helpers';

type UseTableCreateSpecDraftParams = {
  value: TableCreateSpec | null | undefined;
  columns: Column[];
  onChange: (value: TableCreateSpec | null) => void;
  onValidationChange?: ((errors: string[]) => void) | undefined;
};

const getFingerprint = (value: unknown) => JSON.stringify(value ?? null);

/**
 * Локальный черновик спецификации таблицы — то же поведение, что у
 * `TableCreateSpecEditor` в компактном режиме: черновик валидируется на
 * каждом изменении, наружу уходит только валидный; внешнее значение
 * перечитывается, если оно изменилось не из-за нашей же сериализации.
 */
export const useTableCreateSpecDraft = ({
  value,
  columns,
  onChange,
  onValidationChange,
}: UseTableCreateSpecDraftParams) => {
  const normalizedValue = useMemo(() => value ?? null, [value]);
  const externalFingerprint = useMemo(
    () => getFingerprint(normalizedValue),
    [normalizedValue]
  );
  const [draft, setDraft] = useState<TableCreateSpecDraft>(() =>
    hydrateTableCreateSpecDraft(normalizedValue)
  );
  const [errors, setErrors] = useState<string[]>([]);
  const lastHydratedFingerprintRef = useRef<string | null>(null);
  const lastSerializedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      lastHydratedFingerprintRef.current === externalFingerprint ||
      lastSerializedFingerprintRef.current === externalFingerprint
    ) {
      return;
    }

    lastHydratedFingerprintRef.current = externalFingerprint;
    const nextDraft = hydrateTableCreateSpecDraft(normalizedValue);
    setDraft(nextDraft);
    const nextErrors = validateTableCreateSpecDraft(nextDraft, columns).errors;
    setErrors(nextErrors);
    onValidationChange?.(nextErrors);
  }, [columns, externalFingerprint, normalizedValue, onValidationChange]);

  const runDraftValidation = useCallback(
    (nextDraft: TableCreateSpecDraft) => {
      const validation = validateTableCreateSpecDraft(nextDraft, columns);
      setErrors(validation.errors);
      onValidationChange?.(validation.errors);

      if (!validation.isValid) {
        return;
      }

      const nextValue = serializeTableCreateSpecDraft(nextDraft);
      lastSerializedFingerprintRef.current = getFingerprint(nextValue);
      onChange(nextValue);
    },
    [columns, onChange, onValidationChange]
  );

  const updateDraft = useCallback(
    (updater: (current: TableCreateSpecDraft) => TableCreateSpecDraft) => {
      setDraft(current => {
        const nextDraft = updater(current);
        runDraftValidation(nextDraft);
        return nextDraft;
      });
    },
    [runDraftValidation]
  );

  return { draft, errors, updateDraft };
};
