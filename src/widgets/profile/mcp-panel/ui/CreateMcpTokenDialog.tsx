import * as React from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box, Stack, Typography } from '@mui/material';

import { useMcpTokens } from '@/entities/admin/mcp-token';

import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';

import {
  buildTokenAccessScope,
  createDefaultTokenAccessForm,
  defaultTokenName,
  isTokenAccessFormValid,
  resolveTokenExpiresAt,
  type TokenAccessForm,
} from '../lib/tokenForm';
import { MCP_AGENTS } from '../model/agents';

import { ManualConnectTab } from './ManualConnectTab';
import { McpDialog } from './McpDialog';
import {
  TokenAccessFields,
  TokenFieldRow,
  TokenNameInput,
} from './TokenFormFields';
import { TokenSecretField } from './TokenSecretField';

const NAME_INPUT_ID = 'mcp-create-token-name';

const PlusIcon = () => (
  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={1.5}
      d='M12 5v14m7-7H5'
    />
  </svg>
);

type CreateMcpTokenDialogProps = {
  open: boolean;
  mcpUrl: string;
  onClose: () => void;
};

export const CreateMcpTokenDialog = ({
  open,
  mcpUrl,
  onClose,
}: CreateMcpTokenDialogProps) => {
  const { creationStatus, createdSecret, createMcpToken, resetCreationState } =
    useMcpTokens();
  const [name, setName] = React.useState('');
  const [form, setForm] = React.useState<TokenAccessForm>(
    createDefaultTokenAccessForm
  );
  const [agentId, setAgentId] = React.useState(MCP_AGENTS[0]!.id);
  const namePlaceholder = React.useMemo(() => defaultTokenName(), []);

  // Reset only after the closing animation, so the result does not switch back
  // to the form while it fades out.
  const handleExited = () => {
    resetCreationState();
    setName('');
    setForm(createDefaultTokenAccessForm());
    setAgentId(MCP_AGENTS[0]!.id);
  };

  const handleCreate = async () => {
    try {
      await createMcpToken({
        name: name.trim() || namePlaceholder,
        expires_at: resolveTokenExpiresAt(form),
        access_scope: buildTokenAccessScope(form),
      });
    } catch {
      // The gateway client already shows the request error.
    }
  };

  if (createdSecret) {
    return (
      <McpDialog
        open={open}
        icon={<CheckRoundedIcon />}
        title='Токен создан'
        subtitle='Скопируйте и вставьте его в конфиг клиента'
        onClose={onClose}
        onExited={handleExited}
      >
        <Stack spacing={1.25}>
          <TokenSecretField secret={createdSecret} />
          <Typography
            sx={{
              pb: 0.75,
              color: '#6B7385',
              fontSize: 12,
              lineHeight: '18px',
            }}
          >
            Сохраните токен сейчас — больше он показан не будет. Отозвать токен
            можно в списке.
          </Typography>
          <Box sx={{ pt: 2, borderTop: '1px solid #f3f4f6' }}>
            <Typography
              sx={{
                mb: 1.25,
                color: '#3A4152',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: '18px',
              }}
            >
              Как подключить MCP
            </Typography>
            <ManualConnectTab
              mcpUrl={mcpUrl}
              agentId={agentId}
              onAgentChange={setAgentId}
            />
          </Box>
        </Stack>
      </McpDialog>
    );
  }

  return (
    <McpDialog
      open={open}
      icon={<PlusIcon />}
      title='Новый MCP-токен'
      subtitle='Задайте название и доступ'
      onExited={handleExited}
      actions={
        <>
          <CancelButton type='button' onClick={onClose}>
            Отмена
          </CancelButton>
          <CreateButton
            type='button'
            disabled={
              creationStatus === 'loading' || !isTokenAccessFormValid(form)
            }
            onClick={() => void handleCreate()}
          >
            Создать токен
          </CreateButton>
        </>
      }
    >
      <Stack spacing={1.5}>
        <TokenFieldRow label='Название' htmlFor={NAME_INPUT_ID}>
          <TokenNameInput
            id={NAME_INPUT_ID}
            value={name}
            placeholder={namePlaceholder}
            onChange={setName}
          />
        </TokenFieldRow>
        <TokenAccessFields form={form} onChange={setForm} />
      </Stack>
    </McpDialog>
  );
};
