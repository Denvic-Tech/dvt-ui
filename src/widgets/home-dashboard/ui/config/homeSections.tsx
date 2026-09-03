import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BookRoundedIcon from '@mui/icons-material/BookRounded';
import DatasetLinkedRoundedIcon from '@mui/icons-material/DatasetLinkedRounded';
import ElectricalServicesOutlinedIcon from '@mui/icons-material/ElectricalServicesOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { PROFILE_SECTION_PATHS } from '@/features/profile/user-profile-navigation';

import type { ProjectReadSchema } from '@/shared/gatewayClient';

import type { HomeSection } from '../types/home.ts';

type BuildHomeSectionsOptions = {
  canCreateProject: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  onCreateProject: () => void;
  recentProjects: ProjectReadSchema[];
  targetProjectsUrl: string;
};

export const buildHomeSections = ({
  canCreateProject,
  isAdmin,
  isSuperadmin,
  onCreateProject,
  recentProjects,
  targetProjectsUrl,
}: BuildHomeSectionsOptions): HomeSection[] => {
  const sections: HomeSection[] = [
    {
      description: 'Пайплайны, папки и шаблоны',
      icon: <DatasetLinkedRoundedIcon sx={{ fontSize: 22 }} />,
      id: 'projects',
      items: [
        {
          description: 'Полный список проектов и папок.',
          icon: <FolderOutlinedIcon sx={{ fontSize: 18 }} />,
          key: 'all-projects',
          label: 'Все проекты',
          to: targetProjectsUrl,
        },
        {
          description: canCreateProject
            ? 'Создать новый проект из общего workspace.'
            : 'Создание проекта временно недоступно.',
          disabled: !canCreateProject,
          icon: <AddRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'create-project',
          label: 'Создать проект',
          onClick: canCreateProject ? onCreateProject : undefined,
        },
        {
          description: recentProjects[0]
            ? `Открыть ${recentProjects[0].name} в редакторе.`
            : 'Появится после первого созданного проекта.',
          disabled: recentProjects.length === 0,
          icon: <HistoryRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'recent-project',
          label: 'Последний проект',
          to:
            recentProjects.length > 0
              ? `/project-editor/${recentProjects[0].id}`
              : undefined,
        },
      ],
      title: 'Проекты',
    },
    {
      description: 'Личные данные, ключи, безопасность',
      icon: <ManageAccountsRoundedIcon sx={{ fontSize: 22 }} />,
      id: 'profile',
      items: [
        {
          description: 'Личные настройки интерфейса и поведения приложения.',
          icon: <TuneRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'preferences',
          label: 'Preferences',
          to: PROFILE_SECTION_PATHS.preferences,
        },
        {
          description: 'Управление токенами и ключами интеграций.',
          icon: <KeyRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'api-keys',
          label: 'API Keys',
          to: PROFILE_SECTION_PATHS.apiKeys,
        },
        {
          description: isAdmin
            ? 'Панель расписаний и административные настройки.'
            : 'Раздел будет расширяться по мере роста workspace.',
          disabled: !isAdmin,
          icon: <SettingsOutlinedIcon sx={{ fontSize: 18 }} />,
          key: 'profile-admin',
          label: isAdmin ? 'Admin Panel' : 'Безопасность',
          to: isAdmin ? PROFILE_SECTION_PATHS.admin : undefined,
        },
      ],
      title: 'Профиль и доступ',
    },
    {
      description: 'Системные панели и контроль рабочей среды.',
      icon: <ShieldRoundedIcon sx={{ fontSize: 22 }} />,
      id: 'admin',
      items: [
        {
          description: 'Пользователи, роли и доступы команды.',
          icon: <SupervisorAccountOutlinedIcon sx={{ fontSize: 18 }} />,
          key: 'admin-panel',
          label: 'Admin Panel',
          to: PROFILE_SECTION_PATHS.admin,
        },
        {
          description: isSuperadmin
            ? 'Управление организациями и их составом.'
            : 'Раздел доступен только superadmin.',
          disabled: !isSuperadmin,
          icon: <ApartmentRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'organizations',
          label: 'Organizations',
          to: isSuperadmin ? PROFILE_SECTION_PATHS.organizations : undefined,
        },
        {
          description: isSuperadmin
            ? 'Статусы сервисов и runtime AppSettings.'
            : 'Системные панели доступны только superadmin.',
          disabled: !isSuperadmin,
          icon: <ElectricalServicesOutlinedIcon sx={{ fontSize: 18 }} />,
          key: 'services',
          label: 'Сервисная панель',
          to: isSuperadmin ? PROFILE_SECTION_PATHS.services : undefined,
        },
      ],
      title: 'Администрирование',
    },
    {
      description: 'Справка, гайды и материалы по платформе.',
      icon: <BookRoundedIcon sx={{ fontSize: 22 }} />,
      id: 'docs',
      items: [
        {
          description: 'Справочник узлов и параметров.',
          disabled: true,
          icon: <BookRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'nodes-docs',
          label: 'Справочник нод',
        },
        {
          description: 'Быстрые сценарии и onboarding-гайды.',
          disabled: true,
          icon: <PlayCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'guides',
          label: 'Гайды',
        },
        {
          description: 'Релиз-заметки и changelog платформы.',
          disabled: true,
          icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />,
          key: 'release-notes',
          label: 'Что нового',
        },
      ],
      title: 'Документация',
    },
  ];

  return isAdmin
    ? sections
    : sections.filter(section => section.id !== 'admin');
};
