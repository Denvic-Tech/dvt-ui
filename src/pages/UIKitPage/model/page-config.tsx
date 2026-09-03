/* eslint-disable react-refresh/only-export-components, simple-import-sort/imports */
import type { ComponentType } from 'react';
import { AppWindow, Boxes, Sparkles, type LucideIcon } from 'lucide-react';

import {
  ComponentsCodeTemplatesSection,
  ComponentsColumnsMetadataSection,
  ComponentsPageLead,
  ComponentsScalarInputsSection,
  ComponentsStructuredInputsSection,
} from '../ui/pages/ComponentsPage';
import {
  MoodboardFiltersSection,
  MoodboardOverlaysSection,
  MoodboardPageLead,
  MoodboardQueueSection,
  MoodboardReviewSection,
  MoodboardSummarySection,
} from '../ui/pages/MoodboardPage';
import {
  PrimitivesActionsSection,
  PrimitivesDataDisplaySection,
  PrimitivesFeedbackSection,
  PrimitivesFormsSection,
  PrimitivesOverlaysSection,
  PrimitivesPageLead,
} from '../ui/pages/PrimitivesPage';

export const UIKIT_PAGE_PATHS = {
  components: '/ui-kit/components',
  moodboard: '/ui-kit/moodboard',
  primitives: '/ui-kit/primitives',
} as const;

export type UIKitPageKey = keyof typeof UIKIT_PAGE_PATHS;

export interface UIKitPageSectionConfig {
  component: ComponentType;
  description?: string;
  id: string;
  label: string;
}

export interface UIKitPageConfig {
  disabled?: boolean;
  icon: LucideIcon;
  key: UIKitPageKey;
  label: string;
  lead?: ComponentType;
  sections: readonly UIKitPageSectionConfig[];
  to: (typeof UIKIT_PAGE_PATHS)[UIKitPageKey];
}

export const uikitPageConfigs: readonly UIKitPageConfig[] = [
  {
    key: 'moodboard',
    label: 'Moodboard',
    icon: Sparkles,
    lead: MoodboardPageLead,
    sections: [
      {
        id: 'overview',
        label: 'Overview',
        description: 'Ключевые метрики и рабочий контур.',
        component: MoodboardSummarySection,
      },
      {
        id: 'queue',
        label: 'Queue',
        description: 'Компактная очередь запусков.',
        component: MoodboardQueueSection,
      },
      {
        id: 'filters',
        label: 'Filters',
        description: 'Фильтры и форма оператора.',
        component: MoodboardFiltersSection,
      },
      {
        id: 'review',
        label: 'Review',
        description: 'Табличный review-контур.',
        component: MoodboardReviewSection,
      },
      {
        id: 'overlays',
        label: 'Overlays',
        description: 'Диалоги, панели и меню.',
        component: MoodboardOverlaysSection,
      },
    ],
    to: UIKIT_PAGE_PATHS.moodboard,
  },
  {
    key: 'primitives',
    label: 'Primitives',
    icon: Boxes,
    lead: PrimitivesPageLead,
    sections: [
      {
        id: 'actions',
        label: 'Actions',
        description: 'Кнопки и icon actions.',
        component: PrimitivesActionsSection,
      },
      {
        id: 'forms',
        label: 'Forms',
        description: 'Поля, селекты и toggle-контролы.',
        component: PrimitivesFormsSection,
      },
      {
        id: 'feedback',
        label: 'Feedback',
        description: 'Статусы и состояния загрузки.',
        component: PrimitivesFeedbackSection,
      },
      {
        id: 'overlays',
        label: 'Overlays',
        description: 'Меню, подсказки и layout helpers.',
        component: PrimitivesOverlaysSection,
      },
      {
        id: 'data-display',
        label: 'Data display',
        description: 'Карточки, аватары и таблицы.',
        component: PrimitivesDataDisplaySection,
      },
    ],
    to: UIKIT_PAGE_PATHS.primitives,
  },
  {
    key: 'components',
    label: 'Components',
    icon: AppWindow,
    lead: ComponentsPageLead,
    sections: [
      {
        id: 'scalar-inputs',
        label: 'Scalar inputs',
        description: 'Одиночные input-компоненты для node IO.',
        component: ComponentsScalarInputsSection,
      },
      {
        id: 'columns-metadata',
        label: 'Columns & metadata',
        description: 'Выбор колонок и metadata-aware контролы.',
        component: ComponentsColumnsMetadataSection,
      },
      {
        id: 'structured-inputs',
        label: 'Structured inputs',
        description: 'JSON и mapping-редакторы.',
        component: ComponentsStructuredInputsSection,
      },
      {
        id: 'code-templates',
        label: 'Code & templates',
        description: 'Monaco-редакторы и шаблоны.',
        component: ComponentsCodeTemplatesSection,
      },
    ],
    to: UIKIT_PAGE_PATHS.components,
  },
] as const;

export const defaultUIKitPage =
  uikitPageConfigs.find(page => !page.disabled) ?? uikitPageConfigs[0];
