import DataObjectIcon from '@mui/icons-material/DataObject';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import type { ReactNode } from 'react';
import { LuDatabase } from 'react-icons/lu';

import { AIAnalysisIcon } from '@/shared/ui';

/**
 * - `panel` (по умолчанию) — пункт переключает вкладку в выезжающей панели;
 * - `modal` — пункт сразу открывает модальное окно, панель не меняется.
 */
export type SidebarCategoryKind = 'panel' | 'modal';

interface SidebarCategoryItem {
  label: string;
  icon: ReactNode;
  kind?: SidebarCategoryKind;
}

export const categoryItems = {
  nodes: {
    label: 'Ноды',
    icon: <HubOutlinedIcon sx={{ fontSize: 20 }} />,
  },
  activeNodes: {
    label: 'Активные ноды',
    icon: <ViewListRoundedIcon sx={{ fontSize: 22 }} />,
  },
  dbConnections: {
    label: 'Подключения',
    icon: <LuDatabase size={20} />,
  },
  fileManager: {
    label: 'Файловый менеджер',
    icon: <FolderOpenOutlinedIcon sx={{ fontSize: 22 }} />,
  },
  dataCatalog: {
    label: 'Каталог данных',
    // inline style: рейл задаёт всем иконкам `& svg { fontSize: 22 }`, sx его не перебивает.
    icon: <ManageSearchIcon style={{ fontSize: 25 }} />,
    kind: 'modal',
  },
  queueTaskList: {
    label: 'Очередь задач',
    icon: <ListAltIcon sx={{ fontSize: 24 }} />,
  },
  projectSettings: {
    label: 'Настройки проекта',
    icon: <SettingsOutlinedIcon sx={{ fontSize: 24 }} />,
  },
  projectVariables: {
    label: 'Переменные проекта',
    icon: <DataObjectIcon sx={{ fontSize: 24 }} />,
  },
  aiAnalysis: {
    label: 'AI Анализ',
    icon: <AIAnalysisIcon sx={{ fontSize: 24 }} />,
  },
} satisfies Record<string, SidebarCategoryItem>;

export const getCategoryKind = (
  category: keyof typeof categoryItems
): SidebarCategoryKind =>
  (categoryItems[category] as SidebarCategoryItem).kind ?? 'panel';

/**
 * Вкладки, которые временно скрыты из рейла сайдбара. Код вкладок сохранён:
 * чтобы скрыть вкладку, добавьте её ключ сюда; чтобы показать — уберите.
 */
export const hiddenCategoryKeys: ReadonlySet<keyof typeof categoryItems> =
  new Set([]);
