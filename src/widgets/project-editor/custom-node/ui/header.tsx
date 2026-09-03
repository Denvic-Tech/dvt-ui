import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { NodeIcon } from '@/entities/project-editor/node-library/ui/NodeLibraryList/styles';

import { EditableTypography } from '@/shared/ui';

interface CustomNodeHeaderProps {
  nodeID: string;
  displayName: string;
  onDisplayNameChange: (newName: string) => void;
  nodeEmoji?: string | null | undefined;
  nodeDescription?: string | null | undefined;
  matchesDisplayName?: boolean;
  matchesNodeID?: boolean;
}

const CustomNodeHeader_: React.FC<CustomNodeHeaderProps> = ({
  nodeID,
  displayName,
  onDisplayNameChange,
  nodeEmoji,
  nodeDescription,
  matchesDisplayName = false,
  matchesNodeID = false,
}) => {
  return (
    <Box
      sx={{
        p: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            width: '100%',
          }}
        >
          {nodeEmoji && (
            <NodeIcon style={{ marginTop: -2 }}>{nodeEmoji}</NodeIcon>
          )}
          <EditableTypography
            value={displayName}
            onChange={onDisplayNameChange}
            typographyVariant='subtitle2'
            showButton={false}
            containerSx={{
              width: '100%',
              justifyContent: 'center',
              maxWidth: '100%',
              minWidth: 0,
              borderRadius: 1,
              px: matchesDisplayName ? 0.75 : 0,
              py: matchesDisplayName ? 0.25 : 0,
              backgroundColor: theme =>
                matchesDisplayName
                  ? alpha(theme.palette.warning.main, 0.18)
                  : 'transparent',
            }}
            sx={{
              textAlign: 'center',
              fontWeight: 'medium',
              minWidth: 0,
            }}
            textFieldProps={{
              fullWidth: true,
              inputProps: {
                style: { textAlign: 'center', fontWeight: 'bold' },
              },
            }}
          />
        </Box>
      </Box>

      <Typography
        variant='body2'
        color='textSecondary'
        sx={theme => ({
          textAlign: 'center',
          pt: 1,
          display: 'inline-block',
          mx: 'auto',
          px: matchesNodeID ? 0.75 : 0,
          borderRadius: 1,
          backgroundColor: matchesNodeID
            ? alpha(theme.palette.warning.main, 0.18)
            : 'transparent',
        })}
      >
        ({nodeID})
      </Typography>

      {nodeDescription && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ textAlign: 'center', display: 'block' }}
        >
          {nodeDescription}
        </Typography>
      )}
    </Box>
  );
};

export const CustomNodeHeader = memo(CustomNodeHeader_);
