import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, FormControl, MenuItem, Select, TextField } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';

import { type InputDefinitionModel, zIo } from '@/shared/gatewayClient';
import {
  JSONNodeInput,
  MappingNodeInput,
  PrimitiveNodeInput,
} from '@/shared/ui/node-input';

import {
  COMMON_HEADER_OPTIONS,
  COMMON_QUERY_OPTIONS,
  METHOD_OPTIONS,
} from './constants';
import {
  Container,
  FieldGroup,
  FieldLabel,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
  RequestRow,
  StyledTab,
  StyledTabs,
  TabPanel,
  TabsHeader,
} from './styles';
import {
  AuthFieldValue,
  AuthType,
  HttpRequestAuth,
  HTTPRequestValues,
  KeyValueRow,
} from './types';
import { buildObjectFromRows, buildRowsFromObject } from './utils';

const JSON_BODY_HINT =
  'Формат: JSON объект { "key": "value" } или массив ["value"].';
const FORM_BODY_HINT = 'Формат: JSON объект { "key": "value" }.';

const AUTH_TYPES = new Set<string>(Object.values(AuthType));

const createDefaultAuth = (type: AuthType): HttpRequestAuth => {
  switch (type) {
    case AuthType.BASIC:
      return { type, username: '', password: '' };
    case AuthType.DIGEST:
      return { type, username: '', password: '' };
    case AuthType.OAUTH2:
      return { type, token: '' };
    case AuthType.FILE_CERT:
      return { type, cert_file_path: '', key_file_path: null };
    case AuthType.NONE:
    default:
      return { type: AuthType.NONE };
  }
};

const normalizeAuth = (auth: unknown): HttpRequestAuth => {
  if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
    return createDefaultAuth(AuthType.NONE);
  }

  const candidate = auth as Partial<HttpRequestAuth>;
  if (!candidate.type || !AUTH_TYPES.has(candidate.type)) {
    return createDefaultAuth(AuthType.NONE);
  }

  return candidate as HttpRequestAuth;
};

const createAuthStringInputDefinition = (
  baseInputDefinition: InputDefinitionModel | null | undefined,
  attrName: string,
  displayName: string
): InputDefinitionModel => ({
  attr_name: attrName,
  allow_expressions: true,
  default: '',
  display_name: displayName,
  display_type: zIo.enum.STRING,
  expression_policy: baseInputDefinition?.expression_policy ?? 'default',
  force_handle_visible: false,
  is_hidden: false,
  is_list_type: false,
  is_literal_type: false,
  metadata_source_field: null,
  multiline: false,
  optional: true,
  options: null,
  schema: null,
  step: null,
  round_val: null,
  min_value: null,
  max_value: null,
  type: zIo.enum.STRING,
});

export const HTTPRequest: React.FC<
  NodeModalExtensionProps<HTTPRequestValues>
