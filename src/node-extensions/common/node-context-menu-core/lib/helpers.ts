import type { ReactNode } from 'react';
import type { NodeDefinition } from '@/shared/gatewayClient';
import type {
  NodeContextMenuBuildContext,
  NodeContextMenuToggleItem,
} from '@/app/providers/node-extensions';

export const resolveStoreEnabled = (value: unknown, defaultValue: unknown) =>
  Boolean(value ?? defaultValue ?? false);

export const canUseClipboard = () =>
  typeof navigator !== 'undefined' && !!navigator.clipboard;

export const getStoreEnabledDefault = (
  nodeDefinition: NodeDefinition | null | undefined
) =>
  nodeDefinition?.input_definitions?.['store_enabled']?.default;

type BooleanToggleItemConfig = {
  id: string;
  label: string;
  checked: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
  order?: number;
  onToggle: (
    context: NodeContextMenuBuildContext,
    nextChecked: boolean
  ) => void | Promise<void>;
};

export const buildBooleanToggleItem = ({
  id,
  label,
  checked,
  icon,
  disabled,
  tooltip,
  order,
  onToggle,
}: BooleanToggleItemConfig): NodeContextMenuToggleItem => ({
  id,
  type: 'toggle',
  label,
  checked,
  icon,
  disabled,
  tooltip,
  order,
  onToggle,
});
