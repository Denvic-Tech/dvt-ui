import * as React from 'react';

import { useAlert } from '@/app/notifications';
import { useAppDispatch } from '@/app/providers/store';

import { normalizeRole, useCurrentUser } from '@/entities/user';

import { invalidateDbCatalog } from '../../api/dbCatalogApi';
import { dbConnectionsApi } from '../../api/dbConnectionsApi';
import {
  buildCreatePayload,
  buildUpdatePayload,
  createDraftFromType,
  getEffectiveFieldDescriptorsForDraft,
  getFieldDescriptorsByType,
  resolveConnectionTypeInfo,
  validateDraft,
} from '../adapters';
import {
  buildConnectionIssueValidationErrors,
  isBrokenConnection,
} from '../issues';
import type { DBConnectionDraft, DBConnectionRecord } from '../types';

import { useConnections } from './useConnections';

const isAbortedRequestError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeAbortError = error as {
    code?: unknown;
    message?: unknown;
    name?: unknown;
  };

  return (
    maybeAbortError.name === 'AbortError' ||
    maybeAbortError.name === 'CanceledError' ||
    maybeAbortError.code === 'ERR_CANCELED' ||
    maybeAbortError.message === 'canceled'
  );
};

export type UseConnectionFormParams = {
  editingConnection?: DBConnectionRecord | null;
  isOpen: boolean;
  userId?: string | null | undefined;
  organizationId?: string | null | undefined;
};

