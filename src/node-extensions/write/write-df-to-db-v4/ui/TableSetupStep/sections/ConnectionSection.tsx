import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import { Stack, Typography } from '@mui/material';

import {
  ConnectionInput,
  FieldGroup,
  FieldLabel,
  StatusBadge,
  StyledInput,
} from '../../styles';

import { StaticAccordionSection } from './StaticAccordionSection';

type ConnectionSectionProps = {
  connectionString?: string | null | undefined;
  isOpen: boolean;
  onToggle: () => void;
};

export const ConnectionSection: React.FC<ConnectionSectionProps> = ({
  connectionString,
  isOpen,
  onToggle,
}) => {
  return (
    <StaticAccordionSection
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<LinkIcon sx={{ fontSize: 18 }} />}
      title='Соединение'
      collapsedValue={connectionString ? 'Connected' : 'Not connected'}
    >
      <FieldGroup sx={{ mb: 0 }}>
        <FieldLabel>
          <Stack direction='row' alignItems='center' gap={0.5}>
            <LinkIcon sx={{ fontSize: 14 }} />
            Connection String
          </Stack>
        </FieldLabel>
        <ConnectionInput>
          <StyledInput
            type='text'
            value={connectionString || 'Нет метаданных...'}
            disabled
          />
        </ConnectionInput>
        <StatusBadge connected={Boolean(connectionString)} sx={{ mt: 1 }}>
          <CheckCircleIcon
            sx={{
              fontSize: 16,
              color: connectionString ? 'success.main' : 'warning.main',
            }}
          />
          <Typography
            variant='body2'
            sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
          >
            {connectionString ? 'Connected' : 'Not connected'}
          </Typography>
        </StatusBadge>
      </FieldGroup>
    </StaticAccordionSection>
  );
};
