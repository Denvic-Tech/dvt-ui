import { useState, useCallback, useEffect } from 'react';
import { NodeDefinition } from '@/shared/gatewayClient';

import { createValidationCallback } from '@/features/node/validate-node';

/**
 * Хук для управления валидацией данных ноды
 */
export function useNodeValidation(
  nodeDefinition: NodeDefinition,
  localInputData: Record<string, unknown>,
  setValidationCallback?: (callback: () => () => boolean) => void
) {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationErrors(prev => {
      if (!prev[fieldName]) return prev;
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const setFieldError = useCallback((fieldName: string, errors: string[]) => {
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: errors,
    }));
  }, []);

  useEffect(() => {
    if (setValidationCallback) {
      const validationCallback = createValidationCallback(
        nodeDefinition,
        () => localInputData,
        errors => setValidationErrors(errors)
      );
      setValidationCallback(() => validationCallback);
    }
  }, [setValidationCallback, nodeDefinition, localInputData]);

  return {
    validationErrors,
    clearFieldError,
    clearAllErrors,
    setFieldError,
    hasErrors: Object.keys(validationErrors).length > 0,
    getFieldErrors: (fieldName: string) => validationErrors[fieldName] || [],
    hasFieldError: (fieldName: string) =>
      Boolean(validationErrors[fieldName]?.length),
  };
}
