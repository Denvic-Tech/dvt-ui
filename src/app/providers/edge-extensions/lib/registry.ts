import {
  EdgeContextMenuExtension,
  EdgeContextMenuItem,
  EdgeExtension,
  EdgeExtensionType,
} from './types.ts';

type Unsubscribe = () => void;

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

const sortMenuItems = (
  items: EdgeContextMenuItem[]
): EdgeContextMenuItem[] =>
  sortByOrder(
    items.map(item => {
      if (item.type === 'submenu' && item.items) {
        return {
          ...item,
          items: sortMenuItems(item.items),
        };
      }
      return item;
    })
  );

export class EdgeExtensionsRegistry {
  private extensions = new Map<EdgeExtensionType, Map<string, EdgeExtension>>();
  private subs = new Set<() => void>();
  private version = 0;

  subscribe = (fn: () => void): Unsubscribe => {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  };

  getVersion = () => this.version;

  private emit() {
    this.version += 1;
    for (const fn of this.subs) fn();
  }

  private ensureBucket(type: EdgeExtensionType) {
    let bucket = this.extensions.get(type);
    if (!bucket) {
      bucket = new Map<string, EdgeExtension>();
      this.extensions.set(type, bucket);
    }
    return bucket;
  }

  register = (...exts: EdgeExtension[]): Unsubscribe => {
    const registered: Array<{ type: EdgeExtensionType; id: string }> = [];
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

  list(type?: EdgeExtensionType): EdgeExtension[] {
    if (type) {
      const bucket = this.extensions.get(type);
      return bucket ? Array.from(bucket.values()) : [];
    }

    const result: EdgeExtension[] = [];
    for (const bucket of this.extensions.values()) {
      result.push(...bucket.values());
    }
    return result;
  }

  getContextMenuExtensions(): EdgeContextMenuExtension[] {
    return this.list('context_menu') as EdgeContextMenuExtension[];
  }

  getContextMenuItems(
    edge: Parameters<EdgeContextMenuExtension['condition']>[0],
    context: Parameters<EdgeContextMenuExtension['getItems']>[0]
  ): EdgeContextMenuItem[] {
    const extensions = this.getContextMenuExtensions().filter(ext =>
      ext.condition(edge)
    );
    const items = extensions.flatMap(ext => ext.getItems(context));
    return sortMenuItems(items);
  }

  clearAll() {
    this.extensions.clear();
    this.emit();
  }
}

export type { Unsubscribe };
