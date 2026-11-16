import { Box, Skeleton } from '@mui/material';
import dayjs from 'dayjs';

import { getRoleLabel, normalizeRole } from '@/entities/user';

import type {
  AdminUserReadSchema,
  OrganizationReadSchema,
} from '@/shared/gatewayClient';
import {
  type AvatarColors,
  getHashedAvatarColors,
} from '@/shared/lib/token/tokenAvatar';
import {
  TokenListCellText,
  TokenListGridRow,
  TokenListRowCell,
  TokenListRowMenu,
  TokenListRowTile,
} from '@/shared/ui/token-list';

import { UserEmail, UserNameLine, UserStatusText, YouBadge } from './styles';

const getRowColumns = (withOrganization: boolean) =>
  withOrganization
    ? 'minmax(0, 1fr) 170px 120px 130px 28px'
    : 'minmax(0, 1fr) 120px 130px 28px';

const AVATAR_PALETTE: readonly AvatarColors[] = [
  { background: '#EEF0FF', color: '#4343D6' },
  { background: '#FBEEE9', color: '#A84A2A' },
  { background: '#E8F3FB', color: '#005A9E' },
  { background: '#E9F6F1', color: '#1E7A5A' },
  { background: '#FFF4DB', color: '#8A5A00' },
  { background: '#F3F3F3', color: '#3A4152' },
];

const ROLE_STYLES = {
  superadmin: { color: '#4343D6', fontWeight: 600 },
  admin: { color: '#1B1F2A', fontWeight: 500 },
  user: { color: '#6B7385', fontWeight: 400 },
} as const;

const formatSignedUpAt = (value?: string | null) =>
  value && dayjs(value).isValid()
    ? dayjs(value).format('DD.MM.YYYY, HH:mm')
    : '—';

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
  user: AdminUserReadSchema;
  isSelf: boolean;
  // Superadmins see users of all organizations.
  showOrganization: boolean;
  organizations: OrganizationReadSchema[];
  isToggling: boolean;
  onEdit: (user: AdminUserReadSchema) => void;
  onToggleActive: (user: AdminUserReadSchema) => void;
  onToggleVerified: (user: AdminUserReadSchema) => void;
};

export const UserRow = ({
  user,
  isSelf,
  showOrganization,
  organizations,
  isToggling,
  onEdit,
  onToggleActive,
  onToggleVerified,
}: UserRowProps) => {
  const email = user.email || user.user_name || '—';
  const isActive = user.is_active ?? true;
  const isVerified = user.is_verified ?? false;
  const status = !isActive ? 'blocked' : isVerified ? null : 'unverified';
  const signedUpAt = formatSignedUpAt(user.signed_up_at);
  const avatarColors = getHashedAvatarColors(email, AVATAR_PALETTE);
  const role = normalizeRole(user.role);
  const roleStyle = role ? ROLE_STYLES[role] : ROLE_STYLES.user;

  return (
    <TokenListGridRow columns={getRowColumns(showOrganization)}>
      <TokenListRowCell>
        <TokenListRowTile
          aria-hidden
          sx={{ bgcolor: avatarColors.background, color: avatarColors.color }}
        >
          {email.charAt(0).toUpperCase()}
        </TokenListRowTile>
        <UserNameLine>
          <UserEmail title={status ? `Регистрация: ${signedUpAt}` : email}>
            {email}
          </UserEmail>
          {isSelf ? <YouBadge>Вы</YouBadge> : null}
        </UserNameLine>
      </TokenListRowCell>

      {showOrganization ? (
        <TokenListCellText>
          {getOrganizationName(organizations, user.organization_id)}
        </TokenListCellText>
      ) : null}

      <TokenListCellText sx={roleStyle}>
        {getRoleLabel(user.role)}
      </TokenListCellText>

      {status ? (
        <UserStatusText status={status}>
          {status === 'blocked' ? 'Заблокирован' : 'Не подтверждён'}
        </UserStatusText>
      ) : (
        <TokenListCellText>{signedUpAt}</TokenListCellText>
      )}

      <TokenListRowMenu
        label={`Действия с пользователем ${email}`}
        actions={[
          { label: 'Изменить', onSelect: () => onEdit(user) },
          {
            label: isVerified ? 'Снять верификацию' : 'Верифицировать',
            onSelect: () => onToggleVerified(user),
            disabled: isSelf || isToggling,
          },
          {
            label: isActive ? 'Заблокировать' : 'Разблокировать',
            onSelect: () => onToggleActive(user),
            danger: isActive,
            success: !isActive,
            disabled: isSelf || isToggling,
          },
        ]}
      />
    </TokenListGridRow>
  );
};

const Bone = ({ width, height }: { width: number; height: number }) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ flexShrink: 0, borderRadius: '6px', bgcolor: '#F1F3F8' }}
  />
);

// Repeats the geometry of UserRow, so the list does not shift on load.
export const UserRowSkeleton = ({
  emailWidth,
  showOrganization,
}: {
  emailWidth: number;
  showOrganization: boolean;
}) => (
  <TokenListGridRow aria-hidden columns={getRowColumns(showOrganization)}>
    <TokenListRowCell>
      <Skeleton
        variant='rounded'
        animation='wave'
        width={28}
        height={28}
        sx={{ flexShrink: 0, borderRadius: '8px', bgcolor: '#F1F3F8' }}
      />
      <Bone width={emailWidth} height={12} />
    </TokenListRowCell>
    {showOrganization ? <Bone width={112} height={10} /> : null}
    <Bone width={72} height={10} />
    <Bone width={104} height={10} />
    <Box />
  </TokenListGridRow>
);
