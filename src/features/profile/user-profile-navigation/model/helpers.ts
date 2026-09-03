import { normalizeRole } from '@/entities/user';

import {
  PROFILE_SECTION_PATHS,
  profileSectionGroups,
  profileSections,
} from './profileSections';
import {
  AnyRole,
  type ProfileNavigationRole,
  type ProfileSectionConfig,
  type ProfileSectionGroup,
} from './types';

export const canAccessProfileSection = (
  role: ProfileNavigationRole,
  section: ProfileSectionConfig
): boolean => {
  const requiredRoles = section.require_roles;

  if (
    requiredRoles == null ||
    requiredRoles.length === 0 ||
    requiredRoles.includes(AnyRole)
  ) {
    return true;
  }

  const normalizedRole = normalizeRole(role);

  return normalizedRole != null && requiredRoles.includes(normalizedRole);
};
export const getAvailableProfileSections = (
  role: ProfileNavigationRole
): ProfileSectionConfig[] => {
  return profileSections.filter(section =>
    canAccessProfileSection(role, section)
  );
};
export const getAvailableProfileSectionGroups = (
  role: ProfileNavigationRole
): ProfileSectionGroup[] => {
  const availableSections = getAvailableProfileSections(role);

  return profileSectionGroups
    .map(group => ({
      ...group,
      items: availableSections.filter(section => section.group === group.id),
    }))
    .filter(group => group.items.length > 0);
};
export const getProfileSectionByPath = (
  path: string
): ProfileSectionConfig | null => {
  return profileSections.find(section => section.to === path) ?? null;
};
export const canAccessProfilePath = (
  role: ProfileNavigationRole,
  path: string
): boolean => {
  if (
    path === PROFILE_SECTION_PATHS.appSettings ||
    path.startsWith(`${PROFILE_SECTION_PATHS.appSettings}/`) ||
    path === '/profile/app-config'
  ) {
    return normalizeRole(role) === 'superadmin';
  }

  const section = getProfileSectionByPath(path);

  return section != null && canAccessProfileSection(role, section);
};
