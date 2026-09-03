import AddRoundedIcon from '@mui/icons-material/AddRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

export type AccessKeysTab = 'api' | 'mcp';
export type AccessKeysStatusFilter = 'all' | 'active' | 'expired';

type AccessKeysPageLayoutProps = {
  activeTab: AccessKeysTab;
  apiKeyCount: number;
  mcpTokenCount: number;
  onTabChange: (tab: AccessKeysTab) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  createLabel: string;
  onCreate: () => void;
  children: React.ReactNode;
};

const tabLabel = (label: string, count: number) => (
  <Stack direction='row' alignItems='center' gap={0.75}>
    <span>{label}</span>
    <Box
      component='span'
      sx={{
        minWidth: 20,
        height: 20,
        px: 0.6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        bgcolor: 'action.hover',
        color: 'text.secondary',
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1,
        '.Mui-selected &': {
          bgcolor: 'rgba(99, 102, 241, 0.08)',
          color: 'primary.main',
        },
      }}
    >
      {count}
    </Box>
  </Stack>
);

export const AccessKeysPageLayout = ({
  activeTab,
  apiKeyCount,
  mcpTokenCount,
  onTabChange,
  searchValue,
  onSearchChange,
  createLabel,
  onCreate,
  children,
}: AccessKeysPageLayoutProps) => (
  <Box
    sx={{
      width: '100%',
      minHeight: '100%',
      p: { xs: 2, sm: 3 },
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: '18px',
    }}
  >
    <Box sx={{ width: '100%', maxWidth: 1180, mr: 'auto' }}>
      <Stack direction='row' alignItems='center' gap={1.5}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flex: '0 0 44px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '11px',
            bgcolor: 'rgba(99, 102, 241, 0.08)',
            color: 'primary.main',
          }}
        >
          <VpnKeyOutlinedIcon sx={{ fontSize: 21 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component='h1'
            sx={{
              color: 'text.primary',
              fontSize: { xs: 23, sm: 26 },
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
            }}
          >
            Ключи доступа
          </Typography>
          <Typography
            color='text.secondary'
            sx={{ mt: 0.35, maxWidth: 680, fontSize: 13, lineHeight: 1.25 }}
          >
            Персональные API-ключи для интеграций и MCP-токены для подключения
            ассистентов к DVT.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          mt: { xs: 2.25, sm: 2.75 },
          minHeight: 56,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'stretch', lg: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.25, lg: 2 },
          p: 0.9,
          pl: 1.1,
          border: 1,
          borderColor: 'divider',
          borderRadius: '14px',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_event, value: AccessKeysTab) => onTabChange(value)}
          aria-label='Тип ключей доступа'
          sx={{
            flexShrink: 0,
            minWidth: 0,
            minHeight: 38,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTabs-flexContainer': { gap: 0.5 },
            '& .MuiTab-root': {
              minWidth: 0,
              minHeight: 38,
              px: 1.35,
              py: 0.5,
              borderRadius: '10px',
              color: 'text.secondary',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab value='api' label={tabLabel('API-ключи', apiKeyCount)} />
          <Tab value='mcp' label={tabLabel('MCP-токены', mcpTokenCount)} />
        </Tabs>

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
    </Box>
  </Box>
);
