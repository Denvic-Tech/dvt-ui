import { Box, Stack, Typography } from '@mui/material';

import type { ConnectAgentState } from '../model/useConnectAgentState';

import { PromptField } from './PromptField';
import { TokenAccessFields, TokenNameInput } from './TokenFormFields';

const NAME_INPUT_ID = 'mcp-connect-token-name';

type AutoConnectTabProps = {
  state: ConnectAgentState;
};

export const AutoConnectTab = ({ state }: AutoConnectTabProps) => (
  <Stack spacing={1.75}>
    <Stack spacing={0.75}>
      <Typography
        component='label'
        htmlFor={NAME_INPUT_ID}
        sx={{ color: '#3A4152', fontSize: 13, fontWeight: 600 }}
      >
        Название
      </Typography>
      <TokenNameInput
        id={NAME_INPUT_ID}
        value={state.name}
        placeholder={state.namePlaceholder}
        onChange={state.changeName}
      />
    </Stack>

    <Stack spacing={1.25}>
      <TokenAccessFields form={state.form} onChange={state.changeForm} />
    </Stack>

    <Box>
      <PromptField
        url={state.linkUrl}
        canReveal={state.canReveal}
        onReveal={() => void state.revealPrompt()}
      />
      <Typography
        sx={{ mt: 1.25, color: '#9AA0AD', fontSize: 12, lineHeight: '18px' }}
      >
        Вставьте этот промпт своему агенту — он подключится сам.
        <br />
        Если агент не сможет открыть ссылку, откройте её сами и отправьте ему
        текст инструкции.
      </Typography>
    </Box>
  </Stack>
);
