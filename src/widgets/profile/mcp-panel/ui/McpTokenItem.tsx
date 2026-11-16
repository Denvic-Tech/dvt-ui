import { IconPlugConnected } from '@tabler/icons-react';

import type { McpTokenReadSchema } from '@/shared/gatewayClient';
import { TokenListRow } from '@/shared/ui/token-list';

import { formatAccessSummary } from '../lib/mcpTokenScope';

export const MCP_NAME_COLUMN_WIDTH = 130;

type McpTokenItemProps = {
  token: McpTokenReadSchema;
  onRename: (token: McpTokenReadSchema) => void;
  onRevoke: (token: McpTokenReadSchema) => void;
};

export const McpTokenItem = ({
  token,
  onRename,
  onRevoke,
}: McpTokenItemProps) => {
  const name = token.name ?? 'Без названия';

  return (
    <TokenListRow
      name={name}
      icon={<IconPlugConnected size={14} />}
      details={formatAccessSummary(token.access_scope)}
      nameColumnWidth={MCP_NAME_COLUMN_WIDTH}
      expiresAt={token.expires_at}
      actionsLabel={`Действия с токеном ${name}`}
      actions={[
        { label: 'Переименовать', onSelect: () => onRename(token) },
        { label: 'Отозвать', onSelect: () => onRevoke(token), danger: true },
      ]}
    />
  );
};
