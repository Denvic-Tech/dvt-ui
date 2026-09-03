import type { ChipProps } from '@mui/material';

import type { DvtDefaultRoles } from '@/shared/gatewayClient';
import { zDvtDefaultRoles } from '@/shared/gatewayClient';

type GatewayRole = DvtDefaultRoles | string | null | undefined;

export const roleOptions = [...zDvtDefaultRoles.options] as DvtDefaultRoles[];

const adminAreaRoles = new Set<DvtDefaultRoles>(['superadmin', 'admin']);
const roleRankMap = new Map(
  roleOptions.map((role, index) => [role, roleOptions.length - index])
);

export const isKnownRole = (role: GatewayRole): role is DvtDefaultRoles => {
  return roleOptions.includes(role as DvtDefaultRoles);
};

export const normalizeRole = (role: GatewayRole): DvtDefaultRoles | null => {
  return isKnownRole(role) ? role : null;
};

export const isAdminAreaRole = (role: GatewayRole): boolean => {
  const normalizedRole = normalizeRole(role);

  return normalizedRole != null && adminAreaRoles.has(normalizedRole);
};

export const getRoleLabel = (role: GatewayRole): string => {
  switch (normalizeRole(role)) {
    case 'superadmin':
      return 'Superadmin';
    case 'admin':
      return 'Admin';
    case 'user':
      return 'User';
    default:
      return 'Unknown';
  }
};

export const getRoleChipColor = (
  role: GatewayRole
): NonNullable<ChipProps['color']> => {
  switch (normalizeRole(role)) {
    case 'superadmin':
      return 'primary';
    case 'admin':
      return 'info';
    case 'user':
      return 'default';
    default:
      return 'warning';
  }
};

export const compareRoles = (a: GatewayRole, b: GatewayRole): number => {
  const normalizedA = normalizeRole(a);
  const normalizedB = normalizeRole(b);
  const rankA = normalizedA == null ? -1 : (roleRankMap.get(normalizedA) ?? -1);
  const rankB = normalizedB == null ? -1 : (roleRankMap.get(normalizedB) ?? -1);

  return rankA - rankB;
};
