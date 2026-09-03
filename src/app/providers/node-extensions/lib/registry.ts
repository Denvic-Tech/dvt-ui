import {
  NodeContentExtension,
  NodeContextMenuExtension,
  NodeContextMenuItem,
  NodeContextMenuSubmenuItem,
  NodeExtension,
  NodeExtensionType,
  NodeHeaderDescriptionExtension,
  NodeInputDefinitionExtension,
  NodeInputExtensionUsageContext,
  NodeLevelExtension,
  NodeModalExtension,
  NodeModalStepperExtension,
} from './types.ts';

type Unsubscribe = () => void;

function isContent(ext: NodeExtension): ext is NodeContentExtension {
  return ext.type === 'node_content_top' || ext.type === 'node_content_bottom';
}

function isModal(ext: NodeExtension): ext is NodeModalExtension {
  return ext.type === 'modal';
}

function isModalStepper(ext: NodeExtension): ext is NodeModalStepperExtension {
  return ext.type === 'modal_stepper';
}

function isContextMenu(ext: NodeExtension): ext is NodeContextMenuExtension {
  return ext.type === 'context_menu';
}

function isInputDefinition(
  ext: NodeExtension
): ext is NodeInputDefinitionExtension {
  return ext.type === 'input_definition';
}

function isNodeLevelExtension(ext: NodeExtension): ext is NodeLevelExtension {
  return ext.type !== 'input_definition';
}

function hasHeaderDescription(
  ext: NodeLevelExtension
): ext is NodeHeaderDescriptionExtension {
  return typeof ext.getHeaderDescription === 'function';
}

const sortByOrder = <T extends { order?: number | undefined }>(
  items: T[]
): T[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = a.item.order ?? Number.POSITIVE_INFINITY;
      const orderB = b.item.order ?? Number.POSITIVE_INFINITY;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.index - b.index;
    })
    .map(({ item }) => item);

const sortMenuItems = (items: NodeContextMenuItem[]): NodeContextMenuItem[] => {
  const normalized = items.map(item => {
    if (item.type === 'submenu') {
      return {
        ...item,
        items: sortMenuItems(item.items),
      } as NodeContextMenuSubmenuItem;
    }
    return item;
  });

  return sortByOrder<NodeContextMenuItem>(normalized);
};

/** Реестр расширений нод (контент + модалки). */
export class NodeExtensionsRegistry {
  private extensions = new Map<NodeExtensionType, Map<string, NodeExtension>>();
  private subs = new Set<() => void>();
  private version = 0;

  /** Подписка (используется в провайдере для useSyncExternalStore). */
  subscribe = (fn: () => void): Unsubscribe => {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  };

  getVersion = () => this.version;

  private emit() {
    this.version += 1;
    for (const fn of this.subs) fn();
  }

  private ensureBucket(type: NodeExtensionType) {
    let bucket = this.extensions.get(type);
    if (!bucket) {
      bucket = new Map<string, NodeExtension>();
      this.extensions.set(type, bucket);
    }
    return bucket;
  }

  /** Зарегистрировать одно или несколько расширений. Возвращает unreg. */
  register = (...exts: NodeExtension[]): Unsubscribe => {
    const registered: Array<{ type: NodeExtensionType; id: string }> = [];

    exts.forEach(ext => {
      const bucket = this.ensureBucket(ext.type);
      bucket.set(ext.id, ext);
      registered.push({ type: ext.type, id: ext.id });
    });

    this.emit();

    return () => {
      let changed = false;

      for (const { type, id } of registered) {
        const bucket = this.extensions.get(type);
        if (!bucket) continue;
        if (bucket.delete(id)) {
          changed = true;
          if (bucket.size === 0) {
            this.extensions.delete(type);
          }
        }
      }

      if (changed) {
        this.emit();
      }
    };
  };

  /** Получить расширения (можно ограничить типом). */
  list(type?: NodeExtensionType): NodeExtension[] {
    if (type) {
      const bucket = this.extensions.get(type);
      return bucket ? Array.from(bucket.values()) : [];
    }

    const result: NodeExtension[] = [];
    for (const bucket of this.extensions.values()) {
      result.push(...bucket.values());
    }
    return result;
  }

