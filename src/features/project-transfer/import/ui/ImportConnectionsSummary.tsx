import React from 'react';
import { Box, type Theme } from '@mui/material';

import { getConnectionTypeLabel } from '@/entities/data/db-connection';

import type { ConnectionPreviewSchema } from '@/shared/gatewayClient';

import {
  type ConnectionDecisionState,
  DEFAULT_CONNECTION_DECISION,
} from '../../lib/importRequest';
import { getTransferTokens } from '../../ui/transferDialogStyles';
import type { ExistingConnectionOption } from '../model/connectionOptions';

import { ConnectionStatus, ConnectionTypeMark } from './connectionParts';

const VISIBLE_CONNECTIONS = 3;

const linkButtonSx = (theme: Theme) => {
  const t = getTransferTokens(theme);
  return {
    p: 0,
    border: 0,
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    color: t.accent,
    cursor: 'pointer',
    '&:hover:not(:disabled)': { color: t.accentHover },
    '&:disabled': { cursor: 'default', opacity: 0.6 },
  };
};

const getSummaryNote = (
  connections: ConnectionPreviewSchema[],
  decisions: Record<string, ConnectionDecisionState>
): { note: string; allNew: boolean } => {
  const count = (action: ConnectionDecisionState['action']) =>
    connections.filter(
      connection => decisions[connection.ref]?.action === action
    ).length;
  const created = count('create');
  if (created === connections.length) {
    return { note: 'Будут созданы в проекте', allNew: true };
  }
  const note = (
    [
      [created, 'новых'],
      [count('use_existing'), 'сопоставлено'],
      [count('skip'), 'пропущено'],
    ] as const
  )
    .filter(([value]) => value > 0)
    .map(([value, label]) => `${value} ${label}`)
    .join(' · ');
  return { note, allNew: false };
};

interface ImportConnectionsSummaryProps {
  connections: ConnectionPreviewSchema[];
  decisions: Record<string, ConnectionDecisionState>;
  optionsByRef: Record<string, ExistingConnectionOption[]>;
  disabled: boolean;
  onConfigure: () => void;
}

/** Блок «Подключения» на шаге настроек импорта. */
export const ImportConnectionsSummary: React.FC<
  ImportConnectionsSummaryProps
> = ({ connections, decisions, optionsByRef, disabled, onConfigure }) => {
  const { note, allNew } = getSummaryNote(connections, decisions);
  const hidden = connections.length - VISIBLE_CONNECTIONS;

  return (
    <Box data-testid='features/project-transfer/import-connections'>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          mb: '10px',
        }}
      >
        <Box
          component='span'
          sx={theme => ({
            fontSize: 13.5,
            fontWeight: 500,
            color: getTransferTokens(theme).text,
          })}
        >
          Подключения
        </Box>
        <Box
          component='span'
          data-testid='features/project-transfer/import-connections-note'
          sx={theme => ({
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: getTransferTokens(theme).text3,
          })}
        >
          {note}
        </Box>
        <Box
          component='button'
          type='button'
          disabled={disabled}
          onClick={onConfigure}
          data-testid='features/project-transfer/import-connections-configure'
          sx={linkButtonSx}
        >
          Настроить
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {connections.slice(0, VISIBLE_CONNECTIONS).map(connection => {
          const decision =
            decisions[connection.ref] ?? DEFAULT_CONNECTION_DECISION;
          const skipped = decision.action === 'skip';
          const targetName = decision.connectionId
            ? optionsByRef[connection.ref]?.find(
                option => option.id === decision.connectionId
              )?.name
            : undefined;
          return (
            <Box
              key={connection.ref}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: 34,
              }}
            >
              <ConnectionTypeMark type={connection.type} dim={skipped} />
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                }}
              >
                <Box
                  component='span'
                  sx={theme => {
                    const t = getTransferTokens(theme);
                    return {
                      fontSize: 13,
                      fontWeight: 500,
                      color: skipped ? t.text3 : t.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    };
                  }}
                >
                  {connection.name}
                </Box>
                <Box
                  component='span'
                  sx={theme => ({
                    fontSize: 12,
                    color: getTransferTokens(theme).text3,
                    flexShrink: 0,
                  })}
                >
                  {getConnectionTypeLabel(connection.type)}
                </Box>
              </Box>
              {allNew ? null : (
                <Box
                  component='span'
                  sx={{ display: 'flex', maxWidth: 170, minWidth: 0 }}
                >
                  <ConnectionStatus
                    decision={decision}
                    targetName={targetName}
                  />
                </Box>
              )}
            </Box>
          );
        })}

        {hidden > 0 ? (
          <Box
            component='button'
            type='button'
            disabled={disabled}
            onClick={onConfigure}
            sx={theme => ({
              ...linkButtonSx(theme),
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: 30,
              fontSize: 12.5,
              fontWeight: 400,
              color: getTransferTokens(theme).text3,
            })}
          >
            <Box
              component='span'
              sx={{ width: 26, textAlign: 'center', letterSpacing: '.1em' }}
            >
              ···
            </Box>
            <span>{`Ещё ${hidden}`}</span>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
