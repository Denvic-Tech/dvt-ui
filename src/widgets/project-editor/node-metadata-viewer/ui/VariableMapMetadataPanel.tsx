import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { VariableMapMetadata } from '@/shared/gatewayClient';

import {
  MetadataPanelSurface,
  MetadataPill,
} from './components/MetadataPrimitives';

interface VariableMapMetadataPanelProps {
  metadata: VariableMapMetadata;
}

const renderScopePill = (
  variable: NonNullable<VariableMapMetadata['variables']>[number]
) => {
  const scopeTone = variable.var_type === 'system' ? 'warning' : 'success';
  return (
    <MetadataPill
      label={variable.var_type === 'system' ? 'system' : 'user'}
      tone={scopeTone}
    />
  );
};

const renderStatePill = (
  variable: NonNullable<VariableMapMetadata['variables']>[number]
) => {
  if (!variable.value_state) {
    return (
      <Typography color='text.secondary' sx={{ fontSize: 12.5 }}>
        —
      </Typography>
    );
  }

  return (
    <MetadataPill
      label={variable.value_state}
      tone={variable.value_state === 'resolved' ? 'success' : 'warning'}
    />
  );
};

export const VariableMapMetadataPanel = ({
  metadata,
}: VariableMapMetadataPanelProps) => {
  const variables = metadata.variables ?? [];

  return (
    <MetadataPanelSurface>
      {variables.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={theme => ({
            borderRadius: '20px',
            border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
            background:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.white, 0.78),
            overflow: 'hidden',
          })}
        >
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Область видимости</TableCell>
                <TableCell>Статус значения</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variables.map(variable => (
                <TableRow
                  key={`${variable.name}:${variable.type}:${variable.var_type ?? 'default'}`}
                  hover
                >
                  <TableCell
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {variable.name}
                  </TableCell>
                  <TableCell>
                    <Box display='inline-flex'>
                      <MetadataPill label={variable.type} tone='info' />
                    </Box>
                  </TableCell>
                  <TableCell>{renderScopePill(variable)}</TableCell>
                  <TableCell>{renderStatePill(variable)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography color='text.secondary' sx={{ fontSize: 13 }}>
          Backend не прислал список переменных для этого выхода.
        </Typography>
      )}
    </MetadataPanelSurface>
  );
};
