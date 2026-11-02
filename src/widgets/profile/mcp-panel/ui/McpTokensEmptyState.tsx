import { Box, Typography } from '@mui/material';

type McpTokensEmptyStateProps = {
  onCreateToken: () => void;
};

export const McpTokensEmptyState = ({
  onCreateToken,
}: McpTokensEmptyStateProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      gap: 0.5,
      px: 3,
      py: 4,
      textAlign: 'center',
    }}
  >
    <Typography sx={{ color: '#6B7385', fontSize: 14, fontWeight: 500 }}>
      Токенов пока нет
    </Typography>
    <Typography sx={{ color: '#9AA0AD', fontSize: 13, lineHeight: '19px' }}>
      Подключите агента или{' '}
      <Box component='span' sx={{ whiteSpace: 'nowrap' }}>
        <Box
          component='button'
          type='button'
          onClick={onCreateToken}
          sx={{
            p: 0,
            border: 'none',
            bgcolor: 'transparent',
            color: '#4343D6',
            font: 'inherit',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 150ms ease',
            '&:hover': {
              color: '#2F2FB8',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            },
          }}
        >
          создайте токен
        </Box>{' '}
        вручную.
      </Box>
    </Typography>
  </Box>
);
