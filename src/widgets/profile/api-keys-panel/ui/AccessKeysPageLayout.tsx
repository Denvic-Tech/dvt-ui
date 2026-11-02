import AddRoundedIcon from '@mui/icons-material/AddRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IconKey } from '@tabler/icons-react';

import { PageLayout } from '@/shared/ui/page-layout';

type AccessKeysPageLayoutProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  createLabel: string;
  onCreate: () => void;
  children: React.ReactNode;
};

export const AccessKeysPageLayout = ({
  searchValue,
  onSearchChange,
  createLabel,
  onCreate,
  children,
}: AccessKeysPageLayoutProps) => (
  <PageLayout width='wide' title='API Keys' icon={IconKey}>
    <Box
      sx={{
        mb: 2,
        minHeight: 56,
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        alignItems: { xs: 'stretch', lg: 'center' },
        justifyContent: 'flex-end',
        gap: { xs: 1.25, lg: 2 },
        p: 0.9,
        pl: 1.1,
        border: 1,
        borderColor: 'divider',
        borderRadius: '14px',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems='stretch'
        justifyContent='flex-end'
        gap={1}
        sx={{ minWidth: 0 }}
      >
        <TextField
          size='small'
          value={searchValue}
          onChange={event => onSearchChange(event.target.value)}
          placeholder='Поиск по названию'
          inputProps={{ 'aria-label': 'Поиск по названию' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchRoundedIcon
                  sx={{ color: 'text.disabled', fontSize: 19 }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: '100%', sm: 230 },
            '& .MuiOutlinedInput-root': { height: 36, borderRadius: '9px' },
            '& input': { fontSize: 13 },
          }}
        />
        <Button
          variant='contained'
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={onCreate}
          sx={{
            minHeight: 36,
            px: 1.7,
            borderRadius: '9px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {createLabel}
        </Button>
      </Stack>
    </Box>

    {children}

    <Stack
      direction='row'
      alignItems='center'
      gap={0.85}
      sx={{ mt: 1.5, color: 'text.secondary' }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 15 }} />
      <Typography sx={{ fontSize: 12.5, lineHeight: 1.4 }}>
        Отозванный ключ перестаёт работать мгновенно, без возможности
        восстановления.
      </Typography>
    </Stack>
  </PageLayout>
);