  /** Контент-расширения по позиции и условию (nodeDefinition). */
  getContentByPosition(
    position: 'node_content_top' | 'node_content_bottom',
    nodeDefinition: Parameters<NodeContentExtension['condition']>[0]
  ): NodeContentExtension[] {
    return this.list(position)
      .filter(isContent)
      .filter(ext => ext.type === position && ext.condition(nodeDefinition));
  }

  getHeaderDescriptionExtensions(
    nodeDefinition: Parameters<NodeContentExtension['condition']>[0]
  ): NodeHeaderDescriptionExtension[] {
    return sortByOrder<NodeHeaderDescriptionExtension>(
      this.list()
        .filter(isNodeLevelExtension)
        .filter(ext => ext.condition(nodeDefinition))
        .filter(hasHeaderDescription)
    );
  }

  /** Модальные расширения по условию (nodeDefinition). */
  getModals(
    nodeDefinition: Parameters<NodeModalExtension['condition']>[0]
  ): NodeModalExtension[] {
    return this.list('modal')
      .filter(isModal)
      .filter(ext => ext.condition(nodeDefinition));
  }

  /** Модальные расширения-степперы по условию (nodeDefinition). */
  getModalSteppers(
    nodeDefinition: Parameters<NodeModalStepperExtension['condition']>[0]
  ): NodeModalStepperExtension[] {
    return this.list('modal_stepper')
      .filter(isModalStepper)
      .filter(ext => ext.condition(nodeDefinition));
  }

  /** Возвращает расширения контекстного меню, удовлетворяющие условию. */
  getContextMenuExtensions(
    nodeDefinition: Parameters<NodeContentExtension['condition']>[0]
  ): NodeContextMenuExtension[] {
    return this.list('context_menu')
      .filter(isContextMenu)
      .filter(ext => ext.condition(nodeDefinition));
  }

  /** Собирает пункты контекстного меню от всех расширений. */
  getContextMenuItems(
    nodeDefinition: Parameters<NodeContentExtension['condition']>[0],
    context: Parameters<NodeContextMenuExtension['getItems']>[0]
  ): NodeContextMenuItem[] {
    const extensions = this.getContextMenuExtensions(nodeDefinition);
    const items = extensions.flatMap(extension => extension.getItems(context));
    return sortMenuItems(items);
  }

  private getInputDefinitionExtensionsForContext(
    context: NodeInputExtensionUsageContext
  ): NodeInputDefinitionExtension[] {
    const allowedCondition: (ext: NodeInputDefinitionExtension) => boolean =
      context === 'modal'
        ? ext => ext.allowInModal !== false
        : ext => ext.allowInNode !== false;

    return sortByOrder<NodeInputDefinitionExtension>(
      this.list('input_definition')
        .filter(isInputDefinition)
        .filter(allowedCondition)
    );
  }

  getInputDefinitionExtensionsMap(
    nodeDefinition: Parameters<NodeContentExtension['condition']>[0],
    context: NodeInputExtensionUsageContext
  ): Map<string, NodeInputDefinitionExtension> {
    const result = new Map<string, NodeInputDefinitionExtension>();

    const inputDefinitions = Object.values(
      nodeDefinition.input_definitions ?? {}
    );
    if (inputDefinitions.length === 0) {
      return result;
    }

    const extensions = this.getInputDefinitionExtensionsForContext(context);
    if (extensions.length === 0) {
      return result;
    }

    for (const inputDefinition of inputDefinitions) {
      for (const extension of extensions) {
        if (
          extension.condition({
            nodeDefinition,
            inputDefinition,
          })
        ) {
          result.set(inputDefinition.attr_name, extension);
          break;
        }
      }
    }

    return result;
  }

  /** Полезно в тестах: очистка. */
  clearAll() {
    this.extensions.clear();
    this.emit();
  }
}

export type { Unsubscribe };
