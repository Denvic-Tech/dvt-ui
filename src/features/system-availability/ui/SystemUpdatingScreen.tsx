import { Box, Typography } from '@mui/material';

interface SystemUpdatingScreenProps {
  reconnecting: boolean;
}

const orbitDotStyles = {
  borderRadius: '50%',
  content: '""',
  position: 'absolute',
} as const;

export const SystemUpdatingScreen = ({
  reconnecting,
}: SystemUpdatingScreenProps) => (
  <Box
    aria-live='polite'
    role='status'
    sx={{
      '@keyframes breathe': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.06)' },
      },
      '@keyframes cardUp': {
        from: { opacity: 0, transform: 'translateY(16px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      '@keyframes pulse': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.35, transform: 'scale(0.7)' },
      },
      '@keyframes ripple': {
        from: { opacity: 0.5, transform: 'scale(0.55)' },
        to: { opacity: 0, transform: 'scale(1)' },
      },
      '@keyframes spin': {
        to: { transform: 'rotate(360deg)' },
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& *, & *::before, & *::after': {
          animationDuration: '0.001ms !important',
          animationIterationCount: '1 !important',
        },
      },
      alignItems: 'center',
      background:
        'radial-gradient(1100px 640px at 50% 8%, #eef0ff 0%, #f7f7f9 58%)',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      overflow: 'hidden',
      p: 3,
      width: '100%',
    }}
  >
    <Box
      sx={{
        animation: 'cardUp 550ms cubic-bezier(.2,.7,.3,1)',
        bgcolor: '#ffffff',
        border: '1px solid #e9e9ee',
        borderRadius: '24px',
        boxShadow:
          '0 1px 2px rgba(22, 24, 46, 0.04), 0 30px 70px -34px rgba(50, 52, 92, 0.3)',
        maxWidth: '460px',
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Box
        aria-hidden='true'
        sx={{
          height: '168px',
          mb: '30px',
          mx: 'auto',
          position: 'relative',
          width: '168px',
        }}
      >
        {[0, 1, 2].map(delay => (
          <Box
            key={delay}
            sx={{
              animation: 'ripple 3s cubic-bezier(.2,.6,.3,1) infinite',
              animationDelay: `${delay}s`,
              border: '1.5px solid #6366f1',
              borderRadius: '50%',
              inset: 0,
              opacity: 0,
              position: 'absolute',
            }}
          />
        ))}

        <Box
          sx={{
            '&::after': {
              ...orbitDotStyles,
              bgcolor: '#22d3ee',
              bottom: '7px',
              boxShadow: '0 0 0 4px rgba(34, 211, 238, 0.16)',
              height: '11px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '11px',
            },
            '&::before': {
              ...orbitDotStyles,
              bgcolor: '#6366f1',
              boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.14)',
              height: '11px',
              left: '50%',
              top: '-6px',
              transform: 'translateX(-50%)',
              width: '11px',
            },
            animation: 'spin 14s linear infinite',
            border: '1.5px dashed #dcdcf5',
            borderRadius: '50%',
            inset: '14px',
            position: 'absolute',
          }}
        />

        <Box
          sx={{
            '&::after': {
              ...orbitDotStyles,
              bgcolor: '#8b7bff',
              boxShadow: '0 0 0 4px rgba(139, 123, 255, 0.14)',
              height: '8px',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
            },
            animation: 'spin 9s linear infinite reverse',
            border: '1.5px solid #ecebfb',
            borderRadius: '50%',
            inset: '38px',
            position: 'absolute',
          }}
        />

        <Box
          sx={{
            alignItems: 'center',
            animation: 'breathe 3s ease-in-out infinite',
            background: 'linear-gradient(135deg, #8b7bff, #6366f1)',
            borderRadius: '22px',
            boxShadow: '0 14px 30px -10px rgba(99, 102, 241, 0.65)',
            display: 'flex',
            inset: '52px',
            justifyContent: 'center',
            position: 'absolute',
          }}
        >
          <Box
            component='svg'
            fill='none'
            viewBox='0 0 24 24'
            sx={{
              animation: 'spin 2.4s cubic-bezier(.55,0,.45,1) infinite',
              color: '#ffffff',
              height: '34px',
              width: '34px',
            }}
          >
            <path
              d='M20 8a8 8 0 1 0 .8 6'
              stroke='currentColor'
              strokeLinecap='round'
              strokeWidth='1.8'
            />
            <polyline
              points='20 3 20 8 15 8'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='1.8'
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          alignItems: 'center',
          bgcolor: '#eef0ff',
          borderRadius: '999px',
          color: '#6366f1',
          display: 'inline-flex',
          fontSize: '12px',
          fontWeight: 600,
          gap: '7px',
          height: '28px',
          px: '12px',
        }}
      >
        <Box
          component='span'
          sx={{
            animation: 'pulse 1.4s ease-in-out infinite',
            bgcolor: '#6366f1',
            borderRadius: '50%',
            height: '6px',
            width: '6px',
          }}
        />
        {reconnecting ? 'Перезапуск сервисов' : 'Плановое обновление'}
      </Box>

      <Typography
        component='h1'
        sx={{
          color: '#202027',
          fontSize: '25px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          mt: '20px',
        }}
      >
        {reconnecting ? 'Восстанавливаем соединение' : 'Обновляем DVT'}
      </Typography>

      <Typography
        component='p'
        sx={{
          color: '#5b5b66',
          fontSize: '14.5px',
          lineHeight: 1.6,
          maxWidth: '36ch',
          mb: 0,
          mt: '12px',
          mx: 'auto',
        }}
      >
        {reconnecting
          ? 'Сервисы перезапускаются. Восстанавливаем соединение… Ничего делать не нужно, страница обновится автоматически.'
          : 'Сервис временно недоступен — мы устанавливаем новую версию. Ничего делать не нужно, страница обновится автоматически.'}
      </Typography>
    </Box>
  </Box>
);
