import React, { useCallback, useMemo, useState } from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import { Alert, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions';

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';
import { useNodeValidation } from '@/features/node/validate-node';

import { isWidgetType } from '@/entities/node/node-io';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { CodeEditorCompletionProvider } from '@/shared/ui/code-editor';
import { JSONNodeInput, PythonCodeInput } from '@/shared/ui/node-input';
import { normalizeMonacoTextValue } from '@/shared/ui/node-input/monacoTextValue';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

const MONO_FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const JSON_INPUT_NAME = 'json_in';
const CODE_INPUT_NAME = 'code';
const SCRIPT_EDITOR_MIN_HEIGHT = 220;
const SCRIPT_PLACEHOLDER = [
  'df_out = df_in[df_in["amount"] > 0].copy()',
  'json_out = {"rows": len(df_out)}',
].join('\n');
const SCRIPT_CARD_MIN_HEIGHT = 360;
const JSON_CARD_MIN_HEIGHT = 200;

export const EXECUTE_PYTHON_COMPLETION_PROVIDERS: Array<
  CodeEditorCompletionProvider<void>
> = [
  {
    id: 'execute-python-io',
    priority: 0,
    triggerCharacters: ['_'],
    getSections: ({ wordRange }) => [
      {
        id: 'execute-python-inputs',
        title: 'Входные данные',
        priority: 0,
        items: [
          {
            label: 'df_in',
            kind: 'variable',
            insertText: 'df_in',
            detail: 'DataFrame | None',
            documentation: 'Опциональный входной DataFrame.',
            range: wordRange,
          },
          {
            label: 'json_in',
            kind: 'variable',
            insertText: 'json_in',
            detail: 'JSON | None',
            documentation: 'Опциональные входные JSON-данные.',
            range: wordRange,
          },
        ],
      },
      {
        id: 'execute-python-outputs',
        title: 'Выходные данные',
        priority: 10,
        items: [
          {
            label: 'df_out',
            kind: 'variable',
            insertText: 'df_out',
            detail: 'DataFrame → output',
            documentation:
              'Присвойте df_out, чтобы передать DataFrame в выход output.',
            range: wordRange,
          },
          {
            label: 'json_out',
            kind: 'variable',
            insertText: 'json_out',
            detail: 'JSON → output_json',
            documentation:
              'Присвойте json_out, чтобы передать JSON в выход output_json.',
            range: wordRange,
          },
        ],
      },
      {
        id: 'execute-python-snippets',
        title: 'Шаблоны выходов',
        priority: 20,
        items: [
          {
            label: 'df_out = df_in.copy()',
            kind: 'snippet',
            insertText: 'df_out = df_in.copy()',
            detail: 'Передать копию входного DataFrame',
            range: wordRange,
          },
          {
            label: 'json_out = json_in',
            kind: 'snippet',
            insertText: 'json_out = json_in',
            detail: 'Передать входной JSON',
            range: wordRange,
          },
        ],
      },
    ],
  },
];

type ExecutePythonValues = {
  code?: unknown;
  json_in?: unknown;
  [key: string]: unknown;
};

type CodePillProps = {
  children: React.ReactNode;
  tone?: 'default' | 'primary';
};

const CodePill: React.FC<CodePillProps> = ({ children, tone = 'default' }) => (
  <Box
    component='code'
    sx={theme => ({
      fontFamily: MONO_FONT_FAMILY,
      fontSize: 12,
      lineHeight: '16px',
      px: 1,
      py: '2px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      ...(tone === 'primary'
        ? {
            color: theme.palette.primary.dark,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }
        : {
            color: theme.palette.text.primary,
            border: '1px solid',
            borderColor: theme.palette.divider,
          }),
    })}
  >
    {children}
  </Box>
);

const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component='code'
    sx={{ fontFamily: MONO_FONT_FAMILY, fontSize: 12, color: 'text.primary' }}
  >
    {children}
  </Box>
);

const FormatListIcon: React.FC = () => (
  <svg
    aria-hidden
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polyline points='3 8 7 12 3 16' />
    <line x1='21' y1='12' x2='11' y2='12' />
    <line x1='21' y1='6' x2='11' y2='6' />
    <line x1='21' y1='18' x2='11' y2='18' />
  </svg>
);

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    aria-hidden
    width='16'
    height='16'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={{
      flexShrink: 0,
      transform: open ? 'rotate(90deg)' : 'none',
      transition: 'transform 150ms ease',
    }}
  >
    <path d='m9 18 6-6-6-6' />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg
    aria-hidden
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12 5v14' />
    <path d='M5 12h14' />
  </svg>
);

