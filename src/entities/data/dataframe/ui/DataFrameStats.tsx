import React from 'react';
import { Chip, Grid2 as Grid, Typography } from '@mui/material';

interface DataFrameStatsProps {
  totalRows: number;
  totalPartitions: number;
}

export const DataFrameStats: React.FC<DataFrameStatsProps> = ({
  totalRows,
  totalPartitions,
}) => {
  return (
    <Grid container>
      <Grid size={3}>
        <Typography variant='subtitle1'>Количество строк:</Typography>
      </Grid>
      <Grid size={9}>
        <Chip label={totalRows} size='small' />
      </Grid>
      <Grid size={3}>
        <Typography variant='subtitle1'>Количество партиций:</Typography>
      </Grid>
      <Grid size={9}>
        <Chip label={totalPartitions} size='small' />
      </Grid>
    </Grid>
  );
};
