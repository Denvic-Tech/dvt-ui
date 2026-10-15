import { Box } from '@mui/material';
import type * as React from 'react';

import { HomeLoadError } from '../components/HomeLoadError';
import { homeFadeInSx } from '../styles/motion';

import { WidgetSkeleton, type WidgetSkeletonVariant } from './WidgetSkeleton';

type WidgetQueryState<TData> = {
  data?: TData | undefined;
  isError: boolean;
  refetch: () => unknown;
};

type WidgetQueryViewProps<TData> = {
  children: (data: TData) => React.ReactNode;
  query: WidgetQueryState<TData>;
  skeleton: WidgetSkeletonVariant;
};

/**
 * Loading → data → compact error for a widget body. Data from a previous
 * successful poll stays on screen when a later refetch fails.
 */
export const WidgetQueryView = <TData,>({
  children,
  query,
  skeleton,
}: WidgetQueryViewProps<TData>) => {
  if (query.data !== undefined) {
    return (
      <Box sx={{ ...homeFadeInSx, height: '100%' }}>{children(query.data)}</Box>
    );
  }

  if (query.isError) {
    return (
      <HomeLoadError
        compact
        title='Данные недоступны'
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }

  return <WidgetSkeleton variant={skeleton} />;
};
