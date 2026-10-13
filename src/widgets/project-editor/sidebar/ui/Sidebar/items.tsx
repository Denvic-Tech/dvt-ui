import DataObjectIcon from '@mui/icons-material/DataObject';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import { LuDatabase } from 'react-icons/lu';

import { AIAnalysisIcon } from '@/shared/ui';

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
    icon: <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
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
};

/**
 * Вкладки, которые временно скрыты из рейла сайдбара. Код вкладок сохранён:
 * чтобы снова показать вкладку, достаточно убрать её ключ отсюда.
 * - `dataCatalog` — каталог данных ещё в разработке.
 */
export const hiddenCategoryKeys: ReadonlySet<keyof typeof categoryItems> =
  new Set(['dataCatalog']);
