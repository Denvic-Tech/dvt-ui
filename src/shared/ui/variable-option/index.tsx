import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

import type { Io } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import { IoTypeChip } from '@/shared/ui/io/IoTypeChip';

type VariableOptionProps = {
  variable: VariableOutput;
};

export const VariableOption: React.FC<VariableOptionProps> = ({ variable }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        px: 0.25,
        py: 0.25,
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          component='span'
          sx={{
            fontSize: 12,
            lineHeight: 1.3,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 180,
          }}
          title={variable.name}
        >
          {variable.name}
        </Box>
        <IoTypeChip
          io={variable.type as unknown as Io}
          size='sm'
          variant='outlined'
        />
        {variable.isListType ? (
          <Chip
            size='small'
            variant='outlined'
            label='LIST'
            sx={{
              height: 20,
              '& .MuiChip-label': {
                px: 0.75,
                fontSize: 11,
                fontWeight: 700,
              },
            }}
          />
        ) : null}
        <Chip
          size='small'
          variant={variable.scope === 'system' ? 'outlined' : 'filled'}
          color={variable.scope === 'system' ? 'default' : 'primary'}
          label={variable.scope}
          sx={{
            height: 20,
            '& .MuiChip-label': {
              px: 0.75,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
            },
          }}
        />
      </Box>
      {variable.sourceLabel && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ lineHeight: 1.2, mt: 0.25 }}
        >
          {variable.sourceLabel}
        </Typography>
      )}
    </Box>
  );
};
