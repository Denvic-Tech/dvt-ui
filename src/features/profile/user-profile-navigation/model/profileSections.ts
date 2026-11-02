import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconCalendarTime,
  IconCircleArrowUp,
  IconKey,
  IconLayoutSidebar,
  IconPlugConnected,
  IconPuzzle,
  IconUsers,
} from '@tabler/icons-react';

import {
  type ProfileSectionConfig,
  type ProfileSectionGroupConfig,
} from './types.ts';

export const PROFILE_SECTION_PATHS = {
  schedule: '/profile/schedule',
  preferences: '/profile/preferences',
  apiKeys: '/profile/api-keys',
  mcp: '/profile/mcp',
  admin: '/profile/admin',
  organizations: '/profile/organizations',
  services: '/profile/services',
  appSettings: '/profile/app-settings',
  extensions: '/profile/extensions',
  update: '/profile/update',
} as const;

export type ProfileSectionPath =
  (typeof PROFILE_SECTION_PATHS)[keyof typeof PROFILE_SECTION_PATHS];

export const profileSectionGroups = [
  {
    id: 'general',
    label: 'Основное',
  },
  {
    id: 'admin',
    label: 'Администрирование',
  },
  {
    id: 'settings',
    label: 'Настройки',
  },
  {
    id: 'system',
    label: 'Система',
  },
] as const satisfies readonly ProfileSectionGroupConfig[];

export const profileSections = [
  {
    to: PROFILE_SECTION_PATHS.schedule,
    label: 'Schedule Projects',
    icon: IconCalendarTime,
    group: 'general',
    require_roles: ['superadmin', 'admin'],
  },
  {
    to: PROFILE_SECTION_PATHS.preferences,
    label: 'Preferences',
    icon: IconAdjustmentsHorizontal,
    group: 'general',
  },
  {
    to: PROFILE_SECTION_PATHS.apiKeys,
    label: 'API Keys',
    icon: IconKey,
    group: 'general',
  },
  {
    to: PROFILE_SECTION_PATHS.mcp,
    label: 'MCP',
    icon: IconPlugConnected,
    group: 'general',
  },
  {
    to: PROFILE_SECTION_PATHS.admin,
    label: 'Admin Panel',
    icon: IconLayoutSidebar,
    group: 'admin',
    require_roles: ['admin', 'superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.organizations,
    label: 'Organizations',
    icon: IconUsers,
    group: 'admin',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.services,
    label: 'Services Stats Panel',
    icon: IconActivity,
    group: 'admin',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.extensions,
    label: 'Extensions',
    icon: IconPuzzle,
    group: 'system',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.update,
    label: 'Update',
    icon: IconCircleArrowUp,
    group: 'system',
    require_roles: ['superadmin'],
  },
] as const satisfies readonly ProfileSectionConfig[];
