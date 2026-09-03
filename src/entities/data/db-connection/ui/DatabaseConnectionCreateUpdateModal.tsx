import * as React from 'react';
import {
  AdminPanelSettingsRounded as AdminPanelSettingsRoundedIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CloudRounded as CloudRoundedIcon,
  ContentCopy as ContentCopyIcon,
  FolderRounded as FolderRoundedIcon,
  QueueRounded as QueueRoundedIcon,
  SettingsRounded as SettingsRoundedIcon,
  StorageRounded as StorageRoundedIcon,
} from '@mui/icons-material';
import { Box, MenuItem, Typography } from '@mui/material';

import { StaticAccordionSection } from '@/shared/ui/node-input';

import { useConnectionForm } from '../model/hooks/useConnectionForm';
import { useConnections } from '../model/hooks/useConnections';
import type {
  DBConnectionCatalogTypeInfo,
  DBConnectionFieldDescriptor,
  DBConnectionRecord,
  DBConnectionScopeOption,
} from '../model/types';

import {
  CancelButton,
  CheckboxContainer,
  CheckboxDescription,
  CheckboxLabel,
  CheckboxText,
  CloseButton,
  ConnectionGroup,
  ConnectionTypeFallback,
  ConnectionTypeIcon,
  ConnectionTypeItem,
  ConnectionTypeName,
  ContentHeader,
  FieldLabel,
  Footer,
  FooterLeft,
  FooterRight,
  FormContainer,
  FormField,
  FormRow,
  FormSection,
  GroupHeader,
  GroupIcon,
  GroupItems,
  GroupName,
  HeaderIconContainer,
  HeaderLeft,
  HeaderSubtitle,
  HeaderTitle,
  MainContent,
  MonoTextField,
  RequiredMark,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTitle,
  StyledCheckbox,
  StyledDialog,
  StyledSelectField,
  StyledTextField,
  SubmitButton,
  TestConnectionButton,
  TestConnectionButtonStatus,
  TestConnectionErrorModal,
  TestConnectionErrorModalCloseAction,
  TestConnectionErrorModalCloseButton,
  TestConnectionErrorModalContent,
  TestConnectionErrorModalCopiedText,
  TestConnectionErrorModalCopyButton,
  TestConnectionErrorModalException,
  TestConnectionErrorModalFooter,
  TestConnectionErrorModalHeader,
  TestConnectionErrorModalHeaderText,
  TestConnectionErrorModalIconContainer,
  TestConnectionErrorModalMessageContainer,
  TestConnectionErrorModalMessageText,
  TestConnectionErrorModalTitle,
} from './DatabaseConnectionCreateUpdateModal.styles';
import {
  formatKindGroupLabel,
  getConnectionTypeLabel,
  getConnectionTypeLogo,
  getConnectionTypeLogoScale,
} from './helpers';

type DatabaseConnectionCreateUpdateModalProps = {
  open: boolean;
  onClose: () => void;
  editingConnection?: DBConnectionRecord | null;
  onSubmit?: () => void;
  userId?: string | null | undefined;
  organizationId?: string | null | undefined;
  availableUsers?: DBConnectionScopeOption[] | undefined;
  availableOrganizations?: DBConnectionScopeOption[] | undefined;
};

type ConnectionGroupConfig = {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: DBConnectionCatalogTypeInfo[];
};

const getFieldValue = (
  values: Record<string, unknown>,
  field: DBConnectionFieldDescriptor
) => values[field.name] ?? (field.kind === 'boolean' ? false : '');

