import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import type { PanelHeaderProps } from '../model/types';
import {
  HeaderActions,
  HeaderCopy,
  HeaderDescription,
  HeaderTitle,
  HeaderTop,
  NewUserButton,
  PanelHeader as PanelHeaderSection,
  RefreshButton,
} from './styles';

export const PanelHeader = ({
  onOpenCreate,
  onRefresh,
}: PanelHeaderProps) => (
  <PanelHeaderSection>
    <HeaderTop>
      <HeaderCopy>
        <HeaderTitle>Admin Panel</HeaderTitle>
        <HeaderDescription>
          Управление пользователями системы: создание, редактирование,
          блокировка и активация.
        </HeaderDescription>
      </HeaderCopy>

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
    </HeaderTop>
  </PanelHeaderSection>
);