> = ({
  id,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  variables,
  inputVariables,
  projectVariables,
}) => {
  const [activeTab, setActiveTab] = useState('headers');
  const [bodyTab, setBodyTab] = useState('json');
  const headersSyncRef = useRef(false);
  const paramsSyncRef = useRef(false);
  const inputDefinitions = nodeDefinition.input_definitions;

  const inputDefinitionsByName = useMemo(() => {
    const map = new Map<string, InputDefinitionModel>();
    for (const inputDefinition of Object.values(inputDefinitions ?? {})) {
      map.set(inputDefinition.attr_name, inputDefinition);
    }
    return map;
  }, [inputDefinitions]);

  const authInputDefinitions = useMemo(() => {
    const authInputDefinition = inputDefinitionsByName.get('auth');

    return {
      certFilePath: createAuthStringInputDefinition(
        authInputDefinition,
        'auth.cert_file_path',
        'Client certificate path'
      ),
      keyFilePath: createAuthStringInputDefinition(
        authInputDefinition,
        'auth.key_file_path',
        'Private key path'
      ),
      password: createAuthStringInputDefinition(
        authInputDefinition,
        'auth.password',
        'Пароль'
      ),
      token: createAuthStringInputDefinition(
        authInputDefinition,
        'auth.token',
        'OAuth токен'
      ),
      username: createAuthStringInputDefinition(
        authInputDefinition,
        'auth.username',
        'Имя пользователя'
      ),
    };
  }, [inputDefinitionsByName]);

  useEffect(() => {
    if (!localInputData?.auth) {
      setLocalInputData(prev => ({
        ...(prev || {}),
        auth: createDefaultAuth(AuthType.NONE),
        method: prev?.method || 'GET',
      }));
    }
  }, [localInputData?.auth, setLocalInputData]);

  useEffect(() => {
    const auth = normalizeAuth(localInputData?.auth);
    if (auth.type !== AuthType.FILE_CERT || !auth.key_password) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev || {}),
      auth: {
        ...auth,
        key_password: null,
      },
    }));
  }, [localInputData?.auth, setLocalInputData]);

  const handleChange = useCallback(
    (field: keyof HTTPRequestValues, value: any) => {
      setLocalInputData(prev => {
        const newState = { ...(prev || {}), [field]: value };

        if (field === 'method' && value === 'GET') {
          newState.json_payload = null;
          newState.data = {};
        }

        if (['headers', 'params', 'json_payload', 'data'].includes(field)) {
          if (typeof value === 'string') {
            try {
              (newState as any)[field] = JSON.parse(value);
            } catch (error) {
              (newState as any)[field] = value;
            }
          }
        }

        return newState;
      });
    },
    [setLocalInputData]
  );

  const auth = normalizeAuth(localInputData?.auth);
  const authType = auth.type;
  const method = localInputData?.method || 'GET';
  const bodyEnabled = ['POST', 'PUT', 'PATCH'].includes(method);

  const handleAuthTypeChange = useCallback(
    (type: AuthType) => {
      setLocalInputData(prev => ({
        ...(prev || {}),
        auth: createDefaultAuth(type),
      }));
    },
    [setLocalInputData]
  );

  const handleAuthFieldChange = useCallback(
    (field: string, value: AuthFieldValue | undefined) => {
      setLocalInputData(prev => {
        const currentAuth = normalizeAuth(prev?.auth);
        if (currentAuth.type === AuthType.NONE) {
          return prev || {};
        }

        return {
          ...(prev || {}),
          auth: {
            ...currentAuth,
            [field]: value,
            ...(currentAuth.type === AuthType.FILE_CERT
              ? { key_password: null }
              : {}),
          } as HttpRequestAuth,
        };
      });
    },
    [setLocalInputData]
  );

  useEffect(() => {
    if (!bodyEnabled && activeTab === 'body') {
      setActiveTab('headers');
    }
  }, [activeTab, bodyEnabled]);

  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>(() =>
    buildRowsFromObject(localInputData?.headers)
  );
  const [paramRows, setParamRows] = useState<KeyValueRow[]>(() =>
    buildRowsFromObject(localInputData?.params)
  );

  useEffect(() => {
    if (headersSyncRef.current) {
      headersSyncRef.current = false;
      return;
    }
    setHeaderRows(buildRowsFromObject(localInputData?.headers));
  }, [localInputData?.headers]);

  useEffect(() => {
    if (paramsSyncRef.current) {
      paramsSyncRef.current = false;
      return;
    }
    setParamRows(buildRowsFromObject(localInputData?.params));
  }, [localInputData?.params]);

  const handleHeadersChange = useCallback(
    (nextRows: KeyValueRow[]) => {
      headersSyncRef.current = true;
      setHeaderRows(nextRows);
      handleChange('headers', buildObjectFromRows(nextRows));
    },
    [handleChange]
  );

  const handleParamsChange = useCallback(
    (nextRows: KeyValueRow[]) => {
      paramsSyncRef.current = true;
      setParamRows(nextRows);
      handleChange('params', buildObjectFromRows(nextRows));
    },
    [handleChange]
  );

  const renderVariableAwareInput = useCallback(
    (field: keyof HTTPRequestValues, fallback: React.ReactNode) => {
      const inputDefinition = inputDefinitionsByName.get(String(field));
      if (!inputDefinition) {
        return fallback;
      }

      return (
        <NodeDataInput
          nodeID={id}
          inputDefinition={inputDefinition}
          currentValue={localInputData?.[field]}
          variables={variables}
          onValueChange={nextValue => handleChange(field, nextValue)}
        />
      );
    },
    [handleChange, id, inputDefinitionsByName, localInputData, variables]
  );

  const renderAuthStringInput = useCallback(
    (
      inputDefinition: InputDefinitionModel,
      value: AuthFieldValue | undefined,
      onChange: (value: AuthFieldValue | undefined) => void,
      masked = false
    ) => (
      <PrimitiveNodeInput
        inputDefinition={inputDefinition}
        value={value}
        onChange={nextValue => onChange(nextValue as AuthFieldValue)}
        variables={variables}
        masked={masked}
      />
    ),
    [variables]
  );

  return (
    <Container>
      <Panel>
        <PanelHeader>
          <PanelTitle>Request</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <RequestRow>
            <FormControl size='small' fullWidth>
              <Select
                value={method}
                onChange={e => handleChange('method', e.target.value)}
              >
                {METHOD_OPTIONS.map(m => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <PrimitiveNodeInput
              inputDefinition={inputDefinitionsByName.get('url')}
              value={localInputData?.url}
              onChange={e => handleChange('url', e)}
              variables={variables}
            />
          </RequestRow>
        </PanelBody>
      </Panel>

      <Panel>
        <TabsHeader>
          <StyledTabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
          >
            <StyledTab value='headers' label='Headers' />
            <StyledTab value='params' label='Params' />
            <StyledTab value='body' label='Body' disabled={!bodyEnabled} />
            <StyledTab value='auth' label='Auth' />
            <StyledTab value='settings' label='Settings' />
          </StyledTabs>
        </TabsHeader>

        {activeTab === 'headers' && (
          <TabPanel>
            <MappingNodeInput
              rows={headerRows}
              onRowsChange={handleHeadersChange}
              options={COMMON_HEADER_OPTIONS}
              keyPlaceholder='Header name'
            />
          </TabPanel>
        )}

        {activeTab === 'params' && (
          <TabPanel>
            <MappingNodeInput
              rows={paramRows}
              onRowsChange={handleParamsChange}
              options={COMMON_QUERY_OPTIONS}
              keyPlaceholder='Param name'
            />
          </TabPanel>
        )}

        {activeTab === 'body' && (
          <TabPanel>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <StyledTabs
                value={bodyTab}
                onChange={(_, value) => setBodyTab(value)}
                sx={{ mt: -0.5 }}
              >
                <StyledTab value='json' label='JSON' />
                <StyledTab value='form' label='Form Data' />
              </StyledTabs>

              {bodyTab === 'json' && (
                <JSONNodeInput
                  value={localInputData?.json_payload}
                  onChange={value => handleChange('json_payload', value)}
                  title='Редактор тела запроса'
                  hint={JSON_BODY_HINT}
                  variables={variables}
                  inputVariables={inputVariables}
                  projectVariables={projectVariables}
                />
              )}
              {bodyTab === 'form' && (
                <JSONNodeInput
                  value={localInputData?.data}
                  onChange={value => handleChange('data', value)}
                  title='Редактор формы'
                  hint={FORM_BODY_HINT}
                  variables={variables}
                  inputVariables={inputVariables}
                  projectVariables={projectVariables}
                />
              )}
            </Box>
          </TabPanel>
        )}

        {activeTab === 'auth' && (
          <TabPanel sx={{ gap: 2 }}>
            <FieldGroup>
              <FieldLabel>Тип аутентификации</FieldLabel>
              <FormControl size='small' fullWidth>
                <Select
                  value={authType}
                  onChange={e =>
                    handleAuthTypeChange(e.target.value as AuthType)
                  }
                >
                  <MenuItem value={AuthType.NONE}>Не требуется</MenuItem>
                  <MenuItem value={AuthType.BASIC}>Basic</MenuItem>
                  <MenuItem value={AuthType.DIGEST}>Digest</MenuItem>
                  <MenuItem value={AuthType.OAUTH2}>OAuth 2.0</MenuItem>
                  <MenuItem value={AuthType.FILE_CERT}>Client cert</MenuItem>
                </Select>
              </FormControl>
            </FieldGroup>

            {(authType === AuthType.BASIC || authType === AuthType.DIGEST) && (
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
              >
                <FieldGroup>
                  <FieldLabel>Имя пользователя</FieldLabel>
                  {renderAuthStringInput(
                    authInputDefinitions.username,
                    auth.type === AuthType.BASIC ||
                      auth.type === AuthType.DIGEST
                      ? auth.username
                      : '',
                    value => handleAuthFieldChange('username', value)
                  )}
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Пароль</FieldLabel>
                  {renderAuthStringInput(
                    authInputDefinitions.password,
                    auth.type === AuthType.BASIC ||
                      auth.type === AuthType.DIGEST
                      ? auth.password
                      : '',
                    value => handleAuthFieldChange('password', value),
                    true
                  )}
                </FieldGroup>
              </Box>
            )}

            {authType === AuthType.OAUTH2 && (
              <FieldGroup sx={{ mt: 2 }}>
                <FieldLabel>OAuth токен</FieldLabel>
                {renderAuthStringInput(
                  authInputDefinitions.token,
                  auth.type === AuthType.OAUTH2 ? auth.token : '',
                  value => handleAuthFieldChange('token', value),
                  true
                )}
              </FieldGroup>
            )}

            {authType === AuthType.FILE_CERT && (
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
              >
                <FieldGroup>
                  <FieldLabel>Client certificate path</FieldLabel>
                  {renderAuthStringInput(
                    authInputDefinitions.certFilePath,
                    auth.type === AuthType.FILE_CERT ? auth.cert_file_path : '',
                    value => handleAuthFieldChange('cert_file_path', value)
                  )}
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Private key path</FieldLabel>
                  {renderAuthStringInput(
                    authInputDefinitions.keyFilePath,
                    auth.type === AuthType.FILE_CERT ? auth.key_file_path : '',
                    value =>
                      handleAuthFieldChange(
                        'key_file_path',
                        value === '' ? null : value
                      )
                  )}
                </FieldGroup>
              </Box>
            )}
          </TabPanel>
        )}

        {activeTab === 'settings' && (
          <TabPanel sx={{ gap: 2 }}>
            <FieldGroup>
              <FieldLabel>Таймаут (сек.)</FieldLabel>
              {renderVariableAwareInput(
                'timeout',
                <TextField
                  type='number'
                  size='small'
                  fullWidth
                  value={localInputData?.timeout ?? 30}
                  onChange={e =>
                    handleChange('timeout', Number(e.target.value))
                  }
                />
              )}
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>SSL verification</FieldLabel>
              {renderVariableAwareInput(
                'verify_ssl',
                <Box
                  sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5 }}
                >
                  <Select
                    size='small'
                    value={String(localInputData?.verify_ssl ?? true)}
                    onChange={event =>
                      handleChange('verify_ssl', event.target.value === 'true')
                    }
                  >
                    <MenuItem value='true'>Вкл</MenuItem>
                    <MenuItem value='false'>Выкл</MenuItem>
                  </Select>
                </Box>
              )}
            </FieldGroup>
          </TabPanel>
        )}
      </Panel>
    </Container>
  );
};
