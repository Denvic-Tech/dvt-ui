import { IconCube, IconSettings, IconTerminal2 } from '@tabler/icons-react';
import type { ElementType } from 'react';

const NAMESPACE_ICONS: Record<string, ElementType> = {
  dcc: IconCube,
  runtime: IconTerminal2,
};

export const getNamespaceIcon = (namespaceId: string): ElementType =>
  NAMESPACE_ICONS[namespaceId.toLocaleLowerCase()] ?? IconSettings;
