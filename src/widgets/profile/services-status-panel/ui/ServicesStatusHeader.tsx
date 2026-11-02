import React from 'react';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { Spinner } from '@/shared/ui';
import { PageToolbar } from '@/shared/ui/page-layout';

import {
  AutoReloadActionButton,
  AutoReloadDot,
  HeaderActions,
  RefreshActionButton,
  VersionBadge,
} from './styled.ts';

interface ServicesStatusHeaderProps {
  autoRefreshEnabled: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
  version?: string | null;
}

export const ServicesStatusHeader: React.FC<ServicesStatusHeaderProps> = ({
  autoRefreshEnabled,
  isLoading,
  onRefresh,
  onToggleAutoRefresh,
  version,
}) => {
  return (
    <PageToolbar justify={version ? 'space-between' : 'flex-end'}>
      {version ? (
        <VersionBadge>
          <Inventory2OutlinedIcon />
          {version}
        </VersionBadge>
      ) : null}
      <HeaderActions>
        <AutoReloadActionButton
          active={autoRefreshEnabled}
          onClick={onToggleAutoRefresh}
          size='sm'
          type='button'
          variant='outline'
        >
          <AutoReloadDot active={autoRefreshEnabled} />
          Автообновление
        </AutoReloadActionButton>
        <RefreshActionButton
          disabled={isLoading}
          onClick={onRefresh}
          size='sm'
          startIcon={
            isLoading ? (
              <Spinner color='inherit' size={13} />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          type='button'
          variant='outline'
        >
          Обновить
        </RefreshActionButton>
      </HeaderActions>
    </PageToolbar>
  );
};
