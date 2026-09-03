import React, { useEffect } from 'react';
import { Chip, Skeleton } from '@mui/material';

import { useBuildVersion } from '../model/hook';

export const BuildVersionInfo: React.FC = () => {
  const { versionInfo, isLoading, loadBuildVersion } = useBuildVersion();

  useEffect(() => {
    if (!versionInfo && !isLoading) {
      loadBuildVersion();
    }
  }, [isLoading, loadBuildVersion, versionInfo]);

  if (!versionInfo || isLoading) {
    return <Skeleton variant='text' />;
  }

  return (
    <Chip
      size='small'
      title={versionInfo.version}
      label={versionInfo.version}
      sx={{ fontWeight: 600 }}
    />
  );
};
