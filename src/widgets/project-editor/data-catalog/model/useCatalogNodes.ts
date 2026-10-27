import { useMemo } from 'react';

import { useAppSelector } from '@/app/providers/store';

import {
  hasNodeColumns,
  selectNodeDefinitionsMap,
} from '@/entities/node/node-definition';
import { selectGraphNodesRaw } from '@/entities/project-editor/graph';
import {
  getCategoryColor,
  getNodeCategoryColor,
} from '@/entities/project-editor/node-library';

export interface CatalogNodeItem {
  id: string;
  title: string;
  templateName: string | null;
  iconKey: string | null;
  categoryColor: string;
  searchText: string;
}

/** Ноды графа, у которых можно посмотреть колонки (как в ПКМ на холсте). */
export const useCatalogNodes = (): CatalogNodeItem[] => {
  const nodes = useAppSelector(selectGraphNodesRaw);
  const definitionsMap = useAppSelector(selectNodeDefinitionsMap);

  return useMemo(
    () =>
      nodes.flatMap(node => {
        const definition = definitionsMap[node.data.name];
        if (!hasNodeColumns(definition)) {
          return [];
        }

        const templateName = definition?.display_name || node.data.name || null;
        const title = node.data.displayName || templateName || node.id;

        return [
          {
            id: node.id,
            title,
            templateName: templateName !== title ? templateName : null,
            iconKey: definition?.icon_key ?? null,
            categoryColor: definition
              ? getNodeCategoryColor(definition)
              : getCategoryColor('Uncategorized'),
            searchText: [title, templateName, node.id]
              .filter(Boolean)
              .join(' ')
              .toLowerCase(),
          },
        ];
      }),
    [definitionsMap, nodes]
  );
};