const LABEL_SX = {
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const getKindIcon = (kind: string) => {
  switch (kind) {
    case 'queue':
    case 'queues':
    case 'messaging':
      return <QueueRoundedIcon />;
    case 'cloud':
    case 'storage':
      return <CloudRoundedIcon />;
    case 'file':
    case 'files':
    case 'filesystem':
      return <FolderRoundedIcon />;
    case 'sql':
    case 'database':
    case 'databases':
    default:
      return <StorageRoundedIcon />;
  }
};

const isMultilineField = (field: DBConnectionFieldDescriptor) =>
  field.kind === 'json' || field.kind === 'array';

const groupFieldsIntoRows = (fields: DBConnectionFieldDescriptor[]) => {
  const rows: DBConnectionFieldDescriptor[][] = [];
  let currentRow: DBConnectionFieldDescriptor[] = [];

  fields.forEach(field => {
    if (field.kind === 'boolean' || isMultilineField(field)) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      rows.push([field]);
      return;
    }

    currentRow.push(field);
    if (currentRow.length === 2) {
      rows.push(currentRow);
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};

const FIELD_PRIORITY_BY_NAME: Record<string, number> = {
  host: 10,
  hostname: 10,
  server: 10,
  bootstrap_servers: 10,
  endpoint: 12,
  endpoint_url: 12,
  port: 20,
  share: 24,
  database: 30,
  dbname: 30,
  db_name: 30,
  service_name: 30,
  sid: 30,
  schema: 32,
  bucket: 34,
  path: 36,
  prefix: 38,
  username: 40,
  user: 40,
  login: 40,
  client_id: 42,
  access_key_id: 44,
  password: 50,
  passphrase: 50,
  secret_access_key: 50,
  secret_key: 50,
  client_secret: 50,
  private_key: 52,
  token: 54,
  auth_method: 60,
  region: 62,
  ssl: 64,
  ssl_mode: 64,
  mode: 66,
};

const FIELD_PRIORITY_BY_FRAGMENT: Array<[string, number]> = [
  ['host', 10],
  ['server', 10],
  ['endpoint', 12],
  ['port', 20],
  ['database', 30],
  ['schema', 32],
  ['bucket', 34],
  ['path', 36],
  ['prefix', 38],
  ['user', 40],
  ['login', 40],
  ['password', 50],
  ['secret', 50],
  ['token', 54],
  ['ssl', 64],
];

const getFieldPriority = (field: DBConnectionFieldDescriptor) => {
  const normalizedName = field.name.toLowerCase();
  const exactPriority = FIELD_PRIORITY_BY_NAME[normalizedName];

  if (exactPriority !== undefined) {
    return exactPriority;
  }

  const matchedPriority = FIELD_PRIORITY_BY_FRAGMENT.find(([fragment]) =>
    normalizedName.includes(fragment)
  );

  if (matchedPriority) {
    return matchedPriority[1];
  }

  return field.section === 'secrets' ? 55 : 100;
};

const sortFieldsForConnectionForm = (fields: DBConnectionFieldDescriptor[]) =>
  [...fields]
    .map((field, index) => ({ field, index }))
    .sort((left, right) => {
      const priorityDiff =
        getFieldPriority(left.field) - getFieldPriority(right.field);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (left.field.section !== right.field.section) {
        return left.field.section.localeCompare(right.field.section);
      }

      return left.index - right.index;
    })
    .map(item => item.field);

const isFieldFilled = (
  field: DBConnectionFieldDescriptor,
  value: unknown
): boolean => {
  if (field.kind === 'boolean') {
    return Boolean(value);
  }

  if (typeof value === 'number') {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
};

const formatFilledFieldsCount = (count: number) => {
  if (count <= 0) {
    return null;
  }

  if (count === 1) {
    return '1 поле';
  }

  if (count >= 2 && count <= 4) {
    return `${count} поля`;
  }

  return `${count} полей`;
};

const PRIMARY_FIELD_NAMES = new Set([
  'host',
  'hostname',
  'server',
  'bootstrap_servers',
  'endpoint',
  'endpoint_url',
  'port',
  'share',
  'database',
  'dbname',
  'db_name',
  'service_name',
  'sid',
  'bucket',
  'username',
  'user',
  'login',
  'password',
]);

const isPrimaryField = (
  field: DBConnectionFieldDescriptor,
  connectionType: string
) => {
  if (field.required) {
    return true;
  }

  const normalizedName = field.name.toLowerCase();

  if (PRIMARY_FIELD_NAMES.has(normalizedName)) {
    return true;
  }

  if (connectionType === 's3' && normalizedName === 'endpoint_url') {
    return true;
  }

  return false;
};

const Label = ({
  id,
  required = false,
  children,
}: {
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <FieldLabel id={`${id}-label`} htmlFor={id}>
    {children}
    {required ? <RequiredMark>*</RequiredMark> : null}
  </FieldLabel>
);

const renderField = ({
  field,
  values,
  errors,
  disabled = false,
  onChange,
}: {
  field: DBConnectionFieldDescriptor;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  onChange: (name: string, value: unknown) => void;
}) => {
  const fieldId = `${field.section}-${field.name}`;
  const testId = 'entities/data/db-connection/modal-field';
  const helperText =
    errors[`${field.section}.${field.name}`] ?? field.description;
  const value = getFieldValue(values, field);

  if (field.kind === 'boolean') {
    return (
      <FormField key={field.name}>
        <CheckboxContainer>
          <StyledCheckbox
            checked={Boolean(value)}
            disabled={disabled}
            data-testid={testId}
            inputProps={
              {
                'data-section': field.section,
                'data-field-name': field.name,
              } as React.InputHTMLAttributes<HTMLInputElement>
            }
            onChange={event => onChange(field.name, event.target.checked)}
          />
          <CheckboxLabel>
            <CheckboxText>
              {field.label}
              {field.required ? ' *' : ''}
            </CheckboxText>
            {helperText ? (
              <CheckboxDescription>{helperText}</CheckboxDescription>
            ) : null}
          </CheckboxLabel>
        </CheckboxContainer>
      </FormField>
    );
  }

  const commonProps = {
    id: fieldId,
    fullWidth: true,
    disabled,
    value,
    'data-testid': testId,
    'data-section': field.section,
    'data-field-name': field.name,
    error: Boolean(errors[`${field.section}.${field.name}`]),
    helperText,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange(field.name, event.target.value),
  };

  const InputComponent =
    field.kind === 'json' || field.kind === 'array'
      ? MonoTextField
      : field.kind === 'select'
        ? StyledSelectField
        : StyledTextField;

  const inputProps: Record<string, unknown> = {};

  if (field.kind === 'select') {
    inputProps['select'] = true;
  }

  if (field.kind === 'number') {
    inputProps['type'] = 'number';
  }

  if (field.section === 'secrets' && field.kind === 'text') {
    inputProps['type'] = 'password';
    inputProps['autoComplete'] = 'new-password';
  }

  if (field.kind === 'json' || field.kind === 'array') {
    inputProps['multiline'] = true;
    inputProps['minRows'] = field.kind === 'json' ? 5 : 2;
  }

  if (field.kind === 'array') {
    inputProps['placeholder'] = 'value1, value2, value3';
  }

  return (
    <FormField key={field.name}>
      <Label id={fieldId} required={field.required}>
        {field.label}
      </Label>
      <InputComponent {...commonProps} {...inputProps}>
        {field.kind === 'select'
          ? field.enumOptions?.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))
          : null}
      </InputComponent>
    </FormField>
  );
};

const DynamicFieldsSection = ({
  title,
  fields,
  errors,
  disabled = false,
  getValues,
  onChange,
}: {
  title: string;
  fields: DBConnectionFieldDescriptor[];
  errors: Record<string, string>;
  disabled?: boolean;
  getValues: (
    section: DBConnectionFieldDescriptor['section']
  ) => Record<string, unknown>;
  onChange: (
    section: DBConnectionFieldDescriptor['section'],
    name: string,
    value: unknown
  ) => void;
}) => {
  if (fields.length === 0) {
    return null;
  }

  return (
    <FormSection>
      <Typography sx={LABEL_SX}>{title}</Typography>
      {groupFieldsIntoRows(fields).map((row, index) => (
        <FormRow key={`${title}-${index}`}>
          {row.map(field =>
            renderField({
              field,
              values: getValues(field.section),
              errors,
              disabled,
              onChange: (name, value) => onChange(field.section, name, value),
            })
          )}
        </FormRow>
      ))}
    </FormSection>
  );
};

export const DatabaseConnectionCreateUpdateModal = ({
  open,
  onClose,
  editingConnection = null,
  onSubmit,
  userId,
  organizationId,
  availableUsers = [],
  availableOrganizations = [],
}: DatabaseConnectionCreateUpdateModalProps) => {
  const { kinds, types } = useConnections();
  const {
    draft,
    isEditing,
    selectedType,
    selectedDriver,
    typeInfo,
    fieldDescriptors,
    validationErrors,
    submitLoading,
    connectionLoading,
    currentRole,
    scopeDraft,
    setScopeDraft,
    setDraft,
    setFieldValue,
    handleTypeChange,
    handleDriverChange,
    handleSubmit,
    checkConnection,
  } = useConnectionForm({
    editingConnection,
    isOpen: open,
    userId,
    organizationId,
  });

  const groupedTypes = React.useMemo<ConnectionGroupConfig[]>(
    () =>
      kinds
        .map(kind => ({
          id: kind.name,
          name: formatKindGroupLabel(kind.name, kind.description),
          icon: getKindIcon(kind.name),
          items: types.filter(item => item.kind === kind.name),
        }))
        .filter(group => group.items.length > 0),
    [kinds, types]
  );

  const displayedType = typeInfo?.name ?? selectedType ?? draft.type;
  const displayedTypeLabel = getConnectionTypeLabel(displayedType);
  const headerLogo = getConnectionTypeLogo(displayedType);
  const headerLogoScale = getConnectionTypeLogoScale(displayedType);
  const [isAdvancedSectionOpen, setIsAdvancedSectionOpen] =
    React.useState(false);
  const [isAdditionalSectionOpen, setIsAdditionalSectionOpen] =
    React.useState(false);
  const [isAdministrationSectionOpen, setIsAdministrationSectionOpen] =
    React.useState(false);

  const getSectionValues = React.useCallback(
    (section: DBConnectionFieldDescriptor['section']) => {
      switch (section) {
        case 'driver_options':
          return draft.driverOptions;
        case 'secrets':
          return draft.secrets;
        case 'properties':
        default:
          return draft.properties;
      }
    },
    [draft.driverOptions, draft.properties, draft.secrets]
  );

  const handleDynamicFieldChange = React.useCallback(
    (
      section: DBConnectionFieldDescriptor['section'],
      name: string,
      value: unknown
    ) => {
      setFieldValue(section, name, value);
    },
    [setFieldValue]
  );

  const connectionFields = React.useMemo(
    () =>
      sortFieldsForConnectionForm([
        ...fieldDescriptors.propertiesFields,
        ...fieldDescriptors.secretsFields,
      ]),
    [fieldDescriptors.propertiesFields, fieldDescriptors.secretsFields]
  );
  const primaryConnectionFields = React.useMemo(
    () =>
      connectionFields.filter(field => isPrimaryField(field, displayedType)),
    [connectionFields, displayedType]
  );
  const optionalConnectionFields = React.useMemo(
    () =>
      connectionFields.filter(field => !isPrimaryField(field, displayedType)),
    [connectionFields, displayedType]
  );
  const requiredDriverOptionFields = React.useMemo(
    () => fieldDescriptors.driverOptionFields.filter(field => field.required),
    [fieldDescriptors.driverOptionFields]
  );
  const optionalDriverOptionFields = React.useMemo(
    () => fieldDescriptors.driverOptionFields.filter(field => !field.required),
    [fieldDescriptors.driverOptionFields]
  );
  const advancedFields = React.useMemo(
    () => [...optionalConnectionFields, ...optionalDriverOptionFields],
    [optionalConnectionFields, optionalDriverOptionFields]
  );

  const advancedFilledCount = React.useMemo(
    () =>
      advancedFields.reduce((count, field) => {
        const value = getSectionValues(field.section)[field.name];
        return count + (isFieldFilled(field, value) ? 1 : 0);
      }, 0),
    [advancedFields, getSectionValues]
  );
  const hasAdditionalValues =
    draft.labelsText.trim().length > 0 || draft.metadataText.trim().length > 0;
  const administrationCollapsedValue = React.useMemo(() => {
    const parts: string[] = [];
    const selectedUser = availableUsers.find(
      item => item.value === scopeDraft.userId
    );
    const selectedOrganization = availableOrganizations.find(
      item => item.value === scopeDraft.organizationId
    );

    if (selectedUser?.label) {
      parts.push(selectedUser.label);
    } else if (scopeDraft.userId.trim()) {
      parts.push(scopeDraft.userId.trim());
    }

    if (selectedOrganization?.label) {
      parts.push(selectedOrganization.label);
    } else if (scopeDraft.organizationId.trim()) {
      parts.push(scopeDraft.organizationId.trim());
    }

    return parts.length > 0 ? parts.join(' · ') : null;
  }, [
    availableOrganizations,
    availableUsers,
    scopeDraft.organizationId,
    scopeDraft.userId,
  ]);

  const [testButtonStatus, setTestButtonStatus] =
    React.useState<TestConnectionButtonStatus>('neutral');
  const shouldResetErrorStateAfterCloseRef = React.useRef(false);
  const [isErrorCopied, setIsErrorCopied] = React.useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = React.useState(false);
  const [testConnectionError, setTestConnectionError] = React.useState<{
    exception: string;
    message: string;
  } | null>(null);
  const statusResetTimeoutRef = React.useRef<number | null>(null);
  const copiedTimeoutRef = React.useRef<number | null>(null);

  const clearStatusResetTimeout = React.useCallback(() => {
    if (statusResetTimeoutRef.current !== null) {
      window.clearTimeout(statusResetTimeoutRef.current);
      statusResetTimeoutRef.current = null;
    }
  }, []);

  const clearCopiedTimeout = React.useCallback(() => {
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!open) {
      clearStatusResetTimeout();
      clearCopiedTimeout();
      setTestButtonStatus('neutral');
      setIsErrorCopied(false);
      setIsErrorModalOpen(false);
      setTestConnectionError(null);
    }
  }, [clearCopiedTimeout, clearStatusResetTimeout, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setIsAdvancedSectionOpen(false);
    setIsAdditionalSectionOpen(false);
    setIsAdministrationSectionOpen(false);
  }, [editingConnection?.id, open, selectedDriver, selectedType]);

  React.useEffect(
    () => () => {
      clearStatusResetTimeout();
      clearCopiedTimeout();
    },
    [clearCopiedTimeout, clearStatusResetTimeout]
  );

  React.useEffect(() => {
    const hasAdvancedErrors = advancedFields.some(
      field => validationErrors[`${field.section}.${field.name}`]
    );

    if (hasAdvancedErrors) {
      setIsAdvancedSectionOpen(true);
    }
  }, [advancedFields, validationErrors]);

  React.useEffect(() => {
    if (validationErrors['labelsText'] || validationErrors['metadataText']) {
      setIsAdditionalSectionOpen(true);
    }
  }, [validationErrors]);

  const fullConnectionErrorText = React.useMemo(() => {
    if (!testConnectionError) {
      return '';
    }

    const exception = testConnectionError.exception.trim();
    const message = testConnectionError.message.trim();

    if (exception && message) {
      return `${exception}: ${message}`;
    }

    return exception || message || '';
  }, [testConnectionError]);

  const handleCloseErrorModal = React.useCallback(() => {
    shouldResetErrorStateAfterCloseRef.current = true;
    clearCopiedTimeout();
    setIsErrorCopied(false);
    setIsErrorModalOpen(false);
  }, [clearCopiedTimeout]);

  const handleErrorModalExited = React.useCallback(() => {
    if (!shouldResetErrorStateAfterCloseRef.current) {
      return;
    }

    shouldResetErrorStateAfterCloseRef.current = false;
    clearStatusResetTimeout();
    setTestConnectionError(null);
    setTestButtonStatus('neutral');
  }, [clearStatusResetTimeout]);

  const handleCopyError = React.useCallback(async () => {
    if (!fullConnectionErrorText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(fullConnectionErrorText);
      clearCopiedTimeout();
      setIsErrorCopied(true);
      copiedTimeoutRef.current = window.setTimeout(() => {
        setIsErrorCopied(false);
      }, 2000);
    } catch {
      setIsErrorCopied(false);
    }
  }, [clearCopiedTimeout, fullConnectionErrorText]);

  const handleTestConnection = React.useCallback(async () => {
    if (connectionLoading || submitLoading) {
      return;
    }

    if (testButtonStatus === 'error' && testConnectionError) {
      setIsErrorModalOpen(true);
      return;
    }

    clearStatusResetTimeout();
    clearCopiedTimeout();
    setIsErrorCopied(false);
    setIsErrorModalOpen(false);
    setTestConnectionError(null);
    setTestButtonStatus('loading');

    const checkResult = await checkConnection();

    if (checkResult.connected) {
      setTestButtonStatus('success');
      statusResetTimeoutRef.current = window.setTimeout(() => {
        setTestButtonStatus('neutral');
      }, 3000);
      return;
    }

    if (checkResult.error) {
      setTestConnectionError(checkResult.error);
      setTestButtonStatus('error');
      setIsErrorModalOpen(true);
      return;
    }

    setTestButtonStatus('neutral');
  }, [
    checkConnection,
    clearCopiedTimeout,
    clearStatusResetTimeout,
    connectionLoading,
    submitLoading,
    testButtonStatus,
    testConnectionError,
  ]);

  const renderTestButtonContent = () => {
    switch (testButtonStatus) {
      case 'loading':
        return (
          <>
            <svg className='spinner' viewBox='0 0 24 24' fill='none'>
              <circle
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='3'
                opacity='0.25'
              />
              <path
                fill='currentColor'
                d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z'
                opacity='0.75'
              />
            </svg>
            Проверка...
          </>
        );
      case 'success':
        return (
          <>
            <svg
              className='icon'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
            Подключение успешно
          </>
        );
      case 'error':
        return (
          <>
            <svg
              className='icon'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
            Ошибка подключения
          </>
        );
      default:
        return (
          <>
            <svg
              className='icon'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
            Проверить подключение
          </>
        );
    }
  };

  const handleFormSubmit = async () => {
    const success = await handleSubmit();
    if (!success) {
      return;
    }

    onSubmit?.();
    onClose();
  };

  return (
    <>
      <StyledDialog
        open={open}
        onClose={onClose}
        data-testid='entities/data/db-connection/modal'
      >
        <Sidebar>
          <SidebarHeader>
            <SidebarTitle>Тип подключения</SidebarTitle>
          </SidebarHeader>

          <SidebarContent>
            {groupedTypes.map((group, index) => (
              <ConnectionGroup key={group.id} isFirst={index === 0}>
                <GroupHeader>
                  <GroupIcon>{group.icon}</GroupIcon>
                  <GroupName>{group.name}</GroupName>
                </GroupHeader>

                <GroupItems>
                  {group.items.map(type => {
                    const typeLogo = getConnectionTypeLogo(type.name);
                    const logoScale = getConnectionTypeLogoScale(type.name);
                    const isSelected = type.name === selectedType;
                    const isDisabled = isEditing && !isSelected;

                    return (
                      <ConnectionTypeItem
                        key={type.name}
                        type='button'
                        data-testid='entities/data/db-connection/modal-type-option'
                        data-connection-type={type.name}
                        isSelected={isSelected}
                        isDisabled={isDisabled}
                        onClick={() => handleTypeChange(type.name)}
                      >
                        <ConnectionTypeIcon>
                          {typeLogo ? (
                            <img
                              src={typeLogo}
                              alt={getConnectionTypeLabel(type.name)}
                              style={{
                                transform: `scale(${logoScale})`,
                                transformOrigin: 'center',
                              }}
                            />
                          ) : (
                            <ConnectionTypeFallback>
                              {getConnectionTypeLabel(type.name)[0]}
                            </ConnectionTypeFallback>
                          )}
                        </ConnectionTypeIcon>
                        <ConnectionTypeName isSelected={isSelected}>
                          {getConnectionTypeLabel(type.name)}
                        </ConnectionTypeName>
                      </ConnectionTypeItem>
                    );
                  })}
                </GroupItems>
              </ConnectionGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <MainContent>
          <ContentHeader>
            <HeaderLeft>
              <HeaderIconContainer>
                {headerLogo ? (
                  <img
                    src={headerLogo}
                    alt={displayedTypeLabel}
                    style={{
                      transform: `scale(${headerLogoScale})`,
                      transformOrigin: 'center',
                    }}
                  />
                ) : (
                  displayedTypeLabel[0]
                )}
              </HeaderIconContainer>

              <Box sx={{ minWidth: 0 }}>
                <HeaderTitle>
                  {isEditing
                    ? 'Редактировать подключение'
                    : `Подключение к ${displayedTypeLabel}`}
                </HeaderTitle>
                <HeaderSubtitle>
                  {isEditing
                    ? `Тип подключения: ${displayedTypeLabel}`
                    : 'Настройте параметры подключения'}
                </HeaderSubtitle>
              </Box>
            </HeaderLeft>

            <CloseButton onClick={onClose} size='small'>
              <CloseIcon />
            </CloseButton>
          </ContentHeader>

          <FormContainer>
            <FormSection>
              <Typography sx={LABEL_SX}>Основные параметры</Typography>
              <FormRow>
                <FormField>
                  <Label id='db-connection-v1-name' required>
                    Имя подключения
                  </Label>
                  <StyledTextField
                    id='db-connection-v1-name'
                    fullWidth
                    data-testid='entities/data/db-connection/modal-name-input'
                    value={draft.name}
                    error={Boolean(validationErrors['name'])}
                    helperText={validationErrors['name']}
                    onChange={event =>
                      setDraft(prev => ({ ...prev, name: event.target.value }))
                    }
                  />
                </FormField>

                {typeInfo?.drivers.length ? (
                  <FormField>
                    <Label id='db-connection-v1-driver'>Драйвер</Label>
                    <StyledSelectField
                      id='db-connection-v1-driver'
                      select
                      fullWidth
                      data-testid='entities/data/db-connection/modal-driver-select'
                      value={selectedDriver ?? ''}
                      onChange={event =>
                        handleDriverChange(event.target.value || null)
                      }
                    >
                      {typeInfo.drivers.map(item => (
                        <MenuItem key={item.name} value={item.name}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </StyledSelectField>
                  </FormField>
                ) : (
                  <FormField>
                    <Label id='db-connection-v1-type'>Тип</Label>
                    <StyledTextField
                      id='db-connection-v1-type'
                      fullWidth
                      value={displayedTypeLabel}
                      disabled
                    />
                  </FormField>
                )}
              </FormRow>
            </FormSection>

            <DynamicFieldsSection
              title='Параметры подключения'
              fields={primaryConnectionFields}
              errors={validationErrors}
              getValues={getSectionValues}
              onChange={handleDynamicFieldChange}
            />

            {requiredDriverOptionFields.length > 0 ? (
              <DynamicFieldsSection
                title='Параметры драйвера'
                fields={requiredDriverOptionFields}
                errors={validationErrors}
                getValues={getSectionValues}
                onChange={handleDynamicFieldChange}
              />
            ) : null}

            {advancedFields.length > 0 ? (
              <FormSection>
                <StaticAccordionSection
                  title='Дополнительные параметры'
                  description='Необязательные поля подключения и драйвера.'
                  icon={<SettingsRoundedIcon fontSize='small' />}
                  isOpen={isAdvancedSectionOpen}
                  onToggle={() =>
                    setIsAdvancedSectionOpen(prevOpen => !prevOpen)
                  }
                  testId='entities/data/db-connection/advanced-section'
                  toggleTestId='entities/data/db-connection/advanced-section-toggle'
                  collapsedValue={formatFilledFieldsCount(advancedFilledCount)}
                >
                  <DynamicFieldsSection
                    title='Необязательные поля'
                    fields={advancedFields}
                    errors={validationErrors}
                    getValues={getSectionValues}
                    onChange={handleDynamicFieldChange}
                  />
                </StaticAccordionSection>
              </FormSection>
            ) : null}

            <FormSection>
              <StaticAccordionSection
                title='Дополнительно'
                description='Метки и произвольные метаданные для служебных сценариев.'
                icon={<SettingsRoundedIcon fontSize='small' />}
                isOpen={isAdditionalSectionOpen}
                onToggle={() =>
                  setIsAdditionalSectionOpen(prevOpen => !prevOpen)
                }
                testId='entities/data/db-connection/additional-section'
                toggleTestId='entities/data/db-connection/additional-section-toggle'
                collapsedValue={hasAdditionalValues ? 'Заполнено' : null}
              >
                <FormSection>
                  <Typography sx={LABEL_SX}>Дополнительно</Typography>
                  <FormRow>
                    <FormField>
                      <Label id='db-connection-v1-labels'>Labels</Label>
                      <MonoTextField
                        id='db-connection-v1-labels'
                        fullWidth
                        multiline
                        minRows={4}
                        data-testid='entities/data/db-connection/modal-labels-input'
                        value={draft.labelsText}
                        error={Boolean(validationErrors['labelsText'])}
                        helperText={
                          validationErrors['labelsText'] ??
                          'Формат: key=value, по одной записи на строку'
                        }
                        onChange={event =>
                          setDraft(prev => ({
                            ...prev,
                            labelsText: event.target.value,
                          }))
                        }
                      />
                    </FormField>

                    <FormField>
                      <Label id='db-connection-v1-metadata'>Metadata</Label>
                      <MonoTextField
                        id='db-connection-v1-metadata'
                        fullWidth
                        multiline
                        minRows={4}
                        data-testid='entities/data/db-connection/modal-metadata-input'
                        value={draft.metadataText}
                        error={Boolean(validationErrors['metadataText'])}
                        helperText={
                          validationErrors['metadataText'] ??
                          'JSON-объект с произвольными метаданными'
                        }
                        onChange={event =>
                          setDraft(prev => ({
                            ...prev,
                            metadataText: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                  </FormRow>
                </FormSection>
              </StaticAccordionSection>
            </FormSection>

            {currentRole === 'admin' || currentRole === 'superadmin' ? (
              <FormSection>
                <StaticAccordionSection
                  title='Администрирование'
                  description='Переопределение области видимости подключения для admin и superadmin.'
                  icon={<AdminPanelSettingsRoundedIcon fontSize='small' />}
                  isOpen={isAdministrationSectionOpen}
                  onToggle={() =>
                    setIsAdministrationSectionOpen(prevOpen => !prevOpen)
                  }
                  testId='entities/data/db-connection/admin-section'
                  toggleTestId='entities/data/db-connection/admin-section-toggle'
                  collapsedValue={administrationCollapsedValue}
                >
                  <FormSection>
                    <Typography sx={LABEL_SX}>Область доступа</Typography>
                    <FormRow>
                      <FormField>
                        <Label id='db-connection-v1-user-id'>
                          Override user_id
                        </Label>
                        {availableUsers.length > 0 ? (
                          <StyledSelectField
                            id='db-connection-v1-user-id'
                            select
                            fullWidth
                            data-testid='entities/data/db-connection/modal-user-id-input'
                            value={scopeDraft.userId}
                            helperText='admin и superadmin могут при необходимости переопределить user_id'
                            onChange={event =>
                              setScopeDraft(prev => ({
                                ...prev,
                                userId: String(event.target.value),
                              }))
                            }
                          >
                            <MenuItem value=''>По умолчанию</MenuItem>
                            {availableUsers.map(user => (
                              <MenuItem key={user.value} value={user.value}>
                                {user.description
                                  ? `${user.label} (${user.description})`
                                  : user.label}
                              </MenuItem>
                            ))}
                          </StyledSelectField>
                        ) : (
                          <StyledTextField
                            id='db-connection-v1-user-id'
                            fullWidth
                            data-testid='entities/data/db-connection/modal-user-id-input'
                            value={scopeDraft.userId}
                            helperText='admin и superadmin могут при необходимости переопределить user_id'
                            onChange={event =>
                              setScopeDraft(prev => ({
                                ...prev,
                                userId: event.target.value,
                              }))
                            }
                          />
                        )}
                      </FormField>

                      {currentRole === 'superadmin' ? (
                        <FormField>
                          <Label id='db-connection-v1-organization-id'>
                            Override organization_id
                          </Label>
                          {availableOrganizations.length > 0 ? (
                            <StyledSelectField
                              id='db-connection-v1-organization-id'
                              select
                              fullWidth
                              data-testid='entities/data/db-connection/modal-organization-id-input'
                              value={scopeDraft.organizationId}
                              helperText='Только superadmin может переопределить organization_id'
                              onChange={event =>
                                setScopeDraft(prev => ({
                                  ...prev,
                                  organizationId: String(event.target.value),
                                }))
                              }
                            >
                              <MenuItem value=''>По умолчанию</MenuItem>
                              {availableOrganizations.map(organization => (
                                <MenuItem
                                  key={organization.value}
                                  value={organization.value}
                                >
                                  {organization.label}
                                </MenuItem>
                              ))}
                            </StyledSelectField>
                          ) : (
                            <StyledTextField
                              id='db-connection-v1-organization-id'
                              fullWidth
                              data-testid='entities/data/db-connection/modal-organization-id-input'
                              value={scopeDraft.organizationId}
                              helperText='Только superadmin может переопределить organization_id'
                              onChange={event =>
                                setScopeDraft(prev => ({
                                  ...prev,
                                  organizationId: event.target.value,
                                }))
                              }
                            />
                          )}
                        </FormField>
                      ) : (
                        <Box />
                      )}
                    </FormRow>
                  </FormSection>
                </StaticAccordionSection>
              </FormSection>
            ) : null}
          </FormContainer>

          <Footer>
            <FooterLeft>
              <TestConnectionButton
                type='button'
                status={testButtonStatus}
                data-testid='entities/data/db-connection/modal-test-button'
                data-status={testButtonStatus}
                onClick={handleTestConnection}
                disabled={
                  testButtonStatus === 'loading' ||
                  connectionLoading ||
                  submitLoading
                }
              >
                {renderTestButtonContent()}
              </TestConnectionButton>
            </FooterLeft>

            <FooterRight>
              <CancelButton
                type='button'
                data-testid='entities/data/db-connection/modal-cancel-button'
                onClick={onClose}
                disabled={submitLoading}
              >
                Отмена
              </CancelButton>
              <SubmitButton
                type='button'
                data-testid='entities/data/db-connection/modal-submit-button'
                onClick={() => {
                  void handleFormSubmit();
                }}
                disabled={submitLoading || connectionLoading}
              >
                {submitLoading
                  ? 'Сохранение...'
                  : isEditing
                    ? 'Обновить'
                    : 'Создать'}
              </SubmitButton>
            </FooterRight>
          </Footer>
        </MainContent>
      </StyledDialog>

      <TestConnectionErrorModal
        open={isErrorModalOpen}
        onClose={handleCloseErrorModal}
        data-testid='entities/data/db-connection/test-error-modal'
        TransitionProps={{ onExited: handleErrorModalExited }}
      >
        <TestConnectionErrorModalContent>
          <TestConnectionErrorModalHeader>
            <TestConnectionErrorModalIconContainer>
              <CloseIcon />
            </TestConnectionErrorModalIconContainer>

            <TestConnectionErrorModalHeaderText>
              <TestConnectionErrorModalTitle>
                Ошибка подключения
              </TestConnectionErrorModalTitle>
              <TestConnectionErrorModalException>
                {testConnectionError?.exception || 'ConnectionError'}
              </TestConnectionErrorModalException>
            </TestConnectionErrorModalHeaderText>

            <TestConnectionErrorModalCloseButton
              type='button'
              data-testid='entities/data/db-connection/test-error-modal-close-button'
              onClick={handleCloseErrorModal}
            >
              <CloseIcon />
            </TestConnectionErrorModalCloseButton>
          </TestConnectionErrorModalHeader>

          <TestConnectionErrorModalMessageContainer>
            <TestConnectionErrorModalMessageText>
              {testConnectionError?.message || 'Ошибка подключения'}
            </TestConnectionErrorModalMessageText>
          </TestConnectionErrorModalMessageContainer>

          <TestConnectionErrorModalFooter>
            <TestConnectionErrorModalCopyButton
              type='button'
              onClick={() => {
                void handleCopyError();
              }}
            >
              {isErrorCopied ? (
                <>
                  <CheckIcon />
                  <TestConnectionErrorModalCopiedText>
                    Скопировано
                  </TestConnectionErrorModalCopiedText>
                </>
              ) : (
                <>
                  <ContentCopyIcon />
                  Копировать
                </>
              )}
            </TestConnectionErrorModalCopyButton>

            <TestConnectionErrorModalCloseAction
              type='button'
              data-testid='entities/data/db-connection/test-error-modal-close-action'
              onClick={handleCloseErrorModal}
            >
              Закрыть
            </TestConnectionErrorModalCloseAction>
          </TestConnectionErrorModalFooter>
        </TestConnectionErrorModalContent>
      </TestConnectionErrorModal>
    </>
  );
};
