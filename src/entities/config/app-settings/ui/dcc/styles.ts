import { styled } from '@mui/material';

import { SettingsSaveRow } from '../settings-form/SettingsSaveRow';

export const DccFieldPair = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 12,
  '@media (max-width: 640px)': {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
});

export const DccSaveRow = styled(SettingsSaveRow)({ marginTop: 4 });
