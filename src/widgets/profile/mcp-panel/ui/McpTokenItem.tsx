import * as React from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconPlugConnected } from '@tabler/icons-react';

import type { McpTokenReadSchema } from '@/shared/gatewayClient';

import { formatAccessSummary } from '../lib/mcpTokenScope';
import { getTokenAvatarColors } from '../lib/tokenAvatar';
import { getTokenExpiry, type TokenExpiryTone } from '../lib/tokenExpiry';

import { headerIconButtonSx } from './styles';

const EXPIRY_STYLES: Record<
  TokenExpiryTone,
  { color: string; dot: string | null }
> = {
  normal: { color: '#6B7385', dot: null },
  soon: { color: '#8A5A00', dot: '#F5A524' },
  expired: { color: '#B42318', dot: '#E5484D' },
};

const NAME_COLUMN_WIDTH = 130;

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
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [isNameTruncated, setIsNameTruncated] = React.useState(false);
  const expiry = getTokenExpiry(token.expires_at);
  const expiryStyle = EXPIRY_STYLES[expiry.tone];
  const isExpired = expiry.tone === 'expired';
  const name = token.name ?? 'Без названия';
  const avatarColors = getTokenAvatarColors(name, isExpired);

  const closeMenu = () => setMenuAnchor(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        boxSizing: 'border-box',
        height: 48,
        flexShrink: 0,
        pl: 1.5,
        pr: 1,
        borderBottom: '1px solid #EEF0F4',
        bgcolor: '#fff',
        opacity: isExpired ? 0.6 : 1,
        transition: 'background-color 120ms ease',
        '&:hover': { bgcolor: '#F8F9FB' },
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 24,
          height: 24,
          flex: '0 0 24px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: '7px',
          bgcolor: avatarColors.background,
          color: avatarColors.color,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <IconPlugConnected size={14} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'baseline',
          gap: 1.25,
        }}
      >
        <Tooltip title={isNameTruncated ? name : ''} placement='top'>
          <Typography
            noWrap
            onMouseEnter={event =>
              setIsNameTruncated(
                event.currentTarget.scrollWidth >
                  event.currentTarget.clientWidth
              )
            }
            sx={{
              flex: `0 0 ${NAME_COLUMN_WIDTH}px`,
              color: isExpired ? '#6B7385' : '#1B1F2A',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {name}
          </Typography>
        </Tooltip>
        <Typography noWrap sx={{ minWidth: 0, color: '#6B7385', fontSize: 13 }}>
          {formatAccessSummary(token.access_scope)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.875,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {expiryStyle.dot ? (
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: expiryStyle.dot,
            }}
          />
        ) : null}
        <Typography sx={{ color: expiryStyle.color, fontSize: 13 }}>
          {expiry.label}
        </Typography>
      </Box>

      <IconButton
        disableRipple
        aria-label={`Действия с токеном ${name}`}
        onClick={event => setMenuAnchor(event.currentTarget)}
        sx={{ ...headerIconButtonSx, width: 28, height: 28 }}
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            minWidth: 176,
            mt: 0.5,
            p: 0.5,
            border: '1px solid #E3E7EF',
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(20, 24, 40, 0.12)',
          },
        }}
        MenuListProps={{ disablePadding: true }}
      >
        <MenuItem
          disableRipple
          onClick={() => {
            closeMenu();
            onRename(token);
          }}
          sx={{ minHeight: 34, borderRadius: '7px', fontSize: 14 }}
        >
          Переименовать
        </MenuItem>
        <Box
          role='separator'
          sx={{ height: '1px', m: '4px', bgcolor: '#EEF0F4' }}
        />
        <MenuItem
          disableRipple
          onClick={() => {
            closeMenu();
            onRevoke(token);
          }}
          sx={{
            minHeight: 34,
            borderRadius: '7px',
            color: '#B42318',
            fontSize: 14,
          }}
        >
          Отозвать
        </MenuItem>
      </Menu>
    </Box>
  );
};
