import { Box } from '@mui/material';

import {
  TokenListEmptyLink,
  TokenListEmptyState,
} from '@/shared/ui/token-list';

type McpTokensEmptyStateProps = {
  onCreateToken: () => void;
};

export const McpTokensEmptyState = ({
  onCreateToken,
}: McpTokensEmptyStateProps) => (
  <TokenListEmptyState title='Токенов пока нет'>
    Подключите MCP или{' '}
    <Box component='span' sx={{ whiteSpace: 'nowrap' }}>
      <TokenListEmptyLink type='button' onClick={onCreateToken}>
        создайте токен
      </TokenListEmptyLink>{' '}
      вручную.
    </Box>
  </TokenListEmptyState>
);