const toolbarButtonSx = {
  height: 28,
  px: 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.75,
  border: 0,
  borderRadius: '6px',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 500,
  color: 'text.secondary',
  cursor: 'pointer',
  transition: 'color 120ms ease, transform 90ms ease',
  '&:hover': { color: 'primary.main' },
  '&:active': { transform: 'scale(0.96)' },
} as const;

const getJsonPreview = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let text: string;
  if (typeof value === 'string') {
    text = value;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  return text.replace(/\s+/g, ' ').trim();
};

const Dot: React.FC = () => (
  <Box component='span' aria-hidden sx={{ color: 'divider' }}>
    •
  </Box>
);

const cardSx = (theme: Parameters<typeof getRadius>[0]) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  border: '1px solid',
  borderColor: theme.palette.divider,
  borderRadius: getRadius(theme, -6),
  backgroundColor: theme.palette.background.paper,
});

const cardBarSx = (theme: Parameters<typeof getRadius>[0]) => ({
  px: 1.75,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.text.primary, 0.025),
});

const cardTitleSx = {
  m: 0,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
  color: 'text.primary',
} as const;

const groupLabelSx = {
  fontSize: 12,
  fontWeight: 500,
  color: 'text.secondary',
} as const;

const FieldErrors: React.FC<{ errors?: string[] | undefined }> = ({
  errors,
}) =>
  errors && errors.length > 0 ? (
    <Alert severity='error' sx={{ m: 1.5, mt: 0 }}>
      {errors.join(', ')}
    </Alert>
  ) : null;

export const ExecutePython: React.FC<
  NodeModalExtensionProps<ExecutePythonValues>
