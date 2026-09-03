import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import { CircularProgress, TableRow, Tooltip } from '@mui/material';

import { getRoleLabel, normalizeRole } from '@/entities/user';
import type {
  AdminUserReadSchema,
  OrganizationReadSchema,
} from '@/shared/gatewayClient';

import { formatDate } from '../model/helpers';
import type { UsersTableProps } from '../model/types';
import {
  ActionButton,
  ActionsBodyCell,
  ActionsCell,
  ActionsHeadCell,
  BodyCell,
  DateText,
  EmptyStateCell,
  HeadCell,
  HeaderSortLabel,
  LoadingState,
  LoadingText,
  OrganizationText,
  RoleBadge,
  StatusBadge,
  StatusBadgesContainer,
  StyledTable,
  StyledTableBody,
  StyledTableContainer,
  StyledTableHead,
  TableSection,
  UserAvatar,
  UserCell,
  UserEmail,
  UserEmailRow,
  UserInfo,
  UserUsername,
  YouBadge,
} from './styles';

const getAvatarLabel = (user: AdminUserReadSchema) => {
  const source = user.email || user.user_name || '?';

  return source.charAt(0).toUpperCase();
};

const getOrganizationName = (
  organizations: OrganizationReadSchema[],
  organizationId?: string | null
) => {
  if (!organizationId) {
    return '—';
  }

  const organization = organizations.find(item => item.id === organizationId);
  return organization?.name || '—';
};

type UserRowProps = {
  currentUserEmail: string | null;
  isSuperAdmin: boolean;
  isUpdating: boolean;
  onEdit: (user: AdminUserReadSchema) => void;
  onToggleActive: (user: AdminUserReadSchema) => void;
  organizations: OrganizationReadSchema[];
  updatingUserId: string | null;
  user: AdminUserReadSchema;
};

const UserRow = ({
  currentUserEmail,
  isSuperAdmin,
  isUpdating,
  onEdit,
  onToggleActive,
  organizations,
  updatingUserId,
  user,
}: UserRowProps) => {
  const isSelf = Boolean(currentUserEmail && currentUserEmail === user.email);
  const isActive = user.is_active ?? true;
  const isToggling = Boolean(isUpdating && updatingUserId === user.id);
  const roleVariant = normalizeRole(user.role) ?? 'unknown';

  return (
    <TableRow hover key={user.id ?? user.email} selected={isSelf}>
      <BodyCell>
        <UserCell>
          <UserAvatar>{getAvatarLabel(user)}</UserAvatar>
          <UserInfo>
            <UserEmailRow>
              <UserEmail>{user.email}</UserEmail>
              {isSelf ? <YouBadge>You</YouBadge> : null}
            </UserEmailRow>
            <UserUsername>{user.user_name || '—'}</UserUsername>
          </UserInfo>
        </UserCell>
      </BodyCell>

      {isSuperAdmin ? (
        <BodyCell>
          <OrganizationText>
            {getOrganizationName(organizations, user.organization_id)}
          </OrganizationText>
        </BodyCell>
      ) : null}

      <BodyCell>
        <StatusBadgesContainer>
          <StatusBadge
            badgeVariant={user.is_verified ? 'verified' : 'unverified'}
          >
            {user.is_verified ? 'Verified' : 'Unverified'}
          </StatusBadge>
          <StatusBadge badgeVariant={isActive ? 'active' : 'blocked'}>
            {isActive ? 'Active' : 'Blocked'}
          </StatusBadge>
        </StatusBadgesContainer>
      </BodyCell>

      <BodyCell>
        <RoleBadge roleVariant={roleVariant}>{getRoleLabel(user.role)}</RoleBadge>
      </BodyCell>

      <BodyCell>
        <DateText>{formatDate(user.signed_up_at)}</DateText>
      </BodyCell>

      <ActionsBodyCell>
        <ActionsCell>
          <Tooltip title='Редактировать пользователя'>
            <ActionButton
              type='button'
              actionVariant='default'
              onClick={() => onEdit(user)}
            >
              <EditIcon fontSize='small' />
            </ActionButton>
          </Tooltip>

          <Tooltip
            title={isActive ? 'Заблокировать пользователя' : 'Активировать пользователя'}
          >
            <span>
              <ActionButton
                type='button'
                actionVariant={isActive ? 'danger' : 'success'}
                onClick={() => onToggleActive(user)}
                disabled={isSelf || isToggling}
              >
                {isToggling ? (
                  <CircularProgress size={16} />
                ) : isActive ? (
                  <BlockIcon fontSize='small' />
                ) : (
                  <CheckCircleIcon fontSize='small' />
                )}
              </ActionButton>
            </span>
          </Tooltip>
        </ActionsCell>
      </ActionsBodyCell>
    </TableRow>
  );
};

export const UsersTable = ({
  currentUserEmail,
  isSuperAdmin,
  isUpdating,
  onEdit,
  onRequestSort,
  onToggleActive,
  organizations,
  sortBy,
  sortDir,
  updatingUserId,
  users,
  usersLoading,
}: UsersTableProps) => {
  const columnsCount = isSuperAdmin ? 6 : 5;

  return (
    <TableSection>
      <StyledTableContainer>
        <StyledTable stickyHeader>
          <StyledTableHead>
            <TableRow>
              <HeadCell sortDirection={sortBy === 'email' ? sortDir : false}>
                <HeaderSortLabel
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortDir : 'asc'}
                  onClick={() => onRequestSort('email')}
                >
                  Пользователь
                </HeaderSortLabel>
              </HeadCell>

              {isSuperAdmin ? <HeadCell>Организация</HeadCell> : null}

              <HeadCell>Статус</HeadCell>

              <HeadCell sortDirection={sortBy === 'role' ? sortDir : false}>
                <HeaderSortLabel
                  active={sortBy === 'role'}
                  direction={sortBy === 'role' ? sortDir : 'asc'}
                  onClick={() => onRequestSort('role')}
                >
                  Роль
                </HeaderSortLabel>
              </HeadCell>

              <HeadCell
                sortDirection={sortBy === 'signed_up_at' ? sortDir : false}
              >
                <HeaderSortLabel
                  active={sortBy === 'signed_up_at'}
                  direction={sortBy === 'signed_up_at' ? sortDir : 'asc'}
                  onClick={() => onRequestSort('signed_up_at')}
                >
                  Регистрация
                </HeaderSortLabel>
              </HeadCell>

              <ActionsHeadCell>Действия</ActionsHeadCell>
            </TableRow>
          </StyledTableHead>

          <StyledTableBody>
            {users.length > 0 ? (
              users.map(user => (
                <UserRow
                  key={user.id ?? user.email}
                  currentUserEmail={currentUserEmail}
                  isSuperAdmin={isSuperAdmin}
                  isUpdating={isUpdating}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  organizations={organizations}
                  updatingUserId={updatingUserId}
                  user={user}
                />
              ))
            ) : !usersLoading ? (
              <TableRow>
                <EmptyStateCell colSpan={columnsCount}>
                  Пользователи не найдены.
                </EmptyStateCell>
              </TableRow>
            ) : null}
          </StyledTableBody>
        </StyledTable>
      </StyledTableContainer>

      {usersLoading ? (
        <LoadingState>
          <CircularProgress size={18} />
          <LoadingText>Загрузка пользователей...</LoadingText>
        </LoadingState>
      ) : null}
    </TableSection>
  );
};
