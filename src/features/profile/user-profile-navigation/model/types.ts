import type { SvgIconComponent } from '@mui/icons-material';

import type { DvtDefaultRoles } from '@/shared/gatewayClient';

import type { ProfileSectionPath } from './profileSections.ts';

export const AnyRole = '*';

export type ProfileSectionRoleRequirement = DvtDefaultRoles | typeof AnyRole;
export type ProfileSectionGroupId = 'general' | 'admin' | 'settings' | 'system';

export type ProfileSectionGroupConfig = {
  id: ProfileSectionGroupId;
  label: string;
};

export type ProfileSectionConfig = {
  to: string;
  label: string;
  icon: SvgIconComponent;
  group: ProfileSectionGroupId;
  require_roles?: readonly ProfileSectionRoleRequirement[];
};

export type ProfileNavigationRole = DvtDefaultRoles | string | null | undefined;

export type ProfileSectionGroup = ProfileSectionGroupConfig & {
  items: ProfileSectionConfig[];
};
