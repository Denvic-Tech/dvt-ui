import { useMemo, useSyncExternalStore } from 'react';

import type { NodeDefinition } from '@/shared/gatewayClient';

import type {
  NodeContentExtension,
  NodeContextMenuBuildContext,
  NodeContextMenuItem,
  NodeHeaderDescriptionExtension,
  NodeInputDefinitionExtension,
  NodeInputExtensionUsageContext,
  NodeModalExtension,
  NodeModalStepperExtension,
} from './lib/types.ts';
import { useNodeExtensionsRegistry } from './context';

const EMPTY_CONTENT_EXTENSIONS = Object.freeze(
  []
) as unknown as NodeContentExtension[];
const EMPTY_HEADER_DESCRIPTION_EXTENSIONS = Object.freeze(
  []
) as unknown as NodeHeaderDescriptionExtension[];
const EMPTY_MODAL_EXTENSIONS = Object.freeze(
  []
) as unknown as NodeModalExtension[];
const EMPTY_MENU_ITEMS = Object.freeze([]) as unknown as NodeContextMenuItem[];
const EMPTY_MODAL_STEPPER_EXTENSIONS = Object.freeze(
  []
) as unknown as NodeModalStepperExtension[];
const EMPTY_INPUT_DEFINITION_EXTENSIONS_MAP = new Map<
  string,
  NodeInputDefinitionExtension
>();

/** Вытянуть контент-расширения по позиции с live-подпиской на реестр. */
export function useNodeContentExtensions(
  position: 'node_content_top' | 'node_content_bottom',
  nodeDefinition: NodeDefinition | null | undefined
): NodeContentExtension[] {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  // useSyncExternalStore гарантирует корректный апдейт, если кто-то добавил/удалил расширения в рантайме.
  return useMemo(() => {
    if (!nodeDefinition) {
      return EMPTY_CONTENT_EXTENSIONS;
    }
    void version;
    return registry.getContentByPosition(position, nodeDefinition);
  }, [nodeDefinition, position, registry, version]);
}

export function useNodeHeaderDescriptionExtensions(
  nodeDefinition: NodeDefinition | null | undefined
): NodeHeaderDescriptionExtension[] {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!nodeDefinition) {
      return EMPTY_HEADER_DESCRIPTION_EXTENSIONS;
    }
    void version;
    return registry.getHeaderDescriptionExtensions(nodeDefinition);
  }, [nodeDefinition, registry, version]);
}

/** Вытянуть модальные расширения для nodeDefinition. */
export function useNodeModalExtensions(
  nodeDefinition: NodeDefinition | null | undefined
): NodeModalExtension[] {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!nodeDefinition) {
      return EMPTY_MODAL_EXTENSIONS;
    }
    void version;
    return registry.getModals(nodeDefinition);
  }, [nodeDefinition, registry, version]);
}

/** Вытянуть модальные степперы для nodeDefinition. */
export function useNodeModalStepperExtensions(
  nodeDefinition: NodeDefinition | null | undefined
): NodeModalStepperExtension[] {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!nodeDefinition) {
      return EMPTY_MODAL_STEPPER_EXTENSIONS;
    }
    void version;
    return registry.getModalSteppers(nodeDefinition);
  }, [nodeDefinition, registry, version]);
}

/** Вытянуть пункты контекстного меню по nodeDefinition и контексту. */
export function useNodeContextMenuItems(
  nodeDefinition: NodeDefinition | null | undefined,
  context: NodeContextMenuBuildContext | null
): NodeContextMenuItem[] {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!nodeDefinition || !context) {
      return EMPTY_MENU_ITEMS;
    }
    void version;
    return registry.getContextMenuItems(nodeDefinition, context);
  }, [context, nodeDefinition, registry, version]);
}

export function useNodeInputDefinitionExtensions(
  nodeDefinition: NodeDefinition | null | undefined,
  context: NodeInputExtensionUsageContext
): ReadonlyMap<string, NodeInputDefinitionExtension> {
  const registry = useNodeExtensionsRegistry();
  const version = useSyncExternalStore(registry.subscribe, registry.getVersion);

  return useMemo(() => {
    if (!nodeDefinition) {
      return EMPTY_INPUT_DEFINITION_EXTENSIONS_MAP;
    }
    void version;
    return registry.getInputDefinitionExtensionsMap(nodeDefinition, context);
  }, [context, nodeDefinition, registry, version]);
}
