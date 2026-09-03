import type React from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types.ts';
import type { NodeMetadata } from '@/shared/gatewayClient';
import type { AnyDict } from '@/widgets/project-editor/node-data-modal/ui/types.ts';

export type ExtensionConnectedInputMetadata = NodeMetadata[string];

export type ExtensionEditorProps = NodeModalExtensionProps<AnyDict> & {
  nodeID: string;
  nodeName: string;
  extensionName: string;
  getConnectedInputMetadata: (
    inputName: string
  ) => ExtensionConnectedInputMetadata;
};

export type ExtensionRegistry = {
  editors?: Record<string, React.ComponentType<ExtensionEditorProps>>;
};

export type ExtensionFrontendMetadata = {
  extension_name: string;
  bundle_url: string;
  entrypoint: string;
  entry_file: string;
};

export const extensionFrontendRegistryCache = new Map<
  string,
  Promise<ExtensionRegistry>
>();

export type RegisterFunction = (
  host: any
) => ExtensionRegistry | Promise<ExtensionRegistry>;
