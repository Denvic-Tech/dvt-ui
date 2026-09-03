import ApartmentIcon from '@mui/icons-material/Apartment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DvrIcon from '@mui/icons-material/Dvr';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import TuneIcon from '@mui/icons-material/Tune';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import {
  type ProfileSectionConfig,
  type ProfileSectionGroupConfig,
} from './types.ts';

export const PROFILE_SECTION_PATHS = {
  schedule: '/profile/schedule',
  preferences: '/profile/preferences',
  apiKeys: '/profile/api-keys',
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
    icon: CalendarMonthIcon,
    group: 'general',
    require_roles: ['superadmin', 'admin'],
  },
  {
    to: PROFILE_SECTION_PATHS.preferences,
    label: 'Preferences',
    icon: TuneIcon,
    group: 'general',
  },
  {
    to: PROFILE_SECTION_PATHS.apiKeys,
    label: 'API Keys',
    icon: VpnKeyIcon,
    group: 'general',
  },
  {
    to: PROFILE_SECTION_PATHS.admin,
    label: 'Admin Panel',
    icon: SupervisorAccountIcon,
    group: 'admin',
    require_roles: ['admin', 'superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.organizations,
    label: 'Organizations',
    icon: ApartmentIcon,
    group: 'admin',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.services,
    label: 'Services Stats Panel',
    icon: DvrIcon,
    group: 'admin',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.extensions,
    label: 'Extensions',
    icon: ExtensionOutlinedIcon,
    group: 'system',
    require_roles: ['superadmin'],
  },
  {
    to: PROFILE_SECTION_PATHS.update,
    label: 'Обновление',
    icon: SystemUpdateAltRoundedIcon,
    group: 'system',
    require_roles: ['superadmin'],
  },
] as const satisfies readonly ProfileSectionConfig[];
