import type { SvgIconComponent } from '@mui/icons-material';
import type * as React from 'react';

import type { HomeRole } from '../config/sections';
import type { WidgetSize } from '../lib/widgetLayout';

export type HomeWidgetId =
  | 'scheduled-runs'
  | 'failing-projects'
  | 'runs-24h'
  | 'services';

export type HomeWidgetDefinition = {
  /** Data view; each widget fetches its own route. */
  Body: React.ComponentType;
  /** Short explanation shown in the widget picker. */
  description: string;
  icon: SvgIconComponent;
  id: HomeWidgetId;
  /** Roles allowed to see the widget; omitted means everyone. */
  roles?: readonly HomeRole[];
  /** Fixed size in grid cells. */
  size: WidgetSize;
  title: string;
  /** Section opened by the «Открыть» link in the widget header. */
  to?: string;
};
