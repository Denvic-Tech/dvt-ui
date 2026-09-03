import React, { memo } from 'react';
import { Key as KeyIcon } from '@mui/icons-material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Box, Checkbox, Stack, Tooltip, Typography } from '@mui/material';

import type { Column } from '@/shared/gatewayClient';

import { getColumnBaseType } from './columnSelectUtils';
import { ColumnTypeBadge } from './ColumnTypeBadge';

interface ColumnOptionRowProps {
  column?: Column;
  selected?: boolean;
  indeterminate?: boolean;
  checkbox?: boolean;
  label?: string;
}

export const ColumnOptionRow: React.FC<ColumnOptionRowProps> = memo(
  ({
    column,
    selected = false,
    indeterminate = false,
    checkbox = false,
    label,
  }) => {
    const dtype = column?.dtype != null ? String(column.dtype) : null;
    const normalizedDtype = dtype?.replace(/^DataType\./i, '') ?? null;
    const typeLabel = normalizedDtype
      ? ({
          INT: 'Int',
          FLOAT: 'Float',
          STRING: 'String',
          BOOLEAN: 'Bool',
          DATETIME: 'DateTime',
          TIMEDELTA: 'TimeDelta',
          CATEGORY: 'Category',
          DICTIONARY: 'Dictionary',
          OBJECT: 'Object',
          UNKNOWN: 'Unknown',
        }[normalizedDtype.toUpperCase()] ?? normalizedDtype)
      : null;

    return (
      <Stack
        direction='row'
        alignItems='center'
        spacing={0.75}
        sx={{ minWidth: 0, width: '100%' }}
      >
        {checkbox && (
          <Checkbox
            checked={selected}
            indeterminate={indeterminate}
            size='small'
            disableRipple
            icon={
              <Stack
                sx={theme => ({
                  width: 16,
                  height: 16,
                  borderRadius: '5px',
                  border: `1px solid ${theme.palette.grey[400]}`,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: 'none',
                })}
              />
            }
            checkedIcon={
              <Stack
                sx={theme => ({
                  width: 16,
                  height: 16,
                  borderRadius: '5px',
                  border: `1px solid ${theme.palette.primary.main}`,
                  bgcolor: theme.palette.primary.main,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                })}
              >
                <CheckRoundedIcon
                  sx={theme => ({
                    fontSize: 14,
                    color: theme.palette.common.white,
                  })}
                />
              </Stack>
            }
            indeterminateIcon={
              <Stack
                sx={theme => ({
                  width: 16,
                  height: 16,
                  borderRadius: '5px',
                  border: `1px solid ${theme.palette.primary.main}`,
                  bgcolor: theme.palette.primary.main,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                })}
              >
                <Box
                  sx={theme => ({
                    width: 8,
                    height: 2,
                    borderRadius: 1,
                    bgcolor: theme.palette.common.white,
                  })}
                />
              </Stack>
            }
            sx={{
              p: 0,
              mr: 0.5,
              boxShadow: 'none',
              pointerEvents: 'none',
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          />
        )}

        <Typography
          title={column?.name ?? label}
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            color: label ? 'text.secondary' : 'text.primary',
            fontFamily: label
              ? 'inherit'
              : '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: label ? '0.6875rem' : '0.75rem',
            fontWeight: label ? 700 : 500,
            letterSpacing: label ? '0.01em' : 0,
            textTransform: label ? 'uppercase' : 'none',
          }}
        >
          {column?.name ?? label}
        </Typography>

        {column?.index ? (
          <Tooltip title='Индекс'>
            <KeyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          </Tooltip>
        ) : null}

        {column?.nullable ? (
          <Typography
            component='span'
            sx={{
              color: 'text.disabled',
              fontFamily:
                '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.5625rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            NULL
          </Typography>
        ) : null}

        {typeLabel ? (
          <ColumnTypeBadge colorType={getColumnBaseType(normalizedDtype)}>
            {typeLabel}
          </ColumnTypeBadge>
        ) : null}
      </Stack>
    );
  }
);

ColumnOptionRow.displayName = 'ColumnOptionRow';
