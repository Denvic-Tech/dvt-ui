import React from 'react';
import { Storage as StorageIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import { Link } from 'lucide-react';

import {
  getConnectionTypeLabel,
  getConnectionTypeLogo,
  getConnectionTypeLogoScale,
} from '@/entities/data/db-connection';

import type { ConnectionDecisionState } from '../../lib/importRequest';
import { getTransferTokens } from '../../ui/transferDialogStyles';

interface ConnectionTypeMarkProps {
  type: string;
  dim?: boolean;
}

/** Логотип типа подключения 26×26 (иконки из `db-connection`). */
export const ConnectionTypeMark: React.FC<ConnectionTypeMarkProps> = ({
  type,
  dim = false,
}) => {
  const logo = getConnectionTypeLogo(type);
  const label = getConnectionTypeLabel(type);

  return (
    <Box
      component='span'
      title={label}
      sx={theme => {
        const t = getTransferTokens(theme);
        return {
          width: 26,
          height: 26,
          borderRadius: '7px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'transparent',
          color: t.text2,
          opacity: dim ? 0.45 : 1,
        };
      }}
    >
      {logo ? (
        <Box
          component='img'
          src={logo}
          alt={label}
          sx={{
            maxWidth: '68%',
            maxHeight: '68%',
            transform: `scale(${getConnectionTypeLogoScale(type)})`,
            transformOrigin: 'center',
          }}
        />
      ) : (
        <StorageIcon sx={{ fontSize: 15 }} />
      )}
    </Box>
  );
};

interface ConnectionStatusProps {
  decision: ConnectionDecisionState;
  /** Имя выбранного существующего подключения для `use_existing` */
  targetName: string | undefined;
}

/** Короткий статус решения по подключению. */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  decision,
  targetName,
}) => {
  if (decision.action === 'use_existing' && !decision.connectionId) {
    return (
      <Box
        component='span'
        sx={theme => ({
          fontSize: 12,
          color: getTransferTokens(theme).danger,
          flexShrink: 0,
        })}
      >
        Выберите подключение
      </Box>
    );
  }

  if (decision.action === 'use_existing') {
    return (
      <Box
        component='span'
        sx={theme => ({
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          minWidth: 0,
          fontSize: 12,
          color: getTransferTokens(theme).text2,
        })}
      >
        <Box
          component='span'
          sx={theme => ({
            display: 'flex',
            flexShrink: 0,
            color: getTransferTokens(theme).accent,
          })}
        >
          <Link size={12} strokeWidth={2} />
        </Box>
        <Box
          component='span'
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {targetName ?? 'Существующее подключение'}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component='span'
      sx={theme => ({
        fontSize: 12,
        color: getTransferTokens(theme).text3,
        flexShrink: 0,
      })}
    >
      {decision.action === 'create' ? 'Новое' : 'Пропущено'}
    </Box>
  );
};

/** Радио-кружок 16px из макета. */
export const RadioDot: React.FC<{ checked: boolean; disabled?: boolean }> = ({
  checked,
  disabled = false,
}) => (
  <Box
    component='span'
    aria-hidden
    sx={theme => {
      const t = getTransferTokens(theme);
      return {
        width: 16,
        height: 16,
        mt: '1px',
        borderRadius: '50%',
        flexShrink: 0,
        boxSizing: 'border-box',
        border: checked
          ? `5px solid ${t.accent}`
          : `1.5px solid ${t.borderStrong}`,
        background: '#fff',
        opacity: disabled ? 0.5 : 1,
        transition: 'border .12s',
      };
    }}
  />
);
