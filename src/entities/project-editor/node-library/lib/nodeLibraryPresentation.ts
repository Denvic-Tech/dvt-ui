import type { NodeDefinition } from '@/shared/gatewayClient';

export const PINNED_NODE_LIBRARY_SECTION_ID = '__pinned__';
export const PINNED_NODE_LIBRARY_TITLE = 'Закрепленные';

const CATEGORY_COLOR_PALETTE = [
  '#6366F1',
  '#0891B2',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#DC2626',
  '#2563EB',
  '#64748B',
  '#4F46E5',
  '#0F766E',
] as const;

export interface NodeLibrarySection {
  id: string;
  title: string;
  color: string;
  nodes: NodeDefinition[];
  count: number;
  collapsible: boolean;
  collapsed: boolean;
}

const getNodeDisplayName = (node: NodeDefinition) =>
  node.display_name || node.name;

const sortNodesByDisplayName = (nodes: NodeDefinition[]) =>
  [...nodes].sort((left, right) =>
    getNodeDisplayName(left).localeCompare(
      getNodeDisplayName(right),
      undefined,
      {
        sensitivity: 'base',
      }
    )
  );

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export const getCategoryColor = (categoryName: string) => {
  const normalizedCategoryName = categoryName.trim().toLowerCase();
  const paletteIndex =
    hashString(normalizedCategoryName) % CATEGORY_COLOR_PALETTE.length;

  return CATEGORY_COLOR_PALETTE[paletteIndex];
};

export const getNodeCategoryColor = (
  node: Pick<NodeDefinition, 'category' | 'category_color'>
) => node.category_color || getCategoryColor(node.category || 'Uncategorized');

export const isDeprecatedNode = (
  node: Pick<NodeDefinition, 'deprecated' | 'tags'>
) =>
  Boolean(node.deprecated) ||
  (node.tags ?? []).some(tag => tag.trim().toLowerCase() === 'deprecated');

export const getNodeDisplayTags = (node: Pick<NodeDefinition, 'tags'>) =>
  (node.tags ?? []).filter(tag => tag.trim().toLowerCase() !== 'deprecated');

export const buildNodeLibrarySections = ({
  nodes,
  pinnedNodeNames,
  collapsedCategories,
}: {
  nodes: NodeDefinition[];
  pinnedNodeNames: string[];
  collapsedCategories: Partial<Record<string, true>>;
}): NodeLibrarySection[] => {
  const groupedNodes = nodes.reduce<Record<string, NodeDefinition[]>>(
    (accumulator, node) => {
      const category = node.category || 'Uncategorized';

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(node);
      return accumulator;
    },
    {}
  );

  const pinnedNodeNameSet = new Set(pinnedNodeNames);
  const pinnedNodes = sortNodesByDisplayName(
    nodes.filter(node => pinnedNodeNameSet.has(node.name))
  );

  const pinnedSection =
    pinnedNodes.length > 0
      ? [
          {
            id: PINNED_NODE_LIBRARY_SECTION_ID,
            title: PINNED_NODE_LIBRARY_TITLE,
            color: getCategoryColor(PINNED_NODE_LIBRARY_TITLE),
            nodes: pinnedNodes,
            count: pinnedNodes.length,
            collapsible: false,
            collapsed: false,
          } satisfies NodeLibrarySection,
        ]
      : [];

  const categorySections = Object.keys(groupedNodes)
    .sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' })
    )
    .map(category => {
      const categoryNodes = sortNodesByDisplayName(
        groupedNodes[category] ?? []
      );

      return {
        id: category,
        title: category,
        color:
          categoryNodes.find(node => node.category_color)?.category_color ||
          getCategoryColor(category),
        nodes: categoryNodes,
        count: categoryNodes.length,
        collapsible: true,
        collapsed: Boolean(collapsedCategories[category]),
      } satisfies NodeLibrarySection;
    });

  return [...pinnedSection, ...categorySections];
};