export const useConnectionForm = ({
  editingConnection = null,
  isOpen,
  userId,
  organizationId,
}: UseConnectionFormParams) => {
  const { showNotification } = useAlert();
  const dispatch = useAppDispatch();
  const { user } = useCurrentUser();
  const { catalog, createConnection, updateConnection, checkConnectionSilent } =
    useConnections();
  const currentRole = normalizeRole(user?.role);

  const isEditing = Boolean(editingConnection);
  const [scopeDraft, setScopeDraft] = React.useState({
    userId: userId ?? '',
    organizationId: organizationId ?? '',
  });

  const [selectedType, setSelectedType] = React.useState(
    editingConnection?.type ?? catalog?.types[0]?.name ?? ''
  );
  const [selectedDriver, setSelectedDriver] = React.useState<string | null>(
    editingConnection?.driver ?? null
  );
  const [draft, setDraft] = React.useState<DBConnectionDraft>(() =>
    createDraftFromType(null, editingConnection)
  );
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [connectionLoading, setConnectionLoading] = React.useState(false);
  const [connectionSuccess, setConnectionSuccess] = React.useState<
    boolean | null
  >(null);
  const [connectionCheckError, setConnectionCheckError] = React.useState<{
    exception: string;
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<
    Record<string, string>
  >({});
  const [touchedSecrets, setTouchedSecrets] = React.useState<
    Record<string, boolean>
  >({});
  const activeCheckControllerRef = React.useRef<AbortController | null>(null);

  const typeInfo = React.useMemo(
    () => resolveConnectionTypeInfo(catalog, selectedType),
    [catalog, selectedType]
  );

  const fieldDescriptors = React.useMemo(
    () => getFieldDescriptorsByType(typeInfo, selectedDriver),
    [selectedDriver, typeInfo]
  );
  const effectiveFieldDescriptors = React.useMemo(
    () => getEffectiveFieldDescriptorsForDraft(draft, fieldDescriptors),
    [draft, fieldDescriptors]
  );

  React.useEffect(() => {
    if (!isOpen || !catalog) {
      return;
    }

    const initialType = editingConnection?.type ?? catalog.types[0]?.name ?? '';
    const nextTypeInfo = resolveConnectionTypeInfo(catalog, initialType);
    const nextDriver =
      editingConnection?.driver ??
      nextTypeInfo?.default_driver ??
      nextTypeInfo?.drivers[0]?.name ??
      null;
    const nextFieldDescriptors = getFieldDescriptorsByType(
      nextTypeInfo,
      nextDriver
    );
    const nextDraft = createDraftFromType(
      nextTypeInfo,
      editingConnection ?? undefined
    );
    const nextEffectiveFieldDescriptors = getEffectiveFieldDescriptorsForDraft(
      nextDraft,
      nextFieldDescriptors
    );

    setSelectedType(initialType);
    setSelectedDriver(nextDriver);
    setDraft(nextDraft);
    setValidationErrors(
      isBrokenConnection(editingConnection)
        ? buildConnectionIssueValidationErrors(editingConnection?.issues, [
            ...nextEffectiveFieldDescriptors.propertiesFields,
            ...nextEffectiveFieldDescriptors.secretsFields,
            ...nextEffectiveFieldDescriptors.driverOptionFields,
          ])
        : {}
    );
    setTouchedSecrets({});
    setConnectionSuccess(null);
    setConnectionCheckError(null);
    setScopeDraft({
      userId: userId ?? '',
      organizationId: organizationId ?? '',
    });
  }, [catalog, editingConnection, isOpen, organizationId, userId]);

  const abortActiveCheck = React.useCallback(() => {
    activeCheckControllerRef.current?.abort();
    activeCheckControllerRef.current = null;
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      return;
    }

    abortActiveCheck();
    setConnectionLoading(false);
  }, [abortActiveCheck, isOpen]);

  React.useEffect(() => abortActiveCheck, [abortActiveCheck]);

  const setFieldValue = React.useCallback(
    (
      section: 'driver_options' | 'properties' | 'secrets',
      name: string,
      value: unknown
    ) => {
      const stateKey = section === 'driver_options' ? 'driverOptions' : section;

      setDraft(prev => ({
        ...prev,
        [stateKey]: {
          ...prev[stateKey],
          [name]: value,
        },
      }));
      setValidationErrors(prev => {
        if (!prev[`${section}.${name}`]) {
          return prev;
        }

        const next = { ...prev };
        delete next[`${section}.${name}`];
        return next;
      });

      if (section === 'secrets') {
        setTouchedSecrets(prev => ({
          ...prev,
          [name]: true,
        }));
      }
    },
    []
  );

  const handleTypeChange = React.useCallback(
    (nextType: string) => {
      if (isEditing || nextType === selectedType || !catalog) {
        return;
      }

      const nextTypeInfo = resolveConnectionTypeInfo(catalog, nextType);
      const nextDraft = createDraftFromType(nextTypeInfo);

      setSelectedType(nextType);
      setSelectedDriver(nextDraft.driver);
      setDraft(prev => ({
        ...nextDraft,
        name: prev.name,
        labelsText: prev.labelsText,
        metadataText: prev.metadataText,
      }));
      setTouchedSecrets({});
      setValidationErrors({});
      setConnectionSuccess(null);
      setConnectionCheckError(null);
    },
    [catalog, isEditing, selectedType]
  );

  const handleDriverChange = React.useCallback(
    (nextDriver: string | null) => {
      if (nextDriver === selectedDriver) {
        return;
      }

      setSelectedDriver(nextDriver);
      const nextTypeInfo = resolveConnectionTypeInfo(catalog, selectedType);
      const nextDraft = createDraftFromType(
        nextTypeInfo,
        editingConnection,
        nextDriver
      );

      setDraft(prev => ({
        ...prev,
        driver: nextDriver,
        driverOptions: nextDraft.driverOptions,
      }));
      setValidationErrors(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (key.startsWith('driver_options.')) {
            delete next[key];
          }
        });
        return next;
      });
    },
    [catalog, editingConnection, selectedDriver, selectedType]
  );

  const resolveScopeOverrides = React.useCallback(() => {
    const nextUserId = scopeDraft.userId.trim();
    const nextOrganizationId = scopeDraft.organizationId.trim();

    switch (currentRole) {
      case 'admin':
        return {
          userId: nextUserId || null,
          organizationId: null,
        };
      case 'superadmin':
        return {
          userId: nextUserId || null,
          organizationId: nextOrganizationId || null,
        };
      case 'user':
      default:
        return {
          userId: null,
          organizationId: null,
        };
    }
  }, [currentRole, scopeDraft.organizationId, scopeDraft.userId]);

  const validateCurrentDraft = React.useCallback(() => {
    const errors = validateDraft({
      draft,
      propertiesFields: effectiveFieldDescriptors.propertiesFields,
      secretsFields: effectiveFieldDescriptors.secretsFields,
      driverOptionFields: effectiveFieldDescriptors.driverOptionFields,
      isEditing,
    });

    setValidationErrors(errors);
    return errors;
  }, [draft, effectiveFieldDescriptors, isEditing]);

  const checkConnection = React.useCallback(async () => {
    const errors = validateCurrentDraft();
    if (Object.keys(errors).length > 0) {
      return { connected: false, error: null };
    }

    abortActiveCheck();
    setConnectionLoading(true);
    setConnectionCheckError(null);
    const controller = new AbortController();
    activeCheckControllerRef.current = controller;

    try {
      if (editingConnection) {
        const response = await checkConnectionSilent(
          editingConnection.id,
          buildUpdatePayload({
            draft,
            propertiesFields: effectiveFieldDescriptors.propertiesFields,
            secretsFields: effectiveFieldDescriptors.secretsFields,
            driverOptionFields: effectiveFieldDescriptors.driverOptionFields,
            touchedSecrets,
            ...resolveScopeOverrides(),
          }),
          controller.signal
        );

        const status = response.status;
        const isConnected = Boolean(status.connected);
        const checkError = isConnected
          ? null
          : {
              exception: status.exception || 'ConnectionError',
              message: status.message || 'Connection failed',
            };

        setConnectionSuccess(isConnected);
        setConnectionCheckError(checkError);

        return { connected: isConnected, error: checkError };
      }

      const response = await dbConnectionsApi.checkByPayload(
        buildCreatePayload({
          draft,
          propertiesFields: effectiveFieldDescriptors.propertiesFields,
          secretsFields: effectiveFieldDescriptors.secretsFields,
          driverOptionFields: effectiveFieldDescriptors.driverOptionFields,
          ...resolveScopeOverrides(),
        }),
        controller.signal
      );
      const isConnected = Boolean(response.connected);
      const checkError = isConnected
        ? null
        : {
            exception: response.exception || 'ConnectionError',
            message: response.message || 'Connection failed',
          };

      setConnectionSuccess(isConnected);
      setConnectionCheckError(checkError);

      return { connected: isConnected, error: checkError };
    } catch (error) {
      if (isAbortedRequestError(error)) {
        return { connected: false, error: null };
      }

      const checkError = {
        exception: 'ConnectionError',
        message:
          error instanceof Error
            ? error.message
            : 'Проверьте параметры подключения',
      };
      setConnectionSuccess(false);
      setConnectionCheckError(checkError);
      return { connected: false, error: checkError };
    } finally {
      if (activeCheckControllerRef.current === controller) {
        activeCheckControllerRef.current = null;
      }

      setConnectionLoading(false);
    }
  }, [
    abortActiveCheck,
    checkConnectionSilent,
    draft,
    editingConnection,
    effectiveFieldDescriptors,
    resolveScopeOverrides,
    touchedSecrets,
    validateCurrentDraft,
  ]);

  const handleSubmit = React.useCallback(async () => {
    const errors = validateCurrentDraft();
    if (Object.keys(errors).length > 0) {
      return false;
    }

    setSubmitLoading(true);

    try {
      if (editingConnection) {
        await updateConnection(
          editingConnection.id,
          buildUpdatePayload({
            draft,
            propertiesFields: effectiveFieldDescriptors.propertiesFields,
            secretsFields: effectiveFieldDescriptors.secretsFields,
            driverOptionFields: effectiveFieldDescriptors.driverOptionFields,
            touchedSecrets,
            ...resolveScopeOverrides(),
          })
        ).unwrap();

        try {
          await dbConnectionsApi.refreshCatalog(editingConnection.id);
        } catch {
          showNotification({
            type: 'warning',
            title: 'Подключение сохранено',
            description:
              'Не удалось обновить каталог. Повторите Refresh в навигаторе.',
            group: 'db-connections',
          });
        } finally {
          dispatch(invalidateDbCatalog(editingConnection.id));
        }
      } else {
        await createConnection(
          buildCreatePayload({
            draft,
            propertiesFields: effectiveFieldDescriptors.propertiesFields,
            secretsFields: effectiveFieldDescriptors.secretsFields,
            driverOptionFields: effectiveFieldDescriptors.driverOptionFields,
            ...resolveScopeOverrides(),
          })
        ).unwrap();
      }

      return true;
    } catch {
      showNotification({
        type: 'error',
        title: editingConnection
          ? 'Ошибка обновления подключения'
          : 'Ошибка создания подключения',
        description: 'Проверьте форму и попробуйте снова.',
        group: 'db-connections',
      });
      return false;
    } finally {
      setSubmitLoading(false);
    }
  }, [
    createConnection,
    draft,
    dispatch,
    editingConnection,
    effectiveFieldDescriptors,
    resolveScopeOverrides,
    showNotification,
    touchedSecrets,
    updateConnection,
    validateCurrentDraft,
  ]);

  return {
    draft,
    isEditing,
    selectedType,
    selectedDriver,
    typeInfo,
    fieldDescriptors: effectiveFieldDescriptors,
    validationErrors,
    submitLoading,
    connectionLoading,
    connectionSuccess,
    connectionCheckError,
    currentRole,
    scopeDraft,
    setScopeDraft,
    setDraft,
    setFieldValue,
    handleTypeChange,
    handleDriverChange,
    handleSubmit,
    checkConnection,
  };
};
