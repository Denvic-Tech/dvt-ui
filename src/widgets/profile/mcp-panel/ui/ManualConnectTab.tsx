import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';

import {
  type AgentPalette,
  MCP_AGENTS,
  TOKEN_PLACEHOLDER,
} from '../model/agents';

import { copyHostSx, CopyIconButton } from './CopyIconButton';
import { MONO_FONT_FAMILY } from './styles';

const InlineCode = ({
  palette,
  children,
}: {
  palette: AgentPalette;
  children: React.ReactNode;
}) => (
  <Box
    component='code'
    sx={{
      px: 0.625,
      py: '1px',
      borderRadius: '5px',
      bgcolor: palette.inlineBg,
      color: palette.inlineFg,
      fontFamily: MONO_FONT_FAMILY,
      fontSize: 12,
    }}
  >
    {children}
  </Box>
);

const StepText = ({
  text,
  palette,
}: {
  text: string;
  palette: AgentPalette;
}) => (
  <Typography sx={{ color: palette.text, fontSize: 13, lineHeight: '22px' }}>
    {text.split('`').map((part, index) =>
      index % 2 === 1 ? (
        <InlineCode key={part} palette={palette}>
          {part}
        </InlineCode>
      ) : (
        part
      )
    )}
  </Typography>
);

const CodeSnippet = ({
  snippet,
  palette,
}: {
  snippet: string;
  palette: AgentPalette;
}) => {
  const parts = snippet.split(TOKEN_PLACEHOLDER);

  return (
    <Box
      sx={{
        ...copyHostSx,
        py: 1.5,
        pl: 2,
        pr: 6,
        border: '1px solid rgba(20, 24, 40, 0.06)',
        borderRadius: '12px',
        bgcolor: palette.codeBg,
      }}
    >
      <Box
        component='code'
        sx={{
          display: 'block',
          color: palette.codeFg,
          fontFamily: MONO_FONT_FAMILY,
          fontSize: 12.5,
          lineHeight: '20px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 ? (
              <Box
                component='span'
                sx={{
                  color: palette.tokenFg,
                  fontWeight: palette.tokenWeight,
                }}
              >
                {TOKEN_PLACEHOLDER}
              </Box>
            ) : null}
            {part}
          </React.Fragment>
        ))}
      </Box>
      <CopyIconButton text={snippet} label='Скопировать' />
    </Box>
  );
};

type ManualConnectTabProps = {
  mcpUrl: string;
  agentId: string;
  onAgentChange: (agentId: string) => void;
  // Without it the token is already at hand, right above the instructions.
  onCreateToken?: () => void;
};

export const ManualConnectTab = ({
  mcpUrl,
  agentId,
  onAgentChange,
  onCreateToken,
}: ManualConnectTabProps) => {
  const agent = MCP_AGENTS.find(item => item.id === agentId) ?? MCP_AGENTS[0]!;
  const { palette } = agent;

  return (
    <Stack spacing={1.75}>
      <Box
        role='radiogroup'
        aria-label='Клиент'
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
        }}
      >
        {MCP_AGENTS.map(item => {
          const selected = item.id === agentId;

          return (
            <Box
              key={item.id}
              component='button'
              type='button'
              role='radio'
              aria-checked={selected}
              onClick={() => onAgentChange(item.id)}
              sx={{
                height: 36,
                px: 1,
                border: '1px solid',
                borderColor: selected ? 'transparent' : '#E3E7EF',
                borderRadius: '9px',
                bgcolor: selected ? item.palette.buttonBg : '#fff',
                color: selected ? item.palette.buttonFg : '#3A4152',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition:
                  'background-color 150ms ease, border-color 150ms ease',
              }}
            >
              {item.name}
            </Box>
          );
        })}
      </Box>

      <Stack spacing={2.25}>
        <Typography
          sx={{ color: palette.text, fontSize: 13, lineHeight: '22px' }}
        >
          Замените{' '}
          <InlineCode palette={palette}>{TOKEN_PLACEHOLDER}</InlineCode>{' '}
          {onCreateToken ? (
            <>
              на свой токен или{' '}
              <Box component='span' sx={{ whiteSpace: 'nowrap' }}>
                <Box
                  component='button'
                  type='button'
                  onClick={onCreateToken}
                  sx={{
                    p: 0,
                    border: 'none',
                    bgcolor: 'transparent',
                    color: palette.link,
                    font: 'inherit',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: palette.linkUnderline
                      ? 'underline'
                      : 'none',
                    textUnderlineOffset: '3px',
                    '&:hover': { opacity: 0.8 },
                  }}
                >
                  создайте новый
                </Box>
                .
              </Box>
            </>
          ) : (
            'на токен выше.'
          )}
        </Typography>

        {agent.buildSteps(mcpUrl).map(step => (
          <Stack key={step.text} spacing={1}>
            <StepText text={step.text} palette={palette} />
            {step.snippet ? (
              <CodeSnippet snippet={step.snippet} palette={palette} />
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
