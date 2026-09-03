import type { ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type Anchor = {
  vertical: 'top' | 'center' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
};

export const DEFAULT_ANCHOR: Anchor = { vertical: 'top', horizontal: 'right' };

// ——— Constants
export const MAX_VISIBLE = 5;
export const MAX_HISTORY = 50;
export const EXIT_ANIMATION_MS = 300;

export interface NotificationAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  onClick: () => void;
  closeOnClick?: boolean;
}

// ——— Notification (replaces Alert)
export interface Notification {
  id: string;
  type: AlertType;
  title: string;
  description?: string | undefined;
  detail?: string | undefined;
  group?: string | undefined;
  position?: Anchor | undefined;
  visible?: boolean | undefined;
  autoCloseDuration?: number | null | undefined; // null = no auto-close
  actions?: NotificationAction[] | undefined;
  icon?: ReactNode;
  paused: boolean;
  exiting: boolean;
  dismissed: boolean; // true if manually dismissed (won't appear in history)
  priority?: 0 | 1 | 2 | undefined;
  createdAt: number;
  lastBumpedAt: number;
}

/** @deprecated Use Notification */
export type Alert = Notification;

// ——— Create types
export interface NotificationCreate extends Omit<
  Notification,
  'id' | 'createdAt' | 'lastBumpedAt' | 'paused' | 'exiting' | 'dismissed'
> {}

/** Legacy create shape (accepts message, sticky, visibilityDuration) */
export interface LegacyAlertCreate {
  type: AlertType;
  message: string;
  group?: string;
  position?: Anchor;
  visible?: boolean;
  visibilityDuration?: number;
  sticky?: boolean;
  priority?: 0 | 1 | 2;
}

export type AlertCreate = NotificationCreate | LegacyAlertCreate;

export const isLegacyAlertCreate = (
  payload: AlertCreate
): payload is LegacyAlertCreate => {
  return 'message' in payload && !('title' in payload);
};

/**
 * Convert legacy AlertCreate (message-based) to NotificationCreate (title/description).
 * Parses **bold** pattern at the start of message as title.
 */
export const normalizeLegacyAlert = (
  legacy: LegacyAlertCreate
): NotificationCreate => {
  const boldMatch = legacy.message.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
  let title: string;
  let description: string | undefined;

  if (boldMatch) {
    title = boldMatch[1];
    description = boldMatch[2].trim() || undefined;
  } else {
    title = legacy.message;
    description = undefined;
  }

  let autoCloseDuration: number | null | undefined;
  if (legacy.sticky) {
    autoCloseDuration = null;
  } else if (legacy.visibilityDuration !== undefined) {
    autoCloseDuration = legacy.visibilityDuration;
  }

  return {
    type: legacy.type,
    title,
    ...(description !== undefined && { description }),
    ...(legacy.group !== undefined && { group: legacy.group }),
    ...(legacy.position !== undefined && { position: legacy.position }),
    ...(legacy.visible !== undefined && { visible: legacy.visible }),
    ...(autoCloseDuration !== undefined && { autoCloseDuration }),
    ...(legacy.priority !== undefined && { priority: legacy.priority }),
  };
};

// ——— Group
export interface AlertGroup {
  key: string;
  alertIDs: string[];
  lastTitle: string;
  lastDescription?: string | undefined;
  lastDetail?: string | undefined;
  lastActions?: NotificationAction[] | undefined;
  lastIcon?: ReactNode;
  type: AlertType;
  position: Anchor;
  visible: boolean;
  expanded: boolean;
  paused: boolean;
  exiting: boolean;
  count: number;
  lastBumpedAt: number;
}

// ——— State
export interface AlertsState {
  notificationsById: Record<string, Notification>;
  groupsByKey: Record<string, AlertGroup>;
  orderByPosition: Record<string, string[]>;
  history: string[]; // ring buffer of notification IDs
}

// ——— Default TTLs
export const defaultTTLs: Record<AlertType, number | null> = {
  error: 8000,
  warning: 6000,
  success: 4500,
  info: 4000,
};

// ——— Helpers
export const posKey = (a: Anchor = DEFAULT_ANCHOR) =>
  `${a.vertical}:${a.horizontal}`;

export const deriveGroupKey = (
  a: Pick<NotificationCreate, 'group' | 'type' | 'title'>
) => a.group ?? `${a.type}|${a.title.trim()}`;
