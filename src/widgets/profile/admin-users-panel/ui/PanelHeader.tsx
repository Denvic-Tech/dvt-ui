import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { PageToolbar } from '@/shared/ui/page-layout';

import type { PanelHeaderProps } from '../model/types';

import { HeaderActions, NewUserButton, RefreshButton } from './styles';

export const PanelHeader = ({ onOpenCreate, onRefresh }: PanelHeaderProps) => (
  <PageToolbar>
    <HeaderActions>
      <RefreshButton type='button' onClick={onRefresh}>
        <RefreshRoundedIcon />
        Refresh
      </RefreshButton>
      <NewUserButton type='button' onClick={onOpenCreate}>
        <AddRoundedIcon />
        New user
      </NewUserButton>
    </HeaderActions>
  </PageToolbar>
);
