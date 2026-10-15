import type { SvgIconComponent } from '@mui/icons-material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

import { PROFILE_SECTION_PATHS } from '@/features/profile/user-profile-navigation';

export type HomeRole = 'user' | 'admin' | 'superadmin';

export type HomeSection = {
  group: string;
  icon: SvgIconComponent;
  id: string;
  label: string;
  /** Section is planned but has no screen yet. */
  soon?: boolean;
  to?: string;
};

type HomeSectionConfig = HomeSection & {
  roles?: readonly HomeRole[];
};

const ADMINS: readonly HomeRole[] = ['admin', 'superadmin'];
const SUPERADMINS: readonly HomeRole[] = ['superadmin'];

/** Declaration order is the default ranking before usage stats accumulate. */
const HOME_SECTIONS: readonly HomeSectionConfig[] = [
  {
    id: 'projects',
    label: 'Проекты',
    group: 'Работа',
    icon: GridViewRoundedIcon,
    to: '/projects',
  },
  {
    id: 'scheduler',
    label: 'Планировщик',
    group: 'Работа',
    icon: CalendarMonthOutlinedIcon,
    to: PROFILE_SECTION_PATHS.schedule,
    roles: ADMINS,
  },
  {
    id: 'api-keys',
    label: 'API-ключи',
    group: 'Профиль',
    icon: VpnKeyOutlinedIcon,
    to: PROFILE_SECTION_PATHS.apiKeys,
  },
  {
    id: 'preferences',
    label: 'Preferences',
    group: 'Профиль',
    icon: TuneRoundedIcon,
    to: PROFILE_SECTION_PATHS.preferences,
  },
  {
    id: 'connections',
    label: 'Подключения',
    group: 'Профиль',
    icon: PowerOutlinedIcon,
    soon: true,
  },
  {
    id: 'admin',
    label: 'Admin Panel',
    group: 'Администрирование',
    icon: GroupOutlinedIcon,
    to: PROFILE_SECTION_PATHS.admin,
    roles: ADMINS,
  },
  {
    id: 'services',
    label: 'Сервисная панель',
    group: 'Администрирование',
    icon: DnsOutlinedIcon,
    to: PROFILE_SECTION_PATHS.services,
    roles: SUPERADMINS,
  },
  {
    id: 'organizations',
    label: 'Организации',
    group: 'Администрирование',
    icon: ApartmentRoundedIcon,
    to: PROFILE_SECTION_PATHS.organizations,
    roles: SUPERADMINS,
  },
  {
    id: 'extensions',
    label: 'Расширения',
    group: 'Система',
    icon: ExtensionOutlinedIcon,
    to: PROFILE_SECTION_PATHS.extensions,
    roles: SUPERADMINS,
  },
  {
    id: 'update',
    label: 'Обновление',
    group: 'Система',
    icon: SystemUpdateAltRoundedIcon,
    to: PROFILE_SECTION_PATHS.update,
    roles: SUPERADMINS,
  },
  {
    id: 'nodes-docs',
    label: 'Справочник нод',
    group: 'Документация',
    icon: DescriptionOutlinedIcon,
    soon: true,
  },
  {
    id: 'release-notes',
    label: 'Что нового',
    group: 'Документация',
    icon: AutoAwesomeOutlinedIcon,
    soon: true,
  },
  {
    id: 'guides',
    label: 'Гайды',
    group: 'Документация',
    icon: PlayCircleOutlineRoundedIcon,
    soon: true,
  },
];

export const getHomeSections = (role: HomeRole | null): HomeSection[] =>
  HOME_SECTIONS.filter(
    section => !section.roles || (role != null && section.roles.includes(role))
  ).map(({ roles: _roles, ...section }) => section);

/** Available sections first, then by usage; ties keep declaration order. */
export const rankHomeSections = (
  sections: readonly HomeSection[],
  uses: Partial<Record<string, number>>
): HomeSection[] =>
  sections
    .map((section, index) => ({ index, section }))
    .sort(
      (left, right) =>
        Number(Boolean(left.section.soon)) -
          Number(Boolean(right.section.soon)) ||
        (uses[right.section.id] ?? 0) - (uses[left.section.id] ?? 0) ||
        left.index - right.index
    )
    .map(({ section }) => section);

export const groupHomeSections = (
  sections: readonly HomeSection[]
): { group: string; sections: HomeSection[] }[] => {
  const groups = new Map<string, HomeSection[]>();

  sections.forEach(section => {
    const items = groups.get(section.group) ?? [];
    items.push(section);
    groups.set(section.group, items);
  });

  return Array.from(groups, ([group, items]) => ({ group, sections: items }));
};
