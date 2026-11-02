import * as React from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useMcpTokens } from '@/entities/admin/mcp-token';

import type { McpTokenReadSchema } from '@/shared/gatewayClient';
import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';

import { McpDialog } from './McpDialog';
import { TokenNameInput } from './TokenFormFields';

type RenameMcpTokenDialogProps = {
  token: McpTokenReadSchema | null;
  onClose: () => void;
};

export const RenameMcpTokenDialog = ({
  token,
  onClose,
}: RenameMcpTokenDialogProps) => {
  const { renameMcpToken } = useMcpTokens();
  const [name, setName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const trimmedName = name.trim();

  React.useEffect(() => {
    if (token) {
      setName(token.name ?? '');
    }
  }, [token]);

  const handleSave = async () => {
    if (!token) return;

    setIsSaving(true);
    try {
      await renameMcpToken(token.id, trimmedName);
      onClose();
    } catch {
      // The gateway client already shows the request error.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <McpDialog
      open={token !== null}
      icon={<EditOutlinedIcon />}
      title='Переименовать токен'
      subtitle='Новое название будет видно в списке токенов'
      actions={
        <>
          <CancelButton type='button' onClick={onClose}>
            Отмена
          </CancelButton>
          <CreateButton
            type='button'
            disabled={isSaving || !trimmedName}
            onClick={() => void handleSave()}
          >
            Сохранить
          </CreateButton>
        </>
      }
    >
      <TokenNameInput
        id='mcp-rename-token-name'
        value={name}
        placeholder='Название токена'
        autoFocus
        onChange={setName}
      />
    </McpDialog>
  );
};
