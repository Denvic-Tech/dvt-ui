import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';

import { NodeInputExtensionProps } from '@/app/providers/node-extensions';

import {
  ConnectionLogo,
  type DBConnectionRecord,
  formatConnectionIssueSummary,
  isBrokenConnection,
  useConnections,
} from '@/entities/data/db-connection';

import { getConstValue, makeConst } from '@/shared/lib/node-input-values';

export const ConnectionIDInput: React.FC<NodeInputExtensionProps> = ({
  nodeName,
  inputDefinition,
  value: currentConnectionId,
  onChange,
}) => {
  const { connections, loading, fetchConnections } = useConnections();
  const hasFetched = useRef(false);
  const selectedConnectionId = getConstValue(currentConnectionId);

  const applicableConnections = useMemo(
    () =>
      connections.filter(conn => {
        switch (inputDefinition.type) {
          case 'DB_CONNECTION_ID':
            return conn.kind === 'sql';
          case 'S3_CONNECTION_ID':
            return conn.type === 's3';
          case 'FTP_CONNECTION_ID':
            return conn.type === 'ftp';
          case 'SMB_CONNECTION_ID':
            return conn.type === 'smbprotocol';
          default:
            return false;
        }
      }),
    [connections, inputDefinition.type]
  );
  const selectedConnection = useMemo(
    () =>
      applicableConnections.find(
        connection => String(connection.id) === String(selectedConnectionId)
      ) ?? null,
    [applicableConnections, selectedConnectionId]
  );
  const selectedConnectionError =
    selectedConnection && isBrokenConnection(selectedConnection)
      ? `Broken: ${formatConnectionIssueSummary(selectedConnection)}`
      : null;

  useEffect(() => {
    if (connections.length === 0 && !loading && !hasFetched.current) {
      hasFetched.current = true;
      fetchConnections();
    }
  }, [connections.length, fetchConnections, loading]);

  const handleConnectionChange = useCallback(
    (conn: DBConnectionRecord | null) => {
      if (conn && isBrokenConnection(conn)) {
        return;
      }

      onChange(makeConst(conn?.id ?? null));
    },
    [onChange]
  );

  const getConnectionDisplayName = useCallback(
    (connection: DBConnectionRecord) => {
      if (connection.driver) {
        return `${connection.name} (${connection.type} / ${connection.driver})`;
      }

      return `${connection.name} (${connection.type})`;
    },
    []
  );

  return (
    <Box className='nodrag' sx={{ width: '100%' }}>
      {loading ? (
        <Typography variant='body2' color='text.secondary'>
          Загрузка подключений...
        </Typography>
      ) : connections.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          Нет доступных подключений
        </Typography>
      ) : (
        <>
          <Typography variant='body2' color='text.secondary'>
            Подключение
          </Typography>
          <Autocomplete<DBConnectionRecord>
            fullWidth
            options={applicableConnections}
            value={selectedConnection}
            onChange={(_e, newValue) => handleConnectionChange(newValue)}
            isOptionEqualToValue={(o, v) => String(o.id) === String(v.id)}
            getOptionDisabled={isBrokenConnection}
            getOptionLabel={getConnectionDisplayName}
            sx={{ minWidth: 280, mt: 1 }}
            renderInput={params => {
              const { InputLabelProps, ...restParams } = params;

              return (
                <TextField
                  {...restParams}
                  slotProps={{
                    htmlInput: {
                      ...restParams.inputProps,
                      'data-testid': `nodes/${nodeName}/inputs/${inputDefinition.attr_name}`,
                    },
                  }}
                  placeholder='Выберите подключение'
                  variant='outlined'
                  size='small'
                  error={Boolean(selectedConnectionError)}
                  helperText={selectedConnectionError}
                />
              );
            }}
            slotProps={{
              paper: {
                onPointerDown: (e: React.PointerEvent<HTMLElement>) =>
                  e.stopPropagation(),
                elevation: 1,
                sx: {
                  width: { xs: 'min(90vw, 700px)', sm: 560 },
                  mt: 0.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  overflow: 'hidden',
                },
              },
              listbox: {
                onWheel: (e: React.WheelEvent) => e.stopPropagation(),
                sx: t => ({
                  p: 1,
                  m: 0,
                  '& .MuiAutocomplete-option': {
                    alignItems: 'stretch',
                    p: 0,
                    '&.Mui-focused, &[aria-selected="true"], &:hover': {
                      backgroundColor: 'transparent !important',
                    },
                  },
                  '& .MuiAutocomplete-option.Mui-focused > .OptionCard': {
                    borderColor: t.palette.text.disabled,
                  },
                  '& .MuiAutocomplete-option[aria-selected="true"] > .OptionCard':
                    {
                      borderColor: t.palette.primary.main,
                    },
                }),
              },
            }}
            renderOption={(props, option) => {
              const label = getConnectionDisplayName(option);
              const optionBroken = isBrokenConnection(option);
              const brokenReason = optionBroken
                ? `Broken: ${formatConnectionIssueSummary(option)}`
                : null;

              return (
                <li
                  {...props}
                  key={String(option.id)}
                  data-testid={`nodes/${nodeName}/inputs/${inputDefinition.attr_name}/option`}
                  data-connection-id={String(option.id)}
                  data-connection-name={option.name}
                  data-connection-type={option.type}
                  title={label}
                  style={{ display: 'block' }}
                >
                  <Box
                    className='OptionCard'
                    sx={{
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.25,
                      px: 1.25,
                      py: 1,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition: 'border-color 120ms ease',
                      opacity: optionBroken ? 0.72 : 1,
                    }}
                  >
                    <ConnectionLogo type={option.type} label={option.name} />
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          variant='body2'
                          sx={{
                            whiteSpace: 'normal',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minWidth: 0,
                          }}
                        >
                          {label}
                        </Typography>
                        {optionBroken ? (
                          <Chip
                            label='Broken'
                            size='small'
                            color='error'
                            variant='outlined'
                            sx={{
                              height: 18,
                              flexShrink: 0,
                              '& .MuiChip-label': {
                                px: 0.75,
                                fontSize: 10,
                                fontWeight: 700,
                              },
                            }}
                          />
                        ) : null}
                      </Box>
                      {brokenReason ? (
                        <Typography
                          variant='caption'
                          color='error'
                          sx={{
                            display: 'block',
                            mt: 0.25,
                            lineHeight: 1.25,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {brokenReason}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                </li>
              );
            }}
          />
        </>
      )}
    </Box>
  );
};
