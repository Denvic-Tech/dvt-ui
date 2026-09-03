import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

import { NodeInputExtensionProps } from '@/app/providers/node-extensions';

import { getConstValue, makeConst } from '@/shared/lib/node-input-values';
import { Panel } from '@/shared/ui';
import type { CodeEditorCompletionProvider } from '@/shared/ui/code-editor';
import { PythonCodeInput } from '@/shared/ui/node-input';

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

export const ExecutePython: React.FC<NodeInputExtensionProps> = ({
  value,
  onChange,
  variables,
  inputVariables,
  projectVariables,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Panel elevation={1} sx={{ p: 1.5 }}>
        <Stack gap={1}>
          <Stack direction='row' gap={1} flexWrap='wrap'>
            <Chip size='small' label='Входы: df_in, json_in' />
            <Chip size='small' label='output ← df_out' color='primary' />
            <Chip size='small' label='output_json ← json_out' color='primary' />
          </Stack>

          <Typography variant='caption' color='text.secondary'>
            Входы <b>df_in</b> и <b>json_in</b> опциональны. Чтобы передать
            результат на выход, присвойте DataFrame переменной <b>df_out</b>, а
            JSON-данные — переменной <b>json_out</b>.
          </Typography>
        </Stack>
      </Panel>

      <PythonCodeInput
        value={String(getConstValue(value) ?? '')}
        onChange={nextValue => onChange(makeConst(nextValue))}
        variables={variables}
        inputVariables={inputVariables}
        projectVariables={projectVariables}
        completionProviders={EXECUTE_PYTHON_COMPLETION_PROVIDERS}
        helperText='Используйте input_variables для входящих переменных и project_variables для переменных проекта. input_variables доступен только для чтения; Jinja2 здесь не используется.'
      />
    </Box>
  );
};
