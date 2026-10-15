import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';

import { PROFILE_SECTION_PATHS } from '@/features/profile/user-profile-navigation';

import type { HomeRole } from '../config/sections';

import { FailingProjectsWidget } from './FailingProjectsWidget';
import { Runs24hWidget } from './Runs24hWidget';
import { ScheduledRunsWidget } from './ScheduledRunsWidget';
import { ServicesWidget } from './ServicesWidget';
import type { HomeWidgetDefinition } from './types';

const ADMINS: readonly HomeRole[] = ['admin', 'superadmin'];
const SUPERADMINS: readonly HomeRole[] = ['superadmin'];

/**
 * All home widgets. Declaration order is the default order; with the default
 * set the sizes pack into three columns without holes.
 */
export const HOME_WIDGETS: readonly HomeWidgetDefinition[] = [
  {
    id: 'scheduled-runs',
    title: 'Ближайшие запуски',
    description: 'Ближайшие запуски и статус последнего',
    icon: CalendarMonthOutlinedIcon,
    size: { w: 1, h: 2 },
    roles: ADMINS,
    to: PROFILE_SECTION_PATHS.schedule,
    Body: ScheduledRunsWidget,
  },
  {
    id: 'failing-projects',
    title: 'Проблемные проекты',
    description: 'Проекты с ошибками запусков за 7 дней',
    icon: ErrorOutlineRoundedIcon,
    size: { w: 1, h: 2 },
    to: '/projects',
    Body: FailingProjectsWidget,
  },
  {
    id: 'runs-24h',
    title: 'Запуски за 24 ч',
    description: 'Пульс всех пайплайнов по часам',
    icon: InsightsRoundedIcon,
    size: { w: 1, h: 1 },
    Body: Runs24hWidget,
  },
  {
    id: 'services',
    title: 'Сервисы',
    description: 'Состояние runtime-сервисов и воркеров',
    icon: DnsOutlinedIcon,
    size: { w: 1, h: 1 },
    roles: SUPERADMINS,
    to: PROFILE_SECTION_PATHS.services,
    Body: ServicesWidget,
  },
];

export const getAvailableHomeWidgets = (
  role: HomeRole | null
): HomeWidgetDefinition[] =>
  HOME_WIDGETS.filter(
    widget => !widget.roles || (role != null && widget.roles.includes(role))
  );

/**
 * Saved order filtered to widgets the user can see; without a saved choice
 * every available widget is shown in the default order.
 */
export const resolveHomeWidgets = (
  savedIds: readonly string[] | undefined,
  available: readonly HomeWidgetDefinition[]
): HomeWidgetDefinition[] => {
  if (!savedIds) {
    return [...available];
  }

  const byId = new Map(available.map(widget => [widget.id as string, widget]));
  return Array.from(new Set(savedIds)).flatMap(id => {
    const widget = byId.get(id);
    return widget ? [widget] : [];
  });
};