> = ({
  id: nodeID,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
  inputVariables,
  projectVariables,
}) => {
  const { validationErrors, clearFieldError } = useNodeValidation(
    nodeDefinition,
    localInputData,
    setValidationCallback
  );

  const widgetInputs = useMemo(
    () =>
      Object.values(nodeDefinition.input_definitions ?? {}).filter(inputDef =>
        isWidgetType(inputDef.type)
      ),
    [nodeDefinition.input_definitions]
  );

  const jsonInput = widgetInputs.find(
    inputDef => inputDef.attr_name === JSON_INPUT_NAME
  );
  const codeInput = widgetInputs.find(
    inputDef => inputDef.attr_name === CODE_INPUT_NAME
  );
  const otherInputs = widgetInputs.filter(
    inputDef =>
      inputDef.attr_name !== JSON_INPUT_NAME &&
      inputDef.attr_name !== CODE_INPUT_NAME
  );

  const jsonPreview = getJsonPreview(localInputData[JSON_INPUT_NAME]);
  const [jsonOpen, setJsonOpen] = useState(() => jsonPreview !== '');
  const toggleJson = useCallback(() => setJsonOpen(open => !open), []);
  const openJson = useCallback(() => setJsonOpen(true), []);

  const jsonHeaderTitle = (
    <Box
      component='button'
      type='button'
      aria-expanded={jsonOpen}
      onClick={toggleJson}
      sx={{
        height: 32,
        px: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        border: 0,
        borderRadius: '6px',
        backgroundColor: 'transparent',
        fontFamily: 'inherit',
        cursor: 'pointer',
        color: 'text.primary',
        '& svg': { color: 'text.secondary' },
        '&:hover svg': { color: 'primary.main' },
      }}
    >
      <ChevronIcon open={jsonOpen} />
      <Typography component='span' sx={cardTitleSx}>
        Входной JSON
      </Typography>
      <Typography
        component='span'
        sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary' }}
      >
        опционально
      </Typography>
    </Box>
  );

  const codeErrors = validationErrors[CODE_INPUT_NAME]?.length
    ? validationErrors[CODE_INPUT_NAME].join(', ')
    : null;

  const handleInputDataChange = useCallback(
    (inputName: string, value: unknown) => {
      setLocalInputData(prev => ({ ...prev, [inputName]: value }));
      clearFieldError(inputName);
    },
    [setLocalInputData, clearFieldError]
  );

  const handleCodeChange = useCallback(
    (nextValue: string) => handleInputDataChange(CODE_INPUT_NAME, nextValue),
    [handleInputDataChange]
  );

  const handleJsonChange = useCallback(
    (nextValue: unknown) => handleInputDataChange(JSON_INPUT_NAME, nextValue),
    [handleInputDataChange]
  );

  const renderGenericInput = (inputDefinition: InputDefinitionModel) => (
    <Box
      key={inputDefinition.attr_name}
      sx={theme => ({ ...cardSx(theme), p: 1.75, gap: 1 })}
    >
      <Typography
        sx={{ fontSize: 13, fontWeight: 500, color: 'text.secondary' }}
      >
        {inputDefinition.display_name || inputDefinition.attr_name}
      </Typography>
      <NodeDataInput
        nodeID={nodeID}
        inputDefinition={inputDefinition}
        currentValue={localInputData[inputDefinition.attr_name]}
        variables={variables}
        onValueChange={newValue =>
          handleInputDataChange(inputDefinition.attr_name, newValue)
        }
      />
      <FieldErrors errors={validationErrors[inputDefinition.attr_name]} />
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
        p: '18px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {validationErrors['_general'] && (
        <Alert severity='error'>
          {validationErrors['_general'].join(', ')}
        </Alert>
      )}

      {jsonInput && (
        <Box
          data-testid='execute-python/json-card'
          sx={theme => ({
            ...cardSx(theme),
            ...(jsonOpen
              ? { flex: '1 1 0', minHeight: JSON_CARD_MIN_HEIGHT }
              : { flexShrink: 0 }),
            '& .ep-json-body': {
              flex: 1,
              minHeight: 0,
              display: jsonOpen ? 'flex' : 'none',
              flexDirection: 'column',
            },
            '& .ep-json-body > div': {
              gap: 0,
              flex: 1,
              minHeight: 0,
            },
            '& .ep-json-body > div > div:first-of-type': {
              ...cardBarSx(theme),
              height: 44,
              boxSizing: 'border-box',
              pl: 0.75,
              pr: 1,
              backgroundColor: theme.palette.background.paper,
              boxShadow: `inset 0 -1px 0 ${theme.palette.divider}`,
              justifyContent: 'flex-start',
            },
            '& .ep-json-body > div > div:first-of-type > .MuiTypography-root': {
              ...cardTitleSx,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
            },
            '& .ep-json-body > div > div:first-of-type > div:last-of-type': {
              marginLeft: 'auto',
              gap: 0.25,
            },
            '& .ep-json-body > div > div:first-of-type .MuiButton-outlined': {
              height: 28,
              minHeight: 0,
              px: 1,
              border: 0,
              borderRadius: '6px',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1,
              color: 'text.secondary',
              transition: 'color 120ms ease, transform 90ms ease',
              '&:active': { transform: 'scale(0.96)' },
              '& .MuiButton-startIcon': {
                mr: 0.75,
                ml: 0,
                color: 'inherit',
              },
              '& .MuiTouchRipple-root': { display: 'none' },
              '&:hover': {
                border: 0,
                backgroundColor: 'transparent',
                boxShadow: 'none',
                color: 'primary.main',
              },
            },
            '& .ep-json-body > div > .nokey': {
              flex: 1,
              minHeight: 0,
              border: 0,
              borderRadius: 0,
            },
            '& .monaco-editor .current-line, & .monaco-editor .current-line-margin':
              {
                border: '0 !important',
              },
            '& .monaco-editor .line-numbers': {
              color: `${alpha(theme.palette.text.primary, 0.34)} !important`,
              fontSize: '12px !important',
            },
            '& .ep-json-body > div > .MuiTypography-caption': {
              px: 1.75,
              py: 1,
            },
          })}
        >
          {!jsonOpen && (
            <Box
              sx={theme => ({
                ...cardBarSx(theme),
                height: 44,
                boxSizing: 'border-box',
                pl: 0.75,
                pr: 1,
                backgroundColor: theme.palette.background.paper,
              })}
            >
              {jsonHeaderTitle}
              <Box
                sx={{
                  ml: 'auto',
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {jsonPreview ? (
                  <Box
                    component='code'
                    title={jsonPreview}
                    sx={{
                      display: 'block',
                      maxWidth: 420,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pr: 1,
                      fontFamily: MONO_FONT_FAMILY,
                      fontSize: 12,
                      color: 'text.secondary',
                    }}
                  >
                    {jsonPreview}
                  </Box>
                ) : (
                  <Box
                    component='button'
                    type='button'
                    onClick={openJson}
                    sx={toolbarButtonSx}
                  >
                    <PlusIcon />
                    Добавить
                  </Box>
                )}
              </Box>
            </Box>
          )}
          <Box className='ep-json-body'>
            <JSONNodeInput
              value={localInputData[JSON_INPUT_NAME]}
              onChange={handleJsonChange}
              variables={variables}
              allowVariableBinding={Boolean(jsonInput.allow_expressions)}
              showLineNumbers
              formatButtonIcon={<FormatListIcon />}
              toolbarVariant='compact'
              placeholder='{ "key": "value" }'
              height='100%'
              title={jsonHeaderTitle}
            />
            <FieldErrors errors={validationErrors[JSON_INPUT_NAME]} />
          </Box>
        </Box>
      )}

      {codeInput && (
        <Box
          data-testid='execute-python/script-card'
          sx={theme => ({
            ...cardSx(theme),
            flex: jsonOpen ? '1 1 0' : '1 1 auto',
            minHeight: SCRIPT_CARD_MIN_HEIGHT,
            ...(codeErrors
              ? {
                  borderColor: theme.palette.error.main,
                }
              : {}),
          })}
        >
          <Box
            sx={theme => ({
              ...cardBarSx(theme),
              height: 44,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <TerminalOutlinedIcon
              sx={{ fontSize: 16, color: 'text.secondary' }}
              aria-hidden
            />
            <Typography component='h2' sx={cardTitleSx}>
              Python код
            </Typography>
            {codeErrors && (
              <Typography
                component='span'
                role='alert'
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'error.main',
                  whiteSpace: 'nowrap',
                }}
              >
                {codeErrors}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              px: 1.75,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: 2,
              rowGap: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              fontSize: 12,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography component='span' sx={groupLabelSx}>
                Входы
              </Typography>
              <CodePill>df_in</CodePill>
              <CodePill>json_in</CodePill>
            </Box>
            <Box
              aria-hidden
              sx={{ width: '1px', height: 16, backgroundColor: 'divider' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography component='span' sx={groupLabelSx}>
                Выходы
              </Typography>
              <CodePill tone='primary'>output ← df_out</CodePill>
              <CodePill tone='primary'>output_json ← json_out</CodePill>
            </Box>
            <Box sx={{ flex: '1 1 0', minWidth: 0 }} />
            <Typography
              component='span'
              sx={{
                fontSize: 12,
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              Чтобы вернуть результат, присвойте{' '}
              <Box
                component='b'
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                df_out
              </Box>{' '}
              и/или{' '}
              <Box
                component='b'
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                json_out
              </Box>
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: SCRIPT_EDITOR_MIN_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              '& [data-testid="shared/ui/code-editor/code-editor-input"]': {
                border: 0,
                borderRadius: 0,
                backgroundColor: 'transparent',
              },
            }}
          >
            <PythonCodeInput
              value={normalizeMonacoTextValue(
                localInputData[CODE_INPUT_NAME] ?? ''
              )}
              onChange={handleCodeChange}
              variables={variables}
              inputVariables={inputVariables}
              projectVariables={projectVariables}
              completionProviders={EXECUTE_PYTHON_COMPLETION_PROVIDERS}
              height='100%'
              placeholder={SCRIPT_PLACEHOLDER}
            />
          </Box>
          <Box
            sx={theme => ({
              ...cardBarSx(theme),
              py: 1,
              flexWrap: 'wrap',
              gap: 1,
              backgroundColor: theme.palette.background.paper,
              borderTop: `1px solid ${theme.palette.divider}`,
              fontSize: 12,
              color: 'text.secondary',
            })}
          >
            <InfoOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
            <InlineCode>input_variables</InlineCode>
            <span>— входящие, только чтение</span>
            <Dot />
            <InlineCode>project_variables</InlineCode>
            <span>— переменные проекта</span>
            <Dot />
            <span>Jinja2 не используется</span>
          </Box>
        </Box>
      )}

      {otherInputs.map(renderGenericInput)}
    </Box>
  );
};
